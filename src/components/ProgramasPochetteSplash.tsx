import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const ProgramasPochetteSplash: React.FC<Props> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [stepText, setStepText] = useState<string>("Initialisation de la passerelle CROU-K...");
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(35);
      setStepText("Connexion au Restaurant Universitaire UPGC...");
    }, 500);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStepText("Sécurisation de la billetterie & tickets 200 FCFA...");
    }, 1200);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStepText("Bienvenue sur Programas • Prêt !");
      setIsReady(true);
    }, 2000);

    const autoEnter = setTimeout(() => {
      handleEnter();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(autoEnter);
    };
  }, []);

  const handleEnter = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#07070a] text-white flex flex-col items-center justify-between p-6 select-none overflow-hidden transition-all duration-500 ease-out font-sans ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-orange-600/25 via-amber-500/20 to-rose-600/20 rounded-full blur-[130px] animate-pulse"></div>
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/15 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Header / Skip Button */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between pt-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-amber-300 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          <span>UPGC KORHOGO • RESTO U</span>
        </div>

        <button
          type="button"
          onClick={handleEnter}
          className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          Passer &gt;
        </button>
      </div>

      {/* Center 3D Holographic Animated Pochette */}
      <div className="relative z-10 my-auto flex flex-col items-center max-w-sm w-full">
        
        {/* The Pochette Card */}
        <div 
          onClick={handleEnter}
          className="group relative w-72 sm:w-80 aspect-[3/4] rounded-3xl p-6 bg-gradient-to-b from-[#16161f] via-[#101017] to-[#0a0a0f] border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20 flex flex-col justify-between overflow-hidden cursor-pointer transform hover:scale-102 transition-all duration-300"
          style={{
            boxShadow: '0 25px 50px -12px rgba(234, 88, 12, 0.25), 0 0 40px rgba(245, 158, 11, 0.15)'
          }}
        >
          {/* Shimmer Light Sweeping Across the Pochette */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none"></div>

          {/* Top Brand Banner of the Pochette */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-orange-600 flex items-center justify-center text-xs font-black text-white shadow-md">
                P
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block leading-tight">
                  CROU KORHOGO
                </span>
                <span className="text-[9px] text-slate-400 block leading-none">
                  UPGC • 2026
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              Officiel
            </span>
          </div>

          {/* Center Emblem of Programas */}
          <div className="my-auto text-center space-y-3 py-2">
            <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-600 p-0.5 shadow-xl shadow-orange-500/40">
              <div className="w-full h-full rounded-[22px] bg-[#0c0d12] flex items-center justify-center p-3">
                <img 
                  src="/icon.svg" 
                  alt="Programas" 
                  className="w-full h-full object-contain drop-shadow-md animate-pulse"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-cabinet tracking-wider drop-shadow-md">
                PROGRAMAS
              </h1>
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
                BILLETTERIE DU RÉFECTOIRE
              </p>
              <p className="text-[10px] text-slate-400">
                Passe Restauration Universitaire
              </p>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1.5 text-amber-400 font-black">
              <Ticket className="w-3.5 h-3.5" />
              <span>200 FCFA / Ticket</span>
            </div>

            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Paiement Jeko</span>
            </div>
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="mt-6 text-center space-y-2 w-full">
          <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            <span>{stepText}</span>
          </div>

          {/* Fluid Progress Bar */}
          <div className="w-64 mx-auto h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/15">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Bottom Entrance Action Button */}
      <div className="relative z-10 w-full max-w-sm pb-2">
        <button
          type="button"
          onClick={handleEnter}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 hover:from-orange-500 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-center space-x-2 transform active:scale-98 transition-all cursor-pointer group"
        >
          <span>Accéder à Programas</span>
          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
};
