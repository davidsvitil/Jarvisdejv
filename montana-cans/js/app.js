/* Montana Cans CZ — storefront (vanilla JS, hash router, CS/EN, CZK/EUR, localStorage cart) */
(async () => {
  'use strict';

  /* ---------- settings ---------- */
  const SHOP = {
    email: 'shop@montana-cans.cz', info: 'info@montana-cans.cz',
    phone: '+420 727 890 835', phoneRaw: '+420727890835',
    instagram: 'https://www.instagram.com/montanacans.cz/',
    freeShipCZK: 3000, discountCZK: 5000,
    newsletter: 'https://montana-cans.us6.list-manage.com/subscribe/post?u=939bd67176d7051bfc075bf50&id=aa29d66b98',
    terms: 'https://www.montana-cans.cz/page/obchodni-podminky',
  };
  const PAGE = 24;

  // Featured carousel: product id -> big word, script line, stage colours, cut-out image
  const HERO = [
    { id: 'montana-black-400ml', word: 'BLACK', script: 'High Pressure', grad: ['#ff6a1a', '#2a0e02'], img: 'assets/img/hero/black-400ml.webp' },
    { id: 'montana-gold-400ml', word: 'GOLD', script: 'Low Pressure', grad: ['#d9b56a', '#2b1f08'], img: 'assets/img/hero/gold-400ml.webp' },
    { id: 'montana-blue-400ml', word: 'BLUE', script: 'Water Based', grad: ['#3f7bff', '#061636'], img: 'assets/img/hero/blue-400ml.webp' },
    { id: 'nightglow', word: 'GLOW', script: 'In the Dark', grad: ['#9dff6a', '#07220a'], img: 'assets/img/hero/nightglow-400ml.webp' },
    { id: 'montana-black-infra-400ml', word: 'INFRA', script: 'Fluo Edition', grad: ['#ff2d95', '#2a0318'], img: 'assets/img/hero/black-infra-400ml.webp' },
    { id: 'montana-ultra-wide-750ml', word: 'WIDE', script: 'Ultra Wide 750', grad: ['#ffd21a', '#2a2000'], img: 'assets/img/hero/ultra-wide-750ml.webp' },
    { id: 'fix15mm', word: 'ACRYLIC', script: 'Marker Edition', grad: ['#b98cff', '#1a0b33'], img: 'assets/img/hero/acrylic-fix-15mm.webp' },
    { id: 'montana-cap-set-level-1-6', word: 'CAPS', script: 'Level 1–6', grad: ['#9aa3ad', '#14171b'], img: 'assets/img/hero/cap-set-level-1-6.webp' },
    { id: 'montana-mikina-basic-black', word: 'HOODIE', script: 'Basic Black', grad: ['#6b6b6b', '#111111'], img: 'assets/img/hero/mikina-basic-black.webp' },
  ];
  const CAT_STYLE = {
    spreje:   { a: '#ff6a1a', b: '#2a0e02', img: 'assets/img/hero/black-400ml.webp', sub: 'BLACK · GOLD · BLUE' },
    fixy:     { a: '#b98cff', b: '#1a0b33', img: 'assets/img/hero/acrylic-fix-15mm.webp', sub: 'Acrylic · Bold · Black' },
    trysky:   { a: '#9aa3ad', b: '#14171b', img: 'assets/img/hero/cap-set-level-1-6.webp', sub: 'Level · Fat · Skinny' },
    obleceni: { a: '#6b6b6b', b: '#111111', img: 'assets/img/hero/mikina-basic-black.webp', sub: 'Hoodies · Tees · Caps' },
    kresleni: { a: '#3f7bff', b: '#061636', sub: 'Blackbook · Sketchliner' },
    doplnky:  { a: '#ffd21a', b: '#2a2000', sub: 'Bags · Gloves · Racks' },
  };
  const FEATURED = ['montana-blue-400ml', 'nightglow', 'fix15mm', 'montana-cap-set-level-1-6', 'montana-black-400ml-bombing-set', 'montana-mikina-basic-black', 'montana-blackbook-a4-krajina', 'montana-ultra-wide-750ml', 'montana-sketchliner-set', 'montana-gold-400ml'];

  /* ---------- data ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $('#main');
  main.innerHTML = '<section class="stage full"><div class="loading"><span class="script">loading…</span></div></section>';
  let DATA;
  try {
    DATA = await (await fetch('data/catalog.json', { cache: 'no-cache' })).json();
  } catch (e) {
    main.innerHTML = '<section class="stage full"><div class="loading">Katalog se nepodařilo načíst / Could not load catalogue.</div></section>';
    return;
  }
  const P = DATA.products;
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const CATS = DATA.cats;
  const catOf = k => CATS.find(c => c.key === k);
  const subOf = p => p.sub && catOf(p.cat).subs.find(s => s.key === p.sub);
  const heroOf = id => HERO.find(h => h.id === id);
  const HEROES = HERO.filter(h => byId[h.id]);

  /* ---------- locale & currency ---------- */
  const I18N = window.MC_I18N;
  const nav = (navigator.language || 'cs').toLowerCase();
  let LANG = localStorage.getItem('mc-lang') || (nav.startsWith('cs') || nav.startsWith('sk') ? 'cs' : 'en');
  let CUR = localStorage.getItem('mc-cur') || (LANG === 'cs' ? 'CZK' : 'EUR');
  const t = (k, vars) => {
    let s = (I18N[LANG] && I18N[LANG][k]) ?? I18N.cs[k] ?? k;
    if (vars && typeof s === 'string') for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
    return s;
  };
  const L = o => (o && (o[LANG] || o.cs)) || '';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = v => new Intl.NumberFormat(LANG === 'cs' ? 'cs-CZ' : 'en-IE', { style: 'currency', currency: CUR, minimumFractionDigits: CUR === 'CZK' ? 0 : 2, maximumFractionDigits: CUR === 'CZK' ? 0 : 2 }).format(v);
  const amount = (czk, eur) => CUR === 'CZK' ? czk : (eur ?? czk / DATA.rate);
  const money = (czk, eur) => fmt(amount(czk, eur));
  const czkMoney = czk => money(czk, czk / DATA.rate);
  const disp = n => n.replace(/^Montana\s+/i, '');
  const pName = p => L(p.name);
  const pad = n => String(n).padStart(2, '0');
  const root = document.documentElement;

  function setColors(a, b) {
    root.style.setProperty('--c1', a);
    root.style.setProperty('--c2', b);
    $('meta[name="theme-color"]').setAttribute('content', b);
  }
  const colorsFor = p => heroOf(p.id)?.grad || [CAT_STYLE[p.cat]?.a || '#ff6a1a', CAT_STYLE[p.cat]?.b || '#2a0e02'];
  const darken = (hex, f = .2) => {
    const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(x => Math.round(x * f).toString(16).padStart(2, '0')).join('');
  };
  const priceHtml = p => p.czk ? `${p.from ? `<small>${t('from')}</small>` : ''}${money(p.czk, p.eur)}${p.reg ? ` <s class="old">${money(p.reg.czk, p.reg.eur)}</s>` : ''}` : `<small>${t('priceOnRequest')}</small>`;
  const swatchBg = v => v.g ? `linear-gradient(135deg, ${v.h} 0%, ${v.g} 100%)` : v.h;

  /* ---------- cart ---------- */
  const lineOf = i => {
    const p = byId[i.id];
    const v = i.v ? p.var?.find(x => x.v === i.v) : null;
    const o = v ? p.opt.values.find(x => x.id === v.o) : null;
    return { p, v, o, czk: v ? v.czk : p.czk, eur: v ? v.eur : p.eur, max: v ? v.q : 99 };
  };
  const Cart = {
    items: JSON.parse(localStorage.getItem('mc-cart2') || '[]').filter(i => byId[i.id] && (!i.v || byId[i.id].var?.some(x => x.v === i.v))),
    save() { localStorage.setItem('mc-cart2', JSON.stringify(this.items)); renderBadge(); },
    add(id, qty = 1, v = null) {
      const hit = this.items.find(i => i.id === id && i.v === v);
      const max = lineOf({ id, v }).max || 99;
      if (hit) hit.qty = Math.min(max, hit.qty + qty); else this.items.push({ id, v, qty: Math.min(max, qty) });
      this.save();
      const b = $('#cartCount'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
      toast(`${t('added')} · ${disp(pName(byId[id]))}`);
    },
    set(idx, qty) {
      const max = lineOf(this.items[idx]).max || 99;
      if (qty < 1) this.items.splice(idx, 1); else this.items[idx].qty = Math.min(max, qty);
      this.save(); renderDrawer();
    },
    count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    totalCZK() { return this.items.reduce((s, i) => s + lineOf(i).czk * i.qty, 0); },
    total() { return this.items.reduce((s, i) => { const l = lineOf(i); return s + amount(l.czk, l.eur) * i.qty; }, 0); },
  };
  const renderBadge = () => { $('#cartCount').textContent = Cart.count(); };

  let toastT;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- chrome: pill menu & switches ---------- */
  const pill = $('#pill'), menuBtn = $('#menuBtn');
  const switches = () => `
    <div class="switch" role="group" aria-label="${t('language')}"><button data-lang="cs" class="${LANG === 'cs' ? 'on' : ''}">CZ</button><button data-lang="en" class="${LANG === 'en' ? 'on' : ''}">EN</button></div>
    <div class="switch" role="group" aria-label="${t('currency')}"><button data-cur="CZK" class="${CUR === 'CZK' ? 'on' : ''}">Kč</button><button data-cur="EUR" class="${CUR === 'EUR' ? 'on' : ''}">€</button></div>`;
  function renderChrome() {
    root.lang = LANG;
    $('.skip').textContent = t('skip');
    $('#cartBtn').setAttribute('aria-label', t('cart'));
    $('#drawerTitle').textContent = t('cart');
    const ico = { spreje: '◉', fixy: '✎', trysky: '◎', obleceni: '◇', kresleni: '▤', doplnky: '✦' };
    $('#pillMenu').innerHTML = `
      <a href="#/shop" class="tile wide">${t('shop')} <span class="chev">›</span></a>
      ${CATS.map(c => `<a href="#/shop/${c.key}" class="tile"><span class="ico">${ico[c.key] || '•'}</span>${esc(L(c))}</a>`).join('')}
      <a href="#/o-nas" class="tile"><span class="ico">i</span>${t('about')}</a>
      <a href="#/kontakt" class="tile"><span class="ico">✉</span>${t('contact')}</a>
      ${switches()}
      <div class="pill-menu-foot"><span>© 2026 Montana Cans CZ</span><a href="${SHOP.instagram}" target="_blank" rel="noopener">@montanacans.cz</a></div>`;
  }
  function toggleMenu(force) {
    const open = force ?? !pill.classList.contains('open');
    pill.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
  }
  menuBtn.addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });
  document.addEventListener('click', e => {
    const lb = e.target.closest('[data-lang]'), cb = e.target.closest('[data-cur]');
    if (lb) {
      e.preventDefault();
      const was = LANG; LANG = lb.dataset.lang; localStorage.setItem('mc-lang', LANG);
      if (!localStorage.getItem('mc-cur-set') && was !== LANG) { CUR = LANG === 'cs' ? 'CZK' : 'EUR'; localStorage.setItem('mc-cur', CUR); }
      rerender(); return;
    }
    if (cb) { e.preventDefault(); CUR = cb.dataset.cur; localStorage.setItem('mc-cur', CUR); localStorage.setItem('mc-cur-set', '1'); rerender(); return; }
    if (!pill.contains(e.target)) toggleMenu(false);
  });
  function rerender() {
    const y = window.scrollY, open = pill.classList.contains('open');
    renderChrome(); route(true); renderDrawer();
    if (open) toggleMenu(true);
    window.scrollTo(0, y);
  }

  /* ---------- drawer ---------- */
  const drawer = $('#drawer'), scrim = $('#scrim');
  function openDrawer() {
    renderDrawer(); scrim.hidden = false;
    requestAnimationFrame(() => { scrim.classList.add('show'); drawer.classList.add('open'); });
    drawer.setAttribute('aria-hidden', 'false'); toggleMenu(false);
    setTimeout(() => $('#drawerClose').focus(), 50);
  }
  function closeDrawer() {
    scrim.classList.remove('show'); drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => { scrim.hidden = true; }, 300);
  }
  $('#cartBtn').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);

  let checkoutStep = false;
  function renderDrawer() {
    const body = $('#drawerBody');
    if (!Cart.items.length) {
      checkoutStep = false;
      body.innerHTML = `<div class="drawer-empty"><span class="script">${t('emptyCart')}</span><p>${t('emptyCartText')}</p><a class="btn" href="#/shop" data-close>${t('toShop')}</a></div>`;
      return;
    }
    const tc = Cart.totalCZK();
    const left = Math.max(0, SHOP.freeShipCZK - tc);
    const lines = Cart.items.map((i, idx) => {
      const { p, o, czk, eur } = lineOf(i);
      return `<div class="line">
        <img src="${p.img[0] || ''}" alt="" loading="lazy">
        <div><a class="line-name" href="#/p/${p.id}" data-close>${esc(disp(pName(p)))}</a>
          ${o ? `<div class="line-var">${o.h ? `<i class="dot" style="background:${swatchBg(o)}"></i>` : ''}${esc(o.n || o.l)}${o.c ? ` · ${esc(o.c)}` : ''}</div>` : ''}
          <div class="qty"><button data-q="${idx}" data-d="-1" aria-label="${t('less')}">−</button><input value="${i.qty}" readonly aria-label="${t('qty')}"><button data-q="${idx}" data-d="1" aria-label="${t('more')}">+</button></div></div>
        <div class="line-right"><b>${fmt(amount(czk, eur) * i.qty)}</b><button class="line-del" data-del="${idx}">${t('remove')}</button></div>
      </div>`;
    }).join('');
    body.innerHTML = `${lines}
      <div class="ship">${left ? `${t('toFree')} <b>${czkMoney(left)}</b>` : `<b>${t('freeShip')}</b> – ${t('freeShipHave')}`}
        <div class="bar"><i style="width:${Math.min(100, tc / SHOP.freeShipCZK * 100)}%"></i></div></div>
      ${tc >= SHOP.discountCZK ? `<p class="fine">${t('discountNote', { amount: czkMoney(SHOP.discountCZK) })}</p>` : ''}
      <div class="sum"><span>${t('subtotal')}</span><b>${fmt(Cart.total())}</b></div>
      ${checkoutStep ? checkoutForm() : `<button class="btn accent" id="goCheckout">${t('continue')}</button>
      <p class="fine" style="margin-top:12px">${t('priceNote')}</p>`}`;
  }
  function checkoutForm() {
    return `<form class="checkout" id="checkout">
      <input class="field" name="name" placeholder="${t('name')}" required autocomplete="name">
      <input class="field" name="email" type="email" placeholder="${t('email')}" required autocomplete="email">
      <input class="field" name="phone" type="tel" placeholder="${t('phone')}" required autocomplete="tel">
      <div class="radios">
        <label class="radio"><input type="radio" name="ship" value="${t('pickup')}" checked> ${t('pickup')} <span>${t('free')}</span></label>
        <label class="radio"><input type="radio" name="ship" value="${t('delivery')}"> ${t('delivery')} <span>${Cart.totalCZK() >= SHOP.freeShipCZK ? t('free') : t('byTariff')}</span></label>
      </div>
      <textarea class="field" name="addr" placeholder="${t('address')}"></textarea>
      <div class="radios">
        <label class="radio"><input type="radio" name="pay" value="${t('bank')}" checked> ${t('bank')}</label>
        <label class="radio"><input type="radio" name="pay" value="${t('cod')}"> ${t('cod')}</label>
      </div>
      <label class="fine"><input type="checkbox" required> ${t('agree')} <a class="link" href="${SHOP.terms}" target="_blank" rel="noopener">${t('agreeTerms')}</a>.</label>
      <button class="btn accent" type="submit">${t('send')}</button>
      <p class="fine">${t('sendNote', { email: SHOP.email })}</p>
    </form>`;
  }
  $('#drawerBody').addEventListener('click', e => {
    const q = e.target.closest('[data-q]');
    if (q) { const i = +q.dataset.q; Cart.set(i, Cart.items[i].qty + +q.dataset.d); return; }
    const d = e.target.closest('[data-del]');
    if (d) { Cart.set(+d.dataset.del, 0); return; }
    if (e.target.id === 'goCheckout') { checkoutStep = true; renderDrawer(); $('#checkout input').focus(); return; }
    if (e.target.closest('[data-close]')) closeDrawer();
  });
  $('#drawerBody').addEventListener('submit', e => {
    if (e.target.id !== 'checkout') return;
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const rows = Cart.items.map(i => {
      const { p, o, czk, eur } = lineOf(i);
      return `• ${i.qty}× ${pName(p)}${o ? ` – ${o.n || o.l}${o.c ? ` (${o.c})` : ''}` : ''} [#${i.v || p.pid}] – ${fmt(amount(czk, eur) * i.qty)}`;
    }).join('\n');
    const text = `${t('mailHello')}\n\n${rows}\n\n${t('subtotal')}: ${fmt(Cart.total())} (${t('mailCur')}: ${CUR})\n${t('mailShip')}: ${f.ship}\n${t('mailPay')}: ${f.pay}\n\n${t('name')}: ${f.name}\n${t('email')}: ${f.email}\n${t('phone')}: ${f.phone}\n${t('mailNote')}: ${f.addr || '–'}\n\n${t('mailThanks')}`;
    location.href = `mailto:${SHOP.email}?subject=${encodeURIComponent(t('mailSubject') + ' – ' + f.name)}&body=${encodeURIComponent(text)}`;
    toast(t('opening'));
  });

  /* ---------- shared blocks ---------- */
  const swatchStrip = p => {
    if (p.opt?.type !== 'color') return '';
    const n = p.opt.values.length;
    return `<span class="strip" aria-label="${n} ${t('shades')}">${p.opt.values.slice(0, 7).map(v => `<i style="background:${swatchBg(v)}"></i>`).join('')}${n > 7 ? `<em>+${n - 7}</em>` : ''}</span>`;
  };
  const card = p => {
    const sub = subOf(p);
    const out = !p.stock;
    const quick = p.czk && !p.var && !out;
    return `<article class="card ${out ? 'out' : ''}">
      <a class="card-img" href="#/p/${p.id}">${p.img[0] ? `<img src="${p.img[0]}" alt="${esc(pName(p))}" loading="lazy">` : ''}${out ? `<span class="flag">${t('soldOut')}</span>` : p.reg ? '<span class="flag sale">Sale</span>' : ''}</a>
      <div class="card-body">
        <span class="card-tag">${esc(sub ? L(sub) : L(catOf(p.cat)))}</span>
        <a class="card-name" href="#/p/${p.id}">${esc(disp(pName(p)))}</a>
        ${swatchStrip(p)}
        ${p.opt?.type === 'size' ? `<span class="sizes">${p.opt.values.map(v => esc(v.l)).join(' · ')}</span>` : ''}
        <div class="card-price"><span>${priceHtml(p)}</span>${quick ? `<button class="add" data-add="${p.id}" aria-label="${t('addToCart')}: ${esc(pName(p))}">+</button>` : `<a class="add ghosty" href="#/p/${p.id}" aria-label="${esc(pName(p))}">›</a>`}</div>
      </div></article>`;
  };

  const ticker = () => {
    const items = t('ticker').map(s => s.replace('{free}', czkMoney(SHOP.freeShipCZK)).replace('{disc}', czkMoney(SHOP.discountCZK)));
    const row = items.map(x => `<span>${esc(x)}</span>`).join('');
    return `<div class="ticker" aria-label="${esc(items.join(', '))}"><div class="ticker-track" aria-hidden="true">${row}${row}</div></div>`;
  };

  const footer = () => `
    <section class="stage plain"><div class="stage-inner news" style="padding-top:var(--pad)">
      <div><span class="eyebrow">${t('mailing')}</span><div class="sec-head" style="margin:6px 0 0"><h2>${t('newShades')} <span class="script">${t('first')}</span></h2></div>
      <p style="color:var(--ink-2);margin:10px 0 0">${t('mailingText')}</p></div>
      <form action="${SHOP.newsletter}" method="post" target="_blank" rel="noopener">
        <label class="sr" for="nl">E-mail</label>
        <input class="field" id="nl" type="email" name="EMAIL" placeholder="you@email.com" required>
        <button class="btn" type="submit">${t('subscribe')}</button>
      </form>
    </div></section>
    <footer class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
      <div class="footer">
        <div><img class="logo" src="assets/img/logo.svg" alt="Montana Cans"><p style="margin:0;max-width:34ch">${t('footerAbout')}</p><div class="switches">${switches()}</div></div>
        <div><h4>${t('shop')}</h4><ul>${CATS.map(c => `<li><a href="#/shop/${c.key}">${esc(L(c))}</a></li>`).join('')}</ul></div>
        <div><h4>${t('info')}</h4><ul><li><a href="#/o-nas">${t('about')}</a></li><li><a href="#/kontakt">${t('contactPickup')}</a></li><li><a href="${SHOP.terms}" target="_blank" rel="noopener">${t('terms')}</a></li><li><a href="${SHOP.instagram}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
        <div><h4>${t('contact')}</h4><ul><li><a href="tel:${SHOP.phoneRaw}">${SHOP.phone}</a></li><li><a href="mailto:${SHOP.info}">${SHOP.info}</a></li><li>Volutová 2522/16, Praha 13</li><li>${LANG === 'cs' ? 'Po–Čt 9–16 · Pá 10–16' : 'Mon–Thu 9–16 · Fri 10–16'}</li></ul></div>
        <div class="footer-bottom"><span>© 2026 Montana-cans.cz · Václav Jung · IČO 63093464</span><span>${t('vatIncl')}${CUR === 'EUR' ? ` · 1 € ≈ ${DATA.rate.toFixed(2)} Kč` : ''}</span></div>
      </div>
      <div class="mega" aria-hidden="true">Montana</div>
    </div></footer>`;

  /* ---------- views ---------- */
  let cleanup = null;
  let heroIndex = 0;

  function viewHome() {
    let cur = heroIndex;
    const count = k => P.filter(p => p.cat === k).length;
    const featured = FEATURED.map(id => byId[id]).filter(Boolean);
    main.innerHTML = `
      <section class="stage full hero" aria-roledescription="carousel">
        <div class="hero-top">
          <div class="chips"><a class="chip on" href="#/shop">${t('all')} <small>${P.length}</small></a>${CATS.map(c => `<a class="chip" href="#/shop/${c.key}">${esc(L(c))} <small>${count(c.key)}</small></a>`).join('')}</div>
          <div class="counter" id="counter"></div>
        </div>
        <div class="ghost-word" id="ghost" aria-hidden="true"></div>
        <div class="track" id="track">
          ${HEROES.map((h, i) => `<div class="slide" data-i="${i}"><img src="${h.img}" alt="${esc(pName(byId[h.id]))}" ${i > 2 ? 'loading="lazy"' : ''}></div>`).join('')}
        </div>
        <div class="hero-foot">
          <div id="heroText" aria-live="polite"></div>
          <div class="hero-ctrl">
            <button class="round" id="prev" aria-label="${t('prev')}">‹</button>
            <button class="round" id="next" aria-label="${t('next')}">›</button>
            <a class="btn" id="discover" href="#/shop">${t('discover')} ›</a>
          </div>
        </div>
      </section>
      ${ticker()}
      <section class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow">${t('categories')}</span><h2>${t('pickWeapon')} <span class="script">${t('weapon')}</span></h2></div><a class="btn ghost" href="#/shop">${t('wholeRange')} ›</a></div>
        <div class="cats">
          ${CATS.map((c, i) => { const s = CAT_STYLE[c.key] || {}; return `<a class="cat ${i === 0 || i === CATS.length - 1 ? 'big' : ''}" href="#/shop/${c.key}" style="--a:${s.a};--b:${s.b}">
            <span class="chev">›</span><div><span>${esc(s.sub || '')}</span><br><b>${esc(L(c))}</b><br><span class="cnt">${count(c.key)} ${t('products')}</span></div>${s.img ? `<img src="${s.img}" alt="" loading="lazy">` : ''}</a>`; }).join('')}
        </div>
      </div></section>
      <section class="stage light"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow">${t('freshPick')}</span><h2>${t('freshDrop')} <span class="script" style="color:#141210">${t('drop')}</span></h2></div><a class="btn dark" href="#/shop">${t('shop')} ›</a></div>
        <div class="grid">${featured.map(card).join('')}</div>
      </div></section>
      <section class="stage"><div class="stage-inner story" style="padding-top:var(--pad)">
        <div class="big-year" aria-hidden="true">1995</div>
        <div>
          <span class="eyebrow" style="color:var(--ink-2)">${t('storyEyebrow')}</span>
          <div class="sec-head" style="margin:6px 0 18px"><h2>${t('storyTitle')} <span class="script">${t('storyScript')}</span></h2></div>
          <p>${t('storyText')}</p>
          <a class="btn" href="#/o-nas" style="margin-top:10px">${t('ourStory')} ›</a>
        </div>
      </div></section>
      <section class="perks">
        <div class="perk"><span class="num">01</span><b>${t('perk1')}</b><p>${t('perk1t')}</p></div>
        <div class="perk"><span class="num">02</span><b>${t('perk2')}</b><p>${t('perk2t', { amount: czkMoney(SHOP.freeShipCZK) })}</p></div>
        <div class="perk"><span class="num">03</span><b>${t('perk3')}</b><p>${t('perk3t', { amount: czkMoney(SHOP.discountCZK) })}</p></div>
        <div class="perk"><span class="num">04</span><b>${t('perk4')}</b><p>${t('perk4t')}</p></div>
      </section>
      ${footer()}`;

    const track = $('#track'), slides = $$('.slide', track);
    function layout() {
      const w = track.clientWidth;
      const step = w < 600 ? w * 0.36 : Math.min(w * 0.24, 340);
      const n = HEROES.length;
      slides.forEach((s, i) => {
        let d = i - cur;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        const ad = Math.abs(d);
        s.style.setProperty('--off', d === 0 ? 0 : Math.sign(d) * (step * (ad === 1 ? 1 : ad === 2 ? 1.75 : 2.4)));
        s.style.setProperty('--s', ad === 0 ? 1 : ad === 1 ? .62 : ad === 2 ? .46 : .3);
        s.style.setProperty('--o', ad > 2 ? 0 : ad === 2 ? .7 : 1);
        s.style.zIndex = 10 - ad;
        s.classList.toggle('is-center', d === 0);
        s.setAttribute('aria-hidden', d !== 0);
      });
    }
    function show(i) {
      cur = heroIndex = (i + HEROES.length) % HEROES.length;
      const h = HEROES[cur], p = byId[h.id], sub = subOf(p);
      setColors(...h.grad);
      layout();
      const g = $('#ghost'); g.classList.add('swap');
      setTimeout(() => { g.textContent = h.word; g.classList.remove('swap'); }, 200);
      $('#counter').textContent = `${pad(cur + 1)} / ${pad(HEROES.length)}`;
      $('#heroText').innerHTML = `<div class="fade-up"><span class="eyebrow" style="color:var(--ink-2)">${esc(L(catOf(p.cat)))}${sub ? ' · ' + esc(L(sub)) : ''}${p.opt?.type === 'color' ? ` · ${p.opt.values.length} ${t('shades')}` : ''}</span>
        <h1 class="hero-title">${esc(disp(pName(p)))}</h1><span class="hero-script script">${esc(h.script)}</span>
        <div class="hero-price">${p.from ? t('from') + ' ' : ''}<b>${money(p.czk, p.eur)}</b></div></div>`;
      $('#discover').href = `#/p/${p.id}`;
    }
    $('#prev').onclick = () => show(cur - 1);
    $('#next').onclick = () => show(cur + 1);
    track.addEventListener('click', e => {
      const s = e.target.closest('.slide'); if (!s) return;
      const i = +s.dataset.i;
      if (i === cur) location.hash = `#/p/${HEROES[i].id}`; else show(i);
    });
    let sx = null;
    track.addEventListener('pointerdown', e => { sx = e.clientX; });
    track.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) show(cur + (e.clientX < sx ? 1 : -1)); sx = null; });
    const onKey = e => { if (e.target.closest('input,textarea,select')) return; if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', layout);
    show(cur);
    $('#ghost').textContent = HEROES[cur].word;
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', layout); };
  }

  const shopState = { q: '', sort: 'rec', stock: false, shown: PAGE, key: '' };
  function viewShop(catKey, subKey) {
    const c = catOf(catKey);
    const s = c && subKey ? c.subs.find(x => x.key === subKey) : null;
    const st = CAT_STYLE[catKey];
    setColors(...(st ? [st.a, st.b] : ['#ff6a1a', '#2a0e02']));
    const key = `${catKey}/${subKey}`;
    if (shopState.key !== key) { shopState.key = key; shopState.shown = PAGE; }
    const subsWithItems = c ? c.subs.filter(x => P.some(p => p.cat === c.key && p.sub === x.key)) : [];
    main.innerHTML = `
      <section class="stage full"><div class="stage-inner">
        <div class="shop-head"><span class="eyebrow" style="color:var(--ink-2)">${t('shop')} · ${c ? esc(st?.sub || '') : t('wholeRange')}</span>
          <h1>${c ? esc(s ? L(s) : L(c)) : t('all')}<span class="script">${c ? 'Montana ' + esc(L(c)).toLowerCase() : t('forCulture')}</span></h1></div>
        <div class="toolbar">
          <div class="chips"><a class="chip ${!c ? 'on' : ''}" href="#/shop">${t('all')} <small>${P.length}</small></a>
            ${CATS.map(x => `<a class="chip ${c && c.key === x.key ? 'on' : ''}" href="#/shop/${x.key}">${esc(L(x))} <small>${P.filter(p => p.cat === x.key).length}</small></a>`).join('')}</div>
          <div class="tools">
            <label class="sr" for="q">${t('search')}</label><input class="field" id="q" type="search" placeholder="${t('search')}" value="${esc(shopState.q)}">
            <label class="sr" for="sort">${t('sort')}</label>
            <select class="field" id="sort">${[['rec', 'sortRec'], ['asc', 'sortAsc'], ['desc', 'sortDesc'], ['az', 'sortAz']].map(([v, k]) => `<option value="${v}" ${shopState.sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>
          </div>
        </div>
        ${subsWithItems.length > 1 ? `<div class="chips subchips">
          <a class="chip soft ${!s ? 'on' : ''}" href="#/shop/${c.key}">${t('all')}</a>
          ${subsWithItems.map(x => `<a class="chip soft ${s && s.key === x.key ? 'on' : ''}" href="#/shop/${c.key}/${x.key}">${esc(L(x))} <small>${P.filter(p => p.cat === c.key && p.sub === x.key).length}</small></a>`).join('')}</div>` : ''}
        <label class="toggle"><input type="checkbox" id="stockOnly" ${shopState.stock ? 'checked' : ''}> ${t('onlyStock')}</label>
        <div class="grid" id="grid"></div>
        <div class="more" id="more"></div>
      </div></section>
      ${ticker()}${footer()}`;
    const norm = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const draw = () => {
      const q = norm(shopState.q.trim());
      const list = P.filter(p => (!c || p.cat === c.key) && (!s || p.sub === s.key) && (!shopState.stock || p.stock)
        && (!q || norm(`${p.name.cs} ${p.name.en} ${p.opt?.type === 'color' ? p.opt.values.map(v => `${v.n} ${v.c}`).join(' ') : ''}`).includes(q)));
      if (shopState.sort === 'rec') list.sort((a, b) => (!!b.stock - !!a.stock) || ((heroOf(b.id) ? 1 : 0) - (heroOf(a.id) ? 1 : 0)));
      if (shopState.sort === 'asc') list.sort((a, b) => amount(a.czk, a.eur) - amount(b.czk, b.eur));
      if (shopState.sort === 'desc') list.sort((a, b) => amount(b.czk, b.eur) - amount(a.czk, a.eur));
      if (shopState.sort === 'az') list.sort((a, b) => disp(pName(a)).localeCompare(disp(pName(b)), LANG));
      $('#grid').innerHTML = list.length ? list.slice(0, shopState.shown).map(card).join('') : `<p class="empty" style="grid-column:1/-1">${t('nothing')}</p>`;
      const rest = list.length - shopState.shown;
      $('#more').innerHTML = rest > 0 ? `<button class="btn ghost" id="moreBtn">${t('showMore')} (${rest})</button>` : '';
    };
    $('#q').addEventListener('input', e => { shopState.q = e.target.value; shopState.shown = PAGE; draw(); });
    $('#sort').addEventListener('change', e => { shopState.sort = e.target.value; draw(); });
    $('#stockOnly').addEventListener('change', e => { shopState.stock = e.target.checked; shopState.shown = PAGE; draw(); });
    $('#more').addEventListener('click', e => { if (e.target.id === 'moreBtn') { shopState.shown += PAGE; draw(); } });
    draw();
  }

  function viewProduct(id, vParam) {
    const p = byId[id];
    if (!p) return viewNotFound();
    const hero = heroOf(p.id);
    setColors(...colorsFor(p));
    const c = catOf(p.cat), sub = subOf(p);
    const sib = P.filter(x => x.cat === p.cat && (!p.sub || x.sub === p.sub));
    const k = sib.indexOf(p);
    const prev = sib[(k - 1 + sib.length) % sib.length], next = sib[(k + 1) % sib.length];
    const related = sib.filter(x => x !== p && x.stock).slice(0, 5);
    const isColor = p.opt?.type === 'color';
    let sel = p.var?.find(x => String(x.v) === vParam) || null;
    const optFor = v => p.opt.values.find(o => o.id === v.o);
    const desc = L(p.desc) || p.desc.cs;
    const shortTxt = (L(p.short) || p.short.cs).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const thumbs = (hero ? [{ src: hero.img, hero: 1 }] : []).concat(p.img.map(src => ({ src })));

    const picker = !p.opt ? '' : isColor ? `
      <div class="picker">
        <div class="picker-head"><b>${p.opt.values.length} ${t('shades')}</b><input class="field" id="shadeQ" type="search" placeholder="${t('searchShades')}" aria-label="${t('searchShades')}"></div>
        <div class="swatches" id="swatches" role="listbox" aria-label="${esc(L(p.opt.label))}">
          ${p.var.map(v => { const o = optFor(v); return `<button class="sw ${v.q ? '' : 'na'}" role="option" data-v="${v.v}" data-k="${esc(`${o.n || ''} ${o.c || ''} ${o.l}`.toLowerCase())}" style="--sw:${swatchBg(o)}" title="${esc(o.n || o.l)}${o.c ? ' · ' + esc(o.c) : ''}${v.q ? '' : ' – ' + t('soldOut')}" aria-label="${esc(o.n || o.l)} ${esc(o.c || '')}" ${v.q ? '' : 'aria-disabled="true"'}></button>`; }).join('')}
        </div>
        <div class="sel" id="selInfo"></div>
      </div>` : `
      <div class="picker"><div class="picker-head"><b>${esc(L(p.opt.label))}</b></div>
        <div class="sizes-pick">${p.var.map(v => `<button class="chip soft ${v.q ? '' : 'na'}" data-v="${v.v}" ${v.q ? '' : 'disabled'}>${esc(optFor(v).l)}</button>`).join('')}</div>
        <div class="sel" id="selInfo"></div></div>`;

    main.innerHTML = `
      <section class="stage full"><div class="pd">
        <div class="pd-tabs">
          <a class="chip soft" href="#/shop/${p.cat}${p.sub ? '/' + p.sub : ''}">‹ ${t('back')}</a>
          <button class="chip soft on" data-tab="overview">${t('overview')}</button>
          ${desc ? `<button class="chip soft" data-tab="desc">${t('description')}</button>` : ''}
          <button class="chip soft" data-tab="details">${t('details')}</button>
        </div>
        <div class="pd-info">
          <span class="eyebrow" style="color:var(--ink-2)">${esc(L(c))}${sub ? ' · ' + esc(L(sub)) : ''}</span>
          <h1>${esc(disp(pName(p)))}</h1>
          <span class="hero-script script">${esc(hero ? hero.script : (sub ? L(sub) : L(c)))}</span>
          <div id="tab-overview">
            ${shortTxt ? `<p class="pd-desc">${esc(shortTxt)}</p>` : ''}
            ${picker}
            ${!p.opt ? `<div class="chips"><span class="chip soft">Montana Cans</span><span class="chip soft">${p.stock ? t('inStock') : t('soldOut')}</span><span class="chip soft">${t('pickupChip')}</span></div>` : ''}
          </div>
          <div id="tab-desc" class="rich" hidden>${desc}${p.noEn && LANG === 'en' ? `<p class="pd-note">${t('noEn')}</p>` : ''}</div>
          <div id="tab-details" hidden>
            <table class="spec"><tbody>
              <tr><td>${t('brand')}</td><td>Montana Cans</td></tr>
              <tr><td>${t('category')}</td><td>${esc(L(c))}${sub ? ' · ' + esc(L(sub)) : ''}</td></tr>
              <tr><td>${t('price')}</td><td>${p.from ? t('from') + ' ' : ''}${money(p.czk, p.eur)} ${t('vat')}</td></tr>
              ${p.opt ? `<tr><td>${t('variants')}</td><td>${p.opt.values.length} · ${esc(L(p.opt.label))}</td></tr>` : ''}
              <tr><td>${t('shipping')}</td><td>${t('shippingVal', { amount: czkMoney(SHOP.freeShipCZK) })}</td></tr>
              <tr><td>ID</td><td>${p.pid}</td></tr>
            </tbody></table>
            ${p.dl.map(u => `<p><a class="link" href="${esc(u)}" target="_blank" rel="noopener">${t('safety')} ›</a></p>`).join('')}
            ${p.video ? `<p><a class="link" href="${esc(p.src)}" target="_blank" rel="noopener">${t('video')} ›</a></p>` : ''}
          </div>
        </div>
        <div class="pd-media">
          <img id="mainImg" ${hero ? '' : 'class="boxed"'} src="${thumbs[0]?.src || ''}" alt="${esc(pName(p))}">
          ${thumbs.length > 1 ? `<div class="thumbs">${thumbs.map((th, i) => `<button class="thumb ${i === 0 ? 'on' : ''}" data-img="${th.src}" ${th.hero ? 'data-hero="1"' : ''} aria-label="${i + 1}"><img src="${th.src}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        </div>
        <div class="pd-buy">
          <div class="pd-price" id="pdPrice"></div>
          <div class="qty"><button data-step="-1" aria-label="${t('less')}">−</button><input id="qty" type="number" min="1" value="1" aria-label="${t('qty')}"><button data-step="1" aria-label="${t('more')}">+</button></div>
          <button class="btn accent" id="buy"></button>
          <div class="pd-nav"><a class="round" href="#/p/${prev.id}" aria-label="${t('prev')}">‹</a><a class="round" href="#/p/${next.id}" aria-label="${t('next')}">›</a></div>
        </div>
      </div></section>
      ${related.length ? `<section class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow">${t('related')}</span><h2>${t('fromLine')} <span class="script">${t('line')}</span></h2></div></div>
        <div class="grid">${related.map(card).join('')}</div></div></section>` : ''}
      ${footer()}`;

    const buy = $('#buy');
    function update() {
      const price = sel ? { czk: sel.czk, eur: sel.eur } : { czk: p.czk, eur: p.eur };
      $('#pdPrice').innerHTML = `${!sel && p.from ? `<small>${t('from')}</small>` : ''}${money(price.czk, price.eur)}${!p.var && p.reg ? ` <s class="old">${money(p.reg.czk, p.reg.eur)}</s>` : ''}`;
      const needs = !!p.var && !sel;
      const out = sel ? !sel.q : !p.var && !p.stock;
      buy.disabled = needs || out || !p.czk;
      buy.textContent = out ? t('soldOut') : needs ? (isColor ? t('chooseColor') : t('chooseSize')) : t('addToCart');
      const q = $('#qty'); q.max = sel ? sel.q : 99; if (sel && +q.value > sel.q) q.value = Math.max(1, sel.q);
      if (!p.opt) return;
      $$('[data-v]').forEach(b => b.classList.toggle('on', !!sel && +b.dataset.v === sel.v));
      const info = $('#selInfo');
      if (sel) {
        const o = optFor(sel);
        info.innerHTML = `${isColor ? `<i class="dot lg" style="background:${swatchBg(o)}"></i>` : ''}<div><b>${esc(o.n || o.l)}</b>${o.c ? ` <span>${esc(o.c)}</span>` : ''}<br><small>${sel.q ? (sel.q <= 3 ? t('lastPieces') + ' · ' : '') + t('stockLeft', { n: sel.q }) : t('soldOut')}</small></div>`;
        if (isColor && o.h) setColors(o.h, darken(o.h, .18));
      } else info.innerHTML = `<small>${isColor ? t('chooseColor') : t('chooseSize')}</small>`;
    }
    if (p.opt) {
      $('.picker').addEventListener('click', e => {
        const b = e.target.closest('[data-v]'); if (!b || b.classList.contains('na')) return;
        sel = p.var.find(x => x.v === +b.dataset.v);
        history.replaceState(null, '', `#/p/${p.id}?v=${sel.v}`);
        update();
      });
      $('#shadeQ')?.addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase();
        $$('#swatches .sw').forEach(b => { b.hidden = !!q && !b.dataset.k.includes(q); });
      });
    }
    $$('[data-tab]').forEach(b => b.addEventListener('click', () => {
      $$('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
      ['overview', 'desc', 'details'].forEach(k2 => { const el = $('#tab-' + k2); if (el) el.hidden = b.dataset.tab !== k2; });
    }));
    $('.pd-media').addEventListener('click', e => {
      const th = e.target.closest('.thumb'); if (!th) return;
      const img = $('#mainImg'); img.src = th.dataset.img; img.classList.toggle('boxed', !th.dataset.hero);
      $$('.thumb').forEach(x => x.classList.toggle('on', x === th));
    });
    $$('[data-step]').forEach(b => b.addEventListener('click', () => { const q = $('#qty'); q.value = Math.min(+q.max || 99, Math.max(1, (+q.value || 1) + +b.dataset.step)); }));
    buy.addEventListener('click', () => Cart.add(p.id, Math.max(1, +$('#qty').value || 1), sel ? sel.v : null));
    update();
  }

  function viewAbout() {
    setColors('#ff6a1a', '#2a0e02');
    const T = {
      cs: {
        eyebrow: 'O nás', p1: 'Montana Cans Česká republika navazuje na obchod SAMET, který otevřel v roce 1995 v pražské čtvrti Žižkov. Spojoval graffiti sortiment, vinylové desky a oblečení amerických streetových značek – věci, které tehdy byly pro české zákazníky prakticky nedostupné.',
        p2: 'SAMET se stal místem setkání writerů, hudebníků a fanoušků, konaly se tu akce, koncerty i workshopy. Dnes, po téměř třiceti letech, pokračujeme jako specializovaný e-shop Montana-cans.cz s kompletním sortimentem německé značky Montana Cans.',
        hist: 'Historie', tl: [['1995', 'SAMET otevírá na Žižkově – graffiti, vinyly a streetwear pod jednou střechou. Ikona v Česku i ve střední a východní Evropě.'], ['2000+', 'S nástupem online nakupování přichází první e-shop zaměřený na graffiti a streetwear.'], ['20 let', 'K 20. výročí vzniká Montana-cans.cz – e-shop specializovaný na kompletní výrobky Montana Cans.'], ['2018', 'Počet poboček roste na pět – v různých částech Prahy a ČR, každá se svým vlastním charakterem.'], ['Dnes', 'Pořád žijeme scénou: barvy, fixy, trysky, oblečení a doplňky Montana s osobním odběrem v Praze.']],
        de: 'Montana Cans Německo', countries: '60+ zemí', p3: 'Montana a tým L&amp;G jsou od začátku spjati s uměleckou scénou – zakladatelé z ní vzešli a dodnes jsou její aktivní součástí. Z malého snu vyrostla značka, která expandovala do více než 60 zemí. Stojí na nadstandardní kvalitě, obrovské škále odstínů a širokém výběru doplňků – fixy, náplně, samolepky, oblečení.',
        quote: '„Od umělců scény<br>pro umělce scény.“',
      },
      en: {
        eyebrow: 'About us', p1: 'Montana Cans Czech Republic carries on the legacy of SAMET, a store that opened in 1995 in Prague’s Žižkov district. It brought together graffiti supplies, vinyl records and clothing from American street brands – things Czech customers simply couldn’t get back then.',
        p2: 'SAMET became a meeting point for writers, musicians and fans, hosting events, gigs and workshops. Today, almost thirty years later, we continue as Montana-cans.cz – a specialist store carrying the full range of German brand Montana Cans.',
        hist: 'History', tl: [['1995', 'SAMET opens in Žižkov – graffiti, vinyl and streetwear under one roof. An icon in Czechia and across Central and Eastern Europe.'], ['2000+', 'As online shopping takes off, the first web store focused on graffiti and streetwear launches.'], ['20 yrs', 'For the 20th anniversary, Montana-cans.cz is born – dedicated to the full Montana Cans range.'], ['2018', 'The number of stores grows to five across Prague and Czechia, each with its own character.'], ['Today', 'Still living the scene: Montana paint, markers, caps, clothing and accessories with pickup in Prague.']],
        de: 'Montana Cans Germany', countries: '60+ countries', p3: 'Montana and the L&amp;G team have been tied to the art scene from day one – the founders came from it and are still active in it. A small dream grew into a brand present in more than 60 countries, built on outstanding quality, a huge range of colours and a wide choice of accessories – markers, refills, stickers, clothing.',
        quote: '“By artists of the scene,<br>for artists of the scene.”',
      },
    }[LANG];
    main.innerHTML = `
      <section class="stage full"><div class="stage-inner story" style="min-height:calc(100svh - 32px)">
        <div><span class="eyebrow" style="color:var(--ink-2)">${T.eyebrow}</span>
          <div class="sec-head" style="margin:6px 0 20px"><h2 style="font-size:clamp(44px,7vw,110px)">For the <span class="script">culture</span></h2></div>
          <p>${T.p1}</p><p>${T.p2}</p></div>
        <div class="big-year" aria-hidden="true">1995</div>
      </div></section>
      <section class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow">${T.hist}</span><h2>Timeline</h2></div></div>
        <ol class="timeline">${T.tl.map(([y, x]) => `<li><b>${y}</b><p>${x}</p></li>`).join('')}</ol>
      </div></section>
      <section class="stage light"><div class="stage-inner story" style="padding-top:var(--pad)">
        <div><span class="eyebrow">${T.de}</span><div class="sec-head" style="margin:6px 0 18px"><h2>${T.countries}</h2></div><p>${T.p3}</p></div>
        <p class="quote">${T.quote}</p>
      </div></section>
      ${footer()}`;
  }

  function viewContact() {
    setColors('#3f7bff', '#061636');
    const cs = LANG === 'cs';
    main.innerHTML = `
      <section class="stage full"><div class="stage-inner">
        <div class="shop-head"><span class="eyebrow" style="color:var(--ink-2)">${t('contact')}</span><h1>${cs ? 'Zastav se' : 'Drop by'}<span class="script">${cs ? 'po telefonu' : 'call first'}</span></h1></div>
        <div class="contact" style="margin-top:34px">
          <div style="display:grid;gap:16px">
            <div class="box"><h3>${cs ? 'Osobní odběr' : 'Pickup'}</h3><p class="lg">Volutová 2522/16<br>Praha 13 – Stodůlky, 158 00</p><p style="color:var(--ink-2)">${cs ? '5 minut od stanice metra B „Hůrka“. Osobní odběr je možný pouze po telefonické dohodě.' : '5 minutes from metro B station “Hůrka”. Pickup by phone appointment only.'}</p>
              <a class="btn" style="margin-top:10px" href="https://maps.google.com/?q=Volutov%C3%A1+2522%2F16+Praha+13" target="_blank" rel="noopener">${cs ? 'Navigovat' : 'Directions'} ›</a></div>
            <div class="box"><h3>${cs ? 'Otevírací doba' : 'Opening hours'}</h3><p class="lg">${cs ? 'Po–Čt 9–16<br>Pá 10–16' : 'Mon–Thu 9–16<br>Fri 10–16'}</p></div>
            <div class="box"><h3>${cs ? 'Ozvi se' : 'Get in touch'}</h3>
              <p class="lg"><a href="tel:${SHOP.phoneRaw}">${SHOP.phone}</a></p>
              <p><a class="link" href="mailto:${SHOP.info}">${SHOP.info}</a> · <a class="link" href="mailto:${SHOP.email}">${SHOP.email}</a></p>
              <p><a class="link" href="${SHOP.instagram}" target="_blank" rel="noopener">Instagram @montanacans.cz</a></p></div>
          </div>
          <iframe class="map" title="Map – Volutová 2522/16, Praha 13" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=Volutov%C3%A1%202522%2F16%2C%20Praha%2013&z=15&output=embed"></iframe>
        </div>
      </div></section>
      <section class="stage plain"><div class="stage-inner contact" style="padding-top:var(--pad)">
        <div class="box"><h3>${cs ? 'Provozovatel & fakturace' : 'Operator & billing'}</h3><p>Václav Jung<br>Oranžová 215, 252 19 Chrášťany, okr. Praha-západ</p><p>IČO 63093464 · DIČ CZ6902181781</p></div>
        <div class="box"><h3>${cs ? 'Reklamace a vrácení' : 'Returns & claims'}</h3><p>Václav Jung<br>Volutová 2522/16, 158 00 Praha 13</p><p style="color:var(--ink-2)">${cs ? 'Výměna zboží a reklamace v ceně objednávky. Podrobnosti v' : 'Exchanges and claims included. Details in the'} <a class="link" href="${SHOP.terms}" target="_blank" rel="noopener">${cs ? 'obchodních podmínkách' : 'terms & conditions'}</a>.</p></div>
      </div></section>
      ${footer()}`;
  }

  function viewNotFound() {
    setColors('#ff2d95', '#2a0318');
    main.innerHTML = `<section class="stage full"><div class="stage-inner" style="display:grid;place-items:center;min-height:calc(100svh - 32px);text-align:center">
      <div><div class="big-year">404</div><p class="quote" style="margin:20px 0">${t('notFound')}</p><a class="btn" href="#/">${t('home')}</a></div></div></section>`;
  }

  /* ---------- router ---------- */
  function route(keepScroll) {
    if (cleanup) { cleanup(); cleanup = null; }
    toggleMenu(false);
    const [path, qs] = location.hash.replace(/^#/, '').split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = new URLSearchParams(qs || '');
    let r;
    if (!parts.length) r = viewHome();
    else if (parts[0] === 'shop') r = viewShop(parts[1], parts[2]);
    else if (parts[0] === 'p') r = viewProduct(parts[1], params.get('v'));
    else if (parts[0] === 'o-nas') r = viewAbout();
    else if (parts[0] === 'kontakt') r = viewContact();
    else r = viewNotFound();
    if (typeof r === 'function') cleanup = r;
    if (keepScroll !== true) {
      main.classList.remove('page-enter'); void main.offsetWidth; main.classList.add('page-enter');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    const h = main.querySelector('h1');
    document.title = (h && parts.length ? h.firstChild.textContent.trim() + ' · ' : '') + (LANG === 'cs' ? 'Montana Cans CZ · Graffiti barvy, fixy a trysky' : 'Montana Cans CZ · Graffiti spray paint, markers & caps');
  }

  main.addEventListener('click', e => {
    const a = e.target.closest('[data-add]');
    if (a) { e.preventDefault(); Cart.add(a.dataset.add); }
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); toggleMenu(false); } });
  window.addEventListener('hashchange', () => route());
  renderChrome();
  renderBadge();
  route();
})();
