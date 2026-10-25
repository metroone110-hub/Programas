import React from 'react';
import { X, QrCode, Ticket, CheckCircle2, Clock, Calendar, ArrowRight } from 'lucide-react';
import { MealTicket, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSelectTicket: (ticket: MealTicket) => void;
}

export const MyTicketsModal: React.FC<Props> = ({ isOpen, onClose, user, onSelectTicket }) => {
  if (!isOpen) return null;

  const tickets = user.savedTickets || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-orange-600 rounded-xl">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-cabinet text-white">Mes Tickets Repas</h3>
              <p className="text-xs text-slate-400">{tickets.length} ticket(s) enregistrés</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {tickets.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <QrCode className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Aucun ticket pour le moment</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Choisissez un plat au menu pour générer votre premier ticket avec QR code valide au tourniquet.
              </p>
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className="p-3.5 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl group-hover:border-orange-300">
                  <QrCode className="w-6 h-6 text-slate-700 group-hover:text-orange-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {t.dishName}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      t.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {t.status === 'valid' ? 'Valide' : 'Utilisé'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t.canteenName} • {t.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {t.ticketNumber} • {t.purchaseTime}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 transition-colors" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Présentez le QR code devant le scanner optique du tourniquet pour retirer votre plateau.
          </p>
        </div>
      </div>
    </div>
  );
};
