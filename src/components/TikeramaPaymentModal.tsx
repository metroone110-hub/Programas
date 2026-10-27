import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  ShieldCheck, 
  Zap,
  ShoppingBag,
  Ticket,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, MealTicket } from '../types';
import { updateUserBalance, purchaseTicketsBatch } from '../services/studentAuth';
import { validateCIPhoneNumber } from '../utils/phoneValidator';
import { recordRecharge } from '../utils/analytics';
import { recordTicketsSaleInLedger } from '../services/dailyLedger';
import { jekoConfig, createJekoTransactionPayload } from '../services/jekoConfig';
import { initiateJekoPayment } from '../services/jekoPayment';

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

const PRESET_AMOUNTS = [
  { amount: 200, meals: 1, label: '200 FCFA (1 repas)' },
  { amount: 1000, meals: 5, label: '1 000 FCFA (5 repas)' },
  { amount: 2000, meals: 10, label: '2 000 FCFA (10 repas)', popular: true },
  { amount: 4000, meals: 20, label: '4 000 FCFA (20 repas)' }
];

export const TikeramaPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  totalAmount,
  items,
  onSuccess
}) => {
  const isDirectTicketPurchase = Boolean(items && items.length > 0);
  const calculatedItemsTotal = items ? items.reduce((sum, item) => sum + (item.quantity * 200), 0) : 200;
  
  const [selectedMethod, setSelectedMethod] = useState<'Wave' | 'Orange' | 'MTN' | 'Moov' | 'Djamo' | 'Jeko'>('Wave');
  const [rechargeAmount, setRechargeAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  
  // NOTE: Strictly empty by default!
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ 
    reference: string; 
    amount: number;
    ticketsCount?: number;
    redirectUrl?: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentFinalAmount = isDirectTicketPurchase
    ? (totalAmount || calculatedItemsTotal)
    : (isCustom ? (parseInt(customAmount, 10) || 0) : rechargeAmount);

  const handlePhoneChange = (val: string) => {
    // Only allow digits and spaces
    const clean = val.replace(/[^\d\s]/g, '');
    setPhoneNumber(clean);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (currentFinalAmount < 200) {
      setErrorMessage('Le montant minimum est de 200 FCFA (1 repas subventionné).');
      return;
    }

    const rawDigits = phoneNumber.replace(/\s+/g, '');
    if (!rawDigits) {
      setErrorMessage('Veuillez saisir votre numéro Mobile Money / Wave.');
      return;
    }

    if (rawDigits.length !== 10) {
      setErrorMessage('Le numéro de téléphone ivoirien doit comporter exactement 10 chiffres (ex: 07 00 00 00 00).');
      return;
    }

    setIsLoading(true);

    try {
      // Process transaction via Jeko Live Payment Service
      const paymentRes = await initiateJekoPayment({
        amount: currentFinalAmount,
        studentMatricule: user.matricule || user.uid,
        studentName: user.displayName || 'Étudiant UPGC',
        studentPhone: rawDigits,
        orderDescription: isDirectTicketPurchase ? `Achat tickets Resto U CROU` : `Recharge compte CROU Pass`,
        ticketQuantity: isDirectTicketPurchase && items ? items.reduce((s, i) => s + i.quantity, 0) : Math.max(1, Math.floor(currentFinalAmount / 200)),
        paymentMethod: selectedMethod
      });

      const reference = paymentRes.reference;

      if (isDirectTicketPurchase && items && items.length > 0) {
        // Direct Ticket Purchase
        const res = await purchaseTicketsBatch(user, items);
        await recordTicketsSaleInLedger(res.generatedTickets.length, 200);

        setSuccessData({
          reference,
          amount: currentFinalAmount,
          ticketsCount: res.generatedTickets.length,
          redirectUrl: paymentRes.redirectUrl
        });

        onSuccess(res.updatedUser, res.generatedTickets);
      } else {
        // Wallet Recharge
        const newBalance = user.balance + currentFinalAmount;
        const updatedUser = await updateUserBalance(user, newBalance);
        recordRecharge(currentFinalAmount);

        setSuccessData({
          reference,
          amount: currentFinalAmount,
          redirectUrl: paymentRes.redirectUrl
        });

        onSuccess(updatedUser);
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
      setErrorMessage(err.message || 'Échec de traitement du paiement. Veuillez vérifier votre connexion et réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setPhoneNumber('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn font-sans">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scaleUp">
        
        {/* Header Tikerama Style */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-5 sm:p-6 text-white relative">
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl shadow-inner">
              {isDirectTicketPurchase ? (
                <Ticket className="w-6 h-6 text-white" />
              ) : (
                <Zap className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 block">
                Paiement Sécurisé Tikerama • Jeko
              </span>
              <h3 className="text-xl font-black font-cabinet leading-tight">
                {isDirectTicketPurchase ? 'Achat de Tickets CROU' : 'Recharge Compte Restau. U'}
              </h3>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs bg-black/15 p-2 rounded-xl backdrop-blur-sm">
            <span>{isDirectTicketPurchase ? 'Total à régler :' : 'Solde actuel :'}</span>
            <span className="font-extrabold text-white font-mono text-sm">
              {isDirectTicketPurchase ? `${currentFinalAmount} FCFA` : `${user.balance.toLocaleString()} FCFA`}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {successData ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 font-cabinet">
                  {successData.ticketsCount 
                    ? `${successData.ticketsCount} Ticket(s) Validé(s) !` 
                    : 'Recharge Réussie !'}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {successData.ticketsCount ? (
                    <>
                      Votre paiement de <strong className="text-slate-900">{successData.amount} FCFA</strong> est confirmé.
                      <br />
                      Vos tickets sont disponibles dans votre espace <strong>« Mes Tickets »</strong>.
                    </>
                  ) : (
                    <>
                      Votre compte a été crédité de <strong className="text-slate-900">{successData.amount} FCFA</strong>.
                    </>
                  )}
                </p>
                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl inline-block text-left text-xs font-mono">
                  <span className="text-slate-400 block text-[10px]">RÉFÉRENCE TRANSACTION :</span>
                  <span className="font-bold text-slate-800">{successData.reference}</span>
                </div>
              </div>

              {successData.redirectUrl && (
                <a
                  href={successData.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wide rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98"
                >
                  <span>Ouvrir la Page de Paiement Sécurisé Jeko</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer"
              >
                Terminer & Retourner au Menu
              </button>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Items Summary if direct ticket purchase */}
              {isDirectTicketPurchase && items && (
                <div className="p-3 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-orange-950">
                    <span className="flex items-center space-x-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                      <span>Commande de repas subventionnés</span>
                    </span>
                    <span className="font-mono text-orange-700">{currentFinalAmount} FCFA</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {it.quantity}x {it.dishName}</span>
                        <span className="font-medium">{it.quantity * 200} F</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Mobile Money Operator Select with Official Logos/Badges */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Choisissez votre moyen de paiement Mobile Money
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {/* Wave */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Wave')}
                    className={`p-2 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      selectedMethod === 'Wave'
                        ? 'border-cyan-400 bg-cyan-50/80 text-cyan-900 ring-2 ring-cyan-500 shadow-sm scale-102 font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1dc4ff] text-white flex items-center justify-center shadow-xs">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-2.48 0-4.5-2.02-4.5-4.5S10.52 7.5 13 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/>
                        <circle cx="14" cy="11" r="1.5" className="fill-[#1dc4ff]"/>
                      </svg>
                    </div>
                    <span className="text-[10px] leading-tight font-black text-cyan-900">Wave</span>
                  </button>

                  {/* Orange Money */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Orange')}
                    className={`p-2 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      selectedMethod === 'Orange'
                        ? 'border-orange-500 bg-orange-50/80 text-orange-900 ring-2 ring-orange-500 shadow-sm scale-102 font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#ff7900] text-black flex items-center justify-center font-black text-xs shadow-xs">
                      <span className="text-white font-extrabold text-[10px]">OM</span>
                    </div>
                    <span className="text-[10px] leading-tight font-black text-orange-950">Orange</span>
                  </button>

                  {/* MTN MoMo */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MTN')}
                    className={`p-2 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      selectedMethod === 'MTN'
                        ? 'border-yellow-400 bg-yellow-50/80 text-yellow-950 ring-2 ring-yellow-500 shadow-sm scale-102 font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#ffcc00] text-slate-900 flex items-center justify-center font-black text-xs shadow-xs">
                      <span className="font-extrabold text-[10px]">MTN</span>
                    </div>
                    <span className="text-[10px] leading-tight font-black text-yellow-950">MoMo</span>
                  </button>

                  {/* Moov Money */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Moov')}
                    className={`p-2 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      selectedMethod === 'Moov'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500 shadow-sm scale-102 font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0077c8] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      <span className="text-white font-extrabold text-[10px]">Moov</span>
                    </div>
                    <span className="text-[10px] leading-tight font-black text-blue-950">Moov</span>
                  </button>

                  {/* Djamo */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Djamo')}
                    className={`p-2 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      selectedMethod === 'Djamo'
                        ? 'border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500 shadow-sm scale-102 font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#6d28d9] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      <span className="text-white font-extrabold text-[10px]">DJ</span>
                    </div>
                    <span className="text-[10px] leading-tight font-black text-purple-950">Djamo</span>
                  </button>

                  {/* Jeko */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Jeko')}
                    className={`p-2 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      selectedMethod === 'Jeko'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500 shadow-sm scale-102 font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      <span className="text-white font-extrabold text-[10px]">JK</span>
                    </div>
                    <span className="text-[10px] leading-tight font-black text-emerald-950">Jeko</span>
                  </button>
                </div>
              </div>

              {/* 2. Amount Selection (only if recharging wallet) */}
              {!isDirectTicketPurchase && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    2. Montant de la recharge
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_AMOUNTS.map((p) => (
                      <button
                        key={p.amount}
                        type="button"
                        onClick={() => {
                          setRechargeAmount(p.amount);
                          setIsCustom(false);
                        }}
                        className={`p-3 rounded-2xl border text-xs text-left transition-all relative cursor-pointer ${
                          !isCustom && rechargeAmount === p.amount
                            ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold ring-2 ring-orange-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {p.popular && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded-md uppercase">
                            Populaire
                          </span>
                        )}
                        <div className="font-extrabold text-sm">{p.amount} FCFA</div>
                        <div className="text-[10px] text-slate-500 font-medium">{p.meals} repas subventionnés</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount option */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setIsCustom(!isCustom)}
                      className="text-xs text-orange-600 hover:underline font-semibold cursor-pointer"
                    >
                      {isCustom ? '← Choisir parmi les forfaits' : 'Ou entrer un autre montant personnalisé →'}
                    </button>

                    {isCustom && (
                      <div className="mt-2">
                        <input
                          type="number"
                          min="200"
                          step="100"
                          placeholder="Ex: 5000"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Phone number input - STRICTLY EMPTY BY DEFAULT! */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isDirectTicketPurchase ? '2.' : '3.'} Numéro de compte {selectedMethod} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Ex: 07 00 00 00 00"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  10 chiffres (Côte d'Ivoire). Vous recevrez une validation instantanée {selectedMethod}.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wide rounded-2xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>Validation du paiement en cours...</span>
                ) : (
                  <>
                    <span>
                      {isDirectTicketPurchase 
                        ? `Payer ${currentFinalAmount} FCFA par ${selectedMethod}` 
                        : `Recharger ${currentFinalAmount} FCFA`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paiement crypté sécurisé par Jeko • CROU Korhogo</span>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
