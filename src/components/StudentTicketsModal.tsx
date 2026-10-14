import React from 'react';
import { X, Ticket, Lock, ShieldCheck } from 'lucide-react';

interface StudentTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketsUpdated?: () => void;
}

export const StudentTicketsModal: React.FC<StudentTicketsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div 
        className="bg-white text-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#FAF7F2] border-b border-black/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-amber-900 flex items-center justify-center font-black border border-amber-200 shadow-xs">
              <Ticket className="w-5 h-5 text-[#92400E]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-slate-950 leading-tight">
                  Tickets de Restauration
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#18181B] text-white">
                  CROU-K
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Resto U UPGC Korhogo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Les 2 Tableaux de Couleur Distincts */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* TABLEAU DE COULEUR 1 : TICKET REPAS UNITAIRE (AMBRE / ORANGE) */}
          <div className="rounded-[24px] border-2 border-amber-400 bg-amber-50/60 overflow-hidden shadow-xs transition-all hover:shadow-md">
            {/* Haut du tableau */}
            <div className="bg-[#FEF3C7] px-4 py-3 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍽️</span>
                <span className="font-extrabold text-sm text-amber-950">
                  Ticket Repas Unitaire
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase">
                1 Repas
              </span>
            </div>

            {/* Corps du tableau */}
            <div className="p-4 space-y-2 text-xs text-amber-950">
              <p className="font-medium text-slate-700">
                Donne droit à 1 repas complet au self (déjeuner ou dîner) au restaurant universitaire.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                <span>✓ Plateau repas complet avec boisson/fruit</span>
              </div>
            </div>

            {/* Bas du tableau : Prix bien en valeur & Paiement Wave */}
            <div className="bg-white p-3.5 border-t border-amber-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Tarif unitaire
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-950">200</span>
                  <span className="text-xs font-black text-amber-900">FCFA</span>
                </div>
                <span className="text-[11px] font-bold text-[#0066FF] flex items-center gap-1 mt-0.5">
                  🌊 Paiement via Wave
                </span>
              </div>

              <div className="text-right">
                <button
                  disabled
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-black cursor-not-allowed flex items-center gap-1.5 shadow-xs opacity-90"
                  title="Paiement temporairement indisponible"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bientôt disponible</span>
                </button>
              </div>
            </div>
          </div>

          {/* TABLEAU DE COULEUR 2 : SOUCHE DE 10 TICKETS (VERT ÉMERAUDE) */}
          <div className="rounded-[24px] border-2 border-emerald-500 bg-emerald-50/60 overflow-hidden shadow-xs transition-all hover:shadow-md">
            {/* Haut du tableau */}
            <div className="bg-[#DCFCE7] px-4 py-3 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <span className="font-extrabold text-sm text-emerald-950">
                  Souche de 10 Tickets
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase">
                Carnet Semaine
              </span>
            </div>

            {/* Corps du tableau */}
            <div className="p-4 space-y-2 text-xs text-emerald-950">
              <p className="font-medium text-slate-700">
                Carnet de 10 repas pour toute la semaine au campus de l'UPGC.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                <span>✓ 10 passages self non périssables durant le semestre</span>
              </div>
            </div>

            {/* Bas du tableau : Prix bien en valeur & Paiement Wave */}
            <div className="bg-white p-3.5 border-t border-emerald-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Tarif carnet (10 repas)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-950">2 000</span>
                  <span className="text-xs font-black text-emerald-800">FCFA</span>
                </div>
                <span className="text-[11px] font-bold text-[#0066FF] flex items-center gap-1 mt-0.5">
                  🌊 Paiement via Wave
                </span>
              </div>

              <div className="text-right">
                <button
                  disabled
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-black cursor-not-allowed flex items-center gap-1.5 shadow-xs opacity-90"
                  title="Paiement temporairement indisponible"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bientôt disponible</span>
                </button>
              </div>
            </div>
          </div>

          {/* Note discrète */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-[11px] text-slate-500 font-semibold">
              🔒 Le paiement des tickets s'effectuera directement via votre compte <strong>Wave</strong> dès l'ouverture du service en ligne.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#FAF7F2] border-t border-black/5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-semibold flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            CROU-K UPGC Korhogo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
