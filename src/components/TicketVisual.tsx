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
  Share2
} from 'lucide-react';
import { MealTicket } from '../types';
import { generateTicketQRCodeDataURL } from '../utils/qrcode';

interface Props {
  ticket: MealTicket;
  onMarkAsUsed?: (ticketId: string) => void;
  showActions?: boolean;
}

export const TicketVisual: React.FC<Props> = ({ 
  ticket, 
  onMarkAsUsed,
  showActions = true 
}) => {
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
    <div className="relative w-full max-w-sm mx-auto font-sans">
      {/* Zoom overlay for tourniquet scanner */}
      {isZoomed && (
        <div 
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 cursor-pointer animate-fadeIn"
        >
          <div className="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-xs w-full">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Scanner Tourniquet CROU
            </p>
            {qrDataUrl && (
              <img 
                src={qrDataUrl} 
                alt="QR Code Agrandit" 
                className="w-64 h-64 mx-auto rounded-xl border-4 border-slate-900 shadow-inner"
              />
            )}
            <p className="text-sm font-black text-slate-900 mt-3 font-mono">
              {ticket.ticketNumber}
            </p>
            <p className="text-xs text-orange-600 font-semibold mt-1">
              Touchez n'importe où pour fermer
            </p>
          </div>
        </div>
      )}

      {/* Main Ticket Card Container */}
      <div className={`relative bg-white rounded-3xl shadow-xl overflow-hidden border transition-all ${
        isUsed ? 'border-slate-300 opacity-90' : 'border-orange-200 ring-2 ring-orange-500/10'
      }`}>
        
        {/* Top Header - Republic / CROU Badge */}
        <div className={`p-4 text-white relative ${
          isUsed 
            ? 'bg-slate-700' 
            : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🍽️</span>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-black opacity-90 block">
                  CROU • UPGC / Resto U
                </span>
                <span className="text-sm font-extrabold font-cabinet leading-tight block">
                  Ticket Repas Étudiant
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full uppercase tracking-wider">
                {ticket.mealType === 'dejeuner' ? '☀️ Déjeuner' : '🌙 Dîner'}
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Perforation Notch (Left & Right) */}
        <div className="relative h-6 bg-slate-50 flex items-center justify-between px-3">
          <div className="w-5 h-5 bg-slate-900/10 -ml-5 rounded-full"></div>
          <div className="flex-1 border-b-2 border-dashed border-slate-300 mx-2"></div>
          <div className="w-5 h-5 bg-slate-900/10 -mr-5 rounded-full"></div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* Dish & Price info */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Plat Commandé
              </span>
              <h4 className="font-bold text-slate-900 text-base leading-snug">
                {ticket.dishName}
              </h4>
              <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>{ticket.canteenName}</span>
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tarif Subventionné
              </span>
              <span className="text-xl font-black text-orange-600 font-cabinet">
                {ticket.price} <span className="text-xs font-bold text-slate-500">FCFA</span>
              </span>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Bénéficiaire
              </span>
              <div className="font-bold text-slate-800 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{ticket.studentName}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Matricule: {ticket.studentMatricule}
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Date & Heure
              </span>
              <p className="font-semibold text-slate-700">{ticket.date}</p>
              <p className="text-[11px] text-slate-500 font-mono">{ticket.purchaseTime}</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center pt-1">
            <div className="relative inline-block bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Ticket" 
                  className={`w-40 h-40 mx-auto rounded-lg transition-opacity ${
                    isUsed ? 'opacity-40 grayscale' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="w-40 h-40 bg-slate-100 flex items-center justify-center rounded-lg">
                  <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
                </div>
              )}

              {/* Status stamp overlay if used */}
              {isUsed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transform -rotate-12 border-2 border-white">
                    TICKET UTILISÉ
                  </div>
                </div>
              )}

              {/* Zoom Button */}
              {!isUsed && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg transition-all shadow-md"
                  title="Agrandir pour le scanner"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Ticket Number and Copy */}
            <div className="mt-2.5 flex items-center justify-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {ticket.ticketNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyTicketNumber}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                title="Copier le numéro"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              Présentez ce QR code directement face au lecteur du tourniquet.
            </p>
          </div>

          {/* Action Bar */}
          {showActions && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              {!isUsed && onMarkAsUsed && (
                <button
                  type="button"
                  onClick={() => onMarkAsUsed(ticket.id)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider au tourniquet</span>
                </button>
              )}

              {isUsed && (
                <div className="flex-1 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl text-center">
                  Consommé à {ticket.usedTime || 'ce service'}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Ticket Repas CROU - ${ticket.ticketNumber}`,
                      text: `Ticket repas ${ticket.dishName} au ${ticket.canteenName}`
                    }).catch(() => {});
                  } else {
                    handleCopyTicketNumber();
                  }
                }}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
                title="Partager le ticket"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Sécurisé CROU CI</span>
          </span>
          <span>Non remboursable • 1 passage</span>
        </div>

      </div>
    </div>
  );
};
