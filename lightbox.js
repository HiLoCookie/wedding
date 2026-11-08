/*
 * Jednoduchý lightbox pro fotky a videa.
 * Použití: Lightbox.open([{ src, caption } | { video, poster, caption } | { youtube, caption }], index)
 */
window.Lightbox = (function () {
  'use strict';
  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.innerHTML = `
    <button class="lb-close" type="button" aria-label="Zavřít">×</button>
    <button class="lb-prev" type="button" aria-label="Předchozí">‹</button>
    <figure><div class="lb-media"></div><figcaption></figcaption></figure>
    <button class="lb-next" type="button" aria-label="Další">›</button>`;
  document.body.appendChild(dlg);

  const media = dlg.querySelector('.lb-media');
  const cap = dlg.querySelector('figcaption');
  let list = [], idx = 0;
  const attr = s => String(s || '').replace(/"/g, '&quot;');

  function show() {
    const p = list[idx];
    if (p.youtube) {
      media.innerHTML = `<div class="lb-yt"><iframe src="https://www.youtube-nocookie.com/embed/${attr(p.youtube)}?autoplay=1&rel=0"
        title="${attr(p.caption)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
    } else if (p.video) {
      media.innerHTML = `<video src="${attr(p.video)}" poster="${attr(p.poster)}" controls autoplay playsinline></video>`;
    } else {
      media.innerHTML = `<img src="${attr(p.src)}" alt="${attr(p.caption)}">`;
      // přednačtení sousedních fotek
      [idx - 1, idx + 1].forEach(i => { const q = list[(i + list.length) % list.length]; if (q && q.src) new Image().src = q.src; });
    }
    cap.textContent = (p.caption || '') + (list.length > 1 ? (p.caption ? '  ·  ' : '') + (idx + 1) + ' / ' + list.length : '');
  }
  function step(d) { idx = (idx + d + list.length) % list.length; show(); }

  dlg.querySelector('.lb-prev').onclick = () => step(-1);
  dlg.querySelector('.lb-next').onclick = () => step(1);
  dlg.querySelector('.lb-close').onclick = () => dlg.close();
  dlg.addEventListener('close', () => { media.innerHTML = ''; }); // zastaví video
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', e => {
    if (e.target.tagName === 'VIDEO') return; // šipky ovládají video
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  // swipe na mobilu (ne přes video, tam se posouvá čas)
  let x0 = null;
  dlg.addEventListener('touchstart', e => { x0 = e.target.closest('video, iframe') ? null : e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });

  return {
    open(items, i) {
      list = items; idx = i || 0; show();
      dlg.querySelector('.lb-prev').hidden = dlg.querySelector('.lb-next').hidden = list.length < 2;
      if (!dlg.open) dlg.showModal();
    },
  };
})();
