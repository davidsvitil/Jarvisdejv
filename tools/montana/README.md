# Aktualizace katalogu

```bash
python3 tools/montana/full_scrape.py                    # stáhne CZ/CZK + EN/EUR data ze současného e-shopu
python3 tools/montana/build_catalog.py montana-cans     # vytvoří data/catalog.json a WebP fotky
```
Potřeba: Python 3, Pillow, curl.
