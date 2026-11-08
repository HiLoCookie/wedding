# 結婚式 Svatební web

Svatební web s japonským motivem: program, místo, praktické info, RSVP formulář s výběrem písniček a sekce darů s QR platbou.

## Jak to funguje

```
 Host ──► web (GitHub Pages, zdarma)
             │  odešle formulář
             ▼
       Google Apps Script ──► Google Tabulka (list „RSVP“)
             │
             └──► e-maily z vašeho Gmailu:
                   • potvrzení hostovi hned po odeslání
                   • přehled + tabulka (CSV) vám v den uzávěrky RSVP
                   • upomínka měsíc a týden před svatbou všem, kdo dorazí
                   • libovolné oznámení (nový program, co s sebou…) z listu „Oznámení“
```

Nic neplatíte, nepotřebujete server, všechna data máte v Google Tabulce a můžete je kdykoli ručně upravit.

| Soubor | Co v něm je |
|---|---|
| `config.js` | **Všechny texty a údaje webu** – jména, datum, místo, program, co s sebou, IBAN pro QR |
| `index.html`, `style.css`, `app.js` | Vzhled a logika webu |
| `apps-script/Code.gs` | Backend: ukládání RSVP a rozesílání e-mailů |

---

## Nastavení krok za krokem (asi 20 minut)

### 1. Vyplňte údaje
- V `config.js` nahraďte všechno označené `TODO` (jména, datum, uzávěrka RSVP, místo, IBAN).
- IBAN najdete v internetovém bankovnictví (začíná `CZ`, 24 znaků). QR kód je ve formátu **QR Platba**,
  částka je dobrovolná a do poznámky se automaticky vloží „Svatebni dar od: …“ (host si může dopsat jméno přímo na webu).

### 2. Google Tabulka + skript
1. Na [sheets.new](https://sheets.new) založte novou tabulku, pojmenujte ji třeba „Svatba RSVP“.
2. V menu **Rozšíření → Apps Script**.
3. Smažte obsah `Code.gs` a vložte tam obsah souboru `apps-script/Code.gs` z tohoto repozitáře.
4. Nahoře v sekci `CONFIG` vyplňte svůj e-mail, jména, datum, čas, uzávěrku, místo a adresu webu.
5. Vlevo **⚙ Nastavení projektu** → časové pásmo **(GMT+01:00) Prague**.
6. Uložte (💾), v horní liště vyberte funkci **`setup`** a klikněte **Spustit**.
   Google se zeptá na oprávnění (tabulka, odesílání e-mailů, spouštěče) – povolte.
   *(Hláška „Google tuto aplikaci neověřil“ je normální, je to váš vlastní skript: Rozšířené → Přejít na projekt.)*

Tím vzniknou listy **RSVP** a **Oznámení** a zapne se denní kontrola termínů.

### 3. Zveřejnění skriptu jako webové aplikace
1. V editoru Apps Script vpravo nahoře **Nasadit → Nové nasazení**.
2. Typ: **Webová aplikace**.
3. *Spustit jako:* **Já**, *Kdo má přístup:* **Kdokoli**.
4. **Nasadit** a zkopírujte **URL webové aplikace** (končí `/exec`).

### 4. Propojení webu
Vložte URL do `config.js`:
```js
scriptUrl: 'https://script.google.com/macros/s/AKfy.../exec',
```

### 5. Zveřejnění webu (GitHub Pages)
1. Na GitHubu v repozitáři **Settings → Pages**.
2. *Source:* **Deploy from a branch**, větev `main` (nebo tahle), složka `/ (root)` → **Save**.
3. Za minutu je web na `https://<uživatel>.github.io/wedding/`. Tuhle adresu dejte i do `WEBSITE_URL` v `Code.gs`.

> Vlastní doménu (např. `nase-svatba.cz`) lze nastavit tamtéž v sekci *Custom domain*.

### 6. Vyzkoušejte
Vyplňte formulář sami za sebe – v tabulce by se měl objevit řádek a do schránky přijít potvrzení.
V tabulce v menu **💌 Svatba → Poslat mi přehled RSVP teď** si vyzkoušíte, jak bude vypadat přehled.

---

## Fotky a ikonky
- Fotky jsou ve složce `assets/photos` (zmenšené, formát WebP, **bez EXIF/GPS údajů**).
- Které fotky se zobrazí, s jakým popiskem a v jakém pořadí, určuje `photos` v `config.js`
  (`couple` = sekce *To jsme my*, `pets` = *Chlupatá rodina*, `banner` = velký pruh před RSVP).
- Novou fotku přidáte tak, že ji nahrajete do `assets/photos` a přidáte řádek do `config.js`.
  Ideálně ji předem zmenšete na max. ~1000 px (např. na [squoosh.app](https://squoosh.app)).
- **Fotogalerie** (`galerie.html`) ukazuje všechny fotky ze složky `assets/gallery` (`thumb` = náhledy, `full` = velké).
  Seznam fotek a jejich štítky (`my`, `japonsko`, `loki`, `himiko`, `psi`) jsou v `gallery-data.js` –
  když je fotka ve špatné kategorii, stačí jí tam přepsat štítek. Kartičky mazlíčků vedou rovnou do galerie s filtrem.
- Ikonky jsou v `assets/icons`, v programu dne se nastavují polem `icon` u každého bodu.

---

## Každodenní používání

### Rozeslání nového programu / informací
1. V tabulce otevřete list **Oznámení**.
2. Na nový řádek napište **Předmět**, **Text zprávy** (odstavce oddělte prázdným řádkem, odkazy se samy proklikají)
   a do sloupce **Komu** `Dorazí` (jen ti, kdo přijdou) nebo `Všichni` (i ti, kdo odmítli).
3. Klikněte do toho řádku a v menu zvolte **💌 Svatba → Poslat vybrané oznámení jen mně (test)**.
4. Když je vše v pořádku: **💌 Svatba → Odeslat vybrané oznámení hostům**. Do sloupce *Odesláno* se zapíše datum,
   takže omylem nic nepošlete dvakrát (skript vás upozorní).

Každý e-mail začíná osobním oslovením („Ahoj Petro,“), to se doplní samo.

Program a „co s sebou“ na webu upravíte v `config.js` (pole `schedule` a `bring`).

### Automatické e-maily
| Kdy | Komu | Co |
|---|---|---|
| hned po odeslání formuláře | hostovi | shrnutí odpovědi |
| v den `RSVP_DEADLINE` | vám | souhrn (počty osob, přespání, písničky, alergie) + tabulka CSV |
| 30 a 7 dní před svatbou | všem, kdo dorazí | připomínka s jejich údaji |

Dny upomínek změníte v `REMINDER_DAYS`. Stav zjistíte v menu **💌 Svatba → Stav automatických e-mailů**.

### Úpravy odpovědí
- Host, který formulář vyplní znovu se stejným e-mailem, svou odpověď **přepíše** (nevznikne duplicita).
- Data v listu RSVP můžete ručně upravovat (jen neměňte pořadí sloupců).

### Playlist
Písničky jsou ve sloupcích *Písnička 1/2* a v přehledu, který vám přijde po uzávěrce – stačí je předat DJovi
nebo poskládat do sdíleného playlistu na Spotify.

---

## Limity a tipy
- **Gmail umožní skriptu poslat ~100 e-mailů denně** (u Google Workspace 1500). Na běžnou svatbu to stačí,
  protože se posílá jeden e-mail na domácnost. Skript před hromadným odesláním limit zkontroluje.
- Po **úpravě `Code.gs`** je potřeba udělat **Nasadit → Spravovat nasazení → ✏️ → Verze: Nová verze**,
  jinak web pořád volá starou verzi. URL zůstane stejná.
- Dokud je `scriptUrl` prázdné, formulář běží v ukázkovém režimu a nic neodesílá.
- E-maily odcházejí z vašeho Gmailu – odpovědi hostů vám tak přijdou rovnou do schránky.
