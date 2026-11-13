import React from 'react';
import {
  ChevronDown,
  Headphones,
  Lock,
  User,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { Canteen, UserProfile } from '../types';
import { lockAppNow } from './PinLock';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  canteens: Canteen[];
  selectedCanteen: Canteen;
  onSelectCanteen: (canteen: Canteen) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenMyTickets?: () => void;
  onOpenAdmin: () => void;
  onLogout?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onOpenNotifications?: () => void;
  onOpenGemini?: () => void;
  onOpenSupport?: () => void;
  onOpenApkModal?: () => void;
}

export const Navbar: React.FC<Props> = ({
  canteens,
  selectedCanteen,
  onSelectCanteen,
  user,
  onOpenAuth,
  onOpenAdmin,
  onOpenGemini,
  onOpenSupport,
  onOpenApkModal
}) => {
  const handleOpenSupport = onOpenSupport || onOpenGemini;

  return (
    <header className="sticky top-0 z-30 glass pt-safe select-none">
      <div className="max-w-5xl w-full mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand App Icon + Programas + Canteen selector */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-[12px] overflow-hidden shadow-sm flex-shrink-0 border border-black/5 dark:border-white/10">
            <img src="/icon.svg" alt="Programas" className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0">
            <span className="block font-extrabold text-[17px] text-[var(--ios-fg)] leading-tight tracking-tight whitespace-nowrap">
              Programas
            </span>

            <div className="relative max-w-[175px] sm:max-w-xs">
              <select
                aria-label="Choisir le restaurant universitaire"
                value={selectedCanteen.id}
                onChange={(e) => {
                  const found = canteens.find(c => c.id === e.target.value);
                  if (found) onSelectCanteen(found);
                }}
                className="appearance-none bg-transparent pr-5 text-[14px] font-medium text-[var(--ios-fg-secondary)] hover:text-[var(--ios-fg)] cursor-pointer focus:outline-none truncate w-full"
              >
                {canteens.map(c => (
                  <option key={c.id} value={c.id} className="text-[#1d1d1f] bg-white">
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ios-fg-secondary)] absolute right-0 top-1 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Concise icon controls with aria-labels */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenApkModal && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenApkModal();
              }}
              aria-label="Télécharger l'application Android APK"
              className="hidden sm:inline-flex ios-btn-spring px-3 min-h-[40px] rounded-full bg-[var(--ios-surface)] border border-[var(--ios-border)] text-[13px] font-semibold text-[var(--ios-fg)] items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4 text-[#ea580c]" />
              <span>App Android</span>
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenAdmin();
              }}
              aria-label="Administration CROU"
              className="hidden sm:inline-flex ios-btn-spring px-3 min-h-[40px] rounded-full bg-[#1d1d1f] text-white text-[13px] font-semibold items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
              <span>Admin</span>
            </button>
          )}

          {handleOpenSupport && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                handleOpenSupport();
              }}
              aria-label="Contacter l'assistance CROU"
              className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-surface)] border border-[var(--ios-border)] text-[#ea580c] flex items-center justify-center shadow-2xs"
            >
              <Headphones className="w-5 h-5" />
            </button>
          )}

          {user ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                lockAppNow();
              }}
              aria-label="Verrouiller l'application par code PIN"
              className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-surface)] border border-[var(--ios-border)] text-[var(--ios-fg)] flex items-center justify-center shadow-2xs"
            >
              <Lock className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenAuth();
              }}
              aria-label="Se connecter"
              className="ios-btn-spring w-10 h-10 rounded-full bg-[#ea580c] text-white flex items-center justify-center shadow-sm"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
