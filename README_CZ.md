# PMD85Games

[English version](README.md)

Vue sbírka reimplementací her z PMD 85. První karta: **Flappy**.
Druhá karta: **Pampúch & Duch**. Struktura a pravidla vývoje vycházejí ze
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
a Pampucha; ES moduly Flappyho a offline podpora vyžadují HTTP/HTTPS.

## Hry a ovládání

- `#/flappy`: zkopírované [Flappy](https://github.com/pkristofik49/Flappy),
  200 místností, šest grafických režimů, hesla, dotykové ovládání, zvuk a ukládání.
  Jazyk, zvuk a grafika mají vlastní nastavení uvnitř herního okna.
  Podrobnosti v [převzatém README](games/flappy/README.md).
- `#/pampuch`: jedenáct původních map a černobílé bitmapy; pět životů,
  čtyři nezničitelní duchové, pohyb po půl políčku, bod a čtyři jednotky času
  za kroužek, blokující náhrobky, opakování map a bonusové životy po dokončení
  čtvrté a osmé mapy každého cyklu. Čas začíná na 500; vypršení ukončí hru.

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
původu, ukládá ignorované snímky do `test-results/` a obnovuje PNG ikony
ze souboru `icons/icon.svg`.

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
