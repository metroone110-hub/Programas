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
  Wallet, 
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
  logoutUser 
} from './services/studentAuth';
import { Navbar } from './components/Navbar';
import { DishCard } from './components/DishCard';
import { DishDetailModal } from './components/DishDetailModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { JekoWavePaymentModal } from './components/JekoWavePaymentModal';
import { BlackGatewayPortal } from './components/BlackGatewayPortal';
import { WalletModal } from './components/WalletModal';
import { TicketModal } from './components/TicketModal';
import { MyTicketsModal } from './components/MyTicketsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ImageWithLoader } from './components/ImageWithLoader';

export const App: React.FC = () => {
  // Canteens & Dishes State
  const [canteens, setCanteens] = useState<Canteen[]>(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen>(INITIAL_CANTEENS[0]);
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
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
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showMyTicketsModal, setShowMyTicketsModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<MealTicket | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  // Toast notification for lively feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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

  // Instant buy a specific dish
  const handleInstantBuy = (dish: Dish, quantity: number = 1) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    const totalAmount = quantity * 200; // Strict: 200 FCFA per meal!
    setWavePaymentItems([{
      dishId: dish.id,
      dishName: dish.name,
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

  // Payment success handler from Wave
  const handlePaymentSuccess = (updatedUser: UserProfile, newTickets: MealTicket[]) => {
    setUser(updatedUser);
    setCart([]); // Clear cart after payment
    if (newTickets.length > 0) {
      setActiveTicket(newTickets[0]);
    }
    showToast(`Paiement réussi ! ${newTickets.length} ticket(s) ajoutés à votre compte.`);
  };

  // Admin dish actions
  const handleAddDish = (newDish: Dish) => {
    setDishes(prev => [newDish, ...prev]);
    showToast(`Plat "${newDish.name}" publié au menu.`);
  };

  const handleToggleDishAvailability = (dishId: string) => {
    setDishes(prev => prev.map(d => d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d));
  };

  const handleDeleteDish = (dishId: string) => {
    setDishes(prev => prev.filter(d => d.id !== dishId));
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative">
      
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
        onOpenWallet={() => setShowWalletModal(true)}
        onOpenMyTickets={() => setShowMyTicketsModal(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        onLogout={handleLogout}
        cartCount={cartTotalItems}
        onOpenCart={() => setShowCartDrawer(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* Radar Affluence Resto U • Google Maps Card */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-black text-xs sm:text-sm text-slate-900 tracking-tight">
                  Radar Affluence Resto U
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 flex-shrink-0">
                  Google Maps
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 truncate mt-0.5">
                Savoir s'il y a du monde au Resto U en direct • Périmètre 65m
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-bold text-slate-800">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                selectedCanteen.crowdLevel === 'faible' ? 'bg-emerald-500' : selectedCanteen.crowdLevel === 'moyen' ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
              <span>{selectedCanteen.crowdLevel === 'faible' ? 'Fluide' : selectedCanteen.crowdLevel === 'moyen' ? 'Moyenne' : 'Forte'}</span>
              <span className="text-slate-400">(~{selectedCanteen.waitingTimeMinutes} min)</span>
            </div>
            <a 
              href="https://maps.google.com/?q=Universite+Peleforo+Gbon+Coulibaly+Korhogo" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              <span className="hidden xs:inline">Voir la carte</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Dashboard Hero Banner with Lady Background & Text Transition */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-900 bg-slate-950 text-white min-h-[300px] flex flex-col justify-between">
          {/* Animated Background Image: The lady with students in university corridor */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src="/assets/aistudio/IMG_1017_cbecc94a.jpeg"
              alt="Restaurant Universitaire CROU Korhogo - Direction et Étudiants"
              className="w-full h-full object-cover object-center animate-kenburns transition-all duration-1000 filter brightness-90 contrast-115"
            />
            {/* Multi-layered dark gradient overlay for crystal clear text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/60 sm:to-black/35"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
          </div>

          {/* Banner Text Content */}
          <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left Column */}
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-[11px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>MENU OFFICIEL • CROU KORHOGO</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-cabinet tracking-tight leading-tight drop-shadow-md">
                Plats & Menus Programmés
              </h1>

              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm text-slate-200 font-semibold flex items-center space-x-2 flex-wrap drop-shadow-xs">
                  <span>☀️ Déjeuner : <strong className="text-amber-300 font-bold">11h30 - 14h30</strong></span>
                  <span>•</span>
                  <span>🌙 Dîner : <strong className="text-amber-300 font-bold">18h30 - 21h30</strong></span>
                </p>
                <p className="text-xs text-orange-200/90 font-medium drop-shadow-xs">
                  Plats subventionnés à <strong className="text-white font-bold">200 FCFA</strong> • Billetterie Programas
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setShowBlackPortal(true);
                    } else if (cart.length > 0) {
                      setShowCartDrawer(true);
                    } else if (dishes.length > 0) {
                      handleInstantBuy(dishes[0], 1);
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-full shadow-lg shadow-orange-500/30 flex items-center space-x-2 transform active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-base">🎟️</span>
                  <span>Acheter Tickets (200 F)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (user?.role === 'admin') {
                      setIsAdminView(true);
                    } else {
                      setShowBlackPortal(true);
                    }
                  }}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-full backdrop-blur-md border border-white/25 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <span className="text-base">👨‍🍳</span>
                  <span>Programmer Menu</span>
                </button>
              </div>
            </div>

            {/* Right Featured Dish Card Preview */}
            {dishes.length > 0 && (
              <div 
                onClick={() => {
                  setDetailDish(dishes[0]);
                  setShowDetailModal(true);
                }}
                className="cursor-pointer group bg-black/50 hover:bg-black/70 border border-white/20 hover:border-orange-400/60 rounded-2xl p-3 backdrop-blur-md transition-all shadow-xl flex items-center sm:flex-col sm:items-start gap-3 w-full sm:w-56 flex-shrink-0"
              >
                <div className="relative w-20 h-20 sm:w-full sm:h-32 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                  <ImageWithLoader
                    src={dishes[0].imageUrl}
                    alt={dishes[0].name}
                    className="w-full h-full"
                    imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover"
                    spiralLabel="Chargement..."
                  />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-600 text-white shadow-md">
                    200 FCFA
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">
                    Spécialité du Jour
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-orange-300 transition-colors line-clamp-1">
                    {dishes[0].name}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    {dishes[0].description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Slider Pagination Dots */}
          <div className="relative z-10 pb-4 flex items-center justify-center space-x-2">
            <span className="w-6 h-2 bg-orange-500 rounded-full shadow-xs"></span>
            <span className="w-2 h-2 bg-white/40 rounded-full"></span>
            <span className="w-2 h-2 bg-white/40 rounded-full"></span>
          </div>
        </div>

        {/* Rayons & Catégories Section Header */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-base font-extrabold text-slate-900 font-cabinet">
            Rayons & Catégories
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {filteredDishes.length} article{filteredDishes.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Meal Type Switcher (Déjeuner vs Dîner) & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="inline-flex p-1.5 bg-slate-200/80 rounded-2xl shadow-inner">
            <button
              onClick={() => setSelectedMealType('dejeuner')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                selectedMealType === 'dejeuner'
                  ? 'bg-white text-orange-600 shadow-md font-cabinet'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="text-base">☀️</span>
              <span>Déjeuner (11h30 - 14h30)</span>
            </button>

            <button
              onClick={() => setSelectedMealType('diner')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                selectedMealType === 'diner'
                  ? 'bg-white text-orange-600 shadow-md font-cabinet'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="text-base">🌙</span>
              <span>Dîner (18h30 - 21h00)</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un plat, sauce, alloco..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            />
          </div>
        </div>

        {/* Category Pills matching IMG_0875.webp Screen 1 */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Tous les mets' },
            { id: 'plat_principal', label: 'Plats Chauds & Sauces' },
            { id: 'entree', label: 'Entrées & Alloco' },
            { id: 'dessert', label: 'Desserts & Dêguê' },
            { id: 'boisson', label: 'Jus & Boissons' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dish Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900 font-cabinet">
              Recommandés Pour Vous (200 FCFA)
            </h3>
            <span className="text-xs text-orange-600 font-bold hover:underline cursor-pointer">
              Tout voir
            </span>
          </div>

          {filteredDishes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Aucun plat disponible pour ce filtre</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Modifiez vos filtres ou contactez l'administration pour la programmation des menus.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onOrder={handleOrderMeal}
                  onAddToCart={(d) => handleAddToCart(d, 1)}
                  onSelectDetail={(d) => {
                    setDetailDish(d);
                    setShowDetailModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Active Ticket Quick Access Banner if user has a valid ticket */}
        {user && user.savedTickets && user.savedTickets.some(t => t.status === 'valid') && (
          <div className="fixed bottom-6 right-6 z-20 animate-bounce">
            <button
              onClick={() => {
                const firstValid = user.savedTickets.find(t => t.status === 'valid');
                if (firstValid) setActiveTicket(firstValid);
              }}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center space-x-2.5 font-bold text-xs cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              <span>Afficher mon Vrai Ticket CROU</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
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

      {/* Jeko / Wave Payment Modal matching IMG_1059.png */}
      {user && (
        <JekoWavePaymentModal
          isOpen={showWaveModal}
          onClose={() => setShowWaveModal(false)}
          totalAmount={waveTotalAmount}
          items={wavePaymentItems}
          user={user}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {user && (
        <>
          <WalletModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            user={user}
            onBalanceUpdated={(updated) => setUser(updated)}
          />

          <MyTicketsModal
            isOpen={showMyTicketsModal}
            onClose={() => setShowMyTicketsModal(false)}
            user={user}
            onSelectTicket={(ticket) => {
              setShowMyTicketsModal(false);
              setActiveTicket(ticket);
            }}
          />
        </>
      )}

      {/* Real Ticket Display Modal with authentic CROU Korhogo photo */}
      <TicketModal
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
        onMarkAsUsed={handleMarkTicketUsed}
      />

    </div>
  );
};
