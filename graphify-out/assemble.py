import json
import glob
from pathlib import Path
from graphify.assemble import assemble

# Load AST
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())

# Load semantic chunks
semantic_fragments = []
chunk_files = glob.glob('graphify-out/.graphify_chunk_*.json')
for f in chunk_files:
    semantic_fragments.append(json.loads(Path(f).read_text()))

# Load cached semantic results if they exist
if Path('graphify-out/.graphify_cached.json').exists():
    semantic_fragments.append(json.loads(Path('graphify-out/.graphify_cached.json').read_text()))

# Assemble
final_graph = assemble(ast, semantic_fragments)

# Save
Path('graphify-out/graph.json').write_text(json.dumps(final_graph, indent=2))
print(f"Graph assembled: {len(final_graph['nodes'])} nodes, {len(final_graph['edges'])} edges")
