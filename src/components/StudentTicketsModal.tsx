import React, { useState } from 'react';
import { 
  X, 
  Ticket, 
  QrCode, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search, 
  ArrowRight,
  Filter,
  Send
} from 'lucide-react';
import { MealTicket, UserProfile } from '../types';
import { TicketVisual } from './TicketVisual';
import { TicketTransferModal } from './TicketTransferModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSelectTicket?: (ticket: MealTicket) => void;
  onMarkTicketUsed?: (ticketId: string) => void;
  onTransferSuccess?: (updatedUser: UserProfile, transferredTicket: MealTicket, recipientMatricule: string) => void;
}

export const StudentTicketsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onSelectTicket,
  onMarkTicketUsed,
  onTransferSuccess
}) => {
  const [filter, setFilter] = useState<'all' | 'valid' | 'used'>('valid');
  const [selectedTicket, setSelectedTicket] = useState<MealTicket | null>(null);
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-orange-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-600/30 border border-orange-500/30 rounded-2xl">
              <Ticket className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Mes tickets de repas</h3>
              <p className="text-sm text-slate-300">
                {validTickets.length} ticket{validTickets.length > 1 ? 's' : ''} disponible{validTickets.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setFilter('valid'); setSelectedTicket(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                filter === 'valid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Valides ({validTickets.length})</span>
            </button>

            <button
              onClick={() => { setFilter('used'); setSelectedTicket(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                filter === 'used'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Historique ({usedTickets.length})</span>
            </button>

            <button
              onClick={() => { setFilter('all'); setSelectedTicket(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({tickets.length})
            </button>
          </div>

          {validTickets.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTicketToTransfer(validTickets[0]);
                setIsTransferModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer ml-auto"
              title="Offrir un ticket à un camarade"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Offrir un ticket</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {selectedTicket ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-xs font-bold text-orange-600 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>← Retour à la liste de tickets</span>
              </button>

              <TicketVisual 
                ticket={selectedTicket} 
                onMarkAsUsed={onMarkTicketUsed} 
                onTransferTicket={(t) => {
                  setTicketToTransfer(t);
                  setIsTransferModalOpen(true);
                }}
              />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                {filter === 'valid' ? 'Aucun ticket valide en attente' : 'Aucun ticket dans cette catégorie'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Commandez votre repas subventionné à 200 FCFA depuis le menu pour obtenir votre ticket et votre QR code.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group text-left ${
                    t.status === 'valid'
                      ? 'border-orange-200 hover:border-orange-400 bg-white hover:shadow-md'
                      : 'border-slate-200 bg-slate-50 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {t.mealType === 'dejeuner' ? '☀️ Déjeuner' : '🌙 Dîner'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === 'valid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {t.status === 'valid' ? 'Prêt à scanner' : 'Utilisé'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 my-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-orange-600 transition-colors truncate">
                        {t.dishName || 'Ticket Repas CROU Korhogo'}
                      </h5>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t.canteenName || 'Restaurant Universitaire UPGC'}
                      </p>
                      {t.transferredFrom && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 mt-1 inline-block truncate max-w-full">
                          🎁 Reçu de : {t.transferredFrom}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-500">{t.ticketNumber}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-orange-600">{t.price} FCFA</span>
                      {t.status === 'valid' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketToTransfer(t);
                            setIsTransferModalOpen(true);
                          }}
                          className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Offrir ce ticket à un proche"
                        >
                          <Send className="w-3 h-3" />
                          <span>Offrir</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Présentez le QR code au tourniquet de la cantine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fermer
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
          setSelectedTicket(null);
          if (onTransferSuccess) {
            onTransferSuccess(updatedUser, transferredTicket, recipientMatricule);
          }
        }}
      />
    </div>
  );
};
