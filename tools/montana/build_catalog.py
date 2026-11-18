"""Turn catalogue_raw.json into the site's catalog.json + download/convert all product images."""
import json, re, os, sys, subprocess, statistics, io, shutil
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

WD = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1]
RAW = json.load(open(f'{WD}/catalogue_raw.json'))
IMGDIR = f'{SITE}/assets/img/p'
CACHE = f'{WD}/imgcache'
os.makedirs(CACHE, exist_ok=True)

# ---- my own (content-correct) category structure -> source paths ----
CATS = [
 ('spreje', 'Spreje', 'Spray paint', ['barvy/klasicke-spreje', 'barvy/spreje-s-efektem', 'barvy/technicke-spreje', 'barvy/limitovana-edice'], [
   ('klasicke', 'Klasické spreje', 'Classic sprays', 'barvy/klasicke-spreje'),
   ('efekty', 'Efektové spreje', 'Effect sprays', 'barvy/spreje-s-efektem'),
   ('technicke', 'Technické spreje', 'Technical sprays', 'barvy/technicke-spreje'),
   ('limitovane', 'Limitované edice', 'Limited editions', 'barvy/limitovana-edice')]),
 ('fixy', 'Fixy', 'Markers', ['zbozi/fixy-a-naplne'], [
   ('acrylic', 'Acrylic fixy a náplně', 'Acrylic markers & refills', 'zbozi/fixy-a-naplne/acrylic-fixy-a-naplne'),
   ('acrylic-sety', 'Acrylic sety', 'Acrylic sets', 'zbozi/fixy-a-naplne/acrylic-sety'),
   ('prazdne', 'Prázdné acrylic fixy', 'Empty acrylic markers', 'zbozi/fixy-a-naplne/permanent-fixy'),
   ('hroty', 'Acrylic hroty', 'Acrylic tips', 'zbozi/fixy-a-naplne/sketchliner'),
   ('displeje', 'Displeje', 'Displays', 'zbozi/fixy-a-naplne/alpha-fixy'),
   ('black-bold', 'Black & Bold fixy', 'Black & Bold markers', 'zbozi/fixy-a-naplne/black-fixy-a-naplne'),
   ('black-prazdne', 'Black prázdné fixy a hroty', 'Black empty markers & tips', 'zbozi/fixy-a-naplne/montana-sketchliner-')]),
 ('kresleni', 'Kreslení', 'Drawing', ['zbozi/bloky'], [
   ('sketchliner', 'Sketchlinery', 'Sketchliners', 'zbozi/bloky/blackbook'),
   ('blackbook', 'Blackbooky a bloky', 'Blackbooks & notebooks', 'zbozi/bloky/notebook')]),
 ('trysky', 'Trysky', 'Caps', ['zbozi/trysky'], [
   ('level', 'Level trysky', 'Level caps', 'zbozi/trysky/montana-level-trysky'),
   ('skinny', 'Tenké trysky', 'Skinny caps', 'zbozi/trysky/skinny-tenke-trysky-'),
   ('fat', 'Široké trysky', 'Fat caps', 'zbozi/trysky/fat-tluste-trysky'),
   ('efektove', 'Speciální trysky', 'Special caps', 'zbozi/trysky/specialni-efektove-trysky')]),
 ('obleceni', 'Oblečení', 'Clothing', ['zbozi/obleceni'], [
   ('tricka', 'Trička', 'T-shirts', 'zbozi/obleceni/tricka'),
   ('mikiny', 'Mikiny', 'Hoodies', 'zbozi/obleceni/mikiny'),
   ('doplnky', 'Čepice a doplňky', 'Headwear & accessories', 'zbozi/obleceni/doplnky-k-obleceni'),
   ('extra', 'Extra nabídka', 'Extra', 'zbozi/obleceni/extra-nabidka')]),
 ('doplnky', 'Doplňky', 'Accessories', ['zbozi/doplnky'], [
   ('prislusenstvi', 'Příslušenství a samolepky', 'Accessories & stickers', 'zbozi/doplnky/prislusenstvi'),
   ('rukavice', 'Rukavice a ochrana', 'Gloves & protection', 'zbozi/doplnky/rukavice'),
   ('tasky', 'Tašky', 'Bags', 'zbozi/doplnky/ochranne-prostredky'),
   ('stojany', 'Stojany na barvy', 'Can racks', 'zbozi/doplnky/tasky')]),
]

FIX = [(r'^Montna ', 'Montana '), (r'^Kopie ', ''), (r'Tri4ko', 'Tričko'), (r'Tríčko', 'Tričko'), (r'Prázndý', 'Prázdný'),
       (r'ACRILIC', 'ACRYLIC'), (r'Standart', 'Standard'), (r'\s+', ' ')]
def fixname(n):
    for a, b in FIX: n = re.sub(a, b, n)
    return n.strip()

def slug(url): return url.rstrip('/').rsplit('/', 1)[1]

cs_by_pid = {v['pid']: (u, v) for u, v in RAW['products']['cs'].items()}
en_by_pid = {v['pid']: (u, v) for u, v in RAW['products']['en'].items()}
cs_cats = RAW['categories']['cs']

# EUR rate from matched simple products
ratios = [cs['final'] / en_by_pid[pid][1]['final'] for pid, (u, cs) in cs_by_pid.items()
          if pid in en_by_pid and cs['final'] and en_by_pid[pid][1]['final']]
RATE = statistics.median(ratios)
print('EUR rate', RATE, file=sys.stderr)
eur = lambda czk: round(czk / RATE, 2)

url_cat = {}
for key, cs_l, en_l, tops, subs in CATS:
    for t in tops:
        for u in cs_cats.get(t, {}).get('products', []):
            url_cat.setdefault(u, [key, None])
    for sk, _, _, path in subs:
        for u in cs_cats.get(path, {}).get('products', []):
            e = url_cat.setdefault(u, [key, None])
            if e[0] == key: e[1] = sk

def img_job(args):
    url, dst = args
    if os.path.exists(dst): return dst
    cache = os.path.join(CACHE, re.sub(r'[^a-zA-Z0-9.]', '_', url[-90:]))
    def ok(f):
        try: Image.open(f).verify(); return True
        except Exception: return False
    if not os.path.exists(cache) or not ok(cache):
        for alt in (url, url.replace('/cache/large/', '/cache/original/'), url.replace('/cache/large/', '/cache/medium/')):
            subprocess.run(['curl', '-sSL', '-m', '60', '--retry', '3', '-o', cache, alt])
            if ok(cache): break
    try:
        im = Image.open(cache).convert('RGB')
        im.thumbnail((720, 720))
        im.save(dst, 'WEBP', quality=80, method=5)
        return dst
    except Exception as e:
        print('IMG FAIL', url, e, file=sys.stderr)
        return None

products, jobs = [], []
os.makedirs(IMGDIR, exist_ok=True)
for pid, (url, cs) in sorted(cs_by_pid.items()):
    en = en_by_pid.get(pid, (None, None))[1]
    cat, sub = url_cat.get(url, ['doplnky', None])
    p = {
        'id': slug(url), 'pid': pid, 'cat': cat, 'sub': sub,
        'name': {'cs': fixname(cs['name']), 'en': fixname(en['name']) if en else fixname(cs['name'])},
        'short': {'cs': cs['short'], 'en': en['short'] if en else ''},
        'desc': {'cs': cs['desc'], 'en': en['desc'] if en else ''},
        'video': cs['video'],
        'dl': [d['url'] for d in cs['downloads']],
        'src': url,
    }
    if not en: p['noEn'] = True
    # images
    p['img'] = []
    for n, iu in enumerate(cs['images'][:8]):
        dst = f'{IMGDIR}/{pid}-{n}.webp'
        jobs.append((iu, dst)); p['img'].append(f'assets/img/p/{pid}-{n}.webp')
    cfg, cfg_en = cs['config'], (en or {}).get('config')
    if cfg:
        a = cfg['attributes'][0]
        a_en = cfg_en['attributes'][0] if cfg_en else None
        en_opt = {o['id']: o for o in a_en['options']} if a_en else {}
        values = []
        for o in a['options']:
            sc = o.get('spray_colors') or {}
            v = {'id': o['id'], 'l': o['label']}
            if a['swatch_type'] == 'color' or sc:
                v.update({'n': sc.get('spray_color_name') or o['label'], 'c': sc.get('spray_color_code') or '',
                          'h': sc.get('spray_color_hex') or o.get('swatch_value') or '#ccc'})
                if sc.get('spray_color_gradient_hex'): v['g'] = sc['spray_color_gradient_hex']
                if sc.get('spray_color_inverse'): v['i'] = 1
            if o['id'] in en_opt and en_opt[o['id']]['label'] != o['label']: v['le'] = en_opt[o['id']]['label']
            values.append(v)
        order = {o['id']: k for k, o in enumerate(a['options'])}
        variants = []
        for vid, opts in cfg['index'].items():
            oid = list(opts.values())[0]
            czk = cfg['variant_prices'][vid]['final_price']['price']
            reg = cfg['variant_prices'][vid]['regular_price']['price']
            e = cfg_en['variant_prices'].get(vid, {}).get('final_price', {}).get('price') if cfg_en else None
            variants.append({'v': int(vid), 'o': oid, 'czk': round(czk, 2), 'eur': round(e, 2) if e else eur(czk),
                             'q': int(cfg.get('variant_stock_qty', {}).get(vid, 0) or 0),
                             **({'reg': round(reg, 2)} if reg and reg > czk else {})})
        variants.sort(key=lambda x: order.get(x['o'], 0))
        p['opt'] = {'type': 'color' if a['swatch_type'] == 'color' else 'size',
                    'label': {'cs': a['label'], 'en': a_en['label'] if a_en else a['label']}, 'values': values}
        p['var'] = variants
        live = [x for x in variants if x['q'] > 0] or variants
        p['czk'] = min(x['czk'] for x in live); p['eur'] = min(x['eur'] for x in live)
        p['from'] = len({x['czk'] for x in variants}) > 1 or True
        p['stock'] = sum(x['q'] for x in variants)
    else:
        p['czk'] = cs['final']
        p['eur'] = en['final'] if en and en['final'] else eur(cs['final'])
        if cs['regular'] and cs['regular'] > cs['final']:
            p['reg'] = {'czk': cs['regular'], 'eur': en['regular'] if en and en['regular'] else eur(cs['regular'])}
        p['stock'] = 0 if re.search(r'vyprod|není|nedostup', cs['stock_text'], re.I) else 1
        p['from'] = False
    products.append(p)

print('downloading', len(jobs), 'images', file=sys.stderr)
with ThreadPoolExecutor(8) as ex:
    res = list(ex.map(img_job, jobs))
ok = {d for d in res if d}
for p in products:
    p['img'] = [i for i in p['img'] if f'{SITE}/{i}' in ok]

cats_out = [{'key': k, 'cs': c, 'en': e, 'subs': [{'key': sk, 'cs': sc, 'en': se} for sk, sc, se, _ in subs]} for k, c, e, _, subs in CATS]
data = {'generated': '2026-11-18', 'rate': round(RATE, 4), 'cats': cats_out, 'products': products}
json.dump(data, open(f'{SITE}/data/catalog.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('products', len(products), 'variants', sum(len(p.get('var', [])) for p in products),
      'size', os.path.getsize(f'{SITE}/data/catalog.json') // 1024, 'KB', file=sys.stderr)
from collections import Counter
print(Counter((p['cat'], p['sub']) for p in products), file=sys.stderr)
