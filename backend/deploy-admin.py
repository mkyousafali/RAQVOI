"""Apply the first-Admin schema on the RAQVOI VPS, then rebuild only customer-api.

Run from /opt/raqvoi/customer-api after staging the reviewed files in
/opt/raqvoi/admin-staging. No credentials or Auth user details are printed.
The script stops if the owner is not an existing confirmed account without a
password, or if the database backup cannot be restored into a temporary DB.
"""
from pathlib import Path
import datetime
import os
import re
import secrets
import shutil
import subprocess
import sys

os.umask(0o077)
ROOT = Path('/opt/raqvoi/supabase')
APP = Path('/opt/raqvoi/customer-api')
STAGE = Path('/opt/raqvoi/admin-staging')
BACKUPS = Path('/opt/raqvoi/private-backups')

def run(args, *, input_file=None, output_file=None, cwd=None):
    with (input_file.open('rb') if input_file else open(os.devnull, 'rb')) as stdin:
        result = subprocess.run(args, stdin=stdin, stdout=output_file or subprocess.PIPE,
                                stderr=subprocess.PIPE, cwd=cwd)
    if result.returncode:
        raise RuntimeError('Operation failed: ' + args[0] + ' (details withheld to protect secrets)')
    return result.stdout.decode() if output_file is None else ''

def sql(statement, variables=(), database='postgres', safe_error=False, user='postgres'):
    args = ['docker', 'exec', '-i', 'supabase-db', 'psql', '-U', user, '-d', database,
            '-v', 'ON_ERROR_STOP=1', '-At']
    for name, value in variables:
        args += ['-v', f'{name}={value}']
    result = subprocess.run(args, input=statement.encode(), stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    if result.returncode:
        if safe_error:
            line = next((line for line in result.stderr.decode(errors='replace').splitlines() if 'ERROR:' in line), '')
            detail = line.split('ERROR:',1)[-1] if line else 'database assertion failed'
            detail = re.sub(r"'[^']*'", "'<redacted>'", detail)
            detail = re.sub(r'[A-Za-z0-9+/=]{24,}', '<redacted>', detail)
            raise RuntimeError('Database check failed: ' + detail[:160])
        raise RuntimeError('Database operation failed (details withheld to protect secrets)')
    return result.stdout.decode().strip()

def backup_and_restore_check():
    BACKUPS.mkdir(parents=True, exist_ok=True, mode=0o700)
    backup_dir = BACKUPS / ('admin-' + datetime.datetime.now(datetime.UTC).strftime('%Y%m%d%H%M%S'))
    backup_dir.mkdir(mode=0o700)
    archive = backup_dir / 'database.dump'
    with archive.open('wb') as output:
        run(['docker','exec','supabase-db','pg_dump','-U','postgres','-d','postgres','-Fc'],output_file=output)
    run(['docker','exec','-i','supabase-db','pg_restore','--list'],input_file=archive)
    temporary = 'raqvoi_admin_restore_' + secrets.token_hex(5)
    run(['docker','exec','supabase-db','createdb','-U','postgres','--template=template0',temporary])
    try:
        run(['docker','exec','supabase-db','psql','-U','postgres','-d',temporary,'-c','CREATE SCHEMA auth'])
        run(['docker','exec','-i','supabase-db','pg_restore','--schema=auth','--schema=public',
             '--no-owner','--no-acl','--exit-on-error','-U','postgres','-d',temporary],input_file=archive)
        live = sql('SELECT count(*) FROM auth.users;')
        restored = run(['docker','exec','supabase-db','psql','-U','postgres','-d',temporary,'-Atc','SELECT count(*) FROM auth.users;']).strip()
        if live != restored:
            raise RuntimeError('Restore verification failed')
    except Exception:
        run(['docker','exec','supabase-db','dropdb','-U','postgres',temporary])
        raise
    return backup_dir, temporary

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: deploy-admin.py OWNER_EMAIL')
    owner = sys.argv[1].strip().lower()
    if not re.fullmatch(r'[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}', owner):
        raise SystemExit('Invalid owner email')
    if not APP.is_dir() or not STAGE.is_dir() or not ROOT.is_dir():
        raise SystemExit('Expected RAQVOI directories are missing')
    if sql("SELECT to_regclass('public.admin_memberships') IS NOT NULL;") != 'f':
        raise SystemExit('Admin membership schema already exists; inspect before continuing')
    if sql("SELECT count(*) FROM pg_roles WHERE rolname='raqvoi_admin_api';") != '0':
        raise SystemExit('Admin database role already exists; inspect before continuing')
    candidate = sql("SELECT count(*)::text || '|' || bool_and(email_confirmed_at IS NOT NULL)::text || '|' || bool_and(coalesce(encrypted_password,'')='')::text FROM auth.users WHERE lower(email)=:'owner_email';", [('owner_email',owner)])
    if candidate != '1|true|true':
        raise SystemExit('Owner account must be unique, email-confirmed and have no existing password')
    required = ['.dockerignore','admin.mjs','server.mjs','validation.mjs','google-flow.mjs','otp.html',
                'Dockerfile','package.json','package-lock.json','migrations/002_admin_memberships.sql',
                'tests/admin-rls.sql']
    if any(not (STAGE / name).is_file() for name in required):
        raise SystemExit('Staged backend files are incomplete')
    backup_dir, temporary = backup_and_restore_check()
    print('Database backup restored successfully to a temporary database')
    previous = backup_dir / 'previous-api'
    shutil.copytree(APP, previous, ignore=shutil.ignore_patterns('node_modules','*.pyc','__pycache__'))
    admin_password = secrets.token_hex(32)
    sql("CREATE ROLE raqvoi_admin_api LOGIN PASSWORD '" + admin_password + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS; GRANT CONNECT ON DATABASE postgres TO raqvoi_admin_api;")
    staging_step = 'migration'
    try:
        sql((STAGE / 'migrations/002_admin_memberships.sql').read_text(),database=temporary,safe_error=True)
        staging_step = 'RLS denial checks'
        sql((STAGE / 'tests/admin-rls.sql').read_text(),database=temporary,safe_error=True,user='supabase_admin')
    except Exception as exc:
        run(['docker','exec','supabase-db','dropdb','-U','postgres',temporary])
        sql('REVOKE CONNECT ON DATABASE postgres FROM raqvoi_admin_api; DROP ROLE raqvoi_admin_api;')
        raise RuntimeError('Staging ' + staging_step + ' failed; production schema was not changed. ' + str(exc))
    run(['docker','exec','supabase-db','dropdb','-U','postgres',temporary])
    print('Admin migration and RLS denial checks passed in the restored database')
    sql((STAGE / 'migrations/002_admin_memberships.sql').read_text())
    inserted = sql("INSERT INTO public.admin_memberships(user_id,email) SELECT id,lower(email) FROM auth.users WHERE lower(email)=:'owner_email' AND email_confirmed_at IS NOT NULL AND coalesce(encrypted_password,'')='' RETURNING 1;", [('owner_email',owner)])
    if not inserted.splitlines() or inserted.splitlines()[0] != '1':
        raise RuntimeError('First Admin bootstrap did not complete; inspect the schema')
    config = APP / 'api.env'
    old = config.read_text()
    if 'ADMIN_DATABASE_URL=' in old:
        raise SystemExit('Admin database connection is already configured; inspect before continuing')
    next_config = old.rstrip('\n') + '\nADMIN_DATABASE_URL=postgresql://raqvoi_admin_api:' + admin_password + '@db:5432/postgres\n'
    temp = APP / 'api.env.admin-next'
    temp.write_text(next_config)
    temp.chmod(0o600)
    os.replace(temp,config)
    try:
        for name in required:
            target=APP/name
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(STAGE/name,target)
        run(['docker','compose','config','--quiet'],cwd=ROOT)
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
    except Exception:
        for name in required:
            old_file=previous/name
            if old_file.is_file(): shutil.copy2(old_file,APP/name)
        config.write_text(old)
        config.chmod(0o600)
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'],cwd=ROOT)
        raise RuntimeError('API activation failed; previous API restored. Schema and protected backup remain for review')
    print('Admin schema, first pending membership and loopback customer-api deployed; frontend unchanged')

if __name__ == '__main__':
    try: main()
    except Exception as exc:
        raise SystemExit(str(exc))
