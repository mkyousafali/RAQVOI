// One real OTP to the care mailbox. Codes/credentials are never logged or saved.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
const key=process.env.RAQVOI_SSH_KEY||path.join(process.env.USERPROFILE,'.ssh','id_ed25519_cloud');
const host=process.env.RAQVOI_SSH_HOST||'root@189.72.154.161';
function mailbox(mode,baseline=0){
 const script=`import json,subprocess,imaplib,email,re,time\nc=json.loads(subprocess.check_output(['docker','inspect','supabase-auth']))[0]\ne=dict(x.split('=',1) for x in c['Config']['Env'] if '=' in x)\nm=imaplib.IMAP4_SSL('mail.privateemail.com');m.login('care@raqvoi.com',e['GOTRUE_SMTP_PASS']);m.select('INBOX',readonly=True)\nmode=${JSON.stringify(mode)}\nif mode=='baseline':\n ids=m.uid('search',None,'ALL')[1][0].split();print(max([int(x) for x in ids],default=0))\nelse:\n token=None\n for attempt in range(12):\n  m.noop();ids=m.uid('search',None,'UID ${baseline+1}:*')[1][0].split()\n  for uid in reversed(ids):\n   if int(uid)<=${baseline}:continue\n   raw=m.uid('fetch',uid,'(BODY.PEEK[])')[1];msg=email.message_from_bytes(next(x[1] for x in raw if isinstance(x,tuple)))\n   if 'care@raqvoi.com' not in msg.get('To','').lower():continue\n   text=' '.join((p.get_payload(decode=True) or b'').decode('utf-8',errors='replace') for p in msg.walk() if p.get_content_type() in ['text/html','text/plain'])\n   found=re.search(r'>\\s*(\\d{6})\\s*<',text)\n   if found:token=found.group(1);break\n  if token:break\n  time.sleep(3)\n if not token:raise SystemExit('Test email not received')\n print(token)\nm.logout()\n`;
 return execFileSync('ssh',['-i',key,host,'python3','-'],{input:script,encoding:'utf8',timeout:55000,stdio:['pipe','pipe','pipe']}).trim();
}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext();const page=await context.newPage();
try{
 const baseline=Number(mailbox('baseline'));
 await page.goto('http://localhost:5173/#/account');
 const account=page.locator('.customer-account');
 await account.getByLabel('Email address',{exact:true}).fill('care@raqvoi.com');
 await account.getByRole('button',{name:'Email me a code',exact:true}).click();
 await account.getByLabel('Six-digit code').waitFor();
 const code=mailbox('code',baseline);if(!/^\d{6}$/.test(code))throw new Error('Test code unavailable');
 await account.getByLabel('Six-digit code').fill(code);
 await account.getByRole('button',{name:'Verify and sign in'}).click();
 await account.getByLabel('Full name').waitFor();
 const cookie=(await context.cookies()).find(c=>c.name==='raqvoi_customer_local');
 assert(cookie?.httpOnly);assert.equal(cookie.sameSite,'Strict');assert.equal(cookie.expires,-1);
 await account.getByLabel('Full name').fill('RAQVOI TEST ACCOUNT UI');
 await account.getByLabel('WhatsApp number').fill('+919999999999');
 await account.getByLabel('Date of birth').fill('2000-01-01');
 await account.getByRole('button',{name:'Save details'}).click();
 await account.getByRole('status').filter({hasText:'Your profile is saved.'}).waitFor();
 await page.reload();await account.getByLabel('Full name').waitFor();assert.equal(await account.getByLabel('Full name').inputValue(),'RAQVOI TEST ACCOUNT UI');
 const storage=await page.evaluate(()=>({...localStorage}));assert(!Object.keys(storage).some(k=>/token|supabase|session/i.test(k)));
 await page.screenshot({path:'tests/artifacts/customer-profile-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'tests/artifacts/customer-profile-mobile.png',fullPage:true});
 await account.getByRole('button',{name:'Sign out',exact:true}).click();
 await account.getByRole('button',{name:'Email me a code',exact:true}).waitFor();
 console.log('Real browser OTP/profile/edit/reload/logout passed; session-only HttpOnly cookie verified.');
}finally{await browser.close();}
