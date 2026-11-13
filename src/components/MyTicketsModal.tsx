import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Lock, 
  Send,
  ShieldCheck
} from 'lucide-react';
import { MealTicket, UserProfile } from '../types';
import { deduplicateTickets } from '../services/studentAuth';
import { lockAppNow } from './PinLock';
import { TicketTransferModal } from './TicketTransferModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSelectTicket: (ticket: MealTicket) => void;
  onTransferSuccess?: (updatedUser: UserProfile, transferredTicket: MealTicket, recipientMatricule: string) => void;
  onOpenTransfer?: (ticket?: MealTicket) => void;
}

export const MyTicketsModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSelectTicket,
  onTransferSuccess,
  onOpenTransfer
}) => {
  const [filter, setFilter] = useState<'all' | 'valid' | 'used'>('valid');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [ticketToTransfer, setTicketToTransfer] = useState<MealTicket | null>(null);

  if (!isOpen) return null;

  const tickets = deduplicateTickets(user.savedTickets || []);
  const validTickets = tickets.filter(t => t.status === 'valid');
  const usedTickets = tickets.filter(t => t.status === 'used');

  const filteredTickets = tickets.filter(t => {
    if (filter === 'valid') return t.status === 'valid';
    if (filter === 'used') return t.status === 'used';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-orange-600 rounded-2xl shadow-sm">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight font-cabinet">
                Mes tickets de repas
              </h3>
              <p className="text-xs text-slate-300">
                {validTickets.length} ticket{validTickets.length > 1 ? 's' : ''} valide{validTickets.length > 1 ? 's' : ''} disponible{validTickets.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {validTickets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenTransfer) {
                    onClose();
                    onOpenTransfer(validTickets[0]);
                  } else {
                    setTicketToTransfer(validTickets[0]);
                    setIsTransferModalOpen(true);
                  }
                }}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="Offrir un ticket repas à un proche"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Offrir</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer flex-shrink-0"
              aria-label="Fermer"
              title="Fermer"
            >
              <X className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 pt-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilter('valid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                filter === 'valid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Valides ({validTickets.length})</span>
            </button>

            <button
              onClick={() => setFilter('used')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                filter === 'used'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Historique ({usedTickets.length})</span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              Tous ({tickets.length})
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            UPGC 2026
          </span>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <QrCode className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                {filter === 'valid' ? 'Aucun ticket valide disponible' : 'Aucun ticket dans cette catégorie'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Choisissez un plat au menu pour commander votre ticket subventionné à 200 FCFA avec QR code officiel.
              </p>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const dishName = t.dishName || 'Ticket Repas CROU Korhogo';
              const canteenName = t.canteenName || 'Restaurant Universitaire UPGC';
              const ticketNum = t.ticketNumber || t.id || 'CROUK-2026';
              const isValid = t.status === 'valid';
              const mealLabel = t.mealType === 'dejeuner' ? '☀️ Déjeuner (11h30 - 14h30)' : '🌙 Dîner (18h30 - 21h00)';

              return (
                <div
                  key={t.id || t.ticketNumber}
                  onClick={() => onSelectTicket(t)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md text-left overflow-hidden group relative ${
                    isValid
                      ? 'border-orange-200/90 hover:border-orange-400'
                      : 'border-2 border-red-300 bg-red-50/40 hover:border-red-400'
                  }`}
                >
                  {/* Gift Announcement Banner if transferred */}
                  {t.transferredFrom && (
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-b border-amber-300/40 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center space-x-1.5 font-bold text-amber-950 truncate">
                        <span className="text-sm flex-shrink-0">🎁</span>
                        <span className="truncate">Offert par : <strong className="font-extrabold text-orange-900">{t.transferredFrom}</strong></span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] tracking-wide flex-shrink-0">
                        REÇU
                      </span>
                    </div>
                  )}

                  {/* Card Content Body */}
                  <div className="p-4 space-y-3">
                    {/* Top Row: Service + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {mealLabel}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center space-x-1 ${
                        isValid
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-600 text-white shadow-xs'
                      }`}>
                        {isValid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Prêt au tourniquet</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            <span>UTILISÉ (ROUGE)</span>
                          </>
                        )}
                      </span>
                    </div>

                    {!isValid && (
                      <div className="px-3 py-1.5 bg-red-100 border border-red-300 rounded-xl flex items-center justify-between text-xs text-red-900 font-bold">
                        <span className="flex items-center space-x-1.5">
                          <span>❌</span>
                          <span>Ticket déjà consommé au restaurant U</span>
                        </span>
                        <span className="font-mono text-[11px] text-red-700">{t.usedTime || 'Scanné'}</span>
                      </div>
                    )}

                    {/* Middle Row: Ticket Icon + Dish Details */}
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Ticket className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-orange-600 transition-colors truncate">
                          {dishName}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5 truncate flex items-center space-x-1">
                          <span>{canteenName}</span>
                          {t.date && (
                            <>
                              <span>•</span>
                              <span>{t.date}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base sm:text-lg font-black text-orange-600 block leading-tight font-cabinet">
                          {t.price || 200} FCFA
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          Subvention CROU
                        </span>
                      </div>
                    </div>

                    {/* Perforation Dashed Line */}
                    <div className="relative py-1 flex items-center justify-between">
                      <div className="w-3 h-3 bg-slate-100 rounded-full -ml-5 border border-slate-200"></div>
                      <div className="flex-1 border-b border-dashed border-slate-200 mx-2"></div>
                      <div className="w-3 h-3 bg-slate-100 rounded-full -mr-5 border border-slate-200"></div>
                    </div>

                    {/* Bottom Row: Serial Number & Actions */}
                    <div className="pt-0.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span className="text-slate-400">N°</span>
                        <span className="font-bold">{ticketNum}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isValid && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenTransfer) {
                                onClose();
                                onOpenTransfer(t);
                              } else {
                                setTicketToTransfer(t);
                                setIsTransferModalOpen(true);
                              }
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                            title="Transférer ce ticket à un proche"
                          >
                            <Send className="w-3.5 h-3.5 text-amber-600" />
                            <span>Offrir</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(t);
                          }}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                          title="Afficher le grand QR code pour le tourniquet"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Code</span>
                          <ArrowRight className="w-3 h-3 text-orange-200" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px] text-slate-500 flex-1">
            Touchez un ticket pour afficher le grand QR code officiel pour passage au tourniquet.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              lockAppNow();
            }}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer active:scale-95"
            title="Verrouiller l'accès à mes tickets avec le code PIN"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Verrouiller 🔒</span>
          </button>
        </div>
      </div>

      {/* Ticket Transfer Modal (fallback si non délégué au parent) */}
      {!onOpenTransfer && (
        <TicketTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTicketToTransfer(null);
          }}
          user={user}
          initialTicket={ticketToTransfer}
          onTransferSuccess={(updatedUser, transferredTicket, recipientMatricule) => {
            setIsTransferModalOpen(false);
            setTicketToTransfer(null);
            if (onTransferSuccess) {
              onTransferSuccess(updatedUser, transferredTicket, recipientMatricule);
            }
          }}
        />
      )}
    </div>
  );
};
