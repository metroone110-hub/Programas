import React, { useState } from 'react';
import { 
  Ticket, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Sparkles, 
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
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-white/10 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        
        {/* Left: Presentation & Assurance CROU */}
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide bg-orange-500 text-white shadow-xs flex items-center space-x-1">
              <Ticket className="w-3.5 h-3.5" />
              <span>Billetterie Resto U • CROU-K</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Tarif Subventionné : 200 FCFA / ticket
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-cabinet leading-tight">
              Achetez vos Tickets Repas Officiels
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">
              Les repas sont servis au réfectoire sur présentation du <strong>Ticket QR</strong>. Choisissez le nombre de tickets et payez instantanément par <strong>Wave, Orange, MTN, Moov, Djamo ou Carte</strong>.
            </p>
          </div>

          {/* Quick Packs Selector */}
          <div className="pt-1">
            <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">
              Choix rapide de formule :
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {quickPacks.map((pack) => (
                <button
                  key={pack.qty}
                  type="button"
                  onClick={() => setQuantity(pack.qty)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    quantity === pack.qty
                      ? 'border-orange-500 bg-orange-500/20 ring-1 ring-orange-500 shadow-md'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white font-cabinet">
                      {pack.qty} ticket{pack.qty > 1 ? 's' : ''}
                    </span>
                    {quantity === pack.qty && (
                      <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-amber-400 mt-0.5">
                    {(pack.qty * 200).toLocaleString('fr-FR')} F
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                    {pack.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quantity Stepper & Buy Action Card */}
        <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xl flex-shrink-0">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Nombre de tickets :
            </span>
            
            {/* Stepper */}
            <div className="flex items-center space-x-2 bg-slate-900/60 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Diminuer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-black text-base text-white font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Augmenter"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Tarif unitaire CROU :</span>
              <span className="font-mono">200 FCFA</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-xs font-bold text-white">Total à régler :</span>
              <div className="text-right">
                <span className="text-xl font-black text-amber-400 font-cabinet">
                  {totalAmount.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="block text-[10px] text-emerald-400 font-medium">
                  Économie subventionnée ~{(quantity * 300).toLocaleString('fr-FR')} F
                </span>
              </div>
            </div>
          </div>

          {/* Big Buy Button */}
          <button
            type="button"
            onClick={handleBuy}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-600 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer group"
          >
            <Ticket className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span>Acheter {quantity} Ticket{quantity > 1 ? 's' : ''} • {totalAmount.toLocaleString('fr-FR')} F</span>
            <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Supported badges mini line */}
          <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-300">
            <span className="font-medium">Moyens acceptés :</span>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded-full overflow-hidden bg-sky-400 flex items-center justify-center">
                <img src="/assets/aistudio/IMG_1213_589dc8ca.png" alt="Wave" className="w-full h-full object-cover" />
              </div>
              <span className="px-1 py-0.5 bg-[#ff7900] text-black font-black text-[7px] rounded-xs">OM</span>
              <span className="px-1 py-0.5 bg-[#ffcc00] text-black font-black text-[7px] rounded-xs">MTN</span>
              <span className="px-1 py-0.5 bg-[#0077c8] text-white font-black text-[7px] rounded-xs">MOOV</span>
              <span className="px-1 py-0.5 bg-black text-white italic font-black text-[7px] rounded-xs font-serif">djamo</span>
            </div>
          </div>

          {/* User Tickets Shortcut if connected */}
          {user && (
            <div className="pt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={onOpenMyTickets}
                className="text-xs text-amber-300 hover:text-white font-bold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mes tickets disponibles ({validTicketsCount}) &gt;</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
