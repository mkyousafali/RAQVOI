"""Operator-only smoke test on VPS. Uses care mailbox; never prints OTPs/tokens.
Leaves a clearly marked test profile for inspection; sends one login email.
"""
import urllib.request,urllib.error,http.cookiejar,json,subprocess,imaplib,email,re,time
base='http://127.0.0.1:5180/api/customer/'
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(path,method='GET',data=None,origin='http://localhost:5173',cookie=None):
 headers={'Content-Type':'application/json','Origin':origin,'X-RAQVOI-Request':'1'}
 if cookie:headers['Cookie']=cookie
 request=urllib.request.Request(base+path,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
 try:
  with client.open(request,timeout=25) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
assert call('session')[1]['email'] is None
assert call('profile','PUT',{'name':'forged'})[0]==401
assert call('otp','POST',{'email':'care@raqvoi.com'},origin='https://attacker.invalid')[0]==403
assert call('session',cookie='raqvoi_customer_local=forged')[1]['email'] is None
print('Anonymous, forged-session and cross-origin denial checks passed',flush=True)
inspect=json.loads(subprocess.check_output(['docker','inspect','supabase-auth']))[0]
env=dict(x.split('=',1) for x in inspect['Config']['Env'] if '=' in x)
mail=imaplib.IMAP4_SSL('mail.privateemail.com');mail.login('care@raqvoi.com',env['GOTRUE_SMTP_PASS']);mail.select('INBOX',readonly=True)
before=set(mail.uid('search',None,'ALL')[1][0].split())
status,result=call('otp','POST',{'email':'care@raqvoi.com'})
if status!=200:raise SystemExit('OTP send failed: '+str(status)+' '+result.get('error',''))
assert call('verify','POST',{'code':'wrong'})[0]==400
token=None
for attempt in range(12):
 mail.noop();ids=set(mail.uid('search',None,'ALL')[1][0].split())-before
 for uid in sorted(ids,reverse=True):
  raw=mail.uid('fetch',uid,'(BODY.PEEK[])')[1]
  message=email.message_from_bytes(next(x[1] for x in raw if isinstance(x,tuple)))
  if 'care@raqvoi.com' not in message.get('To','').lower():continue
  text='\n'.join((p.get_payload(decode=True) or b'').decode('utf-8',errors='replace') for p in message.walk() if p.get_content_type() in ['text/html','text/plain'])
  match=re.search(r'>\s*(\d{6})\s*<',text)
  if match:token=match.group(1);break
 if token:break
 time.sleep(3)
mail.logout()
if not token:raise SystemExit('OTP did not arrive within the smoke-test window')
verification=call('verify','POST',{'code':token})
if verification[0]!=200:raise SystemExit('OTP verification failed: '+str(verification[0])+' '+verification[1].get('error',''))
assert call('verify','POST',{'code':token})[0]==401
assert call('session')[1]['email']=='care@raqvoi.com'
invalid={'name':'Test','whatsapp':'bad','dateOfBirth':'2000-01-01'}
assert call('profile','PUT',invalid)[0]==400
valid={'name':'RAQVOI TEST ACCOUNT','whatsapp':'+919999999999','dateOfBirth':'2000-01-01'}
assert call('profile','PUT',{**valid,'user_id':'forged'})[0]==400
assert call('profile','PUT',valid)[0]==200
assert call('session')[1]['profile']==valid
valid['name']='RAQVOI TEST ACCOUNT EDITED'
assert call('profile','PUT',valid)[1]['profile']==valid
print('Real email OTP, single-use code, profile validation and edit checks passed',flush=True)
old='; '.join(c.name+'='+c.value for c in jar)
assert call('logout','POST',{})[0]==200
assert call('session')[1]['email'] is None
assert call('session',cookie=old)[1]['email'] is None
print('Logout and old-cookie replay denial passed',flush=True)
