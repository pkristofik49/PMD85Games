# PMD85Games

[English version](README.md)

Vue sbírka reimplementací her z PMD 85. První karta: **Flappy**.
Druhá karta: **Pampúch & Duch**. Třetí karta: **Boulder Dash**. Čtvrtá karta: **Auto**.
Pátá karta: **Žáby / Frogs**. Šestá karta: **Manic Miner**.
Sedmá karta: **Cihly / Bricks**.
Struktura a pravidla vývoje vycházejí ze
[SMG](https://github.com/pkristofik49/SMG): lokální Vue 3.5.45, statické HTML/CSS/JS,
nativní API prohlížeče, žádná další běhová knihovna ani instalace npm balíčků.

## Spuštění

Složku obslužte libovolným statickým HTTP serverem. Přiložený server potřebuje
Node.js 22+, nepotřebuje balíčky:

```sh
node tools/serve.mjs
```

Otevřete **http://127.0.0.1:4173/PMD85Games/**. Cesty podporují i kořen serveru
a GitHub Pages pod `/PMD85Games/`. Přímé otevření přes `file://` podporuje menu
a Pampucha, Boulder Dash, Auto, Žáby, Manic Miner i Cihly; ES moduly Flappyho a offline podpora vyžadují HTTP/HTTPS.

## Hry a ovládání

- `#/flappy`: zkopírované [Flappy](https://github.com/pkristofik49/Flappy),
  200 místností, šest grafických režimů, hesla, dotykové ovládání, zvuk a ukládání.
  Jazyk, zvuk a grafika mají vlastní nastavení uvnitř herního okna.
  Podrobnosti v [převzatém README](games/flappy/README.md).
- `#/pampuch`: jedenáct původních map a černobílé bitmapy; pět životů,
  čtyři nezničitelní duchové, pohyb po půl políčku, bod a čtyři jednotky času
  za kroužek, blokující náhrobky, opakování map a bonusové životy po dokončení
  čtvrté a osmé mapy každého cyklu. Čas začíná na 500; vypršení ukončí hru.
- `#/boulder`: původní PMD program **BOULD+4 (VBG Software, 1988)**,
  68 sektorů propojených původním bludištěm a deset počátečních životů. Grafiku
  z obrazové paměti, pravidla sektorů, nepřátele, padání kamenů i PIO zvuk
  zpracovává stejný 8080/PMD emulátor jako u Pampucha. Do sektorů se vstupuje
  v původním bludišti; samostatný webový výběr se nepoužívá. Karta ukazuje
  původní titulní obrazovku. Držte šipky/WASD pro pohyb a mezerník/Shift pro
  původní akci. Na mobilu je také kulaté tlačítko akce. Vstup se převádí na
  původní matici E/Y/vlevo/vpravo/Shift bez úprav programu hry. Zkratky
  P/Escape, N, H, F a Z fungují jako u Pampucha. Kompletní CPU, RAM a zvuková
  fáze se ukládají zvlášť do `pmd85games.boulder.v1`; obnovená hra je pozastavená.
  Všechny hry fungují offline po instalaci aktualizovaného service workeru.
- `#/auto`: **AUTO od R. D.**, původní PMD program z `games-1.ptp`.
  Projeďte pět kol klikaté silnice s co nejmenším počtem havárií. Původní program
  řídí jemné natáčení auta, posun silnice, odrazy po nárazu, zrychlování, počítání
  havárií, cílovou obrazovku i zvuk. Použijte šipky vlevo/vpravo nebo A/D;
  na telefonu jsou dvě směrová tlačítka. Ta odpovídají původním vstupům levý EOL
  a V. P/Escape, Enter, N, H, F a Z fungují jako u Pampucha. Původní počet
  havárií a zbývajících kol se ukazuje také pod plochou. Samostatné ukládání
  celého stroje používá `pmd85games.auto.v1`; obnovená hra je pozastavená.
  Karta používá snímek původní jízdy, protože originál nemá titulní menu.
  Nepřibyla žádná další knihovna.
- `#/zaby`: **ZABY / Žáby**, původní archivovaná verze pro ROM modul MRM.
  Její původní dekompresor, úvodní obrazovka, plošiny, skoky, zásoba osmi žab,
  kolize podle pixelů, BCD skóre a PIO zvuk běží na existujícím PMD emulátoru.
  Nejdřív klávesou R vyšlete novou žábu (původní K9), mezerníkem/↑/W skákejte
  (původní K4). Do stran žábu unášejí plošiny; samostatně se neřídí. Na mobilu
  jsou dvě odpovídající tlačítka. P/Escape, Enter, N, H, F a Z fungují jako
  u Pampucha. Skóre a zásoba žab zůstávají v původní herní ploše. Ukládání
  používá `pmd85games.zaby.v1` a obnoví pozastavenou hru. Původní zadávání
  jména do tabulky rekordů nahrazuje webový překryv konce hry a nové hry.
  Karta ukazuje původní úvodní obrazovku; nepřibyla knihovna. Autor a rok
  vydání nejsou doloženy.
- `#/manic`: **MANIC+ pro PMD 85-1 (Vít Libovický a Daniel Jenne, 1985)**,
  dvacet původních šachet a osm počátečních životů. Sbírání předmětů, kyslík,
  nepřátele, dopravníky, propadající se podlahy, skoky, pády a přechody mezi
  šachtami řídí původní program na existujícím PMD emulátoru. Pohyb: ←/→ nebo
  A/D; skok: mezerník/Shift/↑/W. Na telefonu jsou dvě šipky a kulaté tlačítko
  skoku. P/Escape, Enter, N, H, F a Z fungují jako u Pampucha. Původní herní
  ukazatele a úvodní pixely zůstávají zachované. Při zapnutém zvuku na úvodní
  obrazovce jednou zazní původní melodie, bez následného ukázkového hraní;
  start ji přeskočí původním vstupem STOP. Herní hudbu i efekty vytvářejí také
  původní PIO výstupy. Ukládání používá `pmd85games.manic.v1`: úvod se obnoví
  v uložené pozici, rozehraná hra pozastavená. Zadávání jména do původní tabulky
  rekordů nahrazuje webový konec hry. Karta používá původní úvodní obrazovku;
  nepřibyla knihovna. Všech sedm her je dostupných offline.
- `#/cihly`: **Cihly / Bricks (ZED, R. D.)**, převzaté bajt po bajtu z původní
  pásky. PMD program řídí vozík, míček, odrazy, mazání cihel, body, tři míčky,
  závěrečnou animaci i zvuky. Pohyb: ←/→ nebo A/D; na telefonu jsou dvě směrová
  tlačítka. P/Escape, Enter, N, H, F a Z fungují jako u Pampucha. Skóre, rekord
  a zásoba míčků se zobrazují v původní ploše. Nová hra využívá původní
  restartovací vstup a zachová či aktualizuje nativní rekord. Samostatné ukládání
  celého stroje používá `pmd85games.cihly.v1`; rozehraná hra se obnoví pozastavená.
  Karta ukazuje původní plochu, protože hra nemá samostatnou úvodní obrazovku.
  Nepřibyla knihovna; rok vydání není doložen.

Podklady lze znovu importovat bez závislostí příkazem
`node tools/import-boulder.mjs cesta/ke/games-vbg.ptp`; viz [SOURCES.md](SOURCES.md).
Podklady Auta obdobně vytvoří
`node tools/import-auto.mjs cesta/ke/games-1.ptp`.
Podklady Žab vytvoří `node tools/import-zaby.mjs cesta/ke/games-other.mrm`
ze stejného archivu. Důvod použití funkční MRM verze je v SOURCES.md.
Podklady Manic Minera vytvoří `node tools/import-manic.mjs cesta/ke/games-2.ptp`
ze stejného archivu; při importu se spustí původní kazetový zavaděč.
Podklady Cihel vytvoří `node tools/import-cihly.mjs cesta/ke/games-1.ptp`.
Kazetový název ZED a srovnání s komentovaným výpisem Cihel popisuje SOURCES.md.

Šipky/WASD mění směr průběžného pohybu. Předčasné zatočení zastaví postavu
u zdi. Na dotykových zařízeních jsou směrová tlačítka. P/Escape pozastaví,
Enter pokračuje, N vyvolá novou hru, H přepíná nápovědu, F zvětšení a Z zvuk.
Nová hra vyžaduje potvrzení; Escape ho zruší. Odchod ze hry, ztráta zaměření
nebo skrytí stránky hru pozastaví. Obnovení stránky načte pozastavenou hru.

Tlačítko s mřížkou **Úroveň** otevře výběr jedenácti map Pampucha. Dokončené mapy
mají fajfku; dostupná je také mapa 1 a další mapa odemčená každým dokončením.
Ostatní mapy zůstávají zamčené. Výběr spustí nový pokus s pěti životy a nulovým
skóre přes původní operandy úvodního menu. Otevření výběru hru pozastaví;
zavření nebo Escape obnoví předchozí stav. Dokončení se zjišťuje v původní větvi
úspěchu, nikoli při vstupu do mapy nebo smrti. Seznam se ukládá samostatně jako
`pmd85games.pampuch.completed` a zůstává zachovaný při nové hře, opakování,
obnovení stránky i offline hraní ve stejném prohlížeči. Ze starších nativních
uložení se dříve dokončené mapy odvodí podle dosažené úrovně.

Zvětšené zobrazení přizpůsobí původní poměr stran dostupné ploše bez pevného
omezení šířky a přepočítá rozměry při změně okna nebo otočení. Dotykové ovládání
je na výšku pod plochou, na nízkých obrazovkách na šířku vedle ní. Náhled v menu
ukazuje původní titulní obrazovku Pampucha. Ústa se při zobrazení střídají jednou
za dokončený půlkrok; mezikroky původního přepisování bitmapy při čtení klávesnice
se nezobrazují. RAM, časování procesoru, kolize ani zvuk se tím nemění.

Pampuch nyní provádí původní hru i monitor PMD 85-1 na malém vlastním jádře 8080
v JavaScriptu. Rozhodování duchů, kolize podle bajtů obrazové paměti, čtení kláves,
prodlevy po smrti i přechody map řídí původní instrukce. Časování používá takt
2,048 MHz včetně čekání na videoprocesor; pohyb nemá pevný prohlížečový interval.
Zvuk vzniká z původních zápisů na PIO a hardwarových děličů 1/4 kHz, ne z nově
vymyšlených tónů. Smrti a přechody map probíhají automaticky.
Prohlížeč nahrazuje úvod/výběr mapy a zadávání jmen rekordmanů vlastními prvky.
Jde o původní variantu PAMPUCH, nikoli ON&DUCH4 s hudbou. Přesný rozsah ověření
a omezení hardwarového jádra uvádí [SOURCES.md](SOURCES.md).

## Rozhraní, ukládání a offline

Výchozí je čeština; lze přepnout angličtinu a pět palet podle SMG.
Texty jsou v `js/translations.js`. Společná nastavení a Pampuch používají
klíče `pmd85games.*` v localStorage. Flappy zachovává původní `flappy.*` a
`flappy-pmd85-progress-v1`, včetně starších uložení na stejném původu.
Nedostupné úložiště nebrání hraní. Uložení zůstává v tomto prohlížeči,
bez synchronizace mezi zařízeními. Nativní Pampuch používá `pmd85games.pampuch.v2`
a ukládá RAM, procesor i fázi zvukových děličů. Nekompatibilní přibližná hra v1
začne znovu; staré uložení se nemaže. Rekord a nastavení zůstávají zachované.

Volitelná PWA po prvním úplném online načtení uloží obě hry a všechny běhové
soubory. Instalace vyžaduje HTTPS nebo localhost. Aktualizace čekají na zavření
starých oken a nepřerušují hru. Offline hraní před dokončením první instalace
není dostupné. Vymazání dat prohlížeče odstraní uložení i offline soubory.
Vložené Flappy používá kořenový service worker.

## Struktura a ověření

Společná aplikace používá `index.html`, `styles.css`, `js/`, `vendor/`, `assets/`,
`icons/` a `sw.js`. Převzaté Flappy je v `games/flappy/`. Testy a nástroje
používají jen vestavěné moduly Node.

```sh
node tools/check.mjs
node --test tests/*.test.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File tests/versioning.ps1
cd games/flappy
node --test tests/*.test.mjs
```

Z kořene obnoví `node tools/update-shell.mjs` seznam offline souborů;
kontroly odmítnou zastaralý seznam. Extrakci dat ze samostatně stažené pásky
lze zopakovat příkazem:

```sh
node tools/import-pampuch.mjs cesta/games-2.ptp --check
```

Původní grafika spritů je také exportovaná jako
[průhledný PNG atlas](assets/pampuch-sprites.png),
[JSON souřadnice spritů](assets/pampuch-sprites.json) a
[zvětšený náhled s popisky](assets/pampuch-sprites-preview.png).
Atlas obsahuje všech 13 původních bitmap 12 × 12 (včetně prázdné mazací bitmapy)
v obrázku 64 × 64, v buňkách po 16 pixelech s okrajem 2 pixely. Obnoví ho
`node tools/export-pampuch-sprites.mjs`; `tools/check.mjs` kontroluje aktuálnost.
Jde o podklad k prohlížení/exportu; hra nadále používá nativní data.

Pro obnovení nativního programu/monitoru připojte cestu k `monit1.rom`.
Běžné testy spouštějí tři nezávislé diagnostiky 8080 a porovnávají 2 400 nativních
kontrolních bodů vytvořených nezávislou implementací v C. Úplný exerciser CPU je
volitelný: nastavte `PMD_EXTENDED_CPU_TEST=1` a spusťte
`node --test tests/i8080.test.mjs` (přibližně minuta). Generování referenčních dat
vyžaduje C kompilátor a samostatné zdrojové repozitáře; viz `SOURCES.md`.

Volitelné prohlížečové kontroly vyžadují vývojový server a bezhlavý Chrome
s odděleným profilem a `--remote-debugging-port=9333`. Spusťte
`node tools/browser-check.mjs`. Ověří desktop/mobil, hraní, ukládání,
překlady, palety, Flappy a obě hry offline. Maže úložiště testovaného místního
původu a ukládá ignorované snímky do `test-results/`.
Při spuštěném stejném izolovaném Chromu obnoví `node tools/render-icons.mjs`
PNG ikony ze souboru `icons/icon.svg`. Vybraná pixelová ikona má PMD nad číslem
85; maskovatelná verze přidává bezpečný okraj pro ořez spouštěčem.

## Verzování a GitHub Pages

Repozitář: https://github.com/pkristofik49/PMD85Games

```sh
git config core.hooksPath .githooks
```

První commit má verzi **1.000**, další ji zvyšují o 0.001. Hook synchronizuje
`js/version.js`, `sw.js` a `commit.json`. Změny těchto souborů před commitem
přidejte do indexu. Patička ukazuje verzi a dostupný krátký hash commitu;
hash dodává vývojový server a publikační nástroj.

Workflow zkontroluje obě hry, připraví statickou aplikaci příkazem
`node tools/package.mjs` a po pushi do `main` publikuje `dist/`. V repozitáři
nastavte **Settings → Pages → Source: GitHub Actions** a povolte Actions/Pages.
Cílová URL: **https://pkristofik49.github.io/PMD85Games/**.
Aplikace sama nastavení hostingu nemění. Dokud Pages není zapnuté, kontroly
a příprava artefaktu proběhnou úspěšně a publikace se přeskočí s upozorněním.
Po zapnutí Pages spusťte workflow znovu pro publikaci.
