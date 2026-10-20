import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ticket, 
  ShieldCheck, 
  Clock, 
  QrCode, 
  CheckCircle2, 
  Smartphone, 
  ChevronRight,
  Info,
  Hash,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import type { VirtualTicket, MomoPayResponse } from '../types';
import { generateQRCodeSVG } from '../utils/qrcode';
import { 
  validateIvorianPhoneNumber, 
  detectIvorianOperator, 
  normalizeIvorianPhone 
} from '../utils/phoneValidator';

interface StudentTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  initialMethod?: 'MTN_MOMO' | 'MOOV_MONEY' | 'DEMO';
  initialPack?: 'unitaire' | 'souche';
  autoOpenPayForm?: boolean;
}

export const StudentTicketsModal: React.FC<StudentTicketsModalProps> = ({
  isOpen,
  onClose,
  visitorId,
  initialMethod = 'MOOV_MONEY',
  initialPack = 'unitaire',
  autoOpenPayForm = false,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'tickets'>('buy');
  const [tickets, setTickets] = useState<VirtualTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  
  // Payment states
  const [selectedPack, setSelectedPack] = useState<'unitaire' | 'souche'>(initialPack);
  const [selectedMethod, setSelectedMethod] = useState<'MTN_MOMO' | 'MOOV_MONEY' | 'DEMO'>(initialMethod);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [rejectedKeyInfo, setRejectedKeyInfo] = useState<{
    message: string;
    detail: string;
  } | null>(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);
  const [showPayForm, setShowPayForm] = useState<boolean>(autoOpenPayForm);

  useEffect(() => {
    if (isOpen) {
      if (initialMethod) setSelectedMethod(initialMethod);
      if (initialPack) setSelectedPack(initialPack);
      setShowPayForm(Boolean(autoOpenPayForm));
      setPayError(null);
      setRejectedKeyInfo(null);
    }
  }, [isOpen, initialMethod, initialPack, autoOpenPayForm]);

  // QR presentation modal for the canteen counter
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<VirtualTicket | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [liveSeconds, setLiveSeconds] = useState<number>(0);

  // Fetch student tickets
  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await fetch(`/api/tickets/my-tickets?visitorId=${encodeURIComponent(visitorId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.tickets) {
          setTickets(json.tickets);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [merchantCode, setMerchantCode] = useState<string>('');

  // Fetch payment config (receiver phone & code)
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/tickets/payment-config');
      if (res.ok) {
        const json = await res.json();
        if (json.config) {
          if (json.config.momoReceiverPhone) setReceiverPhone(json.config.momoReceiverPhone);
          if (json.config.momoMerchantCode) setMerchantCode(json.config.momoMerchantCode);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyTickets();
      fetchConfig();
      // Load saved phone if exists
      const savedPhone = localStorage.getItem('crouk_student_momo_phone');
      if (savedPhone) setPhoneNumber(savedPhone);
    }
  }, [isOpen, visitorId]);

  // Live anti-screenshot timer when viewing QR
  useEffect(() => {
    if (!selectedTicketForQR) return;
    const interval = setInterval(() => {
      setLiveSeconds((s) => (s + 1) % 60);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTicketForQR]);

  // Generate QR SVG when ticket is selected
  useEffect(() => {
    if (selectedTicketForQR) {
      const payload = JSON.stringify({
        id: selectedTicketForQR.id,
        securityCode: selectedTicketForQR.securityCode,
        type: selectedTicketForQR.type,
      });
      generateQRCodeSVG(payload).then((svg) => setQrSvg(svg));
    } else {
      setQrSvg('');
    }
  }, [selectedTicketForQR]);

  // Handle Payment submission
  const handlePay = async (e?: React.FormEvent, forceSimulation: boolean = false) => {
    if (e) e.preventDefault();
    setPayError(null);
    setRejectedKeyInfo(null);
    setPaySuccessMsg(null);

    // 1. Strict Ivorian Phone Validation
    if (!forceSimulation && selectedMethod !== 'DEMO') {
      const validation = validateIvorianPhoneNumber(phoneNumber, selectedMethod);
      if (!validation.valid) {
        setPayError(validation.error || 'Numéro invalide pour cet opérateur.');
        return;
      }
    }

    const cleanPhone = normalizeIvorianPhone(phoneNumber);

    try {
      setIsProcessingPay(true);
      if (cleanPhone) {
        localStorage.setItem('crouk_student_momo_phone', cleanPhone);
      }

      const res = await fetch('/api/tickets/pay-momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone || '0500000000',
          type: selectedPack,
          visitorId,
          paymentMethod: selectedMethod,
          forceSimulation,
        }),
      });

      const data: MomoPayResponse = await res.json();

      if (!res.ok || !data.success) {
        if (data.status === 'REJECTED_KEY') {
          setRejectedKeyInfo({
            message: data.message,
            detail: data.errorDetail || 'Erreur réseau MTN MoMo (HTTP 401)',
          });
          return;
        }
        throw new Error(data.message || data.errorDetail || 'Échec de la transaction');
      }

      setPaySuccessMsg(data.message);

      // Refresh tickets list and switch to tickets tab
      await fetchMyTickets();
      setShowPayForm(false);
      setActiveTab('tickets');
    } catch (err: any) {
      setPayError(err.message || 'Erreur lors du traitement. Veuillez réessayer.');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const validTicketsCount = tickets.filter((t) => t.status === 'valid').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] rounded-[32px] max-w-xl w-full shadow-2xl border border-black/10 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="bg-[#18181B] text-white p-4 sm:p-5 flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#005CA9] text-white flex items-center justify-center font-black shadow-md">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                  Billetterie CROU-K
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#005CA9] text-white">
                  🔵 Moov Money
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FFCC00] text-slate-950">
                  🟡 MTN MoMo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Paiement direct USSD • Resto U Peleforo Gon Coulibaly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-white border-b border-black/5 px-4 pt-3 flex gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('buy');
              setShowPayForm(false);
            }}
            className={`flex-1 pb-3 text-xs sm:text-sm font-black border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'buy'
                ? 'border-[#FFCC00] text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>💳 Acheter un Ticket</span>
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 pb-3 text-xs sm:text-sm font-black border-b-2 transition-colors flex items-center justify-center gap-1.5 relative ${
              activeTab === 'tickets'
                ? 'border-[#FFCC00] text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>🎟️ Mes Tickets</span>
            {validTicketsCount > 0 && (
              <span className="ml-1 px-2 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                {validTicketsCount} valide{validTicketsCount > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {paySuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{paySuccessMsg}</span>
            </div>
          )}

          {payError && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-2.5 text-xs text-rose-900 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{payError}</span>
            </div>
          )}

          {/* TAB 1: BUY TICKETS (CLEAR COLORFUL TABLES WITH PRICES AT BOTTOM) */}
          {activeTab === 'buy' && !showPayForm && (
            <div className="space-y-4">
              <div className="text-center max-w-md mx-auto">
                <h4 className="font-black text-slate-900 text-base">
                  Sélectionnez votre formule de ticket repas
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tarifs officiels subventionnés du CROU Korhogo (UPGC)
                </p>
              </div>

              {/* SÉLECTEUR RAPIDE D'OPÉRATEUR EN HAUT DE PAGE */}
              <div className="bg-white p-3.5 rounded-3xl border border-black/10 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📲</span>
                    <span>Opérateur Mobile Money par défaut :</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Cliquer pour pré-sélectionner
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MOOV_MONEY')}
                    className={`py-2 px-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                      selectedMethod === 'MOOV_MONEY'
                        ? 'bg-[#005CA9] text-white border-[#005CA9] shadow-xs ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-700 border-black/5 hover:bg-slate-100'
                    }`}
                  >
                    <span>🔵</span>
                    <span>Moov Flooz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MTN_MOMO')}
                    className={`py-2 px-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                      selectedMethod === 'MTN_MOMO'
                        ? 'bg-[#FFCC00] text-slate-950 border-[#FFCC00] shadow-xs ring-2 ring-amber-300'
                        : 'bg-slate-50 text-slate-700 border-black/5 hover:bg-slate-100'
                    }`}
                  >
                    <span>🟡</span>
                    <span>MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('DEMO')}
                    className={`py-2 px-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                      selectedMethod === 'DEMO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                        : 'bg-slate-50 text-slate-700 border-black/5 hover:bg-slate-100'
                    }`}
                  >
                    <span>🧪</span>
                    <span>Test Cantine</span>
                  </button>
                </div>
              </div>

              {/* TABLEAU COLORÉ 1 : TICKET UNITAIRE 200 FCFA (AMBER / JAUNE CROU) */}
              <div className="bg-amber-50/80 rounded-3xl border-2 border-amber-400 p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFCC00] text-slate-950 flex items-center justify-center font-black shadow-xs text-lg">
                      🍽️
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-[#FFCC00]/50 px-2 py-0.5 rounded-full">
                        Formule Quotidienne
                      </span>
                      <h5 className="font-black text-slate-950 text-base sm:text-lg mt-0.5">
                        Ticket Unitaire · 1 Repas
                      </h5>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-full border border-amber-300">
                    1 Passage
                  </span>
                </div>

                {/* TABLE DÉTAILS DU TICKET */}
                <div className="mt-3 bg-white/70 rounded-2xl border border-amber-200 p-3 text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Contenu :</span>
                    <span className="font-bold text-slate-900">Entrée + Plat chaud + Pain</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Service :</span>
                    <span className="font-bold text-slate-900">Midi (11h30-14h30) ou Soir (18h30-21h)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Sécurité :</span>
                    <span className="font-bold text-emerald-700">Code secret 6 chiffres anti-fraude</span>
                  </div>
                </div>

                {/* BAS DU TABLEAU : PRIX EN BAS ET BOUTONS DE SÉLECTION DIRECTS */}
                <div className="mt-4 pt-3 border-t border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Prix du ticket
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
                      200 <span className="text-xs font-bold text-slate-600">FCFA</span>
                    </div>
                  </div>

                  {/* BOUTONS DIRECTS PAR OPÉRATEUR */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedPack('unitaire');
                        setSelectedMethod('MOOV_MONEY');
                        setShowPayForm(true);
                        setPayError(null);
                        setRejectedKeyInfo(null);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#005CA9] hover:bg-[#004d8c] text-white rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      title="Payer 200 FCFA avec Moov Money"
                    >
                      <span>🔵 Payer Moov (200 F)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPack('unitaire');
                        setSelectedMethod('MTN_MOMO');
                        setShowPayForm(true);
                        setPayError(null);
                        setRejectedKeyInfo(null);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#FFCC00] hover:bg-[#f0c000] text-slate-950 rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      title="Payer 200 FCFA avec MTN MoMo"
                    >
                      <span>🟡 Payer MTN (200 F)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLEAU COLORÉ 2 : SOUCHE DE 10 TICKETS 2000 FCFA (ÉMERAUDE / INDIGO) */}
              <div className="bg-emerald-50/80 rounded-3xl border-2 border-emerald-500 p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs text-lg">
                      🎟️
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-full">
                        Carnet Économique
                      </span>
                      <h5 className="font-black text-slate-950 text-base sm:text-lg mt-0.5">
                        Souche de Tickets · 10 Repas
                      </h5>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-900 bg-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300">
                    10 Passages
                  </span>
                </div>

                {/* TABLE DÉTAILS DE LA SOUCHE */}
                <div className="mt-3 bg-white/70 rounded-2xl border border-emerald-200 p-3 text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Contenu :</span>
                    <span className="font-bold text-slate-900">10 repas complets détachables (1/10 à 10/10)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Durée de validité :</span>
                    <span className="font-bold text-slate-900">Toute l'année universitaire 2025</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Avantage :</span>
                    <span className="font-bold text-emerald-700">Un seul paiement, pas d'attente chaque jour</span>
                  </div>
                </div>

                {/* BAS DU TABLEAU : PRIX EN BAS ET BOUTONS DE SÉLECTION DIRECTS */}
                <div className="mt-4 pt-3 border-t border-emerald-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Prix de la souche
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
                      2 000 <span className="text-xs font-bold text-slate-600">FCFA</span>
                    </div>
                  </div>

                  {/* BOUTONS DIRECTS PAR OPÉRATEUR */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedPack('souche');
                        setSelectedMethod('MOOV_MONEY');
                        setShowPayForm(true);
                        setPayError(null);
                        setRejectedKeyInfo(null);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#005CA9] hover:bg-[#004d8c] text-white rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      title="Payer 2 000 FCFA avec Moov Money"
                    >
                      <span>🔵 Payer Moov (2 000 F)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPack('souche');
                        setSelectedMethod('MTN_MOMO');
                        setShowPayForm(true);
                        setPayError(null);
                        setRejectedKeyInfo(null);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#FFCC00] hover:bg-[#f0c000] text-slate-950 rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      title="Payer 2 000 FCFA avec MTN MoMo"
                    >
                      <span>🟡 Payer MTN (2 000 F)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* BARRE D'INFORMATION MOYENS DE PAIEMENT EN BAS */}
              <div className="p-3 bg-white rounded-2xl border border-black/5 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                <span className="font-bold text-slate-800">Passerelles certifiées :</span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-black text-xs flex items-center gap-1">
                    🔵 Moov Money (Flooz)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#FFCC00]/30 text-amber-950 font-black text-xs flex items-center gap-1">
                    🟡 MTN MoMo
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPack('unitaire');
                      setSelectedMethod('DEMO');
                      setShowPayForm(true);
                    }}
                    className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-black text-xs flex items-center gap-1 hover:bg-emerald-200"
                  >
                    🧪 Mode Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1 - STEP 2: MTN MOMO PHONE INPUT & CONFIRMATION */}
          {activeTab === 'buy' && showPayForm && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowPayForm(false);
                  setRejectedKeyInfo(null);
                  setPayError(null);
                }}
                className="text-xs font-bold text-slate-600 hover:text-black flex items-center gap-1 transition-colors"
              >
                ← Retour au choix des tickets
              </button>

              {/* RECAP TABLEAU */}
              <div className="bg-white p-4 rounded-3xl border border-black/10 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Formule choisie
                  </span>
                  <h5 className="font-black text-slate-950 text-base">
                    {selectedPack === 'unitaire' ? 'Ticket Unitaire (1 Repas)' : 'Souche de 10 Repas'}
                  </h5>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Total à payer
                  </span>
                  <div className="text-xl font-black text-slate-950">
                    {selectedPack === 'unitaire' ? '200 FCFA' : '2 000 FCFA'}
                  </div>
                </div>
              </div>

              {/* FORMULAIRE MULTI-OPÉRATEURS (MTN / MOOV / SIMULATION) */}
              <div className="bg-white p-5 rounded-3xl border border-black/10 shadow-xs space-y-4">
                {/* SÉLECTEUR D'OPÉRATEUR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Choisissez votre opérateur de paiement Mobile Money :
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('MOOV_MONEY');
                        setPayError(null);
                        setRejectedKeyInfo(null);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
                        selectedMethod === 'MOOV_MONEY'
                          ? 'bg-[#005CA9] text-white shadow-xs ring-2 ring-[#005CA9]/50'
                          : 'text-slate-600 hover:text-slate-950 bg-white/60'
                      }`}
                    >
                      <span className="text-base">🔵</span>
                      <span className="leading-tight">Moov Flooz</span>
                      <span className="text-[9px] opacity-80 font-normal">01... (*155#)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('MTN_MOMO');
                        setPayError(null);
                        setRejectedKeyInfo(null);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
                        selectedMethod === 'MTN_MOMO'
                          ? 'bg-[#FFCC00] text-slate-950 shadow-xs ring-2 ring-[#FFCC00]/50'
                          : 'text-slate-600 hover:text-slate-950 bg-white/60'
                      }`}
                    >
                      <span className="text-base">🟡</span>
                      <span className="leading-tight">MTN MoMo</span>
                      <span className="text-[9px] opacity-80 font-normal">05... (*133#)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('DEMO');
                        setPayError(null);
                        setRejectedKeyInfo(null);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
                        selectedMethod === 'DEMO'
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/50'
                          : 'text-slate-600 hover:text-slate-950 bg-white/60'
                      }`}
                    >
                      <span className="text-base">🧪</span>
                      <span className="leading-tight">Simulation</span>
                      <span className="text-[9px] opacity-80 font-normal">Essai gratuit</span>
                    </button>
                  </div>
                </div>

                {/* EN-TÊTE OPÉRATEUR SÉLECTIONNÉ */}
                <div className="flex items-center gap-2 pb-2 border-b border-black/5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                    selectedMethod === 'MTN_MOMO' 
                      ? 'bg-[#FFCC00] text-slate-950' 
                      : selectedMethod === 'MOOV_MONEY'
                      ? 'bg-[#005CA9] text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {selectedMethod === 'MTN_MOMO' ? '🟡' : selectedMethod === 'MOOV_MONEY' ? '🔵' : '🧪'}
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                      {selectedMethod === 'MTN_MOMO' 
                        ? 'Paiement Sécurisé MTN Mobile Money' 
                        : selectedMethod === 'MOOV_MONEY'
                        ? 'Paiement Sécurisé Moov Money (Flooz)'
                        : 'Mode Simulation / Test Cantine'}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      {selectedMethod === 'MOOV_MONEY'
                        ? 'Protocole USSD Push direct · Code PIN sur mobile'
                        : selectedMethod === 'MTN_MOMO'
                        ? 'Régie CROU-K · Campus Peleforo Gon Coulibaly'
                        : 'Aucun compte débité · Essai immédiat guichet'}
                    </p>
                  </div>
                </div>

                {/* INSTRUCTIONS DE TRANSFERT DIRECT OU COMPTE RÉCEPTEUR */}
                {selectedMethod === 'MTN_MOMO' && receiverPhone && (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <span>📲</span>
                        <span>Compte Caisse MTN CROU-K :</span>
                      </span>
                      <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-lg text-xs">
                        {receiverPhone}
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Effectuez le paiement de <strong>{selectedPack === 'unitaire' ? '200 FCFA' : '2 000 FCFA'}</strong> sur ce numéro MTN ou via code MoMo Pay {merchantCode ? `(${merchantCode})` : '(*133#)'}.
                    </p>

                    <div className="pt-1">
                      <a
                        href={`tel:${merchantCode ? encodeURIComponent(merchantCode) : '*133%23'}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-[11px] shadow-xs transition-transform active:scale-95"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Composer le code MoMo (*133#) sur mon mobile</span>
                      </a>
                    </div>
                  </div>
                )}

                {selectedMethod === 'MOOV_MONEY' && (
                  <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 flex items-center gap-1.5">
                        <span>📲</span>
                        <span>Passerelle Moov Money (Flooz) :</span>
                      </span>
                      <span className="font-mono font-black text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded-lg text-xs">
                        *155#
                      </span>
                    </div>

                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Saisissez votre numéro Moov CI (01...). Un pop-up USSD <strong>Push Moov Money</strong> apparaîtra directement sur l'écran de votre téléphone pour taper votre code secret et autoriser les <strong>{selectedPack === 'unitaire' ? '200 FCFA' : '2 000 FCFA'}</strong>.
                    </p>
                  </div>
                )}

                {selectedMethod === 'DEMO' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1 text-xs text-emerald-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🧪</span>
                      <span>Mode Démonstration Actif</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Cette option permet de tester instantanément l'émission de vrais tickets CROU-K (avec QR code et code secret) et de tester le scanner guichetier sans débiter de compte bancaire.
                    </p>
                  </div>
                )}

                <form onSubmit={(e) => handlePay(e, selectedMethod === 'DEMO')} className="space-y-4">
                  {selectedMethod !== 'DEMO' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Numéro de téléphone ({selectedMethod === 'MOOV_MONEY' ? 'Moov CI · 01...' : 'MTN CI · 05...'}) :
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">
                          10 chiffres requis
                        </span>
                      </div>

                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Smartphone className={`w-4 h-4 ${selectedMethod === 'MOOV_MONEY' ? 'text-blue-500' : 'text-amber-500'}`} />
                          <span>🇨🇮 +225</span>
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder={selectedMethod === 'MOOV_MONEY' ? '01 02 03 04 05' : '05 01 23 45 67'}
                          className={`w-full pl-24 pr-4 py-3 bg-slate-50 rounded-2xl border text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                            selectedMethod === 'MOOV_MONEY'
                              ? 'border-blue-200 focus:ring-blue-400'
                              : 'border-amber-200 focus:ring-amber-400'
                          }`}
                          autoFocus
                          required
                        />
                      </div>

                      {/* DÉTECTION & VALIDATION EN TEMPS RÉEL DU NUMÉRO */}
                      {(() => {
                        const clean = normalizeIvorianPhone(phoneNumber);
                        const op = detectIvorianOperator(clean);
                        if (!clean) {
                          return (
                            <p className="text-[10px] text-slate-400 mt-1">
                              {selectedMethod === 'MOOV_MONEY'
                                ? 'Les numéros Moov CI commencent par 01 (ex: 01 02 03 04 05)'
                                : 'Les numéros MTN CI commencent par 05 (ex: 05 01 23 45 67)'}
                            </p>
                          );
                        }

                        if (op === 'MOOV') {
                          if (selectedMethod === 'MOOV_MONEY') {
                            return (
                              <div className="flex items-center justify-between mt-1 text-[11px] text-blue-700 font-bold">
                                <span>🔵 Numéro Moov Africa valide ({clean.length}/10 chiffres)</span>
                                {clean.length === 10 ? <span className="text-emerald-600">✓ Prêt pour débit USSD</span> : <span className="text-slate-400">{10 - clean.length} restant(s)</span>}
                              </div>
                            );
                          } else {
                            return (
                              <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center justify-between">
                                <span>⚠️ Ce numéro commence par 01 (Moov).</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMethod('MOOV_MONEY')}
                                  className="font-black text-blue-700 underline hover:text-blue-900 ml-2"
                                >
                                  Basculer sur Moov Money →
                                </button>
                              </div>
                            );
                          }
                        }

                        if (op === 'MTN') {
                          if (selectedMethod === 'MTN_MOMO') {
                            return (
                              <div className="flex items-center justify-between mt-1 text-[11px] text-amber-800 font-bold">
                                <span>🟡 Numéro MTN valide ({clean.length}/10 chiffres)</span>
                                {clean.length === 10 ? <span className="text-emerald-600">✓ Prêt pour débit MoMo</span> : <span className="text-slate-400">{10 - clean.length} restant(s)</span>}
                              </div>
                            );
                          } else {
                            return (
                              <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-center justify-between">
                                <span>⚠️ Ce numéro commence par 05 (MTN).</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMethod('MTN_MOMO')}
                                  className="font-black text-amber-900 underline hover:text-black ml-2"
                                >
                                  Basculer sur MTN MoMo →
                                </button>
                              </div>
                            );
                          }
                        }

                        if (op === 'ORANGE') {
                          return (
                            <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-bold">
                              ⚠️ Numéro Orange (07...) non accepté : insérez un numéro Moov (01...) ou MTN (05...).
                            </div>
                          );
                        }

                        return (
                          <div className="mt-1 text-[10px] text-slate-500 font-medium">
                            Numéro en cours de saisie ({clean.length}/10) · Moov débute par 01, MTN par 05.
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* AVERTISSEMENT DE DÉBIT RÉEL */}
                  {selectedMethod !== 'DEMO' && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl text-[11px] text-slate-700 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Débit direct sur mobile :</strong> La somme de <strong>{selectedPack === 'unitaire' ? '200 FCFA' : '2 000 FCFA'}</strong> sera prélevée sur votre compte <strong>{selectedMethod === 'MOOV_MONEY' ? 'Moov Money (01...)' : 'MTN MoMo (05...)'}</strong> après saisie de votre code secret PIN.
                      </span>
                    </div>
                  )}

                  {/* ALERTE SI ERREUR OU BESOIN DE DÉMO */}
                  {rejectedKeyInfo && (
                    <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 text-left">
                      <div className="flex items-start gap-2 text-rose-900">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-black text-xs text-rose-950">
                            INFORMATION PAIEMENT
                          </div>
                          <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                            {rejectedKeyInfo.message}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handlePay(undefined, true)}
                          disabled={isProcessingPay}
                          className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-98"
                        >
                          <span>🧪 Générer le ticket en Mode Test Cantine</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!rejectedKeyInfo && (
                    <button
                      type="submit"
                      disabled={isProcessingPay}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 ${
                        selectedMethod === 'MOOV_MONEY'
                          ? 'bg-[#005CA9] hover:bg-[#004d8c] text-white'
                          : selectedMethod === 'DEMO'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#FFCC00] hover:bg-[#f0c000] text-slate-950'
                      }`}
                    >
                      {isProcessingPay ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>
                            {selectedMethod === 'MOOV_MONEY'
                              ? 'Envoi Push Moov Flooz en cours...'
                              : selectedMethod === 'DEMO'
                              ? 'Génération ticket test...'
                              : 'Vérification MTN MoMo en cours...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            {selectedMethod === 'MOOV_MONEY'
                              ? `Payer par Moov Money (${selectedPack === 'unitaire' ? '200 FCFA' : '2 000 FCFA'})`
                              : selectedMethod === 'DEMO'
                              ? `Générer immédiatement (${selectedPack === 'unitaire' ? '1 ticket test' : '10 tickets test'})`
                              : `Valider le paiement MTN MoMo (${selectedPack === 'unitaire' ? '200 FCFA' : '2 000 FCFA'})`}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}

                  {/* OPTION DE TEST CROU SANS ARGENT */}
                  {selectedMethod !== 'DEMO' && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod('DEMO');
                          handlePay(undefined, true);
                        }}
                        disabled={isProcessingPay}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline transition-colors"
                      >
                        Ou tester gratuitement en mode Simulation CROU (essai guichet)
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}


          {/* TAB 2: MY TICKETS LIST (CLEAN, NO CLUTTERED QR CODES) */}
          {activeTab === 'tickets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    Mes Tickets CROU-K ({tickets.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Présentez votre ticket au guichet pour déjeuner ou dîner.
                  </p>
                </div>
                <button
                  onClick={fetchMyTickets}
                  disabled={loadingTickets}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Actualiser la liste"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {tickets.length === 0 ? (
                <div className="bg-white rounded-3xl border border-black/5 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#FFCC00] mx-auto flex items-center justify-center font-black">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-sm">
                      Aucun ticket actif pour le moment
                    </h5>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                      Achetez votre ticket unitaire (200 F) ou une souche (2 000 F) pour vous restaurer au self.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('buy')}
                    className="px-5 py-2.5 bg-[#FFCC00] hover:bg-[#f0c000] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95"
                  >
                    Acheter un ticket maintenant
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {tickets.map((ticket) => {
                    const isValid = ticket.status === 'valid';
                    const isCarnet = ticket.type === 'carnet_unit';
                    const isSim = ticket.isSimulation;

                    return (
                      <div
                        key={ticket.id}
                        className={`rounded-2xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                          isValid
                            ? 'bg-white border-black/10 shadow-xs hover:border-amber-400'
                            : 'bg-slate-100/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isValid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600 line-through'
                              }`}
                            >
                              {isValid ? '✅ VALIDE' : '⛔ UTILISÉ'}
                            </span>

                            {isSim && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                                🧪 Test
                              </span>
                            )}

                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {ticket.paymentMethod || 'MOMO'}
                            </span>
                          </div>

                          <h5 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                            {ticket.label}
                          </h5>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                              Code : {ticket.securityCode}
                            </span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        </div>

                        {isValid ? (
                          <button
                            onClick={() => setSelectedTicketForQR(ticket)}
                            className="px-3 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#FFCC00]" />
                            <span>Présenter au guichet</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic shrink-0">
                            Consommé
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-white border-t border-black/5 px-4 text-center text-[11px] text-slate-400 font-medium shrink-0">
          CROU Korhogo · Université Peleforo Gon Coulibaly · Tarifs 200 F / 2000 F
        </div>
      </div>

      {/* POPUP SÉCURISÉ DU QR CODE (SEULEMENT QUAND L'ÉTUDIANT VEUT MANGER AU GUICHET) */}
      {selectedTicketForQR && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-black/10 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedTicketForQR(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                TICKET CROU-K VALIDE
              </span>
              <h4 className="font-black text-slate-900 text-base mt-2">
                {selectedTicketForQR.label}
              </h4>
              <p className="text-xs text-slate-500">
                Faites scanner ce code ou donnez le code à 6 chiffres au guichetier
              </p>
            </div>

            {/* GRAND CODE DE SÉCURITÉ À 6 CHIFFRES POUR LE CAISSIER */}
            <div className="bg-slate-900 text-white p-3 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Code Rapide Caisse
              </div>
              <div className="text-2xl font-mono font-black tracking-widest text-[#FFCC00]">
                {selectedTicketForQR.securityCode}
              </div>
            </div>

            {/* QR CODE SÉCURISÉ SVG */}
            <div className="p-3 bg-white rounded-2xl border-2 border-black/5 shadow-inner inline-block mx-auto">
              {qrSvg ? (
                <div
                  className="w-48 h-48 mx-auto"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}
            </div>

            {/* CHRONOMÈTRE ANTI-CAPTURE D'ÉCRAN */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Actualisation de sécurité : {liveSeconds}s</span>
            </div>

            <button
              onClick={() => setSelectedTicketForQR(null)}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-sm transition-transform active:scale-98"
            >
              Fermer et ranger le ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
