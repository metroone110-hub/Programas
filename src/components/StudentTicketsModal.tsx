import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Ticket, 
  ShieldCheck, 
  Clock, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  RotateCw, 
  Smartphone, 
  ChevronRight,
  Info,
  Hash,
  ShoppingBag
} from 'lucide-react';
import type { VirtualTicket } from '../types';
import { generateQRCodeSVG } from '../utils/qrcode';
import { getOrGenerateVisitorId } from '../utils/analytics';

interface StudentTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketsUpdated?: () => void;
}

export const StudentTicketsModal: React.FC<StudentTicketsModalProps> = ({
  isOpen,
  onClose,
  onTicketsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'my_tickets' | 'buy'>('my_tickets');
  const [tickets, setTickets] = useState<VirtualTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<VirtualTicket | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isGeneratingDemo, setIsGeneratingDemo] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Live anti-screenshot chronometer state (HH:MM:SS.ms)
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    let animFrame: number;
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds() / 100));
      setLiveTime(`${h}:${m}:${s}.${ms}`);
      animFrame = requestAnimationFrame(updateTime);
    };
    animFrame = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const visitorId = getOrGenerateVisitorId();
      const res = await fetch(`/api/tickets/my-tickets?visitorId=${encodeURIComponent(visitorId)}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Erreur chargement tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen]);

  // When a ticket is clicked to present the QR code
  useEffect(() => {
    if (selectedTicketForQR) {
      generateQRCodeSVG(selectedTicketForQR.token).then(svg => {
        setQrSvg(svg);
      });
    } else {
      setQrSvg('');
    }
  }, [selectedTicketForQR]);

  const handleGenerateDemoTicket = async (type: 'unitaire' | 'souche') => {
    try {
      setIsGeneratingDemo(true);
      setDemoNotice(null);
      const visitorId = getOrGenerateVisitorId();
      const res = await fetch('/api/tickets/create-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, type }),
      });
      const data = await res.json();
      if (data.success) {
        setDemoNotice(
          type === 'souche' 
            ? '✅ Souche de 10 tickets (2 000 FCFA) ajoutée à votre carnet !' 
            : '✅ 1 Ticket repas unitaire (200 FCFA) ajouté avec succès !'
        );
        await fetchTickets();
        if (onTicketsUpdated) onTicketsUpdated();
        setActiveTab('my_tickets');
      }
    } catch (err) {
      console.error('Erreur génération ticket démo:', err);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  if (!isOpen) return null;

  const validTickets = tickets.filter(t => t.status === 'valid');
  const usedTickets = tickets.filter(t => t.status === 'used');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className="bg-[#FAF7F2] text-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-black/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-amber-900 flex items-center justify-center font-black border border-amber-200 shadow-xs">
              <Ticket className="w-5 h-5 text-[#92400E]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-slate-950 leading-tight">
                  Tickets Virtuels Resto U
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#18181B] text-white">
                  CROU-K
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                UPGC Korhogo • Mon Carnet de Repas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="p-3 bg-white/70 border-b border-black/5 shrink-0 flex gap-2">
          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'my_tickets'
                ? 'bg-[#18181B] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ticket className="w-4 h-4 text-[#F5B726]" />
            <span>Mes Tickets</span>
            {validTickets.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F5B726] text-slate-950 text-[10px] font-black">
                {validTickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'buy'
                ? 'bg-[#18181B] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#F5B726]" />
            <span>Tarifs & Achat</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
              Bientôt
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1 space-y-4">
          {demoNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
              <span>{demoNotice}</span>
              <button 
                onClick={() => setDemoNotice(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: MES TICKETS */}
          {activeTab === 'my_tickets' && (
            <div className="space-y-4">
              {/* Summary Header */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-[#18181B] to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-[#F5B726]/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Solde actif Resto U
                    </span>
                    <h4 className="text-2xl font-black mt-0.5">
                      {validTickets.length} {validTickets.length > 1 ? 'tickets valides' : 'ticket valide'}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      Valeur : <span className="font-bold text-white">{validTickets.length * 200} FCFA</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-[#F5B726] border border-amber-400/30 flex items-center justify-center font-black">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Tarif réglementaire : 200 FCFA / repas</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Guichet UPGC ouvert
                  </span>
                </div>
              </div>

              {/* List of Valid Tickets */}
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-[#F5B726]" />
                  Chargement de vos tickets...
                </div>
              ) : validTickets.length === 0 ? (
                <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">
                      Aucun ticket actif pour le moment
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Les tickets achetés ou de test apparaîtront ici avec leur QR code sécurisé anti-fraude.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('buy')}
                      className="px-4 py-2 rounded-2xl bg-[#18181B] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm hover:bg-black transition-transform active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#F5B726]" />
                      Voir les tarifs & Tester
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                    Tickets prêts pour le self ({validTickets.length})
                  </h5>
                  {validTickets.map((tk) => (
                    <div
                      key={tk.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white border border-black/5 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] text-amber-900 flex flex-col items-center justify-center font-black border border-amber-200 shrink-0">
                          <span className="text-xs">200</span>
                          <span className="text-[8px] font-black uppercase text-amber-800">FCFA</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-xs">
                              {tk.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
                              Valide
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            Code : <span className="font-mono font-bold text-slate-800">{tk.securityCode}</span> • Réf: {tk.id}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedTicketForQR(tk)}
                        className="px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-black text-white text-xs font-black flex items-center gap-1.5 shrink-0 shadow-xs transition-transform active:scale-95 group-hover:bg-[#F5B726] group-hover:text-slate-950"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Scanner</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Used Tickets History */}
              {usedTickets.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                    Tickets déjà consommés ({usedTickets.length})
                  </h5>
                  <div className="space-y-2 opacity-75">
                    {usedTickets.map((tk) => (
                      <div
                        key={tk.id}
                        className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-700">{tk.label}</span>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Consommé le {tk.usedAt ? new Date(tk.usedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Récemment'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black">
                          Déjà scanné
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACHAT & TARIFS (AVEC MENTION INDISPONIBLE POUR LE MOMENT) */}
          {activeTab === 'buy' && (
            <div className="space-y-4">
              {/* Notice sobre Achat Bientôt disponible */}
              <div className="p-4 rounded-3xl bg-slate-100/90 border border-slate-200 text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs shrink-0">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-slate-900">
                    Achat via Wave bientôt disponible
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Le paiement des tickets de cantine sera assuré exclusivement via Wave.
                  </p>
                </div>
              </div>

              {/* Tarif Cards */}
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                  Grille tarifaire officielle CROU-K
                </h5>

                {/* Option 1: Ticket Unitaire 200 FCFA */}
                <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FEF3C7] text-amber-900">
                        1 Repas
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-1">
                        Ticket Repas Unitaire
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Valable pour 1 passage au self (déjeuner ou dîner)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-950">200</span>
                      <span className="text-xs font-black text-amber-900 ml-1">FCFA</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Paiement via Wave
                    </span>
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-black cursor-not-allowed flex items-center gap-1.5 opacity-80"
                      title="Paiement temporairement indisponible"
                    >
                      <Lock className="w-3 h-3" />
                      Bientôt disponible
                    </button>
                  </div>
                </div>

                {/* Option 2: Souche de 10 tickets = 2000 FCFA */}
                <div className="p-4 rounded-3xl bg-white border-2 border-amber-300 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#F5B726] text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    Carnet Pratique
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#18181B] text-white">
                        10 Repas (Souche)
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-1">
                        Souche de 10 Tickets
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Carnet complet pour toute la semaine au campus
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-950">2 000</span>
                      <span className="text-xs font-black text-amber-900 ml-1">FCFA</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Paiement via Wave
                    </span>
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-black cursor-not-allowed flex items-center gap-1.5 opacity-80"
                      title="Paiement temporairement indisponible"
                    >
                      <Lock className="w-3 h-3" />
                      Bientôt disponible
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode Test / Démonstration (Allows validating and seeing the tickets) */}
              <div className="p-4 rounded-3xl bg-[#FEF3C7]/60 border border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                  <h5 className="font-black text-xs uppercase tracking-wide">
                    Mode Test & Démonstration
                  </h5>
                </div>
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  Vous pouvez générer un ticket ou un carnet d'essai pour tester le fonctionnement et l'affichage du QR code :
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => handleGenerateDemoTicket('unitaire')}
                    disabled={isGeneratingDemo}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-[#18181B] hover:bg-black text-white text-xs font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <span>+ 1 Ticket d'essai (200 F)</span>
                  </button>
                  <button
                    onClick={() => handleGenerateDemoTicket('souche')}
                    disabled={isGeneratingDemo}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <span>+ Souche 10 tickets (2 000 F)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-black/5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Certifié CROU-K UPGC Korhogo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* SUB-MODAL: PRESENT TICKET QR CODE AT COUNTER */}
      {selectedTicketForQR && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedTicketForQR(null)}
        >
          <div 
            className="bg-white text-slate-950 w-full max-w-sm rounded-[36px] shadow-2xl border-4 border-[#F5B726] p-6 text-center space-y-4 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic animated anti-screenshot background badge */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-[#F5B726] animate-pulse" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#FEF3C7] text-amber-900 border border-amber-200">
                Ticket Officiel CROU-K
              </span>
              <button
                onClick={() => setSelectedTicketForQR(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-black text-lg text-slate-950">
                {selectedTicketForQR.label}
              </h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Présentez ce QR Code au guichet du Resto U
              </p>
            </div>

            {/* LIVE ANTI-SCREENSHOT DYNAMIC BADGE */}
            <div className="px-3 py-2 rounded-2xl bg-slate-900 text-white font-mono text-xs flex items-center justify-between border border-slate-700 shadow-inner">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                EN DIRECT
              </span>
              <span className="font-black text-amber-400 tracking-wider">
                {liveTime}
              </span>
            </div>

            {/* Crisp QR Code Container */}
            <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-inner flex items-center justify-center relative">
              {qrSvg ? (
                <div 
                  className="w-48 h-48 [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }} 
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400 font-bold">
                  Génération du QR Code...
                </div>
              )}
            </div>

            {/* Backup 6-digit Code for manual entry */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Code de secours manuel
              </span>
              <div className="font-mono text-xl font-black text-slate-900 tracking-widest">
                {selectedTicketForQR.securityCode}
              </div>
            </div>

            {/* Anti-fraud safety reminder */}
            <p className="text-[10px] text-slate-400 font-medium">
              🔒 1 passage self • Usage personnel
            </p>

            <button
              onClick={() => setSelectedTicketForQR(null)}
              className="w-full py-3 rounded-2xl bg-[#18181B] text-white text-xs font-black hover:bg-black transition-colors shadow-sm"
            >
              Fermer le ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
