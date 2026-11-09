import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Utensils, 
  Maximize2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Share2,
  FileText,
  BadgeCheck,
  Eye,
  Ticket,
  Send,
  AlertOctagon,
  XCircle
} from 'lucide-react';
import { MealTicket } from '../types';
import { generateTicketQRCodeDataURL } from '../utils/qrcode';
import { ImageWithLoader } from './ImageWithLoader';

const OFFICIAL_CROU_TICKET_IMG = '/assets/aistudio/IMG_1038_80198fc0.jpeg';

interface Props {
  ticket: MealTicket;
  onMarkAsUsed?: (ticketId: string) => void;
  onTransferTicket?: (ticket: MealTicket) => void;
  showActions?: boolean;
}

export const TicketVisual: React.FC<Props> = ({ 
  ticket, 
  onMarkAsUsed,
  onTransferTicket,
  showActions = true 
}) => {
  const [viewMode, setViewMode] = useState<'photo' | 'qrcode'>('qrcode');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    generateTicketQRCodeDataURL({
      ticketNumber: ticket.ticketNumber,
      studentId: ticket.studentId,
      studentMatricule: ticket.studentMatricule,
      canteenId: ticket.canteenId,
      dishName: ticket.dishName,
      date: ticket.date,
      price: ticket.price,
      timestamp: Date.now()
    }).then(url => {
      if (isMounted) setQrDataUrl(url);
    });
    return () => { isMounted = false; };
  }, [ticket]);

  const handleCopyTicketNumber = () => {
    navigator.clipboard.writeText(ticket.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUsed = ticket.status === 'used';

  return (
    <div className="relative w-full max-w-md mx-auto font-sans">
      {/* Zoom overlay for real ticket photo / scanner */}
      {isZoomed && (
        <div 
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-3xl shadow-2xl text-center max-w-lg w-full">
            <div className="flex items-center justify-between mb-3 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span>Vrai Ticket Officiel CROU Korhogo • 2026</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">{ticket.ticketNumber}</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-black">
              <ImageWithLoader
                src={OFFICIAL_CROU_TICKET_IMG}
                alt="Vrai Ticket CROU Korhogo 2 Volets"
                className="w-full max-h-[70vh] object-contain"
                imgClassName="object-contain"
                spiralLabel="Téléchargement du ticket..."
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">{ticket.dishName} ({ticket.price} FCFA)</span>
              <span className="text-orange-400 font-bold">Touchez pour fermer</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Ticket Card Container */}
      <div className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden border transition-all ${
        isUsed ? 'border-2 border-red-500 ring-4 ring-red-500/20' : 'border-orange-200 ring-2 ring-orange-500/15'
      }`}>
        
        {/* Top Header - Republic / CROU Badge */}
        <div className={`p-4 text-white relative ${
          isUsed 
            ? 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800' 
            : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-inner ${
                isUsed ? 'bg-red-950/60 border border-red-400/40' : 'bg-white/20 backdrop-blur-md'
              }`}>
                {isUsed ? <XCircle className="w-5 h-5 text-white" /> : <Ticket className="w-5 h-5 text-amber-200" />}
              </div>
              <div>
                <span className={`text-xs font-semibold block ${isUsed ? 'text-red-200' : 'text-orange-200'}`}>
                  CROU Korhogo · Restaurant U
                </span>
                <span className="text-sm font-black leading-tight block text-white flex items-center space-x-1.5">
                  {isUsed ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                      <span>TICKET UTILISÉ (CONSOMMÉ)</span>
                    </>
                  ) : (
                    <span>Ticket de repas · 200 FCFA</span>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                isUsed ? 'bg-red-950/80 text-white border border-red-400' : 'bg-white/20 backdrop-blur-sm'
              }`}>
                {isUsed ? 'UTILISÉ' : (ticket.mealType === 'dejeuner' ? 'Midi' : 'Soir')}
              </span>
            </div>
          </div>

          {/* Toggle between Real Ticket Photo & Digital QR code */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-black/25 backdrop-blur-md rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('photo')}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                viewMode === 'photo'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Photo du ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('qrcode')}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                viewMode === 'qrcode'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code tourniquet</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Real CROU Ticket Photo Display */}
        {viewMode === 'photo' && (
          <div className="p-4 space-y-3 bg-slate-900 text-white">
            <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 bg-black shadow-lg">
              {/* Authentic CROU Ticket Photo loaded with spiral 🌀 loader */}
              <ImageWithLoader
                src={OFFICIAL_CROU_TICKET_IMG}
                alt="Vrai Ticket CROU Korhogo 2 Volets Officiel"
                className="w-full aspect-[16/10] bg-slate-950"
                imgClassName="object-cover group-hover:scale-102 transition-transform duration-300"
                spiralLabel="Téléchargement du ticket..."
              />

              {/* Status banner overlay */}
              <div className="absolute top-2 left-2 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-black text-amber-300">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>VOLETS AUTHENTIQUES CROU</span>
              </div>

              {/* Zoom action button */}
              <button
                type="button"
                onClick={() => setIsZoomed(true)}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg backdrop-blur-md border border-white/10 transition-colors shadow-md flex items-center space-x-1 text-[10px] font-bold"
                title="Agrandir le vrai ticket"
              >
                <Maximize2 className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Agrandir</span>
              </button>

              {/* Dynamic student overlay at bottom of the real ticket */}
              <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-end justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    Bénéficiaire & Date
                  </span>
                  <span className="text-xs font-bold text-white block">
                    {ticket.studentName} ({ticket.studentMatricule})
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">
                    {ticket.date} • {ticket.purchaseTime}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    No Ticket
                  </span>
                  <span className="text-xs font-mono font-black text-white bg-white/20 px-1.5 py-0.5 rounded">
                    {ticket.ticketNumber}
                  </span>
                </div>
              </div>

              {/* Used stamp overlay EN ROUGE VIF */}
              {isUsed && (
                <div className="absolute inset-0 bg-red-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                  <div className="bg-red-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl transform -rotate-6 border-2 border-white">
                    ❌ TICKET DÉJÀ UTILISÉ
                  </div>
                  <span className="text-white text-xs font-bold mt-2">
                    Consommé à {ticket.usedTime || 'ce service'}
                  </span>
                  <span className="text-red-200 text-[10px] mt-0.5 font-semibold">
                    Accès au tourniquet désormais refusé
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-300 text-center flex items-center justify-center space-x-1.5">
              <span>🎟️</span>
              <span>Conforme au ticket physique à 2 volets (Or & Bleu) du CROU Korhogo.</span>
            </p>
          </div>
        )}

        {/* View Mode 2: Digital QR Code for Fast Tourniquet Scanning */}
        {viewMode === 'qrcode' && (
          <div className="p-5 text-center bg-white space-y-4">
            <div className="relative inline-block bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Ticket" 
                  className={`w-44 h-44 mx-auto rounded-lg transition-opacity ${
                    isUsed ? 'opacity-30 grayscale' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="w-44 h-44 bg-slate-100 flex items-center justify-center rounded-lg">
                  <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
                </div>
              )}

              {/* Status stamp overlay if used EN ROUGE */}
              {isUsed && (
                <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                  <div className="bg-red-600 text-white px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl border-2 border-white transform -rotate-6">
                    ❌ TICKET DÉJÀ UTILISÉ
                  </div>
                  <p className="text-white text-xs font-black mt-2">
                    Scanné à {ticket.usedTime || 'ce service'}
                  </p>
                  <p className="text-red-200 text-[10px] font-bold mt-0.5">
                    QR code désactivé • Refusé au tourniquet
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              Présentez ce QR code face au scanner optique du tourniquet du restaurant universitaire.
            </p>
          </div>
        )}

        {/* Ticket Perforation Notch (Left & Right) */}
        <div className="relative h-6 bg-slate-100 flex items-center justify-between px-3 overflow-hidden">
          <div className="w-5 h-5 bg-slate-900/20 -ml-5 rounded-full"></div>
          <div className="flex-1 border-b-2 border-dashed border-slate-300 mx-2"></div>
          <div className="w-5 h-5 bg-slate-900/20 -mr-5 rounded-full"></div>
        </div>

        {/* Ticket Details Box */}
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {ticket.transferredFrom && (
                <div className="mb-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-300 rounded-xl flex items-center space-x-1.5 text-xs font-bold text-amber-950">
                  <span className="text-sm">🎁</span>
                  <span className="truncate">Offert par : <strong className="text-orange-950 font-black">{ticket.transferredFrom}</strong></span>
                </div>
              )}
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Repas & Restaurant
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                {ticket.dishName || 'Ticket Repas CROU Korhogo'}
              </h4>
              <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <span className="truncate">{ticket.canteenName || 'Restaurant Universitaire UPGC'}</span>
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tarif Subventionné
              </span>
              <span className="text-lg font-black text-orange-600 font-cabinet">
                {ticket.price} <span className="text-xs font-bold text-slate-500">FCFA</span>
              </span>
            </div>
          </div>

          {/* Ticket Number and Copy */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Numéro de série :</span>
            <div className="flex items-center space-x-2">
              <span data-selectable="true" className="font-mono font-bold text-slate-800 select-text">
                {ticket.ticketNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyTicketNumber}
                className="p-1 hover:bg-slate-200/80 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                title="Copier le numéro"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Status & Instructions - Validation is done ONLY by CROU turnstile/scanner */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {isUsed ? (
              <div className="flex-1 py-2.5 px-3 bg-red-600 text-white text-xs font-black rounded-xl text-center flex items-center justify-center space-x-2 shadow-md">
                <AlertOctagon className="w-4 h-4 text-white flex-shrink-0 stroke-[2.5]" />
                <span>TICKET UTILISÉ (EN ROUGE) · Consommé à {ticket.usedTime || 'ce service'}</span>
              </div>
            ) : (
              <div className="flex-1 py-2.5 px-3 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Ticket valide • Scanner Restau U</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {!isUsed && onTransferTicket ? (
                <button
                  type="button"
                  onClick={() => onTransferTicket(ticket)}
                  className="flex-1 sm:flex-initial py-2.5 px-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                  title="Offrir ce ticket à un camarade"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Offrir</span>
                </button>
              ) : isUsed ? (
                <span className="py-2 px-3 bg-red-100 text-red-800 border border-red-300 text-xs font-bold rounded-xl flex items-center space-x-1">
                  <span>🚫 Non transférable</span>
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Ticket Repas CROU - ${ticket.ticketNumber}`,
                      text: `Ticket repas ${ticket.dishName} au ${ticket.canteenName} - Code: ${ticket.ticketNumber}`
                    }).catch(() => {});
                  } else {
                    handleCopyTicketNumber();
                  }
                }}
                className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
                title="Partager le ticket"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sécurisé CROU CI • Restau. U 2026</span>
          </span>
          <span>1 Repas Subventionné</span>
        </div>

      </div>
    </div>
  );
};
