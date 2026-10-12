#!/usr/bin/env python3
"""Nyota photo discovery + review; never modifies/deletes remote media."""
import argparse
import csv
import html
import io
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
REVIEW = ROOT / 'curation-review'
BASE = 'https://nyotasprings.com/wp-content/uploads/'
ALLOWED = re.compile(r'^https://nyotasprings\.com/wp-content/uploads/[^?#]+\.(?:jpe?g|png|webp)$', re.I)
IMG_NO = re.compile(r'IMG_(\d+)', re.I)
SETS = {'8':'breakfast','7':'executive-room','9':'outside-lunch','6':'triple-room','5':'twin-room','10':'bush-breakfast'}


def load_categories():
    src = (ROOT / 'lib' / 'collections.ts').read_text()
    blocks = re.findall(r'\{\s*id:\s*"([^"]+)"(.*?)\n\s*\},', src, re.S)
    categories = []
    for cid, block in blocks:
        def field(name):
            m = re.search(r'\b'+name+r':\s*(\d+|"[^"]+"|root\s*\+\s*"[^"]+")', block)
            return m.group(1) if m else None
        lo, hi, title = field('min'), field('max'), field('title')
        start, end = field('start'), field('end')
        if not all([lo, hi, title, start, end]):
            continue
        url = lambda value: BASE + re.search(r'"([^"]+)"', value).group(1)
        categories.append({'id':cid,'title':json.loads(title),'min':int(lo),'max':int(hi),'start':url(start),'end':url(end)})
    if not categories:
        raise RuntimeError('Could not parse lib/collections.ts; check it matches your uploaded file')
    featured = re.search(r'EXTRA_FEATURED_IMAGE\s*=\s*root\s*\+\s*"([^"]+)"', src)
    return categories, BASE + featured.group(1) if featured else None


def classify(url, categories):
    sm = re.search(r'/nyota-gallery/set-(\d+)/', url, re.I)
    if sm and sm.group(1) in SETS:
        return SETS[sm.group(1)]
    m = IMG_NO.search(url.split('/')[-1])
    if not m: return None
    n = int(m.group(1))
    return next((c['id'] for c in categories if c['min'] <= n <= c['max']), None)


def read_url(url, max_bytes=5_000_000, timeout=18):
    req = urllib.request.Request(url, headers={'User-Agent':'NyotaSpringsGalleryCuration/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        data = response.read(max_bytes+1)
    if len(data)>max_bytes: raise ValueError('Download exceeds size cap')
    return data


def discover(categories, featured, offline=False, pages=50):
    collected={}
    warnings=[]
    def add(url, width=1200, height=900, thumb=None, source='seed', override=None):
        if not url or not ALLOWED.match(url):return
        category = override or classify(url, categories)
        if not category:return
        filename = url.split('/')[-1]
        item={'id':url, 'src':url, 'title':next(c['title'] for c in categories if c['id']==category),
              'category':category,'width':width or 1200,'height':height or 900,'filename':filename,
              'thumbnail':thumb or url,'discovered_from':source}
        if url not in collected or source=='wp-api':collected[url]=item
    if not offline:
        for page in range(1,pages+1):
            url=f'https://nyotasprings.com/wp-json/wp/v2/media?media_type=image&per_page=100&page={page}&_fields=id,source_url,media_details'
            try:
                batch=json.loads(read_url(url, max_bytes=6_000_000, timeout=18))
                if not isinstance(batch,list): raise ValueError('Invalid WordPress media response')
            except Exception as exc:
                warnings.append(f'WordPress page {page}: {exc}')
                break
            for attachment in batch:
                details=attachment.get('media_details') or {}
                sizes=details.get('sizes') or {}
                thumbnail=next((sizes[key]['source_url'] for key in ('medium','thumbnail','medium_large') if sizes.get(key,{}).get('source_url')),None)
                add(attachment.get('source_url'),details.get('width'),details.get('height'),thumbnail,'wp-api')
            if len(batch)<100:break
            if page == pages:
                warnings.append(f'Hit page cap ({pages}) while WordPress still returned 100 items')
    extrasfile=DATA/'extra-photos.json'
    if extrasfile.exists():
        for item in json.loads(extrasfile.read_text()):
            add(item.get('src'),item.get('width',1200),item.get('height',900),source='extra-photos',override=item.get('category'))
    for c in categories:
        for edge in ('start','end'):add(c[edge], source='boundary',override=c['id'])
    if featured:add(featured,source='featured',override='twin-room')
    entries=sorted(collected.values(),key=lambda p:(next((i for i,c in enumerate(categories) if c['id']==p['category']),99),image_number(p['filename']),p['filename']))
    return entries,warnings


def image_number(name):
    m=IMG_NO.search(name)
    return int(m.group(1)) if m else -1


def normalized(name):
    return re.sub(r'(?:-scaled|-HDR|-\d+x\d+)(?=\.)','',name,flags=re.I).casefold()


def hamming(a,b):
    return bin(a ^ b).count("1")


def hash_image(url):
    from PIL import Image,ImageOps
    with Image.open(io.BytesIO(read_url(url, max_bytes=12_000_000))) as img:
        img=ImageOps.exif_transpose(img).convert('L').resize((9,8))
        pix=list(img.getdata())
    bits=0
    for y in range(8):
        for x in range(8):bits=(bits<<1)|int(pix[y*9+x]>pix[y*9+x+1])
    return bits


def candidates(entries, scan_images=True):
    hashes={}; errors=[]; pairs=[]; seen=set()
    if scan_images:
        try:import PIL
        except ImportError:raise RuntimeError('Install Pillow: python3 -m pip install Pillow')
        for i,p in enumerate(entries,1):
            try:hashes[p['src']]=hash_image(p['thumbnail'])
            except Exception as exc:errors.append(f"{p['filename']}: {exc}")
            if i%25==0:print(f'Hashed {i}/{len(entries)} thumbnails',flush=True)
    by_category=defaultdict(list)
    for item in entries:by_category[item['category']].append(item)
    for category, photos in by_category.items():
        for i,a in enumerate(photos):
            for b in photos[i+1:]:
                reasons=[];distance=None
                if normalized(a['filename'])==normalized(b['filename']):reasons.append('filename-variant')
                aa,bb=hashes.get(a['src']),hashes.get(b['src'])
                if aa is not None and bb is not None:
                    distance=hamming(aa,bb)
                    if distance<=6:reasons.append('perceptual-similarity')
                an,bn=image_number(a['filename']),image_number(b['filename'])
                if an>=0 and bn>=0 and abs(an-bn)<=2 and an!=bn:
                    reasons.append('neighboring-shots-review')
                if not reasons:continue
                key=tuple(sorted([a['src'],b['src']]))
                if key in seen:continue
                seen.add(key)
                pairs.append({'category':category,'a':a['filename'],'b':b['filename'],
                              'url_a':a['src'],'url_b':b['src'],'thumb_a':a['thumbnail'],
                              'thumb_b':b['thumbnail'],'hamming_distance':distance,'reasons':reasons,
                              'decision':'review'})
    pairs.sort(key=lambda x:(x['category'],x['a'],x['b']))
    return pairs,errors


def build_html(entries, pairs, warnings, errors):
    def h(s):return html.escape(str(s),quote=True)
    cards=[]
    for pair in pairs:
        cards.append(f'''<article class="pair"><div class="photos"><div><img loading="lazy" src="{h(pair['thumb_a'])}" alt="First photo"><p>{h(pair['a'])}</p></div><div><img loading="lazy" src="{h(pair['thumb_b'])}" alt="Second photo"><p>{h(pair['b'])}</p></div></div><p><b>{h(pair['category'])}</b> · {h(', '.join(pair['reasons']))} · perceptual distance: {h(pair['hamming_distance'])}</p><label>Exclude from public gallery <select data-url="{h(pair['url_b'])}" aria-label="Exclude second image"><option value="keep">Neither (keep both)</option><option value="exclude">Second photo</option></select></label><label><select data-url="{h(pair['url_a'])}" aria-label="Exclude first image"><option value="keep">Keep first</option><option value="exclude">Exclude first photo</option></select></label></article>''')
    warning_text='; '.join(warnings+errors)
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nyota Photo Review</title><style>body{{font-family:system-ui;background:#f5f2e9;color:#20352c;max-width:1120px;margin:auto;padding:24px}}h1{{font-family:Georgia,serif}}.pair{{background:white;margin:16px 0;padding:18px;border-radius:12px}}.photos{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}}img{{width:100%;aspect-ratio:4/3;object-fit:cover;background:#ddd}}select,button{{padding:12px;margin:8px;background:#fff;border:1px solid #20352c;border-radius:6px}}button{{background:#20352c;color:white;cursor:pointer}}label{{display:inline-block}}.notice{{background:#fff3d9;padding:14px;overflow-wrap:anywhere}}@media(max-width:600px){{.photos{{grid-template-columns:1fr}}}}</style></head><body><h1>Nyota Springs — Photo Review</h1><p>{len(entries)} discovered images · {len(pairs)} pairs needing consideration. No WordPress originals are modified.</p><p>Adjacent shots are <b>review suggestions</b>, not proven duplicates. Inspect both photos before excluding either.</p><div class="notice">Discovery/thumbnail warnings: {h(warning_text or 'None')}</div><button id="download">Download decisions.json</button>{''.join(cards) if cards else '<p>No duplicate candidates detected in this inventory. Run online image scanning for visual comparisons.</p>'}<script>document.getElementById('download').onclick=()=>{{const excludes=[...document.querySelectorAll('select')].filter(x=>x.value==='exclude').map(x=>x.dataset.url);const payload={{exclude:[...new Set(excludes)]}};const blob=new Blob([JSON.stringify(payload,null,2)],{{type:'application/json'}});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='decisions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}};</script></body></html>'''


def scan(args):
    categories,featured=load_categories()
    entries,warnings=discover(categories,featured,args.offline,args.pages)
    pairs,errors=candidates(entries,not args.skip_similarity and not args.offline)
    REVIEW.mkdir(exist_ok=True)
    (REVIEW/'inventory.json').write_text(json.dumps(entries,indent=2)+'\n')
    (REVIEW/'duplicate-candidates.json').write_text(json.dumps(pairs,indent=2)+'\n')
    (REVIEW/'review.html').write_text(build_html(entries,pairs,warnings,errors))
    with (REVIEW/'duplicate-candidates.csv').open('w',newline='') as out:
        writer=csv.DictWriter(out,fieldnames=['category','a','b','url_a','url_b','reasons','hamming_distance','decision'])
        writer.writeheader()
        for p in pairs:writer.writerow({k:','.join(v) if isinstance(v,list) else v for k,v in p.items() if k in writer.fieldnames})
    report={'photos':len(entries),'pairs':len(pairs),'wp_discovery_complete':not warnings and not args.offline,
            'similarity_scan_complete':not args.skip_similarity and not args.offline and not errors,
            'warnings':warnings,'thumbnail_errors':errors}
    (REVIEW/'scan-summary.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    print(f'Open {REVIEW / "review.html"}')


def apply(args):
    inventory=REVIEW/'inventory.json'
    if not inventory.exists():raise SystemExit('Run scan first to create curation-review/inventory.json')
    if not args.decisions.exists():raise SystemExit(f'Missing {args.decisions}; export it from review.html')
    report=json.loads((REVIEW/'scan-summary.json').read_text())
    if not report['wp_discovery_complete'] and not args.allow_partial:
        raise SystemExit('WordPress discovery incomplete. Re-run online or add --allow-partial to explicitly approve a partial inventory.')
    entries=json.loads(inventory.read_text())
    decisions=json.loads(args.decisions.read_text())
    excluded=set(decisions.get('exclude',[]))
    urls={p['src'] for p in entries}
    unknown=excluded-urls
    if unknown:raise SystemExit(f'Decisions contain unknown URLs: {list(unknown)[:3]}')
    approved=[{k:p[k] for k in ('id','src','title','category','width','height','filename')} for p in entries if p['src'] not in excluded]
    if not approved:raise SystemExit('Refusing to publish empty approved gallery')
    (DATA/'approved-photos.json').write_text(json.dumps(approved,indent=2)+'\n')
    print(f'Approved {len(approved)} photographs, excluded {len(excluded)}; wrote data/approved-photos.json')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='command',required=True)
    scanp=sub.add_parser('scan',help='Build source inventory, similarity review and review webpage')
    scanp.add_argument('--offline',action='store_true',help='Use only exact links known to project; no network')
    scanp.add_argument('--pages',type=int,default=50,help='Max WordPress REST pages (100 items/page)')
    scanp.add_argument('--skip-similarity',action='store_true',help='Skip image downloads and dHash')
    ap=sub.add_parser('apply',help='Apply reviewed decisions to gallery manifest')
    ap.add_argument('--decisions',type=Path,default=REVIEW/'decisions.json')
    ap.add_argument('--allow-partial',action='store_true',help='Explicitly approve incomplete inventory')
    args=parser.parse_args()
    (scan if args.command=='scan' else apply)(args)

if __name__=='__main__':main()
