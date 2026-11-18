"""Scrape the full montana-cans.cz (Bagisto) catalogue in CS/CZK and EN/EUR, incl. all variants."""
import re, json, html, subprocess, sys, os
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://www.montana-cans.cz'
WD = os.path.dirname(os.path.abspath(__file__))
JAR = {'cs': f'{WD}/jar_cs.txt', 'en': f'{WD}/jar_en.txt'}

def curl(url, jar=None, write=False):
    cmd = ['curl', '-sSL', '-m', '45', '--retry', '3']
    if jar:
        cmd += ['-b', jar] + (['-c', jar] if write else [])
    cmd.append(url)
    return subprocess.run(cmd, capture_output=True, text=True).stdout

def init_sessions():
    for f in JAR.values():
        if os.path.exists(f): os.remove(f)
    curl(f'{BASE}/?locale=cs&currency=CZK', JAR['cs'], True)
    curl(f'{BASE}/?locale=en&currency=EUR', JAR['en'], True)

# ---------- categories ----------
def nav_tree(lang):
    s = curl(BASE + '/', JAR[lang])
    tree = []
    # top menu items Barvy / Zboží with dropdown groups
    for m in re.finditer(r'<div class="list-title">\s*<a href="([^"]+)">([^<]+)</a>', s):
        url, label = m.group(1), html.unescape(m.group(2)).strip()
        tree.append((url.replace(BASE + '/', ''), label))
    # sub items inside zbozi groups (category links only, not products)
    subs = []
    for m in re.finditer(r'<a href="' + re.escape(BASE) + r'/([a-z0-9-]+/[a-z0-9/-]+)">([^<]+)</a>', s):
        subs.append((m.group(1), html.unescape(m.group(2)).strip()))
    return tree, subs

def listing(path, lang='cs'):
    urls = []
    for page in range(1, 15):
        s = curl(f'{BASE}/{path}' + (f'?page={page}' if page > 1 else ''), JAR[lang])
        found = re.findall(r'<div class="product-card">.*?<a href="([^"]+)"', s, re.S)
        new = [u for u in found if u not in urls]
        urls += new
        if not new or f'page={page + 1}' not in s:
            break
    return urls

# ---------- product ----------
ALLOWED = {'p', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'br', 'table', 'tr', 'td', 'th', 'tbody', 'thead'}
def clean_html(h):
    h = re.sub(r'<(script|style|iframe)[^>]*>.*?</\1>', '', h, flags=re.S | re.I)
    h = re.sub(r'<h1[^>]*>.*?</h1>', '', h, flags=re.S | re.I)
    def tag(m):
        close, name = m.group(1), m.group(2).lower()
        if name == 'h5' or name == 'h6': name = 'h4'
        if name not in ALLOWED: return ''
        return f'<{close}{name}>' if name != 'br' else '<br>'
    h = re.sub(r'<(/?)([a-zA-Z0-9]+)[^>]*>', tag, h)
    h = h.replace('&nbsp;', ' ')
    h = re.sub(r'<(p|li|h[234])>\s*</\1>', '', h)
    h = re.sub(r'\s+', ' ', h).strip()
    return h

def section(s, cls):
    i = s.find(f'class="{cls}"')
    if i < 0: return ''
    i = s.find('>', i) + 1
    # walk divs to matching close
    depth, j = 1, i
    for m in re.finditer(r'<(/?)div\b', s[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            j = i + m.start(); break
    return s[i:j]

def json_after(s, key):
    i = s.find(key)
    if i < 0: return None
    i = s.find('{', i) if s[s.find(key) + len(key):].lstrip()[:1] == '{' else s.find('[', i)
    obj, _ = json.JSONDecoder().raw_decode(s[i:])
    return obj

def num(t):
    t = t.replace('\xa0', '').replace(' ', '')
    m = re.search(r'([\d.,]+)', t)
    if not m: return None
    v = m.group(1)
    if '€' in t or '.' in v and ',' not in v:
        v = v.replace(',', '')
    else:
        v = v.replace('.', '').replace(',', '.')
    try: return float(v)
    except ValueError: return None

def parse(s):
    d = {}
    m = re.search(r'name="product_id" value="(\d+)"', s); d['pid'] = int(m.group(1)) if m else None
    m = re.search(r'<h1 class="product-title">\s*(.*?)\s*</h1>', s, re.S); d['name'] = html.unescape(re.sub(r'\s+', ' ', m.group(1))).strip() if m else ''
    pp = section(s, 'product-price')
    d['price_label'] = html.unescape(re.sub(r'<[^>]+>', '', re.search(r'class="price-label">(.*?)</span>', pp).group(1))).strip() if 'price-label' in pp else ''
    sp = re.search(r'class="special-price">(.*?)</span>', pp); rp = re.search(r'class="regular-price">(.*?)</span>', pp)
    d['final'] = num(html.unescape(sp.group(1))) if sp and sp.group(1).strip() else None
    d['regular'] = num(html.unescape(rp.group(1))) if rp and rp.group(1).strip() else None
    if d['final'] is None:
        m = re.search(r'class="(?:final-price|price)">(.*?)</span>', pp)
        d['final'] = num(html.unescape(m.group(1))) if m else None
    st = re.search(r'class="stock-status[^"]*">\s*(.*?)\s*<', s, re.S)
    d['stock_text'] = html.unescape(st.group(1)).strip() if st else ''
    d['short'] = clean_html(section(s, 'short-description'))
    d['desc'] = clean_html(section(s, 'full-description'))
    imgs = json_after(s, 'images:')
    d['images'] = [i['large_image_url'] for i in imgs] if isinstance(imgs, list) else []
    dl = section(s, 'product-download-section')
    d['downloads'] = [{'url': u, 'label': html.unescape(re.sub(r'\s+', ' ', t)).strip()} for u, t in re.findall(r'<a href="([^"]+)">(.*?)</a>', dl, re.S)]
    d['video'] = bool(re.search(r'id="thumb-gallery-video"', s))
    cfg = None
    i = s.find('config: {')
    if i > 0:
        cfg, _ = json.JSONDecoder().raw_decode(s[i + 8:])
    d['config'] = cfg
    return d

def scrape_product(url):
    cs = parse(curl(url, JAR['cs']))
    en = parse(curl(url, JAR['en']))
    return url, cs, en

def parse_url(args):
    url, lang = args
    return url, lang, parse(curl(url, JAR[lang]))

def main():
    init_sessions()
    cats = {}
    with ThreadPoolExecutor(6) as ex:
        for lang in ('cs', 'en'):
            tree, subs = nav_tree(lang)
            paths = []
            for p, label in tree + subs:
                if p.startswith(('customer', 'checkout', 'page')) or p in paths: continue
                paths.append(p)
            lists = dict(zip(paths, ex.map(lambda p: listing(p, lang), paths)))
            labels = dict(tree + subs)
            cats[lang] = {p: {'label': labels[p], 'products': lists[p]} for p in paths}
            print(lang, 'categories', len(paths), 'products', len(set(u for l in lists.values() for u in l)), file=sys.stderr)
        jobs = [(u, lang) for lang in ('cs', 'en') for u in sorted(set(u for c in cats[lang].values() for u in c['products']))]
        out = {'cs': {}, 'en': {}}
        for n, (url, lang, d) in enumerate(ex.map(parse_url, jobs), 1):
            out[lang][url] = d
            if n % 50 == 0: print(n, '/', len(jobs), file=sys.stderr)
    json.dump({'categories': cats, 'products': out}, open(f'{WD}/catalogue_raw.json', 'w'), ensure_ascii=False)
    print('done', file=sys.stderr)

if __name__ == '__main__':
    main()
