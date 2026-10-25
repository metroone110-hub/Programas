import React from 'react';
import { X } from 'lucide-react';
import { MealTicket } from '../types';
import { TicketVisual } from './TicketVisual';

interface Props {
  ticket: MealTicket | null;
  onClose: () => void;
  onMarkAsUsed?: (ticketId: string) => void;
}

export const TicketModal: React.FC<Props> = ({ ticket, onClose, onMarkAsUsed }) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md my-auto">
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 flex items-center space-x-1 text-xs font-bold px-3"
          aria-label="Fermer"
        >
          <span>Fermer</span>
          <X className="w-4 h-4" />
        </button>

        <TicketVisual
          ticket={ticket}
          onMarkAsUsed={onMarkAsUsed}
          showActions={true}
        />
      </div>
    </div>
  );
};
