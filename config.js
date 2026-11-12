/*
 * ============================================================
 *  NASTAVENÍ SVATEBNÍHO WEBU
 *  Vše, co je potřeba upravit, je tady. Hodnoty označené TODO
 *  nahraďte skutečnými údaji.
 * ============================================================
 */
window.WEDDING = {
  // TODO: vaše jména
  couple: { a: 'Eliška', b: 'Tomáš' },

  // TODO: datum a čas obřadu (ISO formát, +01:00 v zimě / +02:00 v létě)
  date: '2027-09-11T11:00:00+02:00',

  // TODO: do kdy mají hosté potvrdit účast (RRRR-MM-DD)
  rsvpDeadline: '2027-02-15',

  // TODO: místo konání
  place: {
    name: 'Naše zahrada & stodola',
    address: 'Lhenice 45, 415 01 Teplice',
    mapUrl: 'https://mapy.com/en/turisticka?q=lhenice%2045%20teplice&source=addr&id=11279100&ds=2&x=13.8648222&y=50.5748057&z=17',
    note: 'Parkovat se dá přímo u domu, případně cca 2min. pěšky u rybníka.',
  },

  // URL webové aplikace z Google Apps Scriptu (viz README, krok 4).
  // Dokud je prázdné, formulář běží v „ukázkovém režimu“ a nic neodesílá.
  scriptUrl: 'https://script.google.com/macros/s/AKfycbwigcj0ELw1q0xhhyNotT96i-T_IcK3DEeMeEpuSSbxaifztfgnIJ2e0ZUrCu1h0DHK/exec',

  // Kontakt pro dotazy
  contact: { email: 'eliska.vyskocilova.sos@gmail.com', phone: '+420 777 244 799' },

  // Program dne – klidně upravujte i po spuštění webu
  schedule: [
    { time: '10:00', title: 'Příjezd hostů', icon: 'sakura', desc: 'Welcome drink a matcha limonáda pod lípou.' },
    { time: '12:00', title: 'Obřad', icon: 'obrad', desc: 'Pod širým nebem v sadu.' },
    { time: '12:45', title: 'Gratulace & focení', icon: 'foto', desc: 'Společné foto všech hostů.' },
    { time: '13:30', title: 'Hostina', icon: 'ramen', desc: 'Česká klasika s japonskými akcenty.' },
    { time: '14:00', title: 'Krájení dortu', icon: 'dort', desc: '' },
    { time: '15:00', title: 'Hry & Lampiony', icon: 'lampiony', desc: 'Společenské svatební hry & pouštění lampionů.' },
    { time: '20:00', title: 'Večerní zábava', icon: 'dorazim', desc: 'Tanec, hudba, panáky a jiné společenské aktivity!' },
    { time: '00:00', title: 'Půlnoční ramen', icon: 'ramen', desc: 'Pro ty, kdo vydrží.' },
  ],

  // Ikonky v programu: názvy souborů ze složky assets/icons (bez .png), např.
  // sakura, obrad, foto, ramen, dort, lampiony, dorazim, daruma, maneki, check

  // Fotky na hlavní stránce – soubory jsou ve složce assets/photos.
  // Ostatní fotky („Zobrazit zbytek“) jsou v assets/gallery, seznam a štítky v gallery-data.js.
  // g = číslo stejné fotky v assets/gallery, aby se v „zbytku“ neopakovala.
  // pos = která část fotky má zůstat vidět při ořezu (např. 'top', 'center 30%')
  photos: {
    couple: [
      { g: '097', src: 'assets/photos/my-torii.webp', caption: 'Japonsko 🇯🇵' },
      { g: '033', src: 'assets/photos/my-peace.webp', caption: '' },
      { g: '087', src: 'assets/photos/my-dilna.webp', caption: '' },
      { g: '103', src: 'assets/photos/my-zabka.webp', caption: '' },
      { g: '093', src: 'assets/photos/my-chram.webp', caption: 'Japonsko 🇯🇵' },
      { g: '102', src: 'assets/photos/my-zahrada.webp', caption: '' },
      { g: '104', src: 'assets/photos/japonsko-zahrada.webp', caption: 'Až se tam vrátíme 🌿' },
      { g: '032', src: 'assets/photos/my-vecer.webp', caption: '', pos: 'center 30%' },
    ],
    // Mazlíčci – klik na kartičku ukáže jeho fotky (tag = štítek v gallery-data.js: loki, himiko, psi)
    pets: [
      { name: 'Loki', alias: 'Bobíček · Bobík · Bobo · Bobokun', src: 'assets/photos/kocka-seda-kosik.webp', tag: 'loki' },
      { name: 'Himiko', alias: 'Himomímo · Bibiko · Bibičko · Bíba', src: 'assets/photos/kocka-siam.webp', tag: 'himiko' },
      { name: 'Lucky', alias: '', src: 'assets/photos/pes-slunce.webp', tag: 'psi' },
      { name: 'Dusty', alias: '', src: 'assets/photos/pes-dusty.webp', tag: 'psi' },
    ],
    banner: 'assets/photos/banner-torii.webp',
  },

  // Videa – sekce „Náš příběh“ se zobrazí, jakmile tu bude aspoň jedno video.
  // Buď vlastní soubor:  { title: '…', src: 'assets/videos/zadost-1.mp4', poster: 'assets/videos/zadost-1.jpg', length: '1:23' }
  // nebo YouTube:        { title: '…', youtube: 'dQw4w9WgXcQ' }   (ID je část odkazu za „v=“ nebo za „youtu.be/“)
  videos: {
    intro: 'Pár vzpomínek na to, jak to celé začalo 💍',
    list: [
      // { title: 'Žádost o ruku – 1. část', note: 'od Tomáše', src: 'assets/videos/zadost-1.mp4', poster: 'assets/videos/zadost-1.jpg' },
    ],
  },

  // Co s sebou
  bring: [
    'Dobrou náladu a chuť tančit',
    'Pohodlné boty – část programu je na trávě',
    'Svetr nebo deku na večer',
    'Pokud spíte venku: spacák, karimatku, případně stan',
    'Repelent a opalovací krém',
  ],

  // Dary – QR platba (formát QR Platba / SPD, funguje ve všech českých bankách)
  gift: {
    // TODO: IBAN vašeho účtu (bez mezer). Dokud je prázdný, QR kód se nezobrazí.
    iban: 'CZ8508000000005668099023',
    // TODO: číslo účtu v českém formátu pro ruční zadání, např. '123456789/0800'
    accountDisplay: '5668099023/0800',
    recipient: 'Novomanzele', // jméno příjemce v QR (bez diakritiky)
    message: 'Svatebni dar od: ',
    tripNote: 'Na rok 2030 plánujeme měsíční cestu po Japonsku (odhadem 200 000 Kč).',
  },
};
