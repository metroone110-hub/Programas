import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  X, 
  ChevronDown, 
  Check, 
  Smartphone, 
  CreditCard, 
  Lock, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { VirtualTicket } from '../types';
import { 
  validateIvorianPhoneNumber, 
  normalizeIvorianPhone 
} from '../utils/phoneValidator';

export type PaymentMethodType = 'wave' | 'mobile_money' | 'djamo' | 'carte';

interface TikeramaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  itemTitle?: string;
  ticketPack: 'unitaire' | 'souche';
  visitorId: string;
  onPaymentSuccess: (tickets: VirtualTicket[]) => void;
}

export const TikeramaPaymentModal: React.FC<TikeramaPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  itemTitle,
  ticketPack,
  visitorId,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('wave');
  const [country, setCountry] = useState<string>("Cote d'Ivoire");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(true);
  
  // Phone / details prompt step
  const [showInputStep, setShowInputStep] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>(() => {
    return localStorage.getItem('crouk_student_momo_phone') || '';
  });
  const [operator, setOperator] = useState<'orange' | 'mtn' | 'moov'>('orange');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsProcessing(false);
      setShowInputStep(false);
      setAcceptedTerms(true);
      const saved = localStorage.getItem('crouk_student_momo_phone');
      if (saved) setPhone(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedAmount = `${totalAmount.toLocaleString('fr-FR')} F CFA`;

  const getMethodName = () => {
    switch (selectedMethod) {
      case 'wave':
        return 'Wave';
      case 'mobile_money':
        return 'Mobile Money';
      case 'djamo':
        return 'Djamo';
      case 'carte':
        return 'Carte bancaire';
      default:
        return 'Wave';
    }
  };

  const handleCtaClick = () => {
    if (!acceptedTerms) {
      setErrorMessage('Veuillez accepter les conditions générales de vente pour continuer.');
      return;
    }
    setErrorMessage(null);
    setShowInputStep(true);
  };

  const handleConfirmPayment = async (forceSimulate = false) => {
    setErrorMessage(null);

    let cleanPhone = normalizeIvorianPhone(phone);
    if (!forceSimulate && (selectedMethod === 'wave' || selectedMethod === 'mobile_money' || selectedMethod === 'djamo')) {
      if (!cleanPhone || cleanPhone.length < 8) {
        setErrorMessage('Veuillez renseigner un numéro de téléphone ivoirien valide.');
        return;
      }
    }

    if (!cleanPhone) {
      cleanPhone = '0102030405';
    }

    try {
      setIsProcessing(true);
      localStorage.setItem('crouk_student_momo_phone', cleanPhone);

      // Determine backend payment method
      let backendMethod: 'MTN_MOMO' | 'MOOV_MONEY' | 'CINETPAY' | 'DEMO' = 'CINETPAY';
      if (selectedMethod === 'mobile_money') {
        backendMethod = operator === 'mtn' ? 'MTN_MOMO' : operator === 'moov' ? 'MOOV_MONEY' : 'CINETPAY';
      } else if (selectedMethod === 'wave' || selectedMethod === 'djamo') {
        backendMethod = 'CINETPAY';
      }

      const res = await fetch('/api/tickets/pay-momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          type: ticketPack,
          visitorId,
          paymentMethod: backendMethod,
          forceSimulation: forceSimulate || selectedMethod === 'carte',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.errorDetail || 'Erreur lors du paiement');
      }

      if (data.tickets && data.tickets.length > 0) {
        onPaymentSuccess(data.tickets);
        onClose();
      } else {
        // Fallback fetch if tickets not returned directly
        const ticketsRes = await fetch(`/api/tickets/my-tickets?visitorId=${encodeURIComponent(visitorId)}`);
        const ticketsData = await ticketsRes.json();
        onPaymentSuccess(ticketsData.tickets || []);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec du paiement. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom duration-200">
        
        {/* ============================================================== */}
        {/* TOP BAR (EXACT MATCH TO IMG_0878)                              */}
        {/* ← Retour                 2 000 F CFA                        ✕  */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
          <button
            onClick={() => {
              if (showInputStep) {
                setShowInputStep(false);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-slate-800 hover:text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <span className="text-[#FF0033] font-black text-lg sm:text-xl tracking-tight">
            {formattedAmount}
          </span>

          <button
            onClick={onClose}
            className="text-slate-800 hover:text-slate-950 p-1 rounded-full transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* BODY CONTENT                                                   */}
        {/* ============================================================== */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          
          {!showInputStep ? (
            <>
              {/* PAYS SELECTOR */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Pays
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 pr-10 cursor-pointer shadow-2xs"
                  >
                    <option value="Cote d'Ivoire">Cote d'Ivoire</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Mali">Mali</option>
                    <option value="Sénégal">Sénégal</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* PAYMENT METHOD CARDS (GRID OF 4 METHODS) */}
              <div className="grid grid-cols-3 gap-3">
                {/* 1. WAVE */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('wave')}
                  className={`flex flex-col items-center justify-center p-3 rounded-[22px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'wave'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#1DC4E9] flex flex-col items-center justify-center shadow-xs mb-2">
                    {/* Wave Penguin SVG vector */}
                    <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none">
                      <ellipse cx="32" cy="34" rx="16" ry="22" fill="#0E1E25" />
                      <ellipse cx="32" cy="37" rx="10" ry="15" fill="#FFFFFF" />
                      <circle cx="28" cy="24" r="2" fill="#FFFFFF" />
                      <circle cx="36" cy="24" r="2" fill="#FFFFFF" />
                      <polygon points="32,26 28,31 36,31" fill="#FFB703" />
                      <polygon points="26,55 31,51 28,49" fill="#FFB703" />
                      <polygon points="38,55 33,51 36,49" fill="#FFB703" />
                    </svg>
                    <span className="text-[10px] font-black text-white tracking-wider lowercase -mt-1 leading-none">
                      wave
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Wave
                  </span>
                </button>

                {/* 2. MOBILE MONEY (Orange, MTN, Moov) */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('mobile_money')}
                  className={`flex flex-col items-center justify-center p-3 rounded-[22px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'mobile_money'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#1E2229] p-1.5 grid grid-cols-2 gap-1 items-center justify-center shadow-xs mb-2 overflow-hidden">
                    {/* Orange Money */}
                    <div className="w-full h-full bg-[#FF7900] rounded-xs flex items-center justify-center">
                      <span className="text-[6px] font-black text-white leading-none">OM</span>
                    </div>
                    {/* MTN MoMo */}
                    <div className="w-full h-full bg-[#FFCC00] rounded-xs flex items-center justify-center">
                      <span className="text-[6px] font-black text-slate-950 leading-none">MTN</span>
                    </div>
                    {/* Moov Africa */}
                    <div className="col-span-2 w-full h-full bg-[#005CA9] rounded-xs flex items-center justify-center">
                      <span className="text-[6px] font-black text-white leading-none">Moov</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 text-center leading-tight">
                    Mobile<br />Money
                  </span>
                </button>

                {/* 3. DJAMO */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('djamo')}
                  className={`flex flex-col items-center justify-center p-3 rounded-[22px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'djamo'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-xs mb-2">
                    <span className="text-white font-serif italic font-black text-sm tracking-tight">
                      djamo
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Djamo
                  </span>
                </button>

                {/* 4. CARTE BANCAIRE */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('carte')}
                  className={`flex flex-col items-center justify-center p-3 rounded-[22px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'carte'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 p-1 flex flex-col items-center justify-center gap-0.5 shadow-xs mb-2">
                    <div className="flex items-center gap-1">
                      {/* CB badge */}
                      <span className="text-[7px] font-black bg-teal-600 text-white px-1 py-0.2 rounded-xs">
                        CB
                      </span>
                      {/* Mastercard logo */}
                      <div className="flex -space-x-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] opacity-80" />
                      </div>
                    </div>
                    {/* VISA text */}
                    <span className="text-[8px] font-black text-[#1A1F71] tracking-wider">
                      VISA
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 text-center leading-tight">
                    Carte<br />bancaire
                  </span>
                </button>
              </div>

              {/* SOUS-TOTAL ET TOTAL (EXACT MATCH TO IMG_0878) */}
              <div className="border-t border-b border-slate-200 py-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sous-total</span>
                  <span className="font-medium">{formattedAmount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-950 font-black">
                  <span>Total</span>
                  <span>{formattedAmount}</span>
                </div>
              </div>

              {/* CHECKBOX CONDITIONS GÉNÉRALES */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded-xs border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="terms-checkbox" className="text-xs text-slate-700 leading-snug cursor-pointer select-none">
                  J'accepte les{' '}
                  <span className="underline decoration-slate-400 font-medium">conditions générales de vente</span>
                  {' '}et la{' '}
                  <span className="underline decoration-slate-400 font-medium">politique de confidentialité</span>.
                </label>
              </div>

              {/* ERROR MESSAGE */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* BIG RED ACTION BUTTON (EXACT MATCH: Payer avec Wave ≫) */}
              <button
                type="button"
                onClick={handleCtaClick}
                className="w-full py-4 bg-[#FF0033] hover:bg-red-700 text-white font-black text-base rounded-full shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>Payer avec {getMethodName()}</span>
                <span className="font-mono text-lg font-black tracking-tighter">≫</span>
              </button>
            </>
          ) : (
            /* STEP 2: PHONE NUMBER OR DIRECT OPERATOR SELECTION */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Méthode sélectionnée</span>
                  <span className="text-xs font-black text-red-600">{getMethodName()}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {selectedMethod === 'wave' && 'Débit direct via Wave Côte d’Ivoire (sans frais additionnels)'}
                  {selectedMethod === 'mobile_money' && 'Paiement direct USSD sur votre compte Orange, MTN ou Moov'}
                  {selectedMethod === 'djamo' && 'Paiement instantané via votre carte Visa Djamo Côte d’Ivoire'}
                  {selectedMethod === 'carte' && 'Paiement sécurisé par carte bancaire internationale'}
                </div>
              </div>

              {selectedMethod === 'mobile_money' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Choisir votre opérateur :
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOperator('orange')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        operator === 'orange'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-200'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      Orange Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperator('mtn')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        operator === 'mtn'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-200'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      MTN MoMo
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperator('moov')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        operator === 'moov'
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      Moov Money
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod !== 'carte' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Numéro de téléphone ({country}) :
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 flex items-center gap-1 border-r border-slate-200 pr-2">
                      <span>🇨🇮</span>
                      <span>+225</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01 02 03 04 05"
                      className="w-full pl-24 pr-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Vous recevrez une notification de validation sur votre mobile.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <CreditCard className="w-4 h-4 text-slate-600" />
                    <span>Paiement par Carte Sécurisé (3D-Secure)</span>
                  </div>
                  <p>
                    Validation par passerelle bancaire avec génération immédiate de vos tickets numériques CROU-K.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleConfirmPayment(false)}
                  className="w-full py-4 bg-[#FF0033] hover:bg-red-700 disabled:opacity-50 text-white font-black text-sm rounded-full shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connexion à {getMethodName()}...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmer le paiement de {formattedAmount}</span>
                      <span className="font-mono text-base font-black">≫</span>
                    </>
                  )}
                </button>

                {/* Simulation button for easy demo / campus wifi test without wasting live airtime */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleConfirmPayment(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Cantine Immédiat (Simulation Gratuite)</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
