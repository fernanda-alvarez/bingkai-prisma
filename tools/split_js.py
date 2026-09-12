import pathlib, re

js_path = pathlib.Path('src/js/app.js')
js = js_path.read_text(encoding='utf-8')

markers = [
    ('00-constants.js', '"use strict";', 'let EXPECTED_DATA_KEYS'),
    ('01-storage.js', 'let EXPECTED_DATA_KEYS', '// ---- visibility model'),
    ('02-utils.js', '// ---- visibility model', 'const POSITIONS'),
    ('03-render.js', 'const POSITIONS', 'editorFields.addEventListener'),
    ('04-ui.js', 'editorFields.addEventListener', None),
]

for name, start_pat, end_pat in markers:
    start = js.find(start_pat)
    if start==-1:
        print('WARN start not found', name, repr(start_pat))
        continue
    if end_pat:
        end = js.find(end_pat, start+len(start_pat))
        e = end if end!=-1 else len(js)
    else:
        e = len(js)
    snippet = js[start:e].strip()
    print(f"{name}: {start}..{e} len {len(snippet)} lines {snippet.count(chr(10))+1}")
    first_line = snippet.splitlines()[0][:120] if snippet else ''
    print(f"  first: {first_line}")
