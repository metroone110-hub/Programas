import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  KeyRound, 
  Sparkles, 
  GraduationCap, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Building2,
  CheckCircle2,
  Ticket,
  ChevronRight
} from 'lucide-react';
import { 
  registerStudentWithMatricule, 
  loginStudentWithMatricule, 
  loginAdminDirect 
} from '../services/studentAuth';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
  onGuestAccess?: () => void;
}

export const BlackGatewayPortal: React.FC<Props> = ({ 
  isOpen, 
  onSuccess,
  onGuestAccess 
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>('login');
  
  // Student Login State
  const [loginMatricule, setLoginMatricule] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Student Register State
  const [regMatricule, setRegMatricule] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUfr, setRegUfr] = useState('UFR Sciences Sociales');
  
  // Admin Login State
  const [adminUser, setAdminUser] = useState('crouk_admin');
  const [adminPass, setAdminPass] = useState('');
  
  // UI Helpers
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await loginStudentWithMatricule(loginMatricule, loginPassword);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Matricule ou mot de passe incorrect.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await registerStudentWithMatricule({
        matricule: regMatricule,
        password: regPassword,
        name: regName,
        ufr: regUfr
      });

      if (res.success && res.user) {
        setSuccessNotice('Compte étudiant créé avec succès ! Vos 2 000 FCFA de bienvenue sont activés.');
        setTimeout(() => {
          onSuccess(res.user!);
        }, 800);
      } else {
        setErrorMsg(res.error || 'Erreur lors de l\'inscription.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await loginAdminDirect(adminUser, adminPass);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Identifiants administrateur invalides.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c] text-white flex flex-col justify-between overflow-y-auto animate-fadeIn select-none font-sans">
      
      {/* Background Ambient Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-orange-700/10 rounded-full blur-[130px]"></div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20 border border-amber-400/30">
            🍽️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight font-cabinet text-white">
                CROU KORHOGO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/30 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Restau. U 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Université Peleforo Gbon Coulibaly • Billetterie Officielle
            </p>
          </div>
        </div>

        {/* Subvention Ribbon */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-200">
            Tarif Subventionné : <strong className="text-amber-400">200 FCFA</strong> / repas
          </span>
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-center">
        
        {/* Card Container */}
        <div className="bg-[#121217] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
          
          {/* Top Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-2xl border border-white/10 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Inscription</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErrorMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'admin'
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center space-x-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center space-x-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* TAB 1: CONNEXION ÉTUDIANT (Matricule + Mot de passe) */}
          {activeTab === 'login' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Numéro de Matricule Étudiant
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={loginMatricule}
                    onChange={(e) => setLoginMatricule(e.target.value.toUpperCase())}
                    placeholder="Ex: UPGC-2026-0842 ou CI0226019482"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono tracking-wider uppercase transition-all"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Votre identifiant officiel unique à l'université UPGC.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Vérification...' : 'Accéder au Resto U'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: INSCRIPTION SIMPLE ÉTUDIANT (Matricule + Mot de passe + Nom) */}
          {activeTab === 'register' && (
            <form onSubmit={handleStudentRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Numéro de Matricule Étudiant *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={regMatricule}
                    onChange={(e) => setRegMatricule(e.target.value.toUpperCase())}
                    placeholder="Ex: UPGC-2026-1102"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono tracking-wider uppercase transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nom et Prénom(s) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Koffi Kouamé Emmanuel"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  UFR / Faculté
                </label>
                <select
                  value={regUfr}
                  onChange={(e) => setRegUfr(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                >
                  <option value="UFR Sciences Sociales" className="bg-slate-900">UFR Sciences Sociales</option>
                  <option value="UFR Sciences Biologiques" className="bg-slate-900">UFR Sciences Biologiques</option>
                  <option value="UFR Lettres et Arts" className="bg-slate-900">UFR Lettres et Arts</option>
                  <option value="Institut Agro-Pastorale" className="bg-slate-900">Institut Agro-Pastorale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Créer un Mot de Passe *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Au moins 4 caractères"
                    className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center space-x-2 text-xs text-amber-200">
                <Ticket className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>2 000 FCFA</strong> offerts à l'inscription pour vos 10 premiers repas subventionnés.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Création...' : 'Créer mon Compte & Activer le Pass'}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: CONNEXION ADMINISTRATION (crouk_admin / upgc2026) */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-slate-800/60 border border-amber-500/30 rounded-2xl flex items-center space-x-2 text-xs text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Espace réservé à la Direction et aux contrôleurs de tourniquet du CROU.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Pseudo Administrateur
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="crouk_admin"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mot de Passe Administrateur
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="upgc2026"
                    className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Connexion...' : 'Connexion Direction CROU'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick guest preview link if needed */}
          {onGuestAccess && (
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={onGuestAccess}
                className="text-xs text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center space-x-1"
              >
                <span>Consulter les plats sans connexion</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span>🏛️ UPGC Korhogo</span>
          <span>•</span>
          <span>Centre Régional des Œuvres Universitaires</span>
        </div>
        <div>
          <span>Système Garanti Anti-Fraude & Billet Tourniquet 2026</span>
        </div>
      </footer>

    </div>
  );
};
