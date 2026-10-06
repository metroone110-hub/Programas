import React, { useEffect, useState } from 'react';
import { Flame, Bell, Utensils, X, Clock, Zap, Volume2, ArrowRight } from 'lucide-react';
import { InAppAlert, playNotificationSound } from '../utils/notifications';

interface DuolingoMealPopupProps {
  alert: InAppAlert | null;
  onDismiss: () => void;
  onSnooze?: () => void;
  onViewMenu?: () => void;
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.09-1.11l-.29-.17-3.04.8 1.05-2.96-.19-.3a8.19 8.19 0 0 1-1.25-4.5c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.57.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.49-.41-.43-.57-.44l-.49-.01c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.48-.61 1.69-1.19.21-.59.21-1.09.15-1.19-.06-.1-.23-.17-.48-.29z"/>
  </svg>
);

export const DuolingoMealPopup: React.FC<DuolingoMealPopupProps> = ({
  alert,
  onDismiss,
  onSnooze,
  onViewMenu
}) => {
  const [snoozed, setSnoozed] = useState(false);

  useEffect(() => {
    if (alert) {
      // Play insistent chime sound when Duolingo modal appears
      playNotificationSound(true);
    }
  }, [alert]);

  if (!alert) return null;

  const handleSnooze = () => {
    setSnoozed(true);
    if (onSnooze) {
      onSnooze();
    } else {
      setTimeout(() => onDismiss(), 1000);
    }
  };

  const handleReplayChime = () => {
    playNotificationSound(true);
  };

  const shareDuolingoAlert = () => {
    const text = `🚨 *ALERTE DU CHEF CROU-K (PROGRAMAS)* 👨‍🍳\n\n« ${alert.title} »\n\n${alert.body}\n\n🎟️ Tarif : 200 FCFA au Resto U UPGC Korhogo !\n📲 Regarde le menu : ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#F5F0E8] rounded-[36px] max-w-sm sm:max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-[#F5B726] text-center space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {/* Animated Background Ring */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#F5B726]/25 blur-2xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-rose-500/15 blur-2xl pointer-events-none"></div>

        {/* Top actions: Replay chime + Close cross */}
        <div className="flex items-center justify-between relative z-10">
          <button
            onClick={handleReplayChime}
            className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center gap-1.5 text-xs font-black shadow-xs transition-colors"
            title="Rejouer le son d'alerte"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#F5B726]" />
            <span>Sonnerie</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center text-xs font-black shadow-xs transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Big Animated Mascot (Chef + Owl Vibe) */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="w-22 h-22 rounded-full bg-[#F5B726] shadow-xl flex items-center justify-center text-4xl animate-bounce border-4 border-white">
            👨‍🍳
          </div>
          <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center text-base font-black shadow-md border-2 border-white animate-pulse">
            🔔
          </span>
          <span className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-[#18181B] text-amber-300 flex items-center justify-center text-xs font-black shadow-md border-2 border-white">
            ⚡
          </span>
        </div>

        {/* Urgent Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#18181B] text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Rappel Incessant · Style Duolingo</span>
        </div>

        {/* Title & Body */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
            {alert.title}
          </h3>
          <div className="bg-white/70 p-3.5 rounded-2xl border border-black/5">
            <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed italic">
              « {alert.body} »
            </p>
          </div>
        </div>

        {/* Status Box */}
        <div className="bg-white p-3.5 rounded-[22px] border border-black/5 shadow-2xs flex items-center justify-around text-xs font-black text-slate-900">
          <div className="flex items-center gap-1.5 text-amber-900">
            <Clock className="w-4 h-4 text-[#F5B726]" />
            <span>Service en cours</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-emerald-800">
            <span className="text-sm">🎟️</span>
            <span>200 FCFA</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="text-slate-600 font-bold text-[11px]">
            Resto U UPGC
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              if (onViewMenu) onViewMenu();
              onDismiss();
            }}
            className="w-full py-3.5 rounded-full bg-[#F5B726] hover:bg-[#E5AA20] active:scale-95 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>🏃‍♂️ J'arrive en courant au réfectoire !</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSnooze}
              className="py-2.5 px-3 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-slate-800 text-[11px] font-black border border-black/10 transition-all flex items-center justify-center gap-1.5"
            >
              <span>😴 Rappelle-moi (5m)</span>
            </button>

            <button
              onClick={shareDuolingoAlert}
              className="py-2.5 px-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Alerter mes potes</span>
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-2 rounded-full bg-[#18181B] hover:bg-black active:scale-95 text-white text-xs font-black transition-all"
          >
            <span>🤤 Je prends mes 200 FCFA</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 font-medium italic">
          * Ne faites pas semblant de ne pas avoir vu cette notification : la faim n'attend pas !
        </p>

      </div>
    </div>
  );
};
