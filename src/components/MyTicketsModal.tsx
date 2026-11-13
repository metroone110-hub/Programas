import React, { useState } from 'react';
import { X, QrCode, Ticket, CheckCircle2, Clock, Send, Lock, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { MealTicket, UserProfile } from '../types';
import { deduplicateTickets } from '../services/studentAuth';
import { lockAppNow } from './PinLock';
import { TicketTransferModal } from './TicketTransferModal';
import { triggerHaptic } from '../utils/haptics';

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

  const tickets = deduplicateTickets(user.savedTickets || []);
  const validTickets = tickets.filter(t => t.status === 'valid');
  const usedTickets = tickets.filter(t => t.status === 'used');

  const filteredTickets = tickets.filter(t => {
    if (filter === 'valid') return t.status === 'valid';
    if (filter === 'used') return t.status === 'used';
    return true;
  });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
              className="relative z-10 w-full sm:max-w-lg bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-t-[30px] sm:rounded-[30px] shadow-2xl border-t sm:border border-[var(--ios-border)] overflow-hidden flex flex-col max-h-[90dvh]"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
            >
              {/* Drag Handle */}
              <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
                <div className="w-10 h-1.5 rounded-full bg-[var(--ios-fg-tertiary)] opacity-45" />
              </div>

              {/* Header */}
              <div className="px-5 py-4 border-b border-[var(--ios-border)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[14px] bg-[#ea580c] text-white flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[18px] truncate">Mes tickets</h3>
                    <p className="text-[13px] text-[var(--ios-fg-secondary)]">
                      {validTickets.length} valide{validTickets.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {validTickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        if (onOpenTransfer) {
                          onClose();
                          onOpenTransfer(validTickets[0]);
                        } else {
                          setTicketToTransfer(validTickets[0]);
                          setIsTransferModalOpen(true);
                        }
                      }}
                      className="ios-btn-spring min-h-[40px] px-3.5 rounded-full bg-[#ea580c] text-white text-[13px] font-bold inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Offrir</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer mes tickets"
                    className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-bg)] border border-[var(--ios-border)] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-5 pt-3 pb-2">
                <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--ios-bg)] rounded-[16px] border border-[var(--ios-border)]">
                  <button
                    type="button"
                    onClick={() => setFilter('valid')}
                    className={`ios-btn-spring min-h-[38px] rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-1 ${
                      filter === 'valid' ? 'bg-[#ea580c] text-white' : 'text-[var(--ios-fg-secondary)]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valides ({validTickets.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('used')}
                    className={`ios-btn-spring min-h-[38px] rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-1 ${
                      filter === 'used' ? 'bg-[#ea580c] text-white' : 'text-[var(--ios-fg-secondary)]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Historique ({usedTickets.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`ios-btn-spring min-h-[38px] rounded-[12px] text-[13px] font-bold ${
                      filter === 'all' ? 'bg-[#ea580c] text-white' : 'text-[var(--ios-fg-secondary)]'
                    }`}
                  >
                    Tous ({tickets.length})
                  </button>
                </div>
              </div>

              {/* Tickets List */}
              <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
                {filteredTickets.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-14 h-14 rounded-[18px] bg-[var(--ios-bg)] text-[#ea580c] flex items-center justify-center mx-auto">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-[17px]">
                      {filter === 'valid' ? 'Aucun ticket valide' : 'Aucun ticket'}
                    </h4>
                    <p className="text-[14px] text-[var(--ios-fg-secondary)] max-w-xs mx-auto leading-snug">
                      Commandez vos tickets subventionnés à 200 FCFA depuis l'accueil.
                    </p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isValid = t.status === 'valid';
                    return (
                      <div
                        key={t.id || t.ticketNumber}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectTicket(t)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectTicket(t);
                          }
                        }}
                        className={`ios-btn-spring bg-white text-[#1d1d1f] rounded-[22px] border overflow-hidden cursor-pointer shadow-xs ${
                          isValid ? 'border-black/10' : 'border-2 border-red-500'
                        }`}
                      >
                        <div className="p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className={`text-[12px] font-bold ${isValid ? 'text-[#ea580c]' : 'text-red-600'}`}>
                              {t.mealType === 'dejeuner' ? 'Midi' : 'Soir'} · {t.date}
                            </span>
                            <h4 className="font-extrabold text-[16px] truncate">{t.dishName}</h4>
                            <span className="font-mono text-[12px] text-[#6e6e73]">N° {t.ticketNumber}</span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicket(t);
                              }}
                              className={`min-h-[42px] px-3.5 rounded-[14px] text-white text-[13px] font-bold flex items-center gap-1.5 ${
                                isValid ? 'bg-[#ea580c]' : 'bg-red-600'
                              }`}
                            >
                              <QrCode className="w-4 h-4" />
                              <span>QR</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[var(--ios-border)] flex items-center justify-between gap-3">
                <span className="text-[12px] text-[var(--ios-fg-secondary)]">
                  Touchez un ticket pour afficher le QR code.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    lockAppNow();
                  }}
                  className="ios-btn-spring min-h-[40px] px-3.5 rounded-[14px] bg-[var(--ios-bg)] border border-[var(--ios-border)] text-[13px] font-bold flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Verrouiller</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            onTransferSuccess?.(updatedUser, transferredTicket, recipientMatricule);
          }}
        />
      )}
    </>
  );
};
