import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, Download, Clock, MapPin, Utensils, Shield, Check } from 'lucide-react';
import { MealTicket } from '../types';

interface Props {
  ticket: MealTicket | null;
  onClose: () => void;
  onMarkAsUsed?: (ticketId: string) => void;
}

export const TicketModal: React.FC<Props> = ({ ticket, onClose, onMarkAsUsed }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!ticket) return null;

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Top ticket header */}
        <div className="bg-gradient-to-br from-orange-600 to-amber-600 px-6 py-5 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Ticket Repas Officiel CROU</span>
          </div>
          <h3 className="text-xl font-black font-cabinet">{ticket.canteenName}</h3>
          <p className="text-xs text-orange-100 mt-0.5">
            Service du {ticket.mealType === 'dejeuner' ? 'Déjeuner (Midi)' : 'Dîner (Soir)'}
          </p>
        </div>

        {/* QR Code and cut-out ticket styling */}
        <div className="p-6 flex flex-col items-center bg-white relative">
          {/* Ticket notches left and right */}
          <div className="absolute -left-3 top-0 w-6 h-6 bg-slate-950/80 rounded-full"></div>
          <div className="absolute -right-3 top-0 w-6 h-6 bg-slate-950/80 rounded-full"></div>

          {/* QR Code box */}
          <div className="p-4 bg-slate-50 border-2 border-dashed border-orange-200 rounded-2xl flex flex-col items-center shadow-inner my-2">
            {/* SVG Vector QR Code simulation for 100% reliable rendering without external image dependencies */}
            <svg className="w-44 h-44 text-slate-900" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="white" />
              {/* Corner position markers */}
              <rect x="5" y="5" width="26" height="26" fill="black" />
              <rect x="8" y="8" width="20" height="20" fill="white" />
              <rect x="12" y="12" width="12" height="12" fill="black" />

              <rect x="69" y="5" width="26" height="26" fill="black" />
              <rect x="72" y="8" width="20" height="20" fill="white" />
              <rect x="76" y="12" width="12" height="12" fill="black" />

              <rect x="5" y="69" width="26" height="26" fill="black" />
              <rect x="8" y="72" width="20" height="20" fill="white" />
              <rect x="12" y="76" width="12" height="12" fill="black" />

              {/* Data matrix pattern */}
              <rect x="36" y="8" width="5" height="5" fill="black" />
              <rect x="44" y="8" width="5" height="5" fill="black" />
              <rect x="52" y="15" width="5" height="5" fill="black" />
              <rect x="60" y="22" width="5" height="5" fill="black" />
              <rect x="36" y="36" width="10" height="10" fill="black" />
              <rect x="50" y="36" width="12" height="5" fill="black" />
              <rect x="50" y="44" width="6" height="6" fill="black" />
              <rect x="60" y="52" width="10" height="6" fill="black" />
              <rect x="15" y="45" width="10" height="5" fill="black" />
              <rect x="20" y="55" width="5" height="5" fill="black" />
              <rect x="75" y="40" width="8" height="5" fill="black" />
              <rect x="85" y="50" width="8" height="8" fill="black" />
              <rect x="40" y="65" width="15" height="6" fill="black" />
              <rect x="60" y="75" width="8" height="8" fill="black" />
              <rect x="75" y="70" width="12" height="12" fill="black" />
              <rect x="45" y="80" width="8" height="8" fill="black" />
            </svg>

            <span className="mt-2 font-mono text-xs font-bold text-slate-800 tracking-wider">
              {ticket.ticketNumber}
            </span>
          </div>

          {/* Ticket Information */}
          <div className="w-full space-y-2 mt-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Étudiant :</span>
              <span className="font-semibold text-slate-900">{ticket.studentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Repas sélectionné :</span>
              <span className="font-semibold text-slate-900 truncate max-w-[180px]">{ticket.dishName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tarif subventionné :</span>
              <span className="font-bold text-emerald-600">{ticket.price} FCFA</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Heure d'achat :</span>
              <span className="text-slate-700">{ticket.purchaseTime}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Statut :</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                ticket.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {ticket.status === 'valid' ? 'Valide pour le tourniquet' : 'Déjà utilisé'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          {ticket.status === 'valid' && onMarkAsUsed && (
            <button
              onClick={() => onMarkAsUsed(ticket.id)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simuler le passage au tourniquet</span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                downloadSuccess
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Enregistré dans le téléphone</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Télécharger l'image</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
