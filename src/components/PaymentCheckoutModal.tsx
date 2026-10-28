import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft,
  X, 
  Check,
  ChevronDown,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Phone,
  RefreshCw,
  Ticket
} from 'lucide-react';
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  totalAmount?: number;
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
  items,
  onSuccess
}) => {
  const isDirectTicketPurchase = Boolean(items && items.length > 0);
  const calculatedItemsTotal = items ? items.reduce((sum, item) => sum + (item.quantity * 200), 0) : (totalAmount || 200);
  const currentFinalAmount = totalAmount || calculatedItemsTotal || 200;

  // Selected payment method matching IMG_1194_0c2de57a.png
  const [selectedMethod, setSelectedMethod] = useState<MainPaymentMethod>('wave');
  const [selectedOperator, setSelectedOperator] = useState<MobileOperator>('orange');
  const [selectedCountry] = useState<string>("Cote d'Ivoire");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Flow State: 'form' -> 'awaiting_payment' -> 'success'
  const [flowState, setFlowState] = useState<'form' | 'awaiting_payment' | 'success'>('form');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Jeko Transaction Data
  const [activePaymentRequest, setActivePaymentRequest] = useState<{
    id: string;
    reference: string;
    redirectUrl?: string;
    method: string;
  } | null>(null);

  const [confirmedTickets, setConfirmedTickets] = useState<MealTicket[]>([]);
  const stopPollingRef = useRef<(() => void) | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (stopPollingRef.current) {
        stopPollingRef.current();
        stopPollingRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const getMethodDisplayName = () => {
    switch (selectedMethod) {
      case 'wave': return 'Wave';
      case 'mobile_money': return selectedOperator === 'orange' ? 'Orange Money' : selectedOperator === 'mtn' ? 'MTN MoMo' : 'Moov Money';
      case 'djamo': return 'Djamo';
      case 'carte': return 'Carte bancaire';
      default: return 'Wave';
    }
  };

  const getJekoApiMethod = (): string => {
    switch (selectedMethod) {
      case 'wave': return 'wave';
      case 'mobile_money': return selectedOperator; // 'orange' | 'mtn' | 'moov'
      case 'djamo': return 'djamo';
      case 'carte': return 'djamo'; // In CI, Djamo / Visa/Mastercard debit gateway
      default: return 'wave';
    }
  };

  // Called when Jeko payment is confirmed SUCCESS
  const handlePaymentConfirmed = async (reference: string) => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }

    try {
      const currentUser = getLocalUserProfile() || user;

      if (isDirectTicketPurchase && items && items.length > 0) {
        // Direct ticket purchase
        const res = await purchaseTicketsBatch(currentUser, items);
        await recordTicketsSaleInLedger(res.generatedTickets.length, 200);
        clearPendingPayment();
        setConfirmedTickets(res.generatedTickets);
        setFlowState('success');
        onSuccess(res.updatedUser, res.generatedTickets);
      } else {
        // Wallet recharge
        const newBalance = currentUser.balance + currentFinalAmount;
        const updated = await updateUserBalance(currentUser, newBalance);
        recordRecharge(currentFinalAmount);
        clearPendingPayment();
        setFlowState('success');
        onSuccess(updated);
      }

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }
    } catch (err: any) {
      console.error('Error completing purchase after payment:', err);
      setErrorMessage("Le paiement a été reçu mais une erreur est survenue lors de l'enregistrement de vos tickets. Contactez le CROU avec votre référence.");
    }
  };

  // User submits payment form
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!termsAccepted) {
      setErrorMessage("Veuillez accepter les conditions générales de vente pour continuer.");
      return;
    }

    if (currentFinalAmount < 200) {
      setErrorMessage("Le montant minimum est de 200 FCFA.");
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if ((selectedMethod === 'mobile_money' || selectedMethod === 'wave') && cleanPhone && cleanPhone.length !== 10) {
      setErrorMessage("Le numéro de téléphone ivoirien doit comporter exactement 10 chiffres (ex: 0700000000).");
      return;
    }

    setIsLoading(true);

    try {
      const jekoMethod = getJekoApiMethod();
      const customReference = `${Date.now()}`;

      // Initiate payment with real Jeko Partner API
      const result = await initiateJekoPayment({
        amount: currentFinalAmount,
        studentMatricule: user.matricule || user.uid,
        studentName: user.displayName || 'Étudiant UPGC',
        studentPhone: cleanPhone || undefined,
        paymentMethod: jekoMethod,
        customReference
      });

      if (!result.success || !result.redirectUrl) {
        throw new Error(result.message || "Erreur lors de l'initialisation du paiement Jeko.");
      }

      // Persist order in local storage in case the browser redirects
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

      // Start polling Jeko payment status
      if (result.transactionId) {
        stopPollingRef.current = pollPaymentStatus(result.transactionId, (status) => {
          if (status === 'success') {
            handlePaymentConfirmed(result.reference);
          } else if (status === 'failed') {
            setErrorMessage("La transaction a été refusée ou a échoué sur Jeko. Vous pouvez réessayer.");
          }
        }, 5000, 300000);
      }

      // Automatically open Jeko checkout page
      if (result.redirectUrl) {
        const popup = window.open(result.redirectUrl, '_blank');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup blocked, user can click the big button in the modal
        }
      }
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setErrorMessage(err.message || "Échec de connexion au service Jeko. Veuillez vérifier votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual status check button
  const handleManualCheck = async () => {
    if (!activePaymentRequest?.id) return;
    setIsCheckingStatus(true);
    setErrorMessage(null);
    try {
      const status = await checkPaymentStatus(activePaymentRequest.id);
      if (status === 'success') {
        await handlePaymentConfirmed(activePaymentRequest.reference);
      } else if (status === 'failed') {
        setErrorMessage("Le paiement n'a pas été validé ou a été annulé.");
      } else {
        setErrorMessage("Le paiement est toujours en attente sur Jeko. Si vous venez de valider, patientez quelques secondes et revérifiez.");
      }
    } catch (err: any) {
      setErrorMessage("Impossible de vérifier le statut pour le moment. Veuillez réessayer.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-8 animate-scaleUp">
        
        {/* TOP BAR matching IMG_1194_0c2de57a.png */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <button
            type="button"
            onClick={flowState === 'awaiting_payment' ? () => setFlowState('form') : handleResetAndClose}
            className="flex items-center space-x-1.5 text-slate-800 hover:text-slate-900 font-semibold text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-800" />
            <span>Retour</span>
          </button>

          {/* Centered Amount in Red Bold */}
          <div className="text-center">
            <span className="text-lg sm:text-xl font-extrabold text-[#e11d48] tracking-tight">
              {currentFinalAmount.toLocaleString('fr-FR')} F CFA
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STATE 1: SELECTION & FORM (Matching IMG_1194) */}
          {flowState === 'form' && (
            <form onSubmit={handleInitiatePayment} className="space-y-5">
              
              {/* Country Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pays
                </label>
                <div className="relative">
                  <div className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 flex items-center justify-between shadow-xs">
                    <span>{selectedCountry}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Payment Methods Grid matching IMG_1194 */}
              <div>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* 1. Wave Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('wave')}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedMethod === 'wave'
                        ? 'border-2 border-[#e11d48] bg-white ring-1 ring-[#e11d48]/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Official Wave Cyan Square Icon with Penguin */}
                    <div className="w-14 h-14 rounded-2xl bg-[#1dc4ff] flex flex-col items-center justify-center shadow-xs mb-2 relative overflow-hidden">
                      {/* Penguin silhouette */}
                      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
                        <ellipse cx="24" cy="23" rx="11" ry="14" fill="#0b1b3d" />
                        <ellipse cx="24" cy="25" rx="7" ry="10" fill="#ffffff" />
                        <ellipse cx="24" cy="27" rx="5" ry="7" fill="#fde047" />
                        <circle cx="21" cy="18" r="1.5" fill="#0b1b3d" />
                        <circle cx="27" cy="18" r="1.5" fill="#0b1b3d" />
                        <path d="M22 21 L26 21 L24 24 Z" fill="#f97316" />
                      </svg>
                      <span className="text-[9px] font-black tracking-tight text-white uppercase leading-none mt-0.5">
                        wave
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      Wave
                    </span>
                  </button>

                  {/* 2. Mobile Money Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('mobile_money')}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedMethod === 'mobile_money'
                        ? 'border-2 border-[#e11d48] bg-white ring-1 ring-[#e11d48]/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Dark icon with Orange / MTN / Moov badges */}
                    <div className="w-14 h-14 rounded-2xl bg-[#0e1726] flex flex-col items-center justify-center p-1.5 shadow-xs mb-2">
                      <div className="w-full flex items-center justify-center space-x-1 mb-1">
                        <span className="px-1 py-0.5 bg-[#ff7900] text-black font-black text-[7px] rounded-xs uppercase leading-none">
                          Orange
                        </span>
                      </div>
                      <div className="w-full flex items-center justify-center space-x-1">
                        <span className="px-1 py-0.5 bg-[#ffcc00] text-black font-black text-[7px] rounded-xs uppercase leading-none">
                          MTN
                        </span>
                        <span className="px-1 py-0.5 bg-[#0077c8] text-white font-black text-[7px] rounded-xs uppercase leading-none">
                          Moov
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      Mobile<br />Money
                    </span>
                  </button>

                  {/* 3. Djamo Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('djamo')}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedMethod === 'djamo'
                        ? 'border-2 border-[#e11d48] bg-white ring-1 ring-[#e11d48]/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Black rounded square with white script djamo */}
                    <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-xs mb-2">
                      <span className="text-white font-black text-sm italic tracking-tight font-serif">
                        djamo
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      Djamo
                    </span>
                  </button>

                </div>

                {/* Second row: Carte bancaire */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('carte')}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedMethod === 'carte'
                        ? 'border-2 border-[#e11d48] bg-white ring-1 ring-[#e11d48]/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Carte bancaire badge with CB, Mastercard, VISA */}
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-1 shadow-xs mb-2">
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="px-1 bg-emerald-600 text-white font-black text-[8px] rounded-xs">
                          CB
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Mastercard circles */}
                        <div className="flex -space-x-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#eb001b]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f79e1b] opacity-80"></span>
                        </div>
                        <span className="text-[8px] font-black text-[#1a1f71] italic tracking-tight">
                          VISA
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      Carte<br />bancaire
                    </span>
                  </button>
                </div>
              </div>

              {/* If Mobile Money is selected: choose operator + enter phone */}
              {selectedMethod === 'mobile_money' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">
                    Opérateur Mobile Money :
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOperator('orange')}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        selectedOperator === 'orange'
                          ? 'border-[#ff7900] bg-orange-50 text-[#ff7900] ring-1 ring-[#ff7900]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Orange
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOperator('mtn')}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        selectedOperator === 'mtn'
                          ? 'border-[#ffcc00] bg-yellow-50 text-yellow-950 ring-1 ring-[#ffcc00]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      MTN
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOperator('moov')}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        selectedOperator === 'moov'
                          ? 'border-[#0077c8] bg-blue-50 text-[#0077c8] ring-1 ring-[#0077c8]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Moov
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Numéro de téléphone {selectedOperator.toUpperCase()} (10 chiffres)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                        placeholder="Ex: 07 00 00 00 00"
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                      />
                    </div>
                    {selectedOperator === 'orange' && (
                      <p className="text-[10px] text-orange-700 bg-orange-50 border border-orange-200/70 rounded-lg p-2 mt-2 leading-relaxed">
                        💡 <strong>Orange Money CI :</strong> Vous devrez entrer le code d'autorisation <strong>#144*82#</strong> sur la page Jeko.
                      </p>
                    )}
                    {selectedOperator === 'mtn' && (
                      <p className="text-[10px] text-yellow-800 bg-yellow-50 border border-yellow-200/70 rounded-lg p-2 mt-2 leading-relaxed">
                        💡 <strong>MTN MoMo CI :</strong> Validez la notification sur votre mobile ou composez <strong>*133#</strong> (Approbations).
                      </p>
                    )}
                    {selectedOperator === 'moov' && (
                      <p className="text-[10px] text-blue-800 bg-blue-50 border border-blue-200/70 rounded-lg p-2 mt-2 leading-relaxed">
                        💡 <strong>Moov Money CI :</strong> Validez la notification sur votre écran ou composez <strong>*155#</strong>.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Order breakdown */}
              {isDirectTicketPurchase && items && (
                <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block">Détail des repas :</span>
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• {it.quantity}x {it.dishName}</span>
                      <span className="font-mono">{it.quantity * 200} F CFA</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Box matching IMG_1194 */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 text-xs sm:text-sm">
                <div className="px-4 py-3 flex items-center justify-between text-slate-600 bg-slate-50/50">
                  <span>Sous-total</span>
                  <span className="font-medium text-slate-800">
                    {currentFinalAmount.toLocaleString('fr-FR')} F CFA
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between font-extrabold text-slate-900 bg-white">
                  <span>Total</span>
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {currentFinalAmount.toLocaleString('fr-FR')} F CFA
                  </span>
                </div>
              </div>

              {/* Checkbox Terms matching IMG_1194 */}
              <div className="flex items-start space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="crou-terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-[#e11d48] focus:ring-[#e11d48] cursor-pointer"
                />
                <label htmlFor="crou-terms" className="text-xs text-slate-600 leading-snug cursor-pointer">
                  J'accepte les <span className="underline font-medium text-slate-800">conditions générales de vente</span> et la <span className="underline font-medium text-slate-800">politique de confidentialité</span>.
                </label>
              </div>

              {/* Big Red Pill CTA Button matching IMG_1194 */}
              <button
                type="submit"
                disabled={isLoading || !termsAccepted}
                className="w-full py-4 px-6 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-rose-600/25 flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connexion à Jeko en cours...</span>
                  </>
                ) : (
                  <span>Payer avec {getMethodDisplayName()} &gt;&gt;</span>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paiement crypté sécurisé • CROU Korhogo</span>
              </div>
            </form>
          )}

          {/* STATE 2: AWAITING PAYMENT ON JEKO (NO PREMATURE TICKETS) */}
          {flowState === 'awaiting_payment' && activePaymentRequest && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-[#e11d48]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Validation du paiement en cours
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1 leading-relaxed">
                  Veuillez finaliser votre règlement de <strong>{currentFinalAmount.toLocaleString('fr-FR')} F CFA</strong> sur la passerelle sécurisée Jeko.
                </p>
              </div>

              {/* Specific Operator Instructions for Côte d'Ivoire */}
              {selectedMethod === 'mobile_money' && selectedOperator === 'orange' && (
                <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-left space-y-1.5 text-xs text-orange-950">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span>📱</span>
                    <span>Instruction Orange Money Côte d'Ivoire :</span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-orange-900 space-y-1 leading-relaxed">
                    <li>Composez <strong>#144*82#</strong> sur votre mobile Orange pour générer votre <strong>code de paiement</strong> (valable 15 min).</li>
                    <li>Cliquez ci-dessous sur <strong>« Ouvrir la page Jeko »</strong> et entrez ce code d'autorisation.</li>
                    <li>Votre ticket repas CROU sera instantanément validé !</li>
                  </ol>
                </div>
              )}

              {selectedMethod === 'mobile_money' && selectedOperator === 'mtn' && (
                <div className="p-3.5 bg-yellow-50 border border-yellow-200 rounded-2xl text-left space-y-1.5 text-xs text-yellow-950">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span>📱</span>
                    <span>Instruction MTN Mobile Money :</span>
                  </div>
                  <p className="text-[11px] text-yellow-900 leading-relaxed">
                    Acceptez la notification push sur votre téléphone. Si elle n'apparaît pas, composez <strong>*133#</strong> puis entrez votre code PIN dans le menu « Approbations ».
                  </p>
                </div>
              )}

              {selectedMethod === 'mobile_money' && selectedOperator === 'moov' && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-left space-y-1.5 text-xs text-blue-950">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span>📱</span>
                    <span>Instruction Moov Money :</span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Validez la notification USSD sur votre écran ou composez <strong>*155#</strong> pour confirmer le débit.
                  </p>
                </div>
              )}

              {/* Jeko Direct Link Button */}
              {activePaymentRequest.redirectUrl && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Référence commande :</span>
                    <span className="font-mono font-bold text-slate-800">{activePaymentRequest.reference}</span>
                  </div>

                  <a
                    href={activePaymentRequest.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs uppercase tracking-wide rounded-full flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98"
                  >
                    <span>Ouvrir la page de paiement Jeko ({activePaymentRequest.method})</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <p className="text-[11px] text-slate-500 text-center">
                    La validation est automatique dès que vous validez sur votre téléphone.
                  </p>
                </div>
              )}

              {/* Status Verification Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isCheckingStatus}
                  className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-full flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                      <span>Vérification auprès de Jeko...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-slate-600" />
                      <span>J'ai déjà validé sur mon téléphone (Vérifier)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFlowState('form')}
                  className="text-xs text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                >
                  ← Choisir un autre moyen de paiement
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: PAYMENT CONFIRMED SUCCESS (TICKETS CREATED NOW) */}
          {flowState === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <Check className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900">
                  {confirmedTickets.length > 0 
                    ? `${confirmedTickets.length} Ticket(s) Validé(s) !` 
                    : 'Recharge Réussie !'}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {confirmedTickets.length > 0 ? (
                    <>
                      Votre paiement de <strong className="text-slate-900">{currentFinalAmount.toLocaleString('fr-FR')} FCFA</strong> a été vérifié et confirmé avec succès.
                      <br />
                      Vos tickets sont prêts dans votre espace <strong>« Mes Tickets »</strong>.
                    </>
                  ) : (
                    <>
                      Votre compte a été crédité de <strong className="text-slate-900">{currentFinalAmount.toLocaleString('fr-FR')} FCFA</strong>.
                    </>
                  )}
                </p>

                {activePaymentRequest && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl inline-block text-left text-xs font-mono">
                    <span className="text-slate-400 block text-[10px]">RÉFÉRENCE JEKO CONFIRMÉE :</span>
                    <span className="font-bold text-slate-800">{activePaymentRequest.reference}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide rounded-full transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Ticket className="w-4 h-4" />
                <span>Voir mes tickets & Retourner au menu</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};


