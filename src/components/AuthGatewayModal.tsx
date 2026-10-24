import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Smartphone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  HelpCircle,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { 
  signInWithFirebaseOAuth,
  signInWithGoogleApi, 
  registerStudentAccount, 
  loginStudentAccount, 
  getAuthorizedGoogleDomains,
  type StudentProfile 
} from '../services/studentAuth';

interface AuthGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: StudentProfile) => void;
  initialMode?: 'landing' | 'login' | 'register';
  canDismiss?: boolean;
}

export const AuthGatewayModal: React.FC<AuthGatewayModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'landing',
  canDismiss = true,
}) => {
  const [view, setView] = useState<'landing' | 'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [matricule, setMatricule] = useState<string>('');
  const [filiere, setFiliere] = useState<string>('Sciences & Technologies (UPGC)');

  // Google OAuth Guide Dialog State
  const [showGoogleGuide, setShowGoogleGuide] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const googleDomains = getAuthorizedGoogleDomains();

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const res = await signInWithFirebaseOAuth();
      if (res.success && res.profile) {
        setSuccessMessage(`Connecté avec succès via Firebase OAuth (${res.profile.displayName})`);
        setTimeout(() => {
          onAuthSuccess(res.profile!);
          onClose();
        }, 700);
        return;
      }

      if (res.unauthorizedDomain) {
        setErrorMessage(res.error || "Ce domaine doit être ajouté aux domaines autorisés de Firebase.");
        setShowGoogleGuide(true);
      } else if (res.popupClosed) {
        // Fenêtre fermée par l'utilisateur
      } else if (res.popupBlocked) {
        setErrorMessage("La popup Firebase a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up.");
      } else if (res.error) {
        setErrorMessage(res.error);
        if (res.error.includes('origin_mismatch') || res.error.includes('unauthorized domain')) {
          setShowGoogleGuide(true);
        }
      }
    } catch (err: any) {
      console.warn('Firebase OAuth sign in error:', err);
      setErrorMessage("Une erreur est survenue lors de la connexion Firebase. Consultez les instructions ci-dessous.");
      setShowGoogleGuide(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (view === 'register') {
        const res = registerStudentAccount({
          name: fullName,
          identifier,
          password,
          matricule,
          filiere,
        });

        if (!res.success || !res.profile) {
          setErrorMessage(res.error || "Impossible de créer le compte.");
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage("Compte créé avec succès ! Bienvenue au Resto U.");
        setTimeout(() => {
          onAuthSuccess(res.profile!);
          onClose();
        }, 800);
      } else {
        const res = loginStudentAccount(identifier, password);
        if (!res.success || !res.profile) {
          setErrorMessage(res.error || "Identifiant ou mot de passe incorrect.");
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage("Connexion réussie ! Redirection...");
        setTimeout(() => {
          onAuthSuccess(res.profile!);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* GOOGLE ORIGIN_MISMATCH HELP MODAL */}
      {showGoogleGuide && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h4 className="font-black text-base text-slate-900">
                  Résolution : Erreur 400 origin_mismatch
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <p>
                Pour utiliser <strong>Firebase OAuth</strong> sans erreur, le domaine de l'application doit être autorisé dans votre projet Firebase <strong>gen-lang-client-0578572037</strong>.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-900 space-y-2.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>🔥</span>
                  <span>1. Console Firebase (Domaines autorisés)</span>
                </div>
                
                <p className="font-medium text-[11.5px]">
                  Ouvrez directement la{' '}
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0578572037/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-orange-700 hover:text-orange-800 inline-flex items-center gap-1"
                  >
                    Console Firebase (Paramètres d'authentification) <ExternalLink className="w-3 h-3" />
                  </a>
                  , faites défiler jusqu'à <strong>« Domaines autorisés »</strong>, cliquez sur <strong>« Ajouter un domaine »</strong> et collez :
                </p>

                <div className="bg-white p-2.5 rounded-xl border border-amber-300 font-mono text-[11px] text-slate-800 flex items-center justify-between gap-2">
                  <span className="truncate font-bold">ais-dev-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('ais-dev-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app', 'domain')}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-sans font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedUrl === 'domain' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl === 'domain' ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>

                <div className="font-bold flex items-center gap-1.5 text-amber-950 pt-2 border-t border-amber-200/60">
                  <span>🌐</span>
                  <span>2. Google Cloud Console (Origines JavaScript)</span>
                </div>

                <p className="font-medium text-[11.5px]">
                  Dans{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-amber-950 inline-flex items-center gap-1"
                  >
                    Google Cloud Console &gt; Identifiants <ExternalLink className="w-3 h-3" />
                  </a>
                  , ouvrez votre ID Client Web et ajoutez également dans <strong>Origines JavaScript autorisées</strong> :
                </p>

                <div className="bg-white p-2.5 rounded-xl border border-amber-300 font-mono text-[11px] text-slate-800 flex items-center justify-between gap-2">
                  <span className="truncate">{googleDomains.devOrigin}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(googleDomains.devOrigin, 'dev')}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-sans font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedUrl === 'dev' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl === 'dev' ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              {/* QUICK DIRECT ACCESS BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleGuide(false);
                    setView('login');
                    setIdentifier('metroone110@gmail.com');
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-orange-400" />
                  <span>Se connecter immédiatement avec mon adresse Gmail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="bg-[#0F172A] text-white rounded-[32px] max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden relative my-auto">
        
        {/* TOP DISMISS / CLOSE BUTTON */}
        {canDismiss && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: WELCOME LANDING SCREEN (INSPIRED BY SCREENSHOT 1021)   */}
        {/* ============================================================== */}
        {view === 'landing' && (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            
            {/* BRAND ICON / CREST */}
            <div className="relative mb-4 mt-2">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/25 border-2 border-white/20">
                <span className="text-3xl">🍽️</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#0F172A] flex items-center justify-center text-white text-xs font-black">
                ✓
              </div>
            </div>

            {/* HEADINGS */}
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
              Cantine Universitaire
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold mb-3">
              <span>CROU-K</span>
              <span>•</span>
              <span>UPGC Korhogo</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
              Commandez vos repas du jour et réservez vos tickets dématérialisés en toute simplicité.
            </p>

            {/* BUTTON 1: GOOGLE SIGN IN */}
            <div className="w-full space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-transform active:scale-98 cursor-pointer disabled:opacity-60"
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

              {/* BUTTON 2: EMAIL / PHONE REGISTRATION */}
              <button
                type="button"
                onClick={() => setView('register')}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>S'inscrire avec un e-mail ou mobile</span>
              </button>

              {/* BUTTON 3: GUEST EXPLORER */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-2xl font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Accéder en invité (Voir le menu & tickets)</span>
                <span>→</span>
              </button>
            </div>

            {/* FOOTER LINK: ALREADY HAVE ACCOUNT */}
            <div className="pt-2 border-t border-slate-800/80 w-full">
              <p className="text-xs text-slate-400">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-orange-400 font-bold hover:underline cursor-pointer"
                >
                  Se connecter
                </button>
              </p>
            </div>

            {/* HELPER LINK FOR GOOGLE SETUP */}
            <button
              type="button"
              onClick={() => setShowGoogleGuide(true)}
              className="mt-4 text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Aide : Configurer Google Sign-In</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: AUTH FORM VIEW (INSPIRED BY SCREENSHOT 1020)            */}
        {/* ============================================================== */}
        {(view === 'login' || view === 'register') && (
          <div className="p-6 sm:p-7">
            
            {/* TOP BAR WITH BACK CHEVRON */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setView('landing')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                CROU-K UPGC
              </span>
            </div>

            {/* FORM TITLE & TAB TOGGLE */}
            <div className="text-center mb-5">
              <h3 className="text-xl font-black text-white">
                {view === 'login' ? 'Connexion Étudiant' : 'Créer un Compte'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {view === 'login' 
                  ? 'Accédez à vos tickets repas et vos commandes en direct' 
                  : 'Inscrivez-vous pour conserver vos tickets repas en sécurité'}
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  view === 'login'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('register');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  view === 'register'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                S'inscrire
              </button>
            </div>

            {/* NOTIFICATIONS */}
            {errorMessage && (
              <div className="p-3 mb-4 bg-red-950/80 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 mb-4 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* INPUT FORM */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              
              {/* IF REGISTER: FULL NAME */}
              {view === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nom & Prénoms
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Kouassi Yao Jean"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* IDENTIFIER: USERNAME, EMAIL OR MOBILE */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {view === 'login' ? 'E-mail, Matricule ou Téléphone' : 'Adresse e-mail ou Téléphone'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="etudiant@gmail.com ou 0701020304"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* IF REGISTER: MATRICULE & FILIERE */}
              {view === 'register' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Matricule UPGC
                    </label>
                    <input
                      type="text"
                      value={matricule}
                      onChange={(e) => setMatricule(e.target.value)}
                      placeholder="UPGC-2025-..."
                      className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Filière / UFR
                    </label>
                    <select
                      value={filiere}
                      onChange={(e) => setFiliere(e.target.value)}
                      className="w-full px-2.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Sciences & Technologies (UPGC)">Sciences & Tech</option>
                      <option value="Sciences Biologiques">Sciences Bio</option>
                      <option value="Lettres & Sciences Humaines">Lettres & SH</option>
                      <option value="Sciences Économiques">Sciences Éco</option>
                    </select>
                  </div>
                </div>
              )}

              {/* PASSWORD */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => alert("Pour réinitialiser votre mot de passe, contactez l'administration de la cantine ou saisissez votre e-mail pour une connexion directe.")}
                      className="text-[11px] text-orange-400 hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* PRIMARY SOLID SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <span>{view === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
              </button>
            </form>

            {/* SEPARATOR "OU" */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0F172A] px-3 text-slate-500 font-bold">
                  ou
                </span>
              </div>
            </div>

            {/* SECONDARY GOOGLE BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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

            {/* BOTTOM OUTLINE BUTTON (TOGGLE LOGIN / REGISTER) */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setView(view === 'login' ? 'register' : 'login');
                  setErrorMessage(null);
                }}
                className="w-full py-2.5 rounded-xl border border-orange-500/50 hover:border-orange-500 text-orange-400 font-bold text-xs transition-colors cursor-pointer"
              >
                {view === 'login' ? 'Créer un nouveau compte' : "J'ai déjà un compte • Se connecter"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline block mx-auto cursor-pointer"
              >
                Continuer sans se connecter (Accès invité)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
