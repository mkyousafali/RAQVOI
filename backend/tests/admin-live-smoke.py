"""Read-only/denial smoke checks for the loopback Admin API on the VPS.

No email is sent, no password or code is used, and no credentials are printed.
"""
from pathlib import Path
import json
import subprocess
import urllib.error
import urllib.request

base='http://127.0.0.1:5180'
def call(path,method='GET',data=None,origin='http://localhost:5173',header=True,cookie=None):
    headers={'Content-Type':'application/json','Origin':origin}
    if header:headers['X-RAQVOI-Request']='1'
    if cookie:headers['Cookie']=cookie
    request=urllib.request.Request(base+path,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
    try:
        with urllib.request.urlopen(request,timeout=20) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as error:return error.code,json.load(error)

assert call('/health')[0]==200
customer=call('/api/customer/session')
assert customer[0]==200 and customer[1]['email'] is None and customer[1]['adminState'] is None
assert call('/api/admin/session')==(200,{'authenticated':False})
assert call('/api/admin/setup/status')[0]==401
assert call('/api/admin/verify','POST',{'code':'000000'})[0]==401
assert call('/api/admin/login','POST',{'email':'absent@example.invalid','password':'incorrect'})[0]==401
assert call('/api/admin/login','POST',{'email':'absent@example.invalid','password':'incorrect'},origin='https://attacker.invalid')[0]==403
assert call('/api/admin/logout','POST',{},header=False)[0]==403
assert call('/api/admin/session',cookie='raqvoi_admin_local=forged')==(200,{'authenticated':False})
print('Anonymous, forged-session, cross-origin and missing-header Admin denials passed',flush=True)

script=Path('/opt/raqvoi/customer-api/tests/admin-rls.sql')
with script.open('rb') as source:
    result=subprocess.run(['docker','exec','-i','supabase-db','psql','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1'],stdin=source,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
assert result.returncode==0,'Live RLS denial test failed; output withheld'
print('Live RLS ownership and privilege-denial checks passed',flush=True)

query="SELECT count(*) FROM public.admin_memberships;"
result=subprocess.run(['docker','exec','-i','supabase-db','psql','-U','postgres','-d','postgres','-At'],input=query.encode(),stdout=subprocess.PIPE,stderr=subprocess.PIPE)
assert result.returncode==0,'Membership inspection failed; output withheld'
assert int(result.stdout.decode().strip())>=1,'No Admin membership was found'
print('Admin membership table has at least one server-provisioned account',flush=True)
