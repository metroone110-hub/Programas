import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  LogOut, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  RefreshCw, 
  ArrowLeft, 
  AlertCircle, 
  Check, 
  Clock, 
  Tag, 
  Eye, 
  ChefHat,
  ShieldCheck,
  User,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import type { 
  RestaurantData, 
  ServiceMenu, 
  MenuItem, 
  MealCategory, 
  DietaryTag, 
  ScanMenuResult 
} from '../types';
import { DietaryBadge, TAG_LABELS } from './Badge';
import { AIScanModal } from './AIScanModal';

interface AdminPanelProps {
  data: RestaurantData;
  onBackToStudent: () => void;
  onRefreshData: () => Promise<void>;
  onOpenGuide: () => void;
}

const COMMON_ALLERGENS = [
  'Arachides', 'Poisson', 'Crustacés', 'Oeufs', 'Lait', 'Soja', 'Gluten', 'Graines de sésame'
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  data,
  onBackToStudent,
  onRefreshData,
  onOpenGuide
}) => {
  // Authentication & Session state - ALWAYS requires login when entering
  const [token, setToken] = useState<string>('');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<{ isConfigured: boolean; username?: string } | null>(null);
  const [isLoadingAuthStatus, setIsLoadingAuthStatus] = useState<boolean>(true);

  // Login form state
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Initial setup form state (first-time initialization)
  const [setupUsername, setSetupUsername] = useState<string>('crouk_admin');
  const [setupPassword, setSetupPassword] = useState<string>('');
  const [setupConfirm, setSetupConfirm] = useState<string>('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);

  // Security / Update Credentials state
  const [oldPasswordInput, setOldPasswordInput] = useState<string>('');
  const [newUsernameInput, setNewUsernameInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState<boolean>(false);

  // Active Admin Tab: 'menu' | 'hours_tarifs' | 'security'
  const [activeTab, setActiveTab] = useState<'menu' | 'hours_tarifs' | 'security'>('menu');

  // Working state for menu editing
  const [workingMenu, setWorkingMenu] = useState<ServiceMenu>(() => JSON.parse(JSON.stringify(data.currentMenu)));
  const [announcement, setAnnouncement] = useState<string>(data.announcement);
  const [pricing, setPricing] = useState(data.pricing);
  const [hours, setHours] = useState(data.hours);

  // Status & notifications
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Item form modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('plat');

  // AI Scan modal
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  // Fetch initial auth status from server
  const fetchAuthStatus = async () => {
    try {
      setIsLoadingAuthStatus(true);
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const json = await res.json();
        setAuthStatus(json);
        if (json.username && !currentUsername) {
          setCurrentUsername(json.username);
        }
      }
    } catch (err) {
      console.error('Erreur vérification statut admin:', err);
    } finally {
      setIsLoadingAuthStatus(false);
    }
  };

  useEffect(() => {
    // Ensure clean state: purge any old cached tokens so password is strictly required
    try {
      sessionStorage.removeItem('programas_admin_token');
      sessionStorage.removeItem('programas_admin_user');
      localStorage.removeItem('programas_admin_token');
    } catch {}
    fetchAuthStatus();
  }, []);

  // 1. Initial Account Setup Handler
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (setupPassword !== setupConfirm) {
      setSetupError('Les deux mots de passe saisis ne correspondent pas.');
      return;
    }

    if (setupPassword.length < 5) {
      setSetupError('Le mot de passe doit comporter au moins 5 caractères.');
      return;
    }

    setIsSettingUp(true);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: setupUsername,
          password: setupPassword
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la configuration du compte.');
      }

      setToken(json.token);
      setCurrentUsername(json.username);
      sessionStorage.setItem('programas_admin_token', json.token);
      sessionStorage.setItem('programas_admin_user', json.username);
      setAuthStatus({ isConfigured: true, username: json.username });
      setSaveSuccess('Compte gestionnaire configuré et sécurisé avec succès !');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSetupError(err.message || 'Une erreur est survenue lors de la configuration.');
    } finally {
      setIsSettingUp(false);
    }
  };

  // 2. Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Pseudo ou mot de passe incorrect.');
      }

      setToken(json.token);
      setCurrentUsername(json.username);
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Identifiants invalides.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. Logout & Exit Handlers (strictly locks the admin panel)
  const handleExitToStudent = () => {
    setToken('');
    setCurrentUsername('');
    setLoginPassword('');
    try {
      sessionStorage.removeItem('programas_admin_token');
      sessionStorage.removeItem('programas_admin_user');
      localStorage.removeItem('programas_admin_token');
    } catch {}
    onBackToStudent();
  };

  const handleLogout = () => {
    handleExitToStudent();
  };

  // 4. Update Security Credentials Handler
  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSecurity(true);
    setSecurityError(null);
    setSecurityMsg(null);

    try {
      const res = await fetch('/api/auth/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: oldPasswordInput,
          newUsername: newUsernameInput.trim() || undefined,
          newPassword: newPasswordInput.trim() || undefined
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Impossible de mettre à jour les identifiants.');
      }

      if (json.username) {
        setCurrentUsername(json.username);
        sessionStorage.setItem('programas_admin_user', json.username);
      }

      setSecurityMsg('Vos identifiants ont été mis à jour avec succès.');
      setOldPasswordInput('');
      setNewUsernameInput('');
      setNewPasswordInput('');
      setTimeout(() => setSecurityMsg(null), 4000);
    } catch (err: any) {
      setSecurityError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  // Save changes to server
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      // 1. Save Menu
      const resMenu = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ menu: workingMenu })
      });

      if (!resMenu.ok) {
        const err = await resMenu.json();
        throw new Error(err.error || 'Erreur lors de la sauvegarde du menu');
      }

      // 2. Save info & hours & pricing
      const resInfo = await fetch('/api/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          announcement,
          pricing,
          hours
        })
      });

      if (!resInfo.ok) {
        const err = await resInfo.json();
        throw new Error(err.error || 'Erreur lors de la sauvegarde des informations');
      }

      await onRefreshData();
      setSaveSuccess('Le menu et les paramètres ont été publiés avec succès sur Programas !');
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default template
  const handleResetData = async () => {
    if (!window.confirm('Voulez-vous réinitialiser le menu du Resto U UPGC Korhogo ?')) {
      return;
    }

    try {
      const res = await fetch('/api/menu/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setWorkingMenu(json.data.currentMenu);
        setAnnouncement(json.data.announcement);
        setPricing(json.data.pricing);
        setHours(json.data.hours);
        await onRefreshData();
        setSaveSuccess('Menu réinitialisé avec succès !');
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch (err) {
      alert('Erreur lors de la réinitialisation');
    }
  };

  // Apply OCR scanned items
  const handleApplyExtractedMenu = (scanned: ScanMenuResult, mode: 'replace' | 'append') => {
    const newItems: MenuItem[] = scanned.items.map((item, idx) => ({
      id: `scanned-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description || '',
      category: item.category,
      tags: item.tags || [],
      allergens: item.allergens || [],
      priceExtra: item.priceExtra,
      isAvailable: true
    }));

    setWorkingMenu((prev) => ({
      ...prev,
      theme: scanned.theme || prev.theme,
      service: scanned.service || prev.service,
      date: scanned.date || prev.date,
      items: mode === 'replace' ? newItems : [...prev.items, ...newItems]
    }));

    setSaveSuccess(`Scan appliqué : ${newItems.length} plats ajoutés. Cliquez sur "Publier en direct" pour enregistrer.`);
    setTimeout(() => setSaveSuccess(null), 5000);
  };

  // Item deletion
  const handleDeleteItem = (id: string) => {
    setWorkingMenu((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
  };

  // Toggle item availability
  const handleToggleAvailability = (id: string) => {
    setWorkingMenu((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    }));
  };

  // Item saving (Add or Edit)
  const handleSaveItemModal = (item: MenuItem) => {
    setWorkingMenu((prev) => {
      const exists = prev.items.some((i) => i.id === item.id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((i) => (i.id === item.id ? item : i))
        };
      } else {
        return {
          ...prev,
          items: [...prev.items, item]
        };
      }
    });
    setEditingItem(null);
    setIsCreatingNew(false);
  };

  // ------------------- VIEW: INITIAL ACCOUNT SETUP -------------------
  if (!token && authStatus && !authStatus.isConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in duration-200">
          {/* Tricolore Band */}
          <div className="h-2 w-full grid grid-cols-3">
            <div className="bg-orange-500"></div>
            <div className="bg-white"></div>
            <div className="bg-green-600"></div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-green-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-black uppercase tracking-wider mb-2">
                🇨🇮 UPGC Korhogo • Resto U CROU-K
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Configuration du Compte Gestionnaire
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Bienvenue sur <strong>Programas</strong>. Pour sécuriser l'accès et garantir que <strong>seule votre équipe</strong> a le droit de publier les menus, définissez votre pseudo officiel et votre mot de passe personnalisé.
              </p>
            </div>

            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>Votre Identifiant / Pseudo de gestionnaire</span>
                </label>
                <input
                  type="text"
                  required
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  placeholder="Ex: gestionnaire_upgc ou chef_crouk"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Ce pseudo sera exigé pour chaque connexion future.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                  <span>Mot de passe personnalisé</span>
                </label>
                <input
                  type="password"
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Choisissez un mot de passe solide (min. 5 caractères)..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span>Confirmez le mot de passe</span>
                </label>
                <input
                  type="password"
                  required
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe identique..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-green-500 text-sm font-semibold"
                />
              </div>

              {setupError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{setupError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSettingUp}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isSettingUp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Création du compte sécurisé...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Activer et Sécuriser mon Espace Gestionnaire</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                onClick={onBackToStudent}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour au menu étudiant
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------- VIEW: LOGIN TO EXISTING ACCOUNT -------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in duration-200">
          {/* Tricolore Band */}
          <div className="h-2 w-full grid grid-cols-3">
            <div className="bg-orange-500"></div>
            <div className="bg-white"></div>
            <div className="bg-green-600"></div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
                <Lock className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-xs font-black uppercase tracking-wider mb-2">
                <span>🇨🇮</span> UPGC Korhogo • CROU-K
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Portail Gestionnaire Programas
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Espace sécurisé de la cantine et restaurant universitaire
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>Identifiant (Pseudo)</span>
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Saisissez votre pseudo gestionnaire..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                  <span>Mot de passe</span>
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Votre mot de passe confidentiel..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Vérification sécurisée...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Connexion au panneau de gestion</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                onClick={onBackToStudent}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour au menu étudiant
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------- VIEW: AUTHENTICATED ADMIN DASHBOARD -------------------
  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Top Tricolore Côte d'Ivoire Accent */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-orange-500"></div>
        <div className="bg-white"></div>
        <div className="bg-green-600"></div>
      </div>

      {/* Admin Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white shadow-xs">
              <ChefHat className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">
                  Programas • Administration Resto U
                </h1>
                <span className="bg-green-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded uppercase">
                  UPGC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connecté en tant que : <strong className="text-orange-400 font-bold">{currentUsername || 'Gestionnaire'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExitToStudent}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>Aperçu Étudiant</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-bold transition-colors flex items-center gap-1 border border-red-800/50"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-4 text-xs font-bold border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'menu'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🍽️ Carte & Plats du Jour</span>
          </button>
          <button
            onClick={() => setActiveTab('hours_tarifs')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'hours_tarifs'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>⚙️ Tarifs & Horaires (200 FCFA)</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🔐 Sécurité du Compte</span>
          </button>
          <button
            onClick={onOpenGuide}
            className="ml-auto py-2.5 text-slate-400 hover:text-white flex items-center gap-1 shrink-0"
          >
            <span>🚀 Déploiement</span>
          </button>
        </div>
      </header>

      {/* Toast notifications */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        {saveSuccess && (
          <div className="p-3.5 mb-4 rounded-xl bg-green-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="p-3.5 mb-4 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 space-y-6">
        {/* TAB 1: MENU EDITING */}
        {activeTab === 'menu' && (
          <>
            {/* Top Toolbar: AI Scan + Save + Service Switcher */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* AI Scan Button */}
                <button
                  onClick={() => setIsScanModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Scanner une photo de menu (OCR IA)</span>
                </button>

                {/* Add Item Manual Button */}
                <button
                  onClick={() => {
                    setIsCreatingNew(true);
                    setEditingItem({
                      id: `plat-${Date.now()}`,
                      title: '',
                      description: '',
                      category: 'plat',
                      tags: ['local'],
                      allergens: [],
                      isAvailable: true
                    });
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-orange-400" />
                  <span>Ajouter un plat</span>
                </button>
              </div>

              {/* Service & Date Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={workingMenu.date}
                  onChange={(e) => setWorkingMenu({ ...workingMenu, date: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                />

                <select
                  value={workingMenu.service}
                  onChange={(e) =>
                    setWorkingMenu({ ...workingMenu, service: e.target.value as 'dejeuner' | 'diner' })
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="dejeuner">☀️ Midi (Déjeuner)</option>
                  <option value="diner">🌙 Soir (Dîner)</option>
                </select>

                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Publier en direct</span>
                </button>
              </div>
            </div>

            {/* Menu Theme banner input & Clear Menu Button */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                Thème ou Spécialité :
              </span>
              <input
                type="text"
                value={workingMenu.theme || ''}
                onChange={(e) => setWorkingMenu({ ...workingMenu, theme: e.target.value })}
                placeholder="Ex: Menu du Jour, Spécialités Ivoiriennes du Poro..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-orange-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                {workingMenu.items.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Voulez-vous retirer tous les plats et dépublier le menu d'aujourd'hui ?")) {
                        setWorkingMenu({ ...workingMenu, theme: '', items: [] });
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vider le menu
                  </button>
                )}
                <button
                  onClick={handleResetData}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Exemple
                </button>
              </div>
            </div>

            {/* Categories Management Cards */}
            {(['entree', 'plat', 'vegetarien', 'accompagnement', 'dessert'] as MealCategory[]).map(
              (cat) => {
                const items = workingMenu.items.filter((i) => i.category === cat);
                const titleMap: Record<MealCategory, string> = {
                  entree: '🥗 Entrées',
                  plat: '🍛 Plats Chauds & Sauces',
                  vegetarien: '🌿 Pôle Végétal',
                  accompagnement: '🍚 Accompagnements (Riz, Foutou, Attiéké, Placali, Alloco)',
                  dessert: '🥭 Desserts & Fruits Frais'
                };

                return (
                  <div key={cat} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {titleMap[cat]}
                        </h3>
                        <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                          {items.length}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setIsCreatingNew(true);
                          setEditingItem({
                            id: `${cat}-${Date.now()}`,
                            title: '',
                            description: '',
                            category: cat,
                            tags: cat === 'vegetarien' ? ['veggie'] : ['local'],
                            allergens: [],
                            isAvailable: true
                          });
                        }}
                        className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Ajouter
                      </button>
                    </div>

                    {items.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Aucun plat dans cette catégorie.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              item.isAvailable
                                ? 'bg-slate-50/70 border-slate-200'
                                : 'bg-slate-100/50 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {item.title}
                                </span>
                                {item.priceExtra && (
                                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                                    {item.priceExtra}
                                  </span>
                                )}
                                {!item.isAvailable && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Épuisé
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.tags.map((t) => (
                                  <DietaryBadge key={t} tag={t} size="sm" />
                                ))}
                                {item.allergens?.map((a) => (
                                  <span
                                    key={a}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium"
                                  >
                                    ⚠️ {a}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleToggleAvailability(item.id)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                                  item.isAvailable
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {item.isAvailable ? 'Disponible' : 'Épuisé'}
                              </button>
                              <button
                                onClick={() => {
                                  setIsCreatingNew(false);
                                  setEditingItem({ ...item });
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </>
        )}

        {/* TAB 2: HOURS, TARIFS (200 FCFA) & ANNOUNCEMENTS */}
        {activeTab === 'hours_tarifs' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-extrabold text-slate-900">
                Paramètres de la Cantine & Resto U
              </h2>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Enregistrer les paramètres</span>
              </button>
            </div>

            {/* Announcement banner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message d'alerte / Annonce du jour (bannière supérieure)
              </label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Ex: 🇨🇮 Bienvenue sur Programas - Resto U UPGC Korhogo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Laisser vide si aucune annonce exceptionnelle n'est en cours.
              </p>
            </div>

            {/* Tarifs - 200 FCFA pour tout le monde */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tarification du Ticket Repas ({pricing.currency})
                </h3>
                <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  200 FCFA pour tout le monde
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-orange-50/60 p-4 rounded-xl border-2 border-orange-200">
                  <label className="text-xs font-extrabold text-orange-950 block mb-1">
                    Prix du Ticket Repas Unique (pour tout le monde)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="25"
                      value={pricing.boursier}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPricing({
                          ...pricing,
                          ticketUnique: val,
                          boursier: val,
                          nonBoursier: val,
                          personnel: val,
                          visiteur: val
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-orange-300 text-base font-black bg-white text-orange-700"
                    />
                    <span className="font-extrabold text-slate-700 text-sm">{pricing.currency}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Fixé à 200 FCFA pour tous (Étudiants UPGC, Personnels, Extérieurs).
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col justify-center">
                  <span className="font-bold text-slate-900 mb-1">ℹ️ Règle de tarification UPGC</span>
                  <span>Conformément aux instructions, le ticket repas est facturé à 200 FCFA de manière uniforme. Les moyens de paiement acceptés incluent les tickets CROU-K physiques et les portefeuilles Wave, Orange Money et MTN MoMo.</span>
                </div>
              </div>
            </div>

            {/* Horaires et Affluence */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Horaires d'ouverture & Affluence en direct
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Horaires Déjeuner (Midi)</label>
                  <input
                    type="text"
                    value={hours.midi}
                    onChange={(e) => setHours({ ...hours, midi: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Horaires Dîner (Soir)</label>
                  <input
                    type="text"
                    value={hours.soir}
                    onChange={(e) => setHours({ ...hours, soir: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Niveau d'affluence en direct</label>
                  <select
                    value={hours.crowdLevel}
                    onChange={(e) =>
                      setHours({ ...hours, crowdLevel: e.target.value as 'faible' | 'moyen' | 'fort' })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="faible">🟢 Faible (Pas d'attente)</option>
                    <option value="moyen">🟡 Modérée (5-10 min)</option>
                    <option value="fort">🔴 Forte (&gt; 15 min)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Statut affiché aux étudiants</label>
                <input
                  type="text"
                  value={hours.customStatus || ''}
                  onChange={(e) => setHours({ ...hours, customStatus: e.target.value })}
                  placeholder="Ex: Ouvert actuellement, Service du midi en cours..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNT & SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm max-w-xl mx-auto space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Sécurité & Paramètres du Compte Gestionnaire
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Seuls vous et votre équipe ont accès à la publication des menus. Vous pouvez modifier votre identifiant ou mettre à jour votre mot de passe à tout moment.
              </p>
            </div>

            <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl text-xs text-orange-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-800 tracking-wider block">Identifiant officiel actuel</span>
                <span className="font-black text-sm text-slate-900">{currentUsername || 'Non défini'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-extrabold text-[10px]">
                Compte Actif 🇨🇮
              </span>
            </div>

            <form onSubmit={handleUpdateSecurity} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                  <span>Mot de passe actuel (Requis pour toute modification)</span>
                </label>
                <input
                  type="password"
                  required
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  placeholder="Entrez votre mot de passe actuel..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-xs font-semibold"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nouveau pseudo gestionnaire (Optionnel)</span>
                </label>
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  placeholder="Laisser vide pour conserver le pseudo actuel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nouveau mot de passe (Optionnel)</span>
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Laisser vide pour conserver le mot de passe actuel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-xs font-semibold"
                />
              </div>

              {securityMsg && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-green-600" />
                  <span>{securityMsg}</span>
                </div>
              )}

              {securityError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{securityError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingSecurity}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isUpdatingSecurity ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mise à jour en cours...</span>
                  </>
                ) : (
                  <span>Enregistrer les nouvelles informations de sécurité</span>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Item Modal (Create / Edit) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-black text-slate-900 text-base mb-4">
              {isCreatingNew ? 'Ajouter un plat' : 'Modifier le plat'}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom du plat / Mets ivoirien
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Ex: Sauce graine au bœuf, Kedjenou de poulet, Attiéké poisson..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Ingrédients
                </label>
                <input
                  type="text"
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Ex: Préparé avec les épices traditionnelles du Nord..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catégorie
                  </label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as MealCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="entree">Entrée</option>
                    <option value="plat">Plat Chaud / Sauce</option>
                    <option value="vegetarien">Pôle Végétal</option>
                    <option value="accompagnement">Accompagnement</option>
                    <option value="dessert">Dessert / Fruit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Disponibilité
                  </label>
                  <select
                    value={editingItem.isAvailable ? 'yes' : 'no'}
                    onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.value === 'yes' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="yes">🟢 En stock</option>
                    <option value="no">🔴 Épuisé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Labels & Spécificités
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['local', 'fait_maison', 'halal', 'sans_porc', 'veggie'] as DietaryTag[]).map((tag) => {
                    const selected = editingItem.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          const newTags = selected
                            ? editingItem.tags.filter((t) => t !== tag)
                            : [...editingItem.tags, tag];
                          setEditingItem({ ...editingItem, tags: newTags });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                          selected
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {TAG_LABELS[tag]?.label || tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsCreatingNew(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!editingItem.title.trim()) {
                    alert('Le titre du plat est obligatoire');
                    return;
                  }
                  handleSaveItemModal(editingItem);
                }}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-sm"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI OCR Scan Modal */}
      <AIScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onApplyExtractedMenu={handleApplyExtractedMenu}
        adminToken={token}
      />
    </div>
  );
};
