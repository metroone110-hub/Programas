// src/components/TicketIntro.tsx
// Intro animée : le ticket monte, sa ligne de découpe se dessine, le prix s'affiche,
// puis le talon se détache et l'app apparaît. Dure environ 2,7 s, se passe d'un toucher,
// ne joue qu'une fois par session et respecte « Réduire les animations ».
//
// Usage : place <TicketIntro /> tout en haut du rendu de <App />. L'app se charge dessous pendant l'animation.
import React, { useEffect, useRef, useState } from 'react';

const KEY = 'programas_intro_seen';
const BARS = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 1];

const haptic = (ms: number) => (window as unknown as { haptic?: (n: number) => void }).haptic?.(ms);

const CSS = `
.ti-root{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#000;cursor:pointer;
  perspective:900px;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  transition:opacity .5s ease,visibility .5s;-webkit-user-select:none;user-select:none}
.ti-root.ti-out{opacity:0;visibility:hidden;pointer-events:none}
.ti-ticket{width:min(80vw,310px);animation:ti-rise .85s cubic-bezier(.32,.72,0,1) both}
.ti-main,.ti-stub{background:#f5f5f7;color:#1d1d1f}
.ti-main{position:relative;display:flex;flex-direction:column;height:300px;padding:26px 24px 28px;border-radius:22px 22px 0 0;
  -webkit-mask:radial-gradient(circle 13px at 0 100%,#0000 96%,#000) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 96%,#000) right/51% 100% no-repeat;
  mask:radial-gradient(circle 13px at 0 100%,#0000 96%,#000) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 96%,#000) right/51% 100% no-repeat;
  transition:transform .7s cubic-bezier(.32,.72,0,1)}
.ti-stub{padding:20px 24px 22px;border-radius:0 0 22px 22px;transform-origin:0 0;
  -webkit-mask:radial-gradient(circle 13px at 0 0,#0000 96%,#000) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 0,#0000 96%,#000) right/51% 100% no-repeat;
  mask:radial-gradient(circle 13px at 0 0,#0000 96%,#000) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 0,#0000 96%,#000) right/51% 100% no-repeat;
  transition:transform .65s cubic-bezier(.5,0,.9,.4),opacity .55s ease-in}
.ti-tear .ti-stub{transform:translate(38px,80px) rotate(11deg);opacity:0}
.ti-tear .ti-main{transform:translateY(-8px) scale(1.02)}
.ti-brand{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:600}
.ti-mark{width:22px;height:22px;border-radius:6px;background:#ea580c}
.ti-label{margin-top:auto;font-size:15px;color:rgba(60,60,67,.6)}
.ti-price{display:flex;align-items:baseline;gap:8px;font-size:76px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.ti-price small{font-size:20px;font-weight:600}
.ti-where{margin-top:14px;font-size:13px;color:rgba(60,60,67,.6)}
.ti-perf{position:absolute;left:24px;right:24px;bottom:0;height:2px;transform-origin:left;
  background:repeating-linear-gradient(90deg,rgba(60,60,67,.3) 0 7px,transparent 7px 14px);
  animation:ti-draw .5s .65s cubic-bezier(.32,.72,0,1) both}
.ti-bars{display:flex;justify-content:center;align-items:stretch;gap:3px;height:44px}
.ti-bars i{background:#1d1d1f;transform-origin:bottom;animation:ti-bar .4s cubic-bezier(.32,.72,0,1) both}
.ti-num{margin-top:10px;text-align:center;font-size:13px;color:rgba(60,60,67,.6)}
@keyframes ti-rise{from{opacity:0;transform:translateY(70px) scale(.92) rotateX(14deg)}to{opacity:1;transform:none}}
@keyframes ti-draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes ti-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
`;

type Phase = 'enter' | 'tear' | 'exit' | 'done';

interface Props {
  onDone?: () => void;
  /** Rejoue l'intro à chaque ouverture, pas seulement la première fois de la session */
  always?: boolean;
}

export const TicketIntro: React.FC<Props> = ({ onDone, always = false }) => {
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'done';
      if (!always && sessionStorage.getItem(KEY)) return 'done';
    } catch {
      /* stockage indisponible : on joue l'intro */
    }
    return 'enter';
  });
  const [price, setPrice] = useState(0);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* ignoré */
    }
    setPhase('exit');
    window.setTimeout(() => {
      setPhase('done');
      onDone?.();
    }, 500);
  };

  useEffect(() => {
    if (phase === 'done') {
      onDone?.();
      return;
    }
    const tear = window.setTimeout(() => {
      if (finished.current) return;
      setPhase('tear');
      haptic(18);
    }, 2000);
    const end = window.setTimeout(finish, 2700);

    // Le prix grimpe de 0 à 200 entre 0,8 s et 1,5 s
    let raf = 0;
    const start = performance.now() + 800;
    const tick = (now: number) => {
      const p = Math.min(Math.max((now - start) / 700, 0), 1);
      setPrice(Math.round(200 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(tear);
      window.clearTimeout(end);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`ti-root ${phase === 'tear' || phase === 'exit' ? 'ti-tear' : ''} ${phase === 'exit' ? 'ti-out' : ''}`}
      onClick={finish}
      role="status"
      aria-label="Chargement de Programas"
    >
      <style>{CSS}</style>
      <div className="ti-ticket">
        <div className="ti-main">
          <div className="ti-brand">
            <span className="ti-mark" />
            Programas
          </div>
          <div className="ti-label">Ticket repas</div>
          <div className="ti-price">
            <span>{price}</span>
            <small>FCFA</small>
          </div>
          <div className="ti-where">CROU Korhogo · Restaurant universitaire</div>
          <i className="ti-perf" />
        </div>
        <div className="ti-stub">
          <div className="ti-bars" aria-hidden="true">
            {BARS.map((w, i) => (
              <i key={i} style={{ width: w * 2, animationDelay: `${0.9 + i * 0.018}s` }} />
            ))}
          </div>
          <div className="ti-num">Valable pour un repas</div>
        </div>
      </div>
    </div>
  );
};
