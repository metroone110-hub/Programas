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
  Ticket as TicketIcon
} from 'lucide-react';
import type { RestaurantData, VirtualTicket } from '../types';
import { StudentTicketsModal } from './StudentTicketsModal';
import { NotificationModal } from './NotificationModal';
import { TikeramaPaymentModal } from './TikeramaPaymentModal';
import { TicketVisual } from './TicketVisual';
import { getOrGenerateVisitorId } from '../utils/analytics';
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
  category: 'tickets' | 'souches' | 'packs';
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
}

export interface CartItem {
  cartItemId: string;
  product: ProductItem;
  quantity: number;
  selectedService: string;
  selectedAccompaniment: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Tous les tickets' },
  { id: 'tickets', label: 'Tickets Unitaires (200 F)' },
  { id: 'souches', label: 'Souches 10 Repas (2 000 F)' },
  { id: 'packs', label: 'Packs Hebdo & Mensuel' }
];

export const StudentMenu: React.FC<StudentMenuProps> = ({
  data,
  onOpenAdmin,
  onOpenGuide
}) => {
  const visitorId = useMemo(() => getOrGenerateVisitorId(), []);

  // Navigation tab state: 'home' | 'search' | 'cart' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'cart' | 'profile'>('home');

  // Search & category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Favorites state (persisted in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('programas_favs');
      return saved ? JSON.parse(saved) : ['souche-10-mixte', 'ticket-universel'];
    } catch {
      return ['souche-10-mixte'];
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
  const [detailService, setDetailService] = useState<string>('Déjeuner Midi (11h30 - 14h00)');
  const [detailAccompaniment, setDetailAccompaniment] = useState<string>('Formule Complète CROU');

  // Cart drawer state (Screen 3)
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modals
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(2000);
  const [paymentPack, setPaymentPack] = useState<'unitaire' | 'souche'>('souche');
  const [paymentItemTitle, setPaymentItemTitle] = useState<string>('Souche 10 Repas');
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
  }, [visitorId]);

  // Core catalog products: TICKETS & SOUCHES ONLY (No daily food meals as menu changes daily)
  // 1 Ticket = 200 FCFA | 10 Tickets (Souche) = 2 000 FCFA
  const products: ProductItem[] = useMemo(() => {
    return [
      {
        id: 'ticket-dejeuner',
        title: 'Ticket Déjeuner Unitaire',
        category: 'tickets',
        categoryLabel: 'Ticket Numérique',
        price: 200,
        originalPrice: 500,
        rating: 5.0,
        reviewCount: 2450,
        description: 'Ticket repas officiel subventionné par l’État pour 1 déjeuner complet au Restaurant Universitaire UPGC Korhogo. Valable immédiatement avec QR code dynamique infalsifiable.',
        isAvailable: true,
        service: 'dejeuner',
        serviceOptions: ['Déjeuner Midi (11h30 - 14h00)'],
        accompaniments: ['Formule Repas Complet CROU']
      },
      {
        id: 'ticket-diner',
        title: 'Ticket Dîner Unitaire',
        category: 'tickets',
        categoryLabel: 'Ticket Numérique',
        price: 200,
        originalPrice: 500,
        rating: 4.9,
        reviewCount: 1980,
        description: 'Ticket repas officiel subventionné pour 1 dîner complet au Resto U UPGC. Valable immédiatement pour le service du soir.',
        isAvailable: true,
        service: 'diner',
        serviceOptions: ['Dîner Soir (18h30 - 21h00)'],
        accompaniments: ['Formule Repas Complet CROU']
      },
      {
        id: 'ticket-universel',
        title: 'Ticket Repas Universel (Midi / Soir)',
        category: 'tickets',
        categoryLabel: 'Ticket Polyvalent',
        price: 200,
        originalPrice: 500,
        rating: 5.0,
        reviewCount: 3120,
        description: 'Ticket repas universel CROU-K valable à votre convenance soit pour le déjeuner du midi, soit pour le dîner du soir. Idéal pour une flexibilité maximale.',
        isAvailable: true,
        service: 'tous',
        serviceOptions: ['Midi ou Soir (Au choix)'],
        accompaniments: ['Formule Étudiante Complète']
      },
      {
        id: 'souche-10-mixte',
        title: 'Souche Mixte 10 Repas CROU',
        category: 'souches',
        categoryLabel: 'Souche 10 Repas',
        price: 2000,
        originalPrice: 5000,
        rating: 5.0,
        reviewCount: 2890,
        description: 'La formule préférée des étudiants de l’UPGC Korhogo : 10 tickets de repas complets utilisables au choix pour le midi ou le soir. Évitez les files au guichet !',
        isAvailable: true,
        service: 'tous',
        serviceOptions: ['10 Repas au Choix (Midi / Soir)'],
        accompaniments: ['10 Repas Complets CROU']
      },
      {
        id: 'souche-10-dejeuner',
        title: 'Souche 10 Tickets Déjeuner',
        category: 'souches',
        categoryLabel: 'Souche 10 Repas',
        price: 2000,
        originalPrice: 5000,
        rating: 4.9,
        reviewCount: 1640,
        description: 'Pack économique de 10 déjeuners pour couvrir deux semaines complètes de cours à l’UPGC. QR code instantané généré sur votre mobile.',
        isAvailable: true,
        service: 'dejeuner',
        serviceOptions: ['10 Déjeuners Midi'],
        accompaniments: ['Formule Complète Déjeuner x10']
      },
      {
        id: 'souche-10-diner',
        title: 'Souche 10 Tickets Dîner',
        category: 'souches',
        categoryLabel: 'Souche 10 Repas',
        price: 2000,
        originalPrice: 5000,
        rating: 4.8,
        reviewCount: 1210,
        description: 'Pack de 10 tickets de dîner complets pour sécuriser vos repas du soir après les séances de révision et travaux dirigés.',
        isAvailable: true,
        service: 'diner',
        serviceOptions: ['10 Dîners Soir'],
        accompaniments: ['Formule Complète Dîner x10']
      },
      {
        id: 'pass-quinzaine-20',
        title: 'Double Souche (20 Repas - Pass Quinzaine)',
        category: 'packs',
        categoryLabel: 'Pass 20 Repas',
        price: 4000,
        originalPrice: 10000,
        rating: 4.9,
        reviewCount: 890,
        description: 'Pack de 2 souches (20 repas complets) pour assurer la quinzaine académique. Vos 20 tickets sont immédiatement chargés dans votre wallet.',
        isAvailable: true,
        service: 'tous',
        serviceOptions: ['20 Repas Déjeuner & Dîner'],
        accompaniments: ['Pack 2 Souches Officielles']
      },
      {
        id: 'carnet-mensuel-30',
        title: 'Carnet Mensuel 30 Repas (3 Souches)',
        category: 'packs',
        categoryLabel: 'Abonnement Mensuel',
        price: 6000,
        originalPrice: 15000,
        rating: 5.0,
        reviewCount: 1120,
        description: 'Sérénité absolue pour tout le mois universitaire : 30 tickets de repas complets subventionnés. Présentez simplement votre smartphone au comptoir.',
        isAvailable: true,
        service: 'tous',
        serviceOptions: ['30 Repas Mois Complet'],
        accompaniments: ['Pack 3 Souches CROU']
      }
    ];
  }, []);

  // Filtered products for Screen 1
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = searchQuery.trim() === '' || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

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
    setDetailService(product.serviceOptions?.[0] || 'Service Standard');
    setDetailAccompaniment(product.accompaniments?.[0] || 'Formule Complète CROU');
  };

  // Direct checkout for a specific product
  const handleDirectBuyProduct = (product: ProductItem) => {
    const isSouche = product.category === 'souches' || product.price >= 2000;
    setPaymentPack(isSouche ? 'souche' : 'unitaire');
    setPaymentAmount(product.price * detailQuantity);
    setPaymentItemTitle(`${detailQuantity}x ${product.title}`);
    setSelectedProduct(null);
    setIsPaymentModalOpen(true);
  };

  // Open checkout payment from Cart Drawer
  const handleProceedToPayment = () => {
    const isPackSouche = cart.some(item => item.product.category === 'souches' || item.product.category === 'packs') || totalCartAmount >= 2000;
    setPaymentPack(isPackSouche ? 'souche' : 'unitaire');
    setPaymentAmount(totalCartAmount);
    setPaymentItemTitle(`${totalCartItemsCount} ticket(s) / souche(s) CROU-K`);
    setIsCartOpen(false);
    setIsPaymentModalOpen(true);
  };

  // Payment completed successfully handler
  const handlePaymentSuccess = (newTickets: VirtualTicket[]) => {
    showToast(`🎉 Paiement validé ! ${newTickets.length} ticket(s) généré(s) avec succès.`, 'success');
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

      {/* Main Container constrained like modern mobile / responsive */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-4">
        
        {/* ============================================================== */}
        {/* SCREEN 1: HEADER & TOP BAR                                     */}
        {/* ============================================================== */}
        <header className="flex items-center justify-between gap-3 mb-4 pt-1">
          {/* User profile avatar / Admin trigger */}
          <button
            onClick={onOpenAdmin}
            title="Administration & Scanner CROU"
            className="touch-press relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200 shrink-0 bg-orange-100 flex items-center justify-center cursor-pointer"
          >
            <span className="text-sm font-black text-orange-600">CR</span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Search Bar pill */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un ticket, une souche..."
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
              title="Alertes & Notifications"
              className="touch-press relative w-10 h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 shadow-xs hover:border-orange-200 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute 2.5 top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* HERO PROMOTIONAL BANNER (TICKETS & SOUCHES BILLETTERIE)       */}
        {/* ============================================================== */}
        <div className="relative mb-6 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white p-5 sm:p-6 overflow-hidden shadow-xl border border-zinc-700/40">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="max-w-[62%] sm:max-w-[68%]">
              <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase mb-1 block">
                Billetterie Officielle • CROU Korhogo
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1 text-white">
                Vente de Tickets & Souches
              </h2>
              <p className="text-xs text-zinc-300 font-medium mb-3">
                1 ticket = <strong className="text-amber-300">200 FCFA</strong> • 10 tickets (souche) = <strong className="text-amber-300">2 000 FCFA</strong>
              </p>
              
              <button
                onClick={() => {
                  const soucheProduct = products.find(p => p.id === 'souche-10-mixte') || products[0];
                  openProductDetail(soucheProduct);
                }}
                className="touch-press inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
              >
                <span>Acheter une souche</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Instant Vector Ticket Badge Icon Showcase (Loads with ZERO delay on 3G) */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 flex items-center justify-center">
              <div className="w-full h-full transform rotate-6 hover:rotate-0 transition-transform duration-300 drop-shadow-2xl">
                <TicketVisual
                  type="souche"
                  title="Souche 10 Repas"
                  price={2000}
                  service="tous"
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-3 pt-1">
            <span className="w-4 h-1.5 bg-orange-500 rounded-full" />
            <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
            <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* SHOP BY CATEGORY (RAYONS DE TICKETS)                           */}
        {/* ============================================================== */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3 px-0.5">
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
        {/* RECOMMENDED TICKETS GRID (INSTANT VECTOR RENDERING, 0MS DELAY)  */}
        {/* ============================================================== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3.5 px-0.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recommandés Pour Vous
            </h3>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              Tout voir
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs">
              <p className="text-sm font-bold text-slate-700 mb-1">Aucun ticket trouvé</p>
              <p className="text-xs text-slate-400 mb-3">Essayez un autre filtre ou mot-clé.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="touch-press px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredProducts.map(product => {
                const isFav = favorites.includes(product.id);
                const isSouche = product.category === 'souches' || product.price >= 2000;
                
                return (
                  <div
                    key={product.id}
                    onClick={() => openProductDetail(product)}
                    className="touch-press group bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/70 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between cursor-pointer"
                  >
                    {/* Top row: Category tag & Heart Favorite Toggle */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 truncate max-w-[70%]">
                        {product.categoryLabel}
                      </span>
                      
                      {/* Heart icon with bouncy state change */}
                      <button
                        onClick={(e) => toggleFavorite(product.id, product.title, e)}
                        title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        className="touch-press w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-transform cursor-pointer"
                      >
                        <Heart
                          className={`w-4 h-4 transition-all duration-200 ${
                            isFav 
                              ? 'fill-rose-500 text-rose-500 scale-110 animate-heart-pop' 
                              : 'text-slate-400 hover:text-slate-600 stroke-[1.75]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Instant Vector Ticket Voucher (NO NETWORK DELAY / ZERO BLANK SQUARES ON 3G) */}
                    <div className="relative w-full mb-3">
                      <TicketVisual
                        type={isSouche ? 'souche' : 'unitaire'}
                        title={product.title}
                        price={product.price}
                        service={product.service}
                        compact={true}
                      />
                    </div>

                    {/* Title & Rating */}
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight leading-snug line-clamp-1 mb-1">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2.5">
                        <span className="text-amber-500 font-bold">★ {product.rating}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">CROU-K</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-emerald-600 font-bold">
                          {isSouche ? '10 repas' : '1 repas'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Price & Quick '+' Button */}
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

                      {/* Orange '+' button with tactile shrink */}
                      <button
                        onClick={(e) => handleAddToCart(product, 1, undefined, undefined, e)}
                        title="Ajouter au panier"
                        className="touch-press w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-500/25 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
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
              <p className="font-bold text-slate-900">Restaurant Universitaire UPGC</p>
              <p className="text-[11px] text-slate-500">Midi: 11h30-14h00 • Soir: 18h30-21h00</p>
            </div>
          </div>
          <button
            onClick={() => setIsTicketsModalOpen(true)}
            className="touch-press px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-full shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <TicketIcon className="w-3.5 h-3.5" />
            <span>Mes tickets ({validTicketsCount})</span>
          </button>
        </section>
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
                  Détail du Ticket
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

              {/* Large Ticket Vector Showcase (Loads Instantly on 3G) */}
              <div className="relative w-full rounded-3xl mb-4 shadow-sm">
                <TicketVisual
                  type={selectedProduct.category === 'souches' ? 'souche' : selectedProduct.category === 'packs' ? 'pack' : 'unitaire'}
                  title={selectedProduct.title}
                  price={selectedProduct.price * detailQuantity}
                  service={selectedProduct.service}
                  compact={false}
                />
              </div>

              {/* Title & Reviews & Stepper */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
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
                    Validité & Service
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

                {/* Direct Buy opens exact Tikerama Payment Modal */}
                <button
                  onClick={() => handleDirectBuyProduct(selectedProduct)}
                  className="touch-press flex-1 py-3.5 bg-[#FF0033] hover:bg-red-700 text-white font-black text-xs rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Acheter maintenant ≫</span>
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
                    Mon Panier
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
                    <p className="text-xs text-slate-400 mb-4">Choisissez un ticket ou une souche pour commencer.</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="touch-press px-5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow-md shadow-orange-500/25"
                    >
                      Voir les tickets
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.cartItemId}
                      className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 relative"
                    >
                      {/* Ticket Vector Mini Badge */}
                      <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden shadow-2xs">
                        <TicketVisual
                          type={item.product.category === 'souches' ? 'souche' : 'unitaire'}
                          title={item.product.title}
                          price={item.product.price}
                          service={item.product.service}
                          compact={true}
                        />
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

                        {/* Orange Delete tag */}
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
                    <span>Subvention de l’État (CROU-K)</span>
                    <span>-{totalDiscountAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Total à payer</span>
                    <span className="text-[#FF0033] text-base font-black">
                      {totalCartAmount.toLocaleString('fr-FR')} F CFA
                    </span>
                  </div>
                </div>

                {/* Big Red Checkout Pill Button */}
                <button
                  onClick={handleProceedToPayment}
                  className="touch-press w-full py-4 bg-[#FF0033] hover:bg-red-700 text-white font-black text-sm rounded-full shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Procéder au paiement ({totalCartAmount.toLocaleString('fr-FR')} F CFA) ≫</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FLOATING PILL NAVIGATION BAR                                   */}
      {/* ============================================================== */}
      <nav className="fixed bottom-4 left-4 right-4 max-w-sm sm:max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md shadow-2xl rounded-full border border-slate-200/90 p-1.5 flex items-center justify-between px-3">
        
        {/* Tab 1: Accueil */}
        <button
          onClick={() => {
            setActiveTab('home');
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
          title="Mes Tickets CROU"
        >
          <QrCode className="w-4 h-4" />
          {validTicketsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
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
