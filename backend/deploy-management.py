"""Stage migration 003 and the invitation API without publishing the frontend.

Run on the VPS from an uploaded staging folder. Secrets stay server-side.
"""
from pathlib import Path
import datetime
import os
import shutil
import subprocess
import sys

os.umask(0o077)
APP = Path('/opt/raqvoi/customer-api')
ROOT = Path('/opt/raqvoi/supabase')
STAGE = Path(__file__).resolve().parent

def run(args, *, data=None, output=None, cwd=None):
    result = subprocess.run(args, input=data, stdout=output or subprocess.PIPE,
                            stderr=subprocess.PIPE, cwd=cwd)
    if result.returncode:
        raise RuntimeError('Operation failed: '+args[0]+' (details withheld to protect credentials)')
    return result.stdout.decode().strip() if output is None else ''

def sql(statement):
    return run(['docker','exec','-i','supabase-db','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'],data=statement.encode())

def dotenv(path):
    values = {}
    for line in path.read_text().splitlines():
        if line.strip() and not line.lstrip().startswith('#') and '=' in line:
            key,value=line.split('=',1)
            values[key.strip()]=value.strip().strip('"').strip("'")
    return values

def main():
    required=['.dockerignore','Dockerfile','admin.mjs','admin-mail.mjs','package.json','package-lock.json','migrations/003_admin_management.sql']
    if any(not (STAGE/name).is_file() for name in required):
        raise RuntimeError('Staged files are incomplete')
    migrated = sql("SELECT to_regclass('public.admin_invitations') IS NOT NULL;") != 'f'
    if migrated and '--resume' not in sys.argv:
        raise RuntimeError('Migration 003 already exists; inspect before retrying')
    backup=Path('/opt/raqvoi/private-backups')/('admin-management-'+datetime.datetime.now(datetime.UTC).strftime('%Y%m%d%H%M%S'))
    backup.mkdir(parents=True,mode=0o700)
    with (backup/'database.dump').open('wb') as output:
        run(['docker','exec','supabase-db','pg_dump','-U','postgres','-d','postgres','-Fc'],output=output)
    shutil.copytree(APP,backup/'previous-api',ignore=shutil.ignore_patterns('node_modules','__pycache__','*.pyc'))
    if not migrated: sql((STAGE/'migrations/003_admin_management.sql').read_text())
    print('Protected database backup saved; Admin management migration applied')
    authenv=dotenv(ROOT/'.env')
    config=APP/'api.env'
    current=dotenv(config)
    smtp={key:authenv.get(key,'') for key in ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS']}
    smtp['SMTP_FROM']=authenv.get('SMTP_ADMIN_EMAIL','')
    if not all(smtp.values()): raise RuntimeError('Server mailbox configuration is incomplete')
    lines=[line for line in config.read_text().splitlines() if line.split('=',1)[0] not in smtp]
    for key,value in smtp.items():
        if '\n' in value or '\r' in value: raise RuntimeError('Invalid mail configuration')
        lines.append(key+'='+value)
    config.write_text('\n'.join(lines)+'\n')
    config.chmod(0o600)
    try:
        for name in required:
            target=APP/name
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(STAGE/name,target)
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
    except Exception:
        for name in required+['api.env']:
            previous=backup/'previous-api'/name
            if previous.is_file(): shutil.copy2(previous,APP/name)
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
        raise RuntimeError('Backend update failed; previous API restored, migration and backup retained')
    print('Loopback Admin management API and invitation mail configured; frontend unchanged')

if __name__=='__main__':
    try: main()
    except Exception as exc: raise SystemExit(str(exc))
