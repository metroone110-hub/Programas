import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Ticket,
  User,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MealTicket, UserProfile } from '../types';
import {
  transferMealTicketToStudent,
  lookupStudentByMatricule
} from '../services/studentAuth';
import { soundSynthesizer } from '../utils/audioFeedback';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialTicket?: MealTicket | null;
  onTransferSuccess: (updatedUser: UserProfile, transferredTicket: MealTicket, recipientMatricule: string) => void;
}

export const TicketTransferModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  initialTicket,
  onTransferSuccess
}) => {
  const validTickets = (user.savedTickets || []).filter(t => t.status === 'valid');

  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [recipientMatricule, setRecipientMatricule] = useState('');
  const [recipientPreview, setRecipientPreview] = useState<UserProfile | null>(null);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [transferNote, setTransferNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTransferringRef = useRef(false);
  const wasOpenRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    ticket: MealTicket;
    recipientName: string;
    recipientMatricule: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      isTransferringRef.current = false;
      setIsSubmitting(false);
      setErrorMessage(null);
      setSuccessInfo(null);
      setRecipientMatricule('');
      setRecipientPreview(null);
      setTransferNote('');

      if (initialTicket && initialTicket.status === 'valid') {
        setSelectedTicketId(initialTicket.id || initialTicket.ticketNumber);
      } else if (validTickets.length > 0) {
        setSelectedTicketId(validTickets[0].id || validTickets[0].ticketNumber);
      } else {
        setSelectedTicketId('');
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialTicket, validTickets]);

  useEffect(() => {
    if (!isOpen || successInfo) return;
    const clean = recipientMatricule.trim().toUpperCase();
    if (clean.length < 3) {
      setRecipientPreview(null);
      setIsSearchingRecipient(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRecipient(true);
      try {
        const found = await lookupStudentByMatricule(clean);
        setRecipientPreview(found);
      } catch {
        setRecipientPreview(null);
      } finally {
        setIsSearchingRecipient(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [recipientMatricule, isOpen, successInfo]);

  const currentSelectedTicket =
    validTickets.find(t => t.id === selectedTicketId || t.ticketNumber === selectedTicketId) ||
    validTickets[0];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isTransferringRef.current || isSubmitting || successInfo) {
      return;
    }

    if (validTickets.length === 0 || !currentSelectedTicket) {
      setErrorMessage("Vous n'avez aucun ticket valide à transférer.");
      return;
    }

    if (currentSelectedTicket.status !== 'valid') {
      setErrorMessage('Ce ticket a déjà été utilisé et ne peut plus être transféré.');
      return;
    }

    const cleanMat = recipientMatricule.trim().toUpperCase();
    if (!cleanMat || cleanMat.length < 4) {
      setErrorMessage('Veuillez saisir un matricule valide (au moins 4 caractères).');
      return;
    }

    const senderMat = (user.matricule || user.uid || '').trim().toUpperCase();
    if (cleanMat === senderMat) {
      setErrorMessage('Vous ne pouvez pas transférer un ticket à votre propre matricule.');
      return;
    }

    triggerHaptic('medium');
    isTransferringRef.current = true;
    setIsSubmitting(true);

    try {
      const ticketTargetId = currentSelectedTicket.ticketNumber || currentSelectedTicket.id;
      const result = await transferMealTicketToStudent(
        user,
        ticketTargetId,
        cleanMat,
        transferNote.trim()
      );

      if (!result.success || !result.updatedSender || !result.transferredTicket) {
        triggerHaptic('error');
        setErrorMessage(result.error || 'Erreur lors du transfert du ticket.');
        return;
      }

      soundSynthesizer.playSuccessBeep();
      triggerHaptic('success');
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 } });
      } catch {}

      setSelectedTicketId('');
      setSuccessInfo({
        ticket: result.transferredTicket,
        recipientName: result.recipientName || `Étudiant (${cleanMat})`,
        recipientMatricule: cleanMat
      });

      onTransferSuccess(result.updatedSender, result.transferredTicket, cleanMat);
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMessage(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      isTransferringRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessInfo(null);
    setRecipientMatricule('');
    setRecipientPreview(null);
    setTransferNote('');
    setErrorMessage(null);
    isTransferringRef.current = false;
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleResetAndClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
            className="relative z-10 w-full sm:max-w-lg bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-t-[30px] sm:rounded-[30px] shadow-2xl border-t sm:border border-[var(--ios-border)] overflow-hidden flex flex-col max-h-[92dvh]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-[var(--ios-fg-tertiary)] opacity-45" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--ios-border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[14px] bg-[#ea580c] text-white flex items-center justify-center flex-shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[18px] font-extrabold truncate">Offrir un ticket</h3>
                  <p className="text-[13px] text-[var(--ios-fg-secondary)] truncate">
                    Transfert par matricule étudiant
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                aria-label="Fermer la fenêtre de transfert"
                className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-bg)] border border-[var(--ios-border)] flex items-center justify-center flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {successInfo ? (
                <div className="text-center py-4 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[22px] font-extrabold">Ticket transféré</h4>
                    <p className="text-[15px] text-[var(--ios-fg-secondary)] leading-snug">
                      Crédité immédiatement sur le compte de <strong>{successInfo.recipientName}</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[20px] text-left space-y-2 text-[14px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--ios-fg-secondary)]">Bénéficiaire :</span>
                      <span className="font-bold tabular-nums">{successInfo.recipientMatricule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ios-fg-secondary)]">N° série :</span>
                      <span className="font-mono font-bold">{successInfo.ticket.ticketNumber}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] text-white font-bold text-[17px] rounded-[20px]"
                  >
                    Terminer
                  </button>
                </div>
              ) : validTickets.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-[20px] bg-[var(--ios-bg)] text-[#ea580c] flex items-center justify-center mx-auto">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-[20px]">Aucun ticket disponible</h4>
                  <p className="text-[15px] text-[var(--ios-fg-secondary)] max-w-xs mx-auto leading-snug">
                    Achetez d'abord un ticket repas à 200 FCFA pour pouvoir l'offrir à un camarade.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] text-white font-bold text-[16px] rounded-[20px]"
                  >
                    Compris
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <label className="block text-[14px] font-bold mb-1.5">
                      Ticket à offrir ({validTickets.length} disponible{validTickets.length > 1 ? 's' : ''})
                    </label>
                    {validTickets.length === 1 ? (
                      <div className="p-3.5 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[15px] block">{validTickets[0].dishName}</span>
                          <span className="text-[13px] text-[var(--ios-fg-secondary)] font-mono">
                            N° {validTickets[0].ticketNumber}
                          </span>
                        </div>
                        <span className="font-extrabold text-[#ea580c]">200 F</span>
                      </div>
                    ) : (
                      <select
                        value={selectedTicketId}
                        onChange={(e) => setSelectedTicketId(e.target.value)}
                        className="w-full min-h-[52px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                      >
                        {validTickets.map((t) => (
                          <option key={t.id || t.ticketNumber} value={t.id || t.ticketNumber} className="text-[#1d1d1f] bg-white">
                            {t.dishName} · N° {t.ticketNumber}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold mb-1.5">
                      Matricule du bénéficiaire *
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-[var(--ios-fg-secondary)] absolute left-4 top-4" />
                      <input
                        type="text"
                        required
                        value={recipientMatricule}
                        onChange={(e) => setRecipientMatricule(e.target.value.toUpperCase())}
                        placeholder="Ex : 32165498"
                        className="w-full min-h-[54px] pl-11 pr-10 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                      />
                    </div>

                    {recipientPreview ? (
                      <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-[14px] flex items-center gap-2 text-[13px] text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Étudiant identifié : <strong>{recipientPreview.displayName}</strong></span>
                      </div>
                    ) : recipientMatricule.trim().length >= 4 && !isSearchingRecipient ? (
                      <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-[14px] flex items-center gap-2 text-[13px] text-amber-700 dark:text-amber-300">
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span>Sera attribué au matricule <strong>{recipientMatricule.trim().toUpperCase()}</strong>.</span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold mb-1.5">
                      Message (facultatif)
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      placeholder="Ex : Bon appétit !"
                      className="w-full min-h-[50px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[16px] text-[14px] text-red-600 dark:text-red-400 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[13px] text-[var(--ios-fg-secondary)]">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Nouveau QR code généré automatiquement pour le destinataire.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !recipientMatricule.trim()}
                    data-loading={isSubmitting ? 'true' : undefined}
                    className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[17px] rounded-[20px] shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    <span>{isSubmitting ? 'Transfert...' : 'Confirmer le transfert'}</span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
