import React from 'react';
import { 
  UtensilsCrossed, 
  MapPin, 
  Wallet, 
  QrCode, 
  User, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Canteen, UserProfile, MealTicket } from '../types';

interface Props {
  canteens: Canteen[];
  selectedCanteen: Canteen;
  onSelectCanteen: (canteen: Canteen) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onOpenMyTickets: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  canteens,
  selectedCanteen,
  onSelectCanteen,
  user,
  onOpenAuth,
  onOpenWallet,
  onOpenMyTickets,
  onOpenAdmin,
  onLogout
}) => {
  const activeTicketsCount = user?.savedTickets?.filter(t => t.status === 'valid').length || 0;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        
        {/* Brand & Canteen Switcher */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
            <span className="text-xl">🍽️</span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-sm text-slate-900 tracking-tight font-cabinet">
                CROU Resto U
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                Officiel
              </span>
            </div>

            {/* Canteen Selector */}
            <div className="relative group">
              <select
                value={selectedCanteen.id}
                onChange={(e) => {
                  const found = canteens.find(c => c.id === e.target.value);
                  if (found) onSelectCanteen(found);
                }}
                className="appearance-none bg-transparent pr-5 text-xs font-semibold text-slate-600 hover:text-orange-600 cursor-pointer focus:outline-none transition-colors"
              >
                {canteens.map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {user ? (
            <>
              {/* Wallet button */}
              <button
                onClick={onOpenWallet}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-orange-900 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Wallet className="w-3.5 h-3.5 text-orange-600" />
                <span>{user.balance.toLocaleString()} F</span>
                <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">
                  +
                </span>
              </button>

              {/* Tickets badge */}
              <button
                onClick={onOpenMyTickets}
                className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Mes tickets repas"
              >
                <QrCode className="w-5 h-5" />
                {activeTicketsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeTicketsCount}
                  </span>
                )}
              </button>

              {/* Admin Button if role is admin */}
              {user.role === 'admin' && (
                <button
                  onClick={onOpenAdmin}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Gestion Cantine</span>
                </button>
              )}

              {/* User Dropdown / Logout */}
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
