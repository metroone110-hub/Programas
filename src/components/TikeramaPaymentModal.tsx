import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  ShieldCheck, 
  Sparkles,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { updateUserBalance } from '../services/studentAuth';
import { validateCIPhoneNumber, MobileOperator } from '../utils/phoneValidator';
import { recordRecharge } from '../utils/analytics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSuccess: (updatedUser: UserProfile) => void;
}

const PRESET_AMOUNTS = [
  { amount: 1000, meals: 5, label: '1 000 FCFA (5 repas)' },
  { amount: 2000, meals: 10, label: '2 000 FCFA (10 repas)', popular: true },
  { amount: 4000, meals: 20, label: '4 000 FCFA (20 repas)' },
  { amount: 10000, meals: 50, label: '10 000 FCFA (50 repas)' }
];

export const TikeramaPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'Wave' | 'Orange' | 'MTN' | 'Moov'>('Wave');
  const [amount, setAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  
  // NOTE: Strictly empty by default!
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ reference: string; amount: number } | null>(null);

  if (!isOpen) return null;

  const finalAmount = isCustom ? (parseInt(customAmount, 10) || 0) : amount;

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (finalAmount < 200) {
      setErrorMessage('Le montant minimum de recharge est de 200 FCFA (1 ticket).');
      return;
    }

    // Phone validation
    const validation = validateCIPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Veuillez saisir un numéro de téléphone mobile valide.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate mobile money API gateway handshake
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newBalance = user.balance + finalAmount;
      const updatedUser = await updateUserBalance(user, newBalance);

      recordRecharge(finalAmount);

      const reference = `TIK-${selectedMethod.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setSuccessData({ reference, amount: finalAmount });
      onSuccess(updatedUser);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec du traitement du paiement Mobile Money.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setSuccessData(null);
    setPhoneNumber('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white relative">
          <button
            onClick={resetModal}
            className="absolute top-5 right-5 p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 block">
                Paiement Instantané Tikerama
              </span>
              <h3 className="text-xl font-black font-cabinet">Recharge Compte CROU</h3>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs bg-black/15 p-2 rounded-xl backdrop-blur-sm">
            <span>Solde actuel:</span>
            <span className="font-extrabold text-white font-mono">{user.balance} FCFA</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {successData ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 font-cabinet">
                  Recharge Réussie !
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Votre compte a été crédité de <strong className="text-slate-800">{successData.amount} FCFA</strong>.
                </p>
                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl inline-block text-left text-xs font-mono">
                  <span className="text-slate-400 block text-[10px]">RÉFÉRENCE TRANSACTION:</span>
                  <span className="font-bold text-slate-800">{successData.reference}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetModal}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide rounded-2xl transition-all shadow-md active:scale-98"
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

              {/* Operator Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Choisissez votre moyen de paiement Mobile Money
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Wave', label: 'Wave', color: 'border-cyan-400 bg-cyan-50 text-cyan-800' },
                    { id: 'Orange', label: 'Orange', color: 'border-orange-400 bg-orange-50 text-orange-800' },
                    { id: 'MTN', label: 'MTN MoMo', color: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
                    { id: 'Moov', label: 'Moov', color: 'border-blue-400 bg-blue-50 text-blue-800' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-1 ${
                        selectedMethod === m.id
                          ? `${m.color} ring-2 ring-orange-500 font-extrabold shadow-sm scale-102`
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-base">
                        {m.id === 'Wave' ? '🌊' : m.id === 'Orange' ? '🍊' : m.id === 'MTN' ? '🟡' : '🔵'}
                      </span>
                      <span className="text-[11px] leading-tight">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Amounts */}
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
                        setAmount(p.amount);
                        setIsCustom(false);
                      }}
                      className={`p-3 rounded-2xl border text-xs text-left transition-all relative ${
                        !isCustom && amount === p.amount
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
                    className="text-xs text-orange-600 hover:underline font-semibold"
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Phone number input - STRICTLY EMPTY BY DEFAULT! */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Numéro de compte {selectedMethod} <span className="text-red-500">*</span>
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
                  Le numéro doit comporter 10 chiffres (Côte d'Ivoire). Vous recevrez une demande de validation USSD / Wave.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wide rounded-2xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Validation du paiement en cours...</span>
                ) : (
                  <>
                    <span>Recharger {finalAmount} FCFA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paiement crypté et validé par l'autorité CROU</span>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
