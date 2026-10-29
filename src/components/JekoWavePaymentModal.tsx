import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, MealTicket } from '../types';
import { purchaseTicketsBatch } from '../services/studentAuth';
import { validateCIPhoneNumber } from '../utils/phoneValidator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number; // In FCFA, e.g. 200, 400, 1000, 2000
  items: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    mealType: 'dejeuner' | 'diner';
    canteenId: string;
    canteenName: string;
  }>;
  user: UserProfile;
  onSuccess: (updatedUser: UserProfile, tickets: MealTicket[]) => void;
}

export const JekoWavePaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  totalAmount,
  items,
  user,
  onSuccess
}) => {
  const [method, setMethod] = useState<'WAVE' | 'ORANGE' | 'MTN' | 'MOOV'>('WAVE');
  
  // NOTE: Strictly empty by default!
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    // Only allow digits and spaces
    const clean = val.replace(/[^\d\s]/g, '');
    setPhoneNumber(clean);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawDigits = phoneNumber.replace(/\s+/g, '');
    if (!rawDigits) {
      setErrorMessage('Veuillez saisir votre numéro de téléphone pour le paiement.');
      return;
    }

    if (rawDigits.length !== 10) {
      setErrorMessage('Le numéro de téléphone ivoirien doit comporter exactement 10 chiffres (ex: 07 00 00 00 00).');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate secure Jeko / Wave USSD prompt verification
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Batch purchase & save in Firestore & LocalStorage
      const res = await purchaseTicketsBatch(user, items);
      
      setIsCompleted(true);

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }

      setTimeout(() => {
        onSuccess(res.updatedUser, res.generatedTickets);
        onClose();
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message || 'Le paiement n\'a pas pu aboutir. Veuillez réessayer.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      
      {/* Mobile Frame Container matching pay.jeko.africa */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-scaleUp">
        
        {/* Fake Browser Top URL Bar matching IMG_1059.png */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-slate-700">OK</span>
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 text-[11px] text-slate-800 shadow-xs">
            <Lock className="w-3 h-3 text-slate-500" />
            <span className="font-medium">pay.jeko.africa</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <span className="text-[11px] font-bold">AA</span>
            <RefreshCw className="w-3 h-3" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Header with Programas logo & Total Amount */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center ring-1 ring-orange-500/20 flex-shrink-0">
                <img src="/icon.svg" alt="Programas" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-slate-900 text-base font-cabinet">
                Programas
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">
                Montant à payer
              </span>
              <span className="text-xl font-black text-slate-900 font-cabinet">
                {totalAmount} <span className="text-xs font-bold text-slate-600">FCFA</span>
              </span>
            </div>
          </div>

          {/* Explanation Text */}
          <p className="text-xs text-slate-500 leading-relaxed">
            Vous êtes sur le point de payer la consommation de votre caisse CROU-K UPGC ({items.reduce((s, i) => s + i.quantity, 0)} repas subventionnés).
          </p>

          {/* Payment Method Selector & Wave Brand matching IMG_1059.png */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Payer par <strong className="text-slate-900">{method}</strong>
                </span>
                <span className="text-[10px] text-slate-500">
                  Débit instantané sans frais
                </span>
              </div>

              {/* Official Wave Penguin Circle Icon */}
              <div className="w-10 h-10 rounded-full bg-[#1dc4f8] flex items-center justify-center shadow-md">
                <span className="text-xl">🐧</span>
              </div>
            </div>

            {/* Operator switch tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-bold text-center">
              {(['WAVE', 'ORANGE', 'MTN', 'MOOV'] as const).map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setMethod(op)}
                  className={`py-1 rounded-lg transition-all ${
                    method === op ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Entrez votre numéro de téléphone {method} pour lancer le paiement.
              </label>

              {/* CI Phone Input matching IMG_1059.png */}
              <div className="flex items-center border border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 rounded-2xl px-3 py-3 bg-white shadow-xs transition-all">
                <div className="flex items-center space-x-1.5 pr-2 border-r border-slate-200 flex-shrink-0">
                  <span className="text-lg">🇨🇮</span>
                  <span className="text-xs font-bold text-slate-700">+225</span>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="0X XX XX XX XX"
                  className="w-full pl-3 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
              </div>

              {errorMessage && (
                <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing || isCompleted}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validation Wave en cours...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Paiement Validé !</span>
                </>
              ) : (
                <span>Payer {totalAmount} FCFA</span>
              )}
            </button>
          </form>

          {/* Close button */}
          <div className="text-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
            >
              × Fermer
            </button>
          </div>

        </div>

        {/* Footer Jeko brand matching IMG_1059.png */}
        <div className="py-3 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center space-x-1.5 text-xs text-slate-500">
          <span>Paiement sécurisé par</span>
          <strong className="text-slate-900 font-bold">Jeko</strong>
          <span className="w-4 h-4 rounded bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
            J
          </span>
        </div>

      </div>
    </div>
  );
};
