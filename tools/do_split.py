import pathlib

js_path = pathlib.Path('src/js/app.js')
js = js_path.read_text(encoding='utf-8')

splits = [
    ('src/js/modules/00-constants.js', '"use strict";', 'let EXPECTED_DATA_KEYS'),
    ('src/js/modules/01-storage.js', 'let EXPECTED_DATA_KEYS', '// ---- visibility model'),
    ('src/js/modules/02-visibility-and-utils.js', '// ---- visibility model', 'const POSITIONS'),
    ('src/js/modules/03-render.js', 'const POSITIONS', 'editorFields.addEventListener'),
    ('src/js/modules/04-ui.js', 'editorFields.addEventListener', None),
]

for out_path, start_pat, end_pat in splits:
    start = js.find(start_pat)
    if start == -1:
        print(f"WARN not found {start_pat}")
        continue
    if end_pat:
        end = js.find(end_pat, start+len(start_pat))
        if end == -1:
            end = len(js)
    else:
        end = len(js)
    snippet = js[start:end].strip()
    # Add header
    header = f"// {out_path} — split from app.js — do not edit header order\n"
    # For 00, keep use strict at top; for others, ensure no duplicate use strict
    content = header + snippet + "\n"
    pathlib.Path(out_path).write_text(content, encoding='utf-8')
    print(f"wrote {out_path} {len(content)} chars, {content.count(chr(10))+1} lines")

# Also create a 05-init shim that will be empty (for future)
# Keep src/js/app.js as loader that just notes split
loader = """// app.js — now split into modules/ — this file is kept for reference but build uses modules/
// Build concatenates src/js/modules/*.js in numeric order; this file is ignored when modules are real.
console.warn("app.js is legacy; modules/ is now source of truth");
"""
# Don't overwrite if we want to keep original for reference, instead rename original to app.legacy.js
js_path.rename(pathlib.Path('src/js/app.legacy.js'))
print("renamed app.js to app.legacy.js")
pathlib.Path('src/js/app.js').write_text(loader, encoding='utf-8')
print("wrote new loader app.js")
