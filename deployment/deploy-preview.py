"""Publish a reviewed preview release. Private gate hash arrives only on stdin."""
from pathlib import Path
import datetime
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tarfile

os.umask(0o077)
ROOT=Path('/opt/raqvoi/supabase')
APP=Path('/opt/raqvoi/customer-api')
GATE=Path('/opt/raqvoi/access-gate')
LIVE=Path('/opt/raqvoi/frontend')
STAGE=Path('/opt/raqvoi/preview-staging')

def run(args, *, output=None, cwd=ROOT):
    result=subprocess.run(args,stdout=output or subprocess.PIPE,stderr=subprocess.PIPE,cwd=cwd)
    if result.returncode: raise RuntimeError('Release operation failed: '+args[0]+' (private output withheld)')
    return result.stdout.decode() if output is None else ''

def setenv(text,key,value):
    row=key+'='+value
    return re.sub(r'^'+re.escape(key)+r'=.*$',lambda match:row,text,flags=re.M) if re.search(r'^'+re.escape(key)+r'=',text,re.M) else text.rstrip()+'\n'+row+'\n'

def main():
    payload=json.load(sys.stdin)
    commit=payload['commit']; code_hash=payload['codeHash']
    if not re.fullmatch(r'[a-f0-9]{40}',commit) or not re.fullmatch(r'[a-f0-9]{64}',code_hash): raise RuntimeError('Invalid release metadata')
    release=Path('/opt/raqvoi/releases')/commit
    if release.exists(): raise RuntimeError('Release already exists')
    previous=release/'previous'
    previous.mkdir(parents=True,mode=0o700)
    shutil.copytree(LIVE,previous/'frontend')
    shutil.copytree(GATE,previous/'access-gate')
    shutil.copytree(APP,previous/'customer-api',ignore=shutil.ignore_patterns('node_modules','__pycache__','*.pyc'))
    (previous/'compose').mkdir()
    for name in ['.env','docker-compose.raqvoi.yml','docker-compose.customer.yml','docker-compose.caddy.yml']:
        shutil.copy2(ROOT/name,previous/'compose'/name)
    shutil.copy2(ROOT/'volumes/proxy/caddy/Caddyfile',previous/'Caddyfile')
    print('Captured the current frontend, gate, API and runtime configuration for rollback',flush=True)
    private_backup=Path('/opt/raqvoi/private-backups')/('preview-'+datetime.datetime.now(datetime.UTC).strftime('%Y%m%d%H%M%S'))
    private_backup.mkdir(mode=0o700)
    with (private_backup/'database.dump').open('wb') as output:
        run(['docker','exec','supabase-db','pg_dump','-U','postgres','-d','postgres','-Fc'],output=output)
    next_front=release/'next-frontend'
    next_front.mkdir()
    with tarfile.open(STAGE/'frontend.tar.gz') as archive:
        archive.extractall(next_front,filter='data')
    if not (next_front/'index.html').is_file(): raise RuntimeError('Build is incomplete')
    for path in next_front.rglob('*'): path.chmod(0o755 if path.is_dir() else 0o644)
    next_front.chmod(0o755)
    try:
        for name in ['server.mjs','coming-soon.mjs']: shutil.copy2(STAGE/'gate'/name,GATE/name)
        gate_env=(GATE/'gate.env').read_text()
        gate_env=setenv(gate_env,'ACCESS_CODE_SHA256',code_hash)
        gate_env=setenv(gate_env,'SESSION_SECRET',secrets.token_urlsafe(48))
        (GATE/'gate.env').write_text(gate_env); (GATE/'gate.env').chmod(0o600)
        for name in ['server.mjs','admin.mjs','admin-mail.mjs','validation.mjs','google-flow.mjs','otp.html','package.json','package-lock.json','Dockerfile','.dockerignore']:
            shutil.copy2(STAGE/'api'/name,APP/name)
        api_env=setenv((APP/'api.env').read_text(),'APP_ORIGIN','https://raqvoi.com')
        (APP/'api.env').write_text(api_env); (APP/'api.env').chmod(0o600)
        layer=ROOT/'docker-compose.customer.yml'
        text=layer.read_text()
        text=re.sub(r'^      GOTRUE_URI_ALLOW_LIST:.*$', '      GOTRUE_URI_ALLOW_LIST: "https://raqvoi.com/api/customer/oauth/callback"', text, flags=re.M)
        if 'GOTRUE_SITE_URL:' not in text: text+='\n      GOTRUE_SITE_URL: "https://raqvoi.com"\n'
        else: text=re.sub(r'^      GOTRUE_SITE_URL:.*$', '      GOTRUE_SITE_URL: "https://raqvoi.com"', text, flags=re.M)
        layer.write_text(text)
        run(['docker','compose','config','--quiet'])
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'])
        run(['docker','compose','up','-d','--force-recreate','--no-deps','--wait','auth'])
        # Gate's frontend mount needs a recreate after the directory switch.
        LIVE.rename(release/'retired-frontend')
        next_front.rename(LIVE)
        run(['docker','compose','up','-d','--force-recreate','--no-deps','--wait','preview-gate'])
    except Exception:
        if (release/'retired-frontend').exists():
            if LIVE.exists(): LIVE.rename(release/'failed-frontend')
            (release/'retired-frontend').rename(LIVE)
        for name in ['server.mjs','coming-soon.mjs','gate.env']: shutil.copy2(previous/'access-gate'/name,GATE/name)
        for name in ['server.mjs','admin.mjs','admin-mail.mjs','validation.mjs','google-flow.mjs','otp.html','package.json','package-lock.json','Dockerfile','.dockerignore','api.env']:
            shutil.copy2(previous/'customer-api'/name,APP/name)
        for name in ['.env','docker-compose.raqvoi.yml','docker-compose.customer.yml','docker-compose.caddy.yml']:
            shutil.copy2(previous/'compose'/name,ROOT/name)
        run(['docker','compose','up','-d','--build','--no-deps','--wait','customer-api'])
        run(['docker','compose','up','-d','--force-recreate','--no-deps','--wait','auth','preview-gate'])
        raise RuntimeError('Release failed; previous frontend, gate and API runtime restored')
    # A complete previous copy already exists; this is a duplicate moved mount.
    retired=release/'retired-frontend'
    if retired.exists() and retired.resolve().parent==release.resolve(): shutil.rmtree(retired)
    record={'commit':commit,'deployedAt':datetime.datetime.now(datetime.UTC).isoformat(),'rollback':str(previous),'status':'awaiting-public-verification','scope':'Gated frontend and live HTTPS customer/Admin API; existing data preserved'}
    (release/'release.json').write_text(json.dumps(record,indent=2)+'\n')
    print('Gated release activated; existing preview sessions invalidated; public verification still required',flush=True)

if __name__=='__main__':
    try: main()
    except Exception as exc: raise SystemExit(str(exc))
