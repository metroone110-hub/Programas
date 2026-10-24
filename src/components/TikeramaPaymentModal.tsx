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

export type PaymentMethodType = 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo' | 'jeko' | 'mobile_money' | 'carte';

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
  // Phone number starts STRICTLY EMPTY by default as requested by user
  const [phone, setPhone] = useState<string>('');
  const [operator, setOperator] = useState<'orange' | 'mtn' | 'moov'>('orange');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Real Jeko active session state
  const [activeSession, setActiveSession] = useState<{
    reference: string;
    requestId?: string;
    paymentUrl?: string;
    amount: number;
    methodName: string;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [sessionSuccess, setSessionSuccess] = useState<boolean>(false);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsProcessing(false);
      setShowInputStep(false);
      setActiveSession(null);
      setIsCheckingStatus(false);
      setSessionSuccess(false);
      setAcceptedTerms(true);
      // Strictly empty phone number on every open: do NOT pre-fill with any cached number
      setPhone('');
      try {
        localStorage.removeItem('crouk_student_momo_phone');
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  // Polling for real transaction completion on Jeko servers
  useEffect(() => {
    if (!activeSession || sessionSuccess) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/jeko-status/${encodeURIComponent(activeSession.reference)}`);
        const data = await res.json();
        if (data.success && data.status === 'SUCCESSFUL' && isMounted) {
          setSessionSuccess(true);
          clearInterval(interval);
          setTimeout(() => {
            if (isMounted) {
              onPaymentSuccess(data.tickets || []);
              onClose();
            }
          }, 1500);
        }
      } catch (e) {
        // quiet poll
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSession, sessionSuccess, onPaymentSuccess, onClose]);

  if (!isOpen) return null;

  const formattedAmount = `${totalAmount.toLocaleString('fr-FR')} F CFA`;

  const getMethodName = () => {
    switch (selectedMethod) {
      case 'wave':
        return 'Wave';
      case 'orange':
        return 'Orange Money';
      case 'mtn':
        return 'MTN MoMo';
      case 'moov':
        return 'Moov Africa';
      case 'djamo':
        return 'Djamo';
      case 'jeko':
        return 'Jèko Pay';
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

  const checkManualStatus = async () => {
    if (!activeSession) return;
    setIsCheckingStatus(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/tickets/jeko-status/${encodeURIComponent(activeSession.reference)}`);
      const data = await res.json();
      if (data.success && data.status === 'SUCCESSFUL' && data.tickets?.length > 0) {
        setSessionSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(data.tickets);
          onClose();
        }, 1200);
      } else if (data.status === 'FAILED') {
        setErrorMessage(data.message || 'Le paiement a échoué ou a expiré sur Jèko.');
      } else {
        setErrorMessage(data.message || 'Paiement en attente : nous n\'avons pas encore reçu la confirmation de Jèko. Veuillez valider le paiement sur votre mobile et réessayer.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la vérification');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConfirmPayment = async (forceSimulate = false) => {
    setErrorMessage(null);

    let cleanPhone = normalizeIvorianPhone(phone);
    if (!forceSimulate && (selectedMethod !== 'carte')) {
      if (!cleanPhone || cleanPhone.length < 8) {
        setErrorMessage('Veuillez renseigner votre numéro de téléphone (Orange, MTN, Moov ou Wave).');
        return;
      }
    }

    try {
      setIsProcessing(true);

      // Simulation mode (only when explicitly requested by clicking test button)
      if (forceSimulate) {
        const res = await fetch('/api/tickets/jeko-simulate-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            type: ticketPack,
            visitorId,
            operator: `${getMethodName()} (Test Simulation)`,
          }),
        });
        const data = await res.json();
        if (data.tickets && data.tickets.length > 0) {
          onPaymentSuccess(data.tickets);
          onClose();
          return;
        }
      }

      // REAL direct payment communication with Jèko API
      const res = await fetch('/api/tickets/jeko-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          type: ticketPack,
          amount: totalAmount,
          visitorId,
          method: selectedMethod,
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Display REAL error from Jeko API directly to the user! NO fake fallback!
        throw new Error(data.message || data.error || 'Erreur lors de la communication avec les serveurs Jèko.');
      }

      // Open real Jeko checkout redirect URL
      if (data.paymentUrl && data.paymentUrl.startsWith('http')) {
        window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
      }

      // Enter REAL waiting session
      setActiveSession({
        reference: data.reference,
        requestId: data.requestId,
        paymentUrl: data.paymentUrl,
        amount: totalAmount,
        methodName: getMethodName(),
      });

    } catch (err: any) {
      console.error('[Jeko Payment Error]:', err);
      setErrorMessage(err.message || 'Échec de l\'initialisation du paiement avec Jèko Pay.');
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
          
          {activeSession ? (
            /* STEP 3: LIVE REAL JEKO SESSION */
            <div className="space-y-4 animate-in fade-in duration-150 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Smartphone className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-bold">
                    Passerelle Jèko Pay • {activeSession.methodName}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-950 font-bold">
                    {formattedAmount}
                  </span>
                </div>
                <h4 className="font-black text-slate-950 text-base mt-2">
                  Demande de paiement transmise à Jèko
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Veuillez valider le paiement sur votre mobile ({activeSession.methodName}). Votre ticket repas officiel sera généré dès confirmation reçue de Jèko.
                </p>
              </div>

              {activeSession.paymentUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Si la page de paiement Jèko ne s'est pas ouverte automatiquement :
                  </p>
                  <a
                    href={activeSession.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <span>Ouvrir la page de paiement sécurisée Jèko</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {sessionSuccess ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-xs text-emerald-900 font-bold flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Paiement réel confirmé par Jèko ! Génération de vos tickets en cours...</span>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isCheckingStatus}
                    onClick={checkManualStatus}
                    className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{isCheckingStatus ? 'Interrogation des serveurs Jèko...' : 'Vérifier la confirmation de paiement'}</span>
                  </button>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveSession(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 underline pt-1 block mx-auto cursor-pointer"
                  >
                    Annuler et changer de moyen de paiement
                  </button>
                </div>
              )}
            </div>
          ) : !showInputStep ? (
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

              {/* PAYMENT METHOD CARDS (6 JEKO METHODS) */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. WAVE */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('wave')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[20px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'wave'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <img
                    src="/assets/aistudio/IMG_1013_e6727301.png"
                    alt="Wave"
                    className="w-12 h-12 rounded-2xl object-cover shadow-xs mb-1.5"
                  />
                  <span className="text-[11px] font-bold text-slate-900">
                    Wave
                  </span>
                </button>

                {/* 2. ORANGE MONEY */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('orange')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[20px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'orange'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FF7900] flex items-center justify-center text-white font-black text-sm shadow-xs mb-1.5">
                    OM
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 text-center leading-tight">
                    Orange
                  </span>
                </button>

                {/* 3. MTN MOMO */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('mtn')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[20px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'mtn'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FFCC00] flex items-center justify-center text-slate-950 font-black text-xs shadow-xs mb-1.5">
                    MoMo
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 text-center leading-tight">
                    MTN
                  </span>
                </button>

                {/* 4. MOOV AFRICA */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('moov')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[20px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'moov'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#005CA9] flex items-center justify-center text-white font-black text-xs shadow-xs mb-1.5">
                    Moov
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 text-center leading-tight">
                    Moov
                  </span>
                </button>

                {/* 5. DJAMO */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('djamo')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[20px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'djamo'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-xs mb-1.5">
                    <span className="text-white font-serif italic font-black text-sm tracking-tight">
                      djamo
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">
                    Djamo
                  </span>
                </button>

                {/* 6. JEKO PAY */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('jeko')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[20px] transition-all cursor-pointer relative bg-white border ${
                    selectedMethod === 'jeko'
                      ? 'border-2 border-red-500 shadow-md ring-2 ring-red-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-xs mb-1.5">
                    ⚡
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 text-center leading-tight">
                    Jèko Pay
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
                      placeholder="Ex: 07 01 02 03 04"
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
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
