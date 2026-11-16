"""Fail on credential-shaped values without printing any matching content."""
from pathlib import Path
import os
import re
import subprocess
import sys

patterns=[
 re.compile(rb'-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----'),
 re.compile(rb'GOCSPX-[A-Za-z0-9_-]{20,}'),
 re.compile(rb'(?:ghp_|github_pat_|sk_live_|sk-proj-)[A-Za-z0-9_\-]{20,}'),
 re.compile(rb'\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{15,}'),
 re.compile(rb'(?:ACCESS_CODE_SHA256|SESSION_SECRET)\s*=\s*[\'\"]?[a-fA-F0-9]{40,}'),
 re.compile(rb'postgres(?:ql)?://[A-Za-z0-9_]+:[A-Za-z0-9._~%\-]{8,}@'),
]
preview=os.environ.get('RAQVOI_PREVIEW_CODE','').encode()
def risky(data):
 # Old .env.example history contains documented URLs with placeholder hosts.
 def example(match):
  password,host=match.group(1),match.group(2).lower()
  documented=password in [b'password',b'your-password',b'your-db-password',b'your_password',b'your-password-here']
  return b'<documented-database-example>' if documented and any(word in host for word in [b'your',b'example',b'host']) else match.group(0)
 data=re.sub(rb'postgres(?:ql)?://[A-Za-z0-9_]+:([A-Za-z0-9._~%\-]{8,})@([^\s/]+)',example,data)
 return any(p.search(data) for p in patterns) or bool(preview and preview in data)
def git(*args): return subprocess.check_output(['git',*args])
failed=[]
for name in git('diff','--cached','--name-only','-z').split(b'\0'):
 if not name: continue
 path=name.decode()
 if Path(path).name=='AGENTS.md' or Path(path).name.startswith('.env'):
  failed.append('private file staged: '+path); continue
 try: data=git('show',':'+path)
 except subprocess.CalledProcessError: continue
 if risky(data): failed.append('staged credential pattern: '+path)
for path in Path('source/dist').rglob('*'):
 if path.is_file() and path.suffix in ['.js','.css','.html','.json','.map'] and risky(path.read_bytes()):
  failed.append('build credential pattern: '+str(path))
for commit in git('rev-list','--all').decode().splitlines():
 data=git('show','--format=','--no-ext-diff','--no-renames',commit)
 if risky(data): failed.append('history credential pattern in '+commit[:10])
if failed:
 print('\n'.join(failed)); sys.exit(1)
print('Staged files, frontend build and existing history: credential scan passed; no values printed')
