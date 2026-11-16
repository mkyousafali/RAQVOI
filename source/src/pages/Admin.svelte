<script lang="ts">
 import { onMount } from 'svelte';
 import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-svelte';
 import { adminApi, type AdminAccess } from '../lib/admin';
 import AdminShell from '../lib/admin/AdminShell.svelte';
 import AdminCodeInput from '../lib/admin/AdminCodeInput.svelte';
 import AdminTaskbar from '../lib/admin/AdminTaskbar.svelte';
 import { customerApi, customerSession, type CustomerSession } from '../lib/customer';

 type Stage = 'login' | 'mfa' | 'setup-password' | 'setup-totp' | 'dashboard';
 type AdminSession = { authenticated: boolean; email?: string } & Partial<AdminAccess>;
 type SetupStatus = { eligible: boolean; stage: 'password' | 'totp' | 'complete' };
 let stage = $state<Stage>('login');
 let loading = $state(true);
 let busy = $state(false);
 let error = $state('');
 let message = $state('');
 let email = $state('');
 let password = $state('');
 let confirmPassword = $state('');
 let code = $state('');
 let setupSecret = $state('');
 let alreadyEnrolled = $state(false);
 let access = $state<AdminAccess>({isOwner:false,permissions:{admins:false,customers:false}});

 async function load() {
  const admin = await adminApi<AdminSession>('session');
  if (admin.authenticated) {
   email = admin.email || '';
   access = {isOwner:!!admin.isOwner,permissions:admin.permissions || {admins:false,customers:false}};
   stage = 'dashboard';
   return;
  }
  const customer = await customerApi<CustomerSession>('session').catch(() => null);
  if (customer) customerSession.set(customer);
  email = customer?.email || '';
  if (customer?.adminState === 'pending') {
   const setup = await adminApi<SetupStatus>('setup/status');
   if (setup.eligible && setup.stage === 'password') { stage = 'setup-password'; return; }
   if (setup.eligible && setup.stage === 'totp') { stage = 'setup-totp'; return; }
  }
  stage = 'login';
 }
 onMount(() => { load().catch(e => error = e instanceof Error ? e.message : 'Admin service is unavailable.').finally(() => loading = false); });

 async function action(task: () => Promise<void>) {
  if (busy) return;
  busy = true; error = ''; message = '';
  try { await task(); }
  catch (e) { error = e instanceof Error ? e.message : 'Please try again.'; }
  finally { busy = false; }
 }
 function login(event: SubmitEvent) {
  event.preventDefault();
  void action(async () => {
   const result = await adminApi<{ stage: 'mfa' }>('login', 'POST', { email, password });
   password = '';
   if (result.stage !== 'mfa') throw new Error('Please try signing in again.');
   code = '';
   stage = 'mfa';
   message = 'Enter the code from Google Authenticator to finish signing in.';
  });
 }
 function verify(event: SubmitEvent) {
  event.preventDefault();
  if (!/^\d{6}$/.test(code)) { error = 'Enter the six-digit authenticator code.'; return; }
  void action(async () => {
   const result = await adminApi<AdminSession>('verify', 'POST', { code });
   code = '';
   if (!result.authenticated) throw new Error('Please try signing in again.');
   email = result.email || email;
   access = {isOwner:!!result.isOwner,permissions:result.permissions || {admins:false,customers:false}};
   stage = 'dashboard';
  });
 }
 function setupPassword(event: SubmitEvent) {
  event.preventDefault();
  if (password !== confirmPassword) { error = 'The passwords do not match.'; return; }
  if (password.length < 12) { error = 'Use at least 12 characters for your Admin password.'; return; }
  void action(async () => {
   await adminApi('setup/password', 'POST', { password });
   password = ''; confirmPassword = '';
   stage = 'setup-totp';
   message = 'Your Admin password is set. Connect Google Authenticator next.';
  });
 }
 function showSetupKey() {
  void action(async () => {
   const result = await adminApi<{ uri?: string; secret?: string; alreadyEnrolled?: boolean }>('setup/enroll', 'POST', {});
   if (result.alreadyEnrolled) {
    alreadyEnrolled = true;
    message = 'Google Authenticator is already connected. Enter a current code to finish setup.';
    return;
   }
   if (!result.secret || !result.uri?.startsWith('otpauth://totp/')) throw new Error('Authenticator setup is unavailable.');
   setupSecret = result.secret;
  });
 }
 function setupVerify(event: SubmitEvent) {
  event.preventDefault();
  if (!/^\d{6}$/.test(code)) { error = 'Enter the six-digit authenticator code.'; return; }
  void action(async () => {
   await adminApi('setup/verify', 'POST', { code });
   code = ''; setupSecret = ''; alreadyEnrolled = false;
   customerApi<CustomerSession>('session').then(s => customerSession.set(s)).catch(() => {});
   stage = 'login';
   message = 'Authenticator confirmed. Sign in with your Admin password to continue. If your customer session expired, sign in to your store account again.';
  });
 }
 function logout() {
  void action(async () => {
   await adminApi('logout', 'POST', {});
   code = ''; password = ''; setupSecret = ''; alreadyEnrolled = false;
   stage = 'login';
   message = 'You have signed out of Admin.';
  });
 }
</script>

<svelte:head><meta name="robots" content="noindex,nofollow" /></svelte:head>
{#if stage === 'dashboard' && !loading}
 <AdminShell {email} {busy} {error} {access} onLogout={logout}/>
{:else}
<section class="admin-page" aria-busy={loading || busy}>
 <div class="admin-intro"><span class="admin-eyebrow"><ShieldCheck size={15}/> RAQVOI ADMIN</span><h1>{stage.startsWith('setup') ? 'Set up your Admin access.' : 'A secure space for your team.'}</h1><p>{stage.startsWith('setup') ? 'Complete your invitation with a password and Google Authenticator.' : 'Sign in with your Admin password and an authenticator code.'}</p></div>
 <div class="admin-card">
  {#if error}<p class="admin-error" role="alert">{error}</p>{/if}
  {#if message}<p class="admin-message" role="status">{message}</p>{/if}
  {#if loading}<p role="status">Checking Admin access…</p>
  {:else if stage === 'login'}
   <div class="admin-card-title"><span><LockKeyhole size={20}/></span><div><h2>Admin sign in</h2><p>For invited Admins only.</p></div></div>
   <form onsubmit={login}><label>Email address<input type="email" autocomplete="username" maxlength="254" required bind:value={email} disabled={busy}/></label><label>Password<input type="password" autocomplete="current-password" required bind:value={password} disabled={busy}/></label><button class="admin-primary" disabled={busy}>{busy ? 'Checking…' : 'Continue securely'}<ArrowRight size={17}/></button></form>
  {:else if stage === 'mfa'}
   <div class="admin-card-title"><span><Smartphone size={21}/></span><div><h2>Authenticator code</h2><p>Open Google Authenticator for your RAQVOI Admin account.</p></div></div>
   <form onsubmit={verify}><AdminCodeInput bind:code disabled={busy}/><button class="admin-primary" disabled={busy}>{busy ? 'Verifying…' : 'Open Admin workspace'}<ArrowRight size={17}/></button></form>
   <button class="admin-secondary" onclick={() => { stage = 'login'; code = ''; error = ''; message = ''; }} disabled={busy}>Back to password</button>
  {:else if stage === 'setup-password'}
   <div class="admin-card-title"><span><KeyRound size={21}/></span><div><h2>Create your Admin password</h2><p>Use a unique password with at least 12 characters.</p></div></div>
   <form onsubmit={setupPassword}><label>New password<input type="password" autocomplete="new-password" minlength="12" required bind:value={password} disabled={busy}/></label><label>Confirm password<input type="password" autocomplete="new-password" minlength="12" required bind:value={confirmPassword} disabled={busy}/></label><button class="admin-primary" disabled={busy}>{busy ? 'Saving…' : 'Save password'}<ArrowRight size={17}/></button></form>
  {:else if stage === 'setup-totp'}
   <div class="admin-card-title"><span><Smartphone size={21}/></span><div><h2>Connect Google Authenticator</h2><p>In the app, tap <strong>+</strong>, choose <strong>Enter a setup key</strong>, and select a time-based key.</p></div></div>
   {#if !setupSecret && !alreadyEnrolled}<button class="admin-primary" onclick={showSetupKey} disabled={busy}>{busy ? 'Preparing…' : 'Show my setup key'}<ArrowRight size={17}/></button>{:else if setupSecret}<div class="admin-setup-key"><span>Setup key for {email}</span><code>{setupSecret}</code><small>Keep this key private. It will disappear after you confirm your code.</small></div>{/if}
   <form onsubmit={setupVerify}><AdminCodeInput bind:code disabled={busy} label="Six-digit code from the app"/><button class="admin-primary" disabled={busy}>{busy ? 'Verifying…' : 'Finish setup'}<ArrowRight size={17}/></button></form>
  {/if}
 </div>
 <a class="admin-back" href="#/account"><ArrowLeft size={15}/> Back to your account</a>
</section>
<AdminTaskbar panels={[]} activeId={null} onSelect={() => {}}/>
{/if}

<style>
 .admin-page{min-height:100dvh;padding:clamp(52px,9vh,92px) 20px 72px;background:radial-gradient(circle at 15% 10%,#30595591,transparent 33%),radial-gradient(circle at 90% 85%,#324c507a,transparent 38%),#14262b;color:#eff4f0;font-family:'DM Sans',Arial,sans-serif}
 .admin-intro{text-align:center;max-width:680px;margin:0 auto 28px}
 .admin-eyebrow{display:inline-flex;align-items:center;gap:8px;color:#c5d5bd;font-size:10px;font-weight:800;letter-spacing:.16em}
 .admin-intro h1{font:700 clamp(29px,4vw,42px)/1.12 'DM Sans',Arial,sans-serif;letter-spacing:-.045em;margin:15px 0 12px}
 .admin-intro p{color:#bfd0ca;font-size:13px;line-height:1.55;margin:0}
 .admin-card{max-width:510px;margin:auto;padding:clamp(24px,4vw,39px);border:1px solid #d9e3dc;border-radius:16px;background:#fcfdfb;box-shadow:0 25px 70px #09191b75;color:#263e39}
 .admin-card-title{display:flex;align-items:flex-start;gap:14px;margin-bottom:29px}
 .admin-card-title>span{display:grid;place-items:center;flex:none;width:44px;height:44px;border:1px solid #c9dfd2;border-radius:12px;background:#eaf3ed;color:#285d4d}
 .admin-card-title h2{font:700 22px/1.2 'DM Sans',Arial,sans-serif;letter-spacing:-.025em;margin:0 0 7px;color:#243e38}
 .admin-card-title p{margin:0;color:#6a7d73;font-size:12px;line-height:1.6}
 .admin-card form{display:grid;gap:19px}
 .admin-card label{display:grid;gap:8px;color:#344e40;font-size:12px;font-weight:700}
 .admin-card input{width:100%;height:52px;padding:13px 15px;border:1px solid #d1c8bd;border-radius:10px;background:#fff;color:#21372d;font:inherit;font-size:14px}
 .admin-card input:focus{outline:2px solid #b99764;outline-offset:2px}
 .admin-primary{display:flex;align-items:center;justify-content:center;gap:13px;min-height:51px;width:100%;padding:12px 18px;border:0;border-radius:10px;background:linear-gradient(105deg,#1e3f33,#34604a);color:white;font-size:12px;font-weight:700;letter-spacing:.03em;box-shadow:0 9px 20px #1d41322e;cursor:pointer}
 .admin-primary:hover:not(:disabled){filter:brightness(1.08)}
 .admin-card button:disabled{opacity:.55;cursor:wait}
 .admin-secondary{display:block;margin:21px auto 0;border:0;border-bottom:1px solid #b8a891;background:transparent;color:#65584a;font-size:12px;cursor:pointer}
 .admin-error,.admin-message{padding:13px 15px;margin:0 0 19px;border-radius:9px;font-size:12px;line-height:1.5}
 .admin-error{border:1px solid #d9a8a8;background:#fbeeee;color:#842f32}
 .admin-message{border:1px solid #b7d2b5;background:#eef6eb;color:#315b3a}
 .admin-setup-key{display:grid;gap:9px;margin:0 0 22px;padding:16px;border:1px solid #d5c9b4;border-radius:10px;background:#f6f0e4}
 .admin-setup-key span{font-size:11px;font-weight:700}
 .admin-setup-key code{overflow-wrap:anywhere;font-size:15px;font-weight:700;letter-spacing:.08em}
 .admin-setup-key small{color:#6c7169;font-size:11px;line-height:1.5}
 .admin-back{display:flex;align-items:center;justify-content:center;gap:7px;width:max-content;margin:25px auto 0;border-bottom:1px solid #8daaa0;color:#b9cec5;font-size:12px}
 @media(max-width:550px){.admin-page{padding:44px 15px 65px}.admin-intro h1{font-size:30px}.admin-card{border-radius:14px}}
</style>
