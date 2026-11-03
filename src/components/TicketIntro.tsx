// src/components/TicketIntro.tsx
// Intro animée 3D en 60 ips d'une durée de 15 secondes pour Programas.
// Intègre le logo officiel de Programas, le tracé laser de perforation,
// le compteur de prix subventionné de 0 à 200 FCFA, le carillon iPhone "Cline! 🔔",
// et le détachement 3D du talon avant d'ouvrir l'application.
// Se joue uniquement à l'entrée de l'application (sessionStorage) et peut être passée d'un clic.

import React, { useEffect, useRef, useState } from 'react';
import { soundSynthesizer } from '../utils/audioFeedback';

const KEY = 'programas_intro_seen_15s';
const TOTAL_DURATION_MS = 15000; // 15 secondes exactement
const BARS = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 1];

const haptic = (ms: number) => {
  try {
    if (typeof (window as any).haptic === 'function') (window as any).haptic(ms);
    else if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  } catch {}
};

const CSS = `
.ti-root {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 40%, #16161d 0%, #060608 100%);
  cursor: pointer;
  perspective: 1200px;
  transform-style: preserve-3d;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  transition: opacity 0.6s ease, visibility 0.6s;
  -webkit-user-select: none;
  user-select: none;
  overflow: hidden;
}

.ti-root.ti-out {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Ambiance d'éclairage doux en arrière-plan */
.ti-ambient-glow {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(234, 88, 12, 0.22) 0%, rgba(245, 158, 11, 0.08) 45%, transparent 70%);
  filter: blur(50px);
  pointer-events: none;
  animation: ti-pulse-glow 5s ease-in-out infinite alternate;
}

@keyframes ti-pulse-glow {
  0% { transform: scale(0.9) translateY(0); opacity: 0.6; }
  100% { transform: scale(1.15) translateY(-20px); opacity: 0.9; }
}

/* Conteneur 3D du ticket - 60 ips ProMotion */
.ti-ticket-wrap {
  width: min(84vw, 326px);
  transform-style: preserve-3d;
  will-change: transform;
  animation: ti-float-3d 15s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes ti-float-3d {
  0% {
    opacity: 0;
    transform: translateY(120px) rotateX(24deg) rotateY(-18deg) scale(0.86);
  }
  15% {
    opacity: 1;
    transform: translateY(20px) rotateX(12deg) rotateY(-8deg) scale(0.96);
  }
  30% {
    transform: translateY(0) rotateX(0deg) rotateY(0deg) scale(1);
  }
  75% {
    transform: translateY(0) rotateX(-2deg) rotateY(2deg) scale(1.01);
  }
  92% {
    transform: translateY(0) rotateX(0deg) rotateY(0deg) scale(1);
  }
  100% {
    transform: translateY(-40px) scale(1.05);
    opacity: 0;
  }
}

/* Corps du ticket */
.ti-main, .ti-stub {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.ti-main {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 330px;
  padding: 24px 24px 26px;
  border-radius: 26px 26px 0 0;
  -webkit-mask: radial-gradient(circle 14px at 0 100%, #0000 96%, #000) left/51% 100% no-repeat,
               radial-gradient(circle 14px at 100% 100%, #0000 96%, #000) right/51% 100% no-repeat;
  mask: radial-gradient(circle 14px at 0 100%, #0000 96%, #000) left/51% 100% no-repeat,
        radial-gradient(circle 14px at 100% 100%, #0000 96%, #000) right/51% 100% no-repeat;
  transition: transform 0.8s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
}

/* Talon détachable */
.ti-stub {
  padding: 20px 24px 22px;
  border-radius: 0 0 26px 26px;
  transform-origin: 0 0;
  -webkit-mask: radial-gradient(circle 14px at 0 0, #0000 96%, #000) left/51% 100% no-repeat,
               radial-gradient(circle 14px at 100% 0, #0000 96%, #000) right/51% 100% no-repeat;
  mask: radial-gradient(circle 14px at 0 0, #0000 96%, #000) left/51% 100% no-repeat,
        radial-gradient(circle 14px at 100% 0, #0000 96%, #000) right/51% 100% no-repeat;
  transition: transform 1.1s cubic-bezier(0.5, 0, 0.9, 0.4), opacity 0.8s ease-in;
}

/* Phase de déchirure du talon */
.ti-tear .ti-stub {
  transform: translate(45px, 95px) rotate(14deg);
  opacity: 0;
}
.ti-tear .ti-main {
  transform: translateY(-12px) scale(1.02);
}

/* Header officiel avec Logo Programas */
.ti-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding-bottom: 12px;
}

.ti-logo-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ti-logo-img {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
  animation: ti-logo-shine 4s ease-in-out infinite;
}

@keyframes ti-logo-shine {
  0%, 100% { filter: drop-shadow(0 0 0 rgba(234, 88, 12, 0)); }
  50% { filter: drop-shadow(0 0 8px rgba(234, 88, 12, 0.6)); }
}

.ti-brand-title {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.ti-brand-sub {
  font-size: 11px;
  font-weight: 600;
  color: #ea580c;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Drapeau tricolore CI */
.ti-flag-pill {
  display: flex;
  height: 8px;
  width: 36px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.ti-flag-1 { flex: 1; background: #ff6a00; }
.ti-flag-2 { flex: 1; background: #ffffff; }
.ti-flag-3 { flex: 1; background: #16a34a; }

/* Section centrale avec Prix dynamique */
.ti-body {
  margin-top: auto;
  margin-bottom: auto;
  padding-top: 10px;
}

.ti-type-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.ti-price-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 78px;
  font-weight: 900;
  color: #0f172a;
  line-height: 0.95;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.ti-price-currency {
  font-size: 22px;
  font-weight: 700;
  color: #ea580c;
}

.ti-subvention-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(234, 88, 12, 0.08);
  color: #c2410c;
  font-size: 11.5px;
  font-weight: 700;
}

/* Ligne de perforation laser */
.ti-perf {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 0;
  height: 2px;
  transform-origin: left;
  background: repeating-linear-gradient(90deg, rgba(60, 60, 67, 0.35) 0 8px, transparent 8px 16px);
  animation: ti-draw 1.2s 2.5s cubic-bezier(0.32, 0.72, 0, 1) both;
}

/* Sceau holographique passant sur le ticket à t=11.5s */
.ti-holo-sweep {
  position: absolute;
  inset: -100%;
  background: linear-gradient(
    115deg,
    transparent 35%,
    rgba(255, 255, 255, 0.45) 45%,
    rgba(251, 191, 36, 0.45) 50%,
    rgba(234, 88, 12, 0.4) 55%,
    transparent 65%
  );
  transform: rotate(-15deg);
  animation: ti-holo 2.4s 10.8s ease-in-out both;
  pointer-events: none;
}

@keyframes ti-holo {
  0% { transform: translateY(-120%) rotate(-15deg); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateY(120%) rotate(-15deg); opacity: 0; }
}

/* Barres de code sur le talon */
.ti-bars {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 3px;
  height: 42px;
}
.ti-bars i {
  background: #0f172a;
  transform-origin: bottom;
  animation: ti-bar 0.6s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.ti-stub-footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

@keyframes ti-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes ti-bar {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

/* Barre de progression 15s en bas */
.ti-bottom-controls {
  position: absolute;
  bottom: max(env(safe-area-inset-bottom, 16px), 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(88vw, 360px);
}

.ti-progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  overflow: hidden;
}

.ti-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ea580c, #f59e0b);
  border-radius: 999px;
  box-shadow: 0 0 10px rgba(234, 88, 12, 0.8);
  transition: width 0.08s linear;
}

.ti-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}

.ti-skip-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: background 0.15s ease, transform 0.12s ease;
  cursor: pointer;
}
.ti-skip-btn:active {
  transform: scale(0.94);
  background: rgba(255, 255, 255, 0.22);
}
`;

type Phase = 'enter' | 'tear' | 'exit' | 'done';

interface Props {
  onDone?: () => void;
  /** Rejoue l'intro à chaque ouverture si true */
  always?: boolean;
}

export const TicketIntro: React.FC<Props> = ({ onDone, always = false }) => {
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      if (typeof window !== 'undefined') {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'done';
        if (!always && sessionStorage.getItem(KEY)) return 'done';
      }
    } catch {
      // Ignorer
    }
    return 'enter';
  });

  const [price, setPrice] = useState(0);
  const [progress, setProgress] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(15);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {}
    setPhase('exit');
    window.setTimeout(() => {
      setPhase('done');
      onDone?.();
    }, 550);
  };

  useEffect(() => {
    if (phase === 'done') {
      onDone?.();
      return;
    }

    const startTime = performance.now();
    let chimePlayed = false;
    let tearTriggered = false;

    // Timeline des événements sur 15 secondes (60 ips via requestAnimationFrame)
    let rafId = 0;
    const animate = (now: number) => {
      if (finishedRef.current) return;

      const elapsed = now - startTime;
      const progressRatio = Math.min(Math.max(elapsed / TOTAL_DURATION_MS, 0), 1);
      setProgress(progressRatio * 100);

      const remSec = Math.max(1, Math.ceil((TOTAL_DURATION_MS - elapsed) / 1000));
      setRemainingSeconds(remSec);

      // Compteur de prix : monte de 0 à 200 entre 3,5s et 8,5s avec courbe fluide
      if (elapsed >= 3500 && elapsed <= 8500) {
        const p = (elapsed - 3500) / 5000;
        // Décélération cubique douce
        const eased = 1 - Math.pow(1 - p, 3);
        setPrice(Math.round(200 * eased));
      } else if (elapsed > 8500) {
        setPrice(200);
      }

      // À 11,5 secondes : Le carillon de l'iPhone "Cline! 🔔" et vibration haptique
      if (elapsed >= 11500 && !chimePlayed) {
        chimePlayed = true;
        soundSynthesizer.playSuccessBeep();
        haptic(25);
      }

      // À 13,8 secondes : Le talon se détache
      if (elapsed >= 13800 && !tearTriggered) {
        tearTriggered = true;
        setPhase('tear');
        haptic(18);
      }

      // Fin des 15 secondes
      if (elapsed >= TOTAL_DURATION_MS) {
        finish();
        return;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
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

      {/* Halo lumineux d'ambiance 3D */}
      <div className="ti-ambient-glow" />

      {/* Ticket 3D cinématique 60 ips */}
      <div className="ti-ticket-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="ti-main">
          {/* Sceau holographique qui balaie à t=11.5s */}
          <div className="ti-holo-sweep" />

          {/* En-tête avec Logo Officiel Programas */}
          <div className="ti-header">
            <div className="ti-logo-box">
              <img
                src="/programas-logo.svg"
                alt="Logo Programas"
                className="ti-logo-img"
              />
              <div>
                <div className="ti-brand-title">Programas</div>
                <div className="ti-brand-sub">CROU Korhogo • Resto U</div>
              </div>
            </div>
            <div className="ti-flag-pill" title="République de Côte d'Ivoire">
              <div className="ti-flag-1" />
              <div className="ti-flag-2" />
              <div className="ti-flag-3" />
            </div>
          </div>

          {/* Corps avec compteur de prix 0 -> 200 FCFA */}
          <div className="ti-body">
            <span className="ti-type-tag">Ticket Repas Officiel</span>
            <div className="ti-price-display">
              <span>{price}</span>
              <span className="ti-price-currency">FCFA</span>
            </div>
            <div className="ti-subvention-badge">
              <span>✓</span>
              <span>Tarif Étudiant Subventionné • UPGC</span>
            </div>
          </div>

          <div className="text-[11.5px] text-slate-500 font-medium">
            Valable pour déjeuner ou dîner au réfectoire
          </div>

          {/* Ligne laser de perforation */}
          <i className="ti-perf" />
        </div>

        {/* Talon détachable */}
        <div className="ti-stub">
          <div className="ti-bars" aria-hidden="true">
            {BARS.map((w, i) => (
              <i key={i} style={{ width: w * 2.2, animationDelay: `${2.8 + i * 0.035}s` }} />
            ))}
          </div>
          <div className="ti-stub-footer">
            <span>UPGC • RESTO U</span>
            <span className="font-mono font-bold text-slate-700">CROUK-2026</span>
          </div>
        </div>
      </div>

      {/* Barre de contrôle et de progression 15s */}
      <div className="ti-bottom-controls" onClick={(e) => e.stopPropagation()}>
        <div className="ti-progress-track">
          <div className="ti-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ti-controls-row">
          <span>Préparation de votre pass repas · {remainingSeconds}s</span>
          <button
            type="button"
            onClick={finish}
            className="ti-skip-btn"
            title="Passer l'animation d'ouverture"
          >
            <span>Passer l'intro</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
