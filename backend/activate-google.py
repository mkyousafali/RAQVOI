"""VPS operator activation. Credentials arrive on stdin, never in arguments/logs."""
import base64,json,pathlib,re,subprocess,datetime,os,shutil,urllib.request,urllib.error,urllib.parse
os.umask(0o077)
credentials=json.loads(base64.b64decode('CREDENTIAL_PAYLOAD'))
client_id=credentials['id'];secret=credentials['secret']
if not re.fullmatch(r'[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com',client_id) or not re.fullmatch(r'[A-Za-z0-9_-]+',secret):raise SystemExit('Invalid credential format')
root=pathlib.Path('/opt/raqvoi/supabase');app=pathlib.Path('/opt/raqvoi/customer-api')
env=root/'.env';layer=root/'docker-compose.customer.yml';caddy=root/'volumes/proxy/caddy/Caddyfile';api=app/'api.env'
backup=pathlib.Path('/opt/raqvoi/private-backups/google-'+datetime.datetime.now().strftime('%Y%m%d%H%M%S'));backup.mkdir(parents=True,mode=0o700)
for name,p in [('supabase.env',env),('customer.yml',layer),('Caddyfile',caddy),('api.env',api)]:shutil.copy2(p,backup/name)
# Uploaded source files are staged separately until a protected rollback exists.
for name in ['server.mjs','Dockerfile','.dockerignore']:
 shutil.copy2(app/name,backup/name)
for name in ['server.mjs','Dockerfile','.dockerignore','google-flow.mjs']:
 shutil.copy2(app/'google-staging'/name,app/name)
def run(args):
 p=subprocess.run(args,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if p.returncode:raise RuntimeError('Operation failed: '+args[0]+'; sensitive output withheld')
 return p.stdout
oldenv=env.read_text();oldlayer=layer.read_text();oldcaddy=caddy.read_text();oldapi=api.read_text()
def setvalue(text,key,value):
 row=key+'='+value
 return re.sub(r'^'+re.escape(key)+r'=.*$',lambda m:row,text,flags=re.M) if re.search(r'^'+re.escape(key)+'=',text,re.M) else text+'\n'+row+'\n'
newenv=setvalue(setvalue(oldenv,'RAQVOI_GOOGLE_CLIENT_ID',client_id),'RAQVOI_GOOGLE_CLIENT_SECRET',secret)
authenv=dict(x.split('=',1) for x in json.loads(run(['docker','inspect','supabase-auth']))[0]['Config']['Env'] if '=' in x)
allowed=[x for x in authenv.get('GOTRUE_URI_ALLOW_LIST','').split(',') if x]
callback='http://localhost:5173/api/customer/oauth/callback'
if callback not in allowed:allowed.append(callback)
if 'GOTRUE_EXTERNAL_GOOGLE_ENABLED' in oldlayer:raise SystemExit('Google layer already configured; inspect before reactivation')
newlayer=oldlayer+'\n      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"\n      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${RAQVOI_GOOGLE_CLIENT_ID}\n      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${RAQVOI_GOOGLE_CLIENT_SECRET}\n      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: https://raqvoi.com/__auth/callback\n      GOTRUE_URI_ALLOW_LIST: '+json.dumps(','.join(allowed))+'\n'
block='raqvoi.com {\n    encode zstd gzip\n    reverse_proxy preview-gate:8080\n    header -server\n}'
replacement='''raqvoi.com {
    encode zstd gzip
    handle /__auth/callback {
        rewrite * /callback
        reverse_proxy auth:9999
    }
    handle {
        reverse_proxy preview-gate:8080
    }
    header -server
}'''
if block not in oldcaddy:raise SystemExit('Unexpected Caddy site block; no config changes applied')
try:
 env.write_text(newenv);env.chmod(0o600);layer.write_text(newlayer);api.write_text(setvalue(oldapi,'GOOGLE_OAUTH_ENABLED','true'));api.chmod(0o600)
 caddy.write_text(oldcaddy.replace(block,replacement,1))
 run(['docker','compose','config','--quiet'])
 run(['docker','exec','supabase-caddy','/bin/sh','-c','PROXY_AUTH_PASSWORD=$(caddy hash-password --plaintext "$PROXY_AUTH_PASSWORD"); export PROXY_AUTH_PASSWORD; caddy validate --config /etc/caddy/Caddyfile'])
 run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'])
 run(['docker','compose','up','-d','--no-deps','--force-recreate','--wait','auth'])
 run(['docker','exec','supabase-caddy','/bin/sh','-c','PROXY_AUTH_PASSWORD=$(caddy hash-password --plaintext "$PROXY_AUTH_PASSWORD"); export PROXY_AUTH_PASSWORD; caddy reload --config /etc/caddy/Caddyfile'])
except Exception:
 env.write_text(oldenv);layer.write_text(oldlayer);api.write_text(oldapi);caddy.write_text(oldcaddy)
 for name in ['server.mjs','Dockerfile','.dockerignore']:shutil.copy2(backup/name,app/name)
 run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'])
 run(['docker','compose','up','-d','--no-deps','--force-recreate','--wait','auth'])
 run(['docker','exec','supabase-caddy','/bin/sh','-c','PROXY_AUTH_PASSWORD=$(caddy hash-password --plaintext "$PROXY_AUTH_PASSWORD"); export PROXY_AUTH_PASSWORD; caddy reload --config /etc/caddy/Caddyfile'])
 raise SystemExit('Activation failed; prior runtime configuration restored')
print('Google provider and narrow callback activated; public frontend unchanged')
