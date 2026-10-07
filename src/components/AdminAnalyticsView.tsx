import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Share2, 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  Smartphone, 
  Globe, 
  Clock, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Heart,
  Search,
  Bell,
  Utensils
} from 'lucide-react';

interface DailyStat {
  date: string;
  visits: number;
  uniqueVisitors: number;
  interactions: number;
  shares: number;
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'visit' | 'interaction' | 'share';
  action: string;
  label: string;
  device?: string;
  details?: Record<string, any>;
}

interface AnalyticsData {
  totalVisits: number;
  totalUniqueVisitors: number;
  totalInteractions: number;
  totalShares: number;
  sharesBreakdown: {
    whatsapp: number;
    linkCopied: number;
    systemShare: number;
  };
  interactionsBreakdown: {
    favoriteToggle: number;
    menuView: number;
    dateSwitch: number;
    notificationToggle: number;
    dishSearch: number;
    hoursView: number;
  };
  deviceBreakdown: {
    android: number;
    ios: number;
    desktop: number;
    other: number;
  };
  dailyStats: Record<string, DailyStat>;
  recentEvents: ActivityEvent[];
  lastUpdated: string;
}

interface AdminAnalyticsViewProps {
  token: string;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ token }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Impossible de charger les statistiques.');
      }
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      } else {
        throw new Error(json.error || 'Erreur format données.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const res = await fetch('/api/analytics/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
        setShowResetConfirm(false);
        setFeedback('Statistiques remises à zéro avec succès !');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        throw new Error(json.error || 'Erreur réinitialisation.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setIsResetting(false);
    }
  };

  // Format relative timestamp
  const formatTimeAgo = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);

      if (diffSec < 60) return `À l'instant`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `Il y a ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays} j`;
    } catch {
      return 'Récemment';
    }
  };

  // Build 7-day chart data
  const chartDays = React.useMemo(() => {
    const list: Array<{ dateStr: string; label: string; visits: number; shares: number; interactions: number }> = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayStat = data?.dailyStats?.[iso];
      const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayNum = d.getDate();

      list.push({
        dateStr: iso,
        label: i === 0 ? "Aujourd'hui" : `${weekday} ${dayNum}`,
        visits: dayStat?.visits || 0,
        shares: dayStat?.shares || 0,
        interactions: dayStat?.interactions || 0,
      });
    }
    return list;
  }, [data]);

  const maxVisitsInChart = Math.max(...chartDays.map(d => d.visits), 1);

  if (loading && !data) {
    return (
      <div className="bg-white p-12 rounded-[28px] border border-black/5 shadow-xs flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#F5B726] animate-spin" />
        <p className="text-xs font-bold text-slate-600">Chargement de votre tableau de bord d'audience...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#FEF3C7] text-amber-950 font-black text-xs uppercase tracking-wider border border-amber-300">
              📊 Espace Privé Développeur & Créateur
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Invisible pour les étudiants
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-1.5">
            Suivi des Visites, Interactions & Partages
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Données d'utilisation en direct de l'application Programas au Resto U UPGC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all active:scale-95 flex items-center gap-2"
            title="Rafraîchir les statistiques"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border border-rose-200"
            title="Remettre les compteurs à zéro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Unique Visitors */}
        <div className="bg-white p-5 rounded-[26px] border border-black/5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Visiteurs Uniques
            </span>
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">
            {data?.totalUniqueVisitors ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            Appareils distincts ayant ouvert l'app
          </p>
        </div>

        {/* Card 2: Total Visits */}
        <div className="bg-white p-5 rounded-[26px] border border-black/5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Visites
            </span>
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              <Eye className="w-4 h-4 text-[#F5B726]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">
            {data?.totalVisits ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            Consultations & ouvertures totales
          </p>
        </div>

        {/* Card 3: Shares */}
        <div className="bg-white p-5 rounded-[26px] border border-black/5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Partages Réalisés
            </span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {data?.totalShares ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            WhatsApp ({data?.sharesBreakdown?.whatsapp ?? 0}) + Liens ({data?.sharesBreakdown?.linkCopied ?? 0})
          </p>
        </div>

        {/* Card 4: Interactions */}
        <div className="bg-white p-5 rounded-[26px] border border-black/5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Interactions
            </span>
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">
            {data?.totalInteractions ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            Favoris, filtres, rappels Duolingo...
          </p>
        </div>
      </div>

      {/* 7-DAY VISUAL ACTIVITY CHART */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-black/5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F5B726]" />
            <h3 className="font-black text-slate-950 text-sm sm:text-base">
              Activité des 7 Derniers Jours
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#F5B726]"></span>
              <span>Visites</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span>Partages</span>
            </span>
          </div>
        </div>

        {/* Bar chart container */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end pt-8 pb-2 h-44 sm:h-52 border-b border-slate-100">
          {chartDays.map((day) => {
            const heightPercent = Math.max(8, Math.round((day.visits / maxVisitsInChart) * 100));
            return (
              <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] font-black text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.visits} v.
                </div>
                <div className="w-full max-w-[36px] flex items-end gap-1 h-full">
                  {/* Visits Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-[#F5B726] rounded-t-lg transition-all group-hover:brightness-95 relative"
                    title={`${day.label}: ${day.visits} visites`}
                  ></div>
                  {/* Shares indicator bar */}
                  {day.shares > 0 && (
                    <div
                      style={{ height: `${Math.min(100, Math.max(12, (day.shares / maxVisitsInChart) * 100))}%` }}
                      className="w-2 sm:w-2.5 bg-emerald-500 rounded-t-sm"
                      title={`${day.shares} partages`}
                    ></div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-2 truncate w-full text-center">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 COLUMNS: BREAKDOWN DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Col 1: Partages & Canaux */}
        <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-black/5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-950 text-sm sm:text-base flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Canaux de Partage du Menu</span>
            </h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {data?.totalShares ?? 0} partages
            </span>
          </div>

          <div className="space-y-3">
            {/* WhatsApp */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  💬
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-xs">
                    Partage Direct WhatsApp
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Étudiants partageant la carte aux groupes & camarades
                  </p>
                </div>
              </div>
              <span className="text-base font-black text-emerald-800">
                {data?.sharesBreakdown?.whatsapp ?? 0}
              </span>
            </div>

            {/* Link copied */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  🔗
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-xs">
                    Lien Copié / Partage Système
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Liens copiés dans le presse-papier ou SMS
                  </p>
                </div>
              </div>
              <span className="text-base font-black text-slate-900">
                {(data?.sharesBreakdown?.linkCopied ?? 0) + (data?.sharesBreakdown?.systemShare ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Col 2: Interactions Détail */}
        <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-black/5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-950 text-sm sm:text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Actions & Interactions Utilisateurs</span>
            </h3>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {data?.totalInteractions ?? 0} actions
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-bold">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Plats ajoutés en favoris</span>
              </span>
              <span className="font-black text-slate-950">
                {data?.interactionsBreakdown?.favoriteToggle ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-bold">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Rappels Duolingo & alertes testés</span>
              </span>
              <span className="font-black text-slate-950">
                {data?.interactionsBreakdown?.notificationToggle ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-bold">
                <Search className="w-3.5 h-3.5 text-blue-500" />
                <span>Recherches de mets dans l'historique</span>
              </span>
              <span className="font-black text-slate-950">
                {data?.interactionsBreakdown?.dishSearch ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consultation horaires & tarifs (200 FCFA)</span>
              </span>
              <span className="font-black text-slate-950">
                {data?.interactionsBreakdown?.hoursView ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* APPAREILS / DEVICES BREAKDOWN */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-black/5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-950 text-sm sm:text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-900" />
            <span>Types d'Appareils des Étudiants</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Détection anonyme
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Android (Mobile)</span>
            <div className="text-lg font-black text-slate-950">
              {data?.deviceBreakdown?.android ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-500">iPhone (iOS)</span>
            <div className="text-lg font-black text-slate-950">
              {data?.deviceBreakdown?.ios ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Ordinateurs / PC</span>
            <div className="text-lg font-black text-slate-950">
              {data?.deviceBreakdown?.desktop ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Autres navigateurs</span>
            <div className="text-lg font-black text-slate-950">
              {data?.deviceBreakdown?.other ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY LOG (FLUX EN DIRECT) */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-black/5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-950 text-sm sm:text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F5B726]" />
            <span>Flux Récent d'Activité en Direct</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {data?.recentEvents?.length ?? 0} derniers événements
          </span>
        </div>

        {!data?.recentEvents || data.recentEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aucun événement enregistré pour l'instant. Dès que des personnes ouvriront ou partageront l'application, les actions apparaîtront ici.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {data.recentEvents.map((evt) => {
              let badgeColor = 'bg-slate-100 text-slate-700';
              let icon = '👁️';
              if (evt.type === 'share') {
                badgeColor = 'bg-emerald-100 text-emerald-800';
                icon = '📲';
              } else if (evt.type === 'interaction') {
                badgeColor = 'bg-purple-100 text-purple-800';
                icon = '⚡';
              }

              return (
                <div key={evt.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {evt.label}
                      </div>
                      {evt.device && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          {evt.device}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-500">
                      {formatTimeAgo(evt.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR RESET */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-black/5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div className="text-center">
              <h4 className="font-black text-slate-900 text-base">
                Réinitialiser les Statistiques ?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Tous les compteurs de visites, partages et interactions seront remis à zéro. Cette action est irréversible.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                {isResetting ? 'Remise à zéro...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
