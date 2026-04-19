import json
import glob
from pathlib import Path

# AST
ast_path = Path('graphify-out/.graphify_ast.json')
if ast_path.exists():
    ast = json.loads(ast_path.read_text())
else:
    ast = {"nodes": [], "edges": [], "hyperedges": []}

nodes = {n['id']: n for n in ast.get('nodes', [])}
edges = {(e['source'], e['target'], e.get('relation')): e for e in ast.get('edges', [])}

# Semantic chunks
chunk_files = glob.glob('graphify-out/.graphify_chunk_*.json')
for f in chunk_files:
    data = json.loads(Path(f).read_text())
    for n in data.get('nodes', []):
        if n['id'] not in nodes:
            nodes[n['id']] = n
        else:
            # Merge if needed, but usually we just keep the first one or update fields
            nodes[n['id']].update({k: v for k, v in n.items() if v is not None})
    
    for e in data.get('edges', []):
        key = (e['source'], e['target'], e.get('relation'))
        if key not in edges:
            edges[key] = e
        else:
            edges[key].update({k: v for k, v in e.items() if v is not None})

final_graph = {
    "nodes": list(nodes.values()),
    "edges": list(edges.values()),
    "hyperedges": ast.get('hyperedges', []),
    "input_tokens": 0,
    "output_tokens": 0
}

Path('graphify-out/graph.json').write_text(json.dumps(final_graph, indent=2))
print(f"Graph assembled: {len(final_graph['nodes'])} nodes, {len(final_graph['edges'])} edges")
