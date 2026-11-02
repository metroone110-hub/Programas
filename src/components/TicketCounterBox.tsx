import React, { useState } from 'react';
import { 
  Ticket, 
  Plus, 
  Minus, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
  onBuyTickets: (quantity: number, totalAmount: number) => void;
  onOpenAuth: () => void;
  onOpenMyTickets: () => void;
}

export const TicketCounterBox: React.FC<Props> = ({
  user,
  onBuyTickets,
  onOpenAuth,
  onOpenMyTickets
}) => {
  const [quantity, setQuantity] = useState<number>(1);

  const TICKET_UNIT_PRICE = 200; // Exact official subvention price
  const totalAmount = quantity * TICKET_UNIT_PRICE;

  const validTicketsCount = user?.savedTickets?.filter(t => t.status === 'valid').length || 0;

  const quickPacks = [
    { qty: 1, label: '1 Repas', desc: 'Déjeuner ou Dîner' },
    { qty: 2, label: '2 Repas', desc: 'Journée Complète' },
    { qty: 5, label: '5 Repas', desc: 'Semaine de Cours' },
    { qty: 10, label: '10 Repas', desc: 'Quinzaine' },
    { qty: 20, label: '20 Repas', desc: 'Mois Complet' }
  ];

  const handleBuy = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onBuyTickets(quantity, totalAmount);
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-md border border-slate-800 relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        
        {/* Left: Presentation & Description */}
        <div className="space-y-3.5 max-w-xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-orange-400">
            <Ticket className="w-4 h-4" />
            <span>Restaurant universitaire CROU-K</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 font-normal">200 FCFA par repas</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              Tickets repas
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mt-1.5">
              Commandez vos tickets de repas subventionnés. Présentez simplement votre ticket QR au tourniquet du réfectoire. Paiement instantané et sécurisé.
            </p>
          </div>

          {/* Quick Packs Selector */}
          <div className="pt-1">
            <span className="text-xs font-medium text-slate-400 block mb-2">
              Formules rapides :
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {quickPacks.map((pack) => (
                <button
                  key={pack.qty}
                  type="button"
                  onClick={() => setQuantity(pack.qty)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    quantity === pack.qty
                      ? 'border-orange-500 bg-orange-500/15 text-white ring-1 ring-orange-500'
                      : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {pack.qty} repas
                    </span>
                    {quantity === pack.qty && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-orange-300 mt-1">
                    {(pack.qty * 200).toLocaleString('fr-FR')} F
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {pack.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quantity Stepper & Buy Action Card */}
        <div className="w-full lg:w-80 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg flex-shrink-0">
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              Nombre de tickets :
            </span>
            
            {/* Stepper */}
            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Diminuer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-base text-white font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Augmenter"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Prix des repas (200 F / repas) :</span>
              <span className="font-mono text-slate-200">{(quantity * 200).toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Frais (1,5% + 7 F) :</span>
              <span className="font-mono text-slate-200">+{(quantity * 10).toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-sm font-semibold text-white">Total à payer :</span>
              <div className="text-right">
                <span className="text-xl font-bold text-white">
                  {(quantity * 210).toLocaleString('fr-FR')} FCFA
                </span>
                <span className="block text-xs text-slate-400 font-normal">
                  Soit 210 FCFA par repas
                </span>
              </div>
            </div>
          </div>

          {/* Buy Button */}
          <button
            type="button"
            onClick={handleBuy}
            className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Ticket className="w-4 h-4 text-white" />
            <span>Acheter {quantity} ticket{quantity > 1 ? 's' : ''} · {(quantity * 210).toLocaleString('fr-FR')} FCFA</span>
            <ChevronRight className="w-4 h-4 text-white/80" />
          </button>

          {/* Supported badges mini line */}
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
            <span>Paiement sécurisé : Wave, Orange, MTN, Moov, Djamo</span>
          </div>

          {/* User Tickets Shortcut if connected */}
          {user && (
            <div className="pt-2 border-t border-slate-700/60 text-center">
              <button
                type="button"
                onClick={onOpenMyTickets}
                className="text-xs text-orange-300 hover:text-white font-medium inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mes tickets disponibles ({validTicketsCount}) →</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
