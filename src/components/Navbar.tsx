import React from 'react';
import { 
  UtensilsCrossed, 
  MapPin, 
  QrCode, 
  User, 
  LogOut, 
  ShieldCheck, 
  ChevronDown, 
  ShoppingBag, 
  GraduationCap,
  Search,
  Bell,
  Ticket
} from 'lucide-react';
import { Canteen, UserProfile } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  canteens: Canteen[];
  selectedCanteen: Canteen;
  onSelectCanteen: (canteen: Canteen) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenMyTickets: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<Props> = ({
  canteens,
  selectedCanteen,
  onSelectCanteen,
  user,
  onOpenAuth,
  onOpenMyTickets,
  onOpenAdmin,
  onLogout,
  cartCount = 0,
  onOpenCart,
  searchQuery = '',
  onSearchChange,
  onOpenNotifications
}) => {
  const activeTicketsCount = user?.savedTickets?.filter(t => t.status === 'valid').length || 0;

  return (
    <header 
      className="relative sm:sticky sm:top-0 z-30 bg-white border-b border-slate-200 shadow-xs select-none"
      style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 14px))' }}
    >
      <div className="max-w-6xl w-full mx-auto px-4 py-2.5 space-y-2.5">
        
        {/* ROW 1: Brand, Canteen Switcher & Admin Button (matching IMG_1079) */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Brand & Canteen Switcher */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
              <img src="/icon.svg" alt="Programas" className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base text-slate-900 tracking-tight whitespace-nowrap">
                  Programas
                </span>
                <span className="text-xs text-slate-400 font-medium">·</span>
                <span className="text-xs text-slate-600 font-medium truncate">
                  CROU-K
                </span>
              </div>

              {/* Canteen Selector */}
              <div className="relative group max-w-[160px] sm:max-w-xs">
                <select
                  value={selectedCanteen.id}
                  onChange={(e) => {
                    const found = canteens.find(c => c.id === e.target.value);
                    if (found) onSelectCanteen(found);
                  }}
                  className="appearance-none bg-transparent pr-4 text-xs font-normal text-slate-500 hover:text-slate-900 cursor-pointer focus:outline-none transition-colors truncate w-full"
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

          {/* Right: PWA Install & Admin Button */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <PWAInstallButton />

            {/* Admin CROU Button */}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              title="Accès Administration CROU"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>

            {/* If logged in, logout option */}
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Mobile Search & Fast Action Icons (matching IMG_1079) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* User Profile Avatar Circle (Left in IMG_1079) */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-800 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            title={user ? `Compte de ${user.displayName}` : 'Connexion / Inscription Étudiant'}
          >
            {user ? (
              <span className="uppercase text-xs">{user.displayName.charAt(0) || 'U'}</span>
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Rechercher un plat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          {/* Direct Ticket Quick Access Pill */}
          {user && activeTicketsCount > 0 && (
            <button
              type="button"
              onClick={onOpenMyTickets}
              className="hidden xs:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold transition-all shadow-xs flex-shrink-0 cursor-pointer"
              title="Mes tickets CROU valides"
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-700" />
              <span>{activeTicketsCount} ticket{activeTicketsCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Shopping Cart Button with Count Badge (Right in IMG_1079) */}
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative w-9 h-9 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-full transition-all shadow-xs flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0"
              title="Ouvrir mon panier"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[17px] h-[17px] rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-scaleUp">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Notification Bell Button (Right in IMG_1079) */}
          <button
            type="button"
            onClick={onOpenNotifications || onOpenMyTickets}
            className="relative w-9 h-9 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-full transition-all shadow-xs flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0"
            title="Mes tickets & Notifications"
          >
            <Bell className="w-4 h-4" />
            {activeTicketsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
