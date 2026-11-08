import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Ticket, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MealTicket, UserProfile } from '../types';
import { 
  transferMealTicketToStudent, 
  lookupStudentByMatricule 
} from '../services/studentAuth';
import { soundSynthesizer } from '../utils/audioFeedback';

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

  const [selectedTicketId, setSelectedTicketId] = useState<string>(() => {
    if (initialTicket && initialTicket.status === 'valid') return initialTicket.id || initialTicket.ticketNumber;
    return validTickets.length > 0 ? (validTickets[0].id || validTickets[0].ticketNumber) : '';
  });

  const [recipientMatricule, setRecipientMatricule] = useState('');
  const [recipientPreview, setRecipientPreview] = useState<UserProfile | null>(null);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [transferNote, setTransferNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    ticket: MealTicket;
    recipientName: string;
    recipientMatricule: string;
  } | null>(null);

  useEffect(() => {
    if (initialTicket && initialTicket.status === 'valid') {
      setSelectedTicketId(initialTicket.id || initialTicket.ticketNumber);
    } else if (validTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(validTickets[0].id || validTickets[0].ticketNumber);
    }
  }, [initialTicket, validTickets]);

  // Live lookup of recipient when typing matricule
  useEffect(() => {
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
  }, [recipientMatricule]);

  if (!isOpen) return null;

  const currentSelectedTicket = validTickets.find(
    t => t.id === selectedTicketId || t.ticketNumber === selectedTicketId
  ) || validTickets[0];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (validTickets.length === 0 || !currentSelectedTicket) {
      setErrorMessage("Vous n'avez aucun ticket valide à transférer.");
      return;
    }

    const cleanMat = recipientMatricule.trim().toUpperCase();
    if (!cleanMat || cleanMat.length < 4) {
      setErrorMessage('Veuillez renseigner un numéro de matricule étudiant valide (au moins 4 caractères).');
      return;
    }

    const senderMat = (user.matricule || user.uid || '').trim().toUpperCase();
    if (cleanMat === senderMat) {
      setErrorMessage('Vous ne pouvez pas vous transférer un ticket à vous-même.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await transferMealTicketToStudent(
        user,
        currentSelectedTicket.id || currentSelectedTicket.ticketNumber,
        cleanMat,
        transferNote.trim()
      );

      if (!result.success || !result.updatedSender || !result.transferredTicket) {
        setErrorMessage(result.error || 'Erreur lors du transfert du ticket.');
        setIsSubmitting(false);
        return;
      }

      // Success feedback
      soundSynthesizer.playSuccessBeep();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setSuccessInfo({
        ticket: result.transferredTicket,
        recipientName: result.recipientName || `Étudiant (${cleanMat})`,
        recipientMatricule: cleanMat
      });

      onTransferSuccess(result.updatedSender, result.transferredTicket, cleanMat);
    } catch (err: any) {
      console.error('Ticket transfer exception:', err);
      setErrorMessage(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessInfo(null);
    setRecipientMatricule('');
    setTransferNote('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl text-white">
              <Send className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Transférer un ticket repas
              </h3>
              <p className="text-xs text-orange-100">
                Offrez un repas subventionné CROU à un camarade
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {successInfo ? (
            /* Success confirmation screen */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 font-cabinet">
                  Ticket transféré avec succès !
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Le ticket a été immédiatement crédité sur le compte de votre camarade avec son QR code officiel.
                </p>
              </div>

              {/* Transferred Ticket Recap Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Bénéficiaire :</span>
                  <span className="font-bold text-slate-900">
                    {successInfo.recipientName} ({successInfo.recipientMatricule})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Plat transféré :</span>
                  <span className="font-bold text-slate-900">{successInfo.ticket.dishName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Service :</span>
                  <span className="font-semibold text-orange-600">
                    {successInfo.ticket.mealType === 'dejeuner' ? 'Midi (Déjeuner)' : 'Soir (Dîner)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Numéro de série :</span>
                  <span className="font-mono font-bold text-slate-700">{successInfo.ticket.ticketNumber}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Ce ticket est désormais disponible dans « Mes tickets » de votre bénéficiaire.</span>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md"
              >
                Terminer
              </button>
            </div>
          ) : validTickets.length === 0 ? (
            /* Empty state: Sender has no tickets */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">
                  Aucun ticket disponible à transférer
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Pour pouvoir envoyer un ticket repas à un proche, vous devez posséder au moins un ticket repas valide non utilisé dans votre compte.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center space-x-1">
                  <span>💡 Comment faire ?</span>
                </p>
                <p>1. Achetez un ou plusieurs tickets repas à 200 FCFA depuis le menu du jour.</p>
                <p>2. Revenez ici pour offrir un ticket à votre camarade en renseignant son matricule.</p>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Compris, aller au menu du jour
              </button>
            </div>
          ) : (
            /* Normal transfer form */
            <form onSubmit={handleTransfer} className="space-y-4">
              
              {/* Select Ticket to Transfer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>1. Choisissez le ticket à offrir</span>
                  <span className="text-[11px] font-semibold text-orange-600">
                    {validTickets.length} ticket{validTickets.length > 1 ? 's' : ''} en votre possession
                  </span>
                </label>

                {validTickets.length === 1 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {validTickets[0].dishName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {validTickets[0].mealType === 'dejeuner' ? '☀️ Midi' : '🌙 Soir'} · {validTickets[0].ticketNumber}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600">200 FCFA</span>
                  </div>
                ) : (
                  <select
                    value={selectedTicketId}
                    onChange={(e) => setSelectedTicketId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {validTickets.map((t) => (
                      <option key={t.id || t.ticketNumber} value={t.id || t.ticketNumber}>
                        {t.dishName} ({t.mealType === 'dejeuner' ? 'Midi' : 'Soir'}) · N° {t.ticketNumber}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Recipient Matricule Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Numéro de matricule étudiant du bénéficiaire *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={recipientMatricule}
                    onChange={(e) => setRecipientMatricule(e.target.value.toUpperCase())}
                    placeholder="Ex: 32165498 ou UPGC-2026-XXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                  />
                  {isSearchingRecipient && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Recipient Preview feedback */}
                {recipientPreview ? (
                  <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-[11px] text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Étudiant identifié : <strong className="font-bold">{recipientPreview.displayName}</strong></span>
                  </div>
                ) : recipientMatricule.trim().length >= 4 && !isSearchingRecipient ? (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2 text-[11px] text-amber-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Nouveau bénéficiaire : le ticket sera assigné au matricule <strong>{recipientMatricule.trim().toUpperCase()}</strong> dès son ouverture.</span>
                  </div>
                ) : null}
              </div>

              {/* Optional friendly note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Message d'accompagnement (facultatif)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Ex: Bon appétit mon frère ! / Pour ton repas de midi"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Security info notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transfert sécurisé certifié CROU</span>
                </div>
                <p>
                  Ce ticket sera débité de vos tickets et recevra un nouveau QR code authentifié au nom du destinataire pour passage au tourniquet.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !recipientMatricule.trim()}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Transfert en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirmer le Transfert</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
