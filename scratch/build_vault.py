"""
Build a rich Obsidian vault from Graphify output (graph.json + AST cache).
Vault structure:
  obsidian-vault/
    .obsidian/          <- Obsidian config (graph colour groups, core plugins)
    _Index.md           <- Start here
    _Graph Report.md    <- Graphify GRAPH_REPORT verbatim
    Communities/        <- One note per community cluster
    Nodes/              <- One note per node (file or concept)
"""

import json, os, re, shutil, glob

# ── paths ─────────────────────────────────────────────────────────────────────
BASE   = r"c:\Users\Amol\Desktop\Antigravity\AQI project"
GOUT   = os.path.join(BASE, "graphify-out")
VAULT  = os.path.join(BASE, "obsidian-vault")
GRAPH  = os.path.join(GOUT, "graph.json")
REPORT = os.path.join(GOUT, "GRAPH_REPORT.md")
AST    = os.path.join(GOUT, "cache", "ast")

# ── helpers ───────────────────────────────────────────────────────────────────
def safe(name: str) -> str:
    """Sanitise a string so it's a legal filename on Windows."""
    return re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', name).strip()

def make(path: str):
    os.makedirs(path, exist_ok=True)

def write(path: str, text: str):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

# Community labels derived from GRAPH_REPORT
COMMUNITY_NAMES = {
    1: "Health Insights Service",
    2: "Core Integration Layer",
    6: "Impact Analysis",
}

def community_name(cid) -> str:
    return COMMUNITY_NAMES.get(int(cid), f"Community {cid}")

# ── load graph data ───────────────────────────────────────────────────────────
with open(GRAPH, encoding="utf-8") as f:
    graph = json.load(f)

nodes = graph["nodes"]
links = graph["links"]

id_to_node  = {n["id"]: n for n in nodes}
id_to_label = {n["id"]: n["label"] for n in nodes}

# Build adjacency: node_id -> list of (relation, target_label, confidence)
outgoing = {n["id"]: [] for n in nodes}
incoming = {n["id"]: [] for n in nodes}

for lnk in links:
    src = lnk.get("_src") or lnk.get("source")
    tgt = lnk.get("_tgt") or lnk.get("target")
    rel = lnk.get("relation", "related")
    conf = lnk.get("confidence", "EXTRACTED")
    if src in outgoing:
        outgoing[src].append((rel, tgt, conf))
    if tgt in incoming:
        incoming[tgt].append((rel, src, conf))

# Group nodes by community
communities: dict[int, list] = {}
for n in nodes:
    cid = n.get("community", -1)
    communities.setdefault(cid, []).append(n)

# ── load AST cache (grab summaries / exports if present) ─────────────────────
ast_data: dict[str, dict] = {}
for fp in glob.glob(os.path.join(AST, "*.json")):
    try:
        with open(fp, encoding="utf-8") as f:
            obj = json.load(f)
        # keyed by relative source_file path if available
        sf = obj.get("source_file") or obj.get("file") or ""
        if sf:
            ast_data[sf.replace("\\", "/")] = obj
    except Exception:
        pass

def get_ast(source_file: str) -> dict:
    key = source_file.replace("\\", "/")
    return ast_data.get(key, {})

# ══════════════════════════════════════════════════════════════════════════════
# 1 ── create vault directory tree
# ══════════════════════════════════════════════════════════════════════════════
if os.path.exists(VAULT):
    shutil.rmtree(VAULT)

make(VAULT)
make(os.path.join(VAULT, ".obsidian"))
make(os.path.join(VAULT, "Communities"))
make(os.path.join(VAULT, "Nodes"))

# ══════════════════════════════════════════════════════════════════════════════
# 2 ── .obsidian config files
# ══════════════════════════════════════════════════════════════════════════════

# app.json – sensible defaults
write(os.path.join(VAULT, ".obsidian", "app.json"), json.dumps({
    "legacyEditor": False,
    "livePreview": True,
    "defaultViewMode": "preview",
    "newFileLocation": "folder",
    "newFileFolderPath": "Nodes",
    "attachmentFolderPath": "Assets",
    "alwaysUpdateLinks": True,
}, indent=2))

# core-plugins.json – enable graph, backlinks, tags
write(os.path.join(VAULT, ".obsidian", "core-plugins.json"), json.dumps([
    "file-explorer", "global-search", "switcher", "graph",
    "backlink", "outgoing-link", "tag-pane", "properties",
    "page-preview", "note-composer", "markdown-importer",
], indent=2))

# graph.json – colour groups per community
color_palette = [
    "#e05252","#e09252","#d4e052","#52e09e","#52b0e0",
    "#7052e0","#e052c2","#a0a0a0","#52e0e0","#e07852",
]
color_groups = []
for i, (cid, cnodes) in enumerate(sorted(communities.items())):
    cname = community_name(cid)
    color = color_palette[i % len(color_palette)]
    # Obsidian graph color groups use a "query" field
    for cn in cnodes:
        color_groups.append({
            "query": f'"{safe(cn["label"])}"',
            "color": {"a": 1, "rgb": int(color.lstrip("#"), 16)},
        })

write(os.path.join(VAULT, ".obsidian", "graph.json"), json.dumps({
    "collapse-filter": False,
    "search": "",
    "showTags": False,
    "showAttachments": False,
    "hideUnresolved": False,
    "showOrphans": True,
    "collapse-color-groups": False,
    "colorGroups": color_groups,
    "collapse-display": False,
    "showArrow": True,
    "textFadeMultiplier": 0,
    "nodeSizeMultiplier": 1.3,
    "lineSizeMultiplier": 1,
    "scale": 1,
    "close": False,
}, indent=2))

# ══════════════════════════════════════════════════════════════════════════════
# 3 ── copy GRAPH_REPORT as-is
# ══════════════════════════════════════════════════════════════════════════════
with open(REPORT, encoding="utf-8") as f:
    report_text = f.read()

# Rewrite [[_COMMUNITY_...]] links to our community notes
def fix_community_link(m):
    inner = m.group(1)           # e.g. "_COMMUNITY_Health Insights Service|Health Insights Service"
    parts  = inner.split("|")
    display = parts[-1]
    return f"[[Communities/{safe(display)}|{display}]]"

report_text = re.sub(r'\[\[(_COMMUNITY_[^\]]+)\]\]', fix_community_link, report_text)
write(os.path.join(VAULT, "_Graph Report.md"), report_text)

# ══════════════════════════════════════════════════════════════════════════════
# 4 ── Community notes
# ══════════════════════════════════════════════════════════════════════════════
for cid, cnodes in sorted(communities.items()):
    cname = community_name(cid)
    fname = safe(cname) + ".md"
    fpath = os.path.join(VAULT, "Communities", fname)

    # Sort: file-type nodes first, then functions
    file_nodes = [n for n in cnodes if n.get("source_location", "L1") == "L1"]
    func_nodes = [n for n in cnodes if n not in file_nodes]

    lines = [
        "---",
        f'title: "{cname}"',
        f"community_id: {cid}",
        f"node_count: {len(cnodes)}",
        "tags:",
        "  - community",
        "  - graphify",
        "---",
        "",
        f"# {cname}",
        "",
        f"> [!info] Community {cid}",
        f"> This cluster contains **{len(cnodes)} nodes** extracted by Graphify.",
        "",
    ]

    if file_nodes:
        lines += ["## Source Files", ""]
        for n in sorted(file_nodes, key=lambda x: x["label"]):
            lines.append(f"- [[Nodes/{safe(n['label'])}|{n['label']}]] — `{n.get('source_file','')}`")
        lines.append("")

    if func_nodes:
        lines += ["## Functions & Abstractions", ""]
        for n in sorted(func_nodes, key=lambda x: x["label"]):
            loc = n.get("source_location", "")
            sf  = n.get("source_file", "")
            lines.append(f"- [[Nodes/{safe(n['label'])}|{n['label']}]] — `{sf}` {loc}")
        lines.append("")

    lines += ["## Internal Relationships", ""]
    # Collect all edges that are entirely within this community
    cids_set = {n["id"] for n in cnodes}
    internal_edges = [
        lnk for lnk in links
        if (lnk.get("_src") or lnk.get("source")) in cids_set
        and (lnk.get("_tgt") or lnk.get("target")) in cids_set
    ]
    if internal_edges:
        for lnk in internal_edges:
            src_lbl = id_to_label.get(lnk.get("_src") or lnk.get("source"), "?")
            tgt_lbl = id_to_label.get(lnk.get("_tgt") or lnk.get("target"), "?")
            rel = lnk.get("relation", "related")
            conf = lnk.get("confidence", "EXTRACTED")
            badge = "✅" if conf == "EXTRACTED" else "🔮"
            lines.append(f"- {badge} [[Nodes/{safe(src_lbl)}|{src_lbl}]] **{rel}** [[Nodes/{safe(tgt_lbl)}|{tgt_lbl}]]")
    else:
        lines.append("_No internal edges detected._")

    write(fpath, "\n".join(lines))

# ══════════════════════════════════════════════════════════════════════════════
# 5 ── Individual node notes
# ══════════════════════════════════════════════════════════════════════════════
for node in nodes:
    label   = node["label"]
    nid     = node["id"]
    ftype   = node.get("file_type", "code")
    sf      = node.get("source_file", "")
    loc     = node.get("source_location", "")
    cid     = node.get("community", -1)
    cname   = community_name(cid)

    fname = safe(label) + ".md"
    fpath = os.path.join(VAULT, "Nodes", fname)

    # Try to pull AST summary
    ast = get_ast(sf)
    ast_summary = ast.get("summary") or ast.get("description") or ""
    ast_exports = ast.get("exports") or ast.get("symbols") or []

    # Icon by file type
    icons = {"code": "💻", "document": "📄", "paper": "📑", "image": "🖼️"}
    icon = icons.get(ftype, "📦")

    lines = [
        "---",
        f'title: "{label}"',
        f"node_id: {nid}",
        f"file_type: {ftype}",
        f'source_file: "{sf}"',
    ]
    if loc:
        lines.append(f"source_location: {loc}")
    lines += [
        f"community: {cid}",
        f'community_name: "{cname}"',
        "tags:",
        f"  - graphify/{ftype}",
        f"  - community/{safe(cname).replace(' ', '_')}",
        "---",
        "",
        f"# {icon} {label}",
        "",
        f"> [!abstract] Graphify Node",
        f"> **Type:** `{ftype}` · **Community:** [[Communities/{safe(cname)}|{cname}]]",
    ]
    if sf:
        lines.append(f"> **Source:** `{sf}`" + (f" · **Location:** `{loc}`" if loc else ""))
    lines.append("")

    if ast_summary:
        lines += [
            "> [!note] AST Summary",
            f"> {ast_summary}",
            "",
        ]

    if ast_exports:
        lines += ["## Exported Symbols", ""]
        for sym in (ast_exports if isinstance(ast_exports, list) else [ast_exports]):
            lines.append(f"- `{sym}`")
        lines.append("")

    # Outgoing relationships
    out_edges = outgoing.get(nid, [])
    if out_edges:
        lines += ["## Outgoing Relationships", ""]
        for rel, tgt_id, conf in out_edges:
            tgt_lbl = id_to_label.get(tgt_id, tgt_id)
            badge = "✅" if conf == "EXTRACTED" else "🔮 INFERRED"
            lines.append(f"- {badge} **{rel}** → [[{safe(tgt_lbl)}|{tgt_lbl}]]")
        lines.append("")

    # Incoming relationships
    in_edges = incoming.get(nid, [])
    if in_edges:
        lines += ["## Incoming Relationships", ""]
        for rel, src_id, conf in in_edges:
            src_lbl = id_to_label.get(src_id, src_id)
            badge = "✅" if conf == "EXTRACTED" else "🔮 INFERRED"
            lines.append(f"- {badge} **{rel}** ← [[{safe(src_lbl)}|{src_lbl}]]")
        lines.append("")

    write(fpath, "\n".join(lines))

# ══════════════════════════════════════════════════════════════════════════════
# 6 ── _Index.md (Start Here)
# ══════════════════════════════════════════════════════════════════════════════
# Count edges by type
edge_types: dict[str, int] = {}
for lnk in links:
    et = lnk.get("relation", "related")
    edge_types[et] = edge_types.get(et, 0) + 1

index_lines = [
    "---",
    'title: "India AQI Dashboard — Knowledge Graph"',
    "tags:",
    "  - graphify",
    "  - index",
    "---",
    "",
    "# 🌐 India AQI Dashboard — Knowledge Graph",
    "",
    "> [!success] Vault generated by Antigravity from Graphify output",
    f"> **{len(nodes)} nodes · {len(links)} edges · {len(communities)} communities**",
    "",
    "---",
    "",
    "## 🚀 Start Exploring",
    "",
    "| Entry Point | Description |",
    "|---|---|",
    "| [[_Graph Report]] | Full Graphify analysis report |",
    "| [[Nodes/India AQI Dashboard\\|India AQI Dashboard]] | Central hub — most connected node |",
    "| [[Nodes/fetchWeatherAndCity()\\|fetchWeatherAndCity()]] | God node: core data fetch |",
    "",
    "## 🏘️ Communities",
    "",
]

for cid, cnodes in sorted(communities.items()):
    cname = community_name(cid)
    index_lines.append(f"- [[Communities/{safe(cname)}|{cname}]] — {len(cnodes)} nodes")

index_lines += [
    "",
    "## 📊 Edge Types",
    "",
]
for et, count in sorted(edge_types.items(), key=lambda x: -x[1]):
    index_lines.append(f"- **{et}**: {count} edges")

index_lines += [
    "",
    "## 🔍 Quick Filters (use Obsidian Search)",
    "",
    "- All code nodes: `tag:#graphify/code`",
    "- All document nodes: `tag:#graphify/document`",
    "- Core Integration Layer: `tag:#community/Core_Integration_Layer`",
    "- Health Insights Service: `tag:#community/Health_Insights_Service`",
    "",
    "---",
    "",
    "## 🧩 All Nodes A–Z",
    "",
]
for n in sorted(nodes, key=lambda x: x["label"].lower()):
    icons = {"code": "💻", "document": "📄", "paper": "📑", "image": "🖼️"}
    ic = icons.get(n.get("file_type", "code"), "📦")
    index_lines.append(f"- {ic} [[Nodes/{safe(n['label'])}|{n['label']}]]")

write(os.path.join(VAULT, "_Index.md"), "\n".join(index_lines))

# ── summary ──────────────────────────────────────────────────────────────────
print(f"[OK] Vault created at: {VAULT}")
print(f"     Nodes/         : {len(nodes)} notes")
print(f"     Communities/   : {len(communities)} notes")
print(f"     .obsidian/     : app.json, core-plugins.json, graph.json")
print(f"     Root notes     : _Index.md, _Graph Report.md")
