import React from 'react';
import { Home, UtensilsCrossed, QrCode, User } from 'lucide-react';
import { UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';

export type BottomTabId = 'home' | 'menu' | 'tickets' | 'profile';

interface Props {
  activeTab: BottomTabId;
  onTabChange: (tab: BottomTabId) => void;
  validTicketsCount: number;
  user: UserProfile | null;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  validTicketsCount,
}) => {
  const tabs: Array<{
    id: BottomTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'tickets', label: 'Tickets', icon: QrCode, badge: validTicketsCount },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 inset-x-0 z-40 glass-bottom pb-safe select-none"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 items-center px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onTabChange(tab.id);
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="ios-btn-spring relative flex flex-col items-center justify-center min-h-[48px] gap-1"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-[22px] h-[22px] transition-colors ${
                    isActive ? 'text-[#ea580c]' : 'text-[var(--ios-fg-secondary)]'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ea580c] text-white text-[11px] font-extrabold flex items-center justify-center leading-none shadow-xs tabular-nums">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[11px] font-bold leading-none ${
                  isActive ? 'text-[#ea580c]' : 'text-[var(--ios-fg-secondary)]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
