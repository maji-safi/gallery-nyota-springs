#!/usr/bin/env python3
"""Generate a grouped, non-destructive photo-review UI from an existing Nyota scan."""
import argparse
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'curation-review'

def build_groups(entries, pairs, max_distance):
    index = {p['src']: p for p in entries}
    parent = {url: url for url in index}
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def join(x, y):
        a, b = find(x), find(y)
        if a != b: parent[b] = a
    linked = set()
    for pair in pairs:
        a, b = pair['url_a'], pair['url_b']
        if a not in index or b not in index or index[a]['category'] != index[b]['category']:
            continue
        reasons = pair.get('reasons', [])
        dist = pair.get('hamming_distance')
        if 'filename-variant' in reasons or ('perceptual-similarity' in reasons and isinstance(dist, int) and dist <= max_distance):
            join(a, b)
            linked.update((a, b))
    groups = defaultdict(list)
    for url in linked:
        groups[find(url)].append(index[url])
    result = [sorted(items, key=lambda p: (p['filename'].casefold(), p['src'])) for items in groups.values() if len(items) > 1]
    result.sort(key=lambda group: (group[0]['category'], -len(group), group[0]['filename']))
    return result

HTML = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nyota Grouped Photo Review</title>
<style>
:root{font-family:system-ui,-apple-system,sans-serif;color:#20352c;background:#f5f2e9}*{box-sizing:border-box}body{max-width:1450px;margin:auto;padding:20px}h1{font-family:Georgia,serif;font-weight:normal;font-size:clamp(30px,4vw,52px)}button{cursor:pointer;border:1px solid #20352c;border-radius:7px;padding:9px 12px;background:#fff;color:#20352c}button:hover{background:#e6eee6}.primary{background:#20352c;color:#fff}.toolbar{position:sticky;top:0;z-index:5;background:#f5f2e9ee;padding:12px 0;border-bottom:1px solid #d1cbbd;display:flex;flex-wrap:wrap;align-items:center;gap:10px}.group{background:white;border-radius:14px;padding:20px;margin:22px 0}.group h2{font-size:19px;margin-top:0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.photo{border:2px solid #c7d4cb;border-radius:9px;padding:9px;background:#f5faf6;min-width:0}.photo.excluded{background:#fff0ed;border-color:#ca6e60}.photo img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#ddd;display:block}.photo p{overflow-wrap:anywhere;font-size:12px}.photo button{width:100%}.photo.excluded img{opacity:.38;filter:grayscale(.6)}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.muted{color:#686a62;font-size:13px}.notice{padding:12px;background:#fff2d9;border-radius:8px}.count{font-size:13px;font-weight:600}a{color:#20352c}
</style></head><body>
<h1>Nyota Springs · Grouped Photo Review</h1>
<p>Review similar photographs as <strong>groups</strong>, not repeated pairs. Select <strong>Keep only this</strong> on the best image to exclude every other image in that group.</p>
<p class="notice">No original WordPress media is deleted. Decisions only control public gallery inclusion. Perceptual similarity is a suggestion: some groups may contain different perspectives linked through an intermediate image. Review each image before excluding it.</p>
<div class="toolbar"><button class="primary" id="download">Download decisions.json</button><button id="reset">Reset all decisions</button><span class="count" id="summary"></span></div>
<div id="groups"></div>
<script>
const groups=__GROUPS__;
const total=__TOTAL__;
const storageKey='nyota-group-review-exclusions-v1';
let excluded=new Set();
try{excluded=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'));}catch(e){}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify([...excluded]));}catch(e){}}
function update(){document.querySelectorAll('[data-photo-url]').forEach(el=>{const yes=excluded.has(el.dataset.photoUrl);el.classList.toggle('excluded',yes);el.querySelector('button').textContent=yes?'Restore to gallery':'Exclude from gallery'});document.getElementById('summary').textContent=excluded.size+' excluded / '+total+' inventoried';persist();}
const container=document.getElementById('groups');
const allKnown=new Set();groups.forEach(g=>g.forEach(p=>allKnown.add(p.src)));
let groupCount=0;
for(const items of groups){groupCount++;
 const section=document.createElement('section');section.className='group';
 const title=document.createElement('h2');title.textContent=items[0].category+' · Similar group '+groupCount+' · '+items.length+' photographs';section.append(title);
 const grid=document.createElement('div');grid.className='grid';section.append(grid);
 for(const p of items){const card=document.createElement('div');card.className='photo';card.dataset.photoUrl=p.src;
 const img=document.createElement('img');img.src=p.thumbnail||p.src;img.alt=p.filename;img.loading='lazy';
 const name=document.createElement('p');name.textContent=p.filename;
 const only=document.createElement('button');only.className='primary';only.textContent='Keep only this';only.onclick=()=>{items.forEach(other=>{if(other.src===p.src)excluded.delete(other.src);else excluded.add(other.src)});update()};
 const toggle=document.createElement('button');toggle.style.marginTop='7px';toggle.onclick=()=>{if(excluded.has(p.src))excluded.delete(p.src);else excluded.add(p.src);update()};
 card.append(img,name,only,toggle);grid.append(card);
 }
 const actions=document.createElement('div');actions.className='actions';
 const keep=document.createElement('button');keep.textContent='Keep all';keep.onclick=()=>{items.forEach(p=>excluded.delete(p.src));update()};
 const remove=document.createElement('button');remove.textContent=items.length===2?'Remove both':'Remove all in group';remove.onclick=()=>{if(confirm('Exclude all '+items.length+' photos in this group from the public gallery?')){items.forEach(p=>excluded.add(p.src));update()}};
 actions.append(keep,remove);section.append(actions);container.append(section);
}
if(!groups.length){container.textContent='No groups identified at this threshold. Try --distance 4 or --distance 6.'}
document.getElementById('download').onclick=()=>{const blob=new Blob([JSON.stringify({exclude:[...excluded].sort()},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='decisions.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
document.getElementById('reset').onclick=()=>{if(confirm('Clear all review choices?')){excluded.clear();update()}};
update();
</script></body></html>'''

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--distance', type=int, default=3, help='Maximum 64-bit dHash distance (default 3; try 4-6 for more candidates)')
    args = p.parse_args()
    if not 0 <= args.distance <= 6:
        p.error('--distance must be between 0 and 6')
    inventory_path = REVIEW / 'inventory.json'
    pairs_path = REVIEW / 'duplicate-candidates.json'
    if not inventory_path.exists() or not pairs_path.exists():
        p.error('Run python3 scripts/nyota_curate.py scan first')
    entries = json.loads(inventory_path.read_text())
    pairs = json.loads(pairs_path.read_text())
    groups = build_groups(entries, pairs, args.distance)
    seen = {x['src'] for group in groups for x in group}
    content = HTML.replace('__GROUPS__', json.dumps(groups).replace('</','<\\/')).replace('__TOTAL__', str(len(entries)))
    output = REVIEW / 'group-review.html'
    output.write_text(content)
    print(json.dumps({'inventoried':len(entries),'candidate_pairs':len(pairs),'group_count':len(groups),'photos_in_groups':len(seen),'distance':args.distance,'output':str(output)},indent=2))
    print('Open:', output)

if __name__ == '__main__': main()
