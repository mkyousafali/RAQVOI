"""Assign the verified original Owner and activate scoped Admin permissions."""
from pathlib import Path
import datetime
import os
import re
import shutil
import subprocess
import sys

os.umask(0o077)
APP=Path('/opt/raqvoi/customer-api')
ROOT=Path('/opt/raqvoi/supabase')
STAGE=Path(__file__).resolve().parent

def run(args, data=None, output=None, cwd=None):
    result=subprocess.run(args,input=data,stdout=output or subprocess.PIPE,stderr=subprocess.PIPE,cwd=cwd)
    if result.returncode: raise RuntimeError('Owner update operation failed (private details withheld)')
    return result.stdout.decode().strip() if output is None else ''

def sql(statement, email=None):
    args=['docker','exec','-i','supabase-db','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1']
    if email: args+=['-v','owner_email='+email]
    return run(args,data=statement.encode())

def main():
    if len(sys.argv)!=2: raise RuntimeError('Specify the verified original Owner email')
    migration=STAGE/'migrations/005_admin_owner_permissions.sql'
    owner=sql("SELECT m.user_id FROM public.admin_memberships m JOIN auth.users u ON u.id=m.user_id WHERE m.email=lower(:'owner_email') AND lower(u.email)=m.email AND u.email_confirmed_at IS NOT NULL AND m.status='active' AND m.user_id=(SELECT user_id FROM public.admin_memberships ORDER BY created_at LIMIT 1);",sys.argv[1])
    if not re.fullmatch(r'[0-9a-f-]{36}',owner): raise RuntimeError('Original active verified Owner was not found')
    if sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_memberships' AND column_name='is_owner';")!='0':
        raise RuntimeError('Owner migration already exists; inspect before retrying')
    backup=Path('/opt/raqvoi/private-backups')/('admin-owner-'+datetime.datetime.now(datetime.UTC).strftime('%Y%m%d%H%M%S'))
    backup.mkdir(parents=True,mode=0o700)
    with (backup/'database.dump').open('wb') as output:
        run(['docker','exec','supabase-db','pg_dump','-U','postgres','-d','postgres','-Fc'],output=output)
    shutil.copy2(APP/'admin.mjs',backup/'admin.mjs')
    sql("SELECT set_config('request.bootstrap.owner','"+owner+"',false);\n"+migration.read_text())
    try:
        shutil.copy2(STAGE/'admin.mjs',APP/'admin.mjs')
        shutil.copy2(migration,APP/'migrations/005_admin_owner_permissions.sql')
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
    except Exception:
        shutil.copy2(backup/'admin.mjs',APP/'admin.mjs')
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
        raise RuntimeError('Previous API restored; restrictive Owner schema and protected backup retained')
    print('Owner role and scoped Admin permissions deployed; public frontend unchanged')

if __name__=='__main__':
    try: main()
    except Exception as exc: raise SystemExit(str(exc))
