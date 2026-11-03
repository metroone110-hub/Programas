/* apple-ui.js (v2) — retour haptique, comportement « app installée », images sans flash blanc
   <script src="/apple-ui.js" defer></script> */
(() => {
  'use strict';

  const root = document.documentElement;
  const touchDevice = window.matchMedia('(pointer: coarse)').matches;

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  root.classList.toggle('is-standalone', standalone);

  document.addEventListener('touchstart', () => {}, { passive: true });   // active :active sur les vieux Safari

  /* ───────── Retour haptique ───────── */
  let iosSwitch = null;
  const iosTap = () => {
    if (!iosSwitch) {
      iosSwitch = document.createElement('label');
      iosSwitch.setAttribute('aria-hidden', 'true');
      iosSwitch.style.cssText =
        'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.tabIndex = -1;
      iosSwitch.appendChild(input);
      document.body.appendChild(iosSwitch);
    }
    iosSwitch.click();
  };
  const haptic = (ms = 8) => {
    try {
      if (typeof navigator.vibrate === 'function') navigator.vibrate(ms);
      else iosTap();
    } catch { /* pas de haptique sur cet appareil */ }
  };
  window.haptic = haptic;

  const TARGETS = 'button:not(:disabled), [role="button"], [role="tab"], [role="switch"], a[href], summary';
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted || e.detail === 0) return;
      const el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
      if (!el || el.hasAttribute('data-no-haptic')) return;
      haptic();
    },
    { passive: true, capture: true }
  );

  /* ───────── Comportement d'app ───────── */
  // Pas de menu « copier / enregistrer l'image » à l'appui long (sur écran tactile seulement)
  if (touchDevice) {
    document.addEventListener('contextmenu', (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t && !t.closest('input, textarea, [contenteditable], [data-selectable]')) e.preventDefault();
    });
  }
  document.addEventListener('dragstart', (e) => {
    if (e.target instanceof HTMLImageElement) e.preventDefault();
  });

  /* ───────── Images : charger avant d'arriver à l'écran, afficher sans trou blanc ───────── */
  const seen = new WeakSet();

  // Les images « lazy » démarrent leur chargement 2,5 écrans avant d'être visibles
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.loading = 'eager';
              io.unobserve(entry.target);
            }
          },
          { rootMargin: '250% 0px' }
        )
      : null;

  const prepare = (img) => {
    if (seen.has(img)) return;
    seen.add(img);
    img.decoding = 'async';

    if (!img.complete || img.naturalWidth === 0) {
      img.classList.add('is-loading');
      const done = (ok) => {
        img.classList.remove('is-loading');
        if (ok) img.classList.add('is-loaded');
      };
      img.addEventListener('load', () => done(true), { once: true });
      img.addEventListener('error', () => done(false), { once: true });
    }
    if (io && img.loading === 'lazy') io.observe(img);
  };

  const scan = (node) => {
    if (node instanceof HTMLImageElement) prepare(node);
    else if (node instanceof Element) node.querySelectorAll('img').forEach(prepare);
  };

  const start = () => {
    scan(document.body);
    new MutationObserver((mutations) => {
      for (const m of mutations) m.addedNodes.forEach(scan);
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
