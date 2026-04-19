import json
from pathlib import Path

def write_chunk(filename, data):
    Path(f'graphify-out/{filename}').write_text(json.dumps(data, indent=2))

# Chunk 01
write_chunk('.graphify_chunk_01.json', {
    "nodes": [
        {"id": "index_html", "label": "index.html", "file_type": "document", "source_file": "index.html"},
        {"id": "readme_md", "label": "README.md", "file_type": "document", "source_file": "README.md"},
        {"id": "src_main_jsx", "label": "src/main.jsx", "file_type": "code", "source_file": "src/main.jsx"},
        {"id": "google_fonts_inter", "label": "Inter (Google Fonts)", "file_type": "document", "source_file": "index.html"}
    ],
    "edges": [
        {"source": "index_html", "target": "src_main_jsx", "relation": "references", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "index.html"},
        {"source": "index_html", "target": "google_fonts_inter", "relation": "references", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "index.html"}
    ],
    "hyperedges": [],
    "input_tokens": 0, "output_tokens": 0
})

# Chunk 02 (favicon.svg)
write_chunk('.graphify_chunk_02.json', {
    "nodes": [{"id": "public_favicon_svg", "label": "favicon.svg", "file_type": "image", "source_file": "public/favicon.svg"}],
    "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0
})

# Chunk 03 (icons.svg)
write_chunk('.graphify_chunk_03.json', {
    "nodes": [
        {"id": "public_icons_svg", "label": "icons.svg", "file_type": "image", "source_file": "public/icons.svg"},
        {"id": "bluesky_icon", "label": "Bluesky Icon", "file_type": "image", "source_file": "public/icons.svg"},
        {"id": "discord_icon", "label": "Discord Icon", "file_type": "image", "source_file": "public/icons.svg"},
        {"id": "documentation_icon", "label": "Documentation Icon", "file_type": "image", "source_file": "public/icons.svg"},
        {"id": "github_icon", "label": "GitHub Icon", "file_type": "image", "source_file": "public/icons.svg"},
        {"id": "social_icon", "label": "Social Icon", "file_type": "image", "source_file": "public/icons.svg"},
        {"id": "x_icon", "label": "X Icon", "file_type": "image", "source_file": "public/icons.svg"}
    ],
    "edges": [
        {"source": "public_icons_svg", "target": "bluesky_icon", "relation": "contains", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "public/icons.svg"},
        {"source": "public_icons_svg", "target": "discord_icon", "relation": "contains", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "public/icons.svg"},
        {"source": "public_icons_svg", "target": "documentation_icon", "relation": "contains", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "public/icons.svg"},
        {"source": "public_icons_svg", "target": "github_icon", "relation": "contains", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "public/icons.svg"},
        {"source": "public_icons_svg", "target": "social_icon", "relation": "contains", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "public/icons.svg"},
        {"source": "public_icons_svg", "target": "x_icon", "relation": "contains", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": "public/icons.svg"}
    ],
    "hyperedges": [], "input_tokens": 0, "output_tokens": 0
})

# Chunk 04 (hero.png)
write_chunk('.graphify_chunk_04.json', {
    "nodes": [{"id": "src_assets_hero_png", "label": "hero.png", "file_type": "image", "source_file": "src/assets/hero.png"}],
    "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0
})

# Chunk 05 (react.svg)
write_chunk('.graphify_chunk_05.json', {
    "nodes": [{"id": "src_assets_react_svg", "label": "react.svg", "file_type": "image", "source_file": "src/assets/react.svg"}],
    "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0
})

# Chunk 06 (vite.svg)
write_chunk('.graphify_chunk_06.json', {
    "nodes": [{"id": "src_assets_vite_svg", "label": "vite.svg", "file_type": "image", "source_file": "src/assets/vite.svg"}],
    "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0
})
