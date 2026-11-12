/**
 * ============================================================
 *  SVATEBNÍ RSVP – Google Apps Script
 *
 *  Co umí:
 *   1. přijímá RSVP z webu a ukládá je do listu „RSVP“
 *      (stejný e-mail = aktualizace původní odpovědi)
 *   2. hostovi hned pošle potvrzovací e-mail
 *   3. v den uzávěrky RSVP vám pošle přehled + tabulku (CSV)
 *   4. měsíc a týden před svatbou pošle upomínku všem, kdo dorazí
 *   5. z listu „Oznámení“ rozešle libovolnou zprávu (nový harmonogram,
 *      co s sebou…) – přes menu „💌 Svatba“ v tabulce
 *
 *  Návod k nastavení je v README.md.
 * ============================================================
 */

// ---------------- NASTAVENÍ (upravte) ----------------
const CONFIG = {
  COUPLE_EMAIL: 'vas.email@example.com',     // TODO: kam chodí přehledy a kopie
  COUPLE_NAMES: 'Jméno & Jméno',             // TODO
  WEDDING_DATE: '2027-06-12',                // TODO: RRRR-MM-DD
  WEDDING_TIME: '14:00',                     // TODO
  RSVP_DEADLINE: '2027-04-30',               // TODO: RRRR-MM-DD (stejné jako v config.js)
  PLACE: 'Statek U Lípy, Obec 123',          // TODO
  WEBSITE_URL: 'https://example.github.io/wedding/', // TODO
  REMINDER_DAYS: [30, 7],                    // kolik dní před svatbou poslat upomínku
  REMINDER_NOTE: 'Aktuální program a všechny informace najdete na webu.', // doplňující věta do upomínky
  SEND_HOUR: 9,                              // v kolik hodin běží denní kontrola
};
// ------------------------------------------------------

const SHEET_RSVP = 'RSVP';
const SHEET_NEWS = 'Oznámení';
const COL = {
  created: 1, name: 2, email: 3, attendance: 4, people: 5, companions: 6,
  accommodation: 7, song1: 8, song2: 9, diet: 10, message: 11, updated: 12,
};
const HEADERS = ['Odesláno', 'Jméno', 'E-mail', 'Účast', 'Počet osob', 'Doprovod',
  'Přespání', 'Písnička 1', 'Písnička 2', 'Strava / alergie', 'Vzkaz', 'Naposledy upraveno'];
const NEWS_HEADERS = ['Předmět', 'Text zprávy', 'Komu (Dorazí / Všichni)', 'Odesláno'];

const ATTEND = { yes: 'Dorazím', plus: 'Dorazím s doprovodem', no: 'Nedorazím' };
const STAY = { yes: 'Ano – chci ubytování', no: 'Ne – pojedu domů', open: 'Pod širákem', tent: 'Ve stanu' };

// ============================================================
//  WEB: příjem formuláře
// ============================================================
function doPost(e) {
  if (!e || !e.postData) {
    // Spuštěno ručně z editoru – doPost volá jen web při odeslání formuláře.
    throw new Error('doPost nespouštějte ručně – volá ji web při odeslání formuláře. ' +
      'Pro vyzkoušení vyberte nahoře funkci „testRsvp“ a klikněte na Spustit.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.website) return json_({ ok: true }); // past na roboty
    const r = normalize_(data);
    const updated = upsert_(r);
    try {
      sendConfirmation_(r, updated);
    } catch (mailErr) {
      console.error('Potvrzovací e-mail se nepodařilo odeslat: ' + mailErr);
    }
    return json_({ ok: true, updated: updated });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Zkušební RSVP – spusťte z editoru (vyberte „testRsvp“ → Spustit).
 * Do listu RSVP přidá řádek „TEST“ s vaším e-mailem a pošle vám potvrzovací e-mail.
 * Řádek pak v tabulce klidně smažte.
 */
function testRsvp() {
  const res = doPost({ postData: { contents: JSON.stringify({
    name: 'TEST Testovací host',
    email: CONFIG.COUPLE_EMAIL,
    attendance: 'plus',
    companions: 1,
    companionNames: 'Testovací doprovod',
    accommodation: 'tent',
    song1: 'Testovací písnička 1',
    song2: 'Testovací písnička 2',
    diet: '',
    message: 'Tohle je test z editoru Apps Script.',
  }) } });
  console.log(res.getContent());
}

function doGet() {
  return ContentService.createTextOutput('Svatební RSVP běží ✔');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normalize_(d) {
  const clean = (v, max) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max || 300);
  const r = {
    name: clean(d.name, 100),
    email: clean(d.email, 120).toLowerCase(),
    attendance: ATTEND[d.attendance] ? d.attendance : '',
    companions: Math.max(0, Math.min(10, parseInt(d.companions, 10) || 0)),
    companionNames: clean(d.companionNames),
    accommodation: STAY[d.accommodation] ? d.accommodation : '',
    song1: clean(d.song1, 200),
    song2: clean(d.song2, 200),
    diet: clean(d.diet),
    message: String(d.message || '').trim().slice(0, 1000),
  };
  if (r.name.length < 2) throw new Error('Chybí jméno.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) throw new Error('Neplatný e-mail.');
  if (!r.attendance) throw new Error('Chybí odpověď na účast.');
  if (r.attendance !== 'plus') { r.companions = 0; r.companionNames = ''; }
  if (r.attendance === 'plus' && r.companions < 1) r.companions = 1;
  if (r.attendance === 'no') { r.accommodation = ''; r.song1 = ''; r.song2 = ''; r.diet = ''; }
  r.people = r.attendance === 'no' ? 0 : 1 + r.companions;
  return r;
}

function upsert_(r) {
  const sh = sheet_(SHEET_RSVP, HEADERS);
  const now = new Date();
  const companions = r.companions ? r.companions + (r.companionNames ? ' – ' + r.companionNames : '') : '';
  const row = [now, r.name, r.email, ATTEND[r.attendance], r.people, companions,
    STAY[r.accommodation] || '', r.song1, r.song2, r.diet, r.message, now];

  const last = sh.getLastRow();
  if (last > 1) {
    const emails = sh.getRange(2, COL.email, last - 1, 1).getValues();
    for (let i = 0; i < emails.length; i++) {
      if (String(emails[i][0]).toLowerCase() === r.email) {
        const rowIdx = i + 2;
        row[0] = sh.getRange(rowIdx, COL.created).getValue(); // původní čas ponecháme
        sh.getRange(rowIdx, 1, 1, row.length).setValues([row]);
        return true;
      }
    }
  }
  sh.appendRow(row);
  return false;
}

// ============================================================
//  E-MAILY
// ============================================================
function sendConfirmation_(r, updated) {
  const coming = r.attendance !== 'no';
  const subject = coming
    ? (updated ? 'Vaše RSVP bylo aktualizováno 🎌' : 'Máme vás! Potvrzení účasti na svatbě 🎌')
    : 'Děkujeme za odpověď 🌸';

  const rows = [['Účast', ATTEND[r.attendance]]];
  if (coming) {
    rows.push(['Počet osob', r.people + (r.companionNames ? ' (' + r.companionNames + ')' : '')]);
    rows.push(['Přespání', STAY[r.accommodation] || '—']);
    if (r.song1 || r.song2) rows.push(['Písničky', [r.song1, r.song2].filter(String).join('<br>')]);
    if (r.diet) rows.push(['Strava', esc_(r.diet)]);
  }
  if (r.message) rows.push(['Vzkaz', esc_(r.message)]);

  const body = coming
    ? `<p>Ahoj ${esc_(firstName_(r.name))},</p>
       <p>moc děkujeme za potvrzení – už se na vás těšíme! Tady je shrnutí vaší odpovědi:</p>
       ${table_(rows)}
       <p><strong>Kdy:</strong> ${czDate_(CONFIG.WEDDING_DATE)} v ${CONFIG.WEDDING_TIME}<br>
          <strong>Kde:</strong> ${esc_(CONFIG.PLACE)}</p>
       <p>Kdybyste potřebovali něco změnit, stačí na webu vyplnit formulář znovu se stejným e-mailem.
          Měsíc a týden před svatbou vám ještě pošleme připomínku.</p>`
    : `<p>Ahoj ${esc_(firstName_(r.name))},</p>
       <p>děkujeme, že jste nám dali vědět. Moc nás mrzí, že to nevyjde – budete nám chybět!
          Kdyby se něco změnilo, stačí formulář na webu vyplnit znovu.</p>
       ${table_(rows)}`;

  mail_(r.email, subject, body);
}

/** Přehled všech odpovědí – posílá se vám v den uzávěrky (nebo ručně z menu). */
function sendReport() {
  const all = readRsvps_();
  const coming = all.filter(g => g.attendance !== ATTEND.no);
  const people = coming.reduce((s, g) => s + (Number(g.people) || 0), 0);
  const byStay = {};
  coming.forEach(g => {
    const k = g.accommodation || '—';
    byStay[k] = (byStay[k] || 0) + (Number(g.people) || 0);
  });
  const songs = [];
  coming.forEach(g => [g.song1, g.song2].forEach(s => s && songs.push(esc_(s) + ' <span style="color:#888">(' + esc_(g.name) + ')</span>')));
  const diets = coming.filter(g => g.diet).map(g => '<b>' + esc_(g.name) + ':</b> ' + esc_(g.diet));

  const summary = [
    ['Odpovědí celkem', all.length],
    ['Dorazí (osob)', '<b>' + people + '</b> (' + coming.length + ' odpovědí)'],
    ['Nedorazí', all.length - coming.length],
  ].concat(Object.keys(byStay).map(k => ['Přespání: ' + k, byStay[k] + ' osob']));

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const body = `<p>Ahoj, tady je přehled RSVP ke dni ${czDate_(today_())}.</p>
    ${table_(summary)}
    <h3>🎵 Písničky (${songs.length})</h3><ol>${songs.map(s => '<li>' + s + '</li>').join('') || '<li>zatím žádné</li>'}</ol>
    ${diets.length ? '<h3>🍱 Strava / alergie</h3><ul>' + diets.map(d => '<li>' + d + '</li>').join('') + '</ul>' : ''}
    <p>Kompletní tabulka je v příloze (CSV, otevře se v Excelu) a živě zde:
       <a href="${ss.getUrl()}">${esc_(ss.getName())}</a></p>`;

  const csv = toCsv_();
  const blob = Utilities.newBlob(csv, 'text/csv', 'rsvp-' + today_() + '.csv');
  mail_(CONFIG.COUPLE_EMAIL, 'Přehled RSVP – ' + people + ' hostů 📋', body, [blob]);
}

/** Upomínka všem, kdo dorazí. */
function sendReminder_(daysBefore) {
  const guests = readRsvps_().filter(g => g.attendance !== ATTEND.no);
  ensureQuota_(guests.length);
  const when = daysBefore >= 28 ? 'za měsíc' : daysBefore === 7 ? 'za týden' : 'za ' + daysBefore + ' dní';
  guests.forEach(g => {
    const rows = [
      ['Kdy', czDate_(CONFIG.WEDDING_DATE) + ' v ' + CONFIG.WEDDING_TIME],
      ['Kde', esc_(CONFIG.PLACE)],
      ['Počet osob', g.people],
      ['Přespání', esc_(g.accommodation || '—')],
    ];
    if (g.song1 || g.song2) rows.push(['Vaše písničky', [g.song1, g.song2].filter(String).map(esc_).join('<br>')]);
    const body = `<p>Ahoj ${esc_(firstName_(g.name))},</p>
      <p>už <strong>${when}</strong> se vidíme na naší svatbě! 🎉 Pro jistotu posíláme shrnutí:</p>
      ${table_(rows)}
      <p>${esc_(CONFIG.REMINDER_NOTE)}</p>
      <p>Kdyby se u vás něco změnilo, dejte nám prosím vědět odpovědí na tento e-mail.</p>`;
    mail_(g.email, 'Už ' + when + ' se vidíme! 🎌', body);
  });
  return guests.length;
}

/** Odeslání jedné zprávy z listu „Oznámení“. testOnly = poslat jen vám. */
function sendNews_(rowIdx, testOnly) {
  const sh = sheet_(SHEET_NEWS, NEWS_HEADERS);
  const [subject, text, target, sent] = sh.getRange(rowIdx, 1, 1, 4).getValues()[0];
  if (!subject || !text) throw new Error('Na řádku ' + rowIdx + ' chybí předmět nebo text.');

  const toAll = String(target).toLowerCase().indexOf('všichni') === 0;
  let guests = readRsvps_();
  if (!toAll) guests = guests.filter(g => g.attendance !== ATTEND.no);
  if (testOnly) guests = [{ name: 'Test', email: CONFIG.COUPLE_EMAIL }];

  return { subject, text, sent, guests, toAll, send: () => {
    ensureQuota_(guests.length);
    guests.forEach(g => mail_(g.email, subject, '<p>Ahoj ' + esc_(firstName_(g.name)) + ',</p>' + textToHtml_(text)));
    if (!testOnly) sh.getRange(rowIdx, 4).setValue(new Date().toLocaleString('cs-CZ') + ' (' + guests.length + ' e-mailů)');
    return guests.length;
  } };
}

function mail_(to, subject, innerHtml, attachments) {
  const html = `<div style="background:#f6efe2;padding:24px 12px;font-family:Georgia,serif;color:#2b2622">
    <div style="max-width:560px;margin:0 auto;background:#fffdf8;border-radius:14px;overflow:hidden;border:1px solid #e3d3b5">
      <div style="background:#b8322a;color:#f6efe2;text-align:center;padding:22px 16px">
        <div style="font-size:13px;letter-spacing:.4em">結婚式</div>
        <div style="font-size:26px;font-weight:bold;margin-top:4px">${esc_(CONFIG.COUPLE_NAMES)}</div>
      </div>
      <div style="padding:22px 26px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6">${innerHtml}
        <p style="margin-top:24px">Těšíme se!<br><strong>${esc_(CONFIG.COUPLE_NAMES)}</strong> 🌸</p>
        <p style="font-size:13px;color:#888"><a href="${CONFIG.WEBSITE_URL}" style="color:#b8322a">${CONFIG.WEBSITE_URL}</a></p>
      </div>
    </div></div>`;
  const opts = { htmlBody: html, name: CONFIG.COUPLE_NAMES, replyTo: CONFIG.COUPLE_EMAIL };
  if (attachments) opts.attachments = attachments;
  MailApp.sendEmail(to, subject, stripHtml_(innerHtml), opts);
}

// ============================================================
//  AUTOMATIKA – běží jednou denně (spouštěč z setup())
// ============================================================
function dailyJob() {
  const today = today_();
  const props = PropertiesService.getScriptProperties();

  // 1) přehled v den uzávěrky
  if (today >= CONFIG.RSVP_DEADLINE && !props.getProperty('sent_report')) {
    sendReport();
    props.setProperty('sent_report', today);
  }

  // 2) upomínky – když jich je „po termínu“ víc (pozdní nastavení), pošle jen nejbližší
  if (today < CONFIG.WEDDING_DATE) {
    const due = CONFIG.REMINDER_DAYS
      .filter(d => today >= addDays_(CONFIG.WEDDING_DATE, -d) && !props.getProperty('sent_reminder_' + d))
      .sort((a, b) => a - b);
    if (due.length) {
      const n = sendReminder_(due[0]);
      due.forEach(d => props.setProperty('sent_reminder_' + d, today + ' (' + n + ')'));
    }
  }
}

/** Spusťte JEDNOU ručně: vytvoří listy a nastaví denní spouštěč. */
function setup() {
  sheet_(SHEET_RSVP, HEADERS);
  const news = sheet_(SHEET_NEWS, NEWS_HEADERS);
  if (news.getLastRow() < 2) {
    news.appendRow(['Aktualizovaný program svatby 🎌',
      'máme pro vás pár novinek:\n\n13:00 – příjezd hostů\n14:00 – obřad\n…\n\nNezapomeňte teplé oblečení na večer!\nVíce info: ' + CONFIG.WEBSITE_URL,
      'Dorazí', '']);
    news.setColumnWidth(2, 480);
    news.getRange('B:B').setWrap(true);
  }
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyJob')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(CONFIG.SEND_HOUR).create();
  try {
    SpreadsheetApp.getUi().alert('Hotovo ✔ Listy jsou připravené a automatické e-maily zapnuté (každý den v ' + CONFIG.SEND_HOUR + ':00).');
  } catch (e) { /* spuštěno z editoru */ }
}

// ============================================================
//  MENU V TABULCE
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu('💌 Svatba')
    .addItem('Odeslat vybrané oznámení hostům', 'menuSendNews')
    .addItem('Poslat vybrané oznámení jen mně (test)', 'menuSendNewsTest')
    .addSeparator()
    .addItem('Poslat mi přehled RSVP teď', 'menuReport')
    .addItem('Stav automatických e-mailů', 'menuStatus')
    .addSeparator()
    .addItem('Nastavení (spustit jednou)', 'setup')
    .addToUi();
}

function menuSendNews() { menuNews_(false); }
function menuSendNewsTest() { menuNews_(true); }

function menuNews_(testOnly) {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActiveSheet();
  const row = sh.getActiveRange().getRow();
  if (sh.getName() !== SHEET_NEWS || row < 2) {
    ui.alert('Přejděte na list „' + SHEET_NEWS + '“ a klikněte do řádku se zprávou, kterou chcete poslat.');
    return;
  }
  try {
    const job = sendNews_(row, testOnly);
    if (!testOnly) {
      let q = 'Odeslat „' + job.subject + '“ ' + job.guests.length + ' hostům (' + (job.toAll ? 'všichni, kdo odpověděli' : 'jen ti, kdo dorazí') + ')?';
      if (job.sent) q = '⚠️ Tahle zpráva už byla odeslána: ' + job.sent + '\n\n' + q;
      if (ui.alert('Potvrzení', q, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    }
    const n = job.send();
    ui.alert('Odesláno ✔ (' + n + ' e-mailů)');
  } catch (e) {
    ui.alert('Chyba: ' + e.message);
  }
}

function menuReport() {
  sendReport();
  SpreadsheetApp.getUi().alert('Přehled odeslán na ' + CONFIG.COUPLE_EMAIL);
}

function menuStatus() {
  const p = PropertiesService.getScriptProperties();
  const has = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'dailyJob');
  const lines = [
    'Denní spouštěč: ' + (has ? 'zapnutý ✔' : 'VYPNUTÝ – spusťte „Nastavení“'),
    'Zbývající denní limit e-mailů: ' + MailApp.getRemainingDailyQuota(),
    '',
    'Přehled RSVP (' + czDate_(CONFIG.RSVP_DEADLINE) + '): ' + (p.getProperty('sent_report') || 'zatím neodeslán'),
  ];
  CONFIG.REMINDER_DAYS.forEach(d => lines.push(
    'Upomínka ' + d + ' dní předem (' + czDate_(addDays_(CONFIG.WEDDING_DATE, -d)) + '): ' + (p.getProperty('sent_reminder_' + d) || 'zatím neodeslána')));
  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

// ============================================================
//  POMOCNÉ FUNKCE
// ============================================================
function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f2c6c9');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readRsvps_() {
  const sh = sheet_(SHEET_RSVP, HEADERS);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .filter(r => r[COL.email - 1])
    .map(r => ({
      name: r[COL.name - 1], email: r[COL.email - 1], attendance: r[COL.attendance - 1],
      people: r[COL.people - 1], accommodation: r[COL.accommodation - 1],
      song1: r[COL.song1 - 1], song2: r[COL.song2 - 1], diet: r[COL.diet - 1],
    }));
}

function toCsv_() {
  const values = sheet_(SHEET_RSVP, HEADERS).getDataRange().getDisplayValues();
  const cell = v => '"' + String(v).replace(/"/g, '""') + '"';
  // středník + BOM = česká verze Excelu otevře správně i s diakritikou
  return '﻿' + values.map(r => r.map(cell).join(';')).join('\r\n');
}

function ensureQuota_(n) {
  const left = MailApp.getRemainingDailyQuota();
  if (left < n) throw new Error('Dnešní limit e-mailů nestačí (zbývá ' + left + ', potřeba ' + n + '). Zkuste to zítra.');
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
function addDays_(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Utilities.formatDate(new Date(Date.UTC(y, m - 1, d + n)), 'UTC', 'yyyy-MM-dd');
}
function czDate_(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return d + '. ' + m + '. ' + y;
}
function firstName_(name) { return String(name).trim().split(/\s+/)[0]; }
function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function table_(rows) {
  return '<table style="border-collapse:collapse;margin:12px 0;width:100%">' + rows.map(r =>
    '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#5c524a;white-space:nowrap;vertical-align:top">' + r[0] +
    '</td><td style="padding:6px 10px;border-bottom:1px solid #eee">' + r[1] + '</td></tr>').join('') + '</table>';
}
function textToHtml_(text) {
  return esc_(text).split(/\n{2,}/).map(p =>
    '<p>' + p.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#b8322a">$1</a>') + '</p>').join('');
}
function stripHtml_(html) {
  return html.replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|tr|li|h3)>/g, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').trim();
}
