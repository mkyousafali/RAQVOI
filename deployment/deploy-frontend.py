"""Deploy a frontend-only release; preserve live gate secrets and API sessions."""
from pathlib import Path
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile

os.umask(0o077)
ROOT=Path('/opt/raqvoi/supabase')
LIVE=Path('/opt/raqvoi/frontend')
STAGE=Path('/opt/raqvoi/preview-staging')

def run(args):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,cwd=ROOT)
 if p.returncode: raise RuntimeError('Frontend deployment operation failed (private output withheld)')

def main():
 commit=sys.argv[1] if len(sys.argv)==2 else ''
 if not re.fullmatch(r'[a-f0-9]{40}',commit): raise RuntimeError('Supply the reviewed commit identifier')
 release=Path('/opt/raqvoi/releases')/commit
 if release.exists(): raise RuntimeError('Release already exists')
 previous=release/'previous';previous.mkdir(parents=True,mode=0o700)
 shutil.copytree(LIVE,previous/'frontend')
 shutil.copytree('/opt/raqvoi/access-gate',previous/'access-gate')
 shutil.copytree('/opt/raqvoi/customer-api',previous/'customer-api',ignore=shutil.ignore_patterns('node_modules','__pycache__','*.pyc'))
 (previous/'compose').mkdir()
 for name in ['.env','docker-compose.raqvoi.yml','docker-compose.customer.yml','docker-compose.caddy.yml']:
  shutil.copy2(ROOT/name,previous/'compose'/name)
 shutil.copy2(ROOT/'volumes/proxy/caddy/Caddyfile',previous/'Caddyfile')
 next_front=release/'next-frontend';next_front.mkdir()
 with tarfile.open(STAGE/'frontend.tar.gz') as archive: archive.extractall(next_front,filter='data')
 if not (next_front/'index.html').is_file(): raise RuntimeError('Build incomplete')
 for p in next_front.rglob('*'): p.chmod(0o755 if p.is_dir() else 0o644)
 next_front.chmod(0o755)
 retired=release/'retired-frontend'
 try:
  LIVE.rename(retired);next_front.rename(LIVE)
  run(['docker','compose','up','-d','--force-recreate','--no-deps','--wait','--wait-timeout','90','preview-gate'])
 except Exception:
  if retired.exists():
   if LIVE.exists(): LIVE.rename(release/'failed-frontend')
   retired.rename(LIVE)
  run(['docker','compose','up','-d','--force-recreate','--no-deps','--wait','--wait-timeout','90','preview-gate'])
  raise RuntimeError('Previous frontend restored; rollback files retained')
 if retired.exists() and retired.resolve().parent==release.resolve(): shutil.rmtree(retired)
 record={'commit':commit,'deployedAt':datetime.datetime.now(datetime.UTC).isoformat(),'rollback':str(previous),'status':'awaiting-public-verification','scope':'Compact storefront layouts and product zoom fixes; gate code/secrets, backend and data unchanged'}
 (release/'release.json').write_text(json.dumps(record,indent=2)+'\n')
 print('Frontend release activated; gate and API configuration preserved; public verification required',flush=True)

if __name__=='__main__':
 try: main()
 except Exception as exc: raise SystemExit(str(exc))
