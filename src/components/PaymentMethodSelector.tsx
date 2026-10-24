import React, { useState } from 'react';
import { 
  Smartphone, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import type { VirtualTicket } from '../types';
import { normalizeIvorianPhone } from '../utils/phoneValidator';

export type PaymentMethod = 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo' | 'jeko';

export interface PaymentMethodSelectorProps {
  orderId?: string;
  amount: number;
  visitorId?: string;
  phone?: string;
  onPaymentSuccess?: (tickets: VirtualTicket[]) => void;
  onPaymentInitiated?: (paymentUrl: string, reference: string) => void;
  compact?: boolean;
}

interface MethodInfo {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  bgColor: string;
  textColor: string;
  borderActive: string;
  ringColor: string;
  badge: string;
  icon: React.ReactNode;
}

const METHODS_CONFIG: Record<PaymentMethod, MethodInfo> = {
  wave: {
    id: 'wave',
    label: 'Wave',
    sublabel: 'Sans frais · 1%',
    bgColor: 'bg-[#1DC4E9]',
    textColor: 'text-white',
    borderActive: 'border-[#1DC4E9]',
    ringColor: 'ring-sky-200',
    badge: '🌊 Wave',
    icon: (
      <img
        src="/assets/aistudio/IMG_1013_e6727301.png"
        alt="Wave"
        className="w-8 h-8 rounded-xl object-cover shadow-xs"
      />
    ),
  },
  orange: {
    id: 'orange',
    label: 'Orange Money',
    sublabel: 'Code #144# ou App OM',
    bgColor: 'bg-[#FF7900]',
    textColor: 'text-white',
    borderActive: 'border-[#FF7900]',
    ringColor: 'ring-orange-200',
    badge: '🍊 Orange',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-[#FF7900] flex items-center justify-center text-white font-black text-xs shadow-xs">
        OM
      </div>
    ),
  },
  mtn: {
    id: 'mtn',
    label: 'MTN MoMo',
    sublabel: 'Code *133# ou MoMo App',
    bgColor: 'bg-[#FFCC00]',
    textColor: 'text-slate-950',
    borderActive: 'border-[#FFCC00]',
    ringColor: 'ring-amber-200',
    badge: '🟡 MTN',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-[#FFCC00] flex items-center justify-center text-slate-950 font-black text-xs shadow-xs">
        MoMo
      </div>
    ),
  },
  moov: {
    id: 'moov',
    label: 'Moov Africa',
    sublabel: 'Flooz · Code *155#',
    bgColor: 'bg-[#005CA9]',
    textColor: 'text-white',
    borderActive: 'border-[#005CA9]',
    ringColor: 'ring-blue-200',
    badge: '🔵 Moov',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-[#005CA9] flex items-center justify-center text-white font-black text-xs shadow-xs">
        Moov
      </div>
    ),
  },
  djamo: {
    id: 'djamo',
    label: 'Djamo',
    sublabel: 'Carte & App Djamo CI',
    bgColor: 'bg-black',
    textColor: 'text-white',
    borderActive: 'border-black',
    ringColor: 'ring-slate-300',
    badge: '💳 Djamo',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-serif italic font-black text-xs shadow-xs">
        d
      </div>
    ),
  },
  jeko: {
    id: 'jeko',
    label: 'Jèko Pay',
    sublabel: 'Agrégateur CI Multi-Réseaux',
    bgColor: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    textColor: 'text-white',
    borderActive: 'border-emerald-500',
    ringColor: 'ring-emerald-200',
    badge: '⚡ Jèko',
    icon: (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
        ⚡
      </div>
    ),
  },
};

/**
 * PaymentMethodSelector Component
 * Implements the standard method selector pattern recommended by Jèko Pay:
 * ['wave', 'orange', 'mtn', 'moov', 'djamo', 'jeko']
 */
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  orderId,
  amount,
  visitorId = 'vis_crouk',
  phone: initialPhone = '',
  onPaymentSuccess,
  onPaymentInitiated,
  compact = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wave');
  const [customerPhone, setCustomerPhone] = useState<string>(initialPhone || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [paymentSession, setPaymentSession] = useState<{
    reference: string;
    paymentUrl?: string;
  } | null>(null);

  const methods: PaymentMethod[] = ['wave', 'orange', 'mtn', 'moov', 'djamo', 'jeko'];

  /**
   * Official payment initiation calling the backend proxy route with exponential backoff protection
   */
  const initiatePayment = async (
    order: string | undefined,
    payAmount: number,
    method: PaymentMethod
  ) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = normalizeIvorianPhone(customerPhone);
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Veuillez saisir votre numéro de téléphone (Orange, MTN, Moov ou Wave).');
      return;
    }

    setIsProcessing(true);

    const effectiveOrderId = order || `ORD-${Date.now().toString(36).toUpperCase()}`;

    try {
      const response = await fetch('/api/tickets/jeko-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: effectiveOrderId,
          amount: payAmount,
          method,
          paymentMethod: method,
          phone: cleanPhone,
          visitorId,
          type: payAmount >= 2000 ? 'souche' : 'unitaire',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Erreur lors de l\'initialisation du paiement');
      }

      setPaymentSession({
        reference: data.reference,
        paymentUrl: data.paymentUrl,
      });

      if (onPaymentInitiated && data.paymentUrl) {
        onPaymentInitiated(data.paymentUrl, data.reference);
      }

      // If a payment checkout URL was returned, redirect or open checkout
      if (data.paymentUrl && data.paymentUrl.startsWith('http')) {
        window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
      }

      setSuccessMsg(`Session de paiement Jèko (${method.toUpperCase()}) initialisée.`);
    } catch (err: any) {
      console.error('[PaymentMethodSelector Error]:', err);
      setErrorMsg(err.message || 'Impossible d\'initier le paiement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    await initiatePayment(orderId, amount, selectedMethod);
  };

  // Check real payment status on Jeko servers
  const checkSessionStatus = async () => {
    if (!paymentSession) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tickets/jeko-status/${encodeURIComponent(paymentSession.reference)}`);
      const data = await res.json();
      if (data.success && data.status === 'SUCCESSFUL' && data.tickets?.length > 0) {
        setSuccessMsg('✅ Paiement Jèko confirmé avec succès ! Ticket repas généré.');
        if (onPaymentSuccess) {
          onPaymentSuccess(data.tickets);
        }
      } else if (data.status === 'FAILED') {
        setErrorMsg(data.message || 'Le paiement a échoué ou a expiré sur Jèko.');
      } else {
        setSuccessMsg(data.message || 'Paiement en attente de validation sur votre mobile. Complétez le paiement puis réessayez.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la vérification');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Passerelle Jèko Pay CI
          </span>
          <h3 className="font-black text-slate-950 text-sm sm:text-base">
            Sélectionnez votre méthode de paiement
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Montant</span>
          <span className="font-black text-sm sm:text-base text-slate-900">
            {amount.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>

      {/* ERROR / SUCCESS NOTIFICATIONS */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-800 font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* METHODS GRID (WAVE, ORANGE, MTN, MOOV, DJAMO, JEKO) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {methods.map((method) => {
          const cfg = METHODS_CONFIG[method];
          const isSelected = selectedMethod === method;

          return (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer relative ${
                isSelected
                  ? `border-2 ${cfg.borderActive} bg-slate-50 shadow-sm ring-2 ${cfg.ringColor}`
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              {cfg.icon}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900 tracking-tight">
                    {method.toUpperCase()}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block truncate">
                  {cfg.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* PHONE INPUT */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
          <span>Numéro de téléphone ({METHODS_CONFIG[selectedMethod].label})</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            +225
          </span>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Ex: 07 01 02 03 04"
            className="w-full pl-13 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* ACTIVE SESSION BANNER IF INITIATED */}
      {paymentSession && paymentSession.paymentUrl && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Page de paiement Jèko prête</span>
          </div>
          <a
            href={paymentSession.paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 hover:bg-emerald-700 transition-colors"
          >
            <span>Ouvrir</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full sm:flex-1 py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Traitement sécurisé...</span>
            </>
          ) : (
            <>
              <span>Payer {amount.toLocaleString('fr-FR')} FCFA avec {selectedMethod.toUpperCase()}</span>
            </>
          )}
        </button>

        {paymentSession && (
          <button
            type="button"
            onClick={checkSessionStatus}
            disabled={isProcessing}
            title="Vérifier la confirmation de paiement"
            className="w-full sm:w-auto py-3 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Vérifier validation</span>
          </button>
        )}
      </div>
    </div>
  );
};
