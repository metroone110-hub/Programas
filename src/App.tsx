import React, { useState, useEffect } from 'react';
import type { RestaurantData } from './types';
import { StudentMenu } from './components/StudentMenu';
import { AdminPanel } from './components/AdminPanel';
import { DeployGuideModal } from './components/DeployGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RefreshCw, Utensils, AlertTriangle } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'student' | 'admin'>('student');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const fetchMenuData = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      setError(null);
      const res = await fetch('/api/menu');
      if (!res.ok) {
        throw new Error('Erreur de communication avec le serveur CROU');
      }
      const json: RestaurantData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Fetch menu failed:', err);
      if (!isBackground) {
        setError(err.message || 'Impossible de charger le menu du jour.');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMenuData(false);

    // Background polling every 10 seconds to detect newly published menus and crowd updates immediately
    const pollInterval = setInterval(() => {
      fetchMenuData(true);
    }, 10000);

    // Immediate refetch when user switches back to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMenuData(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', () => fetchMenuData(true));

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center p-4 text-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-24 h-24 mb-4 drop-shadow-xl animate-bounce">
          <img
            src="/icon.svg"
            alt="Programas - Resto U UPGC Korhogo"
            className="w-full h-full object-contain rounded-[26px] shadow-lg border border-black/5"
          />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-950 mb-1">
          Programas
        </h2>
        <p className="text-xs text-amber-900 font-bold mb-3 bg-[#FEF3C7] px-3 py-1 rounded-full border border-amber-200">
          🇨🇮 Resto U UPGC Korhogo • CROU-K
        </p>
        <p className="text-xs text-slate-500 font-semibold flex items-center gap-2 mb-4">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F5B726]" />
          Chargement du menu du jour en direct...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-orange-200 text-center shadow-xl">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base mb-1">
            Connexion au serveur Programas impossible
          </h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => fetchMenuData(false)}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-colors inline-flex items-center gap-1.5 shadow-md shadow-orange-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {view === 'student' ? (
        <StudentMenu
          data={data}
          onOpenAdmin={() => setView('admin')}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      ) : (
        <AdminPanel
          data={data}
          onBackToStudent={() => setView('student')}
          onRefreshData={() => fetchMenuData(false)}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* Deploy Instructions Modal */}
      <DeployGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </>
  );
}
