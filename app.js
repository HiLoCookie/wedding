(function () {
  'use strict';
  const C = window.WEDDING;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const weddingDate = new Date(C.date);
  const fmtDate = (d, opts) => d.toLocaleDateString('cs-CZ', opts);
  const deadlineDate = new Date(C.rsvpDeadline + 'T23:59:59');

  // ---------- naplnění textů z config.js ----------
  $$('[data-name="a"]').forEach(el => (el.textContent = C.couple.a));
  $$('[data-name="b"]').forEach(el => (el.textContent = C.couple.b));
  document.title = `${C.couple.a} & ${C.couple.b} – svatba`;
  $$('[data-date]').forEach(el => {
    el.textContent = fmtDate(weddingDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · ' + weddingDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  });
  $$('[data-deadline]').forEach(el => (el.textContent = fmtDate(deadlineDate, { day: 'numeric', month: 'long', year: 'numeric' })));
  $$('[data-place]').forEach(el => (el.textContent = `${C.place.name}, ${C.place.address}`));
  $('[data-place-name]').textContent = C.place.name;
  $('[data-place-address]').textContent = C.place.address;
  $('[data-place-note]').textContent = C.place.note || '';
  $('[data-place-map]').href = C.place.mapUrl;
  const contact = $('[data-contact]');
  contact.textContent = C.contact.email;
  contact.href = 'mailto:' + C.contact.email;

  // program
  $('[data-schedule]').innerHTML = C.schedule.map(i => `
    <li><time>${esc(i.time)}</time><div><h3>${esc(i.title)}</h3>${i.desc ? `<p>${esc(i.desc)}</p>` : ''}</div></li>`).join('');
  // co s sebou
  $('[data-bring]').innerHTML = C.bring.map(b => `<li>${esc(b)}</li>`).join('');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- odpočet ----------
  const cd = $('[data-countdown]');
  function tick() {
    const diff = weddingDate - new Date();
    if (diff <= 0) { cd.innerHTML = '<p><strong>Je to tady! おめでとう 🎉</strong></p>'; return; }
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60;
    cd.innerHTML = [[d, 'dní'], [h, 'hodin'], [m, 'minut']].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
  }
  tick(); setInterval(tick, 30000);

  // ---------- RSVP formulář ----------
  const form = $('#rsvp-form');
  const status = $('.form-status', form);

  function updateReveal() {
    const att = (form.attendance.value || '');
    $$('.reveal', form).forEach(el => el.classList.toggle('on', el.dataset.showIf.split(' ').includes(att)));
  }
  form.addEventListener('change', updateReveal);

  if (new Date() > deadlineDate) {
    status.textContent = 'Termín pro potvrzení už vypršel – pokud se chcete přihlásit nebo něco změnit, napište nám prosím e-mail.';
    status.className = 'form-status err';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const err = validate(data);
    if (err) { setStatus(err, 'err'); return; }

    if (data.attendance !== 'plus') { data.companions = 0; data.companionNames = ''; }
    if (data.attendance === 'no') { data.accommodation = ''; data.song1 = ''; data.song2 = ''; data.diet = ''; }

    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    setStatus('Odesílám…', '');

    try {
      if (!C.scriptUrl) {
        console.info('[ukázkový režim] RSVP by se odeslalo:', data);
        await new Promise(r => setTimeout(r, 600));
        setStatus('Ukázkový režim: formulář zatím není napojený na Google Tabulku (viz README).', 'err');
        return;
      }
      const res = await fetch(C.scriptUrl, {
        method: 'POST',
        // text/plain = bez CORS preflightu, Apps Script si JSON přečte sám
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'Neznámá chyba');
      form.reset(); updateReveal();
      setStatus(data.attendance === 'no'
        ? 'Děkujeme za odpověď, budete nám chybět! Potvrzení jsme vám poslali e-mailem.'
        : (out.updated ? 'Vaše odpověď byla aktualizována. ' : 'Hurá, máme vás! 🎉 ') + 'Potvrzení najdete v e-mailu.', 'ok');
    } catch (ex) {
      console.error(ex);
      setStatus('Odeslání se nepovedlo 😕 Zkuste to prosím znovu, nebo nám napište na ' + C.contact.email, 'err');
    } finally {
      btn.disabled = false;
    }
  });

  function validate(d) {
    $$('.invalid', form).forEach(el => el.classList.remove('invalid'));
    const bad = (name, msg) => { const el = form.elements[name]; (el.length ? el[0].closest('.field') : el)?.classList.add('invalid'); form.elements[name].focus?.(); return msg; };
    if (!d.name || d.name.trim().length < 2) return bad('name', 'Vyplňte prosím jméno.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return bad('email', 'Zkontrolujte prosím e-mail.');
    if (!d.attendance) return 'Dejte nám prosím vědět, jestli dorazíte.';
    if (d.attendance === 'plus' && !(+d.companions >= 1)) return bad('companions', 'Zadejte počet osob doprovodu.');
    if (d.attendance !== 'no' && !d.accommodation) return 'Vyberte prosím, jak to máte s přespáním.';
    return '';
  }
  function setStatus(msg, cls) { status.textContent = msg; status.className = 'form-status ' + cls; }

  // ---------- QR platba (formát SPD – QR Platba) ----------
  const qrEl = $('#qr');
  const G = C.gift;
  $('[data-trip-note]').textContent = G.tripNote || '';
  if (G.accountDisplay) $('[data-account]').textContent = 'Číslo účtu: ' + G.accountDisplay;

  const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\*/g, '').trim();
  function renderQR() {
    if (!G.iban || typeof qrcode === 'undefined') {
      qrEl.innerHTML = '<div class="qr-empty">QR kód brzy doplníme 🙂</div>';
      $('#qr-hint').hidden = true;
      return;
    }
    const from = strip($('#gift-from').value);
    const amount = parseFloat($('#gift-amount').value);
    const parts = ['SPD', '1.0', 'ACC:' + G.iban.replace(/\s/g, '').toUpperCase()];
    if (amount > 0) parts.push('AM:' + amount.toFixed(2));
    parts.push('CC:CZK');
    if (G.recipient) parts.push('RN:' + strip(G.recipient).slice(0, 35));
    parts.push('MSG:' + (G.message + from).slice(0, 60));
    const spd = parts.join('*');
    const q = qrcode(0, 'M');
    q.addData(spd);
    q.make();
    qrEl.innerHTML = q.createSvgTag({ cellSize: 6, margin: 0, scalable: true, alt: 'QR platba' });
  }
  let t;
  ['#gift-from', '#gift-amount'].forEach(s => $(s).addEventListener('input', () => { clearTimeout(t); t = setTimeout(renderQR, 250); }));
  renderQR();

  // ---------- sakura ----------
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const box = $('.petals');
    const spawn = () => {
      if (document.hidden) return;
      const p = document.createElement('i');
      p.className = 'petal';
      const dur = 9 + Math.random() * 8;
      p.style.left = Math.random() * 100 + 'vw';
      p.style.setProperty('--drift', (Math.random() * 200 - 60) + 'px');
      p.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = dur + 's';
      p.style.transform = `scale(${0.6 + Math.random() * 0.7})`;
      box.appendChild(p);
      setTimeout(() => p.remove(), dur * 1000);
    };
    for (let i = 0; i < 4; i++) setTimeout(spawn, i * 700);
    setInterval(spawn, 1800);
  }
})();
