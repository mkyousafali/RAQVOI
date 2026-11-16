import pg from 'pg';
import { createHash, randomBytes } from 'node:crypto';
import { emailInput } from './validation.mjs';
import { sendAdminInvitation } from './admin-mail.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const random = () => randomBytes(32).toString('base64url');
const validCode = code => typeof code === 'string' && /^\d{6}$/.test(code);
const jwtClaims = token => {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); }
  catch { return {}; }
};
const strongFactor = token => {
  const claims = jwtClaims(token);
  return claims.aal === 'aal2' && Array.isArray(claims.amr) && claims.amr.some(x => x.method === 'totp');
};
const verifiedFactor = user => user.factors?.find(f => f.factor_type === 'totp' && f.status === 'verified');

export function createAdmin({ secure, customerPool, adminPool: providedAdminPool, customerSession, auth, body, json, Failure, limit, cookies }) {
  const adminPool = providedAdminPool || (process.env.ADMIN_DATABASE_URL ? new pg.Pool({connectionString:process.env.ADMIN_DATABASE_URL,max:3}) : null);
  const pendingLogins = new Map(), adminSessions = new Map(), enrollments = new Map();
  const activeCookie = secure ? '__Host-raqvoi_admin' : 'raqvoi_admin_local';
  const pendingCookie = secure ? '__Host-raqvoi_admin_step' : 'raqvoi_admin_step_local';
  const appendCookie = (res, name, value, clear = false) => {
    const c = `${name}=${value}; Path=/; HttpOnly; SameSite=Strict${secure?'; Secure':''}${clear?'; Max-Age=0':''}`;
    const old = res.getHeader('Set-Cookie');
    res.setHeader('Set-Cookie', old ? [...(Array.isArray(old)?old:[old]),c] : c);
  };
  const customerMembership = async user => {
    if (!user?.id || !user?.email || !user?.email_confirmed_at) return null;
    const client = await customerPool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[user.id]);
      await client.query('SELECT public.raqvoi_accept_admin_invitation()');
      const r = await client.query('SELECT status, email, password_set_at, is_owner, can_manage_admins, can_view_customers FROM public.admin_memberships WHERE user_id=$1',[user.id]);
      await client.query('COMMIT');
      const row=r.rows[0];
      return row && row.email === user.email.toLowerCase() ? row : null;
    } catch(e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  };
  const markPasswordSet = async user => {
    const client=await customerPool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[user.id]);
      const r=await client.query("UPDATE public.admin_memberships SET password_set_at=now(),updated_at=now() WHERE user_id=$1 AND email=$2 AND status='pending' AND password_set_at IS NULL RETURNING user_id",[user.id,user.email.toLowerCase()]);
      if(r.rowCount!==1)throw new Failure(409,'Admin setup has changed. Sign in again.');
      await client.query('COMMIT');
    } catch(e){await client.query('ROLLBACK');throw e;}
    finally{client.release();}
  };
  const activate = async user => {
    if(!adminPool)throw new Failure(503,'Admin setup is unavailable.');
    const client=await adminPool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[user.id]);
      await client.query("SELECT set_config('request.admin.verified','true',true)");
      const r=await client.query("UPDATE public.admin_memberships SET status='active',activated_at=now(),updated_at=now() WHERE user_id=$1 AND email=$2 AND status='pending' AND password_set_at IS NOT NULL RETURNING user_id",[user.id,user.email.toLowerCase()]);
      if(r.rowCount!==1)throw new Failure(409,'Admin setup has changed. Sign in again.');
      await client.query('COMMIT');
    } catch(e){await client.query('ROLLBACK');throw e;}
    finally{client.release();}
  };
  const clean = (map, name, req, res) => {
    const value=cookies(req)[name];if(value)map.delete(hash(value));
    appendCookie(res,name,'',true);
  };
  const setSession = (map,name,res,value) => {
    if(map.size>=1000)throw new Failure(503,'Please try again later.');
    const token=random();map.set(hash(token),value);appendCookie(res,name,token);
  };
  const refresh = async s => {
    if(s.expires>Date.now()+60000)return;
    s.refreshing ||= auth('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refreshToken})})
      .then(t=>{s.accessToken=t.access_token;s.refreshToken=t.refresh_token;s.expires=Date.now()+t.expires_in*1000;})
      .finally(()=>{s.refreshing=null;});
    await s.refreshing;
  };
  const fullSession = async req => {
    const key=hash(cookies(req)[activeCookie]||'');const s=adminSessions.get(key);
    if(!s || s.until<=Date.now() || s.idleUntil<=Date.now()){adminSessions.delete(key);throw new Failure(401,'Admin sign-in required.');}
    try {
      await refresh(s);
      if(!strongFactor(s.accessToken))throw new Error('MFA level missing');
      const user=await auth('/user',{headers:{Authorization:`Bearer ${s.accessToken}`}});
      if(user.id!==s.userId || user.email?.toLowerCase()!==s.email || !user.email_confirmed_at)throw new Error('Identity changed');
      if(!user.factors?.some(f=>f.id===s.factorId&&f.factor_type==='totp'&&f.status==='verified'))throw new Error('Authenticator removed');
      const member=await customerMembership(user);
      if(member?.status!=='active')throw new Error('Admin membership inactive');
      s.idleUntil=Date.now()+15*60000;
      return {s,key,user,member};
    }catch{
      adminSessions.delete(key);throw new Failure(401,'Admin sign-in required.');
    }
  };
  const setupUser = async (req,recent=false) => {
    const {s,key}=await customerSession(req);
    if(recent && (!Number.isFinite(s.authenticatedAt) || Date.now()-s.authenticatedAt>15*60000))
      throw new Failure(401,'Sign in to your customer account again before changing Admin security.');
    const member=await customerMembership(s.user);
    if(!member || !['pending','active'].includes(member.status))throw new Failure(403,'Admin setup is not available for this account.');
    return {s,key,member};
  };
  const manage = async (user, operation, target = null) => {
    if (!adminPool) throw new Failure(503,'Admin management is unavailable.');
    const client = await adminPool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[user.id]);
      await client.query("SELECT set_config('request.admin.verified','true',true)");
      const result = await client.query('SELECT public.raqvoi_manage_admins($1,$2) AS result',[operation,target]);
      await client.query('COMMIT');
      return result.rows[0].result;
    } catch (e) {
      await client.query('ROLLBACK');
      if(e.code==='23505')throw new Failure(409,'This email already has Admin access or setup pending.');
      if(e.code==='22023')throw new Failure(409,'This action is no longer available. Refresh the Admin list.');
      if(e.code==='42501')throw new Failure(403,'Admin management access denied.');
      throw e;
    } finally { client.release(); }
  };
  const access = member => ({isOwner:!!member.is_owner,permissions:{admins:!!(member.is_owner||member.can_manage_admins),customers:!!(member.is_owner||member.can_view_customers)}});
  async function handle(req,res,path,ip) {
    if(path==='/api/admin/members' && req.method==='GET') {
      const {user,member}=await fullSession(req);
      limit('admin-list:'+user.id,60,60);
      return json(res,200,{members:await manage(user,'list'),...access(member)});
    }
    if(path==='/api/admin/invitations' && req.method==='POST') {
      const {user}=await fullSession(req);
      let email;try{email=emailInput((await body(req)).email);}catch{throw new Failure(400,'Enter a valid email address.');}
      limit('admin-invite:'+user.id,10,3600);
      limit('admin-invite-email:'+hash(email),1,60);
      await manage(user,'invite',email);
      let emailSent=true;
      try { await sendAdminInvitation(email); } catch { emailSent=false; }
      return json(res,201,{invited:true,emailSent});
    }
    if(path==='/api/admin/members/action' && req.method==='POST') {
      const {user}=await fullSession(req);
      const input=await body(req);
      if(!['cancel','disable','enable','permissions'].includes(input.action)||typeof input.id!=='string'||!/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(input.id))throw new Failure(400,'Invalid Admin action.');
      if(input.action==='permissions' && (typeof input.admins!=='boolean'||typeof input.customers!=='boolean'))throw new Failure(400,'Invalid Admin permissions.');
      limit('admin-manage:'+user.id,30,600);
      const target=input.action==='permissions'?JSON.stringify({id:input.id,admins:input.admins,customers:input.customers}):input.id;
      return json(res,200,await manage(user,input.action,target));
    }
    if(path==='/api/admin/session'&&req.method==='GET'){
      try{const {user,member}=await fullSession(req);return json(res,200,{authenticated:true,email:user.email,...access(member)});}
      catch(e){if(e.status===401)return json(res,200,{authenticated:false});throw e;}
    }
    if(path==='/api/admin/setup/status'&&req.method==='GET'){
      const {member}=await setupUser(req);
      return json(res,200,{eligible:true,stage:member.status==='active'?'complete':member.password_set_at?'totp':'password'});
    }
    if(path==='/api/admin/setup/password'&&req.method==='POST'){
      const {s,member}=await setupUser(req,true);
      if(member.status!=='pending'||member.password_set_at)throw new Failure(409,'Password setup is no longer available.');
      const input=await body(req), password=input.password;
      if(typeof password!=='string'||password.length<12||password.length>128||/[\p{Cc}\p{Cf}]/u.test(password))throw new Failure(400,'Use a password of 12 to 128 characters.');
      limit('admin-setup-password:'+s.user.id,3,3600);
      await auth('/user',{method:'PUT',headers:{Authorization:`Bearer ${s.accessToken}`},body:JSON.stringify({password})});
      await markPasswordSet(s.user);
      return json(res,200,{stage:'totp'});
    }
    if(path==='/api/admin/setup/enroll'&&req.method==='POST'){
      const {s,key,member}=await setupUser(req,true);
      if(member.status!=='pending'||!member.password_set_at)throw new Failure(409,'Set your Admin password first.');
      limit('admin-enroll:'+s.user.id,5,3600);
      if(verifiedFactor(s.user))return json(res,200,{alreadyEnrolled:true});
      const factor=await auth('/factors',{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`},body:JSON.stringify({factor_type:'totp',friendly_name:'RAQVOI Admin'})});
      if(factor.type!=='totp'||!factor.id||!factor.totp?.uri||!factor.totp?.secret)throw new Failure(503,'Authenticator setup failed.');
      enrollments.set(key,{factorId:factor.id,until:Date.now()+10*60000});
      return json(res,200,{uri:factor.totp.uri,secret:factor.totp.secret});
    }
    if(path==='/api/admin/setup/verify'&&req.method==='POST'){
      const {s,key,member}=await setupUser(req,true);
      if(member.status!=='pending'||!member.password_set_at)throw new Failure(409,'Admin setup is not ready.');
      const {code}=await body(req);if(!validCode(code))throw new Failure(400,'Enter the six-digit authenticator code.');
      limit('admin-setup-verify:'+s.user.id,10,600);
      const factorId=(enrollments.get(key)?.until>Date.now()?enrollments.get(key).factorId:null)||verifiedFactor(s.user)?.id;
      if(!factorId)throw new Failure(401,'Start authenticator setup again.');
      const challenge=await auth(`/factors/${factorId}/challenge`,{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`},body:'{}'});
      const token=await auth(`/factors/${factorId}/verify`,{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`},body:JSON.stringify({challenge_id:challenge.id,code})});
      if(!strongFactor(token.access_token))throw new Failure(401,'Authenticator verification failed.');
      const user=await auth('/user',{headers:{Authorization:`Bearer ${token.access_token}`}});
      if(user.id!==s.user.id||user.email?.toLowerCase()!==s.user.email.toLowerCase())throw new Failure(401,'Account verification failed.');
      await activate(user);
      enrollments.delete(key);
      s.accessToken=token.access_token;s.refreshToken=token.refresh_token;s.expires=Date.now()+token.expires_in*1000;s.user=user;
      return json(res,200,{stage:'complete'});
    }
    if(path==='/api/admin/login'&&req.method==='POST'){
      const input=await body(req);let email;
      try{email=emailInput(input.email);}catch{throw new Failure(401,'Invalid Admin credentials.');}
      if(typeof input.password!=='string'||input.password.length<1||input.password.length>128)throw new Failure(401,'Invalid Admin credentials.');
      limit('admin-login-ip:'+ip,10,600);limit('admin-login-email:'+hash(email),5,600);
      let token,user;
      try{
        token=await auth('/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password:input.password})});
        user=await auth('/user',{headers:{Authorization:`Bearer ${token.access_token}`}});
        if(user.email?.toLowerCase()!==email||!user.email_confirmed_at||(await customerMembership(user))?.status!=='active')throw new Error('Inactive Admin');
      }catch{throw new Failure(401,'Invalid Admin credentials.');}
      const factor=verifiedFactor(user);
      if(!factor)throw new Failure(403,'Admin authenticator is not configured.');
      clean(pendingLogins,pendingCookie,req,res);clean(adminSessions,activeCookie,req,res);
      setSession(pendingLogins,pendingCookie,res,{userId:user.id,email,accessToken:token.access_token,refreshToken:token.refresh_token,expires:Date.now()+token.expires_in*1000,factorId:factor.id,attempts:0,until:Date.now()+5*60000});
      return json(res,200,{stage:'mfa'});
    }
    if(path==='/api/admin/verify'&&req.method==='POST'){
      const {code}=await body(req);if(!validCode(code))throw new Failure(400,'Enter the six-digit authenticator code.');
      const key=hash(cookies(req)[pendingCookie]||''),s=pendingLogins.get(key);
      if(!s||s.until<=Date.now()||s.attempts>=5){pendingLogins.delete(key);throw new Failure(401,'Start Admin sign-in again.');}
      limit('admin-mfa:'+ip,20,600);s.attempts++;
      try{
        await refresh(s);
        const challenge=await auth(`/factors/${s.factorId}/challenge`,{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`},body:'{}'});
        const token=await auth(`/factors/${s.factorId}/verify`,{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`},body:JSON.stringify({challenge_id:challenge.id,code})});
        if(!strongFactor(token.access_token))throw new Error('MFA level missing');
        const user=await auth('/user',{headers:{Authorization:`Bearer ${token.access_token}`}});
        if(user.id!==s.userId||user.email?.toLowerCase()!==s.email||(await customerMembership(user))?.status!=='active')throw new Error('Admin membership changed');
        await manage(user,'login');
        pendingLogins.delete(key);clean(pendingLogins,pendingCookie,req,res);
        setSession(adminSessions,activeCookie,res,{userId:user.id,email:s.email,factorId:s.factorId,accessToken:token.access_token,refreshToken:token.refresh_token,expires:Date.now()+token.expires_in*1000,until:Date.now()+2*3600000,idleUntil:Date.now()+15*60000});
        return json(res,200,{authenticated:true,email:s.email,...access(await customerMembership(user))});
      }catch{
        if(s.attempts>=5)pendingLogins.delete(key);
        throw new Failure(401,'Invalid authenticator code.');
      }
    }
    if(path==='/api/admin/logout'&&req.method==='POST'){
      const key=hash(cookies(req)[activeCookie]||''),s=adminSessions.get(key);
      clean(adminSessions,activeCookie,req,res);clean(pendingLogins,pendingCookie,req,res);
      if(s)await auth('/logout',{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`}}).catch(()=>{});
      return json(res,200,{authenticated:false});
    }
    throw new Failure(404,'Not found.');
  }
  async function onCustomerLogout(req,res) {
    const key=hash(cookies(req)[activeCookie]||''),s=adminSessions.get(key);
    clean(adminSessions,activeCookie,req,res);clean(pendingLogins,pendingCookie,req,res);
    if(s)await auth('/logout',{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`}}).catch(()=>{});
  }
  const timer=setInterval(()=>{const now=Date.now();for(const map of [pendingLogins,adminSessions,enrollments])for(const [key,value] of map)if(value.until<=now)map.delete(key);},60000);timer.unref();
  return {handle,customerMembership,onCustomerLogout};
}
