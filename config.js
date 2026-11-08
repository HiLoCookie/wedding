/*
 * ============================================================
 *  NASTAVENÍ SVATEBNÍHO WEBU
 *  Vše, co je potřeba upravit, je tady. Hodnoty označené TODO
 *  nahraďte skutečnými údaji.
 * ============================================================
 */
window.WEDDING = {
  // TODO: vaše jména
  couple: { a: 'Jméno', b: 'Jméno' },

  // TODO: datum a čas obřadu (ISO formát, +01:00 v zimě / +02:00 v létě)
  date: '2027-06-12T14:00:00+02:00',

  // TODO: do kdy mají hosté potvrdit účast (RRRR-MM-DD)
  rsvpDeadline: '2027-04-30',

  // TODO: místo konání
  place: {
    name: 'Statek U Lípy',
    address: 'Obec 123, 123 45 Někde',
    mapUrl: 'https://mapy.cz/',
    note: 'Parkovat se dá přímo u statku na louce. Cesta je značená lampiony 🏮',
  },

  // URL webové aplikace z Google Apps Scriptu (viz README, krok 4).
  // Dokud je prázdné, formulář běží v „ukázkovém režimu“ a nic neodesílá.
  scriptUrl: '',

  // Kontakt pro dotazy
  contact: { email: 'svatba@example.com', phone: '' },

  // Program dne – klidně upravujte i po spuštění webu
  schedule: [
    { time: '13:00', title: 'Příjezd hostů', desc: 'Welcome drink a matcha limonáda pod lípou.' },
    { time: '14:00', title: 'Obřad', desc: 'Pod širým nebem v sadu.' },
    { time: '14:45', title: 'Gratulace & focení', desc: 'Společné foto všech hostů.' },
    { time: '15:30', title: 'Hostina', desc: 'Česká klasika s japonskými akcenty.' },
    { time: '17:00', title: 'Krájení dortu', desc: '' },
    { time: '18:00', title: 'Hry & ohňostroj lampionů', desc: 'Vypouštění přání po vodě.' },
    { time: '20:00', title: 'Večerní zábava', desc: 'Hraje DJ – vaše písničky z RSVP!' },
    { time: '00:00', title: 'Půlnoční ramen', desc: 'Pro ty, kdo vydrží.' },
  ],

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
    iban: '',
    // TODO: číslo účtu v českém formátu pro ruční zadání, např. '123456789/0800'
    accountDisplay: '',
    recipient: 'Novomanzele', // jméno příjemce v QR (bez diakritiky)
    message: 'Svatebni dar od: ',
    tripNote: 'Na rok 2030 plánujeme měsíční cestu po Japonsku (odhadem 200 000 Kč).',
  },
};
