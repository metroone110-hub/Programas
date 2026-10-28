import React, { useState, useEffect } from 'react';

interface Props {
  onComplete: () => void;
}

export const ProgramasPochetteSplash: React.FC<Props> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Smooth, rapid progress bar reaching 100% in ~1.4 seconds
    const startTime = Date.now();
    const duration = 1400; // 1.4s fast launch

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        // Quick exit once 100% reached
        setTimeout(() => {
          handleFinish();
        }, 150);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 350);
  };

  return (
    <div 
      onClick={handleFinish}
      className={`fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-between p-8 select-none transition-opacity duration-350 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top spacer */}
      <div className="w-full h-8"></div>

      {/* Center: Programas Logo bouncing with energetic spring animation */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Subtle orange glow behind logo */}
        <div className="absolute w-48 h-48 rounded-full bg-orange-600/25 blur-3xl pointer-events-none"></div>

        {/* Bouncing Logo Container */}
        <div className="relative animate-programas-bounce flex flex-col items-center">
          <img
            src="/icon.svg"
            alt="Programas Logo"
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-[32px] sm:rounded-[38px] shadow-[0_20px_50px_rgba(255,106,0,0.35)] ring-1 ring-white/10"
          />
        </div>
      </div>

      {/* Bottom: Slim downloading / loading progress line going to 100% */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-2 pb-6">
        <div className="w-full h-1 sm:h-1.5 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(249,115,22,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Percentage indicator */}
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold font-mono">
            Chargement
          </span>
          <span className="text-[11px] font-mono font-bold text-orange-400">
            {progress}%
          </span>
        </div>
      </div>

      {/* Embedded Keyframe Animation Style for the Bounce */}
      <style>{`
        @keyframes programasBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
            animation-timing-function: cubic-bezier(0.28, 0.84, 0.42, 1);
          }
          35% {
            transform: translateY(-22px) scale(1.06);
            animation-timing-function: cubic-bezier(0.77, 0, 0.175, 1);
          }
          65% {
            transform: translateY(3px) scale(0.96);
          }
        }
        .animate-programas-bounce {
          animation: programasBounce 1.1s infinite;
        }
      `}</style>
    </div>
  );
};
