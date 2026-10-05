import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CreditCard, 
  Share2, 
  ChefHat, 
  RefreshCw, 
  Check, 
  Info,
  Search,
  History,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Table as TableIcon
} from 'lucide-react';
import type { RestaurantData, MealCategory, MenuItem, ServiceMenu, ServiceType } from '../types';
import { DietaryBadge } from './Badge';
import { PWAInstallButton } from './PWAInstallButton';

interface StudentMenuProps {
  data: RestaurantData;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
}

const CATEGORY_NAMES: Record<MealCategory, { name: string; icon: string; badgeClass: string }> = {
  plat: {
    name: 'Plat de Résistance',
    icon: '🍗',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-200'
  },
  accompagnement: {
    name: 'Féculent / Accompagnement',
    icon: '🍚',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  entree: {
    name: 'Entrée / Crudités',
    icon: '🥗',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  dessert: {
    name: 'Dessert / Fruit',
    icon: '🥭',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  vegetarien: {
    name: 'Végétarien',
    icon: '🌱',
    badgeClass: 'bg-green-100 text-green-900 border-green-200'
  }
};

// Helper to format ISO date to French string
function formatFrenchDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return new Intl.DateTimeFormat('fr-FR', options || {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Format relative date label (Aujourd'hui, Hier, etc.)
function getRelativeDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "Aujourd'hui";
  
  try {
    const d1 = new Date(dateStr + 'T00:00:00');
    const d2 = new Date(todayStr + 'T00:00:00');
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays === 2) return 'Il y a 2 jours';
    if (diffDays === 3) return 'Il y a 3 jours';
    if (diffDays > 3) return `Il y a ${diffDays} jours`;
    if (diffDays === -1) return 'Demain';
    return formatFrenchDate(dateStr, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export const StudentMenu: React.FC<StudentMenuProps> = ({ data, onOpenAdmin, onOpenGuide }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllergensFor, setShowAllergensFor] = useState<MenuItem | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Today reference in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Selected date and service
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return data.currentMenu?.date || todayStr;
  });
  const [selectedService, setSelectedService] = useState<ServiceType>(() => {
    return data.currentMenu?.service || 'dejeuner';
  });

  // Build the list of all historic menus (filtered strictly to last 3 days)
  const allMenus = useMemo<ServiceMenu[]>(() => {
    const list: ServiceMenu[] = [];
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 3);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const source = [...(data.menuHistory || [])];
    if (data.currentMenu && !source.some(m => m.date === data.currentMenu.date && m.service === data.currentMenu.service)) {
      source.unshift(data.currentMenu);
    }

    for (const m of source) {
      // Option A: only keep menus from cutoffStr (last 3 days) or newer
      if (m.date >= cutoffStr) {
        if (!list.some(existing => existing.date === m.date && existing.service === m.service)) {
          list.push(m);
        }
      }
    }
    return list;
  }, [data.currentMenu, data.menuHistory]);

  // Generate date tabs strictly for the 3 last days: Today, Yesterday, 2 days ago, 3 days ago
  const dateTabs = useMemo(() => {
    const days: { date: string; label: string; shortDate: string; isPast: boolean }[] = [];
    const baseDate = new Date();

    // The 4 days: 0 (today), 1 (yesterday), 2 (2 days ago), 3 (3 days ago)
    for (let i = 0; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${day}`;
      
      days.push({
        date: iso,
        label: i === 0 ? "Aujourd'hui" : i === 1 ? 'Hier' : `Il y a ${i} jours`,
        shortDate: formatFrenchDate(iso, { weekday: 'short', day: 'numeric', month: 'short' }),
        isPast: i > 0
      });
    }

    // Sort descending by date
    days.sort((a, b) => b.date.localeCompare(a.date));
    return days;
  }, []);

  // Find the menu for currently selected date & service
  const currentDisplayedMenu = useMemo<ServiceMenu>(() => {
    // 1. Try to find exact match on date & service
    const found = allMenus.find(m => m.date === selectedDate && m.service === selectedService);
    if (found) return found;

    // 2. If not found for this service but exists for the other service on that date, return that
    const otherService = allMenus.find(m => m.date === selectedDate);
    if (otherService) return otherService;

    // 3. Fallback: empty menu for that date
    return {
      id: `${selectedDate}-${selectedService}`,
      date: selectedDate,
      service: selectedService,
      theme: '',
      items: []
    };
  }, [allMenus, selectedDate, selectedService]);

  // Formatted full date of current displayed menu
  const formattedFullDate = useMemo(() => {
    return formatFrenchDate(currentDisplayedMenu.date);
  }, [currentDisplayedMenu.date]);

  // Relative badge label for current displayed menu
  const relativeBadge = useMemo(() => {
    return getRelativeDateLabel(currentDisplayedMenu.date, todayStr);
  }, [currentDisplayedMenu.date, todayStr]);

  // Search results for food history across all recorded days
  const foodSearchResults = useMemo(() => {
    if (!foodSearchQuery.trim() || foodSearchQuery.trim().length < 2) return [];
    const query = foodSearchQuery.trim().toLowerCase();
    
    const results: Array<{
      item: MenuItem;
      date: string;
      service: ServiceType;
      theme?: string;
      relativeLabel: string;
      formattedDate: string;
    }> = [];

    for (const m of allMenus) {
      if (!Array.isArray(m.items)) continue;
      for (const item of m.items) {
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (matchesTitle || matchesDesc || matchesCategory) {
          results.push({
            item,
            date: m.date,
            service: m.service,
            theme: m.theme,
            relativeLabel: getRelativeDateLabel(m.date, todayStr),
            formattedDate: formatFrenchDate(m.date, { weekday: 'long', day: 'numeric', month: 'long' })
          });
        }
      }
    }

    return results;
  }, [foodSearchQuery, allMenus, todayStr]);

  const handleSelectSearchResult = (result: { date: string; service: ServiceType; item: MenuItem }) => {
    setSelectedDate(result.date);
    setSelectedService(result.service);
    setHighlightedItemId(result.item.id);
    setFoodSearchQuery('');
    setTimeout(() => {
      const el = document.getElementById(`item-${result.item.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Programas - Tableau de Bord Resto U UPGC Korhogo`,
        text: `Consultez le menu du jour (${formattedFullDate}) sur le tableau de bord officiel du Resto U UPGC Korhogo (Ticket à 200 FCFA).`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* 1. Tricolor Côte d'Ivoire Top Stripe */}
      <div>
        <div className="h-1.5 w-full grid grid-cols-3">
          <div className="bg-orange-500"></div>
          <div className="bg-white"></div>
          <div className="bg-green-600"></div>
        </div>

        {/* 2. Top Header Navigation */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-slate-900 tracking-tight text-lg leading-none">
                    Programas
                  </h1>
                  <span className="bg-orange-50 text-orange-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-orange-200">
                    🇨🇮 CROU-K
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                  <span>Resto U • Université Peleforo Gon Coulibaly (Korhogo)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PWAInstallButton variant="header" />
              
              <button
                onClick={handleShare}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Partager le tableau de bord"
              >
                <Share2 className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">{copiedLink ? 'Copié !' : 'Partager'}</span>
              </button>

              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
              >
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span>Espace Gestionnaire</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3. Announcement Banner (if any) */}
        {data.announcement && (
          <aside aria-label="Annonce officielle" className="bg-slate-900 text-white px-4 py-2 text-xs font-medium border-b border-slate-800">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                {data.announcement}
              </span>
            </div>
          </aside>
        )}

        {/* 4. MAIN CONTAINER: LE TABLEAU DE BORD DES MENUS */}
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          
          {/* SEARCH BOX: "QUEL JOUR Y AVAIT-IL TELLE NOURRITURE ?" */}
          <section className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs">
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <Search className="w-4 h-4 text-orange-600 shrink-0" />
                <input
                  type="text"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  placeholder="🔍 Quel jour y avait-il telle nourriture ? (ex: attiéké, tchep, sauce graine, poulet...)"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                />
                {foodSearchQuery && (
                  <button
                    onClick={() => setFoodSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1 font-bold"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Instant Search Results Dropdown */}
              {foodSearchQuery.trim().length >= 2 && (
                <div className="mt-2 p-3 bg-white rounded-xl border border-orange-200 shadow-lg animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 text-orange-700">
                      <History className="w-3.5 h-3.5" />
                      Historique des repas trouvés ({foodSearchResults.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Cliquez sur un repas pour voir le menu complet de ce jour
                    </span>
                  </div>

                  {foodSearchResults.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      Aucun plat ne correspond à « <strong className="text-slate-700">{foodSearchQuery}</strong> » dans l'historique des menus publiés.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-1">
                      {foodSearchResults.map((res, idx) => (
                        <div
                          key={`${res.item.id}-${idx}`}
                          onClick={() => handleSelectSearchResult(res)}
                          className="py-2.5 px-2 hover:bg-orange-50/60 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div>
                            <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                              <span>{res.item.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {CATEGORY_NAMES[res.item.category]?.name || res.item.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                              <span className="font-bold text-orange-700">
                                📅 {res.formattedDate}
                              </span>
                              <span>•</span>
                              <span>{res.service === 'dejeuner' ? '☀️ Déjeuner (Midi)' : '🌙 Dîner (Soir)'}</span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                {res.relativeLabel}
                              </span>
                            </div>
                          </div>
                          <button className="text-xs font-bold text-orange-600 group-hover:text-orange-700 flex items-center gap-1 shrink-0">
                            <span>Voir le jour</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* DATE SELECTOR BAR: 3 DERNIERS JOURS & HISTORIQUE */}
          <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Historique des 3 derniers jours (Suppression automatique après 3 jours)
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <span>Cliquez sur un jour pour voir les plats servis</span>
              </div>
            </div>

            {/* Horizontal Day Tabs: Aujourd'hui, Hier, Il y a 2 jours, Il y a 3 jours... */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {dateTabs.map((tab) => {
                const isSelected = selectedDate === tab.date;
                const hasRecordedMenu = allMenus.some(m => m.date === tab.date && m.items.length > 0);
                
                return (
                  <button
                    key={tab.date}
                    onClick={() => {
                      setSelectedDate(tab.date);
                      setHighlightedItemId(null);
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex flex-col items-center gap-0.5 border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/20 scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {tab.label}
                      {hasRecordedMenu && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-green-500'}`}></span>
                      )}
                    </span>
                    <span className={`text-[10px] font-medium capitalize ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                      {tab.shortDate}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Service Toggle for Selected Date (Midi / Soir) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedService('dejeuner')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5 ${
                    selectedService === 'dejeuner'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>☀️ Déjeuner (Midi)</span>
                </button>
                <button
                  onClick={() => setSelectedService('diner')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5 ${
                    selectedService === 'diner'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🌙 Dîner (Soir)</span>
                </button>
              </div>

              {/* Reset to Today button if looking at history */}
              {selectedDate !== todayStr && (
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setSelectedService('dejeuner');
                    setHighlightedItemId(null);
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Revenir au menu d'aujourd'hui</span>
                </button>
              )}
            </div>
          </section>

          {/* DASHBOARD HEADER CARD WITH CLEAR DATE */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                  <TableIcon className="w-3.5 h-3.5 text-orange-600" />
                  Tableau de Bord Officiel
                </span>
                
                {/* Clear Date Badge */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-950 border border-orange-300 font-black text-xs shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                  <span className="capitalize">{formattedFullDate}</span>
                </span>

                {/* Relative Badge (Aujourd'hui, Hier, Il y a 2 jours...) */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-black text-xs ${
                  currentDisplayedMenu.date === todayStr
                    ? 'bg-green-100 text-green-900 border border-green-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {relativeBadge}
                </span>

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-xs">
                  {currentDisplayedMenu.service === 'dejeuner' ? 'Service Déjeuner (Midi)' : 'Service Dîner (Soir)'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentDisplayedMenu.theme || `Menu du ${formattedFullDate}`}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {currentDisplayedMenu.publishedAt ? (
                  <span>
                    Publié officiellement le {formatFrenchDate(currentDisplayedMenu.publishedAt.split('T')[0])} par le restaurant universitaire (CROU-K).
                  </span>
                ) : (
                  <span>Affichage des repas publiés par la direction du restaurant universitaire (CROU-K).</span>
                )}
              </p>
            </div>

            {/* Ticket Price Badge */}
            <div className="p-3 sm:p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                🎟️
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-800 block">
                  Ticket Repas Unique
                </span>
                <span className="text-xl font-black text-slate-900">
                  200 FCFA
                </span>
              </div>
            </div>
          </section>

          {/* LE TABLEAU DE BORD DU MENU POUR CE JOUR */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  Repas du {formattedFullDate} ({currentDisplayedMenu.service === 'dejeuner' ? 'Midi' : 'Soir'})
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {currentDisplayedMenu.items.length === 0 
                  ? '0 plat enregistré' 
                  : `${currentDisplayedMenu.items.length} plat(s) au menu`}
              </span>
            </div>

            {currentDisplayedMenu.items.length === 0 ? (
              /* ÉTAT VIDE POUR LE JOUR SÉLECTIONNÉ */
              <div className="p-10 sm:p-14 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-4 text-3xl">
                  📋
                </div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                  Aucun menu enregistré pour le {formattedFullDate}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                  {currentDisplayedMenu.date === todayStr ? (
                    "Le menu d'aujourd'hui n'a pas encore été publié par la direction du CROU-K. Les plats apparaîtront dès la validation en cuisine."
                  ) : (
                    `Aucun plat n'a été publié pour ce jour (${relativeBadge}). Le restaurant était peut-être fermé le week-end ou le menu n'a pas été saisi sur le portail.`
                  )}
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {selectedDate !== todayStr && (
                    <button
                      onClick={() => {
                        setSelectedDate(todayStr);
                        setSelectedService('dejeuner');
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Consulter le menu d'aujourd'hui</span>
                    </button>
                  )}
                  <button
                    onClick={onOpenAdmin}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ChefHat className="w-4 h-4 text-orange-600" />
                    <span>Espace Gestionnaire (Publier ce menu)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TABLEAU DE BORD REMPLI DES PLATS DE CE JOUR */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-5">Rayon / Catégorie</th>
                      <th className="py-3.5 px-5">Plat & Ingrédients</th>
                      <th className="py-3.5 px-5">Spécificités</th>
                      <th className="py-3.5 px-5">Disponibilité</th>
                      <th className="py-3.5 px-5 text-right">Tarif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {currentDisplayedMenu.items.map((item) => {
                      const catInfo = CATEGORY_NAMES[item.category] || CATEGORY_NAMES.plat;
                      const isHighlighted = highlightedItemId === item.id;

                      return (
                        <tr 
                          key={item.id} 
                          id={`item-${item.id}`}
                          className={`transition-colors ${
                            isHighlighted 
                              ? 'bg-amber-100/60 font-semibold ring-2 ring-orange-500/50' 
                              : 'hover:bg-slate-50'
                          } ${
                            !item.isAvailable ? 'opacity-50 bg-slate-50/50' : ''
                          }`}
                        >
                          {/* 1. Category */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${catInfo.badgeClass}`}>
                              <span>{catInfo.icon}</span>
                              <span>{catInfo.name}</span>
                            </span>
                          </td>

                          {/* 2. Title & Description */}
                          <td className="py-3.5 px-5">
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <span>{item.title}</span>
                              {isHighlighted && (
                                <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black animate-pulse">
                                  Trouvé !
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {item.allergens && item.allergens.length > 0 && (
                              <button
                                onClick={() => setShowAllergensFor(item)}
                                className="text-[10px] text-orange-700 hover:text-orange-900 underline font-semibold mt-1 flex items-center gap-1"
                              >
                                <Info className="w-3 h-3" />
                                Allergènes : {item.allergens.join(', ')}
                              </button>
                            )}
                          </td>

                          {/* 3. Tags */}
                          <td className="py-3.5 px-5">
                            <div className="flex flex-wrap gap-1">
                              {item.tags && item.tags.length > 0 ? (
                                item.tags.map((tag) => (
                                  <DietaryBadge key={tag} tag={tag} size="sm" />
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400">Classique</span>
                              )}
                            </div>
                          </td>

                          {/* 4. Availability */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            {item.isAvailable ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                En Cuisine
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Épuisé
                              </span>
                            )}
                          </td>

                          {/* 5. Price */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <span className="font-black text-slate-900 text-sm">
                              {item.priceExtra ? item.priceExtra : 'Compris (200 F)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 5. Practical Info & Hours */}
          <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Horaires du Service & Règlement CROU-K</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Service du Midi</span>
                <span className="font-black text-slate-900 text-sm">{data.hours.midi}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Service du Soir</span>
                <span className="font-black text-slate-900 text-sm">{data.hours.soir}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Paiement Accepté</span>
                <span className="font-black text-slate-900 text-sm">Tickets CROU-K & Mobile Money</span>
              </div>
            </div>
          </section>

          {/* PWA Install Banner */}
          <PWAInstallButton variant="banner" />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Programas • {data.name} — Université Peleforo Gon Coulibaly (Korhogo, Côte d'Ivoire)
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Réservé à l'affichage officiel des repas de la cantine et du restaurant universitaire CROU-K.
        </p>
      </footer>

      {/* Allergens Modal */}
      {showAllergensFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Information Nutritionnelle
                </span>
                <h4 className="font-black text-slate-900 text-base mt-1 leading-snug">
                  {showAllergensFor.title}
                </h4>
              </div>
              <button
                onClick={() => setShowAllergensFor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold text-slate-700 mb-2">
                Allergènes ou ingrédients signalés par la cuisine :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {showAllergensFor.allergens?.map((a) => (
                  <span
                    key={a}
                    className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-900 border border-orange-200 text-xs font-bold"
                  >
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAllergensFor(null)}
              className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
