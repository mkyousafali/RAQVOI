"""Print only sanitized routing/release metadata needed for a frontend release."""
from pathlib import Path
import json
import subprocess

root=Path('/opt/raqvoi/supabase')
caddy=(root/'volumes/proxy/caddy/Caddyfile').read_text()
start=caddy.index('raqvoi.com {')
end=caddy.index('\n}',start)+2
print(caddy[start:end])
for name in ['raqvoi-preview-gate','supabase-customer-api-1','supabase-auth']:
    p=subprocess.run(['docker','inspect',name],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode: continue
    item=json.loads(p.stdout)[0]
    env=dict(row.split('=',1) for row in item['Config'].get('Env',[]) if '=' in row)
    print(json.dumps({'container':name,'image':item['Config']['Image'],'health':item['State'].get('Health',{}).get('Status'),
      'bindings':item['HostConfig'].get('PortBindings'),
      'mounts':[{'source':m['Source'],'destination':m['Destination'],'rw':m['RW']} for m in item['Mounts']],
      'appOrigin':env.get('APP_ORIGIN'),'redirects':env.get('GOTRUE_URI_ALLOW_LIST')}))
print('Releases: '+', '.join(p.name for p in Path('/opt/raqvoi/releases').iterdir() if p.is_dir()))
print('Compose layers: '+', '.join(p.name for p in root.glob('docker-compose*.yml')))
