import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  AlertCircle,
  Building2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { signInWithGoogleOAuth, signInStudentDirect, verifyAdminCredentials, verifyAdminPassword, AuthErrorDetails } from '../services/studentAuth';
import { UserProfile } from '../types';
import { FirebaseDomainHelpModal } from './FirebaseDomainHelpModal';

interface Props {
  isOpen: boolean;
  onSuccess: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const AuthGatewayModal: React.FC<Props> = ({ isOpen, onSuccess, onClose }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'student' | 'admin'>('student');
  
  // Student form state - NOTICE: phone is strictly empty by default!
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(''); // EMPTY BY DEFAULT - NO PRE-FILLED FAKE NUMBER!
  const [campus, setCampus] = useState('Campus Cocody (FHB)');
  
  // Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [lastAuthError, setLastAuthError] = useState<AuthErrorDetails | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogleOAuth();
      if (res.user) {
        onSuccess(res.user);
      } else if (res.error) {
        setLastAuthError(res.error);
        if (res.error.isDomainError) {
          setShowDomainHelp(true);
        } else {
          setErrorMsg(res.error.message || 'Impossible d\'ouvrir la fenêtre de connexion Google.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Veuillez entrer votre e-mail ou votre matricule étudiant.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const profile = await signInStudentDirect({
        identifier: identifier.trim(),
        name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        role: 'student'
      });
      onSuccess(profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setErrorMsg('Veuillez saisir le pseudo et le mot de passe administrateur.');
      return;
    }

    if (verifyAdminCredentials(adminUsername, adminPassword)) {
      const adminProfile: UserProfile = {
        uid: 'admin_crouk_upgc',
        email: 'crouk_admin@upgc.ci',
        displayName: 'Responsable Cantine CROU Korhogo (UPGC)',
        role: 'admin',
        balance: 50000,
        savedTickets: [],
        campus: 'Campus UPGC Korhogo (CROUK)'
      };
      onSuccess(adminProfile);
    } else {
      setErrorMsg('Identifiant ou mot de passe incorrect.');
    }
  };

  const handleGuestEnter = () => {
    const guestProfile: UserProfile = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 8),
      email: 'etudiant.invite@crou.ci',
      displayName: 'Étudiant Invité',
      role: 'student',
      balance: 0,
      savedTickets: [],
      campus: 'Campus Cocody (FHB)'
    };
    onSuccess(guestProfile);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scaleUp">
        
        {/* Top brand header */}
        <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner mb-3">
              <span className="text-3xl">🍽️</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white font-cabinet">
              CROU Resto U
            </h2>
            <p className="text-orange-100 text-xs font-medium mt-1">
              Plateforme officielle des restaurants universitaires
            </p>
          </div>

          {/* Toggle Student / Admin */}
          <div className="mt-4 inline-flex p-1 bg-black/20 backdrop-blur-sm rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setAuthMethod('student'); setErrorMsg(null); }}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                authMethod === 'student' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Espace Étudiant
            </button>
            <button
              onClick={() => { setAuthMethod('admin'); setErrorMsg(null); }}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                authMethod === 'admin' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Administration
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {errorMsg.toLowerCase().includes('google') && (
                  <button
                    onClick={() => setShowDomainHelp(true)}
                    className="block mt-1 font-bold text-red-800 underline hover:text-red-900"
                  >
                    Voir comment régler l'accès Google →
                  </button>
                )}
              </div>
            </div>
          )}

          {authMethod === 'student' ? (
            <div className="space-y-4">
              {/* Google OAuth Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-3 active:scale-[0.98] disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                </button>

                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowDomainHelp(true)}
                    className="inline-flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Aide connexion Google (Domaine Firebase)</span>
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500 font-semibold tracking-wider">
                    Ou avec vos accès étudiant
                  </span>
                </div>
              </div>

              {/* Login / Register tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Connexion rapide
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nouveau compte
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleStudentSubmit} className="space-y-3">
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Kouamé Jean"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail universitaire ou N° Matricule
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="metroone110@gmail.com ou 2026-CI-8492"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de téléphone <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    {/* NOTICE: value is strictly phone (starts empty), placeholder is clean */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Utilisé pour la recharge Wave / Orange / MTN MoMo
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wide rounded-2xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-60"
                >
                  <span>{tab === 'login' ? 'Entrer sur Resto U' : 'Créer mon profil'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Guest button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleGuestEnter}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Consulter les menus en mode invité →
                </button>
              </div>
            </div>
          ) : (
            /* Admin login */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900">
                <div className="flex items-center font-bold mb-1 space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Accès Administration CROUK (Korhogo - UPGC)</span>
                </div>
                Connectez-vous avec vos identifiants administrateur de restaurant universitaire pour gérer les stocks, le menu du jour et l'affluence.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pseudo administrateur
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Identifiant administrateur"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe administrateur
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wide rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 active:scale-[0.98]"
              >
                <KeyRound className="w-4 h-4" />
                <span>Déverrouiller le panneau d'administration</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMethod('student')}
                  className="text-xs text-orange-600 hover:underline font-semibold"
                >
                  ← Retour à l'espace étudiant
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Service Resto U en direct</span>
          </span>
          <span>Prix repas : 200 FCFA</span>
        </div>
      </div>

      {/* Domain authorization help modal */}
      <FirebaseDomainHelpModal
        isOpen={showDomainHelp}
        onClose={() => setShowDomainHelp(false)}
        onContinueDirect={() => {
          handleGuestEnter();
        }}
      />
    </div>
  );
};
