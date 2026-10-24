import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Bell, 
  Heart, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Trash2, 
  Check, 
  ChevronRight, 
  Sparkles, 
  QrCode, 
  Flame, 
  ShieldCheck, 
  Smartphone, 
  X, 
  RotateCw,
  Home,
  User,
  SlidersHorizontal,
  Info,
  Calendar,
  Clock,
  ExternalLink,
  Ticket as TicketIcon,
  ChefHat,
  Settings,
  MapPin
} from 'lucide-react';
import type { RestaurantData, VirtualTicket, MenuItem } from '../types';
import { StudentTicketsModal } from './StudentTicketsModal';
import { StudentProfileModal } from './StudentProfileModal';
import { NotificationModal } from './NotificationModal';
import { TikeramaPaymentModal } from './TikeramaPaymentModal';
import { RestoAffluenceMap } from './RestoAffluenceMap';
import { AboutRestoCrou } from './AboutRestoCrou';
import { TicketVisual } from './TicketVisual';
import { FastFoodImage } from './FastFoodImage';
import { getOrGenerateVisitorId } from '../utils/analytics';
import { 
  getStoredStudentProfile, 
  checkAndHandleOAuthRedirect, 
  type StudentProfile 
} from '../services/studentAuth';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  type NotificationSettings 
} from '../utils/notifications';

interface StudentMenuProps {
  data: RestaurantData;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
}

export interface ProductItem {
  id: string;
  title: string;
  category: 'plats' | 'tickets' | 'souches' | 'packs';
  categoryLabel: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  description: string;
  isAvailable: boolean;
  service: 'dejeuner' | 'diner' | 'tous';
  serviceOptions?: string[];
  accompaniments?: string[];
  image?: string;
  isFood?: boolean;
  serviceHours?: string;
  tags?: string[];
}

export interface CartItem {
  cartItemId: string;
  product: ProductItem;
  quantity: number;
  selectedService: string;
  selectedAccompaniment: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'plats', label: '🍛 Plats Chauds CROU' },
  { id: 'dejeuner', label: '☀️ Déjeuner (11h30 - 14h30)' },
  { id: 'diner', label: '🌙 Dîner (18h30 - 21h30)' },
  { id: 'tickets', label: '🎟️ Tickets (200 F)' },
  { id: 'souches', label: '📑 Souches 10 Repas (2 000 F)' }
];

export const StudentMenu: React.FC<StudentMenuProps> = ({
  data,
  onOpenAdmin,
  onOpenGuide
}) => {
  const visitorId = useMemo(() => getOrGenerateVisitorId(), []);

  // Navigation tab state: 'home' | 'affluence' | 'search' | 'cart' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'affluence' | 'search' | 'cart' | 'profile'>('home');

  // Search & category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Favorites state (persisted in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('programas_favs');
      return saved ? JSON.parse(saved) : ['crou-plat-1', 'ticket-repas-etudiant'];
    } catch {
      return ['crou-plat-1'];
    }
  });

  // Cart state (persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('programas_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected product for Detail View (Screen 2)
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [detailService, setDetailService] = useState<string>('Déjeuner Midi (11h30 - 14h30)');
  const [detailAccompaniment, setDetailAccompaniment] = useState<string>('Formule Complète CROU');

  // Cart drawer state (Screen 3)
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modals
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => getStoredStudentProfile());
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(2000);
  const [paymentPack, setPaymentPack] = useState<'unitaire' | 'souche'>('souche');
  const [paymentItemTitle, setPaymentItemTitle] = useState<string>('Souche 10 Repas CROU-K');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getNotificationSettings());

  // Active tickets counter from backend
  const [validTicketsCount, setValidTicketsCount] = useState<number>(0);

  // Action confirmation Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2800);
  };

  // Sync favorites
  const toggleFavorite = (productId: string, productTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(productId);
      const next = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('programas_favs', JSON.stringify(next));
      } catch {
        // ignore
      }
      showToast(isFav ? `Retiré des favoris` : `❤️ ${productTitle} ajouté aux favoris !`, 'info');
      return next;
    });
  };

  // Sync cart
  useEffect(() => {
    try {
      localStorage.setItem('programas_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Fetch student active tickets count
  const fetchTicketsCount = async () => {
    try {
      const res = await fetch(`/api/tickets/my-tickets?visitorId=${encodeURIComponent(visitorId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.tickets) {
          const valid = json.tickets.filter((t: any) => t.status === 'valid').length;
          setValidTicketsCount(valid);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTicketsCount();

    // Check if returning from Google OAuth redirect with #access_token=...
    checkAndHandleOAuthRedirect().then((res) => {
      if (res.success && res.profile) {
        setStudentProfile(res.profile);
        setIsProfileModalOpen(true);
        showToast(`🎉 Bienvenue ${res.profile.displayName} ! Code de validation envoyé à votre Gmail.`, 'success');
      }
    });

    // Check if returning from Jeko payment redirect
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_success') === 'true') {
        const ref = params.get('reference') || params.get('ref');
        if (ref) {
          fetch(`/api/tickets/jeko-status/${encodeURIComponent(ref)}`)
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.status === 'SUCCESSFUL') {
                showToast('🎉 Paiement Jèko confirmé avec succès ! Votre ticket repas est prêt.', 'success');
                fetchTicketsCount();
                setIsTicketsModalOpen(true);
              } else {
                showToast(res.message || 'Paiement en cours de traitement par Jèko...', 'info');
              }
            })
            .catch(() => {});
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('payment_error') === 'true') {
        showToast('Le paiement n\'a pas abouti sur Jèko Pay.', 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}
  }, [visitorId]);

  // Helper to map image for dish based on title
  const resolveDishImage = (title: string, customImage?: string) => {
    if (customImage && customImage.trim() !== '') return customImage;
    const lower = title.toLowerCase();
    if (lower.includes('tchiep') || lower.includes('riz')) return '/images/tchiep_poulet.jpg';
    if (lower.includes('graine') || lower.includes('foutou')) return '/images/sauce_graine.jpg';
    if (lower.includes('alloco') || lower.includes('poisson') || lower.includes('brais')) return '/images/alloco_poisson.jpg';
    if (lower.includes('fruit') || lower.includes('salade') || lower.includes('dessert')) return '/images/salade_fruits.jpg';
    return '/images/tchiep_poulet.jpg';
  };

  // 1. DISHES PROGRAMMED BY CROU ADMINISTRATION
  const programmedDishes: ProductItem[] = useMemo(() => {
    const items = data?.currentMenu?.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.map((item: MenuItem, idx: number) => {
      const isLunch = item.service === 'dejeuner' || (!item.service && idx % 2 === 0);
      const serviceHours = isLunch ? '11h30 - 14h30' : '18h30 - 21h30';
      const imageSrc = resolveDishImage(item.title, item.image);

      return {
        id: item.id || `crou-plat-${idx + 1}`,
        title: item.title,
        category: 'plats' as const,
        categoryLabel: item.badgeLabel || (item.category === 'dessert' ? 'Dessert & Fraîcheur' : 'Plat Chaud'),
        price: item.price ?? 200, // 200 FCFA prix unique subventionné CROU
        originalPrice: item.originalPrice ?? 500, // 500 FCFA barré
        rating: item.rating ?? (4.8 + (idx % 2 === 0 ? 0.1 : 0)),
        reviewCount: item.reviewCount ?? (350 + idx * 45),
        description: item.description || `Plat officiel préparé par les cuisiniers du Restaurant Universitaire UPGC Korhogo. Subventionné par le CROU-K.`,
        isAvailable: item.isAvailable !== false,
        service: item.service || (isLunch ? 'dejeuner' : 'diner'),
        serviceOptions: [
          isLunch ? 'Déjeuner Midi (11h30 - 14h30)' : 'Dîner Soir (18h30 - 21h30)',
          'Consommer sur place (Plateau)',
          'À emporter (+50 FCFA)'
        ],
        accompaniments: ['Riz étuvé', 'Attiéké de Korhogo', 'Foutou banane pilé', 'Alloco'],
        image: imageSrc,
        isFood: true,
        serviceHours,
        tags: item.tags
      };
    });
  }, [data?.currentMenu?.items]);

  // 2. TICKETS & SOUCHES PROGRAMAS (200 FCFA & 2 000 FCFA)
  const ticketProducts: ProductItem[] = useMemo(() => {
    return [
      {
        id: 'ticket-repas-etudiant',
        title: 'Ticket Repas Étudiant',
        category: 'tickets',
        categoryLabel: 'Ticket Numérique',
        price: 200,
        originalPrice: 500,
        rating: 5.0,
        reviewCount: 3120,
        description: 'Ticket repas officiel subventionné par l’État pour 1 déjeuner (11h30 - 14h30) ou dîner (18h30 - 21h30) au Restaurant Universitaire UPGC Korhogo. Émis instantanément par Programas.',
        isAvailable: true,
        service: 'tous',
        serviceOptions: ['Midi (11h30 - 14h30)', 'Soir (18h30 - 21h30)'],
        accompaniments: ['Formule Repas Complet CROU-K'],
        image: '/images/ticket_card.jpg',
        isFood: false,
        serviceHours: '11h30-14h30 & 18h30-21h30'
      },
      {
        id: 'carnet-10-tickets',
        title: 'Carnet 10 Tickets CROU',
        category: 'souches',
        categoryLabel: 'Pack 10 Repas',
        price: 2000,
        originalPrice: 5000,
        rating: 4.9,
        reviewCount: 2890,
        description: 'La souche de 10 tickets repas officiels. Valable pour tous les repas de la semaine au Resto U UPGC Korhogo. Fini les longues files d’attente au guichet !',
        isAvailable: true,
        service: 'tous',
        serviceOptions: ['10 Repas (Déjeuner & Dîner)'],
        accompaniments: ['Pack 10 Repas Complets CROU-K'],
        image: '/images/ticket_card.jpg',
        isFood: false,
        serviceHours: 'Valable Déjeuner & Dîner'
      }
    ];
  }, []);

  // Combined product catalog: Programmed dishes appear first, followed by tickets (matching IMG_0876)
  const allProducts: ProductItem[] = useMemo(() => {
    return [...programmedDishes, ...ticketProducts];
  }, [programmedDishes, ticketProducts]);

  // Filtered products based on selected tab and search query
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      let matchCat = true;
      if (selectedCategory === 'plats') {
        matchCat = p.category === 'plats';
      } else if (selectedCategory === 'dejeuner') {
        matchCat = p.service === 'dejeuner' || p.service === 'tous';
      } else if (selectedCategory === 'diner') {
        matchCat = p.service === 'diner' || p.service === 'tous';
      } else if (selectedCategory === 'tickets') {
        matchCat = p.category === 'tickets';
      } else if (selectedCategory === 'souches') {
        matchCat = p.category === 'souches';
      }

      const matchSearch = searchQuery.trim() === '' || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  // Cart totals
  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalOriginalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.originalPrice * item.quantity, 0);
  }, [cart]);

  const totalDiscountAmount = useMemo(() => {
    return Math.max(0, totalOriginalAmount - totalCartAmount);
  }, [totalOriginalAmount, totalCartAmount]);

  // Add to cart handler
  const handleAddToCart = (product: ProductItem, quantity = 1, service?: string, accompaniment?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const chosenService = service || product.serviceOptions?.[0] || 'Service Standard';
    const chosenAccompaniment = accompaniment || product.accompaniments?.[0] || 'Standard';
    const cartItemId = `${product.id}-${chosenService}-${chosenAccompaniment}`;

    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, {
          cartItemId,
          product,
          quantity,
          selectedService: chosenService,
          selectedAccompaniment: chosenAccompaniment
        }];
      }
    });

    showToast(`✅ ${product.title} ajouté au panier (+${quantity})`, 'success');
  };

  // Modify cart quantity
  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const removeCartItem = (cartItemId: string, itemTitle: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    showToast(`🗑️ ${itemTitle} retiré du panier`, 'info');
  };

  // Open detail view for a product
  const openProductDetail = (product: ProductItem) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setDetailService(product.serviceOptions?.[0] || 'Déjeuner Midi (11h30 - 14h30)');
    setDetailAccompaniment(product.accompaniments?.[0] || 'Formule Complète CROU');
  };

  // Direct checkout for a specific product
  const handleDirectBuyProduct = (product: ProductItem) => {
    const isSouche = product.category === 'souches' || product.price >= 2000;
    setPaymentPack(isSouche ? 'souche' : 'unitaire');
    setPaymentAmount(product.price * detailQuantity);
    setPaymentItemTitle(`${detailQuantity}x ${product.title} (Programas)`);
    setSelectedProduct(null);
    setIsPaymentModalOpen(true);
  };

  // Open checkout payment from Cart Drawer
  const handleProceedToPayment = () => {
    const isPackSouche = cart.some(item => item.product.category === 'souches' || item.product.category === 'packs') || totalCartAmount >= 2000;
    setPaymentPack(isPackSouche ? 'souche' : 'unitaire');
    setPaymentAmount(totalCartAmount);
    setPaymentItemTitle(`${totalCartItemsCount} repas / ticket(s) Programas CROU-K`);
    setIsCartOpen(false);
    setIsPaymentModalOpen(true);
  };

  // Payment completed successfully handler
  const handlePaymentSuccess = (newTickets: VirtualTicket[]) => {
    showToast(`🎉 Paiement validé ! ${newTickets.length} ticket(s) disponible(s).`, 'success');
    setCart([]);
    fetchTicketsCount();
    setIsTicketsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] relative pb-28">
      {/* Toast confirmation banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-toast max-w-sm w-[90%] pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl flex items-center justify-center gap-2 border border-slate-800 text-center">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-3">
        
        {/* ============================================================== */}
        {/* BRAND HEADER: PROGRAMAS & CROU-K                               */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between py-1.5 mb-2.5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 flex items-center gap-1">
              <span>Programas</span>
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            </span>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 tracking-wider">
              CROU-K UPGC
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAdmin}
              className="touch-press inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-black text-white text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
              title="Espace Administration CROU : Programmer le menu du jour"
            >
              <ChefHat className="w-3.5 h-3.5 text-orange-400" />
              <span>Admin CROU</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SCREEN 1: SEARCH & USER BAR                                    */}
        {/* ============================================================== */}
        <header className="flex items-center justify-between gap-3 mb-4">
          {/* Student Profile avatar button */}
          <button
            onClick={() => {
              setStudentProfile(getStoredStudentProfile());
              setIsProfileModalOpen(true);
            }}
            title={studentProfile ? `Mon Compte Étudiant UPGC : ${studentProfile.displayName}` : "Connexion Compte Étudiant UPGC"}
            className="touch-press relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200 shrink-0 bg-orange-500 flex items-center justify-center cursor-pointer text-white font-black text-xs transition-transform active:scale-95"
          >
            {studentProfile?.photoURL ? (
              <img
                src={studentProfile.photoURL}
                alt={studentProfile.displayName}
                className="w-full h-full object-cover"
              />
            ) : studentProfile ? (
              <span>{studentProfile.displayName.slice(0, 2).toUpperCase()}</span>
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
            {studentProfile?.isVerified ? (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" title="Compte vérifié Gmail" />
            ) : (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-white animate-pulse" title="Vérification requise" />
            )}
          </button>

          {/* Search Bar pill */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher un plat, accompagnement..."
              className="w-full bg-white text-xs text-slate-800 placeholder:text-slate-400 pl-9 pr-8 py-2.5 rounded-full border border-slate-200/90 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right actions: Cart Badge + Notification Bell */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              title="Mon Panier"
              className="touch-press relative w-10 h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 shadow-xs hover:border-orange-200 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {totalCartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsNotificationModalOpen(true)}
              title="Alertes Menus & Horaires"
              className="touch-press relative w-10 h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 shadow-xs hover:border-orange-200 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* TAB CONTENT: AFFLUENCE MAP (DEDICATED TAB) OR HOME MENU        */}
        {/* ============================================================== */}
        {activeTab === 'affluence' ? (
          <div className="animate-in fade-in duration-200 mb-6">
            <RestoAffluenceMap visitorId={visitorId} />
          </div>
        ) : (
          <>
            {/* Quick Radar Entry Banner (Direct shortcut to Affluence tab) */}
            <div
              onClick={() => {
                setActiveTab('affluence');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="touch-press mb-4 p-3 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-2xl border border-orange-200/90 flex items-center justify-between shadow-2xs cursor-pointer hover:border-orange-300 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-950">Radar Affluence Resto U</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded-full">
                      Google Maps
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Savoir s'il y a du monde au Resto U en direct • Périmètre 65m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600 shrink-0">
                <span>Voir la carte</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* HERO PROMOTIONAL BANNER (CROU MEALS & PROGRAMAS BILLETTERIE)  */}
            <div className="relative mb-5 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white p-5 sm:p-6 overflow-hidden shadow-xl border border-zinc-700/40">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="max-w-[65%] sm:max-w-[70%]">
              <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase mb-1 block">
                Menu Officiel • CROU Korhogo
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1 text-white">
                Plats & Menus Programmés
              </h2>
              <p className="text-xs text-zinc-300 font-medium mb-1">
                ☀️ Déjeuner : <strong className="text-amber-300">11h30 - 14h30</strong> • 🌙 Dîner : <strong className="text-amber-300">18h30 - 21h30</strong>
              </p>
              <p className="text-[11px] text-zinc-400 mb-3">
                Plats subventionnés à <strong className="text-white">200 FCFA</strong> • Billetterie Programas
              </p>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const ticketProduct = allProducts.find((p: ProductItem) => p.id === 'carnet-10-tickets') || allProducts[0];
                    if (ticketProduct) openProductDetail(ticketProduct);
                  }}
                  className="touch-press inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
                >
                  <TicketIcon className="w-3.5 h-3.5" />
                  <span>Acheter Tickets (200 F)</span>
                </button>

                <button
                  onClick={onOpenAdmin}
                  className="touch-press inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-full border border-zinc-700 transition-all cursor-pointer"
                >
                  <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                  <span>Programmer Menu</span>
                </button>
              </div>
            </div>

            {/* Visual preview: Tchiep Poulet CROU / Ticket */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
              <FastFoodImage
                src="/images/tchiep_poulet.jpg"
                alt="Plat CROU-K"
                category="Plat Chaud"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-[9px] font-black px-1.5 py-0.5 rounded-md text-amber-300">
                200 FCFA
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3 pt-1">
            <span className="w-4 h-1.5 bg-orange-500 rounded-full" />
            <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
            <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* SHOP BY CATEGORY (RAYONS & CATÉGORIES)                         */}
        {/* ============================================================== */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Rayons & Catégories
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredProducts.length} articles
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`touch-press px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/10'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* RECOMMENDED SECTION (EXACT 2-COLUMN GRID AS IN IMG_0876)       */}
        {/* ============================================================== */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recommandés Pour Vous
            </h3>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              Tout voir
            </button>
          </div>

          {/* If administration has not programmed dishes yet */}
          {programmedDishes.length === 0 && selectedCategory !== 'tickets' && selectedCategory !== 'souches' && (
            <div className="mb-4 p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-200/80 flex items-center justify-center shrink-0">
                  <ChefHat className="w-5 h-5 text-amber-900" />
                </div>
                <div>
                  <p className="font-bold text-xs">Menu en attente de programmation CROU-K</p>
                  <p className="text-[11px] text-amber-800">
                    L'administration n'a pas encore validé les plats pour aujourd'hui (11h30-14h30 / 18h30-21h30).
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenAdmin}
                className="touch-press px-3.5 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs shrink-0 cursor-pointer"
              >
                Programmer le menu
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs">
              <p className="text-sm font-bold text-slate-700 mb-1">Aucun article trouvé</p>
              <p className="text-xs text-slate-400 mb-3">Essayez un autre filtre ou mot-clé.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="touch-press px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            /* EXACT 2-COLUMN GRID (Matching IMG_0876) */
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map(product => {
                const isFav = favorites.includes(product.id);
                
                return (
                  <div
                    key={product.id}
                    onClick={() => openProductDetail(product)}
                    className="touch-press group bg-white rounded-3xl p-3 sm:p-3.5 border border-slate-200/70 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between cursor-pointer"
                  >
                    {/* Top Row: Category Badge & Heart Favorite Toggle */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 truncate max-w-[70%]">
                        {product.categoryLabel}
                      </span>
                      
                      {/* Heart icon button */}
                      <button
                        onClick={(e) => toggleFavorite(product.id, product.title, e)}
                        title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        className="touch-press w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-transform cursor-pointer"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-all duration-200 ${
                            isFav 
                              ? 'fill-rose-500 text-rose-500 scale-110 animate-heart-pop' 
                              : 'text-slate-400 hover:text-slate-600 stroke-[1.75]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Image Area: FastFoodImage (0ms lag, no blank box) or Ticket visual */}
                    <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden mb-2.5 shadow-2xs bg-slate-100">
                      {product.isFood || product.image ? (
                        <FastFoodImage
                          src={product.image}
                          alt={product.title}
                          category={product.categoryLabel}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <TicketVisual
                          type={product.category === 'souches' ? 'souche' : 'unitaire'}
                          title={product.title}
                          price={product.price}
                          service={product.service}
                          compact={true}
                        />
                      )}

                      {/* Service slot badge for dishes */}
                      {product.serviceHours && (
                        <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-[8px] font-bold text-white px-1.5 py-0.5 rounded">
                          {product.service === 'dejeuner' ? '11:30 - 14:30' : product.service === 'diner' ? '18:30 - 21:30' : 'Midi & Soir'}
                        </span>
                      )}
                    </div>

                    {/* Title & Rating */}
                    <div className="mb-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight leading-snug line-clamp-1 mb-0.5">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="text-amber-500 font-bold">★ {product.rating}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">CROU-K</span>
                      </div>
                    </div>

                    {/* Bottom Row: Price & Orange Round '+' Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {product.price.toLocaleString('fr-FR')} FCFA
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="block text-[9px] text-slate-400 line-through">
                            {product.originalPrice.toLocaleString('fr-FR')} F
                          </span>
                        )}
                      </div>

                      {/* Exact Orange Round '+' button matching IMG_0876 */}
                      <button
                        onClick={(e) => handleAddToCart(product, 1, undefined, undefined, e)}
                        title="Ajouter"
                        className="touch-press w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-90 text-white flex items-center justify-center font-black shadow-md shadow-orange-500/25 cursor-pointer transition-transform"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick info strip: Restaurant status & Hours */}
        <section className="mb-6 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Resto U UPGC • Services Officiels</p>
              <p className="text-[11px] text-slate-500">Déjeuner: 11h30 - 14h30 • Dîner: 18h30 - 21h30</p>
            </div>
          </div>
          <button
            onClick={() => setIsTicketsModalOpen(true)}
            className="touch-press px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-full shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <TicketIcon className="w-3.5 h-3.5 text-orange-400" />
            <span>Mes tickets ({validTicketsCount})</span>
          </button>
        </section>

        {/* Section À Propos du Restaurant CROU-K & Galerie Photos Défilante */}
        <AboutRestoCrou />
        </>
        )}
      </div>

      {/* ============================================================== */}
      {/* SCREEN 2: DETAIL VIEW (SLIDES IN NATURALLY FROM THE RIGHT)     */}
      {/* ============================================================== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="animate-slide-right w-full max-w-md sm:max-w-lg bg-white min-h-screen p-5 flex flex-col justify-between shadow-2xl relative">
            
            {/* Top Bar with Back Arrow & Cart Button */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="touch-press w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <h3 className="font-bold text-sm text-slate-800">
                  {selectedProduct.isFood ? 'Détail du Plat CROU-K' : 'Détail du Ticket'}
                </h3>

                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsCartOpen(true);
                  }}
                  className="touch-press relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {totalCartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalCartItemsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Showcase Image: FastFoodImage or Ticket */}
              <div className="relative w-full aspect-16/10 rounded-3xl overflow-hidden mb-4 shadow-sm bg-slate-100">
                {selectedProduct.isFood || selectedProduct.image ? (
                  <FastFoodImage
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    category={selectedProduct.categoryLabel}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TicketVisual
                    type={selectedProduct.category === 'souches' ? 'souche' : 'unitaire'}
                    title={selectedProduct.title}
                    price={selectedProduct.price * detailQuantity}
                    service={selectedProduct.service}
                    compact={false}
                  />
                )}
              </div>

              {/* Title & Reviews & Stepper */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      {selectedProduct.categoryLabel}
                    </span>
                    {selectedProduct.serviceHours && (
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span>{selectedProduct.serviceHours}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {selectedProduct.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <span className="text-amber-500 font-bold">★ {selectedProduct.rating}</span>
                    <span>({selectedProduct.reviewCount} avis étudiants UPGC)</span>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full">
                  <button
                    onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                    className="touch-press w-7 h-7 rounded-full bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-slate-900">
                    {detailQuantity}
                  </span>
                  <button
                    onClick={() => setDetailQuantity(prev => prev + 1)}
                    className="touch-press w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Service Selection */}
              {selectedProduct.serviceOptions && selectedProduct.serviceOptions.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-900 block mb-2">
                    Créneau & Option de Service
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.serviceOptions.map(srv => {
                      const isSelected = detailService === srv;
                      return (
                        <button
                          key={srv}
                          onClick={() => setDetailService(srv)}
                          className={`touch-press px-3.5 py-2 rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'border-2 border-orange-500 bg-orange-50/70 text-orange-600 font-bold shadow-xs'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                          <span>{srv}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-900 block mb-1.5">
                  Description officielle CROU-K
                </label>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>
            </div>

            {/* Sticky Bottom Action Bar with 2 Buttons: Add to cart & Direct Buy */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Montant total ({detailQuantity} unité{detailQuantity > 1 ? 's' : ''})
                </span>
                <span className="text-xl font-black text-red-600">
                  {(selectedProduct.price * detailQuantity).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct, detailQuantity, detailService, detailAccompaniment);
                    setSelectedProduct(null);
                  }}
                  className="touch-press flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ajouter au panier</span>
                </button>

                {/* Direct Buy opens Payment Modal */}
                <button
                  onClick={() => handleDirectBuyProduct(selectedProduct)}
                  className="touch-press flex-1 py-3.5 bg-[#FF0033] hover:bg-red-700 text-white font-black text-xs rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Payer maintenant ≫</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: CART / COMMANDE (SLIDES UP SMOOTHLY FROM THE BOTTOM) */}
      {/* ============================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center">
          <div className="animate-slide-up w-full max-w-md sm:max-w-lg bg-white rounded-t-3xl p-5 max-h-[90vh] flex flex-col justify-between shadow-2xl relative">
            
            {/* Grab handle bar */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

            {/* Header: Title & Close */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">
                    Mon Panier Programas
                  </h3>
                  <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                    {totalCartItemsCount} articles
                  </span>
                </div>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="touch-press w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="overflow-y-auto max-h-[46vh] no-scrollbar space-y-3 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-800 mb-1">Votre panier est vide</p>
                    <p className="text-xs text-slate-400 mb-4">Sélectionnez un repas ou des tickets pour commencer.</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="touch-press px-5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow-md shadow-orange-500/25"
                    >
                      Découvrir le menu
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.cartItemId}
                      className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 relative"
                    >
                      {/* Image or Ticket Mini Preview */}
                      <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden shadow-2xs bg-slate-200">
                        {item.product.isFood || item.product.image ? (
                          <FastFoodImage
                            src={item.product.image}
                            alt={item.product.title}
                            category={item.product.categoryLabel}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <TicketVisual
                            type={item.product.category === 'souches' ? 'souche' : 'unitaire'}
                            title={item.product.title}
                            price={item.product.price}
                            service={item.product.service}
                            compact={true}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.product.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {item.selectedService}
                        </p>
                        <p className="text-xs font-black text-red-600 mt-1">
                          {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>

                      {/* Stepper + Delete button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-full">
                          <button
                            onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                            className="touch-press text-slate-500 hover:text-slate-800 p-0.5 font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-slate-900 w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                            className="touch-press text-orange-600 hover:text-orange-700 p-0.5 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeCartItem(item.cartItemId, item.product.title)}
                          title="Supprimer"
                          className="touch-press w-7 h-7 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Price Summary Breakdown & Big Red Checkout Button (Matching IMG_0878) */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100 mt-3">
                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Montant de la commande (Tarif plein)</span>
                    <span className="line-through">{totalOriginalAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Subvention d'État CROU-K</span>
                    <span>- {totalDiscountAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
                    <span>Total à payer</span>
                    <span className="text-base text-red-600 font-black">
                      {totalCartAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* Big Red Checkout Button (Matching IMG_0878) */}
                <button
                  onClick={handleProceedToPayment}
                  className="touch-press w-full py-4 bg-[#FF0033] hover:bg-red-700 text-white font-black text-sm rounded-full shadow-xl shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Passer au paiement ≫</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FLOATING BOTTOM NAV BAR (TOUCH-FRIENDLY & COMPACT)             */}
      {/* ============================================================== */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/80 shadow-2xl flex items-center gap-3">
        {/* Tab 1: Accueil */}
        <button
          onClick={() => {
            setActiveTab('home');
            setSelectedCategory('all');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`touch-press transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30'
              : 'p-2 text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className="w-4 h-4" />
          {activeTab === 'home' && <span>Accueil</span>}
        </button>

        {/* Tab 2: Affluence & Carte (Google Maps) */}
        <button
          onClick={() => {
            setActiveTab('affluence');
            setSelectedProduct(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`touch-press transition-all cursor-pointer ${
            activeTab === 'affluence'
              ? 'bg-orange-600 text-white px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/30'
              : 'p-2 text-slate-400 hover:text-slate-700 relative'
          }`}
          title="Affluence & Carte Google Maps Resto U"
        >
          <MapPin className="w-4 h-4" />
          {activeTab !== 'affluence' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          {activeTab === 'affluence' && <span>Affluence</span>}
        </button>

        {/* Tab 2: Recherche */}
        <button
          onClick={() => {
            setActiveTab('search');
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }}
          className={`touch-press transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30'
              : 'p-2 text-slate-400 hover:text-slate-700'
          }`}
        >
          <Search className="w-4 h-4" />
          {activeTab === 'search' && <span>Recherche</span>}
        </button>

        {/* Tab 3: Panier */}
        <button
          onClick={() => setIsCartOpen(true)}
          className={`touch-press relative transition-all cursor-pointer ${
            activeTab === 'cart'
              ? 'bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30'
              : 'p-2 text-slate-400 hover:text-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          {totalCartItemsCount > 0 && (
            <span className="absolute 0 top-0 right-0 w-3.5 h-3.5 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {totalCartItemsCount}
            </span>
          )}
          {activeTab === 'cart' && <span>Panier</span>}
        </button>

        {/* Tab 4: Tickets & Portefeuille CROU */}
        <button
          onClick={() => setIsTicketsModalOpen(true)}
          className="touch-press p-2 text-slate-400 hover:text-slate-700 transition-all cursor-pointer relative"
          title="Mes Tickets CROU-K"
        >
          <QrCode className="w-4 h-4" />
          {validTicketsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
        </button>

        {/* Tab 5: Profil Étudiant UPGC */}
        <button
          onClick={() => {
            setStudentProfile(getStoredStudentProfile());
            setIsProfileModalOpen(true);
          }}
          className={`touch-press transition-all cursor-pointer relative ${
            isProfileModalOpen
              ? 'bg-orange-500 text-white px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30'
              : 'p-2 text-slate-400 hover:text-slate-700'
          }`}
          title="Profil Étudiant & Compte UPGC"
        >
          <User className="w-4 h-4" />
          {studentProfile?.isVerified && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
          {isProfileModalOpen && <span>Profil</span>}
        </button>
      </nav>

      {/* ============================================================== */}
      {/* TIKERAMA PAYMENT MODAL (EXACT REPLICA OF IMG_0878)             */}
      {/* ============================================================== */}
      <TikeramaPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={paymentAmount}
        itemTitle={paymentItemTitle}
        ticketPack={paymentPack}
        visitorId={visitorId}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* ============================================================== */}
      {/* STUDENT TICKETS WALLET & NOTIFICATIONS                         */}
      {/* ============================================================== */}
      <StudentTicketsModal
        isOpen={isTicketsModalOpen}
        onClose={() => {
          setIsTicketsModalOpen(false);
          fetchTicketsCount();
        }}
        visitorId={visitorId}
        initialMethod="CINETPAY"
        initialPack={paymentPack}
        autoOpenPayForm={false}
      />

      {/* ============================================================== */}
      {/* STUDENT PROFILE & GMAIL OTP MODAL                              */}
      {/* ============================================================== */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setStudentProfile(getStoredStudentProfile());
        }}
        onOpenTickets={() => {
          setIsProfileModalOpen(false);
          setIsTicketsModalOpen(true);
        }}
        validTicketsCount={validTicketsCount}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={notificationSettings}
        onUpdateSettings={(newSettings) => {
          setNotificationSettings(newSettings);
          saveNotificationSettings(newSettings);
        }}
      />
    </div>
  );
};
