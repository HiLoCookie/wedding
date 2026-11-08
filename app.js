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
    <li><time>${esc(i.time)}</time>${i.icon ? `<img class="tl-icon" src="assets/icons/${esc(i.icon)}.png" alt="" width="40" height="40">` : '<span class="tl-dot"></span>'}<div><h3>${esc(i.title)}</h3>${i.desc ? `<p>${esc(i.desc)}</p>` : ''}</div></li>`).join('');

  // ---------- fotky (polaroidy + carousel + lightbox) ----------
  // Chyba ve fotkách nesmí shodit zbytek stránky (RSVP, QR…)
  try { setupPhotos(); } catch (ex) { console.error('Fotky:', ex); }

  function setupPhotos() {
    const P = C.photos || {};
    const ALL = window.GALLERY || [];
    const tilt = i => [-3, 2, -1.5, 3, -2.5, 1.5][i % 6];
    const thumb = g => 'assets/gallery/thumb/' + g.f;
    const full = g => 'assets/gallery/full/' + g.f;
    const open = (list, i) => window.Lightbox && Lightbox.open(list, i);

    // polaroidy „To jsme my“
    const couple = P.couple || [];
    const coupleBox = $('[data-gallery="couple"]');
    if (coupleBox) {
      coupleBox.innerHTML = couple.map((p, i) => `
        <figure class="polaroid" style="--tilt:${tilt(i)}deg">
          <button type="button" data-open="${i}" aria-label="Zvětšit fotku">
            <img src="${esc(p.src)}" alt="${esc(p.caption || '')}" loading="lazy" style="object-position:${esc(p.pos || 'center')}">
          </button>
          ${p.caption ? `<figcaption><span>${esc(p.caption)}</span></figcaption>` : ''}
        </figure>`).join('');
      coupleBox.addEventListener('click', e => {
        const b = e.target.closest('[data-open]');
        if (b) open(couple.map(p => ({ src: p.src, caption: p.caption })), +b.dataset.open);
      });
    }

    // carousel – řada polaroidů, které se posouvají do strany
    function carousel(el, items, title) {
      el.innerHTML = `
        ${title ? `<p class="car-title">${esc(title)}</p>` : ''}
        <div class="car">
          <button type="button" class="car-btn car-prev" aria-label="Posunout zpět">‹</button>
          <div class="car-track" tabindex="0">
            ${items.map((g, i) => `
              <figure class="polaroid car-item" style="--tilt:${tilt(i) / 2}deg">
                <button type="button" data-i="${i}" aria-label="Zvětšit fotku ${i + 1}">
                  <img src="${thumb(g)}" alt="" loading="lazy">
                </button>
              </figure>`).join('')}
          </div>
          <button type="button" class="car-btn car-next" aria-label="Posunout dál">›</button>
        </div>`;
      const track = $('.car-track', el);
      const by = d => track.scrollBy({ left: d * track.clientWidth * 0.85, behavior: 'smooth' });
      $('.car-prev', el).onclick = () => by(-1);
      $('.car-next', el).onclick = () => by(1);
      track.onclick = e => {
        const b = e.target.closest('[data-i]');
        if (b) open(items.map(g => ({ src: full(g) })), +b.dataset.i);
      };
    }

    // „Zobrazit zbytek“ pod polaroidy páru
    const shown = new Set(couple.map(p => p.g).filter(Boolean));
    const coupleRest = ALL.filter(g => (g.t.includes('my') || g.t.includes('japonsko')) && !shown.has(g.f.replace('.webp', '')));
    setupMore('couple', coupleRest);

    // mazlíčci – polaroidy se jmény; klik ukáže carousel s jeho fotkami
    const pets = P.pets || [];
    const petBox = $('[data-pets]');
    const petCar = $('#pets-more');
    if (petBox) {
      petBox.innerHTML = pets.map((p, i) => {
        const n = ALL.filter(g => g.t.includes(p.tag)).length;
        return `
        <figure class="polaroid pet" style="--tilt:${tilt(i)}deg">
          <button type="button" data-pet="${i}" aria-expanded="false" aria-controls="pets-more">
            <img src="${esc(p.src)}" alt="${esc(p.name)}" loading="lazy" style="object-position:${esc(p.pos || 'center')}">
          </button>
          <figcaption>
            <b>${esc(p.name)}</b>
            ${p.alias ? `<span class="alias">${esc(p.alias)}</span>` : ''}
            ${n ? `<button type="button" class="pet-more" data-pet="${i}">${n} fotek ↓</button>` : ''}
          </figcaption>
        </figure>`;
      }).join('');
      let active = null;
      petBox.addEventListener('click', e => {
        const b = e.target.closest('[data-pet]');
        if (!b) return;
        const i = +b.dataset.pet;
        $$('[data-pet]', petBox).forEach(x => x.setAttribute('aria-expanded', 'false'));
        $$('.pet', petBox).forEach(x => x.classList.remove('active'));
        if (active === i) { active = null; petCar.hidden = true; return; }
        active = i;
        const p = pets[i];
        const list = ALL.filter(g => g.t.includes(p.tag));
        carousel(petCar, list, p.tag === 'psi' ? 'Lucky & Dusty' : p.name);
        petCar.hidden = false;
        b.closest('.pet').classList.add('active');
        $$(`[data-pet="${i}"]`, petBox).forEach(x => x.setAttribute('aria-expanded', 'true'));
        petCar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
    // „Zobrazit zbytek“ u mazlíčků = všechny fotky zvířátek
    setupMore('pets', ALL.filter(g => g.t.includes('kocky') || g.t.includes('psi')), petCar);

    function setupMore(name, items, alsoHide) {
      const btn = $(`[data-more="${name}"]`);
      const box = $(`#${name}-rest`);
      if (!btn || !box || !items.length) { if (btn) btn.hidden = true; return; }
      const label = btn.textContent.trim();
      btn.textContent = `${label} (${items.length})`;
      btn.onclick = () => {
        const show = box.hidden;
        if (show && !box.dataset.built) { carousel(box, items); box.dataset.built = 1; }
        box.hidden = !show;
        if (alsoHide && show) { alsoHide.hidden = true; }
        btn.textContent = show ? 'Skrýt fotky' : `${label} (${items.length})`;
        btn.setAttribute('aria-expanded', show);
        if (show) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
    }
  }

  if (C.photos && C.photos.banner && $('.banner')) $('.banner').style.backgroundImage = `url("${C.photos.banner}")`;
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
