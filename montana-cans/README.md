# Montana Cans CZ – koncept nového webu

Statický web (HTML + CSS + vanilla JS, žádný build) pro montana-cans.cz.
Vizuálně inspirovaný patike.ch: tmavý rám, zaoblené „stage“ plochy, plovoucí skleněné pill menu,
obří ghost nápisy, carousel s barevným pozadím podle produktu, marker/script akcenty.

## Spuštění
```bash
cd montana-cans
python3 -m http.server 8000   # pak otevři http://localhost:8000
```
Nahrát jde na jakýkoli statický hosting (GitHub Pages, Netlify, Wedos…) – stačí zkopírovat složku.

## Struktura
- `index.html` – kostra, pill navigace, košík
- `css/style.css` – veškerý design
- `js/app.js` – router (`#/`, `#/shop/:kategorie`, `#/p/:id`, `#/o-nas`, `#/kontakt`), carousel, košík (localStorage), objednávka
- `js/data.js` – 51 vybraných produktů (názvy, ceny, obrázky ze stávajícího e-shopu, stav 11/2026)
- `assets/` – fotky produktů, výřezy pro carousel, self-hostované fonty (Inter, Sedgwick Ave)

## Omezení konceptu
- Objednávka se odesílá **e-mailem** (mailto na shop@montana-cans.cz) – není napojená na platební bránu ani sklad.
- Odstín/velikost se zadává textem, ne výběrem ze vzorníku.
- Katalog je výběr, ne kompletních ~330 položek.
