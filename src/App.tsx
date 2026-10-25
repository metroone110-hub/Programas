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
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Canteen, Dish, MealTicket, UserProfile, MealType } from './types';
import { INITIAL_CANTEENS, INITIAL_DISHES } from './data/mockData';
import { getLocalUserProfile, saveLocalUserProfile, updateUserBalance, addMealTicket, logoutUser } from './services/studentAuth';
import { Navbar } from './components/Navbar';
import { DishCard } from './components/DishCard';
import { AuthGatewayModal } from './components/AuthGatewayModal';
import { WalletModal } from './components/WalletModal';
import { TicketModal } from './components/TicketModal';
import { MyTicketsModal } from './components/MyTicketsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FirebaseDomainHelpModal } from './components/FirebaseDomainHelpModal';

export const App: React.FC = () => {
  // State
  const [canteens, setCanteens] = useState<Canteen[]>(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen>(INITIAL_CANTEENS[0]);
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dejeuner');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User state
  const [user, setUser] = useState<UserProfile | null>(() => getLocalUserProfile());
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showMyTicketsModal, setShowMyTicketsModal] = useState<boolean>(false);
  const [showDomainHelpModal, setShowDomainHelpModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<MealTicket | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  // Sync user state changes
  const handleUserSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsAdminView(false);
  };

  // Order ticket workflow
  const handleOrderMeal = async (dish: Dish) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (user.balance < dish.price) {
      // Prompt wallet recharge
      setShowWalletModal(true);
      return;
    }

    // Deduct balance and generate ticket
    const newBalance = user.balance - dish.price;
    const updatedUserBalance = await updateUserBalance(user, newBalance);

    const ticketNumber = `CROU-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newTicket: MealTicket = {
      id: 'tkt_' + Math.random().toString(36).substring(2, 9),
      ticketNumber,
      studentId: user.uid,
      studentName: user.displayName,
      studentMatricule: user.matricule || 'ETUD-2026',
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name,
      dishName: dish.name,
      mealType: dish.mealType,
      date: new Date().toLocaleDateString('fr-FR'),
      price: dish.price,
      status: 'valid',
      qrCodeData: `https://crou.ci/verify?tkt=${ticketNumber}`,
      purchaseTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const finalUser = await addMealTicket(updatedUserBalance, newTicket);
    setUser(finalUser);
    setActiveTicket(newTicket);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if unavailable
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

  // Admin dish actions
  const handleAddDish = (newDish: Dish) => {
    setDishes(prev => [newDish, ...prev]);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        canteens={canteens}
        selectedCanteen={selectedCanteen}
        onSelectCanteen={setSelectedCanteen}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenWallet={() => setShowWalletModal(true)}
        onOpenMyTickets={() => setShowMyTicketsModal(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* Hero Canteen Header & Live Crowd Badge */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
                  Restaurant Universitaire
                </span>
                <span className="text-xs text-slate-300">
                  {selectedCanteen.campus}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-cabinet">
                {selectedCanteen.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>{selectedCanteen.address}</span>
              </p>
            </div>

            {/* Realtime Crowd Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-300">
                  Affluence au tourniquet
                </div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    selectedCanteen.crowdLevel === 'faible'
                      ? 'bg-emerald-400'
                      : selectedCanteen.crowdLevel === 'moyen'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}></span>
                  <span className="font-extrabold text-sm text-white capitalize">
                    {selectedCanteen.crowdLevel === 'faible' ? 'Fluide' : selectedCanteen.crowdLevel === 'moyen' ? 'Moyenne' : 'Forte'}
                  </span>
                  <span className="text-xs text-orange-200">
                    (~{selectedCanteen.waitingTimeMinutes} min d'attente)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subsidized Price Highlight Banner */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white font-semibold">Repas étudiant subventionné à 200 FCFA</span>
              <span className="hidden sm:inline text-slate-400">• Entrée + Plat + Accompagnement</span>
            </div>
            
            <button
              onClick={() => setShowDomainHelpModal(true)}
              className="inline-flex items-center space-x-1 text-orange-300 hover:text-orange-200 text-xs font-medium underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Info connexion Google Firebase</span>
            </button>
          </div>
        </div>

        {/* Meal Type Switcher (Déjeuner vs Dîner) */}
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

        {/* Category Pills */}
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dish Grid */}
        {filteredDishes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Aucun plat correspondant</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Aucun plat ne correspond à vos critères de recherche pour ce restaurant ou ce créneau horaire.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                onOrder={handleOrderMeal}
              />
            ))}
          </div>
        )}

        {/* Active Ticket Quick Access Banner if user has a valid ticket */}
        {user && user.savedTickets && user.savedTickets.some(t => t.status === 'valid') && (
          <div className="fixed bottom-6 right-6 z-20 animate-bounce">
            <button
              onClick={() => {
                const firstValid = user.savedTickets.find(t => t.status === 'valid');
                if (firstValid) setActiveTicket(firstValid);
              }}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center space-x-2.5 font-bold text-xs"
            >
              <QrCode className="w-5 h-5" />
              <span>Afficher mon QR Code Tourniquet</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>🍽️ <strong>CROU Resto U</strong></span>
            <span>• Centre Régional des Œuvres Universitaires</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDomainHelpModal(true)}
              className="hover:text-orange-600 transition-colors"
            >
              Aide Domaine Firebase
            </button>
            <button
              onClick={() => {
                if (user?.role === 'admin') setIsAdminView(true);
                else setShowAuthModal(true);
              }}
              className="hover:text-orange-600 transition-colors"
            >
              Espace Restauration
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthGatewayModal
        isOpen={showAuthModal}
        onSuccess={handleUserSuccess}
        onClose={() => setShowAuthModal(false)}
      />

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

      <TicketModal
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
        onMarkAsUsed={handleMarkTicketUsed}
      />

      <FirebaseDomainHelpModal
        isOpen={showDomainHelpModal}
        onClose={() => setShowDomainHelpModal(false)}
        onContinueDirect={() => {
          if (!user) setShowAuthModal(true);
        }}
      />
    </div>
  );
};
