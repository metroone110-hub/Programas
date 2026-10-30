import React from 'react';
import { Home, MapPin, Search, ShoppingBag, QrCode, User } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  activeTab: 'home' | 'radar' | 'search' | 'cart' | 'tickets' | 'profile';
  onTabChange: (tab: 'home' | 'radar' | 'search' | 'cart' | 'tickets' | 'profile') => void;
  cartCount: number;
  validTicketsCount: number;
  user: UserProfile | null;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  cartCount,
  validTicketsCount,
  user
}) => {
  return (
    <div className="fixed bottom-3 inset-x-0 z-40 flex items-center justify-center px-4 pointer-events-none select-none gpu-layer">
      <nav 
        className="pointer-events-auto bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-full px-2 py-1.5 flex items-center space-x-1 sm:space-x-2 max-w-md w-full justify-around ring-1 ring-black/5 gpu-layer"
        aria-label="Navigation Principale"
      >
        {/* 1. Accueil */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-full transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold shadow-md shadow-orange-500/25'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-bold leading-none">Accueil</span>
        </button>

        {/* 2. Radar Resto */}
        <button
          type="button"
          onClick={() => onTabChange('radar')}
          className={`p-2 rounded-full transition-all text-slate-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer relative ${
            activeTab === 'radar' ? 'text-orange-600 bg-orange-50 font-bold' : ''
          }`}
          title="Radar Affluence Resto U"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* 3. Recherche */}
        <button
          type="button"
          onClick={() => onTabChange('search')}
          className={`p-2 rounded-full transition-all text-slate-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer relative ${
            activeTab === 'search' ? 'text-orange-600 bg-orange-50 font-bold' : ''
          }`}
          title="Rechercher un plat"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* 4. Panier */}
        <button
          type="button"
          onClick={() => onTabChange('cart')}
          className="p-2 rounded-full transition-all text-slate-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer relative"
          title="Mon Panier"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 px-1.5 py-0.2 min-w-[17px] h-[17px] rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-scaleUp">
              {cartCount}
            </span>
          )}
        </button>

        {/* 5. Mes Tickets */}
        <button
          type="button"
          onClick={() => onTabChange('tickets')}
          className="p-2 rounded-full transition-all text-slate-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer relative"
          title="Mes Tickets CROU (QR Code)"
        >
          <QrCode className="w-5 h-5" />
          {validTicketsCount > 0 && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-2 ring-white animate-pulse"></span>
          )}
        </button>

        {/* 6. Profil / Compte */}
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            user ? 'ring-2 ring-orange-500/30' : 'text-slate-500 hover:text-orange-600'
          }`}
          title={user ? `Compte (${user.displayName})` : 'Se connecter'}
        >
          {user ? (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-[10px] font-extrabold uppercase">
              {user.displayName.charAt(0) || 'U'}
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
        </button>
      </nav>
    </div>
  );
};
