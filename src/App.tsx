import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  TrendingUp, 
  ChevronRight,
  ShoppingBag,
  Ticket,
  CheckCircle2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Canteen, Dish, MealTicket, UserProfile, MealType } from './types';
import { INITIAL_CANTEENS, INITIAL_DISHES } from './data/mockData';
import { 
  getLocalUserProfile, 
  saveLocalUserProfile, 
  updateUserBalance, 
  addMealTicket, 
  logoutUser,
  purchaseTicketsBatch,
  syncStudentTicketsWithFirestore
} from './services/studentAuth';
import { recordTicketsSaleInLedger } from './services/dailyLedger';
import { Navbar } from './components/Navbar';
import { DishCard } from './components/DishCard';
import { DishDetailModal } from './components/DishDetailModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { PaymentCheckoutModal } from './components/PaymentCheckoutModal';
import { BlackGatewayPortal } from './components/BlackGatewayPortal';
import { TicketModal } from './components/TicketModal';
import { MyTicketsModal } from './components/MyTicketsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ImageWithLoader } from './components/ImageWithLoader';
import { DishesMarquee } from './components/DishesMarquee';
import { MobileBottomNav } from './components/MobileBottomNav';
import { RadarAffluenceMap } from './components/RadarAffluenceMap';
import { TicketCounterBox } from './components/TicketCounterBox';
import { ProgramasPochetteSplash } from './components/ProgramasPochetteSplash';
import { checkPaymentStatus, getPendingPayment, clearPendingPayment } from './services/jekoPayment';

export const App: React.FC = () => {
  // Canteens & Dishes State
  const [canteens, setCanteens] = useState<Canteen[]>(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen>(INITIAL_CANTEENS[0]);
  const [dishes, setDishes] = useState<Dish[]>(() => {
    try {
      const saved = localStorage.getItem('crou_published_dishes');
      return saved ? JSON.parse(saved) : INITIAL_DISHES;
    } catch {
      return INITIAL_DISHES;
    }
  });
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dejeuner');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User & Portal State (Interface 1 vs Interface 2)
  const [user, setUser] = useState<UserProfile | null>(() => getLocalUserProfile());
  const [showBlackPortal, setShowBlackPortal] = useState<boolean>(() => !getLocalUserProfile());
  
  // Cart State (Inspired by IMG_0875.webp Screen 3)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);

  // Detail Modal State (Inspired by IMG_0875.webp Screen 2)
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Wave Payment Modal State (Inspired by IMG_1059.png)
  const [showWaveModal, setShowWaveModal] = useState<boolean>(false);
  const [wavePaymentItems, setWavePaymentItems] = useState<Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    mealType: 'dejeuner' | 'diner';
    canteenId: string;
    canteenName: string;
  }>>([]);
  const [waveTotalAmount, setWaveTotalAmount] = useState<number>(200);

  // Other Modals
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
  const [showMyTicketsModal, setShowMyTicketsModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<MealTicket | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'radar' | 'search' | 'cart' | 'tickets' | 'profile'>('home');

  // Animated Programas Splash Screen on entry (bouncing logo on black background)
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Sync tickets with Firestore for seamless multi-device persistence
  useEffect(() => {
    if (user && user.matricule) {
      syncStudentTicketsWithFirestore(user).then((synced) => {
        if (synced && synced.savedTickets) {
          setUser(prev => {
            if (!prev) return synced;
            // update if different
            if (JSON.stringify(prev.savedTickets) !== JSON.stringify(synced.savedTickets)) {
              return synced;
            }
            return prev;
          });
        }
      }).catch(err => {
        console.warn('Sync student tickets notice:', err);
      });
    }
  }, [user?.matricule]);

  // Official Jeko Partner API Callback Handler (/payment/success & /payment/error)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get('reference') || searchParams.get('order');
    const path = window.location.pathname;

    const isSuccess = path.includes('/payment/success') || 
                      searchParams.get('payment_status') === 'success' || 
                      searchParams.get('status') === 'success';
    const isError = path.includes('/payment/error') || 
                    searchParams.get('payment_status') === 'error' || 
                    searchParams.get('status') === 'error';

    if (reference && (isSuccess || isError)) {
      if (isSuccess) {
        checkPaymentStatus(reference).then(async (status) => {
          if (status === 'success' || status === 'pending') {
            const pending = getPendingPayment();
            const currentUser = getLocalUserProfile() || user;
            if (pending && pending.items && pending.items.length > 0 && currentUser) {
              try {
                const res = await purchaseTicketsBatch(currentUser, pending.items);
                await recordTicketsSaleInLedger(res.generatedTickets.length, 200);
                setUser(res.updatedUser);
              } catch (err) {
                console.error('Failed to issue tickets on payment return:', err);
              }
            }
            clearPendingPayment();
            showToast('Paiement Jeko confirmé avec succès ! Vos tickets sont prêts.');
            setShowMyTicketsModal(true);
            try {
              confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            } catch {}
          }
        });
      } else if (isError) {
        clearPendingPayment();
        showToast('Le paiement a été interrompu ou refusé sur Jeko. Vous pouvez réessayer.');
      }

      // Clean the URL cleanly without page reload
      const cleanPath = window.location.pathname.replace(/\/payment\/(success|error)/, '') || '/';
      window.history.replaceState({}, document.title, cleanPath);
    }
  }, []);

  const handleBottomTabChange = (tab: 'home' | 'radar' | 'search' | 'cart' | 'tickets' | 'profile') => {
    setActiveBottomTab(tab);
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'radar') {
      setShowRadarModal(true);
    } else if (tab === 'search') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'cart') {
      setShowCartDrawer(true);
    } else if (tab === 'tickets') {
      setShowMyTicketsModal(true);
    } else if (tab === 'profile') {
      if (user) {
        setShowMyTicketsModal(true);
      } else {
        setShowBlackPortal(true);
      }
    }
  };

  // User Success from Black Gateway Portal
  const handleUserSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowBlackPortal(false);
    showToast(`Bienvenue ${profile.displayName} ! Pass repas activé.`);
    if (profile.role === 'admin') {
      setIsAdminView(true);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsAdminView(false);
    setShowBlackPortal(true);
    setCart([]);
  };

  // Cart Handlers
  const handleAddToCart = (dish: Dish, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item => 
          item.dish.id === dish.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { dish, quantity }];
    });
    showToast(`+${quantity} "${dish.name}" ajouté au panier (200 FCFA/u)`);
  };

  const handleUpdateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(dishId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.dish.id === dishId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFromCart = (dishId: string) => {
    setCart(prev => prev.filter(item => item.dish.id !== dishId));
  };

  // Checkout Cart with Wave
  const handleCheckoutCart = () => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    if (cart.length === 0) return;

    const totalMealCount = cart.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = totalMealCount * 200; // Strict: 200 FCFA per meal!

    const itemsToPay = cart.map(i => ({
      dishId: i.dish.id,
      dishName: i.dish.name,
      quantity: i.quantity,
      mealType: i.dish.mealType,
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name
    }));

    setWavePaymentItems(itemsToPay);
    setWaveTotalAmount(totalAmount);
    setShowCartDrawer(false);
    setShowWaveModal(true);
  };

  // Instant buy a meal ticket
  const handleInstantBuy = (dish: Dish, quantity: number = 1) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    const totalAmount = quantity * 200; // Strict: 200 FCFA per ticket!
    setWavePaymentItems([{
      dishId: 'ticket-crou-repas',
      dishName: `${quantity} Ticket(s) Repas CROU`,
      quantity,
      mealType: dish.mealType,
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name
    }]);
    setWaveTotalAmount(totalAmount);
    setShowDetailModal(false);
    setShowWaveModal(true);
  };

  // Direct order using student balance
  const handleOrderMeal = async (dish: Dish) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    if (user.balance < 200) {
      // Prompt Wave recharge
      handleInstantBuy(dish, 1);
      return;
    }

    // Deduct balance and generate authentic ticket
    const newBalance = user.balance - 200;
    const updatedUserBalance = await updateUserBalance(user, newBalance);

    const serialNumber = `CROUK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: MealTicket = {
      id: 'tkt_' + Math.random().toString(36).substring(2, 9),
      ticketNumber: serialNumber,
      studentId: user.uid,
      studentName: user.displayName,
      studentMatricule: user.matricule || 'UPGC-2026',
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name,
      dishName: dish.name,
      mealType: dish.mealType,
      date: new Date().toLocaleDateString('fr-FR'),
      price: 200,
      status: 'valid',
      qrCodeData: `https://crou.ci/verify?tkt=${serialNumber}&mat=${user.matricule}`,
      purchaseTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const finalUser = await addMealTicket(updatedUserBalance, newTicket);
    setUser(finalUser);
    setActiveTicket(newTicket);
    await recordTicketsSaleInLedger(1, 200);
    showToast(`Ticket ${serialNumber} généré avec succès !`);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore
    }
  };

  const handleMarkTicketUsed = async (ticketId: string) => {
    if (!user) return;
    const updatedTickets = (user.savedTickets || []).map(t => 
      t.id === ticketId ? { ...t, status: 'used' as const, usedTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) } : t
    );
    const updatedUser = { ...user, savedTickets: updatedTickets };
    saveLocalUserProfile(updatedUser);
    setUser(updatedUser);
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket({ ...activeTicket, status: 'used' });
    }
  };

  // Payment success handler from Jeko
  const handlePaymentSuccess = async (updatedUser: UserProfile, newTickets?: MealTicket[]) => {
    setUser(updatedUser);
    setCart([]); // Clear cart after payment
    if (newTickets && newTickets.length > 0) {
      await recordTicketsSaleInLedger(newTickets.length, 200);
      showToast(`✅ Paiement validé ! ${newTickets.length} ticket(s) ajoutés à "Mes Tickets".`);
    } else {
      showToast('✅ Recharge effectuée avec succès !');
    }
  };

  // Dedicated Ticket Purchasing Handler (CROU Subvention 200 FCFA/ticket)
  const handleBuyTickets = (quantity: number, totalAmount: number) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }
    setWaveTotalAmount(totalAmount);
    setWavePaymentItems([{
      dishId: 'ticket-crou-repas',
      dishName: `${quantity} Ticket(s) Repas CROU`,
      quantity,
      mealType: selectedMealType,
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name
    }]);
    setShowWaveModal(true);
  };

  // Admin dish actions (persisted in localStorage)
  const handleAddDish = (newDish: Dish) => {
    setDishes(prev => {
      const updated = [newDish, ...prev];
      try {
        localStorage.setItem('crou_published_dishes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Plat "${newDish.name}" publié au menu.`);
  };

  const handleToggleDishAvailability = (dishId: string) => {
    setDishes(prev => {
      const updated = prev.map(d => d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d);
      try {
        localStorage.setItem('crou_published_dishes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteDish = (dishId: string) => {
    setDishes(prev => {
      const updated = prev.filter(d => d.id !== dishId);
      try {
        localStorage.setItem('crou_published_dishes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdateCanteen = (updated: Canteen) => {
    setCanteens(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedCanteen.id === updated.id) {
      setSelectedCanteen(updated);
    }
  };

  // Filtered dishes
  const filteredDishes = dishes.filter(dish => {
    const matchesCanteen = dish.canteenId === selectedCanteen.id;
    const matchesMeal = dish.mealType === selectedMealType;
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCanteen && matchesMeal && matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If in admin view mode
  if (isAdminView && user?.role === 'admin') {
    return (
      <AdminDashboard
        canteen={selectedCanteen}
        dishes={dishes}
        onUpdateCanteen={handleUpdateCanteen}
        onAddDish={handleAddDish}
        onToggleDishAvailability={handleToggleDishAvailability}
        onDeleteDish={handleDeleteDish}
        onClose={() => setIsAdminView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden w-full max-w-full">
      
      {/* 3D Holographic Animated Programas Pochette Splash Screen */}
      {showSplash && (
        <ProgramasPochetteSplash
          onComplete={() => {
            sessionStorage.setItem('programas_splash_shown_session', 'true');
            setShowSplash(false);
          }}
        />
      )}

      {/* INTERFACE 1: BLACK GATEWAY PORTAL (INSCRIPTION & CONNEXION) */}
      <BlackGatewayPortal
        isOpen={showBlackPortal}
        onSuccess={handleUserSuccess}
        onGuestAccess={() => setShowBlackPortal(false)}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-0 z-50 flex items-center justify-center pointer-events-none px-4 animate-fadeIn">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex items-center space-x-2 text-xs font-bold pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* INTERFACE 2: LIVELY MENU & APPLICATION DASHBOARD */}
      <Navbar
        canteens={canteens}
        selectedCanteen={selectedCanteen}
        onSelectCanteen={setSelectedCanteen}
        user={user}
        onOpenAuth={() => setShowBlackPortal(true)}
        onOpenMyTickets={() => setShowMyTicketsModal(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        onLogout={handleLogout}
        cartCount={cartTotalItems}
        onOpenCart={() => setShowCartDrawer(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNotifications={() => setShowMyTicketsModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
        
        {/* Radar Affluence Resto U - Compact Header Card (matching IMG_1079) */}
        <div 
          onClick={() => setShowRadarModal(true)}
          className="bg-amber-50/80 hover:bg-amber-100/80 border border-orange-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between shadow-xs cursor-pointer transition-all active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900">Radar Affluence Resto U</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700">Google Maps</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Savoir s'il y a du monde au Resto U en direct • Périmètre 65m
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="text-xs font-bold text-orange-600 flex items-center space-x-1 hover:underline flex-shrink-0 ml-2 cursor-pointer"
          >
            <span>Voir la carte</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* DEDICATED TICKET PURCHASING GUICHET (CROU-K SUBVENTION 200 FCFA) */}
        <TicketCounterBox
          user={user}
          onBuyTickets={handleBuyTickets}
          onOpenAuth={() => setShowBlackPortal(true)}
          onOpenMyTickets={() => setShowMyTicketsModal(true)}
        />

        {/* CONSULTATIVE DAILY MENU DISPLAYED BY CROU-K ADMINISTRATION (WITH DATE & HOURS) */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-black uppercase tracking-wider mb-1">
                <span>🍽️ Restauration Universitaire • UPGC</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-cabinet">
                Menu du Jour Affiché par l'Administration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Affichage consultatif • Les repas se retirent au guichet sur présentation de votre Ticket Repas CROU (200 FCFA).
              </p>
            </div>

            {/* Service hours schedule badge */}
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto">
              <span>☀️ Déjeuner : <strong className="text-orange-600">11h30 - 14h30</strong></span>
              <span>•</span>
              <span>🌙 Dîner : <strong className="text-orange-600">18h30 - 21h00</strong></span>
            </div>
          </div>

          {/* Meal Type Switcher & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedMealType('dejeuner')}
                className={`px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  selectedMealType === 'dejeuner'
                    ? 'bg-white text-orange-600 shadow-sm font-cabinet'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>☀️</span>
                <span>Déjeuner (11h30 - 14h30)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMealType('diner')}
                className={`px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  selectedMealType === 'diner'
                    ? 'bg-white text-orange-600 shadow-sm font-cabinet'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌙</span>
                <span>Dîner (18h30 - 21h00)</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer un plat au menu..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tous les plats' },
              { id: 'plat_principal', label: '🍛 Plats Chauds' },
              { id: 'entree', label: '🥗 Entrées / Accompagnements' },
              { id: 'dessert', label: '🍧 Desserts & Fruits' },
              { id: 'boisson', label: '🥤 Boissons Locales' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dishes Grid or Admin Publication Banner */}
          {filteredDishes.length === 0 ? (
            <div className="bg-amber-50/70 border border-orange-200/80 rounded-2xl p-6 sm:p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
                👨‍🍳
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base font-cabinet">
                  Aucun plat publié pour ce service ({selectedMealType === 'dejeuner' ? 'Déjeuner 11h30-14h30' : 'Dîner 18h30-21h00'})
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  L'administration de la restauration universitaire publie le menu du jour avec les heures exactes de passage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (user?.role === 'admin') setIsAdminView(true);
                  else setShowBlackPortal(true);
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-full shadow-md transition-all active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <span>👨‍🍳 Programmer le menu du jour (Admin)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onSelectDetail={(d) => {
                    setDetailDish(d);
                    setShowDetailModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Galerie Défilante des 6 Photos : Ambiance & Vie au Resto U UPGC */}
        <DishesMarquee />

        {/* Active Ticket Quick Access Banner if user has a valid ticket */}
        {user && user.savedTickets && user.savedTickets.some(t => t.status === 'valid') && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
            <button
              onClick={() => {
                const firstValid = user.savedTickets.find(t => t.status === 'valid');
                if (firstValid) setActiveTicket(firstValid);
              }}
              className="p-3 sm:p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center space-x-2 font-bold text-xs cursor-pointer active:scale-95 transition-transform"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Voir mon Ticket ({user.savedTickets.filter(t => t.status === 'valid').length})</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 pt-6 pb-24 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>🍽️ <strong>CROU Resto U</strong></span>
            <span>• Centre Régional des Œuvres Universitaires de Korhogo (UPGC)</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (user?.role === 'admin') setIsAdminView(true);
                else setShowBlackPortal(true);
              }}
              className="hover:text-orange-600 transition-colors font-bold"
            >
              Administration CROU
            </button>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE MODALS & DRAWERS */}

      {/* Shopping Cart Drawer matching IMG_0875.webp Screen 3 */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={() => setCart([])}
        onCheckout={handleCheckoutCart}
        user={user}
      />

      {/* Dish Detail Modal matching IMG_0875.webp Screen 2 */}
      <DishDetailModal
        dish={detailDish}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToCart={(dish, qty) => handleAddToCart(dish, qty)}
        onInstantBuy={(dish, qty) => handleInstantBuy(dish, qty)}
      />

      {/* Jeko Secure Payment Modal (IMG_1194 style) */}
      {user && (
        <PaymentCheckoutModal
          isOpen={showWaveModal}
          onClose={() => setShowWaveModal(false)}
          totalAmount={waveTotalAmount}
          items={wavePaymentItems}
          user={user}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Interactive Radar Affluence Modal (Accessible on click without taking page space) */}
      {showRadarModal && (
        <div 
          onClick={() => setShowRadarModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col animate-scaleUp"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-black text-slate-900 font-cabinet">
                  Radar Affluence Resto U • Google Maps
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRadarModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <RadarAffluenceMap 
                canteen={selectedCanteen}
                onUpdateCrowdLevel={(level, waitMin) => {
                  setSelectedCanteen(prev => ({
                    ...prev,
                    crowdLevel: level,
                    waitingTimeMinutes: waitMin
                  }));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {user && (
        <MyTicketsModal
          isOpen={showMyTicketsModal}
          onClose={() => setShowMyTicketsModal(false)}
          user={user}
          onSelectTicket={(ticket) => {
            setShowMyTicketsModal(false);
            setActiveTicket(ticket);
          }}
        />
      )}

      {/* Real Ticket Display Modal with authentic CROU Korhogo photo */}
      <TicketModal
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
        onMarkAsUsed={handleMarkTicketUsed}
      />

      {/* Mobile Floating Bottom Navigation Dock (matching IMG_1079) */}
      <MobileBottomNav
        activeTab={activeBottomTab}
        onTabChange={handleBottomTabChange}
        cartCount={cartTotalItems}
        validTicketsCount={user?.savedTickets?.filter(t => t.status === 'valid').length || 0}
        user={user}
      />

    </div>
  );
};
