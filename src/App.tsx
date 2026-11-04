import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  TrendingUp, 
  ChevronRight,
  ShoppingBag,
  Ticket,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Canteen, Dish, MealTicket, UserProfile, MealType } from './types';
import { INITIAL_CANTEENS } from './data/mockData';
import { 
  getLocalCachedDishes,
  subscribeToDishes,
  publishDishToFirestore,
  toggleDishAvailabilityInFirestore,
  removeDishFromFirestore,
  clearAllDishesFromFirestore
} from './services/dishesService';
import { 
  getLocalUserProfile, 
  saveLocalUserProfile, 
  updateUserBalance, 
  addMealTicket, 
  logoutUser,
  purchaseTicketsBatch,
  syncStudentTicketsWithFirestore,
  syncAllLocalAccountsToFirestore
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
import { MobileBottomNav } from './components/MobileBottomNav';
import { CroukOfficialGalleryAndAbout } from './components/CroukOfficialGalleryAndAbout';
import { TicketCounterBox } from './components/TicketCounterBox';
import { TicketIntro } from './components/TicketIntro';
import { PinLock } from './components/PinLock';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { checkPaymentStatus, getPendingPayment, clearPendingPayment } from './services/jekoPayment';

export const App: React.FC = () => {
  // Canteens & Dishes State (Synced in Real-Time across all devices via Firestore)
  const [canteens, setCanteens] = useState<Canteen[]>(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen>(INITIAL_CANTEENS[0]);
  const [dishes, setDishes] = useState<Dish[]>(() => getLocalCachedDishes());
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dejeuner');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User & Portal State (Interface 1 vs Interface 2)
  const [user, setUser] = useState<UserProfile | null>(() => getLocalUserProfile());
  const [showBlackPortal, setShowBlackPortal] = useState<boolean>(false);
  
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
  const [showMyTicketsModal, setShowMyTicketsModal] = useState<boolean>(false);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<MealTicket | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'search' | 'cart' | 'tickets' | 'profile'>('home');

  // Animated Programas Splash Screen on entry (bouncing logo on black background) - only once per session
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('programas_splash_shown_session');
    } catch {
      return false;
    }
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Synchronize published dishes with Firestore in real-time across ALL connected devices
  useEffect(() => {
    const unsubscribe = subscribeToDishes((syncedDishes) => {
      setDishes(syncedDishes || []);
    });
    return () => unsubscribe();
  }, []);


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

  const handleBottomTabChange = (tab: 'home' | 'search' | 'cart' | 'tickets' | 'profile') => {
    setActiveBottomTab(tab);
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Admin dish actions (persisted and broadcasted in Firestore to ALL devices)
  const handleAddDish = async (newDish: Dish) => {
    const res = await publishDishToFirestore(newDish);
    if (res.success) {
      setDishes(prev => [newDish, ...prev.filter(d => d.id !== newDish.id)]);
      showToast(`Plat "${newDish.name}" publié et synchronisé sur tous les appareils.`);
    } else {
      showToast(`Erreur : ${res.error || 'Erreur lors de la synchronisation cloud'}`);
    }
  };

  const handleToggleDishAvailability = async (dishId: string) => {
    const current = dishes.find(d => d.id === dishId);
    const newStatus = current ? !current.isAvailable : false;
    setDishes(prev => prev.map(d => d.id === dishId ? { ...d, isAvailable: newStatus } : d));
    await toggleDishAvailabilityInFirestore(dishId, newStatus);
    showToast('Disponibilité du plat mise à jour.');
  };

  const handleDeleteDish = async (dishId: string) => {
    setDishes(prev => prev.filter(d => d.id !== dishId));
    await removeDishFromFirestore(dishId);
    showToast('Plat supprimé du menu.');
  };

  const handleDeleteAllDishes = async () => {
    setDishes([]);
    await clearAllDishesFromFirestore();
    showToast('Tous les plats ont été supprimés avec succès.');
  };

  const handleUpdateCanteen = (updated: Canteen) => {
    setCanteens(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedCanteen.id === updated.id) {
      setSelectedCanteen(updated);
    }
  };

  // Filtered dishes (supports UPGC campus shared canteen dishes & meal switcher)
  const filteredDishes = dishes.filter(dish => {
    const matchesCanteen = !dish.canteenId || 
                          dish.canteenId === 'all' || 
                          dish.canteenId === selectedCanteen.id ||
                          (selectedCanteen.id.startsWith('resto-upgc') && dish.canteenId.startsWith('resto-upgc'));
    const matchesMeal = dish.mealType === selectedMealType;
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
    const matchesSearch = !searchQuery || 
                          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCanteen && matchesMeal && matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If in admin view mode
  if (isAdminView && user?.role === 'admin') {
    return (
      <PinLock enabled={Boolean(user)} onForgot={handleLogout}>
        <AdminDashboard
          canteen={selectedCanteen}
          dishes={dishes}
          onUpdateCanteen={handleUpdateCanteen}
          onAddDish={handleAddDish}
          onToggleDishAvailability={handleToggleDishAvailability}
          onDeleteDish={handleDeleteDish}
          onDeleteAllDishes={handleDeleteAllDishes}
          onClose={() => setIsAdminView(false)}
        />
      </PinLock>
    );
  }

  return (
    <PinLock enabled={Boolean(user)} onForgot={handleLogout}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative w-full max-w-full">
        {/* Intro animée fluide 60fps : ticket qui monte, prix qui grimpe à 200 F et talon qui se détache */}
        <TicketIntro />

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
        onOpenGemini={() => setShowGeminiModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
        

        {/* DEDICATED TICKET PURCHASING GUICHET (CROU-K SUBVENTION 200 FCFA) */}
        <TicketCounterBox
          user={user}
          onBuyTickets={handleBuyTickets}
          onOpenAuth={() => setShowBlackPortal(true)}
          onOpenMyTickets={() => setShowMyTicketsModal(true)}
        />

        {/* MENU DU JOUR */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-semibold text-orange-600 tracking-normal mb-1">
                Restaurant universitaire · UPGC Korhogo
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Au menu aujourd'hui
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Plats cuisinés sur place · 200 FCFA avec votre ticket CROU.
              </p>
            </div>

            {/* Service hours schedule */}
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
              <span>Midi : <strong className="text-slate-900 font-semibold">11h30 – 14h30</strong></span>
              <span className="text-slate-300">·</span>
              <span>Soir : <strong className="text-slate-900 font-semibold">18h30 – 21h00</strong></span>
            </div>
          </div>

          {/* Meal Type Switcher & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedMealType('dejeuner')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  selectedMealType === 'dejeuner'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Déjeuner (11h30 – 14h30)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMealType('diner')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  selectedMealType === 'diner'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Dîner (18h30 – 21h00)</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tous les plats' },
              { id: 'plat_principal', label: 'Plats chauds' },
              { id: 'entree', label: 'Entrées & accompagnements' },
              { id: 'dessert', label: 'Desserts & fruits' },
              { id: 'boisson', label: 'Boissons' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dishes Grid or Admin Publication Banner */}
          {filteredDishes.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 text-base">
                  Aucun plat publié pour ce service ({selectedMealType === 'dejeuner' ? 'Midi 11h30 – 14h30' : 'Soir 18h30 – 21h00'})
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Le restaurant universitaire met à jour les plats du jour avant chaque service.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {selectedMealType === 'dejeuner' && dishes.some(d => d.mealType === 'diner') && (
                  <button
                    type="button"
                    onClick={() => setSelectedMealType('diner')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Voir les plats du soir (18h30 – 21h00)</span>
                  </button>
                )}
                {selectedMealType === 'diner' && dishes.some(d => d.mealType === 'dejeuner') && (
                  <button
                    type="button"
                    onClick={() => setSelectedMealType('dejeuner')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Voir les plats du midi (11h30 – 14h30)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (user?.role === 'admin') setIsAdminView(true);
                    else setShowBlackPortal(true);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-full shadow-md transition-all active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>👨‍🍳 Programmer le menu du jour (Admin)</span>
                </button>
              </div>
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

        {/* Galerie des 3 Photos Officielles du Resto U & Section À Propos UPGC / CROU-K */}
        <CroukOfficialGalleryAndAbout />

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
      <footer className="mt-auto bg-slate-50 border-t border-slate-200/80 pt-6 pb-28 text-center text-xs text-slate-500">
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

      {/* Floating Gemini AI Quick Launcher */}
      <button
        type="button"
        onClick={() => setShowGeminiModal(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white px-3.5 py-2.5 rounded-full shadow-lg shadow-orange-500/30 border border-white/20 flex items-center space-x-2 text-xs font-black transition-all active:scale-95 cursor-pointer hover:shadow-xl select-none"
        title="Poser une question à l'Assistant IA Gemini"
      >
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
        <span>Assistant IA ✦</span>
      </button>

      {/* Gemini AI Assistant Modal */}
      <GeminiAssistantModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        dishes={dishes}
        studentName={user?.displayName}
      />

      </div>
    </PinLock>
  );
};
