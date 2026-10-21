import React from 'react';

interface TicketVisualProps {
  type: 'unitaire' | 'souche' | 'pack';
  title: string;
  price: number;
  service?: 'dejeuner' | 'diner' | 'tous';
  compact?: boolean;
}

export const TicketVisual: React.FC<TicketVisualProps> = ({
  type,
  title,
  price,
  service = 'tous',
  compact = false,
}) => {
  const isSouche = type === 'souche' || price >= 2000;
  
  // Theme colors based on service
  let bgGradient = 'from-amber-500 via-orange-500 to-amber-600';
  let badgeColor = 'bg-orange-600';
  let accentBorder = 'border-amber-300/40';
  let serviceIcon = '☀️ Déjeuner';

  if (service === 'diner' || title.toLowerCase().includes('dîner') || title.toLowerCase().includes('diner')) {
    bgGradient = 'from-indigo-600 via-blue-600 to-indigo-700';
    badgeColor = 'bg-indigo-700';
    accentBorder = 'border-indigo-300/40';
    serviceIcon = '🌙 Dîner';
  } else if (service === 'tous' || title.toLowerCase().includes('universel') || title.toLowerCase().includes('mixte')) {
    bgGradient = 'from-emerald-600 via-teal-600 to-emerald-700';
    badgeColor = 'bg-teal-700';
    accentBorder = 'border-emerald-300/40';
    serviceIcon = '✨ Midi ou Soir';
  } else if (price > 2000) {
    bgGradient = 'from-purple-600 via-violet-600 to-purple-800';
    badgeColor = 'bg-purple-800';
    accentBorder = 'border-purple-300/40';
    serviceIcon = '👑 Carnet Mensuel';
  }

  return (
    <div className={`relative w-full select-none overflow-hidden ${compact ? 'h-36 sm:h-40' : 'h-44 sm:h-52'} rounded-2xl flex flex-col justify-between p-3.5 text-white shadow-md transition-transform active:scale-[0.99]`}>
      {/* Background with subtle ticket texture */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />

      {/* Background watermark seal */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center pointer-events-none">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center text-[9px] font-black tracking-widest text-white/20 uppercase rotate-12 text-center p-1">
          CROU-KORHOGO
        </div>
      </div>

      {/* If Souche: Stacked background card effect on top right */}
      {isSouche && (
        <div className="absolute top-2 right-2 bg-white/25 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-white shadow-xs border border-white/30 flex items-center gap-1">
          <span>📚 SOUCHE 10 REPAS</span>
        </div>
      )}

      {/* Top Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* CI Flag mini pill */}
          <div className="flex items-center h-4 rounded-xs overflow-hidden shadow-xs border border-white/20">
            <span className="w-1.5 h-full bg-[#FF8200]" />
            <span className="w-1.5 h-full bg-[#FFFFFF]" />
            <span className="w-1.5 h-full bg-[#009E60]" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-wide uppercase text-white/90 drop-shadow-xs block leading-none">
              RÉPUBLIQUE DE CÔTE D'IVOIRE
            </span>
            <span className="text-[9px] text-white/75 font-semibold leading-none">
              CROU-K • Resto U UPGC
            </span>
          </div>
        </div>

        {!isSouche && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/30">
            {serviceIcon}
          </span>
        )}
      </div>

      {/* Center Price & Ticket Title */}
      <div className="relative z-10 my-auto text-center py-1">
        <div className="inline-block bg-black/20 backdrop-blur-xs px-3 py-1 rounded-xl border border-white/20 mb-1">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
            {price.toLocaleString('fr-FR')} <span className="text-xs font-bold text-amber-200">FCFA</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm font-extrabold text-white drop-shadow-xs line-clamp-1">
          {title}
        </p>
        <p className="text-[10px] text-white/80 font-medium">
          {isSouche ? '10 repas subventionnés • QR Code infalsifiable' : '1 repas complet subventionné • Valable immédiatement'}
        </p>
      </div>

      {/* Perforation notch circles on sides */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#F8F9FA]" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-[#F8F9FA]" />

      {/* Dashed perforation line */}
      <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-t border-dashed border-white/25 pointer-events-none" />

      {/* Bottom Bar: Barcode motif & security badge */}
      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/20">
        <div className="flex items-center gap-1 font-mono text-[9px] text-white/80 tracking-widest">
          {/* Mini Barcode vector */}
          <div className="flex items-center gap-[1.5px] h-3.5 opacity-80">
            <span className="w-[1.5px] h-full bg-white" />
            <span className="w-[3px] h-full bg-white" />
            <span className="w-[1px] h-full bg-white" />
            <span className="w-[2px] h-full bg-white" />
            <span className="w-[1px] h-full bg-white" />
            <span className="w-[2.5px] h-full bg-white" />
            <span className="w-[1px] h-full bg-white" />
            <span className="w-[3px] h-full bg-white" />
          </div>
          <span>TK-{isSouche ? 'SOUCHE-10' : 'UNIT-200'}</span>
        </div>

        <span className="text-[9px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Officiel
        </span>
      </div>
    </div>
  );
};
