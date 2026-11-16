import http from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { profileInput, emailInput } from './validation.mjs';
import { GoogleFlows } from './google-flow.mjs';
import { createAdmin } from './admin.mjs';

const origin = process.env.APP_ORIGIN || 'http://localhost:5173';
const secure = new URL(origin).protocol === 'https:';
if (!secure && !['localhost','127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('HTTP is only allowed for local preview');
const authURL = process.env.AUTH_URL || 'http://auth:9999';
if (!process.env.DATABASE_URL) throw new Error('Server database configuration required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
const sessions = new Map(), challenges = new Map(), limits = new Map();
const cookie = secure ? '__Host-raqvoi_customer' : 'raqvoi_customer_local';
const challengeCookie = secure ? '__Host-raqvoi_login' : 'raqvoi_login_local';
const googleCookie = secure ? '__Host-raqvoi_google' : 'raqvoi_google_local';
const googleFlows = new GoogleFlows();
const googleEnabled = process.env.GOOGLE_OAUTH_ENABLED === 'true';
const oauthCallback = origin + '/api/customer/oauth/callback';
const random = () => randomBytes(32).toString('base64url');
const hash = value => createHash('sha256').update(value).digest('hex');
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(s=>s.trim().split('=')));
const setCookie = (res, name, value, clear = false) => {
  const next = `${name}=${value}; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}${clear ? '; Max-Age=0' : ''}`;
  const old = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', old ? [...(Array.isArray(old)?old:[old]),next] : next);
};
class Failure extends Error { constructor(status, message) { super(message); this.status = status; } }
function limit(key, max, seconds) {
  const now = Date.now(); let value = limits.get(key);
  if (!value || now >= value.until) { value = { count: 0, until: now + seconds*1000 }; limits.set(key,value); }
  if (++value.count > max) throw new Failure(429,'Too many attempts. Please try again later.');
}
function json(res, status, data) { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); }
async function body(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new Failure(415,'JSON required.');
  let text = ''; for await (const chunk of req) { text += chunk; if (text.length > 4096) throw new Failure(413,'Request too large.'); }
  try { return JSON.parse(text); } catch { throw new Failure(400,'Invalid request.'); }
}
async function auth(path, options = {}) {
  const r = await fetch(authURL+path, { ...options, signal: AbortSignal.timeout(15000), headers: {'Content-Type':'application/json', ...options.headers} });
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Failure(r.status === 429 ? 429 : r.status >= 500 ? 503 : 401,
    r.status === 429 ? 'Please wait before requesting another code.' : r.status >= 500 ? 'Email service is temporarily unavailable. Try again shortly.' : 'The code is incorrect or expired. Request a new code.');
  return data;
}
function establishSession(req,res,t){
  if(!t.user?.id||!t.user?.email||!t.access_token||!t.refresh_token||!Number.isFinite(t.expires_in))throw new Failure(503,'Sign-in could not be completed.');
  if(sessions.size>=5000)throw new Failure(503,'Please try again later.');
  sessions.delete(hash(cookies(req)[cookie]||''));
  const id=random();sessions.set(hash(id),{accessToken:t.access_token,refreshToken:t.refresh_token,user:t.user,expires:Date.now()+t.expires_in*1000,until:Date.now()+12*3600000,authenticatedAt:Date.now()});
  setCookie(res,cookie,id);
}
async function session(req) {
  const key = hash(cookies(req)[cookie] || ''); const s = sessions.get(key);
  if (!s || s.until <= Date.now()) { sessions.delete(key); throw new Failure(401,'Please sign in.'); }
  // Serialize refresh so simultaneous requests cannot reuse a rotated refresh token.
  if (s.expires < Date.now()+60000) {
    s.refreshing ||= auth('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refreshToken})})
      .then(t=>{s.accessToken=t.access_token;s.refreshToken=t.refresh_token;s.expires=Date.now()+t.expires_in*1000;})
      .finally(()=>{s.refreshing=null;});
    try { await s.refreshing; } catch { sessions.delete(key); throw new Failure(401,'Please sign in again.'); }
  }
  try { s.user = await auth('/user',{headers:{Authorization:`Bearer ${s.accessToken}`}}); }
  catch(e) { if (e.status===401) sessions.delete(key); throw e; }
  return {s,key};
}
async function profile(userId, input) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)",[userId]);
    if (input) await client.query(`INSERT INTO public.customer_profiles(user_id,name,whatsapp,date_of_birth) VALUES($1,$2,$3,$4)
      ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,whatsapp=excluded.whatsapp,date_of_birth=excluded.date_of_birth,updated_at=now()`,[userId,input.name,input.whatsapp,input.dateOfBirth]);
    const r = await client.query(`SELECT name,whatsapp,to_char(date_of_birth,'YYYY-MM-DD') AS "dateOfBirth" FROM public.customer_profiles WHERE user_id=$1`,[userId]);
    await client.query('COMMIT'); return r.rows[0] || null;
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
const admin = createAdmin({origin,secure,customerPool:pool,customerSession:session,auth,body,json,Failure,limit,cookies});
const timer = setInterval(()=>{
  const now=Date.now(); for(const map of [sessions,challenges,limits]) for(const [k,v] of map) if(v.until<=now) map.delete(k);googleFlows.prune();
},60000); timer.unref();
export const server = http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','private, no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  try {
    const path = new URL(req.url,'http://internal').pathname;
    if (path === '/health' && req.method === 'GET') { await pool.query('SELECT 1'); return json(res,200,{ok:true}); }
    if (path === '/internal/email-template' && req.method === 'GET') {
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(await readFile(new URL('./otp.html',import.meta.url),'utf8'));
    }
    if (!path.startsWith('/api/customer/') && !path.startsWith('/api/admin/')) throw new Failure(404,'Not found.');
    // Production traffic arrives only through the private gate, which overwrites
    // this header. The loopback development API does not trust forwarded headers.
    const ip = secure ? String(req.headers['x-raqvoi-client-ip'] || req.socket.remoteAddress) : req.socket.remoteAddress;
    limit('request:'+ip,300,60);
    if (req.method !== 'GET') {
      if (req.headers.origin !== origin || req.headers['sec-fetch-site'] === 'cross-site') throw new Failure(403,'Request origin rejected.');
      if (req.headers['x-raqvoi-request'] !== '1') throw new Failure(403,'Request header required.');
    }
    if(path.startsWith('/api/admin/'))return await admin.handle(req,res,path,ip);
    if(path==='/api/customer/options'&&req.method==='GET')return json(res,200,{google:googleEnabled});
    if(path==='/api/customer/oauth/google'&&req.method==='POST'){
      if(!googleEnabled)throw new Failure(503,'Google sign-in is not configured yet. Use email instead.');
      limit('google:'+ip,20,600);
      const flow=googleFlows.begin();
      const url=new URL(authURL+'/authorize');url.search=new URLSearchParams({provider:'google',redirect_to:oauthCallback,code_challenge:flow.challenge,code_challenge_method:'s256',scopes:'email profile'}).toString();
      const upstream=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
      const location=upstream.headers.get('location');
      if(![302,303].includes(upstream.status)||!location){googleFlows.take(flow.browser);throw new Failure(503,'Google sign-in is temporarily unavailable.');}
      const target=new URL(location);
      if(target.protocol!=='https:'||target.hostname!=='accounts.google.com'){googleFlows.take(flow.browser);throw new Failure(503,'Google sign-in configuration error.');}
      // Lax allows this short-lived binding cookie on the external provider return.
      res.setHeader('Set-Cookie',`${googleCookie}=${flow.browser}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure?'; Secure':''}`);
      return json(res,200,{url:target.toString()});
    }
    if(path==='/api/customer/oauth/callback'&&req.method==='GET'){
      res.setHeader('Referrer-Policy','no-referrer');
      const flow=googleFlows.take(cookies(req)[googleCookie]);
      const clear=`${googleCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`;
      res.setHeader('Set-Cookie',clear);
      const url=new URL(req.url,origin);const code=url.searchParams.get('code');
      let success=false;
      if(googleEnabled&&flow&&code&&code.length<=2048&&!url.searchParams.has('error')){
        try{
          const t=await auth('/token?grant_type=pkce',{method:'POST',body:JSON.stringify({auth_code:code,code_verifier:flow.verifier})});
          const user=await auth('/user',{headers:{Authorization:`Bearer ${t.access_token}`}});
          if(!user.email_confirmed_at||!user.identities?.some(i=>i.provider==='google'))throw new Error('Unverified Google identity');
          establishSession(req,res,{...t,user});
          const prior=res.getHeader('Set-Cookie');res.setHeader('Set-Cookie',[...(Array.isArray(prior)?prior:[prior]),clear]);success=true;
        }catch{/* Never reflect provider errors, tokens or authorization codes. */}
      }
      // Commit a same-origin page before navigating, so Strict session/preview
      // cookies work after the external provider's cross-site redirect chain.
      const destination='/#/account?google='+(success?'success':'failed');
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
      return res.end(`<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${destination}"><title>RAQVOI sign-in</title><a href="${destination}">Continue to your account</a>`);
    }
    if (path === '/api/customer/otp' && req.method === 'POST') {
      const input=await body(req); let email; try { email=emailInput(input.email); } catch(e) {throw new Failure(400,e.message);}
      limit('send-ip:'+ip,10,3600); limit('send-email:'+hash(email),1,60);limit('send-email-hour:'+hash(email),5,3600);
      // Prevent unbounded memory growth and bind verification to the requesting browser.
      if (challenges.size >= 5000) throw new Failure(503,'Please try again later.');
      const previous=cookies(req)[challengeCookie]; if(previous) challenges.delete(hash(previous));
      const id=random(); const pending={email,until:Date.now()+600000,attempts:0,busy:false};challenges.set(hash(id),pending);
      try { await auth('/otp',{method:'POST',body:JSON.stringify({email,create_user:true})}); }
      catch(e) {challenges.delete(hash(id));throw e;}
      setCookie(res,challengeCookie,id);return json(res,200,{message:'Check your email for a six-digit code.',retryAfter:60});
    }
    if (path === '/api/customer/verify' && req.method === 'POST') {
      const input=await body(req);limit('verify:'+ip,30,600);
      const ck=hash(cookies(req)[challengeCookie] || '');const challenge=challenges.get(ck);
      if (!challenge || challenge.until<=Date.now() || challenge.attempts>=5) throw new Failure(401,'Request a new code.');
      if (challenge.busy) throw new Failure(409,'Verification is already in progress.');
      challenge.attempts++; if (typeof input.code!=='string' || !/^\d{6}$/.test(input.code)) throw new Failure(400,'Enter the six-digit code.');
      challenge.busy=true;
      let t;try {t=await auth('/verify',{method:'POST',body:JSON.stringify({email:challenge.email,token:input.code,type:'email'})});}finally{challenge.busy=false;}
      challenges.delete(ck);
      establishSession(req,res,t);return json(res,200,{signedIn:true});
    }
    if (path === '/api/customer/session' && req.method === 'GET') {
      try {
        const {s}=await session(req);
        const member=await admin.customerMembership(s.user);
        return json(res,200,{email:s.user.email,profile:await profile(s.user.id),adminState:member?.status==='pending'||member?.status==='active'?member.status:null});
      }
      catch(e) { if(e.status===401)return json(res,200,{email:null,profile:null,adminState:null});throw e; }
    }
    const {s,key}=await session(req);
    if(path==='/api/customer/profile' && req.method==='PUT') {
      let input;try {input=profileInput(await body(req));}catch(e){throw new Failure(e.status||400,e.message);}
      limit('profile:'+s.user.id,20,60);return json(res,200,{profile:await profile(s.user.id,input)});
    }
    if(path==='/api/customer/logout' && req.method==='POST') {
      sessions.delete(key);setCookie(res,cookie,'',true);
      await admin.onCustomerLogout(req,res);
      await auth('/logout',{method:'POST',headers:{Authorization:`Bearer ${s.accessToken}`}}).catch(()=>{});
      return json(res,200,{signedIn:false});
    }
    throw new Failure(404,'Not found.');
  }catch(e){json(res,e.status||503,{error:e.status?e.message:'Service temporarily unavailable. Please try again.'});}
});
if (process.env.NODE_ENV !== 'test') server.listen(Number(process.env.PORT || 5180),'0.0.0.0',()=>console.log('Customer API listening'));
