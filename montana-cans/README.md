# Montana Cans CZ – nový web / e-shop

Statický frontend (HTML + CSS + vanilla JS, bez buildu) pro montana-cans.cz, vizuálně inspirovaný patike.ch.

## Co umí
- **Kompletní katalog** – 331 produktů, 894 variant (všechny odstíny sprejů s HEX barvou a kódem, velikosti oblečení), sklad a ceny podle současného e-shopu (stav 18. 11. 2026).
- **CZ / EN** a **Kč / €** – přepínač v menu i patičce. Anglické texty a eurové ceny pocházejí z administrace současného e-shopu (kurz 1 € ≈ 24,45 Kč); 29 produktů bez EN překladu má český text a cenu přepočtenou kurzem.
- Výběr odstínu se swatchi a vyhledáváním (např. „G1000“ nebo „shock“), vyprodané odstíny jsou přeškrtnuté, pozadí stránky se přebarví podle vybraného odstínu.
- Shop s kategoriemi, podkategoriemi, hledáním (i podle kódu odstínu), řazením, filtrem „jen skladem“ a stránkováním.
- Košík (localStorage) s ukazatelem dopravy zdarma, objednávka zatím přes e-mail (mailto na shop@montana-cans.cz).

## Spuštění lokálně
```bash
cd montana-cans
python3 -m http.server 8000   # http://localhost:8000
```
Katalog se načítá přes `fetch`, takže otevření `index.html` přímo ze souboru nefunguje – je potřeba server.

## Nasazení
Web běží na https://davidsvitil.github.io/web/ (kořenový `index.html` přesměruje do `montana-cans/`). Funguje s oběma zdroji GitHub Pages – „Deploy from a branch“ (main, /root) i „GitHub Actions“ (workflow `.github/workflows/pages.yml`).
Doporučeno: Settings → Pages → Source: **GitHub Actions** (jinak se nasazuje dvakrát).

## Struktura
- `index.html` – kostra, pill navigace, košík
- `css/style.css` – design
- `js/i18n.js` – texty CZ/EN
- `js/app.js` – router (`#/`, `#/shop/:kat/:podkat`, `#/p/:id?v=variant`, `#/o-nas`, `#/kontakt`), carousel, varianty, košík, objednávka
- `data/catalog.json` – katalog (generovaný ze současného e-shopu)
- `assets/img/p/` – fotky produktů (WebP), `assets/img/hero/` – výřezy pro carousel, `assets/fonts/` – self-hostované fonty

## Co ještě chybí do ostrého provozu
- **Platby, sklad a objednávky v reálném čase.** Statický web data nesynchronizuje; ceny a sklad jsou snímek. Doporučené řešení: napojit tento frontend na stávající Bagisto (API nebo nová šablona), případně jiná platforma – rozhodne majitel.
- Ceník dopravy (v košíku je zatím „dle ceníku“) a pravidla slev nad 5 000 Kč.
