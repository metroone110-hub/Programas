import React, { useState } from 'react';
import { X, CreditCard, Wallet, ArrowUpRight, Check, AlertCircle, Sparkles, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { updateUserBalance } from '../services/studentAuth';
import { initiateJekoPayment } from '../services/jekoPayment';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onBalanceUpdated: (updatedUser: UserProfile) => void;
}

export const WalletModal: React.FC<Props> = ({ isOpen, onClose, user, onBalanceUpdated }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'Wave' | 'Orange' | 'MTN' | 'Moov'>('Wave');
  const [phoneForPayment, setPhoneForPayment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const amounts = [500, 1000, 2000, 5000];

  const handleRecharge = async () => {
    const amountToCharge = customAmount ? parseInt(customAmount, 10) : selectedAmount;
    if (isNaN(amountToCharge) || amountToCharge < 200) {
      alert('Veuillez entrer un montant valide (minimum 200 FCFA).');
      return;
    }

    setIsProcessing(true);
    try {
      await initiateJekoPayment({
        amount: amountToCharge,
        studentMatricule: user.matricule || user.uid,
        studentName: user.displayName || 'Étudiant UPGC',
        studentPhone: phoneForPayment || user.phone || '0700000000',
        orderDescription: `Recharge CROU Pass ${amountToCharge} FCFA`,
        ticketQuantity: Math.floor(amountToCharge / 200),
        paymentMethod: selectedMethod
      });

      const newBalance = user.balance + amountToCharge;
      const updatedUser = await updateUserBalance(user, newBalance);
      onBalanceUpdated(updatedUser);
      setIsProcessing(false);
      setSuccessMsg(true);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // Ignore confetti if not supported
      }

      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1800);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-orange-100 text-xs font-semibold mb-1">
            <Wallet className="w-4 h-4" />
            <span>Porte-monnaie CROU Pass</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-cabinet">{user.balance.toLocaleString()} FCFA</span>
            <span className="text-xs text-orange-200">Solde disponible</span>
          </div>
          <p className="text-xs text-orange-100/90 mt-2">
            ≈ {Math.floor(user.balance / 200)} repas subventionnés complets
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Recharge Réussie !</h4>
              <p className="text-xs text-slate-500">Votre solde CROU a été crédité avec succès.</p>
            </div>
          ) : (
            <>
              {/* Amounts Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Choisissez le montant à recharger
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        selectedAmount === amt && !customAmount
                          ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="font-black text-slate-900 text-sm font-cabinet">
                        {amt.toLocaleString()} FCFA
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {amt / 200} repas CROU
                      </div>
                      {selectedAmount === amt && !customAmount && (
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange-600"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Moyen de paiement Mobile Money
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Wave')}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      selectedMethod === 'Wave'
                        ? 'border-cyan-400 bg-cyan-50/80 text-cyan-900 ring-2 ring-cyan-500/20 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#1dc4ff] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      🌊
                    </div>
                    <span>Wave (0% frais)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Orange')}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      selectedMethod === 'Orange'
                        ? 'border-orange-500 bg-orange-50/80 text-orange-950 ring-2 ring-orange-500/20 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#ff7900] text-black flex items-center justify-center font-black text-[10px] shadow-xs">
                      <span className="text-white font-extrabold text-[10px]">OM</span>
                    </div>
                    <span>Orange Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MTN')}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      selectedMethod === 'MTN'
                        ? 'border-yellow-400 bg-yellow-50/80 text-yellow-950 ring-2 ring-yellow-500/20 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#ffcc00] text-slate-900 flex items-center justify-center font-black text-[10px] shadow-xs">
                      <span className="font-extrabold text-[10px]">MTN</span>
                    </div>
                    <span>MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Moov')}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      selectedMethod === 'Moov'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0077c8] text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                      <span className="text-white font-extrabold text-[9px]">Moov</span>
                    </div>
                    <span>Moov Money</span>
                  </button>
                </div>
              </div>

              {/* Phone confirmation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro Mobile Money débité
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phoneForPayment}
                    onChange={(e) => setPhoneForPayment(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleRecharge}
                disabled={isProcessing}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-orange-500/25 flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-60"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Validation du paiement...</span>
                  </div>
                ) : (
                  <>
                    <span>Recharger {(customAmount ? parseInt(customAmount, 10) : selectedAmount).toLocaleString()} FCFA</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
