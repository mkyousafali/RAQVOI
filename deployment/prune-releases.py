"""Run on the VPS after a successful deployment: python3 prune-releases.py COMMIT.

The live build stays in /opt/raqvoi/frontend; retain only this release's
previous/ directory for rollback. Database/storage backups are never touched.
"""
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

if len(sys.argv) != 2 or not re.fullmatch(r'[a-f0-9]{7,40}', sys.argv[1]):
    raise SystemExit('Supply the successfully deployed commit identifier')
root = Path('/opt/raqvoi/releases').resolve()
current = root / sys.argv[1]
if current.is_symlink() or current.resolve().parent != root:
    raise SystemExit('Invalid release path')
record = json.loads((current / 'release.json').read_text())
rollback = current / 'previous'
if record['commit'] != sys.argv[1] or Path(record['rollback']) != rollback:
    raise SystemExit('Release record mismatch')
if rollback.is_symlink() or not (rollback / 'frontend/index.html').is_file():
    raise SystemExit('Rollback build missing')
if not Path('/opt/raqvoi/frontend/index.html').is_file():
    raise SystemExit('Live build missing')
health = subprocess.check_output(
    ['docker', 'inspect', '--format', '{{.State.Health.Status}}', 'raqvoi-preview-gate'],
    text=True,
).strip()
if health != 'healthy':
    raise SystemExit('Live gate is not healthy; retain all rollback material')

def remove(target):
    if target.is_symlink() or not target.resolve().is_relative_to(root):
        raise SystemExit('Refusing an unsafe cleanup path')
    if target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()

# The live copies already contain these; they are upload/staging duplicates.
for name in ['frontend.tar.gz', 'gate']:
    remove(current / name)
for release in root.iterdir():
    if release != current and re.fullmatch(r'[a-f0-9]{7,40}', release.name):
        remove(release)
record['retention'] = 'Live build plus exactly one previous build; no release archives'
(current / 'release.json').write_text(json.dumps(record, indent=2) + '\n')
print('Retention applied: current live build and one previous rollback build only')
