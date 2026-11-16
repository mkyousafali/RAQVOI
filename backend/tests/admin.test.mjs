import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdmin } from '../admin.mjs';

const jwt = (aal, methods) => `x.${Buffer.from(JSON.stringify({aal,amr:methods.map(method=>({method}))})).toString('base64url')}.x`;
const firstToken = jwt('aal1',['password']);
const secondToken = jwt('aal2',['password','totp']);
class Failure extends Error { constructor(status,message){super(message);this.status=status;} }
const row = (userId,email,status,passwordSet=false) => ({user_id:userId,email,status,password_set_at:passwordSet?new Date():null});

function fixture(initial) {
  const rows=new Map(initial.map(r=>[r.user_id,r]));
  const users=new Map(initial.map(r=>[r.email,{id:r.user_id,email:r.email,email_confirmed_at:'2026-01-01T00:00:00Z',factors:r.status==='active'?[{id:'factor-one',factor_type:'totp',status:'verified'}]:[]}]));
  const pool={connect:async()=>{
    const context={sub:null,verified:false};
    return {release(){},async query(sql,params=[]){
      if(sql.includes("set_config('request.jwt.claim.sub'")){context.sub=params[0];return {rows:[]};}
      if(sql.includes("set_config('request.admin.verified'")){context.verified=true;return {rows:[]};}
      if(sql.startsWith('SELECT public.raqvoi_manage_admins'))return {rows:[{result:{recorded:true}}]};
      if(sql.startsWith('SELECT status')){
        const r=rows.get(params[0]);return {rows:r&&r.user_id===context.sub?[r]:[]};
      }
      if(sql.startsWith('UPDATE public.admin_memberships')){
        const r=rows.get(params[0]);
        if(!r||r.user_id!==context.sub||r.email!==params[1]||r.status!=='pending')return {rowCount:0};
        if(sql.includes('password_set_at=now()')){
          if(r.password_set_at)return {rowCount:0};r.password_set_at=new Date();return {rowCount:1};
        }
        if(!context.verified||!r.password_set_at)return {rowCount:0};
        r.status='active';r.activated_at=new Date();return {rowCount:1};
      }
      return {rows:[]};
    }};
  }};
  let customerUser=null,loginUser=null,customerAuthenticatedAt=Date.now();
  const auth=async(path,options={})=>{
    if(path==='/token?grant_type=password'){
      const {email,password}=JSON.parse(options.body);
      if(!users.has(email)||password!=='correct-password')throw new Failure(401,'Invalid credentials');
      loginUser=users.get(email);
      return {access_token:firstToken,refresh_token:'refresh-one',expires_in:3600};
    }
    if(path==='/user'&&options.method==='PUT')return users.get(customerUser.email);
    if(path==='/user')return loginUser||customerUser;
    if(path==='/factors')return {id:'factor-one',type:'totp',totp:{uri:'otpauth://totp/RAQVOI',secret:'SETUPKEY'}};
    if(path.endsWith('/challenge'))return {id:'challenge-one'};
    if(path.endsWith('/verify')){
      if(JSON.parse(options.body).code!=='123456')throw new Failure(401,'Wrong code');
      if(customerUser)customerUser.factors=[{id:'factor-one',factor_type:'totp',status:'verified'}];
      return {access_token:secondToken,refresh_token:'refresh-two',expires_in:3600};
    }
    if(path==='/logout')return {};
    throw new Error(`Unexpected Auth route ${path}`);
  };
  const admin=createAdmin({secure:false,customerPool:pool,adminPool:pool,
    customerSession:async()=>({s:{user:customerUser,accessToken:firstToken,refreshToken:'refresh-one',expires:Date.now()+3600000,authenticatedAt:customerAuthenticatedAt},key:'customer-session'}),
    auth,body:async req=>req.input,json:(res,status,data)=>{res.status=status;res.data=data;return data;},Failure,limit:()=>{},
    cookies:req=>Object.fromEntries((req.headers?.cookie||'').split(';').filter(Boolean).map(part=>part.trim().split('=')))});
  const call=async(path,method='GET',input={},cookie='')=>{
    const req={method,input,headers:{cookie}},headers=new Map(),res={getHeader:k=>headers.get(k),setHeader:(k,v)=>headers.set(k,v)};
    try{await admin.handle(req,res,path,'127.0.0.1');return {status:res.status,data:res.data,cookies:headers.get('Set-Cookie')};}
    catch(e){return {status:e.status||500,error:e.message};}
  };
  return {admin,call,rows,users,setCustomer:user=>{customerUser=user;},setAuthenticatedAt:value=>{customerAuthenticatedAt=value;}};
}
const getCookie=(headers,name)=>[...(Array.isArray(headers)?headers:[headers])].filter(x=>x?.startsWith(name+'=')).at(-1)?.split(';')[0];

test('Admin membership alone cannot open the panel; password, TOTP and active membership are required',async()=>{
  const f=fixture([row('one','owner@example.invalid','active',true),row('two','other@example.invalid','pending')]);
  const denied=await f.call('/api/admin/login','POST',{email:'other@example.invalid',password:'correct-password'});
  assert.equal(denied.status,401);
  const login=await f.call('/api/admin/login','POST',{email:'owner@example.invalid',password:'correct-password'});
  assert.equal(login.data.stage,'mfa');
  const pending=getCookie(login.cookies,'raqvoi_admin_step_local');
  assert.equal((await f.call('/api/admin/session','GET',{},pending)).data.authenticated,false);
  assert.equal((await f.call('/api/admin/verify','POST',{code:'000000'},pending)).status,401);
  const verified=await f.call('/api/admin/verify','POST',{code:'123456'},pending);
  assert.equal(verified.status,200,verified.error);
  assert.equal(verified.data.authenticated,true);
  const active=getCookie(verified.cookies,'raqvoi_admin_local');
  assert.equal((await f.call('/api/admin/session','GET',{},active)).data.authenticated,true);
  f.users.get('owner@example.invalid').factors=[];
  assert.equal((await f.call('/api/admin/session','GET',{},active)).data.authenticated,false);
  f.users.get('owner@example.invalid').factors=[{id:'factor-one',factor_type:'totp',status:'verified'}];
  const loginAgain=await f.call('/api/admin/login','POST',{email:'owner@example.invalid',password:'correct-password'});
  const pendingAgain=getCookie(loginAgain.cookies,'raqvoi_admin_step_local');
  const verifiedAgain=await f.call('/api/admin/verify','POST',{code:'123456'},pendingAgain);
  const activeAgain=getCookie(verifiedAgain.cookies,'raqvoi_admin_local');
  f.rows.get('one').status='disabled';
  assert.equal((await f.call('/api/admin/session','GET',{},activeAgain)).data.authenticated,false);
});

test('Pending first Admin needs a verified customer session, password and factor before activation',async()=>{
  const f=fixture([row('one','owner@example.invalid','pending')]);
  f.setCustomer(f.users.get('owner@example.invalid'));
  assert.equal((await f.call('/api/admin/setup/status')).data.stage,'password');
  f.setAuthenticatedAt(Date.now()-16*60000);
  assert.equal((await f.call('/api/admin/setup/password','POST',{password:'long-enough-password'})).status,401);
  f.setAuthenticatedAt(Date.now());
  assert.equal((await f.call('/api/admin/setup/password','POST',{password:'too-short'})).status,400);
  assert.equal((await f.call('/api/admin/setup/password','POST',{password:'long-enough-password'})).data.stage,'totp');
  const enroll=await f.call('/api/admin/setup/enroll','POST');
  assert.equal(enroll.data.secret,'SETUPKEY');
  assert.equal((await f.call('/api/admin/setup/verify','POST',{code:'000000'})).status,401);
  assert.equal((await f.call('/api/admin/setup/verify','POST',{code:'123456'})).data.stage,'complete');
  assert.equal(f.rows.get('one').status,'active');
  assert.equal((await f.call('/api/admin/session')).data.authenticated,false);
});
