# FLAPPY · PMD 85

Webová pocta logické hře Flappy z PMD 85. Vue 3, Canvas 2D a nativní webová API.
Všech 200 scén a bitmapy postav pocházejí z FLAPPY2k. Podrobnosti a rozdíly od
originálu viz [SOURCES.md](SOURCES.md).

## Spuštění

Vyžaduje Node.js 22+ pouze pro lokální server, kontroly a přípravu publikace.
Není potřeba instalovat žádné npm balíčky.

```sh
git clone https://github.com/pkristofik49/Flappy.git
cd Flappy
git config core.hooksPath .githooks
node tools/serve.mjs
```

Otevři http://127.0.0.1:4173/Flappy/. Alternativně lze kořen projektu obsloužit
libovolným statickým HTTP serverem. Přímé otevření `file://` nepodporuje moduly
ani service worker.

## Hraní

- Úvodní obrazovka podle zvoleného grafického režimu: klikni, klepni nebo stiskni mezerník pro spuštění hry.
- Kliknutí na záhlaví herního okna vrátí úvodní obrazovku. Vybraný sektor a odemčený postup zůstanou uložené.
- Šipky / WASD: pohyb. Mezerník: vystřelit nasbíranou houbu.
- P / Escape: pauza. R: opakovat místnost. Enter: pokračovat.
- Kliknutí nebo klepnutí přímo na rozehranou plochu také vyvolá pauzu.
  Pozadí pauzy má poloviční krytí, takže zůstává lépe vidět stav místnosti.
- Tlačítko **Sektor** vedle pauzy otevře nad herní plochou matici 20 × 10 se
  všemi 200 sektory. Dostupné sektory jsou zvýrazněné; kliknutí nebo klepnutí
  zahájí vybranou místnost. Aktuální sektor má světlý rámeček, zamčené nelze
  zvolit. Šipky vybírají dostupné sektory, Home/End první/poslední, Enter potvrzuje.
  Escape nebo křížek výběr zavře. Rozehraná hra včetně nástupu a přechodu během
  výběru stojí; zavření zachová předchozí stav pauzy. Na mobilu lze matici
  posouvat uvnitř herního okna. Výběr funguje také ve zvětšeném a offline režimu.
- Na dotykovém zařízení se zobrazí směrový ovladač a tlačítko střelby.
  Ovladač tvoří herní kříž se čtyřmi SVG šipkami a kulaté tlačítko s houbou.
  Šipku lze držet pro opakovaný pohyb; ovladač nezpřístupňuje výběr textu ani
  kontextové menu při dlouhém dotyku. Na výšku má hra užší černý rám.
  Na telefonu na šířku se automaticky zobrazí hra přes dostupnou výšku,
  kříž vlevo a ikony nastavení s tlačítkem střelby vpravo. Po otočení zpět
  se obnoví běžné rozložení stránky.
- Dostaň modrý krystal na cílovou podložku. V režimu PMD 85-1 ho poznáš podle
  světlé výplně. Krystal i obyčejné kameny padají,
  běžné kameny lze rozbít tlakem proti překážce ze strany nebo shora. Padající předměty drtí obludy
  i hráče. Houba nepřítele dočasně uspí, ale i spící žába nebo duch zabíjí při dotyku,
  stejně jako v původní PMD verzi. Ze strany nepřítele kamenem nezabiješ: obyčejný
  kámen se proti němu rozpadne a modrý krystal se zastaví. Zabíjí pouze pád shora.
- Rozbitý obyčejný kámen se krátce rozsype. Režimy PMD používají dva původní
  snímky, PC plynule padající úlomky. Efekt trvá přibližně 0,72 sekundy herního
  času, při pauze stojí a neblokuje pohyb ani neubližuje postavám.
- Rozdrcený nepřítel se krátce zobrazí zploštělý. Kámen nad ním počká přibližně
  0,6 sekundy herního času a po zmizení těla pokračuje v pádu; pauza časování zastaví.
- 5 životů, 6 minut na scénu. Odehrané scény se odemykají. Místnost i odemčený
  postup se ukládají do localStorage na konkrétním zařízení/prohlížeči.
- Vpravo v dolním řádku výběru sektorů lze zadat původní pětiznakové heslo ze
  [seznamu PMD 85](https://www.pmd85.cz/wp-content/uploads/hesla.txt).
  Odemkne přesně příslušnou pětici sektorů přímo v otevřené matici. Rozehraná
  místnost se nezmění; po odemčení lze zvolit libovolný zpřístupněný sektor.
  Velikost písmen nerozhoduje, interpunkce je součástí hesla. Odemčení zůstává
  uložené i pro offline hraní; ostatní neodehrané sektory zůstávají zamčené.
  Úspěšné potvrzení přehraje stejný zvuk jako start hry, pokud je zvuk zapnutý.
- Životy, sektor a čas jsou vykreslené přímo v horním zdivu herního Canvasu.
  Pod nápisem SEKTOR je za každou nasbíranou houbu jedna její ikona. Po výstřelu
  ikona zmizí. Počet hub ani doplňkový slogan se pod herní plochou nezobrazují.
  Zbývající životy stojí v řadě. Po smrti Flappy krátce počká a další postava
  automaticky sestoupí do místnosti dočasným otvorem ve zdi. Zeď se zavře až
  za ním. Během nástupu stojí čas i objekty v místnosti; pauza zastaví i nástup.
  Po vyčerpání životů se zobrazí konec hry s možností nové hry.
  Po zásahu nepřítelem nebo padajícím kamenem zůstane Flappy přibližně
  0,72 sekundy zmáčknutý na místě smrti. V původních režimech se používá původní
  12 × 8 sprite, v moderním zploštělý krtek. Teprve potom nastoupí další život
  nebo se zobrazí konec hry. Pauza zastaví i tuto prodlevu.
- Po vyřešení místnosti Flappy třikrát zabliká, plochu zaplní zdivo a následně
  se odkryje další sektor. Přechod i nástup jsou automatické; životy se zachovají.
  Pauza zastaví i tento přechod. Po sektoru 200 se zobrazí závěrečné vítězství.

## Pohyb nepřátel

Rozhodování nepřátel vychází z původního PMD vydání z roku 1987, společně pro
všechny grafické režimy. Duch prohledává deset buněk vlevo a vpravo ve své řadě;
cihlová zeď hledání zastaví. Bez nalezeného hráče volí směr podle náhodného bitu.
Žába vybírá osu podle náhody a směr podle polohy hráče, používá původní čítač
trasy a větve pro zablokování a změnu osy. Nepřátelé se zpracovávají ve stejném
pořadí jako na PMD: nejdříve duchové, potom žáby, odshora zleva.

Rychlost zůstává webová: jedna příležitost k pohybu každých pět kroků simulace,
tedy 600 ms. Plynulé PC animace, délka spánku a pauza mají dosavadní časování.
Generátor náhodných čísel zůstává deterministický generátor webové hry; nečte
paměť skutečného PMD. Shoda rozhodování při stejných náhodných bajtech je
kontrolována proti původním instrukcím, nikoli podle vizuálního odhadu.

```sh
node tools/check-original-enemies.mjs cesta/games-vbg.ptp
```

Kontrola porovná 12 000 situací včetně směrů, čítačů a počtu náhodných voleb.
Z původního kódu je také uloženo 256 očekávaných výsledků pro běžné testy a CI.

## PWA a offline

Po prvním úspěšném načtení přes HTTPS / localhost service worker uloží celou
aplikaci včetně Vue. Další hraní funguje bez sítě. Manifest obsahuje PNG ikony
192/512 px a samostatnou maskovatelnou ikonu. Instalaci nabídne tlačítko, pokud
ji prohlížeč podporuje; v Safari použij Sdílet → Přidat na plochu.

Nový service worker čeká na zavření všech oken staré hry; aktualizace
nepřeruší rozehranou místnost. Cache je označena verzí commitu. Pokrok se při
aktualizaci zachová. Nainstalovaná aplikace potřebuje první otevření online.

## GitHub Pages

Cílová adresa: https://pkristofik49.github.io/Flappy/

Workflow `.github/workflows/pages.yml` ověří zdroje i testy, připraví statický
adresář `dist/` a publikuje jej přes GitHub Pages po pushi do `main`.
V repozitáři musí být **Settings → Pages → Source: GitHub Actions**.
Workflow vyžaduje povolené Actions a oprávnění Pages; všechny aplikační cesty
jsou relativní a fungují pod `/Flappy/`.

```sh
node tools/check.mjs
node --test tests/*.test.mjs
node tools/build.mjs
```

GitHub Actions používají oficiální akce GitHubu pro checkout, Node a publikaci.
Nejsou to závislosti běžící ve hře. Hosting žádný Node server nevyžaduje.

## Jazyky a texty

Vpravo nahoře otevři ikonou zeměkoule nabídku **Čeština / English** nebo stiskni
**L**. Šipky nahoru/dolů vybírají jazyk, Enter jej potvrdí, Escape nabídku zavře.
Otevřená nabídka rozehranou hru dočasně pozastaví. Výchozí jazyk je čeština jako v projektu
[SMG](https://github.com/pkristofik49/SMG); volba se ukládá do `flappy.language`.
Přepnutí zachová místnost i její stav a okamžitě přeloží otevřené hlášky.
Bez dostupného localStorage funguje volba po dobu aktuální relace.

Veškeré texty aplikace jsou v **`src/translations.js`**. Používají stejné
ploché klíče a parametrické řetězce jako SMG, např. `win.scene` a `{scene}`.
`src/i18n.js` poskytuje překladovou funkci a množné tvary pomocí nativního
`Intl.PluralRules`. Vue vkládá text bezpečně jako text, nepoužívá se `v-html`
ani knihovna pro překlady. Překládají se i ARIA popisky, metadata dokumentu
a informace o instalované PWA. Původní kresba úvodní obrazovky zůstává zachovaná.

Po změně překladů obnov generované statické soubory:

```sh
node tools/localize-static.mjs
node tools/check.mjs
```

Generátor vytvoří český a anglický manifest a aktualizuje výchozí metadata
i dvojjazyčný `noscript` v HTML. Tyto kopie neupravuj ručně; jediným zdrojem
textů je slovník. Kontrola a GitHub Actions odhalí zastaralé generované soubory.
Oba jazyky i manifesty se ukládají do offline cache.

## Zvuk

Zvuk přepíná ikona reproduktoru vpravo nahoře nebo klávesa **Z**. Volba se ukládá
do `flappy.sound`. Po opětovném otevření se zvuk zapojí až při interakci hráče,
nikoli automatickým přehráváním při načtení stránky.

`src/audio.js` syntetizuje 11 krátkých obdélníkových efektů ve stylu vestavěného
reproduktoru PMD: krok, posun kamene, rozbití, sebrání houby, výstřel, uspání,
dopad, rozdrcení nepřítele, dokončení scény, smrt a start. Jde o novou zvukovou
rekonstrukci, nikoli nahrávky či přesnou emulaci zvukové rutiny originálu.
Web Audio je součástí prohlížeče; další knihovny ani soubory se zvukem nejsou
potřeba. Vypnutí zvuku zastaví i rozeznělé efekty. Při pauze nebo přepnutí okna
se zvuk zastaví. Hra funguje i při nedostupném nebo blokovaném audio rozhraní.

## Zvětšené zobrazení

Ikona čtyř rohů vpravo nahoře nebo **F** rozšíří hru přes celé okno, stejně jako
v SMG. **F / Escape** vrátí běžné rozložení. Ovládací ikony zůstanou dostupné,
na mobilu se plocha přizpůsobí výšce i otočení zařízení včetně dotykových tlačítek.
Zkratky L / Z / F nereagují při psaní do vstupních polí ani s modifikačními klávesami.

## Grafické režimy

Ikona palety v horním menu nebo **G** otevře výběr:

- **PMD 85-1** — dosavadní původní pixely, výchozí černobílý režim.
- **PMD-85-3** — stejné bitmapy s barevnou paletou; Flappy je žlutý,
  žába zelená, duch fialový a cílový krystal modrý.
- **Sharp MZ-800** — původní čtyřbarevné bitmapy z podkladů Sharp, červené zdi,
  žlutý Flappy a modří/červení nepřátelé.
- **MSX** — azurové zdi, žlutá postava, zelený nepřítel a červené kameny.
- **Nintendo NES** — červené cihly se světlými spárami, světlá postava a odlišné
  původní kameny a nepřátelé.
- **PC** — nové kreslené sprity z `assets/modern-sprites.png`,
  vykreslované do Canvasu 1280 × 800 místo původních 240 × 200 pixelů.
  Herní plocha i úvod mají poměr 16:10, stejný jako herní plocha NES.
  Flappy má podobu krtka s růžovým čumákem a hrabavými tlapkami; zdi tvoří
  červené cihly se střídavě posunutými spárami.
  Chůze vlevo a vpravo používá osm fází pro každý směr ze samostatného atlasu
  `assets/modern-mole-walk.png`, se střídáním přední a zadní tlapky.
  Cílový předmět používá samostatný modrý krystal z `assets/modern-crystal.png`.
  Sektor a čas mají vyhlazené písmo; postava, krystal, kameny, nepřátelé a střely
  se pohybují plynule mezi políčky pomocí `requestAnimationFrame`. Žáby při pohybu
  poskakují a duchové se lehce vznášejí. Pauza zastaví i tyto animace.

`src/motion.js` počítá pouze zobrazované mezisnímky. Simulace, kolize i časování
herních kroků zůstávají beze změny; původní režimy používají krokový pohyb.

Šipky vybírají položku, Enter potvrdí a Escape zavře nabídku. Volba se ukládá
do `flappy.graphics`. Otevřená nabídka dočasně pozastaví běžící hru; změna stylu
zachová pozice, čas, životy i houby. Všech šest režimů funguje offline po prvním
načtení. Úvod se mění podle volby: PMD 85-1 zachovává původní snímek VBG,
PMD-85-3 používá barevný úvod FLAPPY2k Remaster Edition, Sharp rekonstrukci původní úvodní scény,
MSX a NES původní titulní snímky a PC novou kompozici s krtkem a krystalem.
Nové historické režimy vykreslují mřížku do 320 × 200 pixelů. Jde o grafické
varianty současných 200 sektorů; podrobnosti o převzatých a odvozených snímcích
jsou v [SOURCES.md](SOURCES.md).
Žádná další knihovna není potřeba. Původ a přehled moderních spritů viz
[assets/README.md](assets/README.md).

## Verze při commitu

Jednorázově v každém klonu aktivuj hook:

```sh
git config core.hooksPath .githooks
```

První commit má **1.000**. Každý další commit včetně amend zvyšuje číslo o jeden:
1.001, 1.002, …, 1.999, 2.000. Hook odvozuje číslo z `HEAD:VERSION`, aktualizuje
`VERSION` a `version.js` a přidá je do stejného commitu. Neúspěšný pokus o commit
nespotřebuje další číslo. Verze je zobrazena v patičce vedle názvu hry a určuje
offline cache. Pokud v těchto souborech necháš nestagované změny, hook commit
zastaví, aby nepřepsal práci mimo index.

Hook je verzovaný, ale Git z bezpečnostních důvodů neaktivuje hooky automaticky
po klonování. `npm run prepare` je alternativou k příkazu `git config`.
Commit přes web GitHubu / `--no-verify` hook obchází; pro konzistentní verze
commituj lokálně se zapnutým hookem. Při souběžných větvích se může opakovat
číslo verze; výsledný merge commit dostane číslo o jedno vyšší než lokální HEAD.
