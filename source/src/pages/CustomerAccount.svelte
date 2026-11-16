<script lang="ts">
 import { onMount } from 'svelte';
 import { customerApi, customerSession, type CustomerSession, type Profile } from '../lib/customer';
 import { navigate } from '../lib/stores/router';
 import { Mail, Phone, CalendarDays, Heart, ShoppingBag, ArrowUpRight, ShieldCheck } from 'lucide-svelte';
 let loading=$state(true),busy=$state(false),error=$state(''),message=$state('');
 let session=$state<CustomerSession>({email:null,profile:null,adminState:null});
 let email=$state(''),code=$state(''),sent=$state(false),cooldown=$state(0);
 let codeDigits=$state(['','','','','','']);
 function codeBoxes(target: EventTarget | null) { return (target as HTMLInputElement)?.closest('.otp-boxes')?.querySelectorAll<HTMLInputElement>('input'); }
 function fillCode(value:string, start:number, target:EventTarget | null) { const digits=value.replace(/\D/g,'').slice(0,6-start); for(let i=0;i<digits.length;i++)codeDigits[start+i]=digits[i]; codeBoxes(target)?.[Math.min(start+digits.length,5)]?.focus(); }
 function codeInput(event:Event,index:number){const input=event.currentTarget as HTMLInputElement;const value=input.value;input.value='';if(value)fillCode(value,index,input);else codeDigits[index]='';}
 function codeKeydown(event:KeyboardEvent,index:number){if(event.key==='Backspace'&&!codeDigits[index]&&index>0){codeDigits[index-1]='';codeBoxes(event.currentTarget)?.[index-1]?.focus();}else if(event.key==='ArrowLeft'&&index>0)codeBoxes(event.currentTarget)?.[index-1]?.focus();else if(event.key==='ArrowRight'&&index<5)codeBoxes(event.currentTarget)?.[index+1]?.focus();}
 function codePaste(event:ClipboardEvent,index:number){event.preventDefault();fillCode(event.clipboardData?.getData('text')||'',index,event.currentTarget);}
 let name=$state(''),whatsapp=$state('+91'),dateOfBirth=$state('');
 let editing=$state(false);
 let googleAvailable=$state(false);
 const nextCheckout=new URLSearchParams(location.hash.split('?')[1]||'').get('next')==='checkout';
 async function load(){session=await customerApi<CustomerSession>('session');customerSession.set(session);editing=false;if(session.profile){name=session.profile.name;whatsapp=session.profile.whatsapp;dateOfBirth=session.profile.dateOfBirth;}}
 onMount(()=>{load().catch(e=>error=e.message).finally(()=>loading=false);customerApi<{google:boolean}>('options').then(o=>googleAvailable=o.google).catch(()=>{});if(new URLSearchParams(location.hash.split('?')[1]||'').get('google')==='failed')error='Google sign-in could not be completed. Try again or use email.';const timer=setInterval(()=>{if(cooldown>0)cooldown--;},1000);return()=>clearInterval(timer);});
 async function action(task:()=>Promise<void>){if(busy)return;busy=true;error='';message='';try{await task();}catch(e){error=e instanceof Error?e.message:'Please try again.';}finally{busy=false;}}
 function send(event?:SubmitEvent){event?.preventDefault();void action(async()=>{await customerApi('otp','POST',{email});sent=true;codeDigits=['','','','','',''];cooldown=60;message='Check your inbox and spam folder for your sign-in code.';});}
 function verify(event:SubmitEvent){event.preventDefault();code=codeDigits.join('');if(!/^[0-9]{6}$/.test(code))return;void action(async()=>{await customerApi('verify','POST',{code});await load();sent=false;code='';codeDigits=['','','','','',''];message=session.profile?'You are signed in.':'Complete your profile to continue.';if(nextCheckout&&session.profile)navigate('/checkout');});}
 function save(event:SubmitEvent){event.preventDefault();void action(async()=>{const result=await customerApi<{profile:Profile}>('profile','PUT',{name,whatsapp,dateOfBirth});session={...session,profile:result.profile};customerSession.set(session);editing=false;message='Your profile is saved.';if(nextCheckout)navigate('/checkout');});}
 function cancelEdit(){if(!session.profile)return;name=session.profile.name;whatsapp=session.profile.whatsapp;dateOfBirth=session.profile.dateOfBirth;editing=false;}
 function logout(){void action(async()=>{await customerApi('logout','POST',{});session={email:null,profile:null,adminState:null};customerSession.set(session);editing=false;name='';whatsapp='+91';dateOfBirth='';email='';sent=false;message='You have signed out.';});}
 function googleLogin(){void action(async()=>{const result=await customerApi<{url:string}>('oauth/google','POST',{});const url=new URL(result.url);if(url.protocol!=='https:'||url.hostname!=='accounts.google.com')throw new Error('Invalid Google sign-in destination.');location.assign(url.href);});}
 function formatBirthDate(value:string){const [year,month,day]=value.split('-').map(Number);return new Date(Date.UTC(year,month-1,day)).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});}
</script>
<div class="page-heading compact" class:profile-heading={!!session.email}><span class="eyebrow">YOUR RAQVOI ACCOUNT</span><h1>{session.email?`Welcome back${session.profile?.name?`, ${session.profile.name.split(' ')[0]}`:''}.`:'Welcome to RAQVOI.'}</h1><p>{session.email?'Your details and favourite pieces, all in one place.':'Sign in or create an account with a code sent to your email.'}</p></div>
<section class="customer-account account-panel" class:profile-mode={!!session.email} aria-busy={busy||loading}>
 {#if error}<p class="form-error" role="alert">{error}</p>{/if}{#if message}<p class="account-message" role="status">{message}</p>{/if}
 {#if loading}<p role="status">Loading your account…</p>
 {:else if !session.email}
  {#if googleAvailable&&!sent}<button class="google-sign-in" onclick={googleLogin} disabled={busy}><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.04 46.98 31.91 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.77 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>Continue with Google</button><p class="sign-in-divider">or use your email</p>{/if}
  {#if !sent}<form onsubmit={send}><label>Email address<input type="email" autocomplete="email" required maxlength="254" bind:value={email} disabled={busy}/></label><button class="button dark full-width" disabled={busy||cooldown>0}>{busy?'Sending…':cooldown>0?`Try again in ${cooldown}s`:'Email me a code'}</button><p class="account-note">No password needed. Your browser session has a maximum of 12 hours. Browser session restore may preserve access.</p></form>
  {:else}<form onsubmit={verify}><p>Enter the code sent to <strong>{email}</strong>.</p><div class="otp-field"><span id="otp-label">Six-digit code</span><div class="otp-boxes" role="group" aria-labelledby="otp-label">{#each codeDigits as digit, i}<input aria-label={`Digit ${i+1} of 6`} inputmode="numeric" autocomplete={i===0?'one-time-code':'off'} pattern="[0-9]*" maxlength="6" value={digit} disabled={busy} oninput={(event)=>codeInput(event,i)} onkeydown={(event)=>codeKeydown(event,i)} onpaste={(event)=>codePaste(event,i)}/>{/each}</div></div><button class="button dark full-width" disabled={busy||codeDigits.some(d=>!d)}>{busy?'Checking…':'Verify and sign in'}</button></form><div class="account-controls"><button class="text-link" disabled={busy||cooldown>0} onclick={()=>send()}>{cooldown>0?`Resend in ${cooldown}s`:'Resend code'}</button><button class="text-link" disabled={busy} onclick={()=>{sent=false;error='';message='';}}>Use another email</button></div>{/if}
 {:else}
  <div class="profile-grid" class:profile-complete={!!session.profile}>
 <aside class="profile-sidebar" aria-label="Account overview">
  <div class="profile-identity"><div class="profile-avatar" aria-hidden="true">{(session.profile?.name || session.email || 'R').slice(0,1).toUpperCase()}</div><span class="profile-status"><ShieldCheck size={14}/>{session.profile?'Profile complete':'Complete your profile'}</span><h2>{session.profile?.name || 'Your RAQVOI profile'}</h2><p>{session.email}</p></div>
  <div class="profile-facts"><div><Mail size={17}/><span>Email</span><strong>{session.email}</strong></div><div class="whatsapp-fact"><Phone size={17}/><span>WhatsApp</span><strong>{session.profile?.whatsapp || 'Add your number'}</strong>{#if session.profile&&!editing}<button type="button" class="whatsapp-edit-button" onclick={()=>editing=true}>Edit</button>{/if}</div>{#if session.profile&&editing}<form class="whatsapp-edit-form" onsubmit={save}><label>WhatsApp number<input type="tel" autocomplete="tel" required pattern={'\+[1-9][0-9]{7,14}'} bind:value={whatsapp}/></label><small>Include country code.</small><div><button class="whatsapp-save" disabled={busy}>{busy?'Saving…':'Save number'}</button><button type="button" disabled={busy} onclick={cancelEdit}>Cancel</button></div></form>{/if}<div><CalendarDays size={17}/><span>Date of birth</span><strong>{session.profile?.dateOfBirth?formatBirthDate(session.profile.dateOfBirth):'Add your date of birth'}</strong></div></div>
  <nav class="profile-shortcuts" aria-label="Account shortcuts"><h3>Your RAQVOI</h3><a href="#/wishlist"><Heart size={17}/>Saved pieces <ArrowUpRight size={15}/></a><a href="#/bag"><ShoppingBag size={17}/>Shopping bag <ArrowUpRight size={15}/></a><a href="#/shop">Explore the collection <ArrowUpRight size={15}/></a>{#if session.adminState}<a class="admin-shortcut" href="#/admin"><ShieldCheck size={17}/>{session.adminState==='pending'?'Set up Admin access':'Admin panel'}<ArrowUpRight size={15}/></a>{/if}</nav>
  <button class="profile-signout" disabled={busy} onclick={logout}>Sign out</button>
 </aside>
 {#if !session.profile}<div class="profile-edit"><div class="profile-edit-heading"><span class="eyebrow">PERSONAL DETAILS</span><h2>Complete your profile</h2><p>Add all three required details before you shop.</p></div><form onsubmit={save}><label>Full name<input autocomplete="name" required minlength="2" maxlength="80" bind:value={name}/></label><label>WhatsApp number<input type="tel" autocomplete="tel" required pattern={'\+[1-9][0-9]{7,14}'} placeholder="+919876543210" bind:value={whatsapp}/><small>Include country code. Number ownership is not verified yet.</small></label><label>Date of birth<input type="date" autocomplete="bday" required bind:value={dateOfBirth}/></label><button class="button dark full-width" disabled={busy}>{busy?'Saving…':nextCheckout?'Save and continue':'Save details'}</button></form></div>{/if}
</div>
 {/if}{#if !session.email}<a class="text-link" href="#/shop">Continue browsing</a>{/if}
</section>
<style>
 .google-sign-in{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:48px;border:1px solid #747775;border-radius:4px;background:white;color:#1f1f1f;font-size:14px;font-weight:500;cursor:pointer}.sign-in-divider{text-align:center;color:#666;font-size:13px;margin:20px 0}
 .otp-field{display:grid;gap:10px;font-size:14px}.otp-boxes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.customer-account .otp-boxes input{min-width:0;width:100%;height:58px;padding:0;text-align:center;font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}.customer-account .otp-boxes input:focus{outline:2px solid var(--forest);outline-offset:2px}@media(max-width:480px){.otp-boxes{gap:6px}.customer-account .otp-boxes input{height:48px;font-size:20px}}
 .customer-account{max-width:580px;margin:0 auto 80px;padding:32px}.customer-account form{display:grid;gap:22px}.customer-account label{display:grid;gap:8px;font-size:14px}.customer-account input{width:100%;min-height:48px;border:1px solid #d6d1c8;padding:12px;background:#fff;color:#171717;border-radius:4px;font:inherit}.account-controls{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin:20px 0}.account-note,small{font-size:13px;line-height:1.6;color:#666}.account-message{padding:14px;background:#f3f1e9;line-height:1.6}.customer-account>a{display:inline-block;margin-top:24px}.customer-account h2{margin-top:24px}.customer-account button:disabled{opacity:.55;cursor:wait}@media(max-width:600px){.customer-account{margin:0 16px 48px;padding:22px}}
 .page-heading.compact{position:relative;isolation:isolate;overflow:hidden;padding:56px 20px 37px;background:linear-gradient(145deg,#fffaf5 0%,#f8efeb 54%,#f0ece4 100%)}
 .page-heading.compact::before,.page-heading.compact::after{content:'';position:absolute;z-index:-1;pointer-events:none;border-radius:50%}
 .page-heading.compact::before{width:360px;height:360px;left:max(-140px,calc(50% - 600px));top:-245px;background:radial-gradient(circle,rgba(205,151,153,.23),transparent 70%)}
 .page-heading.compact::after{width:340px;height:340px;right:max(-140px,calc(50% - 610px));bottom:-265px;border:1px solid rgba(177,139,73,.3);box-shadow:0 0 0 20px rgba(255,255,255,.16),0 0 0 21px rgba(177,139,73,.12)}
 .page-heading.compact .eyebrow{display:inline-flex;align-items:center;gap:9px;color:#8a6570;letter-spacing:.22em}
 .page-heading.compact .eyebrow::before,.page-heading.compact .eyebrow::after{content:'';width:18px;height:1px;background:#b28f60}
 .page-heading.compact h1{color:#253b31;font-size:clamp(42px,4.4vw,67px);line-height:1.02;margin:20px 0 14px}
 .page-heading.compact>p{color:#736f65;font-size:14px;line-height:1.55;max-width:550px;margin:0 auto}
 .customer-account{position:relative;isolation:isolate;max-width:610px;margin:28px auto 80px;padding:36px 40px 30px;border:1px solid rgba(157,121,86,.19);border-radius:20px;background:linear-gradient(150deg,rgba(255,255,255,.88),rgba(250,244,238,.82) 60%,rgba(240,237,227,.82));box-shadow:0 22px 65px rgba(76,61,52,.09),inset 0 1px 0 rgba(255,255,255,.92);backdrop-filter:blur(14px)}
 .customer-account::before{content:'';position:absolute;top:0;left:34px;right:34px;height:3px;border-radius:0 0 5px 5px;background:linear-gradient(90deg,#c58e99,#b99554,#557965)}
 .customer-account form{gap:19px}
 .customer-account label,.otp-field{color:#33483d;font-size:12px;font-weight:650;letter-spacing:.025em}
 .customer-account input{min-height:52px;border:1px solid #d6cfc6;border-radius:10px;background:rgba(255,255,255,.86);padding:13px 15px;color:#25372f;transition:border-color .2s,box-shadow .2s}
 .customer-account input:focus{outline:none;border-color:#9d7665;box-shadow:0 0 0 4px rgba(157,118,101,.14)}
 .customer-account .otp-boxes input{height:58px;border-radius:10px;background:rgba(255,255,255,.87);font-size:25px}
 .customer-account .otp-boxes input:focus{outline:none;border-color:#9d7665;box-shadow:0 0 0 4px rgba(157,118,101,.14)}
 .customer-account :global(.button.dark){min-height:52px;border-radius:10px;background:linear-gradient(110deg,#203e33,#365d4d);box-shadow:0 9px 19px rgba(32,62,51,.17);font-size:12px;letter-spacing:.045em;transition:transform .2s,box-shadow .2s,filter .2s}
 .customer-account :global(.button.dark):hover:not(:disabled){transform:translateY(-2px);box-shadow:0 13px 24px rgba(32,62,51,.22);filter:brightness(1.04)}
 .google-sign-in{min-height:52px;border:1px solid #d6c9bd;border-radius:10px;background:rgba(255,255,255,.84);box-shadow:0 4px 13px rgba(76,61,52,.05);color:#253b31;transition:border-color .2s,background .2s,transform .2s}
 .google-sign-in:hover:not(:disabled){border-color:#b9957e;background:white;transform:translateY(-2px)}
 .sign-in-divider{display:flex;align-items:center;gap:14px;color:#877c71;font-size:11px;letter-spacing:.06em}
 .sign-in-divider::before,.sign-in-divider::after{content:'';height:1px;flex:1;background:linear-gradient(90deg,transparent,#d5c6b7,transparent)}
 .customer-account .account-message{border:1px solid rgba(73,111,80,.18);border-radius:10px;background:rgba(228,238,224,.72);padding:14px 16px;color:#3d6248;font-size:12px}
 .customer-account :global(.form-error){border-radius:10px}
 .account-controls{margin:21px 0;gap:12px}
 .customer-account :global(.text-link){border-color:#b99a7c;color:#615344;text-underline-offset:3px}
 .customer-account h2{color:#294436;font-size:36px}
 .customer-account .account-note,.customer-account small{color:#817e73;font-size:11px;line-height:1.65}
 .customer-account>a{margin-top:26px}
 @media(max-width:600px){.page-heading.compact{padding:37px 18px 26px}.page-heading.compact h1{font-size:clamp(39px,10vw,54px)}.page-heading.compact>p{font-size:12px}.customer-account{margin:16px 16px 48px;padding:25px 21px 24px;border-radius:16px}.customer-account::before{left:22px;right:22px}.otp-boxes{gap:6px}.customer-account .otp-boxes input{height:50px;font-size:21px}}
 @media(prefers-reduced-motion:reduce){.google-sign-in,.customer-account input,.customer-account :global(.button.dark){transition:none}}
 .page-heading.compact.profile-heading{padding-top:20px;padding-bottom:18px}
 .page-heading.compact.profile-heading h1{font-size:clamp(36px,3.5vw,50px);margin:8px 0 6px}
 .customer-account.profile-mode{max-width:1180px;margin:16px auto 80px;padding:0;border:0;background:transparent;box-shadow:none;backdrop-filter:none}
 .customer-account.profile-mode::before{display:none}
 .profile-grid{display:grid;grid-template-columns:minmax(290px,.8fr) minmax(0,1.2fr);gap:22px;align-items:start}
 .profile-grid.profile-complete{grid-template-columns:minmax(0,720px);justify-content:center}
 .profile-sidebar,.profile-edit{min-width:0;border-radius:20px;overflow:hidden}
 .profile-sidebar{padding:28px;background:radial-gradient(circle at 100% 0%,#a9757430,transparent 40%),linear-gradient(145deg,#244638,#17382f 70%,#203b34);color:#fbf6ef;box-shadow:0 20px 50px #213b3126}
 .profile-identity{text-align:center;padding:8px 8px 24px;border-bottom:1px solid #fff3df30}
 .profile-avatar{display:grid;place-items:center;width:70px;height:70px;margin:0 auto 17px;border:1px solid #ecd9b777;border-radius:50%;background:linear-gradient(145deg,#f5e5dc,#d4bb9b);box-shadow:0 0 0 7px #ffffff12;color:#315144;font:600 40px var(--serif)}
 .profile-status{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #e5d2b052;border-radius:999px;background:#fff8e915;color:#f5dfbc;font-size:10px;font-weight:700;letter-spacing:.04em}
 .profile-identity h2{margin:16px 0 6px;color:#fff9ee;font-size:32px;line-height:1.05;overflow-wrap:anywhere}
 .profile-identity p{margin:0;color:#d8e3d9;font-size:12px;overflow-wrap:anywhere}
 .profile-facts{display:grid;gap:8px;padding:21px 0}
 .profile-facts>div{display:grid;grid-template-columns:20px 1fr;column-gap:10px;align-items:center;padding:10px 12px;border:1px solid #ffffff1c;border-radius:11px;background:#ffffff0d}
 .profile-facts :global(svg){grid-row:1 / span 2;color:#dfc89f}
 .profile-facts span{color:#c8d5ca;font-size:10px;letter-spacing:.05em;text-transform:uppercase}
 .profile-facts strong{font-size:12px;font-weight:600;overflow-wrap:anywhere}
 .profile-facts .whatsapp-fact{grid-template-columns:20px minmax(0,1fr) auto}
 .whatsapp-edit-button{grid-column:3;grid-row:1 / span 2;min-height:30px;padding:5px 12px;border:1px solid #f1d8aa80;border-radius:999px;background:#fff6df1c;color:#f6ddb2;font-size:10px;font-weight:700}
 .whatsapp-edit-button:hover:not(:disabled){background:#fff6df35}
 .whatsapp-edit-form{display:grid;gap:8px;padding:14px;border:1px solid #ffffff2d;border-radius:11px;background:#ffffff14}
 .whatsapp-edit-form label{color:#fff2e0;font-size:11px}
 .whatsapp-edit-form input{min-height:44px}
 .whatsapp-edit-form small{color:#d9e5d9}
 .whatsapp-edit-form>div{display:flex;gap:9px;margin-top:3px}
 .whatsapp-edit-form button{min-height:38px;padding:8px 14px;border:1px solid #e4d4b680;border-radius:8px;background:#ffffff1a;color:#fff7e9;font-size:11px;font-weight:700}
 .whatsapp-edit-form button.whatsapp-save{background:#eadfc5;color:#234236}
 .whatsapp-edit-form button:hover:not(:disabled){filter:brightness(1.08)}
 .profile-shortcuts{padding:4px 0 15px}
 .profile-shortcuts h3{margin:0 0 10px;color:#dfc89f;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
 .profile-shortcuts a{display:flex;align-items:center;gap:10px;padding:11px 1px;border-bottom:1px solid #ffffff24;font-size:12px;transition:color .2s,padding-left .2s}
 .profile-shortcuts a:hover{color:#f4d8c3;padding-left:5px}
 .profile-shortcuts .admin-shortcut{margin-top:8px;padding:12px 10px;border:1px solid #d4b77b80;border-radius:9px;background:#f3e4bc18;color:#f9e7c5;font-weight:700}
 .profile-shortcuts .admin-shortcut:hover{background:#f3e4bc2b}
 .profile-shortcuts a :global(svg:last-child){margin-left:auto}
 .profile-signout{width:100%;min-height:40px;margin-top:9px;border:1px solid #fff7e957;border-radius:9px;background:#ffffff12;color:#fff7e9;font-size:11px;font-weight:700}
 .profile-signout:hover:not(:disabled){background:#ffffff24}
 .profile-edit{padding:clamp(24px,3.2vw,44px);border:1px solid #d9c8b95c;background:linear-gradient(150deg,#ffffffeb,#fbf6f0e6 70%,#efece3dd);box-shadow:0 18px 42px #4c3d3412}
 .profile-edit-heading{margin-bottom:27px;padding-bottom:21px;border-bottom:1px solid #d8d3c8}
 .profile-edit-heading .eyebrow{color:#92606e;font-size:10px;font-weight:700;letter-spacing:.18em}
 .profile-edit-heading h2{margin:10px 0 8px;font-size:clamp(34px,3vw,45px);line-height:1}
 .profile-edit-heading p{margin:0;color:#71776d;font-size:12px;line-height:1.6}
 .profile-sidebar :is(a,button):focus-visible{outline:2px solid #e9c087;outline-offset:3px}
 @media(max-width:900px){.customer-account.profile-mode{margin:16px 20px 60px}.profile-grid,.profile-grid.profile-complete{grid-template-columns:minmax(0,1fr)}.profile-sidebar{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:20px}.profile-identity{grid-row:1 / span 2;border-bottom:0;border-right:1px solid #fff3df30}.profile-shortcuts{grid-column:2}.profile-signout{grid-column:1 / -1}}
 @media(max-width:600px){.page-heading.compact.profile-heading{padding:18px 18px 16px}.page-heading.compact.profile-heading h1{font-size:clamp(34px,9vw,44px)}.customer-account.profile-mode{margin:12px 15px 48px;padding:0}.profile-grid{gap:14px}.profile-sidebar{display:block;padding:23px}.profile-identity{border-right:0;border-bottom:1px solid #fff3df30}.profile-facts{padding:17px 0}.profile-edit{padding:25px 21px;border-radius:16px}.profile-edit-heading{margin-bottom:21px}.profile-edit-heading h2{font-size:36px}}
</style>
