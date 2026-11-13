import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Phone,
  RefreshCw,
  Ticket
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { UserProfile, MealTicket } from '../types';
import { updateUserBalance, purchaseTicketsBatch, getLocalUserProfile } from '../services/studentAuth';
import { recordTicketsSaleInLedger } from '../services/dailyLedger';
import { recordRecharge } from '../utils/analytics';
import {
  initiateJekoPayment,
  pollPaymentStatus,
  checkPaymentStatus,
  savePendingPayment,
  clearPendingPayment
} from '../services/jekoPayment';
import { PaymentLogoBadge } from './PaymentLogoBadge';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  totalAmount?: number;
  initialPaymentMethod?: 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo';
  items?: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    mealType: 'dejeuner' | 'diner';
    canteenId: string;
    canteenName: string;
  }>;
  onSuccess: (updatedUser: UserProfile, newTickets?: MealTicket[]) => void;
}

type MainPaymentMethod = 'wave' | 'mobile_money' | 'djamo' | 'carte';
type MobileOperator = 'orange' | 'mtn' | 'moov';

export const PaymentCheckoutModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  totalAmount,
  initialPaymentMethod,
  items,
  onSuccess
}) => {
  const isDirectTicketPurchase = Boolean(items && items.length > 0);
  const totalTicketCount =
    items && items.length > 0
      ? items.reduce((sum, item) => sum + item.quantity, 0)
      : Math.max(1, Math.round((totalAmount || 200) / 200));
  const ticketBasePrice = totalTicketCount * 200;
  // Frais de transaction officiels : 1,5 % + 7 F (10 FCFA par ticket -> 210 FCFA / repas)
  const transactionFee = totalTicketCount * 10;
  const currentFinalAmount = ticketBasePrice + transactionFee;

  const [selectedMethod, setSelectedMethod] = useState<MainPaymentMethod>('wave');
  const [selectedOperator, setSelectedOperator] = useState<MobileOperator>('orange');
  const [selectedCountry] = useState<string>("Côte d'Ivoire");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const [flowState, setFlowState] = useState<'form' | 'processing' | 'awaiting_payment' | 'success'>('form');
  const [processingStep, setProcessingStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activePaymentRequest, setActivePaymentRequest] = useState<{
    id: string;
    reference: string;
    redirectUrl?: string;
    method: string;
  } | null>(null);

  const [confirmedTickets, setConfirmedTickets] = useState<MealTicket[]>([]);
  const stopPollingRef = useRef<(() => void) | null>(null);

  // Synchronize initial payment method chosen on Home screen
  useEffect(() => {
    if (!isOpen) return;
    if (initialPaymentMethod === 'wave') {
      setSelectedMethod('wave');
    } else if (initialPaymentMethod === 'djamo') {
      setSelectedMethod('djamo');
    } else if (initialPaymentMethod === 'orange' || initialPaymentMethod === 'mtn' || initialPaymentMethod === 'moov') {
      setSelectedMethod('mobile_money');
      setSelectedOperator(initialPaymentMethod);
    }
  }, [isOpen, initialPaymentMethod]);

  useEffect(() => {
    return () => {
      if (stopPollingRef.current) {
        stopPollingRef.current();
        stopPollingRef.current = null;
      }
    };
  }, []);

  const getMethodDisplayName = () => {
    switch (selectedMethod) {
      case 'wave':
        return 'Wave';
      case 'mobile_money':
        return selectedOperator === 'orange' ? 'Orange Money' : selectedOperator === 'mtn' ? 'MTN MoMo' : 'Moov Money';
      case 'djamo':
        return 'Djamo';
      case 'carte':
        return 'Carte bancaire';
      default:
        return 'Wave';
    }
  };

  const getJekoApiMethod = (): string => {
    switch (selectedMethod) {
      case 'wave':
        return 'wave';
      case 'mobile_money':
        return selectedOperator;
      case 'djamo':
        return 'djamo';
      case 'carte':
        return 'djamo';
      default:
        return 'wave';
    }
  };

  const handlePaymentConfirmed = async () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }

    try {
      const currentUser = getLocalUserProfile() || user;

      if (isDirectTicketPurchase && items && items.length > 0) {
        const res = await purchaseTicketsBatch(currentUser, items);
        await recordTicketsSaleInLedger(res.generatedTickets.length, 200);
        clearPendingPayment();
        setConfirmedTickets(res.generatedTickets);
        setFlowState('success');
        onSuccess(res.updatedUser, res.generatedTickets);
      } else {
        const newBalance = currentUser.balance + currentFinalAmount;
        const updated = await updateUserBalance(currentUser, newBalance);
        recordRecharge(currentFinalAmount);
        clearPendingPayment();
        setFlowState('success');
        onSuccess(updated);
      }

      triggerHaptic('success');
      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.65 }
        });
      } catch {
        // Ignore confetti failures
      }
    } catch (err: any) {
      console.error('Error completing purchase after payment:', err);
      setErrorMessage(
        "Le paiement a été reçu mais une erreur est survenue lors de l'enregistrement de vos tickets. Contactez le CROU avec votre référence."
      );
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!termsAccepted) {
      setErrorMessage('Veuillez accepter les conditions générales de vente pour continuer.');
      return;
    }

    if (currentFinalAmount < 200) {
      setErrorMessage('Le montant minimum est de 200 FCFA.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if ((selectedMethod === 'mobile_money' || selectedMethod === 'wave') && cleanPhone && cleanPhone.length !== 10) {
      setErrorMessage('Le numéro de téléphone ivoirien doit comporter exactement 10 chiffres (ex : 0700000000).');
      return;
    }

    triggerHaptic('medium');
    setIsLoading(true);
    setFlowState('processing');
    setProcessingStep(1);

    try {
      const jekoMethod = getJekoApiMethod();
      const customReference = `${Date.now()}`;

      const t1 = setTimeout(() => setProcessingStep(2), 650);
      const t2 = setTimeout(() => setProcessingStep(3), 1300);

      const [result] = await Promise.all([
        initiateJekoPayment({
          amount: currentFinalAmount,
          studentMatricule: user.matricule || user.uid,
          studentName: user.displayName || 'Étudiant UPGC',
          studentPhone: cleanPhone || undefined,
          paymentMethod: jekoMethod,
          customReference
        }),
        new Promise(resolve => setTimeout(resolve, 1800))
      ]);

      clearTimeout(t1);
      clearTimeout(t2);

      if (!result.success || !result.redirectUrl) {
        throw new Error(result.message || "Erreur lors de l'initialisation du paiement Jeko.");
      }

      savePendingPayment({
        reference: result.reference,
        orderId: customReference,
        amount: currentFinalAmount,
        items,
        paymentMethod: jekoMethod,
        timestamp: Date.now()
      });

      const activeReq = {
        id: result.transactionId || result.reference,
        reference: result.reference,
        redirectUrl: result.redirectUrl,
        method: getMethodDisplayName()
      };

      setActivePaymentRequest(activeReq);
      setFlowState('awaiting_payment');

      if (result.transactionId) {
        stopPollingRef.current = pollPaymentStatus(
          result.transactionId,
          (status) => {
            if (status === 'success') {
              handlePaymentConfirmed();
            } else if (status === 'failed') {
              setErrorMessage('La transaction a été refusée ou a échoué sur Jeko. Vous pouvez réessayer.');
            }
          },
          5000,
          300000
        );
      }

      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setFlowState('form');
      setErrorMessage(err.message || 'Échec de connexion au service Jeko. Veuillez vérifier votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!activePaymentRequest?.id) return;
    triggerHaptic('light');
    setIsCheckingStatus(true);
    setErrorMessage(null);
    try {
      const status = await checkPaymentStatus(activePaymentRequest.id);
      if (status === 'success') {
        await handlePaymentConfirmed();
      } else if (status === 'failed') {
        setErrorMessage("Le paiement n'a pas été validé ou a été annulé.");
      } else {
        setErrorMessage(
          'Le paiement est toujours en attente sur Jeko. Si vous venez de valider, patientez quelques secondes et revérifiez.'
        );
      }
    } catch {
      setErrorMessage('Impossible de vérifier le statut pour le moment. Veuillez réessayer.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleResetAndClose = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
    setFlowState('form');
    setActivePaymentRequest(null);
    setErrorMessage(null);
    onClose();
  };

  const processingBadgeBrand =
    selectedMethod === 'mobile_money'
      ? selectedOperator
      : selectedMethod;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleResetAndClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Bottom Sheet Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
            className="relative z-10 w-full sm:max-w-md bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-t-[30px] sm:rounded-[30px] shadow-2xl border-t sm:border border-[var(--ios-border)] flex flex-col max-h-[92dvh]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
          >
            {/* iOS Grab Handle (mobile) */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center flex-shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-[var(--ios-fg-tertiary)] opacity-45" />
            </div>

            {/* Sticky Top Bar */}
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-[var(--ios-border)] flex-shrink-0">
              <button
                type="button"
                onClick={flowState === 'awaiting_payment' ? () => setFlowState('form') : handleResetAndClose}
                className="ios-btn-spring inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-[14px] bg-[var(--ios-bg)] text-[var(--ios-fg)] font-semibold text-[14px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <span className="text-[18px] font-extrabold text-[#ea580c] tracking-tight tabular-nums">
                {currentFinalAmount.toLocaleString('fr-FR')} F CFA
              </span>

              <button
                type="button"
                onClick={handleResetAndClose}
                aria-label="Fermer la fenêtre de paiement"
                className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-bg)] text-[var(--ios-fg)] flex items-center justify-center border border-[var(--ios-border)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-[18px] flex items-start gap-2.5 text-[14px] text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STATE 1: SELECTION & FORM */}
              {flowState === 'form' && (
                <form onSubmit={handleInitiatePayment} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--ios-fg-secondary)] mb-1.5">
                      Pays
                    </label>
                    <div className="w-full px-4 py-3.5 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[16px] text-[16px] font-semibold text-[var(--ios-fg)] flex items-center justify-between">
                      <span>{selectedCountry}</span>
                      <ChevronDown className="w-4 h-4 text-[var(--ios-fg-secondary)]" />
                    </div>
                  </div>

                  {/* Payment Methods Grid with REAL LOGOS */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedMethod('wave');
                      }}
                      className={`ios-btn-spring p-3.5 rounded-[22px] border flex flex-col items-center justify-center gap-2 ${
                        selectedMethod === 'wave'
                          ? 'border-[#ea580c] bg-[#ea580c]/10 ring-1 ring-[#ea580c]'
                          : 'border-[var(--ios-border)] bg-[var(--ios-bg)]/60'
                      }`}
                    >
                      <PaymentLogoBadge brand="wave" size="lg" />
                      <span className="text-[14px] font-bold text-[var(--ios-fg)]">Wave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedMethod('mobile_money');
                      }}
                      className={`ios-btn-spring p-3.5 rounded-[22px] border flex flex-col items-center justify-center gap-2 ${
                        selectedMethod === 'mobile_money'
                          ? 'border-[#ea580c] bg-[#ea580c]/10 ring-1 ring-[#ea580c]'
                          : 'border-[var(--ios-border)] bg-[var(--ios-bg)]/60'
                      }`}
                    >
                      <div className="w-24 h-14 rounded-[14px] bg-white border border-black/10 overflow-hidden flex items-center justify-center p-1">
                        <img
                          src="/assets/aistudio/IMG_1715_483931a6.png"
                          alt="Orange, MTN et Moov Money"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[14px] font-bold text-[var(--ios-fg)]">Mobile Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedMethod('djamo');
                      }}
                      className={`ios-btn-spring p-3.5 rounded-[22px] border flex flex-col items-center justify-center gap-2 ${
                        selectedMethod === 'djamo'
                          ? 'border-[#ea580c] bg-[#ea580c]/10 ring-1 ring-[#ea580c]'
                          : 'border-[var(--ios-border)] bg-[var(--ios-bg)]/60'
                      }`}
                    >
                      <PaymentLogoBadge brand="djamo" size="lg" />
                      <span className="text-[14px] font-bold text-[var(--ios-fg)]">Djamo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedMethod('carte');
                      }}
                      className={`ios-btn-spring p-3.5 rounded-[22px] border flex flex-col items-center justify-center gap-2 ${
                        selectedMethod === 'carte'
                          ? 'border-[#ea580c] bg-[#ea580c]/10 ring-1 ring-[#ea580c]'
                          : 'border-[var(--ios-border)] bg-[var(--ios-bg)]/60'
                      }`}
                    >
                      <PaymentLogoBadge brand="carte" size="lg" />
                      <span className="text-[14px] font-bold text-[var(--ios-fg)]">Carte bancaire</span>
                    </button>
                  </div>

                  {/* Mobile Money Operator Sub-selector with REAL LOGOS */}
                  {selectedMethod === 'mobile_money' && (
                    <div className="p-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[22px] space-y-3">
                      <span className="text-[13px] font-bold text-[var(--ios-fg)] block">
                        Opérateur Mobile Money :
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { id: 'orange', label: 'Orange' },
                          { id: 'mtn', label: 'MTN' },
                          { id: 'moov', label: 'Moov' }
                        ] as const).map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setSelectedOperator(op.id);
                            }}
                            className={`ios-btn-spring py-2.5 px-2 rounded-[16px] border flex flex-col items-center gap-1.5 ${
                              selectedOperator === op.id
                                ? 'border-[#ea580c] bg-[#ea580c]/10 ring-1 ring-[#ea580c]'
                                : 'border-[var(--ios-border)] bg-[var(--ios-surface)]'
                            }`}
                          >
                            <PaymentLogoBadge brand={op.id} size="sm" />
                            <span className="text-[13px] font-bold text-[var(--ios-fg)]">{op.label}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[13px] font-medium text-[var(--ios-fg-secondary)] mb-1.5">
                          Numéro {selectedOperator.toUpperCase()} (10 chiffres, optionnel)
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[var(--ios-fg-secondary)] absolute left-3.5 top-4" />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                            placeholder="Ex : 07 00 00 00 00"
                            className="w-full pl-10 pr-4 py-3 bg-[var(--ios-surface)] border border-[var(--ios-border)] rounded-[14px] text-[16px] text-[var(--ios-fg)] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                          />
                        </div>
                        {selectedOperator === 'orange' && (
                          <p className="text-[13px] text-orange-700 dark:text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-[12px] p-2.5 mt-2 leading-snug">
                            Composez <strong>#144*82#</strong> sur votre téléphone Orange pour obtenir votre code d'autorisation.
                          </p>
                        )}
                        {selectedOperator === 'mtn' && (
                          <p className="text-[13px] text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-[12px] p-2.5 mt-2 leading-snug">
                            Validez la notification sur votre écran ou composez <strong>*133#</strong>.
                          </p>
                        )}
                        {selectedOperator === 'moov' && (
                          <p className="text-[13px] text-sky-800 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-[12px] p-2.5 mt-2 leading-snug">
                            Confirmez la notification USSD ou composez <strong>*155#</strong>.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Box */}
                  <div className="border border-[var(--ios-border)] rounded-[20px] overflow-hidden divide-y divide-[var(--ios-border)] bg-[var(--ios-bg)] text-[15px]">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[var(--ios-fg-secondary)]">
                        Tickets ({totalTicketCount} × 200 F)
                      </span>
                      <span className="font-bold tabular-nums">
                        {ticketBasePrice.toLocaleString('fr-FR')} F CFA
                      </span>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[var(--ios-fg-secondary)]">Frais (1,5 % + 7 F)</span>
                      <span className="font-semibold tabular-nums">
                        +{transactionFee.toLocaleString('fr-FR')} F CFA
                      </span>
                    </div>
                    <div className="px-4 py-3.5 flex items-center justify-between font-extrabold">
                      <div>
                        <span className="block">Total à payer</span>
                        <span className="text-[12px] font-normal text-[var(--ios-fg-secondary)]">
                          Soit 210 F CFA / repas
                        </span>
                      </div>
                      <span className="text-[20px] text-[#ea580c] tabular-nums">
                        {currentFinalAmount.toLocaleString('fr-FR')} F CFA
                      </span>
                    </div>
                  </div>

                  {/* Checkbox Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded-md accent-[#ea580c] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-[13px] text-[var(--ios-fg-secondary)] leading-snug">
                      J'accepte les conditions générales de vente et la politique de confidentialité.
                    </span>
                  </label>

                  {/* Primary 56px CTA */}
                  <button
                    type="submit"
                    disabled={isLoading || !termsAccepted}
                    data-loading={isLoading ? 'true' : undefined}
                    className="ios-btn-spring w-full min-h-[56px] px-6 bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[17px] rounded-[20px] shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Payer avec {getMethodDisplayName()}</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[13px] text-[var(--ios-fg-secondary)]">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Paiement sécurisé · CROU Korhogo</span>
                  </div>
                </form>
              )}

              {/* STATE 2: PROCESSING */}
              {flowState === 'processing' && (
                <div className="py-10 px-2 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '1.6s' }}>
                      <defs>
                        <linearGradient id="ios-pay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ea580c" />
                          <stop offset="100%" stopColor="#fb923c" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="50"
                        cy="50"
                        r="43"
                        stroke="url(#ios-pay-grad)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="175 80"
                      />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <PaymentLogoBadge brand={processingBadgeBrand} size="lg" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[20px] font-extrabold tracking-tight">
                      {processingStep === 1 && 'Initialisation sécurisée...'}
                      {processingStep === 2 && `Connexion à ${getMethodDisplayName()}...`}
                      {processingStep === 3 && 'Ouverture de la passerelle...'}
                    </h4>
                    <p className="text-[15px] text-[var(--ios-fg-secondary)] tabular-nums">
                      {currentFinalAmount.toLocaleString('fr-FR')} F CFA · Resto U Korhogo
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 3: AWAITING PAYMENT */}
              {flowState === 'awaiting_payment' && activePaymentRequest && (
                <div className="text-center py-4 space-y-5">
                  <div className="w-16 h-16 bg-[#ea580c]/12 rounded-full flex items-center justify-center mx-auto text-[#ea580c]">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[22px] font-extrabold">Validation en cours</h4>
                    <p className="text-[15px] text-[var(--ios-fg-secondary)] max-w-xs mx-auto leading-snug">
                      Finalisez votre règlement de <strong>{currentFinalAmount.toLocaleString('fr-FR')} F CFA</strong> sur Jeko.
                    </p>
                  </div>

                  {activePaymentRequest.redirectUrl && (
                    <div className="p-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[22px] space-y-3 text-left">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[var(--ios-fg-secondary)]">Référence :</span>
                        <span className="font-mono font-bold">{activePaymentRequest.reference}</span>
                      </div>

                      <a
                        href={activePaymentRequest.redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[16px] rounded-[18px] flex items-center justify-center gap-2 shadow-md"
                      >
                        <span>Ouvrir la page Jeko ({activePaymentRequest.method})</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={isCheckingStatus}
                    className="ios-btn-spring w-full min-h-[56px] bg-[var(--ios-bg)] border border-[var(--ios-border)] text-[var(--ios-fg)] font-bold text-[15px] rounded-[18px] flex items-center justify-center gap-2"
                  >
                    {isCheckingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>J'ai déjà validé sur mon téléphone</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STATE 4: PAYMENT SUCCESS WITH ANIMATED CHECKMARK */}
              {flowState === 'success' && (
                <div className="text-center py-6 space-y-5">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                    <svg className="w-11 h-11 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path className="check-draw" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[24px] font-extrabold tracking-tight">
                      {confirmedTickets.length > 0
                        ? `${confirmedTickets.length} ticket${confirmedTickets.length > 1 ? 's' : ''} validé${confirmedTickets.length > 1 ? 's' : ''} !`
                        : 'Recharge réussie !'}
                    </h4>
                    <p className="text-[16px] text-[var(--ios-fg-secondary)] leading-snug">
                      Paiement de <strong className="text-[var(--ios-fg)]">{currentFinalAmount.toLocaleString('fr-FR')} FCFA</strong> confirmé.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[17px] rounded-[20px] flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Ticket className="w-5 h-5" />
                    <span>Voir mes tickets</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
