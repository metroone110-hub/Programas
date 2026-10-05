import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-slate-700 backdrop-blur-md animate-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Mode hors ligne — Affichage du dernier menu enregistré</span>
    </div>
  );
};
