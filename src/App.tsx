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
  Headphones,
  Mic
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
  syncAllLocalAccountsToFirestore,
  subscribeToStudentProfile
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
import { VoiceConversationModal } from './components/VoiceConversationModal';
import { TicketTransferModal } from './components/TicketTransferModal';
import { checkPaymentStatus, getPendingPayment, clearPendingPayment } from './services/jekoPayment';

export const App: React.FC = () => {
  // Canteens & Dishes State (Synced in Real-Time across all devices via Firestore)
  const [canteens, setCanteens] = useState<Canteen[]>(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen>(INITIAL_CANTEENS[0]);
  const [dishes, setDishes] = useState<Dish[]>(() => getLocalCachedDishes());
  const [selectedMealType, setSelectedMealType] = useState<MealType>(() => {
    const hour = new Date().getHours();
    return hour >= 15 ? 'diner' : 'dejeuner';
  });
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
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferModalTicket, setTransferModalTicket] = useState<MealTicket | null>(null);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<MealTicket | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [blockedAlertMessage, setBlockedAlertMessage] = useState<string | null>(null);

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


  // Synchronisation en temps réel du profil et des tickets de l'étudiant avec Firestore
  // Si la borne scanne le ticket, le téléphone bascule immédiatement en ROUGE "UTILISÉ"
  useEffect(() => {
    if (!user || !user.matricule) return;

    // 1. Synchronisation initiale
    syncStudentTicketsWithFirestore(user).then((synced) => {
      if (synced && synced.savedTickets) {
        setUser(prev => {
          if (!prev) return synced;
          if (JSON.stringify(prev.savedTickets) !== JSON.stringify(synced.savedTickets)) {
            return synced;
          }
          return prev;
        });
      }
    }).catch(err => {
      console.warn('Sync student tickets notice:', err);
    });

    // 2. Écoute temps réel : bascule instantanée en rouge quand la borne scanne
    const unsubscribe = subscribeToStudentProfile(user.matricule, (updatedProfile) => {
      setUser(prev => {
        if (!prev) return updatedProfile;
        return updatedProfile;
      });

      // Mettre à jour le ticket affiché en grand s'il vient d'être scanné
      setActiveTicket(currentActive => {
        if (!currentActive) return null;
        const fresh = (updatedProfile.savedTickets || []).find(
          t => t.id === currentActive.id || t.ticketNumber === currentActive.ticketNumber
        );
        return fresh || currentActive;
      });
    });

    return () => unsubscribe();
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

  // Peer-to-Peer Meal Ticket Transfer Success Handler
  const handleTransferSuccess = (updatedUser: UserProfile, transferredTicket: MealTicket, recipientMatricule: string) => {
    setUser(updatedUser);
    if (activeTicket && (activeTicket.id === transferredTicket.id || activeTicket.ticketNumber === transferredTicket.ticketNumber)) {
      setActiveTicket(null);
    }
    showToast(`🎁 Ticket ${transferredTicket.ticketNumber} transféré avec succès à l'étudiant (${recipientMatricule}) !`);
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
      throw new Error(res.error || 'Erreur lors de la synchronisation cloud');
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
                          dish.canteenId === '' ||
                          (selectedCanteen.id.startsWith('resto-upgc') && (dish.canteenId.startsWith('resto-upgc') || dish.canteenId === 'all'));
    
    const dishMeal = (dish.mealType || '').toString().toLowerCase();
    const matchesMeal = (selectedMealType === 'dejeuner' && (dishMeal === 'dejeuner' || dishMeal === 'midi' || dishMeal === '')) ||
                        (selectedMealType === 'diner' && (dishMeal === 'diner' || dishMeal === 'soir'));

    const matchesCategory = selectedCategory === 'all' || 
                            dish.category === selectedCategory ||
                            (selectedCategory === 'plat_principal' && ((dish.category as string) === 'Plats' || (dish.category as string) === 'plat_principal'));

    const matchesSearch = !searchQuery || 
                          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCanteen && matchesMeal && matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If in admin view mode
  if (isAdminView && user?.role === 'admin') {
    return (
      <PinLock 
        enabled={Boolean(user)} 
        userMatricule={user?.matricule || user?.uid}
        userName={user?.displayName}
        onForgot={handleLogout}
        onAccountBlocked={(mat, reason) => {
          handleLogout();
          setBlockedAlertMessage(reason);
          setShowBlackPortal(true);
        }}
      >
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
    <PinLock 
      enabled={Boolean(user)} 
      userMatricule={user?.matricule || user?.uid}
      userName={user?.displayName}
      onForgot={handleLogout}
      onAccountBlocked={(mat, reason) => {
        handleLogout();
        setBlockedAlertMessage(reason);
        setShowBlackPortal(true);
      }}
    >
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
        onOpenVoice={() => setShowVoiceModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
        

        {/* DEDICATED TICKET PURCHASING GUICHET (CROU-K SUBVENTION 200 FCFA) */}
        <TicketCounterBox
          user={user}
          onBuyTickets={handleBuyTickets}
          onOpenAuth={() => setShowBlackPortal(true)}
          onOpenMyTickets={() => setShowMyTicketsModal(true)}
          onOpenTransfer={() => {
            if (!user) {
              setShowBlackPortal(true);
              return;
            }
            setTransferModalTicket(null);
            setShowTransferModal(true);
          }}
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
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedMealType === 'dejeuner'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Midi (11h30 – 14h30)</span>
                {dishes.filter(d => d.mealType === 'dejeuner').length > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    selectedMealType === 'dejeuner' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {dishes.filter(d => d.mealType === 'dejeuner').length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMealType('diner')}
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedMealType === 'diner'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Soir (18h30 – 21h00)</span>
                {dishes.filter(d => d.mealType === 'diner').length > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    selectedMealType === 'diner' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {dishes.filter(d => d.mealType === 'diner').length}
                  </span>
                )}
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
        onOpenTransfer={() => {
          setShowCartDrawer(false);
          setTransferModalTicket(null);
          setShowTransferModal(true);
        }}
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
          onTransferSuccess={handleTransferSuccess}
        />
      )}

      {/* Real Ticket Display Modal with authentic CROU Korhogo photo */}
      <TicketModal
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
        onMarkAsUsed={handleMarkTicketUsed}
        onTransferTicket={(ticket) => {
          setActiveTicket(null);
          setTransferModalTicket(ticket);
          setShowTransferModal(true);
        }}
      />

      {/* Peer-to-Peer Meal Ticket Transfer Modal between Students */}
      {user && (
        <TicketTransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setTransferModalTicket(null);
          }}
          user={user}
          initialTicket={transferModalTicket}
          onTransferSuccess={handleTransferSuccess}
        />
      )}

      {/* Mobile Floating Bottom Navigation Dock (matching IMG_1079) */}
      <MobileBottomNav
        activeTab={activeBottomTab}
        onTabChange={handleBottomTabChange}
        cartCount={cartTotalItems}
        validTicketsCount={user?.savedTickets?.filter(t => t.status === 'valid').length || 0}
        user={user}
      />

      {/* Floating CROU Assistance & Live Voice Launchers */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 select-none">
        {/* Live Voice Button (Gemini Live) */}
        <button
          type="button"
          onClick={() => setShowVoiceModal(true)}
          className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-700 hover:to-amber-600 text-white px-3.5 py-2.5 rounded-full shadow-lg shadow-orange-500/30 border border-orange-400/50 flex items-center space-x-2 text-xs font-black transition-all active:scale-95 cursor-pointer hover:shadow-xl"
          title="Parler de vive voix avec M. Kouassi (Gemini Live API)"
        >
          <div className="relative flex items-center justify-center">
            <Mic className="w-4 h-4 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
          <span className="tracking-wide">Parler (Live)</span>
        </button>

        {/* Text Assistance Button */}
        <button
          type="button"
          onClick={() => setShowGeminiModal(true)}
          className="bg-slate-900/90 hover:bg-black text-white px-3 py-2.5 rounded-full shadow-lg shadow-black/40 border border-slate-700 flex items-center space-x-1.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer hover:shadow-xl"
          title="Ouvrir le clavardage d'assistance"
        >
          <Headphones className="w-4 h-4 text-orange-400" />
          <span className="hidden xs:inline">Assistance</span>
        </button>
      </div>

      {/* Gemini Live Voice Conversation Modal (Full Duplex Real-Time) */}
      <VoiceConversationModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSwitchToTextChat={() => {
          setShowVoiceModal(false);
          setShowGeminiModal(true);
        }}
        dishes={dishes}
        studentName={user?.displayName}
      />

      {/* Gemini AI Assistant Modal (Text Mode) */}
      <GeminiAssistantModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        onOpenVoice={() => {
          setShowGeminiModal(false);
          setShowVoiceModal(true);
        }}
        dishes={dishes}
        studentName={user?.displayName}
      />

      {/* MODAL: ALERTE COMPTE BLOQUÉ SUITE À 5 ERREURS PIN */}
      {blockedAlertMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-3xl p-6 shadow-2xl relative text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-red-500" />
            </div>

            <h3 className="text-base font-extrabold text-white mb-2">
              ⚠️ Compte Étudiant Verrouillé
            </h3>

            <div className="p-3.5 bg-red-950/60 border border-red-500/30 rounded-2xl text-xs text-red-200 mb-4 leading-relaxed">
              <p className="font-bold text-red-300 mb-1">
                Sécurité activée : 5 tentatives de code PIN erronées consécutives.
              </p>
              Pour protéger vos tickets repas et votre solde, votre compte a été bloqué. Toute nouvelle connexion est désormais refusée.
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-6">
              <p>
                Pour réactiver l'accès à votre compte, <strong className="text-white">veuillez vous adresser directement aux responsables de Programas</strong> :
              </p>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 font-medium">
                <div className="flex items-center space-x-2 text-white">
                  <span>🏛️ Guichet Restauration CROU Korhogo (UPGC)</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <span>Muni(e) de votre carte d'étudiant pour vérification</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBlockedAlertMessage(null)}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      </div>
    </PinLock>
  );
};
