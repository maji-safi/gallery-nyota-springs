#!/usr/bin/env python3
"""Second-pass review of the *already approved* Nyota Springs gallery. Python 3.9+.
Does not mutate WordPress or first-pass curation files.
"""
import argparse, concurrent.futures, io, json, os, pathlib, shutil, sys, tempfile, urllib.request
from collections import defaultdict
from datetime import datetime
from html import escape
from PIL import Image, ImageOps, ImageStat

ROOT = pathlib.Path(__file__).resolve().parents[1]
APPROVED = ROOT / 'data/approved-photos.json'
OUT = ROOT / 'curation-review/second-pass'


def dhash(im):
    im = ImageOps.exif_transpose(im).convert('L').resize((9, 8), Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS)
    p=list(im.getdata()); v=0
    for y in range(8):
        for x in range(8):
            v=(v << 1) | int(p[y*9+x] > p[y*9+x+1])
    return v


def signature(im):
    im=ImageOps.exif_transpose(im).convert('RGB')
    small=im.resize((32,32), Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS)
    return dict(hash=dhash(small), color=[round(x,1) for x in ImageStat.Stat(small).mean])


def load_photo(entry):
    src=entry['src']; key=__import__('hashlib').sha256(src.encode()).hexdigest()[:24]
    path=OUT/'cache'/('thumb-'+key+'.jpg')
    try:
        if path.exists():
            im=Image.open(path); im.load()
        else:
            req=urllib.request.Request(src,headers={'User-Agent':'NyotaSpringsPhotoCuration/2.0'})
            with urllib.request.urlopen(req,timeout=30) as res:
                payload=res.read(18*1024*1024+1)
            if len(payload)>18*1024*1024: raise ValueError('Source image exceeds 18 MB download limit')
            im=Image.open(io.BytesIO(payload)); im.load()
            im=ImageOps.exif_transpose(im).convert('RGB'); im.thumbnail((480,360))
            path.parent.mkdir(parents=True,exist_ok=True); im.save(path,quality=80)
        sig=signature(im)
        return {'src':src, 'category':entry['category'], 'filename':entry.get('filename',src.rsplit('/',1)[-1]), 'thumb': 'cache/'+path.name, **sig},None
    except Exception as ex:
        return None,{'src':src,'error':str(ex)}


def group_candidates(rows,threshold=12):
    # Every item remains in the all-photo review, even if no candidate group is found.
    parent=list(range(len(rows)))
    def find(x):
        while parent[x]!=x:
            parent[x]=parent[parent[x]]; x=parent[x]
        return x
    def union(a,b): parent[find(b)]=find(a)
    candidates=0
    bycat=defaultdict(list)
    for i,p in enumerate(rows):bycat[p['category']].append((i,p))
    for category,items in bycat.items():
        for x,(a,pa) in enumerate(items):
            for b,pb in items[x+1:]:
                distance=(pa['hash']^pb['hash']).bit_count() if hasattr(int, 'bit_count') else bin(pa['hash']^pb['hash']).count('1')
                color_delta=sum(abs(x-y) for x,y in zip(pa['color'],pb['color']))/3
                if distance<=threshold and color_delta<=45:
                    union(a,b);candidates+=1
    sets=defaultdict(list)
    for i,p in enumerate(rows):sets[find(i)].append(p['src'])
    groups=sorted((v for v in sets.values() if len(v)>1),key=lambda g:-len(g))
    return groups,candidates


def html_page(photos,groups,errors):
    records=[{k:v for k,v in p.items() if k!='hash'} for p in photos]
    # display grouped candidates first, then full photographic inventory by category
    data=json.dumps({'photos':records,'groups':groups,'errors':errors},ensure_ascii=False).replace('<','\\u003c')
    return r'''<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nyota Springs — Second Pass Review</title>
<style>body{background:#f5f2e9;color:#20352c;font:14px system-ui;margin:0}header{position:sticky;top:0;z-index:5;background:#20352c;color:white;padding:15px 3vw;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px}button,select{font:inherit;cursor:pointer;padding:10px;border-radius:8px;border:1px solid #9ca7a0;background:white;color:#20352c}button.primary{background:#e8dfb9}main{max-width:1440px;margin:auto;padding:20px}section{margin:22px 0 36px}h2{font-family:Georgia,serif;font-size:28px}.group{background:#fff;padding:18px;border-radius:12px;margin:15px 0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}.tile{border:2px solid #ddd;padding:8px;border-radius:9px;min-width:0}.tile.exclude{border-color:#ac4237;background:#fae9e7}.tile.keep{border-color:#427b4a}.tile img{width:100%;height:160px;object-fit:cover;background:#ddd}.name{overflow-wrap:anywhere;font-size:12px;margin:8px 0}.status{font-size:12px;font-weight:700}.control{display:flex;gap:5px;flex-wrap:wrap}button.chosen{background:#20352c;color:white}summary{cursor:pointer;font-size:19px;margin:12px 0}#notice{color:#ffecd1}small{color:#777}</style></head><body>
<header><div><strong>Nyota Springs — Second Pass</strong><div id="counts"></div><small id="notice">Review all images, not just proposed groups. Choices persist in this browser.</small></div><div><button onclick="download()" class="primary">Download second-pass-decisions.json</button><button onclick="resetChoices()">Reset second-pass choices</button></div></header>
<main><p><strong>No automatic exclusions.</strong> "Keep only this" within a proposed group excludes other images in that group. Exclusions also show in the full-category list. You can restore any image individually. Download your decisions, then run the separate apply command. No WordPress media is deleted.</p><div id="errors"></div><section><h2>Suggested duplicate groups</h2><div id="groups"></div></section><section><h2>Review every approved photograph by category</h2><div id="catalog"></div></section></main>
<script id="payload" type="application/json">''' + data + r'''</script><script>
const data=JSON.parse(document.getElementById('payload').textContent);
const bySrc=new Map(data.photos.map(p=>[p.src,p]));
const storageKey='nyota-second-pass-v1';
let excluded=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]').filter(s=>bySrc.has(s)));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){localStorage.setItem(storageKey,JSON.stringify([...excluded]));refresh()}
function setExcluded(src,yes){if(yes)excluded.add(src);else excluded.delete(src);persist()}
function keepOnly(group,src){group.forEach(s=>{if(s===src)excluded.delete(s);else excluded.add(s)});persist()}
function removeAll(group){group.forEach(s=>excluded.add(s));persist()}
function keepAll(group){group.forEach(s=>excluded.delete(s));persist()}
function tile(src,group){let p=bySrc.get(src);if(!p)return '';let isOut=excluded.has(src);return `<article class="tile ${isOut?'exclude':'keep'}" data-src="${esc(src)}"><img src="${esc(p.thumb)}" loading="lazy" alt="${esc(p.filename)}"><div class="name">${esc(p.filename)}</div><div class="status">${isOut?'EXCLUDED':'KEEP'}</div><div class="control"><button onclick='setExcluded(${JSON.stringify(src)},${!isOut})'>${isOut?'Restore':'Exclude'}</button>${group?`<button onclick='keepOnly(${JSON.stringify(group)},${JSON.stringify(src)})'>Keep only this</button>`:''}</div></article>`}
function render(){document.getElementById('groups').innerHTML=data.groups.map((g,i)=>`<div class="group"><h3>Group ${i+1} · ${g.length} photographs · ${esc(bySrc.get(g[0])?.category||'')}</h3><div class="control"><button onclick='removeAll(${JSON.stringify(g)})'>Remove all in group</button><button onclick='keepAll(${JSON.stringify(g)})'>Keep all</button></div><div class="grid">${g.map(s=>tile(s,g)).join('')}</div></div>`).join('')||'<p>No candidate groups. Review category grids below.</p>';
let cats=[...new Set(data.photos.map(p=>p.category))];document.getElementById('catalog').innerHTML=cats.map(cat=>`<details><summary>${esc(cat)} · ${data.photos.filter(p=>p.category===cat).length} images</summary><div class="grid">${data.photos.filter(p=>p.category===cat).map(p=>tile(p.src,null)).join('')}</div></details>`).join('');
if(data.errors.length)document.getElementById('errors').innerHTML=`<p style="color:#b22">${data.errors.length} images could not be analyzed. They remain approved; review scan-errors.json before publishing.</p>`;
refresh()}
function refresh(){document.getElementById('counts').textContent=`${data.photos.length} scanned · ${data.groups.length} suggested groups · ${excluded.size} excluded`;document.querySelectorAll('[data-src]').forEach(el=>{let out=excluded.has(el.dataset.src);el.classList.toggle('exclude',out);el.classList.toggle('keep',!out);el.querySelector('.status').textContent=out?'EXCLUDED':'KEEP';let button=el.querySelector('.control>button');button.textContent=out?'Restore':'Exclude';button.onclick=()=>setExcluded(el.dataset.src,!out)})}
function download(){let result={schema:'nyota-second-pass-v1',base_count:data.photos.length,exclude:[...excluded].sort()};let blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='second-pass-decisions.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function resetChoices(){if(confirm('Clear only your second-pass choices in this browser?')){excluded=new Set();persist()}}
render();
</script></body></html>'''


def scan(args):
    if not APPROVED.exists(): sys.exit('Missing data/approved-photos.json')
    entries=json.loads(APPROVED.read_text())
    if not isinstance(entries,list) or not entries:sys.exit('Approved manifest empty or invalid')
    OUT.mkdir(parents=True,exist_ok=True)
    print('Scanning %s approved photos (the original 1,077-photo inventory is NOT used).' % len(entries),flush=True)
    rows=[];errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for n,(row,error) in enumerate(pool.map(load_photo,entries),1):
            if row:rows.append(row)
            if error:errors.append(error)
            if n%25==0 or n==len(entries):print('Processed %s/%s' % (n,len(entries)),flush=True)
    groups,pairs=group_candidates(rows,args.distance)
    (OUT/'scan-errors.json').write_text(json.dumps(errors,indent=2))
    (OUT/'review.html').write_text(html_page(rows,groups,errors))
    (OUT/'summary.json').write_text(json.dumps({'approved_input':len(entries),'analyzed':len(rows),'thumbnail_errors':len(errors),'candidate_pairs':pairs,'candidate_groups':len(groups),'distance_threshold':args.distance},indent=2))
    print(json.dumps(json.loads((OUT/'summary.json').read_text()),indent=2))
    print('Open:',OUT/'review.html')
    if errors:print('WARNING: Some images failed. Review scan-errors.json. Apply will refuse while errors exist.')


def apply(args):
    choice=OUT/'second-pass-decisions.json'; errors=OUT/'scan-errors.json';summary=OUT/'summary.json'
    if not choice.exists():sys.exit('Missing curation-review/second-pass/second-pass-decisions.json')
    if not summary.exists():sys.exit('Run scan first.')
    summary_data=json.loads(summary.read_text())
    if summary_data['thumbnail_errors']:
        sys.exit('Second-pass scan had thumbnail errors. Resolve them and re-scan before applying.')
    entries=json.loads(APPROVED.read_text()); decisions=json.loads(choice.read_text())
    if decisions.get('schema')!='nyota-second-pass-v1':sys.exit('Decisions file schema mismatch')
    if decisions.get('base_count')!=len(entries) or summary_data['approved_input']!=len(entries):sys.exit('Manifest changed after scan. Refusing to apply stale decisions.')
    excluded=decisions.get('exclude')
    if not isinstance(excluded,list):sys.exit('Missing exclude list')
    if len(set(excluded))!=len(excluded):sys.exit('Duplicate exclusions found')
    urls={p['src'] for p in entries}
    if any(x not in urls for x in excluded):sys.exit('Decisions include URLs not present in current manifest')
    keep=[p for p in entries if p['src'] not in set(excluded)]
    if not keep:sys.exit('Refusing to approve zero photographs')
    before={p['category'] for p in entries};after={p['category'] for p in keep}
    if before!=after:sys.exit('Refusing to remove all images from category/categories: '+str(before-after))
    stamp=datetime.now().strftime('%Y%m%d-%H%M%S')
    backup=APPROVED.with_name('approved-photos.before-second-pass-'+stamp+'.json')
    shutil.copy2(APPROVED,backup)
    temp=APPROVED.with_name('.approved-photos-second-pass.tmp')
    temp.write_text(json.dumps(keep,ensure_ascii=False,indent=2)+'\n')
    os.replace(temp,APPROVED)
    print('Approved:',len(keep),'Excluded in second pass:',len(excluded),'Backup:',backup)


def main():
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='action',required=True)
    scan_parser=sub.add_parser('scan');scan_parser.add_argument('--distance',type=int,default=12);scan_parser.add_argument('--workers',type=int,default=8)
    sub.add_parser('apply')
    args=p.parse_args();scan(args) if args.action=='scan' else apply(args)
if __name__=='__main__':main()
