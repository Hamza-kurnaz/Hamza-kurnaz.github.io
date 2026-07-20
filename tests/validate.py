from pathlib import Path
from html.parser import HTMLParser
import re, sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
class P(HTMLParser):
    def __init__(self): super().__init__(); self.ids=set(); self.hrefs=[]; self.srcs=[]; self.errors=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:self.errors.append('duplicate id '+a['id'])
            self.ids.add(a['id'])
        if 'href' in a:self.hrefs.append(a['href'])
        if 'src' in a:self.srcs.append(a['src'])
p=P();p.feed(html)
errors=p.errors
for u in p.hrefs+p.srcs:
    if u.startswith(('http:','https:','mailto:','tel:','#','data:')):continue
    if not (root/u).exists():errors.append('missing asset '+u)
for u in p.hrefs:
    if u.startswith('#') and u[1:] and u[1:] not in p.ids:errors.append('missing anchor '+u)
combined=html+(root/'styles.css').read_text(encoding='utf-8')+(root/'app.js').read_text(encoding='utf-8')
for req in ['<main','<header','<footer','aria-label','prefers-reduced-motion','application/ld+json']:
    if req not in combined: errors.append('missing requirement '+req)
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'OK: {len(p.ids)} ids, {len(p.hrefs)} links, {len(p.srcs)} sources validated')
