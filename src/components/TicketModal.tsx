import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { MealTicket } from '../types';
import { TicketVisual } from './TicketVisual';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  ticket: MealTicket | null;
  onClose: () => void;
  onMarkAsUsed?: (ticketId: string) => void;
  onTransferTicket?: (ticket: MealTicket) => void;
}

export const TicketModal: React.FC<Props> = ({
  ticket,
  onClose,
  onMarkAsUsed,
  onTransferTicket
}) => {
  return (
    <AnimatePresence>
      {ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Fermer le ticket"
            className="ios-btn-spring fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-[60] px-4 min-h-[44px] rounded-full bg-zinc-900/90 text-white flex items-center gap-1.5 border border-white/25 shadow-2xl text-[14px] font-bold"
          >
            <span>Fermer</span>
            <X className="w-4 h-4" />
          </button>

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-md my-auto pt-12 pb-6"
          >
            <TicketVisual
              ticket={ticket}
              onMarkAsUsed={onMarkAsUsed}
              onTransferTicket={onTransferTicket}
              showActions={true}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
