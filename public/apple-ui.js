/* apple-ui.js — retour tactile (vibration légère) et comportements « app installée »
   Chargé avec <script src="/apple-ui.js" defer></script> */
(() => {
  'use strict';

  const root = document.documentElement;

  // Marque l'app lancée depuis l'écran d'accueil (utile pour adapter le CSS)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  root.classList.toggle('is-standalone', standalone);

  // Active l'état :active sur les anciens Safari
  document.addEventListener('touchstart', () => {}, { passive: true });

  // Retour haptique
  // Android : Vibration API. iOS (17.4+) : un interrupteur natif masqué qui déclenche le moteur Taptic.
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
    } catch {
      /* appareil sans retour haptique : on ignore */
    }
  };
  window.haptic = haptic; // utilisable ailleurs : window.haptic(25) après un paiement réussi

  // Vibration à chaque vrai toucher (pas pendant un défilement)
  const TARGETS = 'button:not(:disabled), [role="button"], [role="tab"], [role="switch"], a[href], summary';
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted || e.detail === 0) return;          // ignore les clics simulés et le clavier
      const el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
      if (!el || el.hasAttribute('data-no-haptic')) return;
      haptic();
    },
    { passive: true, capture: true }
  );

  // Bloque le glisser-déposer des images, qui donne un effet « page web »
  document.addEventListener('dragstart', (e) => {
    if (e.target instanceof HTMLImageElement) e.preventDefault();
  });
})();
