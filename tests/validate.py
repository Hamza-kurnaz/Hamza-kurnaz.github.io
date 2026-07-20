import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.hrefs = []
        self.srcs = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            if a["id"] in self.ids:
                self.errors.append("duplicate id " + a["id"])
            self.ids.add(a["id"])
        if "href" in a:
            self.hrefs.append(a["href"])
        if "src" in a:
            self.srcs.append(a["src"])


parser = Parser()
parser.feed(html)
errors = parser.errors

for url in parser.hrefs + parser.srcs:
    if url.startswith(("http:", "https:", "mailto:", "tel:", "#", "data:")):
        continue
    if not (root / url).exists():
        errors.append("missing asset " + url)

for url in parser.hrefs:
    if url.startswith("#") and url[1:] and url[1:] not in parser.ids:
        errors.append("missing anchor " + url)

css_files = sorted((root / "css").glob("*.css"))
js_files = sorted((root / "js").glob("*.js"))
combined = html + "".join(f.read_text(encoding="utf-8") for f in css_files) + "".join(
    f.read_text(encoding="utf-8") for f in js_files
)

for requirement in ["<main", "<header", "<footer", "aria-label", "prefers-reduced-motion", "application/ld+json"]:
    if requirement not in combined:
        errors.append("missing requirement " + requirement)

# Every local ES module import must resolve to a real file.
import_pattern = re.compile(r"""from\s+["'](\./[^"']+)["']""")
for js_file in js_files:
    for match in import_pattern.finditer(js_file.read_text(encoding="utf-8")):
        target = (js_file.parent / match.group(1)).resolve()
        if not target.exists():
            errors.append(f"missing module import {match.group(1)} in {js_file.name}")

# Syntax-check every module with Node, when available.
try:
    for js_file in js_files:
        result = subprocess.run(
            ["node", "--input-type=module", "--check"],
            input=js_file.read_text(encoding="utf-8"),
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            errors.append(f"syntax error in {js_file.name}: {result.stderr.strip()}")
except FileNotFoundError:
    print("note: node not found, skipped JavaScript syntax check", file=sys.stderr)

if errors:
    print("\n".join(errors))
    sys.exit(1)

print(
    f"OK: {len(parser.ids)} ids, {len(parser.hrefs)} links, {len(parser.srcs)} sources, "
    f"{len(css_files)} css files, {len(js_files)} js modules validated"
)
