# Herní grafika

## Sharp MZ-800, MSX a Nintendo NES

`retro-data.js` obsahuje RGB pixely historických spritů a jejich odvozených
směrových fází; původ, souřadnice importu a omezení jsou v [SOURCES.md](../SOURCES.md).
`src/retro.js` kreslí bitmapy bez externích knihoven. Tyto režimy mají Canvas
320 × 200, zachovávají současná pravidla, smrt i rozsypání kamenů.

- [title-sharp.png](title-sharp.png): statická fáze úvodu sestavená z nativních dat.
- [title-msx.png](title-msx.png): původní úvodní menu MSX, 256 × 192.
- [title-nes.png](title-nes.png): původní titulní snímek NES, 256 × 224.

Úvod PC se vykresluje lokálně přes Canvas z krtka, krystalu a přeloženého titulku.
PMD 85-1 používá beze změn obrázek VBG; PMD-85-3 používá původní snímek
remasteru [title-pmd85-3.gif](title-pmd85-3.gif), 576 × 512, stažený beze změn
z [Title2.gif na stránce autora](https://www.pmd85.cz/wp-content/uploads/Title2.gif).
Všechny podklady jsou dostupné i v offline cache.

MSX kameny se importují v celé původní velikosti 16 × 16 pixelů: běžný kámen
ze souřadnic `(144,64)` a cílový ze `(184,32)` herního snímku. Levé čtyři sloupce
se zachovávají; výřez už není useknutý a obsahuje plný obrys.

## PC

[modern-sprites.png](modern-sprites.png) je samostatný atlas 1254 × 1254 pixelů
s průhledným pozadím. Nová grafika vznikla vestavěným nástrojem **imagegen**;
přesný prompt úpravy na krtka je uložen v [modern-mole-prompt.txt](modern-mole-prompt.txt).
PNG je uložený beze změn, včetně alfa kanálu. Nejde o bitmapy z historické hry.

Atlas má 4 × 4 buňky. Jejich pořadí zleva doprava:

| Řádek | Snímky |
| --- | --- |
| 1 | Krtek vlevo postoj / krok, vpravo postoj / krok |
| 2 | Krtek dolů postoj / krok, nahoru postoj / krok |
| 3 | Žába vlevo, vpravo, dolů, nahoru |
| 4 | Duch vlevo, nepoužívaný původní cílový sprite, kámen, houba |

Cílový předmět nově používá [modern-crystal.png](modern-crystal.png): hranatý
modrý kámen s výraznými krystalickými ploškami. Jde o samostatný průhledný
sprite vytvořený vestavěným imagegen; přesný prompt je v
[modern-crystal-prompt.txt](modern-crystal-prompt.txt). Renderer jím nahrazuje
druhou buňku posledního řádku atlasu. Režimy PMD 85-1 a PMD-85-3 opět používají
předchozí původní obrys cílového kamene se světlou výplní, v barevném režimu modrý.

`src/graphics.js` ořízne při načtení pouze průhledné okraje buněk pro vykreslení;
zdrojové PNG nemění. Duch se zrcadlí při pohybu doprava, skoky žáby používají
její směrové snímky a krátké zvednutí. Mrtvolka používá zploštění příslušného
spritu. Svislá chůze krtka střídá dva kreslené snímky; zadní pohled ukazuje záda bez obličeje.
Boční chůze používá [modern-mole-walk.png](modern-mole-walk.png), nový průhledný
atlas vytvořený vestavěným imagegen podle [přesného promptu](modern-mole-walk-prompt.txt).
Buňky jsou ve čtyřech řádcích po čtyřech: prvních osm je chůze vlevo, dalších osm
vpravo. Tlapky se střídají v celém osmifázovém cyklu. Společný výřez zachovává
velikost těla mezi snímky; fáze se mění po 60 ms pouze při pohybu.
Moderní režim renderuje plochu v rozlišení 1280 × 800 (16:10, stejně jako NES) se zachováním stejné
herní mřížky a kolizí. Zdivo je kreslené přes Canvas jako červené cihly ve dvou
řadách na buňku, s půlcihlovým posunem svislých spár a světlou horní hranou.
Cílové políčko v PC používá stejnou cihlovou kresbu v modré a azurové paletě
krystalu, včetně tmavých spár a světlých hran.
Ukazatele používají vyhlazené systémové písmo Courier New bez dalších fontových souborů.
Prostřední okénko SEKTOR má stejné pozadí jako pravé okénko VBG-SOFT.
`src/motion.js` interpoluje pozice všech pohyblivých objektů; fáze kroků, poskoky
žab a vznášení duchů se vykreslují na snímcích prohlížeče. Kolizní mřížka zůstává
stejná. Při smrti se obraz zarovná s místem kolize, při pauze se hodiny animací zastaví.

## PMD 85-1 a PMD-85-3

`pmd-ai-probes.js` uchovává původní bitmapové bajty PMD vydání 1987, které
rozhodovací rutiny nepřátel používají jako kolizní značky. Nevykreslují se;
jejich použití udržuje stejné rozhodování ve všech grafických režimech.
Podrobnosti, import a porovnání s původním kódem jsou v [SOURCES.md](../SOURCES.md).

V PMD 85-1 mají zdi i rozbitné kameny tmavší odstín `#aab2a2`, stejný jako
nápis VBG-SOFT. Cílový kámen zůstává světlý pro snadné rozlišení.

`title-screen.png` je původní úvodní obrazovka Flappy od VBG Software (1987),
stažená beze změn ze [souboru Vbg_flappy_3.png na PMD 85 Infoserveru](https://pmd85.borik.net/w/images/b/bc/Vbg_flappy_3.png).
Má rozlišení 288 × 256 pixelů. Zobrazuje se po otevření hry; výzva ke spuštění
je pod obrázkem, aby nezakrývala jeho kresbu ani autorské údaje.
Kliknutí, klepnutí nebo mezerník spustí místnost; do té doby hra i časomíra stojí.

Grafika je uložená v `game-data.js` jako pole čísel `sprites`, nikoli jako jednotlivé PNG.
Každý bajt obsahuje šest vodorovných pixelů, od nejnižšího bitu doleva doprava.
Snímky mají obvykle 12 × 16 pixelů (32 bajtů). Boční kroky mají 18 × 16 pixelů
(48 bajtů); svislé skoky žáby 12 × 24 pixelů (48 bajtů).

`src/render.js` tyto bitmapy kreslí na Canvas. Boční chůze Flappyho nyní používá
přímo původní snímky; jejich nohy se programově nepřekreslují.

## Obrazový přehled

Otevři [sprites.png](sprites.png). Zobrazuje skutečné animační fáze používané hrou,
zvětšené čtyřikrát bez vyhlazování. Řádky shora:

1. Flappy vlevo — čtyři fáze cyklu, dvě původní bitmapy.
2. Flappy vpravo — čtyři fáze cyklu, dvě původní bitmapy.
3. Flappy nahoru.
4. Flappy dolů.
5. Žába vlevo — postoj / skok.
6. Žába vpravo — postoj / skok.
7. Žába nahoru — postoj / skok.
8. Žába dolů — postoj / skok.
9. Duch vlevo / vpravo.
10. Rozdrcený duch / žába — původní zploštělé bitmapy 12 × 8 pixelů.
11. Zmáčknutý Flappy — původní bitmapa 12 × 8 pixelů na adrese `0x25db`.
12. Dva původní snímky rozsypaného kamene, 12 × 16 pixelů, adresy `0x2607` a `0x2628`.

Rozsypání v PMD režimech střídá tyto snímky. PC rozdělí běžný kámen do dvanácti
úlomků, které klesají, rozestupují se a mizí. Efekty trvají šest herních kroků,
jsou neškodné a při pauze stojí.

Přehled je pouze náhled pro prohlížení; hra vykresluje přímo pole bitmap.
Po úpravě snímků ho obnov příkazem `node tools/sprite-sheet.mjs`.

## Extrakce

`tools/extract-assets.mjs` načítá původní bitmapy z pásky FLAPPY2k. Původ a hash
zdroje jsou v [SOURCES.md](../SOURCES.md). Boční Flappy používá tyto adresy
v původním paměťovém obrazu (pixelová data bez předcházejícího atributu barvy):

| Směr | Postoj | Krok |
| --- | --- | --- |
| Vlevo | `0x2534` | `0x2503` |
| Vpravo | `0x244e` | `0x241d` |
