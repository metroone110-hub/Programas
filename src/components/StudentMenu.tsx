import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Share2, 
  ChefHat, 
  RefreshCw, 
  Info,
  Search,
  History,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Bell,
  Utensils,
  Home,
  SlidersHorizontal,
  Bookmark,
  User,
  Plus,
  Check,
  Flame,
  X,
  Heart
} from 'lucide-react';
import type { RestaurantData, MealCategory, MenuItem, ServiceMenu, ServiceType } from '../types';
import { DietaryBadge } from './Badge';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationModal } from './NotificationModal';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  checkAndNotifyMenuUpdates, 
  requestNotificationPermission, 
  sendLocalNotification, 
  dishMatchesQuery,
  InAppAlert,
  NotificationSettings 
} from '../utils/notifications';

interface StudentMenuProps {
  data: RestaurantData;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
}

const CATEGORY_MAP: Record<MealCategory, { name: string; icon: string; bgClass: string; textClass: string }> = {
  plat: {
    name: 'Plats Chauds',
    icon: '🍗',
    bgClass: 'bg-[#FEF3C7]',
    textClass: 'text-[#92400E]'
  },
  accompagnement: {
    name: 'Accompagnements',
    icon: '🍚',
    bgClass: 'bg-[#FEF9C3]',
    textClass: 'text-[#854D0E]'
  },
  entree: {
    name: 'Entrées & Salades',
    icon: '🥗',
    bgClass: 'bg-[#DCFCE7]',
    textClass: 'text-[#166534]'
  },
  dessert: {
    name: 'Desserts & Fruits',
    icon: '🥭',
    bgClass: 'bg-[#FCE7F3]',
    textClass: 'text-[#9D174D]'
  },
  vegetarien: {
    name: 'Pôle Végétal',
    icon: '🌱',
    bgClass: 'bg-[#E0F2FE]',
    textClass: 'text-[#075985]'
  }
};

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.09-1.11l-.29-.17-3.04.8 1.05-2.96-.19-.3a8.19 8.19 0 0 1-1.25-4.5c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.57.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.49-.41-.43-.57-.44l-.49-.01c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.48-.61 1.69-1.19.21-.59.21-1.09.15-1.19-.06-.1-.23-.17-.48-.29z"/>
  </svg>
);

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

// Relative date label (Aujourd'hui, Hier, etc.)
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
  const [showHoursModal, setShowHoursModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [alertToast, setAlertToast] = useState<string | null>(null);
  const [activeInAppAlert, setActiveInAppAlert] = useState<InAppAlert | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState<boolean>(Boolean(data.announcement));
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | MealCategory>('all');

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

  // Build the list of all historic menus (strictly last 3 days)
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
      if (m.date >= cutoffStr) {
        if (!list.some(existing => existing.date === m.date && existing.service === m.service)) {
          list.push(m);
        }
      }
    }
    return list;
  }, [data.currentMenu, data.menuHistory]);

  // Check and notify whenever menu data updates
  useEffect(() => {
    if (data.currentMenu) {
      const result = checkAndNotifyMenuUpdates(data.currentMenu, allMenus);
      if (result.notified && result.inAppAlert) {
        setActiveInAppAlert(result.inAppAlert);
      }
    }
  }, [data.currentMenu, allMenus]);

  // Generate date tabs strictly for the last 3 days (Today, Yesterday, 2 days ago, 3 days ago)
  const dateTabs = useMemo(() => {
    const days: { date: string; label: string; shortDate: string; isPast: boolean }[] = [];
    const baseDate = new Date();

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

    days.sort((a, b) => b.date.localeCompare(a.date));
    return days;
  }, []);

  // Find the menu for currently selected date & service
  const currentDisplayedMenu = useMemo<ServiceMenu>(() => {
    const found = allMenus.find(m => m.date === selectedDate && m.service === selectedService);
    if (found) return found;

    const otherService = allMenus.find(m => m.date === selectedDate);
    if (otherService) return otherService;

    return {
      id: `${selectedDate}-${selectedService}`,
      date: selectedDate,
      service: selectedService,
      theme: '',
      items: []
    };
  }, [allMenus, selectedDate, selectedService]);

  const formattedFullDate = useMemo(() => {
    return formatFrenchDate(currentDisplayedMenu.date);
  }, [currentDisplayedMenu.date]);

  const relativeBadge = useMemo(() => {
    return getRelativeDateLabel(currentDisplayedMenu.date, todayStr);
  }, [currentDisplayedMenu.date, todayStr]);

  // Search results for food history across the 3 days
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

  // Toggle favorite alert for a specific dish
  const handleToggleDishAlert = async (dishTitle: string) => {
    const isAlready = notificationSettings.favoriteDishes.some(
      d => d.toLowerCase().trim() === dishTitle.toLowerCase().trim()
    );

    let updatedFavorites: string[];
    let message: string;

    if (isAlready) {
      updatedFavorites = notificationSettings.favoriteDishes.filter(
        d => d.toLowerCase().trim() !== dishTitle.toLowerCase().trim()
      );
      message = `Alerte retirée pour « ${dishTitle} ».`;
    } else {
      updatedFavorites = [...notificationSettings.favoriteDishes, dishTitle.trim()];
      message = `🔔 Alerte activée pour « ${dishTitle} » ! Vous serez prévenu dès qu'il sera servi.`;

      // Demander la permission si non encore activée
      if (!notificationSettings.enabled) {
        const granted = await requestNotificationPermission();
        if (granted) {
          notificationSettings.enabled = true;
        } else {
          setShowNotificationModal(true);
        }
      }

      // Vérifier immédiatement si ce plat est au menu aujourd'hui ou demain !
      const isCurrentlyInMenu = allMenus.some(m => 
        Array.isArray(m.items) && m.items.some(i => dishMatchesQuery(i.title, i.description, dishTitle))
      );

      if (isCurrentlyInMenu) {
        const title = `🔔 Votre plat favori « ${dishTitle} » est au menu !`;
        const body = `« ${dishTitle} » est actuellement programmé au Resto U UPGC au tarif de 200 FCFA. Bon appétit !`;
        sendLocalNotification(title, body);
        setActiveInAppAlert({
          id: `${Date.now()}`,
          title,
          body,
          dishName: dishTitle,
          type: 'favorite',
          timestamp: Date.now()
        });
      } else {
        sendLocalNotification(
          `🔔 Surveillance de « ${dishTitle} » activée !`,
          `Programas vous préviendra dès que ce plat sera au menu du Resto U UPGC.`
        );
      }
    }

    const updated = {
      ...notificationSettings,
      favoriteDishes: updatedFavorites
    };
    setNotificationSettings(updated);
    saveNotificationSettings(updated);

    setAlertToast(message);
    setTimeout(() => setAlertToast(null), 3500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Programas - Resto U UPGC Korhogo`,
        text: `Consultez le menu du jour (${formattedFullDate}) sur Programas - Resto U UPGC Korhogo (Ticket à 200 FCFA).`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Generate formatted WhatsApp share URL with meal items, date, price and app link
  const whatsappShareUrl = useMemo(() => {
    const serviceLabel = currentDisplayedMenu.service === 'dejeuner' ? 'Déjeuner (Midi)' : 'Dîner (Soir)';
    const dishesList = currentDisplayedMenu.items && currentDisplayedMenu.items.length > 0
      ? currentDisplayedMenu.items.map(item => `🍗 *${item.title}*${item.description ? ` (${item.description})` : ''}`).join('\n')
      : '• Aucun plat renseigné pour le moment';

    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://programas.ci';

    const text = 
      `🍽️ *MENU DU JOUR • PROGRAMAS* 🇨🇮\n` +
      `📍 *Resto U UPGC Korhogo (CROU-K)*\n` +
      `📅 *Date :* ${formattedFullDate} (${serviceLabel})\n` +
      `🎟️ *Tarif unique :* 200 FCFA\n\n` +
      `📋 *Au menu ce jour :*\n` +
      `${dishesList}\n\n` +
      `📲 *Consulte le menu complet et les alertes en direct :*\n` +
      `${shareUrl}`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }, [currentDisplayedMenu, formattedFullDate]);

  // Filter items by category tab
  const displayedItems = useMemo(() => {
    if (selectedCategoryFilter === 'all') return currentDisplayedMenu.items;
    return currentDisplayedMenu.items.filter(item => item.category === selectedCategoryFilter);
  }, [currentDisplayedMenu.items, selectedCategoryFilter]);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-[#F5B726] selection:text-black">
      {/* Container matches the sleek mobile/tablet width from the reference */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-32 space-y-6">

        {/* TOP STATUS BAR & HEADER */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar / Campus Icon */}
            <div className="w-12 h-12 rounded-full bg-[#F5B726] text-black font-black text-xl flex items-center justify-center shadow-sm border border-amber-300/40">
              <span>🍽️</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-slate-950 text-base leading-none tracking-tight">
                  Programas
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FEF3C7] text-amber-900">
                  CROU-K
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#F5B726] shrink-0" />
                <span>Resto U · UPGC Korhogo</span>
              </p>
            </div>
          </div>

          {/* Action icon buttons: Bell, Share, Admin */}
          <div className="flex items-center gap-2">
            {/* Notification Center Trigger */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-black hover:bg-slate-50 shadow-xs border border-black/5 flex items-center justify-center relative transition-transform active:scale-95"
              title="Alertes Menus & Plats Favoris"
            >
              <Bell className="w-4 h-4" />
              {notificationSettings.enabled ? (
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5B726] absolute top-1.5 right-1.5 border-2 border-white animate-pulse"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300 absolute top-2 right-2"></span>
              )}
            </button>

            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-black hover:bg-slate-50 shadow-xs border border-black/5 flex items-center justify-center transition-transform active:scale-95"
              title="Partager le menu"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Quick WhatsApp Share Button in Header */}
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs border border-emerald-600/20 flex items-center justify-center transition-transform active:scale-95 shrink-0"
              title="Partager le menu sur WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
            </a>

            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
              title="Espace Gestionnaire"
            >
              <ChefHat className="w-3.5 h-3.5 text-[#F5B726]" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </header>

        {/* ACTIVE IN-APP NOTIFICATION BANNER (Audio & Visual Alert) */}
        {activeInAppAlert && (
          <div className="bg-[#18181B] text-white p-4 sm:p-5 rounded-[26px] shadow-2xl border-2 border-[#F5B726] animate-in slide-in-from-top-3 duration-200 space-y-2 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#F5B726] text-black font-black text-xl flex items-center justify-center shrink-0 animate-bounce">
                  🔔
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#F5B726] text-black">
                    Alerte Détectée
                  </span>
                  <h4 className="font-black text-white text-sm sm:text-base mt-0.5 leading-snug">
                    {activeInAppAlert.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setActiveInAppAlert(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 font-medium pl-14">
              {activeInAppAlert.body}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  if (activeInAppAlert.dishName) {
                    const found = currentDisplayedMenu.items.find(i => dishMatchesQuery(i.title, i.description, activeInAppAlert.dishName!));
                    if (found) {
                      setHighlightedItemId(found.id);
                      const el = document.getElementById(`item-${found.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                  setActiveInAppAlert(null);
                }}
                className="px-4 py-2 rounded-full bg-[#F5B726] hover:bg-[#E5AA20] text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Voir le plat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TOAST ALERT FEEDBACK */}
        {alertToast && (
          <div className="bg-[#18181B] text-white p-3.5 rounded-[22px] shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-base">🔔</span>
              <span>{alertToast}</span>
            </div>
            <button onClick={() => setAlertToast(null)} className="text-slate-400 hover:text-white p-1">
              ✕
            </button>
          </div>
        )}

        {/* ANNOUNCEMENT BANNER (collapsible) */}
        {data.announcement && showAnnouncement && (
          <div className="bg-[#18181B] text-white p-3.5 rounded-[22px] shadow-sm flex items-start justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#F5B726] mt-1.5 shrink-0 animate-ping"></span>
              <p className="leading-snug text-slate-200">{data.announcement}</p>
            </div>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* HERO TITLE (matching "Let's Find Perfect Match") */}
        <section className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
            Menu du Jour & Plats Chauds
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Repas équilibrés du campus Peleforo Gon Coulibaly au tarif étudiant de 200 FCFA.
          </p>
        </section>

        {/* SIGNATURE BENTO GRID */}
        <section className="space-y-3">
          {/* Top 2 Golden Yellow Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Déjeuner (Midi) */}
            <div
              onClick={() => setSelectedService('dejeuner')}
              className={`p-4 sm:p-5 rounded-[26px] cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between relative overflow-hidden ${
                selectedService === 'dejeuner'
                  ? 'bg-[#F5B726] shadow-md ring-2 ring-black/10'
                  : 'bg-[#F6BE3C]/90 hover:bg-[#F5B726]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#18181B] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-2xs">
                  Midi
                </span>
                <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-slate-950 font-bold">
                  ☀️
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-black text-slate-950 text-base sm:text-lg leading-tight">
                  Service Déjeuner
                </h3>
                <p className="text-slate-800 text-xs font-semibold mt-0.5">
                  {data.hours.midi}
                </p>
              </div>

              {selectedService === 'dejeuner' && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-extrabold text-slate-950 bg-white/40 rounded-full px-2.5 py-0.5 w-fit">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Actif</span>
                </div>
              )}
            </div>

            {/* Card 2: Dîner (Soir) */}
            <div
              onClick={() => setSelectedService('diner')}
              className={`p-4 sm:p-5 rounded-[26px] cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between relative overflow-hidden ${
                selectedService === 'diner'
                  ? 'bg-[#F5B726] shadow-md ring-2 ring-black/10'
                  : 'bg-[#F6BE3C]/90 hover:bg-[#F5B726]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#18181B] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-2xs">
                  Soir
                </span>
                <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-slate-950 font-bold">
                  🌙
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-black text-slate-950 text-base sm:text-lg leading-tight">
                  Service Dîner
                </h3>
                <p className="text-slate-800 text-xs font-semibold mt-0.5">
                  {data.hours.soir}
                </p>
              </div>

              {selectedService === 'diner' && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-extrabold text-slate-950 bg-white/40 rounded-full px-2.5 py-0.5 w-fit">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Actif</span>
                </div>
              )}
            </div>
          </div>

          {/* Wide Card: Manage / Ticket 200 FCFA */}
          <div 
            onClick={() => setShowHoursModal(true)}
            className="bg-white p-4 sm:p-5 rounded-[26px] border border-black/5 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-all active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#18181B] text-white text-[11px] font-extrabold px-3 py-1 rounded-full">
                  Ticket Unique
                </span>
                <span className="text-xs font-bold text-slate-500">
                  CROU-K
                </span>
              </div>
              <h3 className="font-black text-slate-950 text-base sm:text-lg mt-2 tracking-tight">
                Tarif Étudiant · 200 FCFA
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tickets papier & Mobile Money (Wave, Orange, MTN, Moov).
              </p>
            </div>

            <div className="w-12 h-12 rounded-full bg-[#F5B726] text-black font-black text-xl flex items-center justify-center shadow-sm shrink-0">
              🎟️
            </div>
          </div>
        </section>

        {/* NOTIFICATION SUBSCRIPTION BANNER CARD */}
        <section className="bg-white p-4 sm:p-5 rounded-[26px] border border-black/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FEF3C7] text-amber-900 flex items-center justify-center text-xl shrink-0 font-bold border border-amber-200/50">
              🔔
            </div>
            <div>
              <h4 className="font-black text-slate-950 text-sm">
                Alerte Plat Spécifique & Nouveau Menu
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                Soyez alerté dès qu'un plat que vous aimez est prévu demain, ou dès qu'un menu est publié.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="px-4 py-2.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black shrink-0 transition-transform active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-[#F5B726]" />
            <span>{notificationSettings.enabled ? 'Gérer mes alertes' : 'Activer les alertes'}</span>
          </button>
        </section>

        {/* DATE SELECTOR: 3 DERNIERS JOURS (Strict Option A) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#F5B726]" />
              <span>Historique des 3 derniers jours</span>
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              Purge auto après 3j
            </span>
          </div>

          {/* Day selection tabs */}
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
                  className={`px-4 py-2.5 rounded-[20px] text-xs font-extrabold transition-all shrink-0 flex flex-col items-center gap-0.5 border ${
                    isSelected
                      ? 'bg-[#18181B] text-white border-[#18181B] shadow-md shadow-black/10 scale-[1.02]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-black/5'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.label}
                    {hasRecordedMenu && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#F5B726]' : 'bg-emerald-500'}`}></span>
                    )}
                  </span>
                  <span className={`text-[10px] font-medium capitalize ${isSelected ? 'text-[#F5B726]' : 'text-slate-400'}`}>
                    {tab.shortDate}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEARCH BAR */}
        <section className="relative">
          <div className="bg-white rounded-full p-2 pl-4 pr-3 shadow-xs border border-black/5 flex items-center gap-2.5 focus-within:ring-2 focus-within:ring-[#F5B726] transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={foodSearchQuery}
              onChange={(e) => setFoodSearchQuery(e.target.value)}
              placeholder="Quel plat recherchez-vous ? (ex: attiéké, poulet, riz gras...)"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            {foodSearchQuery ? (
              <button
                onClick={() => setFoodSearchQuery('')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
              >
                ✕
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#F5F0E8] text-slate-600 flex items-center justify-center text-xs">
                🍽️
              </div>
            )}
          </div>

          {/* Real-time search dropdown for the 3-day history */}
          {foodSearchQuery.trim().length >= 2 && (
            <div className="mt-2 p-3 bg-white rounded-[24px] border border-black/5 shadow-xl animate-in fade-in duration-150 absolute left-0 right-0 z-20">
              <div className="flex items-center justify-between text-xs font-black text-slate-800 pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-900">
                  <History className="w-3.5 h-3.5 text-[#F5B726]" />
                  Historique trouvé ({foodSearchResults.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Cliquez pour afficher
                </span>
              </div>

              {foodSearchResults.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Aucun repas trouvé pour « <strong className="text-slate-800">{foodSearchQuery}</strong> » dans les 3 derniers jours.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto mt-1">
                  {foodSearchResults.map((res, idx) => (
                    <div
                      key={`${res.item.id}-${idx}`}
                      onClick={() => handleSelectSearchResult(res)}
                      className="py-2.5 px-2 hover:bg-[#FEF9C3]/50 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                          <span>{res.item.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {CATEGORY_MAP[res.item.category]?.name || res.item.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-amber-700">
                            📅 {res.formattedDate}
                          </span>
                          <span>·</span>
                          <span>{res.service === 'dejeuner' ? 'Midi' : 'Soir'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                            {res.relativeLabel}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* MENU HEADER & CATEGORY TABS */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-950 text-lg tracking-tight">
                Plats au Menu
              </h3>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white text-slate-800 shadow-2xs border border-black/5">
                {displayedItems.length}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>{relativeBadge}</span>
                <span>·</span>
                <span className="capitalize">{formattedFullDate}</span>
              </div>

              {/* Bouton de partage WhatsApp en 1 clic */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                title="Partager le menu sur WhatsApp"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Segmented category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-colors ${
                selectedCategoryFilter === 'all'
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-black/5'
              }`}
            >
              Tous ({currentDisplayedMenu.items.length})
            </button>
            {(['plat', 'accompagnement', 'vegetarien', 'entree', 'dessert'] as MealCategory[]).map((cat) => {
              const count = currentDisplayedMenu.items.filter(i => i.category === cat).length;
              if (count === 0 && selectedCategoryFilter !== cat) return null;
              const catInfo = CATEGORY_MAP[cat];

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedCategoryFilter === cat
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-black/5'
                  }`}
                >
                  <span>{catInfo.icon}</span>
                  <span>{catInfo.name}</span>
                  <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* DISHES LIST CARDS */}
          {displayedItems.length === 0 ? (
            <div className="bg-white rounded-[26px] p-8 text-center border border-black/5 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center text-2xl mx-auto">
                📋
              </div>
              <h4 className="font-black text-slate-900 text-base">
                Aucun plat enregistré pour ce jour
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {currentDisplayedMenu.date === todayStr
                  ? "Le menu d'aujourd'hui n'a pas encore été publié par la cuisine du CROU-K. Il apparaîtra dès sa validation."
                  : `Aucun repas n'a été publié pour ${relativeBadge} (${currentDisplayedMenu.service === 'dejeuner' ? 'Midi' : 'Soir'}).`}
              </p>
              {selectedDate !== todayStr && (
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setSelectedService('dejeuner');
                  }}
                  className="px-4 py-2 rounded-full bg-[#18181B] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Revenir à aujourd'hui</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedItems.map((item) => {
                const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.plat;
                const isHighlighted = highlightedItemId === item.id;
                const isFavorited = notificationSettings.favoriteDishes.some(
                  d => d.toLowerCase().trim() === item.title.toLowerCase().trim()
                );

                return (
                  <div
                    key={item.id}
                    id={`item-${item.id}`}
                    className={`bg-white p-4 sm:p-5 rounded-[26px] border border-black/5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isHighlighted ? 'ring-2 ring-[#F5B726] bg-[#FEF9C3]/20' : ''
                    } ${!item.isAvailable ? 'opacity-60 bg-slate-50/50' : ''}`}
                  >
                    {/* Left: Avatar + Title & Meta */}
                    <div className="flex items-start gap-3.5">
                      {/* Circular icon container */}
                      <div className={`w-12 h-12 rounded-full ${catInfo.bgClass} ${catInfo.textClass} flex items-center justify-center text-xl shrink-0 font-bold border border-black/5`}>
                        {catInfo.icon}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-950 text-base leading-snug">
                            {item.title}
                          </h4>
                          {isHighlighted && (
                            <span className="bg-[#F5B726] text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                              Trouvé !
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Soft pastel chips row & specific dish alert button */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${catInfo.bgClass} ${catInfo.textClass}`}>
                            {catInfo.name}
                          </span>

                          {item.tags?.map((t) => (
                            <DietaryBadge key={t} tag={t} size="sm" />
                          ))}

                          {item.isAvailable ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#166534]">
                              En Cuisine
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDE2E4] text-[#991B1B]">
                              Épuisé
                            </span>
                          )}

                          {/* Specific dish alert bell button */}
                          <button
                            type="button"
                            onClick={() => handleToggleDishAlert(item.title)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                              isFavorited
                                ? 'bg-[#FEF3C7] text-amber-950 border border-amber-300 shadow-2xs'
                                : 'bg-slate-100 hover:bg-[#FEF3C7] text-slate-600 hover:text-amber-950'
                            }`}
                            title={`Alerte notification pour ${item.title}`}
                          >
                            <Bell className={`w-3 h-3 ${isFavorited ? 'fill-[#F5B726] text-amber-900' : ''}`} />
                            <span>{isFavorited ? 'Alerte active' : "M'alerter si servi"}</span>
                          </button>

                          {item.allergens && item.allergens.length > 0 && (
                            <button
                              onClick={() => setShowAllergensFor(item)}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline flex items-center gap-1 ml-1"
                            >
                              <Info className="w-3 h-3" />
                              <span>Allergènes</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Black pill price badge */}
                    <div className="sm:self-center shrink-0 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs font-bold text-slate-400 sm:hidden">
                        Tarif CROU-K
                      </span>
                      <span className="bg-[#18181B] text-white font-black px-4 py-2 rounded-full text-xs shrink-0 tracking-wide shadow-xs flex items-center gap-1.5">
                        <span>{item.priceExtra ? item.priceExtra : '200 FCFA'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PWA INSTALL CARD */}
        <PWAInstallButton variant="banner" />

        {/* FLOATING DARK BOTTOM NAVIGATION DOCK */}
        <nav 
          aria-label="Menu principal" 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#18181B] text-white px-5 sm:px-6 py-2.5 rounded-full flex items-center gap-6 sm:gap-7 shadow-2xl border border-white/10 backdrop-blur-md"
        >
          {/* 1. Home / Reset to Today */}
          <button
            onClick={() => {
              setSelectedDate(todayStr);
              setSelectedService('dejeuner');
              setFoodSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 text-white/80 hover:text-white transition-colors"
            title="Accueil / Aujourd'hui"
          >
            <Home className="w-5 h-5 text-white" />
          </button>

          {/* 2. Search / History */}
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="p-1.5 text-white/80 hover:text-white transition-colors"
            title="Recherche de plat"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* 3. PROMINENT CENTRAL YELLOW BUTTON: Espace Gestionnaire (+) */}
          <button
            onClick={onOpenAdmin}
            className="w-12 h-12 rounded-full bg-[#F5B726] text-black font-black text-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all -my-2"
            title="Espace Gestionnaire (Publier / Modifier)"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {/* 4. Notification Alerts Center */}
          <button
            onClick={() => setShowNotificationModal(true)}
            className="p-1.5 text-white/80 hover:text-white transition-colors relative"
            title="Alertes Menus & Plats Favoris"
          >
            <Bell className="w-5 h-5" />
            {notificationSettings.enabled && (
              <span className="w-2 h-2 rounded-full bg-[#F5B726] absolute top-1 right-1"></span>
            )}
          </button>

          {/* 5. WhatsApp Quick Share */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[#25D366] hover:text-white transition-colors"
            title="Partager le menu sur WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5 fill-[#25D366]" />
          </a>

          {/* 6. Hours & Info */}
          <button
            onClick={() => setShowHoursModal(true)}
            className="p-1.5 text-white/80 hover:text-white transition-colors"
            title="Horaires et tarifs"
          >
            <Clock className="w-5 h-5" />
          </button>
        </nav>

        {/* NOTIFICATION MODAL */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          settings={notificationSettings}
          onUpdateSettings={(newSettings) => setNotificationSettings(newSettings)}
        />

        {/* ALLERGENS MODAL */}
        {showAllergensFor && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-black/5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-[#FEF3C7] px-2.5 py-0.5 rounded-full">
                    Information Nutritionnelle
                  </span>
                  <h4 className="font-black text-slate-900 text-base mt-2 leading-snug">
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
                      className="px-3 py-1 rounded-full bg-[#FEF3C7] text-amber-900 text-xs font-bold"
                    >
                      ⚠️ {a}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowAllergensFor(null)}
                className="mt-5 w-full py-3 bg-[#18181B] hover:bg-black text-white rounded-full text-xs font-black transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* HOURS & PRACTICAL INFO MODAL */}
        {showHoursModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#F5F0E8] rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-black/5 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-[#FEF3C7] px-2.5 py-0.5 rounded-full">
                    Resto U · UPGC Korhogo
                  </span>
                  <h4 className="font-black text-slate-950 text-lg mt-1.5 leading-snug">
                    Horaires & Règlement CROU-K
                  </h4>
                </div>
                <button
                  onClick={() => setShowHoursModal(false)}
                  className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="bg-white p-4 rounded-[22px] shadow-2xs border border-black/5">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Service Déjeuner (Midi)</span>
                  <span className="font-black text-slate-950 text-base">{data.hours.midi}</span>
                </div>

                <div className="bg-white p-4 rounded-[22px] shadow-2xs border border-black/5">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Service Dîner (Soir)</span>
                  <span className="font-black text-slate-950 text-base">{data.hours.soir}</span>
                </div>

                <div className="bg-white p-4 rounded-[22px] shadow-2xs border border-black/5">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Paiements Acceptés</span>
                  <span className="font-black text-slate-950 text-sm">Tickets CROU-K & Mobile Money (Wave, Orange, MTN, Moov)</span>
                </div>

                <div className="bg-white p-4 rounded-[22px] shadow-2xs border border-black/5">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Tarif Unique</span>
                  <span className="font-black text-slate-950 text-sm">200 FCFA le ticket subventionné</span>
                </div>
              </div>

              <button
                onClick={() => setShowHoursModal(false)}
                className="w-full py-3 bg-[#18181B] hover:bg-black text-white rounded-full text-xs font-black transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
