# Původ dat a grafiky

## Sharp MZ-800, MSX a Nintendo NES

Nové režimy jsou grafické adaptace na stávající mřížku a pravidla PMD, nikoli
emulátory jednotlivých počítačů a konzole. Herní sektory se přepnutím nemění.

- **Sharp:** [Flappy.cz — popis a podklady verze Sharp](https://flappy.cz/flappy/en/flappy.html),
  bitmapová data `http://flappy.cz/flappy/_js/game/Images.js`, nativní úvodní
  rozložení `Intro.js` a font `Font.js` ze stejného adresáře. Podklady zveřejnil
  Petr Šlechta ve své adaptaci původního dB-SOFT Flappyho. Importují se pouze
  obrazová data; cizí herní JavaScript není součástí aplikace.
- **MSX:** [Vizzed — Flappy pro MSX](https://www.vizzed.com/games/flappy-msx-msx-16473-game),
  původní [úvodní menu](https://www.vizzed.com/videogames/msx/screenshot/Flappy-1.png)
  a [herní snímek](https://www.vizzed.com/videogames/msx/screenshot/Flappy-2.png).
  Z herního snímku jsou načtené pixely postavy, kamenů, nepřátel, houby a zdiva.
- **NES:** titulní a herní snímky z archivu Libretro:
  [titulní obrazovka](https://thumbnails.libretro.com/Nintendo%20-%20Nintendo%20Entertainment%20System/Named_Titles/Flappy%20%28Japan%29.png),
  [herní snímek](https://thumbnails.libretro.com/Nintendo%20-%20Nintendo%20Entertainment%20System/Named_Snaps/Flappy%20%28Japan%29.png).
  Originální snímky mají oříznutý overscan, rozměry 256 × 224.

`assets/retro-data.js` obsahuje číselné RGB bitmapy. Statické snímky MSX a NES
jsou uložené beze změn v `assets/title-msx.png` a `assets/title-nes.png`.
`assets/title-sharp.png` rekonstruuje statickou fázi úvodu z původních bitmap,
loga a souřadnic, včetně roku 1984. Některé směrové a krokové fáze MSX/NES,
které na statických podkladech nejsou, jsou odvozené ze Sharp bitmap příslušnou
paletou a zrcadlením. Nejde o tvrzení, že všechny animační snímky jsou přesným
dumpem příslušného vydání. Původní práva zůstávají autorům a držitelům hry.
Skok žáby NES dolů používá čistou odvozenou směrovou fázi; původní chybný výřez
z herního snímku obsahoval také kus zdiva a kamene a již se nepoužívá.

Reprodukovatelný import: do adresáře vlož `sharp-Images.js`, `sharp-Intro.js`,
`sharp-Font.js`, `msx-game.png` a `nes-game.png` z uvedených podkladů a spusť
`node tools/import-platform-assets.mjs cesta/k/podkladum`. Pomocný PNG dekodér
čte pouze obrazová data a nevyžaduje balíčky. MSX/NES titulní PNG se kopírují
beze změn. Úvod PC se skládá z již používaných lokálních spritů a překladů.
PMD-85-3 používá původní [snímek úvodu FLAPPY2k Remaster Edition](https://www.pmd85.cz/wp-content/uploads/Title2.gif)
ze [stránky autora](https://www.pmd85.cz/?page_id=965), uložený beze změn
v `assets/title-pmd85-3.gif` (576 × 512). PMD 85-1 nadále používá obrázek VBG.

## PMD a PC

Režim **PC** používá samostatné AI generované ilustrace
v `assets/modern-sprites.png` (vestavěný imagegen). Přesný prompt a pořadí
snímků jsou v `assets/modern-mole-prompt.txt` a `assets/README.md`. Jde o novou
grafiku tohoto projektu, která nenahrazuje historická data.
Osmifázová boční chůze v `assets/modern-mole-walk.png` vznikla stejným vestavěným
imagegen podle původního moderního krtka. Přesný prompt je uložený v
`assets/modern-mole-walk-prompt.txt`; PNG je uložené beze změn.
Režim **PMD-85-3** obarvuje stávající bitmapy paletou zvolenou pro web.
Barevné varianty PMD jsou doložené na [stránce autora FLAPPY2k](https://www.pmd85.cz/?page_id=965);
webové obarvení není emulací konkrétního hardwarového barevného režimu.

Webová implementace vzdává hold hře **Flappy** pro PMD 85 (VBG Software, 1987;
Vlastimil Veselý, Libor Bedrlík a Ladislav Gavar). Původní koncept Flappy:
Shoichi Shibata a Kazuyuki Okujama / dB-SOFT.

Bitmapy postav a všech 200 scén jsou extrahovány z PMD pásky **FLAPPY2k Remaster
Edition** (Libor Lasota, 2019), která zachovává původní PMD grafiku a v některých
scénách používá variantu Sharp MZ. Jde tedy o data remasteru, nikoli tvrzení
o přesné kopii každého bajtu vydání z roku 1987.

- Stránka autora: https://www.pmd85.cz/?page_id=965
- Zdrojová páska: https://www.pmd85.cz/wp-content/uploads/flappy2k.zip
- SHA256 souboru `flappy2k.ptp`:
  `3a4b46736ed194494493f6f433aae0d16f1c19dbcce8a4e180003cd898bfdd1b`
- Další historické podklady: https://pmd85.borik.net/wiki/Download

Reprodukovatelná extrakce: `node tools/extract-assets.mjs cesta/flappy2k.ptp`.
Importují se pouze bitmapy a souřadnice scén, žádný strojový kód. Není přibalen
emulátor ani cizí herní engine. Práva k původnímu dílu zůstávají jeho autorům;
tento projekt nedává původním herním datům novou licenci.

Herní mechanismy jsou nově implementovány: nejde o emulaci instrukcí PMD 85.
Rychlost, střelba a okrajové kolize se mohou od originálu lišit.
Kolize se spícími nepřáteli a boční tlak kamenem byly ověřeny přímo v původním
vydání `*FLAPPY*` z roku 1987 z [archivu VBG Software](https://pmd85.borik.net/?action=download&did=8).
`tools/check-original-collisions.mjs cesta/games-vbg.ptp` izolovaně vykoná
32 scénářů původních kolizních větví procesoru 8080. Nepřebírá je do aplikace.
Původní směrové větve na adresách `1726`, `1820`, `18B4`, `1940` při kontaktu
s žábou nebo duchem, včetně spících bitmap, volají smrt přes `1BB1` → `0A02`.
Spánek zastaví pohyb, ale neodstraní smrtící kolizi. Boční tlak rozbije obyčejný
kámen přes `1775`; krystal i nepřítel zůstanou. Nepřítele zničí až pád shora.
Tato pravidla platí společně ve všech grafických režimech naší adaptace PMD.

Rozhodovací větve nepřátel z tohoto původního PMD vydání jsou ručně přeložené
v `src/enemy-ai.js`: duch `0D17–0EDE`, žába `11C5–15C3`. Zůstaly zachované
bitové volby, pořadí sondování, čítač trasy, sdílený příznak změny osy i
asymetrie některých větví při nárazu. Metadata bitmap potřebná pro původní
kolizní sondy jsou v `assets/pmd-ai-probes.js`; nejde o grafiku vybraného skinu.
Import dat: `node tools/import-pmd-ai.mjs cesta/games-vbg.ptp`.
Původní pořadí obsluhy je duchové a potom žáby, v každé skupině shora zleva.

`tools/check-original-enemies.mjs cesta/games-vbg.ptp` vykoná rozhodovací části
originálního strojového kódu v testovacím 8080 runneru a porovná 12 000 situací
s přeloženou logikou. Porovnává směr a uskutečnění pohybu, čekání, smrtící kontakt,
uspání, oba čítače a spotřebu náhodných bajtů. Referenční renderer se neprovádí;
zachytí se okamžik před vykreslením rozhodnutého pohybu. Přepínač
`--write-fixtures` obnoví 256 očekávaných výsledků v `tests/fixtures/` pro CI.
Runner ani původní spustitelný program nejsou součástí publikované hry.
Adaptace ponechává dosavadní mřížku fyziky a podle zadání i interval 600 ms,
délku spánku a zobrazovací animace. Vstupní náhodné bajty dodává stávající
generátor webové hry, nikoli obsah RAM originálu; konkrétní sled tras proto
není slibovanou reprodukcí stejného průchodu na historickém počítači.

Zdivo, houby a cílová podložka jsou vykresleny znovu ve stejné pixelové mřížce.
Cílový předmět je modrý kámen / krystal. Původně importované bitmapy cílového
a obyčejného kamene jsou stejné; oba PMD režimy zachovávají původní obrys
se světlou výplní, která cíl odlišuje od tečkovaného běžného kamene.
V PMD-85-3 má modrou barvu. Krystal v režimu PC je nová
ilustrace vytvořená vestavěným imagegen v `assets/modern-crystal.png`, s přesným
promptem v `assets/modern-crystal-prompt.txt`. Interní datové označení `egg`
zůstalo kvůli kompatibilitě stávajících dat; v uživatelských textech je krystal.
Rozsypání běžného kamene používá v PMD režimech původní bitmapy 12 × 16 na
adresách `0x2607` a `0x2628`. PC animuje dvanáct výřezů z ilustrace běžného kamene.
Doba šesti herních kroků a nekolizní efekty jsou webová implementace.
Chůze vlevo a vpravo střídá původní klidové a rozšířené krokové bitmapy PMD
bez programových úprav nohou. Chůze dolů používá původní čelní snímky a jednu
odvozenou fázi; fáze chůze nahoru jsou odvozené z původní zadní bitmapy.
Animace běží pouze při úspěšném pohybu. Přehled grafiky a jejího uložení
je v `assets/README.md`, obrazový náhled v `assets/sprites.png`.
Žába používá osm původních bitmap: klidový postoj a fázi skoku pro každý ze
čtyř směrů. Rozšířené skokové snímky se vykreslují v původní velikosti
12 × 24 nebo 18 × 16 pixelů; kolizní rozměry zůstávají stejné.
Rozdrcení nepřátelé používají původní zploštělé bitmapy 12 × 8 pixelů:
duch na adrese `0x2731`, žába `0x2952` v paměťovém obrazu FLAPPY2k.
Zůstávají viditelní 600 ms herního času; padající předmět po jejich zmizení
pokračuje dolů. Jde o novou implementaci časování, nikoli emulaci originálu.
Zmáčknutý Flappy používá další původní bitmapu 12 × 8 pixelů na adrese
`0x25db`. Zobrazuje se v dolní polovině postavy po střetu s nepřítelem nebo
pádu kamene či krystalu; smrtelný předmět sestoupí nad tělo. Moderní režim zploští
příslušný směrový sprite krtka. Prodleva před dalším životem či koncem hry je
720 ms a zastaví se při pauze. Jde o nové časování webové implementace.
Úvodní obrazovka `assets/title-screen.png` je z původního Flappy od VBG Software
(1987), podle výslovného výběru uživatele. Jde o beze změn uložený obrázek
[Vbg_flappy_3.png z PMD 85 Infoserveru](https://pmd85.borik.net/w/images/b/bc/Vbg_flappy_3.png)
v rozlišení 288 × 256 pixelů. SHA256 PNG:
`338fec4330284911c478b7499b1fe0a4fcd95f66593dbac3950452632b6f9439`.

Rozložení životů, sektoru a času v horním zdivu vychází z uživatelem zadaného
[snímku původní herní plochy](https://pmd85.borik.net/w/images/5/54/Vbg_flappy_2.png).
Ukazatele jsou součástí herního Canvasu, v původních režimech s pixelovým písmem na mřížce 6 × 8
a původními bitmapami postavy. Nástup života otevírá dvě buňky horní stěny,
nechá Flappyho sestoupit z řady a průchod znovu uzavře. Časování je nově
implementované; herní souřadnice a data všech 200 scén se nemění.
Moderní ukazatele používají vyhlazené systémové písmo. Plynulé pozice v moderním
režimu dopočítává samostatná zobrazovací vrstva `src/motion.js`, která nemění
pravidla, kolize ani herní kroky. Jde o novou webovou animaci.
Přechod mezi sektory nově napodobuje popsané chování originálu: bliknutí
Flappyho, zaplnění místnosti zdivem a odkrytí další scény. Délky fází a
vykreslování jsou implementovány pro web, nejde o emulaci původní rutiny PMD.

Jediná knihovna aplikace je uživatelem požadované **Vue 3.5.13**, uloženo lokálně
v `vendor/vue.esm-browser.prod.js`. Licence MIT: `vendor/VUE-LICENSE.txt`.
Žádné CDN, fontové služby, analytika ani jiné knihovny nejsou použity.

## Hesla sektorů

`assets/sector-passwords.js` obsahuje všech 40 pětiznakových hesel pro sektory
1–200 z [původního seznamu na PMD85.cz](https://www.pmd85.cz/wp-content/uploads/hesla.txt).
Každé zpřístupní pět sektorů. Zápis včetně interpunkce je zachovaný;
reprodukovatelný import: `node tools/import-passwords.mjs cesta/hesla.txt`.
Ověření probíhá lokálně bez serveru a funguje offline.

## Zvukové podklady

[Stránka autora FLAPPY2k](https://www.pmd85.cz/?page_id=965) uvádí podporu hudby
i zvuků přes vestavěný akustický měnič PMD 85. Komentáře autora a testerů
potvrzují herní zvukové efekty; hudební doprovod patří k úvodnímu menu.
Webová verze má nově syntetizované krátké obdélníkové efekty přes nativní
Web Audio (`src/audio.js`). Nejde o vzorky z původní hry ani o shodný výstup
jejího strojového kódu. Hudba z menu remasteru nebyla převzata.
