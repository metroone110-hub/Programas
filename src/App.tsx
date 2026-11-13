import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Search,
  ShieldCheck,
  CheckCircle2,
  ChefHat
} from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
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
  logoutUser,
  purchaseTicketsBatch,
  syncStudentTicketsWithFirestore,
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
import { MobileBottomNav, BottomTabId } from './components/MobileBottomNav';
import { TicketCounterBox, QuickPaymentMethod } from './components/TicketCounterBox';
import { TicketIntro } from './components/TicketIntro';
import { PinLock } from './components/PinLock';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { TicketTransferModal } from './components/TicketTransferModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { TicketsView } from './components/TicketsView';
import { ProfileView } from './components/ProfileView';
import { checkPaymentStatus, getPendingPayment, clearPendingPayment } from './services/jekoPayment';
import { triggerHaptic } from './utils/haptics';

export const App: React.FC = () => {
  const [canteens, setCanteens] = useState<Canteen[]>(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen>(INITIAL_CANTEENS[0]);
  const [dishes, setDishes] = useState<Dish[]>(() => getLocalCachedDishes());
  const [isLoadingDishes, setIsLoadingDishes] = useState<boolean>(true);

  const [selectedMealType, setSelectedMealType] = useState<MealType>(() => {
    const hour = new Date().getHours();
    return hour >= 15 ? 'diner' : 'dejeuner';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [user, setUser] = useState<UserProfile | null>(() => {
    const local = getLocalUserProfile();
    if (local && local.isBlocked && local.role === 'student') {
      try {
        localStorage.removeItem('crou_remembered_matricule');
        localStorage.removeItem('crou_remembered_password');
        localStorage.removeItem('crou_user_profile');
      } catch {}
      return null;
    }
    return local;
  });
  const [showBlackPortal, setShowBlackPortal] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);

  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  const [showWaveModal, setShowWaveModal] = useState<boolean>(false);
  const [preferredPayMethod, setPreferredPayMethod] = useState<QuickPaymentMethod>('wave');
  const [wavePaymentItems, setWavePaymentItems] = useState<
    Array<{
      dishId: string;
      dishName: string;
      quantity: number;
      mealType: 'dejeuner' | 'diner';
      canteenId: string;
      canteenName: string;
    }>
  >([]);
  const [waveTotalAmount, setWaveTotalAmount] = useState<number>(200);

  const [showMyTicketsModal, setShowMyTicketsModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferModalTicket, setTransferModalTicket] = useState<MealTicket | null>(null);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<MealTicket | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [blockedAlertMessage, setBlockedAlertMessage] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabId>('home');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Real-time dishes sync
  useEffect(() => {
    const unsubscribe = subscribeToDishes((syncedDishes) => {
      setDishes(syncedDishes || []);
      setIsLoadingDishes(false);
    });
    const fallbackTimer = setTimeout(() => setIsLoadingDishes(false), 1800);
    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Real-time student profile & tickets sync
  useEffect(() => {
    if (!user || !user.matricule) return;

    syncStudentTicketsWithFirestore(user)
      .then((synced) => {
        if (synced && synced.isBlocked && synced.role === 'student') {
          try {
            localStorage.removeItem('crou_remembered_matricule');
            localStorage.removeItem('crou_remembered_password');
            localStorage.removeItem('crou_user_profile');
            window.dispatchEvent(new CustomEvent('crou:clear-remembered-creds'));
          } catch {}
          setUser(null);
          setIsAdminView(false);
          setActiveTicket(null);
          setShowBlackPortal(true);
          setBlockedAlertMessage(
            synced.blockedReason ||
              "Compte bloqué suite à 5 erreurs PIN. Veuillez vous adresser à l'administration CROU."
          );
          return;
        }
        if (synced && synced.savedTickets) {
          setUser((prev) => {
            if (!prev) return synced;
            if (
              JSON.stringify(prev.savedTickets) !== JSON.stringify(synced.savedTickets) ||
              prev.pinHash !== synced.pinHash ||
              prev.pinFails !== synced.pinFails
            ) {
              return synced;
            }
            return prev;
          });
        }
      })
      .catch((err) => {
        console.warn('Sync student tickets notice:', err);
      });

    const unsubscribe = subscribeToStudentProfile(user.matricule, (updatedProfile) => {
      if (updatedProfile.isBlocked && updatedProfile.role === 'student') {
        try {
          localStorage.removeItem('crou_remembered_matricule');
          localStorage.removeItem('crou_remembered_password');
          localStorage.removeItem('crou_user_profile');
          window.dispatchEvent(new CustomEvent('crou:clear-remembered-creds'));
        } catch {}
        setUser(null);
        setIsAdminView(false);
        setActiveTicket(null);
        setShowMyTicketsModal(false);
        setShowTransferModal(false);
        setShowBlackPortal(true);
        setBlockedAlertMessage(
          updatedProfile.blockedReason ||
            "Compte bloqué suite à 5 erreurs PIN. Contactez l'administration CROU."
        );
        return;
      }

      setUser((prev) => {
        if (!prev) return updatedProfile;
        return updatedProfile;
      });

      setActiveTicket((currentActive) => {
        if (!currentActive) return null;
        const fresh = (updatedProfile.savedTickets || []).find(
          (t) => t.id === currentActive.id || t.ticketNumber === currentActive.ticketNumber
        );
        return fresh || currentActive;
      });
    });

    return () => unsubscribe();
  }, [user?.matricule]);

  // Jeko callback return handler
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get('reference') || searchParams.get('order');
    const path = window.location.pathname;

    const isSuccess =
      path.includes('/payment/success') ||
      searchParams.get('payment_status') === 'success' ||
      searchParams.get('status') === 'success';
    const isError =
      path.includes('/payment/error') ||
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
            showToast('Paiement Jeko confirmé ! Vos tickets sont prêts.');
            setActiveBottomTab('tickets');
            try {
              confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            } catch {}
          }
        });
      } else if (isError) {
        clearPendingPayment();
        showToast('Le paiement a été interrompu ou refusé sur Jeko.');
      }

      const cleanPath = window.location.pathname.replace(/\/payment\/(success|error)/, '') || '/';
      window.history.replaceState({}, document.title, cleanPath);
    }
  }, []);

  const handleBottomTabChange = (tab: BottomTabId) => {
    setActiveBottomTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowBlackPortal(false);
    showToast(`Bienvenue ${profile.displayName} !`);
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

  const handleAddToCart = (dish: Dish, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { dish, quantity }];
    });
    showToast(`+${quantity} "${dish.name}" ajouté au panier`);
  };

  const handleUpdateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(dishId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.dish.id === dishId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dish.id !== dishId));
  };

  const handleCheckoutCart = () => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }
    if (cart.length === 0) return;

    const totalMealCount = cart.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = totalMealCount * 200;

    const itemsToPay = cart.map((i) => ({
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

  const handleInstantBuy = (dish: Dish, quantity: number = 1) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    const totalAmount = quantity * 200;
    setWavePaymentItems([
      {
        dishId: 'ticket-crou-repas',
        dishName: `${quantity} Ticket(s) Repas CROU`,
        quantity,
        mealType: dish.mealType,
        canteenId: selectedCanteen.id,
        canteenName: selectedCanteen.name
      }
    ]);
    setWaveTotalAmount(totalAmount);
    setShowDetailModal(false);
    setShowWaveModal(true);
  };

  const handleMarkTicketUsed = async (ticketId: string) => {
    if (!user) return;
    const updatedTickets = (user.savedTickets || []).map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: 'used' as const,
            usedTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          }
        : t
    );
    const updatedUser = { ...user, savedTickets: updatedTickets };
    saveLocalUserProfile(updatedUser);
    setUser(updatedUser);
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket({ ...activeTicket, status: 'used' });
    }
  };

  const handlePaymentSuccess = async (updatedUser: UserProfile, newTickets?: MealTicket[]) => {
    setUser(updatedUser);
    setCart([]);
    if (newTickets && newTickets.length > 0) {
      await recordTicketsSaleInLedger(newTickets.length, 200);
      showToast(`${newTickets.length} ticket(s) validé(s) dans Mes tickets.`);
    } else {
      showToast('Recharge effectuée avec succès !');
    }
  };

  const handleTransferSuccess = (
    updatedUser: UserProfile,
    transferredTicket: MealTicket,
    recipientMatricule: string
  ) => {
    setUser(updatedUser);
    if (
      activeTicket &&
      (activeTicket.id === transferredTicket.id ||
        activeTicket.ticketNumber === transferredTicket.ticketNumber)
    ) {
      setActiveTicket(null);
    }
    showToast(`Ticket ${transferredTicket.ticketNumber} transféré à ${recipientMatricule}.`);
  };

  const handleBuyTickets = (
    quantity: number,
    totalAmount: number,
    method?: QuickPaymentMethod
  ) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }
    if (method) {
      setPreferredPayMethod(method);
    }
    setWaveTotalAmount(totalAmount);
    setWavePaymentItems([
      {
        dishId: 'ticket-crou-repas',
        dishName: `${quantity} Ticket(s) Repas CROU`,
        quantity,
        mealType: selectedMealType,
        canteenId: selectedCanteen.id,
        canteenName: selectedCanteen.name
      }
    ]);
    setShowWaveModal(true);
  };

  // Admin actions
  const handleAddDish = async (newDish: Dish) => {
    const res = await publishDishToFirestore(newDish);
    if (res.success) {
      setDishes((prev) => [newDish, ...prev.filter((d) => d.id !== newDish.id)]);
      showToast(`Plat "${newDish.name}" publié sur tous les appareils.`);
    } else {
      showToast(`Erreur : ${res.error || 'Erreur synchronisation cloud'}`);
      throw new Error(res.error || 'Erreur synchronisation cloud');
    }
  };

  const handleToggleDishAvailability = async (dishId: string) => {
    const current = dishes.find((d) => d.id === dishId);
    const newStatus = current ? !current.isAvailable : false;
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isAvailable: newStatus } : d))
    );
    await toggleDishAvailabilityInFirestore(dishId, newStatus);
    showToast('Disponibilité mise à jour.');
  };

  const handleDeleteDish = async (dishId: string) => {
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
    await removeDishFromFirestore(dishId);
    showToast('Plat supprimé du menu.');
  };

  const handleDeleteAllDishes = async () => {
    setDishes([]);
    await clearAllDishesFromFirestore();
    showToast('Menu réinitialisé.');
  };

  const handleUpdateCanteen = (updated: Canteen) => {
    setCanteens((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedCanteen.id === updated.id) {
      setSelectedCanteen(updated);
    }
  };

  const filteredDishes = dishes.filter((dish) => {
    const matchesCanteen =
      !dish.canteenId ||
      dish.canteenId === 'all' ||
      dish.canteenId === selectedCanteen.id ||
      dish.canteenId === '' ||
      (selectedCanteen.id.startsWith('resto-upgc') &&
        (dish.canteenId.startsWith('resto-upgc') || dish.canteenId === 'all'));

    const dishMeal = (dish.mealType || '').toString().toLowerCase();
    const matchesMeal =
      (selectedMealType === 'dejeuner' &&
        (dishMeal === 'dejeuner' || dishMeal === 'midi' || dishMeal === '')) ||
      (selectedMealType === 'diner' && (dishMeal === 'diner' || dishMeal === 'soir'));

    const matchesCategory =
      selectedCategory === 'all' ||
      dish.category === selectedCategory ||
      (selectedCategory === 'plat_principal' &&
        ((dish.category as string) === 'Plats' || (dish.category as string) === 'plat_principal'));

    const matchesSearch =
      !searchQuery ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCanteen && matchesMeal && matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const validTicketsCount =
    user?.savedTickets?.filter((t) => t.status === 'valid').length || 0;

  if (isAdminView && user?.role === 'admin') {
    return (
      <MotionConfig reducedMotion="user">
        <PinLock
          enabled={Boolean(user)}
          userMatricule={user?.matricule || user?.uid}
          userName={user?.displayName}
          userRole={user?.role}
          accountPinSalt={user?.pinSalt}
          accountPinHash={user?.pinHash}
          accountPinFails={user?.pinFails}
          accountIsBlocked={user?.isBlocked}
          onPinUpdated={(pinSalt, pinHash) => {
            setUser((prev) => (prev ? { ...prev, pinSalt, pinHash, pinFails: 0 } : prev));
          }}
          onForgot={handleLogout}
          onAccountBlocked={(_mat, reason) => {
            logoutUser().catch(() => {});
            setUser(null);
            setIsAdminView(false);
            setCart([]);
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
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <PinLock
        enabled={Boolean(user)}
        userMatricule={user?.matricule || user?.uid}
        userName={user?.displayName}
        userRole={user?.role}
        accountPinSalt={user?.pinSalt}
        accountPinHash={user?.pinHash}
        accountPinFails={user?.pinFails}
        accountIsBlocked={user?.isBlocked}
        onPinUpdated={(pinSalt, pinHash) => {
          setUser((prev) => (prev ? { ...prev, pinSalt, pinHash, pinFails: 0 } : prev));
        }}
        onForgot={handleLogout}
        onAccountBlocked={(_mat, reason) => {
          logoutUser().catch(() => {});
          setUser(null);
          setIsAdminView(false);
          setCart([]);
          setBlockedAlertMessage(reason);
          setShowBlackPortal(true);
        }}
      >
        <div className="min-h-screen bg-[var(--ios-bg)] text-[var(--ios-fg)] flex flex-col relative w-full max-w-full">
          <TicketIntro />

          <BlackGatewayPortal
            isOpen={showBlackPortal}
            onSuccess={handleUserSuccess}
            onGuestAccess={() => setShowBlackPortal(false)}
          />

          {/* Floating Toast */}
          {toastMsg && (
            <div className="fixed top-[max(1rem,env(safe-area-inset-top))] inset-x-0 z-50 flex items-center justify-center pointer-events-none px-4 animate-fadeIn">
              <div className="bg-[#1d1d1f] text-white px-4 py-3 rounded-[18px] shadow-xl border border-white/15 flex items-center gap-2 text-[14px] font-bold pointer-events-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{toastMsg}</span>
              </div>
            </div>
          )}

          {/* Frosted Glass Top Header */}
          <Navbar
            canteens={canteens}
            selectedCanteen={selectedCanteen}
            onSelectCanteen={setSelectedCanteen}
            user={user}
            onOpenAuth={() => setShowBlackPortal(true)}
            onOpenMyTickets={() => setActiveBottomTab('tickets')}
            onOpenAdmin={() => setIsAdminView(true)}
            onLogout={handleLogout}
            cartCount={cartTotalItems}
            onOpenCart={() => setShowCartDrawer(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenNotifications={() => setActiveBottomTab('tickets')}
            onOpenGemini={() => setShowGeminiModal(true)}
            onOpenApkModal={() => setShowApkModal(true)}
          />

          {/* Main Tabbed Screens */}
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-5 pb-32">
            <AnimatePresence mode="wait">
              {activeBottomTab === 'home' && (
                <motion.div
                  key="tab-home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <TicketCounterBox
                    user={user}
                    canteenName={selectedCanteen.name}
                    onBuyTickets={handleBuyTickets}
                    onOpenAuth={() => setShowBlackPortal(true)}
                    onOpenMyTickets={() => {
                      const firstValid = user?.savedTickets?.find((t) => t.status === 'valid');
                      if (firstValid) {
                        setActiveTicket(firstValid);
                      } else {
                        setActiveBottomTab('tickets');
                      }
                    }}
                    onOpenTransfer={() => {
                      if (!user) {
                        setShowBlackPortal(true);
                        return;
                      }
                      setTransferModalTicket(null);
                      setShowTransferModal(true);
                    }}
                  />
                </motion.div>
              )}

              {activeBottomTab === 'menu' && (
                <motion.section
                  key="tab-menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5 select-none"
                >
                  <div className="px-0.5">
                    <h1 className="ios-large-title">Menu du jour</h1>
                    <p className="text-[15px] text-[var(--ios-fg-secondary)] mt-1">
                      200 FCFA avec votre ticket CROU · {selectedCanteen.name}
                    </p>
                  </div>

                  {/* Midi / Soir Segmented Switcher */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--ios-surface)] border border-[var(--ios-border)] rounded-[18px]">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedMealType('dejeuner');
                      }}
                      className={`ios-btn-spring min-h-[46px] px-3 rounded-[14px] text-[15px] font-bold transition-colors ${
                        selectedMealType === 'dejeuner'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'text-[var(--ios-fg-secondary)]'
                      }`}
                    >
                      Midi (11h30 – 14h30)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedMealType('diner');
                      }}
                      className={`ios-btn-spring min-h-[46px] px-3 rounded-[14px] text-[15px] font-bold transition-colors ${
                        selectedMealType === 'diner'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'text-[var(--ios-fg-secondary)]'
                      }`}
                    >
                      Soir (18h30 – 21h00)
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-5 h-5 text-[var(--ios-fg-secondary)] absolute left-4 top-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un plat..."
                      aria-label="Rechercher un plat"
                      className="w-full min-h-[52px] pl-11 pr-4 bg-[var(--ios-surface)] border border-[var(--ios-border)] rounded-[18px] text-[16px] text-[var(--ios-fg)] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                    />
                  </div>

                  {/* Categories */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'all', label: 'Tous' },
                      { id: 'plat_principal', label: 'Plats chauds' },
                      { id: 'entree', label: 'Entrées' },
                      { id: 'dessert', label: 'Desserts' },
                      { id: 'boisson', label: 'Boissons' }
                    ].map((cat) => {
                      const active = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setSelectedCategory(cat.id);
                          }}
                          className={`ios-btn-spring min-h-[40px] px-4 rounded-full text-[14px] font-bold whitespace-nowrap ${
                            active
                              ? 'bg-[#ea580c] text-white'
                              : 'bg-[var(--ios-surface)] text-[var(--ios-fg)] border border-[var(--ios-border)]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Loading Skeletons / Empty State / Dish Grid */}
                  {isLoadingDishes && dishes.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {[1, 2, 3, 4].map((skeleton) => (
                        <div
                          key={skeleton}
                          className="ios-card p-3.5 space-y-3 animate-pulse"
                        >
                          <div className="w-full aspect-square rounded-[18px] bg-[var(--ios-grouped)]" />
                          <div className="h-4 w-3/4 rounded bg-[var(--ios-grouped)]" />
                          <div className="h-3 w-1/2 rounded bg-[var(--ios-grouped)]" />
                        </div>
                      ))}
                    </div>
                  ) : filteredDishes.length === 0 ? (
                    <div className="ios-card p-8 text-center space-y-4">
                      <div className="w-16 h-16 rounded-[20px] bg-[var(--ios-bg)] text-[#ea580c] flex items-center justify-center mx-auto">
                        <Utensils className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-[20px] font-extrabold">
                          Aucun plat pour le service du {selectedMealType === 'dejeuner' ? 'Midi' : 'Soir'}
                        </h2>
                        <p className="text-[15px] text-[var(--ios-fg-secondary)] max-w-sm mx-auto leading-snug">
                          Le restaurant universitaire met à jour la carte avant chaque service.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                        {selectedMealType === 'dejeuner' && dishes.some((d) => d.mealType === 'diner') && (
                          <button
                            type="button"
                            onClick={() => setSelectedMealType('diner')}
                            className="ios-btn-spring min-h-[48px] px-5 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[16px] text-[15px] font-bold"
                          >
                            Voir les plats du Soir
                          </button>
                        )}
                        {selectedMealType === 'diner' && dishes.some((d) => d.mealType === 'dejeuner') && (
                          <button
                            type="button"
                            onClick={() => setSelectedMealType('dejeuner')}
                            className="ios-btn-spring min-h-[48px] px-5 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[16px] text-[15px] font-bold"
                          >
                            Voir les plats du Midi
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (user?.role === 'admin') setIsAdminView(true);
                            else setShowBlackPortal(true);
                          }}
                          className="ios-btn-spring min-h-[48px] px-5 bg-[#ea580c] text-white font-bold text-[15px] rounded-[16px] inline-flex items-center gap-2"
                        >
                          <ChefHat className="w-4 h-4" />
                          <span>Programmer le menu (Admin)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
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
                </motion.section>
              )}

              {activeBottomTab === 'tickets' && (
                <motion.div
                  key="tab-tickets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <TicketsView
                    user={user}
                    onSelectTicket={(ticket) => setActiveTicket(ticket)}
                    onOpenTransfer={(ticket) => {
                      setTransferModalTicket(ticket || null);
                      setShowTransferModal(true);
                    }}
                    onOpenAuth={() => setShowBlackPortal(true)}
                    onGoToHomeBuy={() => setActiveBottomTab('home')}
                  />
                </motion.div>
              )}

              {activeBottomTab === 'profile' && (
                <motion.div
                  key="tab-profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <ProfileView
                    user={user}
                    canteens={canteens}
                    selectedCanteen={selectedCanteen}
                    onSelectCanteen={setSelectedCanteen}
                    onOpenAuth={() => setShowBlackPortal(true)}
                    onOpenMyTickets={() => setActiveBottomTab('tickets')}
                    onOpenTransfer={() => {
                      setTransferModalTicket(null);
                      setShowTransferModal(true);
                    }}
                    onOpenSupport={() => setShowGeminiModal(true)}
                    onOpenApkModal={() => setShowApkModal(true)}
                    onOpenAdmin={() => {
                      if (user?.role === 'admin') setIsAdminView(true);
                      else setShowBlackPortal(true);
                    }}
                    onLogout={handleLogout}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Blurred 4-Tab Bottom Navigation */}
          <MobileBottomNav
            activeTab={activeBottomTab}
            onTabChange={handleBottomTabChange}
            validTicketsCount={validTicketsCount}
            user={user}
          />

          {/* Interactive Sheets & Modals */}
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

          <DishDetailModal
            dish={detailDish}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onAddToCart={(dish, qty) => handleAddToCart(dish, qty)}
            onInstantBuy={(dish, qty) => handleInstantBuy(dish, qty)}
          />

          {user && (
            <PaymentCheckoutModal
              isOpen={showWaveModal}
              onClose={() => setShowWaveModal(false)}
              totalAmount={waveTotalAmount}
              initialPaymentMethod={preferredPayMethod}
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
              onOpenTransfer={(ticket) => {
                setShowMyTicketsModal(false);
                setTransferModalTicket(ticket || null);
                setShowTransferModal(true);
              }}
            />
          )}

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

          <GeminiAssistantModal
            isOpen={showGeminiModal}
            onClose={() => setShowGeminiModal(false)}
            dishes={dishes}
            studentName={user?.displayName}
          />

          <AndroidApkModal
            isOpen={showApkModal}
            onClose={() => setShowApkModal(false)}
          />

          {/* Account Blocked Modal */}
          {blockedAlertMessage && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
              <div className="w-full max-w-md bg-[var(--ios-surface)] text-[var(--ios-fg)] border border-red-500/40 rounded-[28px] p-6 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-[16px] bg-red-500/15 text-red-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <h3 className="text-[20px] font-extrabold">Compte étudiant verrouillé</h3>

                <p className="text-[15px] text-[var(--ios-fg-secondary)] leading-relaxed">
                  {blockedAlertMessage}
                </p>

                <div className="p-3.5 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[16px] text-[14px]">
                  <strong className="block">Guichet Restauration CROU Korhogo (UPGC)</strong>
                  <span className="text-[var(--ios-fg-secondary)]">
                    Présentez votre carte d'étudiant pour réactiver votre accès.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setBlockedAlertMessage(null)}
                  className="ios-btn-spring w-full min-h-[56px] bg-red-600 text-white font-bold text-[16px] rounded-[20px]"
                >
                  J'ai compris
                </button>
              </div>
            </div>
          )}
        </div>
      </PinLock>
    </MotionConfig>
  );
};
