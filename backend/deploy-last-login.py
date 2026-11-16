"""Back up and add Admin login timestamps; keep frontend and private config intact."""
from pathlib import Path
import datetime
import os
import shutil
import subprocess

os.umask(0o077)
APP=Path('/opt/raqvoi/customer-api')
ROOT=Path('/opt/raqvoi/supabase')
STAGE=Path(__file__).resolve().parent

def run(args, data=None, output=None, cwd=None):
    result=subprocess.run(args,input=data,stdout=output or subprocess.PIPE,stderr=subprocess.PIPE,cwd=cwd)
    if result.returncode: raise RuntimeError('Backend update operation failed (private details withheld)')
    return result.stdout.decode().strip() if output is None else ''

def sql(statement):
    return run(['docker','exec','-i','supabase-db','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'],data=statement.encode())

def main():
    migration=STAGE/'migrations/004_admin_last_login.sql'
    if not migration.is_file() or not (STAGE/'admin.mjs').is_file(): raise RuntimeError('Staging files incomplete')
    backup=Path('/opt/raqvoi/private-backups')/('admin-login-'+datetime.datetime.now(datetime.UTC).strftime('%Y%m%d%H%M%S'))
    backup.mkdir(parents=True,mode=0o700)
    with (backup/'database.dump').open('wb') as output:
        run(['docker','exec','supabase-db','pg_dump','-U','postgres','-d','postgres','-Fc'],output=output)
    shutil.copy2(APP/'admin.mjs',backup/'admin.mjs')
    exists=sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_memberships' AND column_name='last_login_at';")
    if exists=='0': sql(migration.read_text())
    try:
        shutil.copy2(STAGE/'admin.mjs',APP/'admin.mjs')
        shutil.copy2(migration,APP/'migrations/004_admin_last_login.sql')
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
    except Exception:
        shutil.copy2(backup/'admin.mjs',APP/'admin.mjs')
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
        raise RuntimeError('Previous API restored; schema and protected backup retained')
    print('Admin login timestamp migration and API deployed; frontend unchanged')

if __name__=='__main__':
    try: main()
    except Exception as exc: raise SystemExit(str(exc))
