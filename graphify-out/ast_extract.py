import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

code_files = []
try:
    detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-16'))
except Exception:
    detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text())

for f in detect.get('files', {}).get('code', []):
    path = Path(f)
    if path.is_dir():
        code_files.extend(collect_files(path))
    else:
        code_files.append(path)

if code_files:
    result = extract(code_files, cache_root=Path('.'))
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2))
    print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
else:
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}))
    print('No code files - skipping AST extraction')
