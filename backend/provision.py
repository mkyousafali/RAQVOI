"""Run on the VPS after uploading this directory; never emits secrets.

Initial production migration only. It refuses to run a second time. Frontend is
not deployed and API remains loopback-only. Backups are outside the web root.
"""
from pathlib import Path
import datetime, json, secrets, subprocess, os

os.umask(0o077)
root=Path('/opt/raqvoi/supabase')
app=Path('/opt/raqvoi/customer-api')
env=root/'.env'
old=env.read_text()
def run(args, **kwargs):
    result=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,**kwargs)
    if result.returncode: raise RuntimeError('Operation failed: '+args[0]+' (details withheld to protect secrets)')
    return result.stdout
def sql(text):
    return run(['docker','exec','-i','supabase-db','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],input=text.encode()).decode()
if sql("SELECT to_regclass('public.customer_profiles') IS NOT NULL;").strip()!='f':
    raise SystemExit('Profiles already exist; inspect state before continuing')
backup=Path('/opt/raqvoi/private-backups/auth-'+datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
backup.mkdir(parents=True,mode=0o700)
(backup/'supabase.env').write_text(old)
with (backup/'database.dump').open('wb') as output:
    result=subprocess.run(['docker','exec','supabase-db','pg_dump','-U','postgres','-d','postgres','-Fc'],stdout=output,stderr=subprocess.DEVNULL)
    if result.returncode:raise SystemExit('Database backup failed; migration not applied')
run(['docker','exec','-i','supabase-db','pg_restore','--list'],input=(backup/'database.dump').read_bytes())
print('Protected database backup created and archive structure validated')
password=secrets.token_hex(32)
sql("CREATE ROLE raqvoi_customer_api LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS; GRANT CONNECT ON DATABASE postgres TO raqvoi_customer_api;")
sql((app/'migrations/001_customer_profiles.sql').read_text())
(app/'api.env').write_text('DATABASE_URL=postgresql://raqvoi_customer_api:'+password+'@db:5432/postgres\nAUTH_URL=http://auth:9999\nAPP_ORIGIN=http://localhost:5173\nPORT=5180\n')
(app/'api.env').chmod(0o600)
layer=root/'docker-compose.customer.yml'
layer.write_text((app/'compose.customer.yml').read_text())
lines=old.splitlines()
found=False
for i,line in enumerate(lines):
    if line.startswith('COMPOSE_FILE='):
        value=line.split('=',1)[1].strip().strip('"').strip("'")
        lines[i]='COMPOSE_FILE='+value+':docker-compose.customer.yml';found=True
if not found:raise SystemExit('COMPOSE_FILE missing; inspect existing layers')
env.write_text('\n'.join(lines)+'\n');env.chmod(0o600)
try:
    run(['docker','compose','config','--quiet'],cwd=root)
    run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=root)
    run(['docker','compose','up','-d','--no-deps','--force-recreate','--wait','auth'],cwd=root)
except Exception:
    env.write_text(old);env.chmod(0o600)
    run(['docker','compose','up','-d','--no-deps','--force-recreate','--wait','auth'],cwd=root)
    raise SystemExit('Activation failed. Original Compose selection restored; migration and protected backup retained for review.')
print('Customer API healthy on loopback; Auth configured for email OTP; no frontend deployment')
