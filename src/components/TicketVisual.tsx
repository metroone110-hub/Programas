import React, { useState, useEffect } from 'react';
import {
  QrCode,
  MapPin,
  Maximize2,
  ShieldCheck,
  Copy,
  Check,
  Share2,
  BadgeCheck,
  Eye,
  Send,
  AlertOctagon,
  XCircle
} from 'lucide-react';
import { MealTicket } from '../types';
import { generateTicketQRCodeDataURL } from '../utils/qrcode';
import { ImageWithLoader } from './ImageWithLoader';
import { triggerHaptic } from '../utils/haptics';

const OFFICIAL_CROU_TICKET_IMG = '/assets/aistudio/IMG_1038_80198fc0.jpeg';

interface Props {
  ticket: MealTicket;
  onMarkAsUsed?: (ticketId: string) => void;
  onTransferTicket?: (ticket: MealTicket) => void;
  showActions?: boolean;
}

export const TicketVisual: React.FC<Props> = ({
  ticket,
  onTransferTicket,
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
    return () => {
      isMounted = false;
    };
  }, [ticket]);

  const handleCopyTicketNumber = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(ticket.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUsed = ticket.status === 'used';

  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      {/* Zoom overlay for authentic paper ticket photo */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div className="bg-zinc-900 border border-white/15 p-4 rounded-[28px] shadow-2xl text-center max-w-lg w-full">
            <div className="flex items-center justify-between mb-3 text-white">
              <span className="text-[12px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span>Ticket Officiel CROU Korhogo</span>
              </span>
              <span className="text-[12px] text-zinc-400 font-mono">{ticket.ticketNumber}</span>
            </div>

            <div className="relative rounded-[20px] overflow-hidden border border-white/15 bg-black">
              <ImageWithLoader
                src={OFFICIAL_CROU_TICKET_IMG}
                alt="Ticket officiel CROU Korhogo"
                className="w-full max-h-[70vh] object-contain"
                imgClassName="object-contain"
                spiralLabel="Chargement du ticket..."
              />
            </div>

            <p className="mt-3 text-[13px] text-zinc-300">
              Touchez l'écran pour fermer
            </p>
          </div>
        </div>
      )}

      {/* Perforated White Ticket Card for Maximum QR Readability */}
      <div
        className={`relative bg-white text-[#1d1d1f] rounded-[30px] shadow-2xl overflow-hidden transition-all ${
          isUsed ? 'border-2 border-red-500 ring-4 ring-red-500/20' : 'border border-black/10'
        }`}
      >
        {/* Top Colored Header Strip */}
        <div
          className={`p-5 text-white ${
            isUsed ? 'bg-red-600' : 'bg-[#ea580c]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[12px] font-semibold text-white/85 block">
                CROU Korhogo · Restaurant U
              </span>
              <span className="text-[19px] font-extrabold leading-tight flex items-center gap-1.5 mt-0.5">
                {isUsed ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    <span>TICKET UTILISÉ</span>
                  </>
                ) : (
                  <span>Ticket repas · 200 FCFA</span>
                )}
              </span>
            </div>

            <span className="px-3 py-1 rounded-full bg-black/20 text-[12px] font-bold">
              {isUsed ? 'SCANÉ' : ticket.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
            </span>
          </div>

          {/* Toggle Photo / QR */}
          <div className="mt-4 grid grid-cols-2 gap-1 p-1 bg-black/20 rounded-[14px]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setViewMode('qrcode');
              }}
              className={`ios-btn-spring min-h-[38px] px-3 rounded-[11px] text-[13px] font-bold flex items-center justify-center gap-1.5 ${
                viewMode === 'qrcode' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-white/90'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setViewMode('photo');
              }}
              className={`ios-btn-spring min-h-[38px] px-3 rounded-[11px] text-[13px] font-bold flex items-center justify-center gap-1.5 ${
                viewMode === 'photo' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-white/90'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Volet papier</span>
            </button>
          </div>
        </div>

        {/* View 1: QR Code (Crisp white for optical scanners) */}
        {viewMode === 'qrcode' && (
          <div className="p-6 text-center bg-white space-y-4">
            <div className="relative inline-block bg-white p-3.5 rounded-[22px] border border-black/10 shadow-xs">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Ticket"
                  className={`w-52 h-52 mx-auto rounded-[12px] transition-opacity ${
                    isUsed ? 'opacity-25 grayscale' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="w-52 h-52 bg-slate-100 flex items-center justify-center rounded-[12px]">
                  <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                </div>
              )}

              {isUsed && (
                <div className="absolute inset-0 bg-red-950/90 rounded-[22px] flex flex-col items-center justify-center p-4 text-center">
                  <div className="bg-red-600 text-white px-4 py-2 rounded-[14px] font-black text-[13px] uppercase tracking-wider shadow-xl border-2 border-white -rotate-6">
                    TICKET UTILISÉ
                  </div>
                  <p className="text-white text-[13px] font-bold mt-2.5">
                    Scanné à {ticket.usedTime || 'ce service'}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[14px] text-[#52525b] max-w-xs mx-auto leading-snug">
              Présentez ce QR code devant le lecteur optique du tourniquet.
            </p>
          </div>
        )}

        {/* View 2: Authentic Physical Ticket */}
        {viewMode === 'photo' && (
          <div className="p-4 space-y-3 bg-zinc-900 text-white">
            <div className="relative rounded-[20px] overflow-hidden border border-white/15 bg-black">
              <ImageWithLoader
                src={OFFICIAL_CROU_TICKET_IMG}
                alt="Vrai Ticket CROU Korhogo"
                className="w-full aspect-[16/10]"
                imgClassName="object-cover"
                spiralLabel="Chargement..."
              />

              <button
                type="button"
                onClick={() => setIsZoomed(true)}
                aria-label="Agrandir le ticket"
                className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-black/75 text-white rounded-[12px] text-[12px] font-bold flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Agrandir</span>
              </button>

              {isUsed && (
                <div className="absolute inset-0 bg-red-950/85 flex flex-col items-center justify-center p-4 text-center">
                  <div className="bg-red-600 text-white px-5 py-2 rounded-[14px] font-black text-[14px] uppercase border-2 border-white -rotate-6">
                    TICKET DÉJÀ UTILISÉ
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Perforation Line with Side Notches */}
        <div className="relative h-6 bg-white flex items-center px-5 ticket-notch-left ticket-notch-right">
          <div className="w-full border-t-2 border-dashed border-black/15" />
        </div>

        {/* Ticket Metadata & Actions */}
        <div className="p-5 pt-3 space-y-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {ticket.transferredFrom && (
                <div className="mb-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-[12px] text-[12px] font-bold text-[#9a3412]">
                  Offert par : {ticket.transferredFrom}
                </div>
              )}
              <h4 className="font-extrabold text-[#1d1d1f] text-[18px] leading-snug">
                {ticket.dishName || 'Ticket Repas CROU Korhogo'}
              </h4>
              <p className="text-[14px] text-[#52525b] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-[#ea580c] flex-shrink-0" />
                <span className="truncate">{ticket.canteenName || 'Restaurant Universitaire UPGC'}</span>
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-[20px] font-extrabold text-[#ea580c] tabular-nums block">
                {ticket.price || 200} F
              </span>
              <span className="text-[11px] font-semibold text-[#6e6e73]">Subvention CROU</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#f2f2f7] rounded-[16px] text-[13px]">
            <span className="text-[#52525b] font-medium">N° série</span>
            <div className="flex items-center gap-2">
              <span data-selectable="true" className="font-mono font-bold text-[#1d1d1f] select-text">
                {ticket.ticketNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyTicketNumber}
                aria-label="Copier le numéro de série"
                className="p-1.5 rounded-lg hover:bg-black/5 text-[#52525b]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {isUsed ? (
              <div className="flex-1 min-h-[48px] px-4 bg-red-600 text-white text-[13px] font-extrabold rounded-[16px] flex items-center justify-center gap-2">
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                <span>Consommé à {ticket.usedTime || 'ce service'}</span>
              </div>
            ) : (
              <div className="flex-1 min-h-[48px] px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-bold rounded-[16px] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Valide au tourniquet</span>
              </div>
            )}

            {!isUsed && onTransferTicket && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onTransferTicket(ticket);
                }}
                className="ios-btn-spring min-h-[48px] px-4 bg-[#ea580c] text-white text-[14px] font-bold rounded-[16px] flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Offrir</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (navigator.share) {
                  navigator
                    .share({
                      title: `Ticket Repas CROU - ${ticket.ticketNumber}`,
                      text: `Ticket repas ${ticket.dishName} - Code : ${ticket.ticketNumber}`
                    })
                    .catch(() => {});
                } else {
                  handleCopyTicketNumber();
                }
              }}
              aria-label="Partager le ticket"
              className="ios-btn-spring w-12 h-12 bg-[#f2f2f7] text-[#1d1d1f] rounded-[16px] flex items-center justify-center"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
