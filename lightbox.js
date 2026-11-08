/* Jednoduchý lightbox pro fotky – použití: Lightbox.open([{src, caption}], index) */
window.Lightbox = (function () {
  'use strict';
  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.innerHTML = `
    <button class="lb-close" type="button" aria-label="Zavřít">×</button>
    <button class="lb-prev" type="button" aria-label="Předchozí">‹</button>
    <figure><img alt=""><figcaption></figcaption></figure>
    <button class="lb-next" type="button" aria-label="Další">›</button>`;
  document.body.appendChild(dlg);

  const img = dlg.querySelector('img');
  const cap = dlg.querySelector('figcaption');
  let list = [], idx = 0;

  function show() {
    const p = list[idx];
    img.src = p.src;
    img.alt = p.caption || '';
    cap.textContent = (p.caption ? p.caption + '  ·  ' : '') + (idx + 1) + ' / ' + list.length;
    // přednačtení sousedních fotek
    [idx - 1, idx + 1].forEach(i => { const q = list[(i + list.length) % list.length]; if (q) new Image().src = q.src; });
  }
  function step(d) { idx = (idx + d + list.length) % list.length; show(); }

  dlg.querySelector('.lb-prev').onclick = () => step(-1);
  dlg.querySelector('.lb-next').onclick = () => step(1);
  dlg.querySelector('.lb-close').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  // swipe na mobilu
  let x0 = null;
  dlg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
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
