/* Montana Cans CZ — concept storefront (vanilla JS, hash router, localStorage cart) */
(() => {
  'use strict';

  const P = window.MC_PRODUCTS;
  const HEROES = window.MC_HEROES.map(id => P.find(p => p.id === id));
  const byId = Object.fromEntries(P.map(p => [p.id, p]));

  const SHOP = {
    name: 'Montana Cans CZ',
    email: 'shop@montana-cans.cz',
    info: 'info@montana-cans.cz',
    phone: '+420 727 890 835',
    phoneRaw: '+420727890835',
    instagram: 'https://www.instagram.com/montanacans.cz/',
    freeShip: 3000,
    newsletter: 'https://montana-cans.us6.list-manage.com/subscribe/post?u=939bd67176d7051bfc075bf50&id=aa29d66b98',
    terms: 'https://www.montana-cans.cz/page/obchodni-podminky',
  };

  const CATS = [
    { key: 'spreje',    label: 'Spreje',    sub: 'BLACK · GOLD · BLUE',  a: '#ff6a1a', b: '#2a0e02', img: 'assets/img/hero/black-400ml.webp' },
    { key: 'efekty',    label: 'Efekty',    sub: 'Glow · Chrome · UV',   a: '#9dff6a', b: '#07220a', img: 'assets/img/hero/nightglow-400ml.webp' },
    { key: 'technicke', label: 'Technické', sub: 'Primery · Laky',       a: '#8c97a3', b: '#15191d' },
    { key: 'sety',      label: 'Sety',      sub: 'Limitované edice',     a: '#ffd21a', b: '#2a2000' },
    { key: 'fixy',      label: 'Fixy',      sub: 'Acrylic · Bold',       a: '#b98cff', b: '#1a0b33', img: 'assets/img/hero/acrylic-fix-15mm.webp' },
    { key: 'trysky',    label: 'Trysky',    sub: 'Level · Fat · Skinny', a: '#9aa3ad', b: '#14171b', img: 'assets/img/hero/cap-set-level-1-6.webp' },
    { key: 'obleceni',  label: 'Oblečení',  sub: 'Mikiny · Kšiltovky',   a: '#6b6b6b', b: '#111111', img: 'assets/img/hero/mikina-basic-black.webp' },
    { key: 'doplnky',   label: 'Doplňky',   sub: 'Blackbooky · Tašky',   a: '#3f7bff', b: '#061636' },
  ];
  const catOf = k => CATS.find(c => c.key === k);
  const countIn = k => P.filter(p => p.cat === k).length;

  /* ---------- helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const kc = n => n.toLocaleString('cs-CZ') + ' Kč';
  const priceHtml = p => p.price ? `${p.from ? '<small>od</small>' : ''}${kc(p.price)}` : '<small>cena na dotaz</small>';
  const pad = n => String(n).padStart(2, '0');
  const main = $('#main');
  const root = document.documentElement;

  function setColors(a, b) {
    root.style.setProperty('--c1', a);
    root.style.setProperty('--c2', b);
    $('meta[name="theme-color"]').setAttribute('content', b);
  }
  const colorsFor = p => p.hero ? p.hero.grad : [catOf(p.cat).a, catOf(p.cat).b];

  /* ---------- cart ---------- */
  const Cart = {
    items: JSON.parse(localStorage.getItem('mc-cart') || '[]').filter(i => byId[i.id]),
    save() { localStorage.setItem('mc-cart', JSON.stringify(this.items)); renderBadge(); },
    add(id, qty = 1, variant = '') {
      const hit = this.items.find(i => i.id === id && i.variant === variant);
      hit ? hit.qty += qty : this.items.push({ id, qty, variant });
      this.save();
      const b = $('#cartCount'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
      toast(`Přidáno do košíku · ${byId[id].name}`);
    },
    set(idx, qty) { qty < 1 ? this.items.splice(idx, 1) : this.items[idx].qty = qty; this.save(); renderDrawer(); },
    count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    total() { return this.items.reduce((s, i) => s + (byId[i.id].price || 0) * i.qty, 0); },
  };
  function renderBadge() { $('#cartCount').textContent = Cart.count(); }

  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- pill menu ---------- */
  const pill = $('#pill'), menuBtn = $('#menuBtn');
  function toggleMenu(force) {
    const open = force ?? !pill.classList.contains('open');
    pill.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
  }
  menuBtn.addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });
  document.addEventListener('click', e => { if (!pill.contains(e.target)) toggleMenu(false); });

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
      body.innerHTML = `<div class="drawer-empty"><span class="script">Zatím prázdno…</span><p>Plechovky čekají na regálu.</p><a class="btn" href="#/shop" data-close>Do shopu</a></div>`;
      return;
    }
    const total = Cart.total();
    const left = Math.max(0, SHOP.freeShip - total);
    const lines = Cart.items.map((i, idx) => {
      const p = byId[i.id];
      return `<div class="line">
        <img src="${p.img}" alt="" loading="lazy">
        <div><div class="line-name">${esc(p.name)}</div>${i.variant ? `<div class="line-var">${esc(i.variant)}</div>` : ''}
          <div class="qty"><button data-q="${idx}" data-d="-1" aria-label="Méně">−</button><input value="${i.qty}" readonly aria-label="Množství"><button data-q="${idx}" data-d="1" aria-label="Více">+</button></div></div>
        <div class="line-right"><b>${kc((p.price || 0) * i.qty)}</b><button class="line-del" data-del="${idx}">Odebrat</button></div>
      </div>`;
    }).join('');
    body.innerHTML = `${lines}
      <div class="ship">${left ? `Do dopravy zdarma zbývá <b>${kc(left)}</b>` : '<b>Doprava zdarma</b> – máš ji v kapse ✦'}
        <div class="bar"><i style="width:${Math.min(100, total / SHOP.freeShip * 100)}%"></i></div></div>
      ${total >= 5000 ? '<p class="fine">Nad 5 000 Kč máš nárok na slevu 3–5 % – dopočítáme v potvrzení objednávky.</p>' : ''}
      <div class="sum"><span>Mezisoučet</span><b>${kc(total)}</b></div>
      ${checkoutStep ? checkoutForm() : `<button class="btn accent" id="goCheckout">Pokračovat k objednávce</button>
      <p class="fine" style="margin-top:12px">Ceny vč. DPH. Varianty s cenou „od“ se mohou podle odstínu lišit.</p>`}`;
  }
  function checkoutForm() {
    return `<form class="checkout" id="checkout">
      <input class="field" name="name" placeholder="Jméno a příjmení" required autocomplete="name">
      <input class="field" name="email" type="email" placeholder="E-mail" required autocomplete="email">
      <input class="field" name="phone" type="tel" placeholder="Telefon" required autocomplete="tel">
      <div class="radios">
        <label class="radio"><input type="radio" name="ship" value="Osobní odběr Praha 13 (po tel. dohodě)" checked> Osobní odběr – Praha 13 <span>zdarma</span></label>
        <label class="radio"><input type="radio" name="ship" value="Doručení na adresu"> Doručení na adresu <span>${Cart.total() >= SHOP.freeShip ? 'zdarma' : 'dle ceníku'}</span></label>
      </div>
      <textarea class="field" name="addr" placeholder="Doručovací adresa (při doručení) a poznámka"></textarea>
      <div class="radios">
        <label class="radio"><input type="radio" name="pay" value="Bankovní převod" checked> Bankovní převod</label>
        <label class="radio"><input type="radio" name="pay" value="Dobírka / hotově při převzetí"> Dobírka / hotově při převzetí</label>
      </div>
      <label class="fine"><input type="checkbox" required> Souhlasím s <a class="link" href="${SHOP.terms}" target="_blank" rel="noopener">obchodními podmínkami</a>.</label>
      <button class="btn accent" type="submit">Odeslat objednávku</button>
      <p class="fine">Objednávka se odešle e-mailem na ${SHOP.email}. Potvrzení a platební údaje ti přijdou zpět.</p>
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
    const rows = Cart.items.map(i => { const p = byId[i.id]; return `• ${i.qty}× ${p.name}${i.variant ? ` (${i.variant})` : ''} – ${kc((p.price || 0) * i.qty)}`; }).join('\n');
    const text = `Dobrý den,\n\nposílám objednávku z webu:\n\n${rows}\n\nMezisoučet: ${kc(Cart.total())}\nDoprava: ${f.ship}\nPlatba: ${f.pay}\n\nJméno: ${f.name}\nE-mail: ${f.email}\nTelefon: ${f.phone}\nAdresa / poznámka: ${f.addr || '–'}\n\nDěkuji.`;
    location.href = `mailto:${SHOP.email}?subject=${encodeURIComponent('Objednávka z webu – ' + f.name)}&body=${encodeURIComponent(text)}`;
    toast('Otevírám e-mail s objednávkou…');
  });

  /* ---------- shared blocks ---------- */
  const card = p => `<article class="card">
      <a class="card-img" href="#/p/${p.id}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></a>
      <div class="card-body">
        <span class="card-tag">${esc(p.tag)}</span>
        <a class="card-name" href="#/p/${p.id}">${esc(p.name)}</a>
        <div class="card-price"><span>${priceHtml(p)}</span>${p.price ? `<button class="add" data-add="${p.id}" aria-label="Přidat ${esc(p.name)} do košíku">+</button>` : ''}</div>
      </div></article>`;

  const ticker = () => {
    const items = ['Osobní odběr Praha', 'Doprava zdarma nad 3 000 Kč', 'Sleva 3–5 % nad 5 000 Kč', 'Výměna a reklamace v ceně', 'Od umělců scény pro umělce scény', 'Since 1995'];
    const row = items.map(t => `<span>${t}</span>`).join('');
    return `<div class="ticker" aria-label="${items.join(', ')}"><div class="ticker-track" aria-hidden="true">${row}${row}</div></div>`;
  };

  const footer = () => `
    <section class="stage plain"><div class="stage-inner news" style="padding-top:var(--pad)">
      <div><span class="eyebrow">Mailing list</span><div class="sec-head" style="margin:6px 0 0"><h2>Nové odstíny <span class="script">first</span></h2></div>
      <p style="color:var(--ink-2);margin:10px 0 0">Nové barvy, nové zboží, slevy – vždy z první ruky.</p></div>
      <form action="${SHOP.newsletter}" method="post" target="_blank" rel="noopener">
        <label class="sr" for="nl">E-mail</label>
        <input class="field" id="nl" type="email" name="EMAIL" placeholder="tvuj@email.cz" required>
        <button class="btn" type="submit">Odebírat</button>
      </form>
    </div></section>
    <footer class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
      <div class="footer">
        <div><img class="logo" src="assets/img/logo.svg" alt="Montana Cans"><p style="margin:0;max-width:34ch">Oficiální český e-shop německé značky Montana Cans. Navazujeme na legendární pražský SAMET, který otevřel v roce 1995 na Žižkově.</p></div>
        <div><h4>Shop</h4><ul>${CATS.slice(0, 7).map(c => `<li><a href="#/shop/${c.key}">${c.label}</a></li>`).join('')}</ul></div>
        <div><h4>Info</h4><ul><li><a href="#/o-nas">O nás</a></li><li><a href="#/kontakt">Kontakt & osobní odběr</a></li><li><a href="${SHOP.terms}" target="_blank" rel="noopener">Obchodní podmínky</a></li><li><a href="${SHOP.instagram}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
        <div><h4>Kontakt</h4><ul><li><a href="tel:${SHOP.phoneRaw}">${SHOP.phone}</a></li><li><a href="mailto:${SHOP.info}">${SHOP.info}</a></li><li>Volutová 2522/16, Praha 13</li><li>Po–Čt 9–16 · Pá 10–16</li></ul></div>
        <div class="footer-bottom"><span>© 2026 Montana-cans.cz · Václav Jung · IČO 63093464</span><span>Ceny vč. DPH</span></div>
      </div>
      <div class="mega" aria-hidden="true">Montana</div>
    </div></footer>`;

  /* ---------- views ---------- */
  let cleanup = null;

  function viewHome() {
    let cur = 0;
    const counts = CATS.filter(c => countIn(c.key)).map(c => `<a class="chip" href="#/shop/${c.key}">${c.label} <small>${countIn(c.key)}</small></a>`).join('');
    const newest = ['blue-400ml', 'nightglow-400ml', 'acrylic-fix-15mm', 'cap-set-level-1-6', 'black-400ml-bombing-set', 'mikina-basic-black', 'kulich-s-logem-montana-black', 'blackbook-a4-krajina', 'ultra-wide-750ml', 'sketchliner-set'].map(id => byId[id]).filter(Boolean);
    main.innerHTML = `
      <section class="stage full hero" aria-roledescription="carousel" aria-label="Doporučené produkty">
        <div class="hero-top">
          <div class="chips"><a class="chip on" href="#/shop">Vše <small>${P.length}</small></a>${counts}</div>
          <div class="counter" id="counter"></div>
        </div>
        <div class="ghost-word" id="ghost" aria-hidden="true"></div>
        <div class="track" id="track">
          ${HEROES.map((p, i) => `<div class="slide" data-i="${i}"><img src="${p.hero.img}" alt="${esc(p.name)}" ${i > 2 ? 'loading="lazy"' : ''}></div>`).join('')}
        </div>
        <div class="hero-foot">
          <div id="heroText" aria-live="polite"></div>
          <div class="hero-ctrl">
            <button class="round" id="prev" aria-label="Předchozí">‹</button>
            <button class="round" id="next" aria-label="Další">›</button>
            <a class="btn" id="discover" href="#/shop">Objevit ›</a>
          </div>
        </div>
      </section>
      ${ticker()}
      <section class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow">Kategorie</span><h2>Vyber si <span class="script">zbraň</span></h2></div><a class="btn ghost" href="#/shop">Celý sortiment ›</a></div>
        <div class="cats">
          ${CATS.filter(c => c.img).map((c, i) => `<a class="cat ${i === 0 ? 'big' : ''}" href="#/shop/${c.key}" style="--a:${c.a};--b:${c.b}">
            <span class="chev">›</span><div><span>${c.sub}</span><br><b>${c.label}</b></div><img src="${c.img}" alt="" loading="lazy"></a>`).join('')}
        </div>
      </div></section>
      <section class="stage light"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow" style="color:rgba(0,0,0,.5)">Výběr z regálu</span><h2>Fresh <span class="script" style="color:#141210">drop</span></h2></div><a class="btn dark" href="#/shop">Shop ›</a></div>
        <div class="grid">${newest.map(card).join('')}</div>
      </div></section>
      <section class="stage"><div class="stage-inner story" style="padding-top:var(--pad)">
        <div class="big-year" aria-hidden="true">1995</div>
        <div>
          <span class="eyebrow" style="color:var(--ink-2)">Praha · Žižkov</span>
          <div class="sec-head" style="margin:6px 0 18px"><h2>Od SAMETu <span class="script">k Montaně</span></h2></div>
          <p>V roce 1995 otevřel na Žižkově obchod SAMET – graffiti, vinyly a streetwear, který tehdy u nás nebyl k sehnání. Z místa, kde se potkávali writeři, hudebníci a celá scéna, vyrostl e-shop a k 20. výročí vznikl Montana-cans.cz – český domov kompletního sortimentu německé Montany.</p>
          <a class="btn" href="#/o-nas" style="margin-top:10px">Náš příběh ›</a>
        </div>
      </div></section>
      <section class="perks">
        <div class="perk"><span class="num">01</span><b>Osobní odběr</b><p>Praha 13 – Stodůlky, 5 min od metra B Hůrka. Po telefonické dohodě.</p></div>
        <div class="perk"><span class="num">02</span><b>Doprava zdarma</b><p>Při nákupu nad 3 000 Kč posíláme zdarma.</p></div>
        <div class="perk"><span class="num">03</span><b>Sleva 3–5 %</b><p>Nad 5 000 Kč sleva a doprava zdarma.</p></div>
        <div class="perk"><span class="num">04</span><b>Bez starostí</b><p>Výměna zboží i reklamace v ceně objednávky.</p></div>
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
        const sc = ad === 0 ? 1 : ad === 1 ? .62 : ad === 2 ? .46 : .3;
        const off = d === 0 ? 0 : Math.sign(d) * (step * (ad === 1 ? 1 : ad === 2 ? 1.75 : 2.4));
        s.style.setProperty('--off', off);
        s.style.setProperty('--s', sc);
        s.style.setProperty('--o', ad > 2 ? 0 : ad === 2 ? .7 : 1);
        s.style.zIndex = 10 - ad;
        s.classList.toggle('is-center', d === 0);
        s.setAttribute('aria-hidden', d !== 0);
      });
    }
    function show(i) {
      cur = (i + HEROES.length) % HEROES.length;
      const p = HEROES[cur];
      setColors(...p.hero.grad);
      layout();
      const g = $('#ghost'); g.classList.add('swap');
      setTimeout(() => { g.textContent = p.hero.word; g.classList.remove('swap'); }, 200);
      $('#counter').textContent = `${pad(cur + 1)} / ${pad(HEROES.length)}`;
      $('#heroText').innerHTML = `<div class="fade-up"><span class="eyebrow" style="color:var(--ink-2)">${esc(catOf(p.cat).label)} · ${esc(p.tag)}</span>
        <h1 class="hero-title">${esc(p.name)}</h1><span class="hero-script script">${esc(p.hero.script)}</span>
        <div class="hero-price">${p.from ? 'od ' : ''}<b>${kc(p.price)}</b></div></div>`;
      $('#discover').href = `#/p/${p.id}`;
    }
    $('#prev').onclick = () => show(cur - 1);
    $('#next').onclick = () => show(cur + 1);
    track.addEventListener('click', e => {
      const s = e.target.closest('.slide'); if (!s) return;
      const i = +s.dataset.i;
      i === cur ? location.hash = `#/p/${HEROES[i].id}` : show(i);
    });
    let sx = null;
    track.addEventListener('pointerdown', e => { sx = e.clientX; });
    track.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) show(cur + (e.clientX < sx ? 1 : -1)); sx = null; });
    const onKey = e => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', layout);
    show(0);
    $('#ghost').textContent = HEROES[0].hero.word;
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', layout); };
  }

  function viewShop(catKey, query = '') {
    const c = catOf(catKey);
    setColors(...(c ? [c.a, c.b] : ['#ff6a1a', '#2a0e02']));
    const state = { q: query, sort: 'rec' };
    main.innerHTML = `
      <section class="stage full"><div class="stage-inner">
        <div class="shop-head"><span class="eyebrow" style="color:var(--ink-2)">Shop · ${c ? c.sub : 'Celý sortiment'}</span>
          <h1>${c ? c.label : 'Všechno'}<span class="script">${c ? 'Montana ' + c.label.toLowerCase() : 'for the culture'}</span></h1></div>
        <div class="toolbar">
          <div class="chips"><a class="chip ${!c ? 'on' : ''}" href="#/shop">Vše <small>${P.length}</small></a>
            ${CATS.map(x => `<a class="chip ${c && c.key === x.key ? 'on' : ''}" href="#/shop/${x.key}">${x.label} <small>${countIn(x.key)}</small></a>`).join('')}</div>
          <div class="tools">
            <label class="sr" for="q">Hledat</label><input class="field" id="q" type="search" placeholder="Hledat…" value="${esc(query)}">
            <label class="sr" for="sort">Řazení</label>
            <select class="field" id="sort"><option value="rec">Doporučené</option><option value="asc">Cena ↑</option><option value="desc">Cena ↓</option><option value="az">A–Z</option></select>
          </div>
        </div>
        <div class="grid" id="grid"></div>
      </div></section>
      ${ticker()}${footer()}`;
    const draw = () => {
      const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      let list = P.filter(p => (!c || p.cat === c.key) && norm(p.name + ' ' + p.tag + ' ' + p.cat).includes(norm(state.q)));
      if (state.sort === 'asc') list.sort((a, b) => a.price - b.price);
      if (state.sort === 'desc') list.sort((a, b) => b.price - a.price);
      if (state.sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
      $('#grid').innerHTML = list.length ? list.map(card).join('') : `<p class="empty" style="grid-column:1/-1">Nic jsme nenašli. Zkus jiný výraz.</p>`;
    };
    $('#q').addEventListener('input', e => { state.q = e.target.value; draw(); });
    $('#sort').addEventListener('change', e => { state.sort = e.target.value; draw(); });
    draw();
  }

  function viewProduct(id) {
    const p = byId[id];
    if (!p) return viewNotFound();
    setColors(...colorsFor(p));
    const sib = P.filter(x => x.cat === p.cat);
    const k = sib.indexOf(p);
    const prev = sib[(k - 1 + sib.length) % sib.length], next = sib[(k + 1) % sib.length];
    const c = catOf(p.cat);
    const needsVariant = p.from || ['spreje', 'efekty', 'fixy', 'obleceni'].includes(p.cat);
    const varLabel = p.cat === 'obleceni' ? 'Velikost (např. M)' : 'Odstín (např. RV-2004)';
    const related = sib.filter(x => x !== p).slice(0, 4);
    main.innerHTML = `
      <section class="stage full"><div class="pd">
        <div class="pd-tabs">
          <a class="chip soft" href="#/shop/${p.cat}">‹ Zpět</a>
          <button class="chip soft on" data-tab="overview">Přehled</button>
          <button class="chip soft" data-tab="details">Detaily</button>
        </div>
        <div class="pd-info">
          <span class="eyebrow" style="color:var(--ink-2)">${esc(c.label)}</span>
          <h1>${esc(p.name)}</h1>
          <span class="hero-script script">${esc(p.tag)}</span>
          <div id="tab-overview">
            <p class="pd-desc">${esc(p.desc)}</p>
            <div class="chips"><span class="chip soft">Montana Cans</span><span class="chip soft">${esc(c.label)}</span><span class="chip soft">Osobní odběr Praha</span></div>
            <p class="pd-note">Od umělců scény pro umělce scény.</p>
          </div>
          <div id="tab-details" hidden>
            <table class="spec"><tbody>
              <tr><td>Značka</td><td>Montana Cans (Německo)</td></tr>
              <tr><td>Kategorie</td><td>${esc(c.label)} · ${esc(p.tag)}</td></tr>
              <tr><td>Cena</td><td>${p.from ? 'od ' : ''}${kc(p.price)} vč. DPH</td></tr>
              <tr><td>Doprava</td><td>Zdarma nad 3 000 Kč, osobní odběr Praha 13</td></tr>
            </tbody></table>
            <a class="link" href="${p.url}" target="_blank" rel="noopener">Vzorník odstínů a bezpečnostní listy ›</a>
          </div>
        </div>
        <div class="pd-media">${p.hero ? `<img src="${p.hero.img}" alt="${esc(p.name)}">` : `<img class="boxed" src="${p.img}" alt="${esc(p.name)}">`}</div>
        <div class="pd-buy">
          <div class="pd-price">${p.from ? '<small>od</small>' : ''}${kc(p.price)}</div>
          <div class="qty"><button data-step="-1" aria-label="Méně">−</button><input id="qty" type="number" min="1" value="1" aria-label="Množství"><button data-step="1" aria-label="Více">+</button></div>
          ${needsVariant ? `<label class="sr" for="variant">${varLabel}</label><input class="field variant" id="variant" placeholder="${varLabel}">` : ''}
          <button class="btn accent" id="buy">Do košíku</button>
          <div class="pd-nav"><a class="round" href="#/p/${prev.id}" aria-label="Předchozí produkt">‹</a><a class="round" href="#/p/${next.id}" aria-label="Další produkt">›</a></div>
        </div>
      </div></section>
      ${related.length ? `<section class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow">Mohlo by se hodit</span><h2>Z této <span class="script">řady</span></h2></div></div>
        <div class="grid">${related.map(card).join('')}</div></div></section>` : ''}
      ${footer()}`;
    $$('[data-tab]').forEach(b => b.addEventListener('click', () => {
      $$('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
      $('#tab-overview').hidden = b.dataset.tab !== 'overview';
      $('#tab-details').hidden = b.dataset.tab !== 'details';
    }));
    $$('[data-step]').forEach(b => b.addEventListener('click', () => { const q = $('#qty'); q.value = Math.max(1, (+q.value || 1) + +b.dataset.step); }));
    $('#buy').addEventListener('click', () => Cart.add(p.id, Math.max(1, +$('#qty').value || 1), ($('#variant')?.value || '').trim()));
  }

  function viewAbout() {
    setColors('#ff6a1a', '#2a0e02');
    main.innerHTML = `
      <section class="stage full"><div class="stage-inner story" style="min-height:calc(100svh - 32px)">
        <div><span class="eyebrow" style="color:var(--ink-2)">O nás</span>
          <div class="sec-head" style="margin:6px 0 20px"><h2 style="font-size:clamp(44px,7vw,110px)">For the <span class="script">culture</span></h2></div>
          <p>Montana Cans Česká republika navazuje na obchod SAMET, který otevřel v roce 1995 v pražské čtvrti Žižkov. Spojoval graffiti sortiment, vinylové desky a oblečení amerických streetových značek – věci, které tehdy byly pro české zákazníky prakticky nedostupné.</p>
          <p>SAMET se stal místem setkání writerů, hudebníků a fanoušků, konaly se tu akce, koncerty i workshopy. Dnes, po téměř třiceti letech, pokračujeme jako specializovaný e-shop Montana-cans.cz s kompletním sortimentem německé značky Montana Cans.</p>
        </div>
        <div class="big-year" aria-hidden="true">1995</div>
      </div></section>
      <section class="stage plain"><div class="stage-inner" style="padding-top:var(--pad)">
        <div class="sec-head"><div><span class="eyebrow">Historie</span><h2>Timeline</h2></div></div>
        <ol class="timeline">
          <li><b>1995</b><p>SAMET otevírá na Žižkově – graffiti, vinyly a streetwear pod jednou střechou. Ikona v Česku i ve střední a východní Evropě.</p></li>
          <li><b>2000+</b><p>S nástupem online nakupování přichází první e-shop zaměřený na graffiti a streetwear.</p></li>
          <li><b>20 let</b><p>K 20. výročí vzniká Montana-cans.cz – e-shop specializovaný na kompletní výrobky Montana Cans.</p></li>
          <li><b>2018</b><p>Počet poboček roste na pět – v různých částech Prahy a ČR, každá se svým vlastním charakterem.</p></li>
          <li><b>Dnes</b><p>Pořád žijeme scénou: barvy, fixy, trysky, oblečení a doplňky Montana s osobním odběrem v Praze.</p></li>
        </ol>
      </div></section>
      <section class="stage light"><div class="stage-inner story" style="padding-top:var(--pad)">
        <div><span class="eyebrow">Montana Cans Německo</span>
          <div class="sec-head" style="margin:6px 0 18px"><h2>60+ zemí</h2></div>
          <p>Montana a tým L&amp;G jsou od začátku spjati s uměleckou scénou – zakladatelé z ní vzešli a dodnes jsou její aktivní součástí. Z malého snu vyrostla značka, která expandovala do více než 60 zemí. Stojí na nadstandardní kvalitě, obrovské škále odstínů a širokém výběru doplňků – fixy, náplně, samolepky, oblečení.</p></div>
        <p class="quote">„Od umělců scény<br>pro umělce scény.“</p>
      </div></section>
      ${footer()}`;
  }

  function viewContact() {
    setColors('#3f7bff', '#061636');
    main.innerHTML = `
      <section class="stage full"><div class="stage-inner">
        <div class="shop-head"><span class="eyebrow" style="color:var(--ink-2)">Kontakt</span><h1>Zastav se<span class="script">po telefonu</span></h1></div>
        <div class="contact" style="margin-top:34px">
          <div style="display:grid;gap:16px">
            <div class="box"><h3>Osobní odběr</h3><p class="lg">Volutová 2522/16<br>Praha 13 – Stodůlky, 158 00</p><p style="color:var(--ink-2)">5 minut od stanice metra B „Hůrka“. Osobní odběr je možný pouze po telefonické dohodě.</p>
              <a class="btn" style="margin-top:10px" href="https://maps.google.com/?q=Volutov%C3%A1+2522%2F16+Praha+13" target="_blank" rel="noopener">Navigovat ›</a></div>
            <div class="box"><h3>Otevírací doba</h3><p class="lg">Po–Čt 9–16<br>Pá 10–16</p></div>
            <div class="box"><h3>Ozvi se</h3>
              <p class="lg"><a href="tel:${SHOP.phoneRaw}">${SHOP.phone}</a></p>
              <p><a class="link" href="mailto:${SHOP.info}">${SHOP.info}</a> · <a class="link" href="mailto:${SHOP.email}">${SHOP.email}</a></p>
              <p><a class="link" href="${SHOP.instagram}" target="_blank" rel="noopener">Instagram @montanacans.cz</a></p></div>
          </div>
          <iframe class="map" title="Mapa – Volutová 2522/16, Praha 13" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=Volutov%C3%A1%202522%2F16%2C%20Praha%2013&z=15&output=embed"></iframe>
        </div>
      </div></section>
      <section class="stage plain"><div class="stage-inner contact" style="padding-top:var(--pad)">
        <div class="box"><h3>Provozovatel & fakturace</h3><p>Václav Jung<br>Oranžová 215, 252 19 Chrášťany, okr. Praha-západ</p><p>IČO 63093464 · DIČ CZ6902181781</p></div>
        <div class="box"><h3>Reklamace a vrácení</h3><p>Václav Jung<br>Volutová 2522/16, 158 00 Praha 13</p><p style="color:var(--ink-2)">Výměna zboží a reklamace v ceně objednávky. Podrobnosti v <a class="link" href="${SHOP.terms}" target="_blank" rel="noopener">obchodních podmínkách</a>.</p></div>
      </div></section>
      ${footer()}`;
  }

  function viewNotFound() {
    setColors('#ff2d95', '#2a0318');
    main.innerHTML = `<section class="stage full"><div class="stage-inner" style="display:grid;place-items:center;min-height:calc(100svh - 32px);text-align:center">
      <div><div class="big-year">404</div><p class="quote" style="margin:20px 0">Tady už někdo přestříkal…</p><a class="btn" href="#/">Domů</a></div></div></section>`;
  }

  /* ---------- router ---------- */
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    toggleMenu(false);
    const [path, qs] = location.hash.replace(/^#/, '').split('?');
    const parts = path.split('/').filter(Boolean);
    const params = new URLSearchParams(qs || '');
    let r;
    if (!parts.length) r = viewHome();
    else if (parts[0] === 'shop') r = viewShop(parts[1], params.get('q') || '');
    else if (parts[0] === 'p') r = viewProduct(parts[1]);
    else if (parts[0] === 'o-nas') r = viewAbout();
    else if (parts[0] === 'kontakt') r = viewContact();
    else r = viewNotFound();
    if (typeof r === 'function') cleanup = r;
    main.classList.remove('page-enter'); void main.offsetWidth; main.classList.add('page-enter');
    window.scrollTo({ top: 0, behavior: 'instant' });
    const h = main.querySelector('h1');
    document.title = (h && parts.length ? h.firstChild.textContent.trim() + ' · ' : '') + 'Montana Cans CZ · Graffiti barvy, fixy a trysky';
  }

  main.addEventListener('click', e => {
    const a = e.target.closest('[data-add]');
    if (a) { e.preventDefault(); Cart.add(a.dataset.add); }
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); toggleMenu(false); } });
  window.addEventListener('hashchange', route);
  renderBadge();
  route();
})();
