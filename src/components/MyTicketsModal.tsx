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
import { lockAppNow } from './PinLock';
import { TicketTransferModal } from './TicketTransferModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSelectTicket: (ticket: MealTicket) => void;
  onTransferSuccess?: (updatedUser: UserProfile, transferredTicket: MealTicket, recipientMatricule: string) => void;
}

export const MyTicketsModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSelectTicket,
  onTransferSuccess 
}) => {
  const [filter, setFilter] = useState<'all' | 'valid' | 'used'>('valid');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [ticketToTransfer, setTicketToTransfer] = useState<MealTicket | null>(null);

  if (!isOpen) return null;

  const tickets = user.savedTickets || [];
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
                  setTicketToTransfer(validTickets[0]);
                  setIsTransferModalOpen(true);
                }}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="Offrir un ticket repas à un proche"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Offrir</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
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
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
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
            filteredTickets.map((t) => (
              <div
                key={t.id || t.ticketNumber}
                onClick={() => onSelectTicket(t)}
                className="p-3.5 bg-slate-50 hover:bg-orange-50/40 border border-slate-200 hover:border-orange-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group relative"
              >
                {/* Official Ticket Thumbnail */}
                <div className="w-13 h-10 rounded-xl overflow-hidden border border-slate-200 group-hover:border-orange-400 flex-shrink-0 bg-slate-900 shadow-xs relative">
                  <img
                    src="/assets/aistudio/IMG_1038_80198fc0.jpeg"
                    alt="Ticket CROU"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>

                {/* Ticket Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {t.dishName}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      t.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {t.status === 'valid' ? 'Valide' : 'Utilisé'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {t.canteenName} • {t.mealType === 'dejeuner' ? 'Midi (11h30-14h30)' : 'Soir (18h30-21h00)'}
                  </div>

                  {t.transferredFrom && (
                    <div className="mt-1">
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-bold text-amber-800 truncate max-w-full">
                        <span>🎁 Reçu de : {t.transferredFrom}</span>
                      </span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {t.ticketNumber} • {t.price} FCFA
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {t.status === 'valid' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTicketToTransfer(t);
                        setIsTransferModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 hover:text-orange-800 border border-slate-200 hover:border-orange-300 rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 shadow-xs active:scale-95 cursor-pointer"
                      title="Offrir ce ticket à un proche"
                    >
                      <Send className="w-3 h-3 text-orange-600" />
                      <span>Offrir</span>
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
            ))
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

      {/* Ticket Transfer Modal */}
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
    </div>
  );
};
