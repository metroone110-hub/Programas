import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ArrowLeft,
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
  Heart,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  Smartphone
} from 'lucide-react';
import type { RestaurantData, MealCategory, MenuItem, ServiceMenu, ServiceType } from '../types';
import { DietaryBadge } from './Badge';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationModal } from './NotificationModal';
import { DuolingoMealPopup } from './DuolingoMealPopup';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  checkAndNotifyMenuUpdates, 
  checkMealTimeReminders,
  triggerTestMealTimeAlert,
  requestNotificationPermission, 
  sendLocalNotification, 
  dishMatchesQuery,
  clearSignaturesForDish,
  getUnreadBadgeCount,
  setAppBadgeCount,
  incrementAppBadge,
  clearAppBadge,
  InAppAlert,
  NotificationSettings 
} from '../utils/notifications';
import { trackShare, trackInteraction } from '../utils/analytics';

interface StudentMenuProps {
  data: RestaurantData;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
}

type HorizontalSection = 'history' | 'main_menu' | 'info';
const SECTIONS_ORDER: HorizontalSection[] = ['history', 'main_menu', 'info'];

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
  // Horizontal Section State:
  // 'history' (Gauche) | 'main_menu' (Page Principale / Centre) | 'info' (Droite)
  const [activeSection, setActiveSection] = useState<HorizontalSection>('main_menu');

  // Red Badge Counter Pastille (Badging API + in-app)
  const [unreadBadgeCount, setUnreadBadgeCount] = useState<number>(() => getUnreadBadgeCount());

  // Horizontal Swipe Container Ref for native 1:1 finger scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Synchronisation en direct de la pastille rouge numérotée (Badging API, Favicon & In-app)
  useEffect(() => {
    // Initialisation au chargement de l'app
    const initial = getUnreadBadgeCount();
    setUnreadBadgeCount(initial);
    setAppBadgeCount(initial);

    const handleBadgeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      if (customEvent.detail && typeof customEvent.detail.count === 'number') {
        setUnreadBadgeCount(customEvent.detail.count);
      } else {
        setUnreadBadgeCount(getUnreadBadgeCount());
      }
    };

    window.addEventListener('programas-badge-updated', handleBadgeUpdate);
    return () => window.removeEventListener('programas-badge-updated', handleBadgeUpdate);
  }, []);

  // Initial scroll position: land directly on the center (Page Principale / Menu du Jour)
  useEffect(() => {
    const setInitialPosition = () => {
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft = width; // Index 1: main_menu
      }
    };

    setInitialPosition();
    const timer = setTimeout(setInitialPosition, 100);
    return () => clearTimeout(timer);
  }, []);

  // Smoothly scroll container to selected horizontal section (utilisé lors du clic sur un onglet ou bouton)
  const scrollToSection = (sec: HorizontalSection) => {
    setActiveSection(sec);
    if (!scrollContainerRef.current) return;
    const index = SECTIONS_ORDER.indexOf(sec);
    const width = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollTo({
      left: index * width,
      behavior: 'smooth'
    });
  };

  // Sync activeSection indicator as user drags / swipes with their fingers (défilement fluide 60fps natif)
  const handleContainerScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    if (clientWidth <= 0) return;
    const index = Math.round(scrollLeft / clientWidth);
    const current = SECTIONS_ORDER[index];
    if (current && current !== activeSection) {
      setActiveSection(current);
    }
  };

  // Check and notify whenever menu data updates
  useEffect(() => {
    if (data.currentMenu) {
      const result = checkAndNotifyMenuUpdates(data.currentMenu, allMenus);
      if (result.notified && result.inAppAlert) {
        setActiveInAppAlert(result.inAppAlert);
      }
    }
  }, [data.currentMenu, allMenus]);

  // Automated Duolingo-style persistent reminders (11h30, 14h30, 18h30)
  useEffect(() => {
    const checkSchedule = () => {
      const mealAlert = checkMealTimeReminders();
      if (mealAlert) {
        setActiveInAppAlert(mealAlert);
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 15000);
    return () => clearInterval(interval);
  }, []);

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

  // Past days strictly (Hier, -2j, -3j) for the left history section
  const pastDaysTabs = useMemo(() => {
    return dateTabs.filter(d => d.isPast);
  }, [dateTabs]);

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
      trackInteraction('favorite_toggle', { dish: dishTitle, action: 'removed' });
    } else {
      updatedFavorites = [...notificationSettings.favoriteDishes, dishTitle.trim()];
      message = `🔔 Alerte activée pour « ${dishTitle} » ! Vous serez prévenu dès qu'il sera servi.`;
      trackInteraction('favorite_toggle', { dish: dishTitle, action: 'added' });

      // Clear any cached signatures for this dish so it immediately triggers
      clearSignaturesForDish(dishTitle);

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
        const c = incrementAppBadge(1);
        setUnreadBadgeCount(c);
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
      trackShare('system_share', { date: selectedDate, service: selectedService });
      navigator.share({
        title: `Programas - Resto U UPGC Korhogo`,
        text: `Consultez le menu du jour (${formattedFullDate}) sur Programas - Resto U UPGC Korhogo (Ticket à 200 FCFA).`,
        url: window.location.href
      }).catch(() => {});
    } else {
      trackShare('link_copied', { date: selectedDate, service: selectedService });
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
      {/* Container matches the sleek mobile/tablet width */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-32 space-y-4">

        {/* BARRE SUPÉRIEURE FIGÉE (HEADER + ONGLETS HORIZONTAUX ANCRÉS COMME UNE APPLICATION NATIVE) */}
        <div className="sticky top-0 z-30 bg-[#F5F0E8]/95 backdrop-blur-md pt-2 pb-2.5 space-y-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-black/5 shadow-2xs">
          {/* TOP STATUS BAR & HEADER */}
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Avatar / Campus Icon with red badge pastille */}
              <div className="relative">
                <div className="w-12 h-12 rounded-[16px] overflow-hidden shadow-sm border border-amber-300/40 shrink-0 bg-white">
                  <img
                    src="/icon.svg"
                    alt="Programas Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                {unreadBadgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                    {unreadBadgeCount > 99 ? '99+' : unreadBadgeCount}
                  </span>
                )}
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

            {/* Action icon buttons: Bell, WhatsApp, Admin */}
            <div className="flex items-center gap-2">
              {/* Cloche de notifications avec la vraie pastille rouge numérotée (style iOS / Android) */}
              <button
                onClick={() => {
                  setShowNotificationModal(true);
                  clearAppBadge();
                  setUnreadBadgeCount(0);
                }}
                className="w-10 h-10 rounded-full bg-white text-slate-800 hover:text-black hover:bg-slate-50 shadow-xs border border-black/5 flex items-center justify-center relative transition-transform active:scale-95 shrink-0"
                title="Centre de notifications et alertes"
              >
                <Bell className="w-4 h-4" />
                {unreadBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                    {unreadBadgeCount > 99 ? '99+' : unreadBadgeCount}
                  </span>
                )}
              </button>

              {/* Quick WhatsApp Share Button in Header */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackShare('whatsapp_share', { date: selectedDate, service: selectedService, location: 'header' })}
                className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs border border-emerald-600/20 flex items-center justify-center transition-transform active:scale-95 shrink-0"
                title="Partager le menu sur WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
              </a>

              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 shrink-0"
                title="Espace Gestionnaire"
              >
                <ChefHat className="w-3.5 h-3.5 text-[#F5B726]" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </header>

          {/* HORIZONTAL NAVIGATION BAR (DE GAUCHE À DROITE) */}
          <div className="space-y-1.5">
            <nav aria-label="Sections horizontales" className="bg-white p-1.5 rounded-[28px] border border-black/5 shadow-xs flex items-center justify-between gap-1">
              {/* Gauche : Jours Passés (-3j) */}
              <button
                onClick={() => scrollToSection('history')}
                className={`flex-1 py-2.5 px-2 sm:px-3 rounded-[22px] transition-all flex items-center justify-center gap-1.5 text-xs font-black ${
                  activeSection === 'history'
                    ? 'bg-[#18181B] text-white shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-black hover:bg-slate-100'
                }`}
              >
                <span>📅</span>
                <span className="truncate">Jours Passés</span>
              </button>

              {/* Centre : Page Principale (Menu du Jour) */}
              <button
                onClick={() => {
                  scrollToSection('main_menu');
                  setSelectedDate(todayStr);
                }}
                className={`flex-1 py-2.5 px-2 sm:px-3 rounded-[22px] transition-all flex items-center justify-center gap-1.5 text-xs font-black ${
                  activeSection === 'main_menu'
                    ? 'bg-[#F5B726] text-slate-950 shadow-md font-black scale-[1.03] ring-2 ring-amber-400/40'
                    : 'text-slate-600 hover:text-black hover:bg-slate-100'
                }`}
              >
                <span>🍽️</span>
                <span className="truncate">Menu du Jour</span>
              </button>

              {/* Droite : Alertes & Infos Pratiques */}
              <button
                onClick={() => {
                  scrollToSection('info');
                  clearAppBadge();
                  setUnreadBadgeCount(0);
                }}
                className={`flex-1 py-2.5 px-2 sm:px-3 rounded-[22px] transition-all flex items-center justify-center gap-1.5 text-xs font-black relative ${
                  activeSection === 'info'
                    ? 'bg-[#18181B] text-white shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-black hover:bg-slate-100'
                }`}
              >
                <span>🔔</span>
                <span className="truncate">Alertes & Infos</span>
                {unreadBadgeCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black shrink-0">
                    {unreadBadgeCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Swipe indicator dots & touch hint */}
            <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-slate-400">
              <button 
                onClick={() => scrollToSection('history')} 
                className="flex items-center gap-1 hover:text-slate-700"
              >
                <ChevronLeft className="w-3 h-3 text-[#F5B726]" />
                <span>Jours passés</span>
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollToSection('history')}
                  className={`h-1.5 rounded-full transition-all ${
                    activeSection === 'history' ? 'w-5 bg-[#18181B]' : 'w-2 bg-slate-300'
                  }`}
                  title="Jours passés"
                />
                <button
                  onClick={() => scrollToSection('main_menu')}
                  className={`h-1.5 rounded-full transition-all ${
                    activeSection === 'main_menu' ? 'w-6 bg-[#F5B726]' : 'w-2 bg-slate-300'
                  }`}
                  title="Menu du jour"
                />
                <button
                  onClick={() => scrollToSection('info')}
                  className={`h-1.5 rounded-full transition-all ${
                    activeSection === 'info' ? 'w-5 bg-[#18181B]' : 'w-2 bg-slate-300'
                  }`}
                  title="Alertes & infos"
                />
              </div>

              <button 
                onClick={() => scrollToSection('info')} 
                className="flex items-center gap-1 hover:text-slate-700"
              >
                <span>Alertes & infos</span>
                <ChevronRight className="w-3 h-3 text-[#F5B726]" />
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE IN-APP NOTIFICATION BANNER (Audio & Visual Alert for favorites & new menus) */}
        {activeInAppAlert && activeInAppAlert.type !== 'meal_time' && (
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
                      scrollToSection('main_menu');
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

        {/* ========================================================================================= */}
        {/* NATIVE HORIZONTAL SWIPEABLE SLIDER CONTAINER (SWIPE AU DOIGT GAUCHE ↔ CENTRE ↔ DROITE)    */}
        {/* ========================================================================================= */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar overscroll-contain select-none"
          style={{ 
            scrollSnapType: 'x mandatory', 
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            touchAction: 'pan-x pan-y'
          }}
        >

          {/* --------------------------------------------------------------------------------------- */}
          {/* SLIDE 0 (GAUCHE) : LES JOURS DES PLATS PLANIFIÉS QUI SONT PASSÉS (HISTORIQUE -3J)       */}
          {/* --------------------------------------------------------------------------------------- */}
          <div className="w-full shrink-0 snap-start snap-always space-y-5 px-0.5">
            {/* Header section de gauche */}
            <div className="bg-white p-5 rounded-[28px] border border-black/5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#F5B726]" />
                  <span>Jours Passés & Archives (Fenêtre 3 jours)</span>
                </span>
                <span className="text-[11px] font-bold text-amber-900 bg-[#FEF3C7] px-2.5 py-0.5 rounded-full">
                  Purge auto après 3j
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Consultez ce qui a été servi les jours précédents au Resto U UPGC ou recherchez un repas passé.
              </p>

              {/* Sélecteur de jours passés (Hier, -2j, -3j) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar overscroll-contain">
                {pastDaysTabs.map((tab) => {
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
                          : 'bg-[#F5F0E8] hover:bg-slate-200 text-slate-800 border-black/5'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {tab.label}
                        {hasRecordedMenu && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#F5B726]' : 'bg-emerald-500'}`}></span>
                        )}
                      </span>
                      <span className={`text-[10px] font-medium capitalize ${isSelected ? 'text-[#F5B726]' : 'text-slate-500'}`}>
                        {tab.shortDate}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barre de recherche dans l'historique des jours passés */}
            <div className="bg-white rounded-full p-2 pl-4 pr-3 shadow-xs border border-black/5 flex items-center gap-2.5 focus-within:ring-2 focus-within:ring-[#F5B726] transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                placeholder="Quel repas recherchez-vous dans les jours passés ? (ex: attiéké, sauce graine...)"
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
                  🔍
                </div>
              )}
            </div>

            {/* Résultats de la recherche d'historique */}
            {foodSearchQuery.trim().length >= 2 && (
              <div className="p-4 bg-white rounded-[26px] border border-black/5 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 pb-2 border-b border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <History className="w-3.5 h-3.5 text-[#F5B726]" />
                    Repas trouvés dans l'historique ({foodSearchResults.length})
                  </span>
                </div>

                {foodSearchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500">
                    Aucun repas trouvé pour « <strong className="text-slate-800">{foodSearchQuery}</strong> » dans les 3 derniers jours.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {foodSearchResults.map((res, idx) => (
                      <div
                        key={`${res.item.id}-${idx}`}
                        onClick={() => handleSelectSearchResult(res)}
                        className="py-2.5 px-2 hover:bg-[#FEF9C3]/50 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <span>{res.item.title}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {CATEGORY_MAP[res.item.category]?.name || res.item.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                            <span className="font-bold text-amber-800">
                              📅 {res.formattedDate}
                            </span>
                            <span>·</span>
                            <span>{res.service === 'dejeuner' ? 'Midi' : 'Soir'}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                              {res.relativeLabel}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Affichage des repas du jour passé sélectionné */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-black text-slate-950 text-base">
                    Menu servi : {relativeBadge}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize">
                    {formattedFullDate} · Service {selectedService === 'dejeuner' ? 'Déjeuner (Midi)' : 'Dîner (Soir)'}
                  </p>
                </div>

                {/* Switch Midi / Soir pour ce jour passé */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-black/5">
                  <button
                    onClick={() => setSelectedService('dejeuner')}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition-colors ${
                      selectedService === 'dejeuner' ? 'bg-[#F5B726] text-black' : 'text-slate-600'
                    }`}
                  >
                    Midi
                  </button>
                  <button
                    onClick={() => setSelectedService('diner')}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition-colors ${
                      selectedService === 'diner' ? 'bg-[#F5B726] text-black' : 'text-slate-600'
                    }`}
                  >
                    Soir
                  </button>
                </div>
              </div>

              {/* Liste des plats servis ce jour passé */}
              {displayedItems.length === 0 ? (
                <div className="bg-white rounded-[26px] p-6 text-center border border-black/5 shadow-xs space-y-2">
                  <div className="text-2xl">📋</div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Aucun plat enregistré pour ce service
                  </h4>
                  <p className="text-xs text-slate-500">
                    Aucun plat n'a été consigné pour {relativeBadge} ({selectedService === 'dejeuner' ? 'Midi' : 'Soir'}).
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedItems.map((item) => {
                    const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.plat;
                    return (
                      <div
                        key={item.id}
                        className="bg-white p-4 rounded-[22px] border border-black/5 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${catInfo.bgClass} ${catInfo.textClass} flex items-center justify-center text-lg font-bold shrink-0`}>
                            {catInfo.icon}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm leading-tight">
                              {item.title}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {catInfo.name} · Servi au tarif étudiant de 200 FCFA
                            </span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#18181B] text-white text-xs font-black shrink-0">
                          200 FCFA
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bouton de retour direct vers la page principale */}
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setSelectedDate(todayStr);
                  scrollToSection('main_menu');
                }}
                className="w-full py-3.5 rounded-full bg-[#F5B726] hover:bg-[#E5AA20] text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>🍽️ Revenir au Menu du Jour (Page Principale)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------------------------------- */}
          {/* SLIDE 1 (CENTRE) : TABLEAU DE MENU DU JOUR (PAGE PRINCIPALE)                             */}
          {/* --------------------------------------------------------------------------------------- */}
          <div className="w-full shrink-0 snap-start snap-always space-y-5 px-0.5">
            {/* HERO TITLE DU MENU DU JOUR */}
            <section className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-[#FEF3C7] px-3 py-1 rounded-full border border-amber-200">
                  🍽️ Page Principale · Resto U UPGC
                </span>
                <span className="text-xs font-extrabold text-slate-500">
                  Ticket 200 FCFA
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight pt-1">
                Menu du Jour en Direct
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {formattedFullDate} · Campus Peleforo Gon Coulibaly (CROU-K).
              </p>
            </section>

            {/* SERVICE TOGGLE BENTO CARDS (MIDI / SOIR) */}
            <section className="grid grid-cols-2 gap-3">
              {/* Carte Déjeuner (Midi) */}
              <div
                onClick={() => {
                  setSelectedDate(todayStr);
                  setSelectedService('dejeuner');
                }}
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

              {/* Carte Dîner (Soir) */}
              <div
                onClick={() => {
                  setSelectedDate(todayStr);
                  setSelectedService('diner');
                }}
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
            </section>

            {/* CATEGORY FILTER CHIPS & QUICK ACTIONS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-950 text-base sm:text-lg tracking-tight">
                    Plats Disponibles
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white text-slate-800 shadow-2xs border border-black/5">
                    {displayedItems.length}
                  </span>
                </div>

                {/* Bouton de partage WhatsApp en 1 clic */}
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackShare('whatsapp_share', { date: selectedDate, service: selectedService, location: 'dishes_list' })}
                  className="px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                  title="Partager le menu du jour sur WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Segmented category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar overscroll-contain">
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

              {/* LISTE DES PLATS DU MENU PRINCIPAL */}
              {displayedItems.length === 0 ? (
                <div className="bg-white rounded-[26px] p-8 text-center border border-black/5 shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center text-2xl mx-auto">
                    🍽️
                  </div>
                  <h4 className="font-black text-slate-900 text-base">
                    Le menu de ce service est en préparation
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    La cuisine du CROU-K n'a pas encore validé les plats pour ce service. Ils apparaîtront ici dès leur publication officielle.
                  </p>
                  <button
                    onClick={() => scrollToSection('history')}
                    className="px-4 py-2.5 rounded-full bg-[#18181B] text-white text-xs font-black inline-flex items-center gap-2 shadow-sm"
                  >
                    <span>📅 Voir ce qui était servi hier (-3j)</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3" id="menu-items-grid">
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

            {/* BOUTONS DE NAVIGATION HORIZONTALE RAPIDE EN BAS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => scrollToSection('history')}
                className="p-3.5 rounded-[22px] bg-white hover:bg-slate-100 text-slate-900 border border-black/5 text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-[#F5B726]" />
                <span>Jours passés (-3j)</span>
              </button>

              <button
                onClick={() => scrollToSection('info')}
                className="p-3.5 rounded-[22px] bg-white hover:bg-slate-100 text-slate-900 border border-black/5 text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Alertes & Tarifs</span>
                <ChevronRight className="w-4 h-4 text-[#F5B726]" />
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------------------------------- */}
          {/* SLIDE 2 (DROITE) : ALERTES, NOTIFICATIONS DUOLINGO & INFOS PRATIQUES                     */}
          {/* --------------------------------------------------------------------------------------- */}
          <div className="w-full shrink-0 snap-start snap-always space-y-5 px-0.5">
            {/* Header section de droite */}
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-[#FEF3C7] px-3 py-1 rounded-full border border-amber-200">
                🔔 Section Droite · Alertes & Pratique
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight pt-1">
                Alertes Repas & Infos CROU-K
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Rappels automatiques du Chef (Duolingo 11h30, 14h30, 18h30) et tarifs officiels.
              </p>
            </div>

            {/* PASTILLE ROUGE NUMÉROTÉE SUR L'ICÔNE (BADGING API STYLE IOS / ANDROID) */}
            <div className="bg-white p-5 rounded-[28px] border border-black/5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-[#F5B726] text-black font-black flex items-center justify-center text-xl shadow-xs">
                      📱
                    </div>
                    {unreadBadgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                        {unreadBadgeCount > 99 ? '99+' : unreadBadgeCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-950 text-sm">
                      Pastille Rouge sur l'Icône de l'App
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Chiffre rouge sur l'écran d'accueil (comme WhatsApp, Snapchat, Messages)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F5F0E8] rounded-2xl flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Compteur de notifications non lues :</span>
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black">
                  {unreadBadgeCount > 0 ? `${unreadBadgeCount} alerte(s)` : '0 (Aucune)'}
                </span>
              </div>

              {/* Boutons pour tester le badge */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    const next = incrementAppBadge(1);
                    setAlertToast(`🔴 Pastille mise à jour : +1 (Total : ${next})`);
                    setTimeout(() => setAlertToast(null), 2500);
                  }}
                  className="flex-1 py-2 px-3 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>🔴 Tester +1</span>
                </button>
                <button
                  onClick={() => {
                    setAppBadgeCount(5);
                    setAlertToast("🔴 Pastille rouge mise à 5 notifications !");
                    setTimeout(() => setAlertToast(null), 2500);
                  }}
                  className="flex-1 py-2 px-3 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-amber-950 border border-amber-300 text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>🔴 Mettre à 5</span>
                </button>
                <button
                  onClick={() => {
                    clearAppBadge();
                    setAlertToast("✓ Pastille effacée (0)");
                    setTimeout(() => setAlertToast(null), 2000);
                  }}
                  className="py-2 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
                  title="Effacer"
                >
                  <span>Effacer</span>
                </button>
              </div>
            </div>

            {/* Carte Rappels Incessants Duolingo */}
            <div className="bg-white p-5 rounded-[28px] border-2 border-[#F5B726] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-amber-950 font-black text-lg flex items-center justify-center border border-amber-300">
                    👨‍🍳
                  </div>
                  <div>
                    <h4 className="font-black text-slate-950 text-sm">
                      Rappels Duolingo (11h30, 14h30, 18h30)
                    </h4>
                    <span className="text-[10px] font-black uppercase bg-[#F5B726] text-black px-2 py-0.2 rounded-full">
                      Système automatique actif
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Des notifications incessantes et motivantes retentissent chaque jour à l'heure du déjeuner et du dîner :  
                *« À table ! Il est l'heure ! Le CROU-K t'attend ! »*
              </p>

              {/* Boutons de test direct des 3 créneaux */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tester immédiatement les rappels du Chef :
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      const alert = triggerTestMealTimeAlert('11h30');
                      setActiveInAppAlert(alert);
                    }}
                    className="py-2.5 px-2 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-amber-950 text-[11px] font-black border border-amber-300 transition-all flex items-center justify-center gap-1"
                  >
                    <span>☀️ 11h30</span>
                  </button>
                  <button
                    onClick={() => {
                      const alert = triggerTestMealTimeAlert('14h30');
                      setActiveInAppAlert(alert);
                    }}
                    className="py-2.5 px-2 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-amber-950 text-[11px] font-black border border-amber-300 transition-all flex items-center justify-center gap-1"
                  >
                    <span>🏃‍♂️ 14h30</span>
                  </button>
                  <button
                    onClick={() => {
                      const alert = triggerTestMealTimeAlert('18h30');
                      setActiveInAppAlert(alert);
                    }}
                    className="py-2.5 px-2 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-amber-950 text-[11px] font-black border border-amber-300 transition-all flex items-center justify-center gap-1"
                  >
                    <span>🌙 18h30</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowNotificationModal(true)}
                className="w-full py-2.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black transition-colors"
              >
                Configurer mes plats favoris surveillés ({notificationSettings.favoriteDishes.length})
              </button>
            </div>

            {/* Carte Tarifs & Horaires Pratiques */}
            <div className="bg-white p-5 rounded-[28px] border border-black/5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F5B726]" />
                <h4 className="font-black text-slate-950 text-sm">
                  Horaires d'Ouverture du Resto U UPGC
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#F5F0E8] flex items-center justify-between">
                  <span className="font-bold text-slate-700">Déjeuner (Midi)</span>
                  <span className="font-black text-slate-950">{data.hours.midi}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F0E8] flex items-center justify-between">
                  <span className="font-bold text-slate-700">Dîner (Soir)</span>
                  <span className="font-black text-slate-950">{data.hours.soir}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F0E8] flex items-center justify-between">
                  <span className="font-bold text-slate-700">Tarif Unique</span>
                  <span className="font-black text-slate-950">200 FCFA le plateau</span>
                </div>
              </div>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton variant="banner" />

            {/* Bouton pour revenir au menu principal */}
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                scrollToSection('main_menu');
              }}
              className="w-full py-3.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Revenir au Menu du Jour (Page Principale)</span>
            </button>
          </div>

        </div>

        {/* FLOATING DARK BOTTOM NAVIGATION DOCK (DE GAUCHE À DROITE) */}
        <nav 
          aria-label="Menu principal" 
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 bg-[#18181B] text-white px-5 sm:px-6 py-2.5 rounded-full flex items-center gap-6 sm:gap-7 shadow-2xl border border-white/10 backdrop-blur-md select-none"
        >
          {/* 1. Gauche : Jours Passés */}
          <button
            onClick={() => scrollToSection('history')}
            className={`p-1.5 transition-colors ${
              activeSection === 'history' ? 'text-[#F5B726]' : 'text-white/70 hover:text-white'
            }`}
            title="Jours passés (-3j)"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* 2. Centre : Menu du Jour (Principal) */}
          <button
            onClick={() => {
              setSelectedDate(todayStr);
              scrollToSection('main_menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`p-1.5 transition-colors ${
              activeSection === 'main_menu' ? 'text-[#F5B726]' : 'text-white/70 hover:text-white'
            }`}
            title="Menu du Jour (Page Principale)"
          >
            <Utensils className="w-5 h-5" />
          </button>

          {/* 3. Bouton central jaune (+) : Espace Gestionnaire */}
          <button
            onClick={onOpenAdmin}
            className="w-12 h-12 rounded-full bg-[#F5B726] text-black font-black text-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all -my-2"
            title="Espace Gestionnaire"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {/* 4. Droite : Alertes & Infos avec Pastille Rouge */}
          <button
            onClick={() => {
              scrollToSection('info');
              clearAppBadge();
              setUnreadBadgeCount(0);
            }}
            className={`p-1.5 transition-colors relative ${
              activeSection === 'info' ? 'text-[#F5B726]' : 'text-white/70 hover:text-white'
            }`}
            title="Alertes & Infos"
          >
            <Bell className="w-5 h-5" />
            {unreadBadgeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-[#18181B] shadow-xs">
                {unreadBadgeCount > 9 ? '9+' : unreadBadgeCount}
              </span>
            )}
          </button>

          {/* 5. Partage WhatsApp */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('whatsapp_share', { date: selectedDate, service: selectedService, location: 'dock' })}
            className="p-1.5 text-[#25D366] hover:text-white transition-colors"
            title="Partager le menu sur WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5 fill-[#25D366]" />
          </a>
        </nav>

        {/* DUOLINGO INCESSANT MEAL TIME POPUP (11h30, 14h30, 18h30) */}
        <DuolingoMealPopup
          alert={activeInAppAlert}
          onDismiss={() => setActiveInAppAlert(null)}
          onSnooze={() => {
            setActiveInAppAlert(null);
            setAlertToast("⏰ Le Chef du CROU-K te relancera dans 5 minutes ! Ne tarde pas !");
            setTimeout(() => {
              const snoozedAlert = triggerTestMealTimeAlert('11h30');
              snoozedAlert.title = "🚨 2ÈME RAPPEL : LE CHEF DU CROU-K INSISTE !";
              snoozedAlert.body = "Tu as dit 5 minutes il y a 5 minutes ! La marmite est prête, file au réfectoire !";
              setActiveInAppAlert(snoozedAlert);
            }, 5 * 60 * 1000);
          }}
          onViewMenu={() => {
            setActiveInAppAlert(null);
            scrollToSection('main_menu');
            const el = document.getElementById('menu-items-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* NOTIFICATION MODAL */}
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          settings={notificationSettings}
          onUpdateSettings={(newSettings) => setNotificationSettings(newSettings)}
          onTestDuolingoAlert={(slot) => {
            const alert = triggerTestMealTimeAlert(slot);
            setActiveInAppAlert(alert);
          }}
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

      </div>
    </div>
  );
};
