import React from 'react';
import { X } from 'lucide-react';
import { MealTicket } from '../types';
import { TicketVisual } from './TicketVisual';

interface Props {
  ticket: MealTicket | null;
  onClose: () => void;
  onMarkAsUsed?: (ticketId: string) => void;
  onTransferTicket?: (ticket: MealTicket) => void;
}

export const TicketModal: React.FC<Props> = ({ ticket, onClose, onMarkAsUsed, onTransferTicket }) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Bouton Fermer TOUJOURS visible et accessible à l'écran */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-black text-white flex items-center space-x-1.5 border border-white/30 shadow-2xl transition-all active:scale-95 cursor-pointer backdrop-blur-md text-xs font-bold"
        aria-label="Fermer"
        title="Fermer le ticket"
      >
        <span>Fermer</span>
        <X className="w-5 h-5 text-white stroke-[2.5]" />
      </button>

      <div className="relative w-full max-w-md my-auto pt-10 sm:pt-4 pb-6">
        <TicketVisual
          ticket={ticket}
          onMarkAsUsed={onMarkAsUsed}
          onTransferTicket={onTransferTicket}
          showActions={true}
        />
      </div>
    </div>
  );
};
