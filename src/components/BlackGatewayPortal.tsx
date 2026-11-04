import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert,
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft,
  KeyRound, 
  UserPlus, 
  GraduationCap, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Building2,
  CheckCircle2,
  Ticket,
  ChevronRight,
  Smartphone,
  UserCheck,
  RefreshCw,
  Hash,
  Shield
} from 'lucide-react';
import { 
  registerStudentWithMatricule, 
  loginStudentWithMatricule, 
  loginAdminDirect,
  lookupStudentForRecovery,
  verifyAndResetStudentPassword,
  RecoveryAccountInfo
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
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin' | 'forgot_password'>('login');
  
  // Student Login State (Remembered credentials from previous sessions)
  const [loginMatricule, setLoginMatricule] = useState(() => {
    try {
      return localStorage.getItem('crou_remembered_matricule') || '';
    } catch {
      return '';
    }
  });
  const [loginPassword, setLoginPassword] = useState(() => {
    try {
      return localStorage.getItem('crou_remembered_password') || '';
    } catch {
      return '';
    }
  });
  const [rememberMe, setRememberMe] = useState(true);

  // Multi-Step Secure Recovery State (Anti-Usurpation)
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryAccount, setRecoveryAccount] = useState<RecoveryAccountInfo | null>(null);
  const [forgotMatricule, setForgotMatricule] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyName, setVerifyName] = useState('');
  const [securityCodeInput, setSecurityCodeInput] = useState('');
  const [generatedSecurityCode, setGeneratedSecurityCode] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  // Student Register State
  const [regMatricule, setRegMatricule] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUfr, setRegUfr] = useState('UFR Sciences Sociales');
  
  // Admin Login State
  const [adminUser, setAdminUser] = useState('');
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
        if (rememberMe) {
          try {
            localStorage.setItem('crou_remembered_matricule', loginMatricule.trim().toUpperCase());
            localStorage.setItem('crou_remembered_password', loginPassword);
          } catch {}
        } else {
          try {
            localStorage.removeItem('crou_remembered_matricule');
            localStorage.removeItem('crou_remembered_password');
          } catch {}
        }
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
        phone: regPhone.trim() || undefined,
        ufr: regUfr
      });

      if (res.success && res.user) {
        try {
          localStorage.setItem('crou_remembered_matricule', regMatricule.trim().toUpperCase());
          localStorage.setItem('crou_remembered_password', regPassword);
        } catch {}
        setSuccessNotice('Compte étudiant créé avec succès ! Votre pass repas est activé.');
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

  // Étape 1 : Vérification de l'existence du matricule
  const handleLookupMatriculeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const cleanMat = forgotMatricule.trim().toUpperCase();
      if (!cleanMat) {
        setErrorMsg('Veuillez entrer votre numéro de matricule étudiant.');
        setIsLoading(false);
        return;
      }

      const res = await lookupStudentForRecovery(cleanMat);
      if (res.success && res.account) {
        setRecoveryAccount(res.account);
        // Générer un code temporaire de sécurité CROU-K à 6 chiffres
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedSecurityCode(code);
        setSecurityCodeInput('');
        setVerifyPhone('');
        setVerifyName('');
        setRecoveryStep(2);
      } else {
        setErrorMsg(res.message || 'Matricule introuvable. Vérifiez votre saisie ou créez un compte.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2 : Vérification de l'identité du titulaire (anti-usurpation)
  const handleVerifyIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!recoveryAccount) {
      setRecoveryStep(1);
      return;
    }

    // 1. Vérification du code de sécurité CROU-K à 6 chiffres
    const cleanCode = securityCodeInput.replace(/\D/g, '');
    if (cleanCode !== generatedSecurityCode) {
      setErrorMsg('Code de sécurité incorrect. Veuillez saisir les 6 chiffres affichés ci-dessous.');
      return;
    }

    // 2. Vérification Téléphone ou Nom complet
    if (recoveryAccount.hasPhone && recoveryAccount.rawPhone) {
      const regDigits = recoveryAccount.rawPhone.replace(/\D/g, '').slice(-8);
      const inDigits = verifyPhone.replace(/\D/g, '').slice(-8);
      if (!inDigits || inDigits.length < 8 || inDigits !== regDigits) {
        const cleanNameIn = verifyName.trim().toLowerCase();
        const cleanNameAcc = (recoveryAccount.rawDisplayName || '').trim().toLowerCase();
        const matchesName = cleanNameIn && cleanNameAcc && (
          cleanNameAcc.includes(cleanNameIn) || cleanNameIn.includes(cleanNameAcc)
        );
        if (!matchesName) {
          setErrorMsg('Numéro de téléphone incorrect. Il ne correspond pas au compte enregistré.');
          return;
        }
      }
    } else {
      // Aucun téléphone pré-enregistré : validation stricte du nom complet
      const cleanNameIn = verifyName.trim().toLowerCase();
      const cleanNameAcc = (recoveryAccount.rawDisplayName || '').trim().toLowerCase();
      if (!cleanNameIn || cleanNameIn.length < 2) {
        setErrorMsg('Veuillez saisir votre Nom complet pour confirmer votre identité.');
        return;
      }
      const inParts = cleanNameIn.split(/\s+/).filter(p => p.length >= 2);
      const accParts = cleanNameAcc.split(/\s+/).filter(p => p.length >= 2);
      const hasMatch = inParts.some(ip => accParts.some(ap => ap.includes(ip) || ip.includes(ap)));
      if (!hasMatch && !cleanNameAcc.includes(cleanNameIn)) {
        setErrorMsg('Le nom saisi ne correspond pas au titulaire enregistré pour ce matricule.');
        return;
      }
    }

    // Tout est vérifié avec succès -> passage à l'étape 3
    setRecoveryStep(3);
  };

  // Étape 3 : Enregistrement du nouveau mot de passe
  const handleFinalPasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!forgotNewPass || forgotNewPass.length < 4) {
      setErrorMsg('Le mot de passe doit comporter au moins 4 caractères (6+ recommandé).');
      return;
    }

    if (forgotNewPass !== forgotConfirmPass) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyAndResetStudentPassword({
        matricule: forgotMatricule,
        phoneInput: verifyPhone.trim() || undefined,
        nameInput: verifyName.trim() || undefined,
        securityCodeInput: securityCodeInput,
        expectedSecurityCode: generatedSecurityCode,
        newPass: forgotNewPass.trim()
      });

      if (res.success && res.user) {
        setSuccessNotice('Votre mot de passe a été sécurisé et mis à jour ! Connexion immédiate...');
        setTimeout(() => {
          onSuccess(res.user!);
        }, 900);
      } else {
        setErrorMsg(res.message || 'Impossible de réinitialiser le mot de passe.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau.');
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
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-orange-500/20 border border-amber-400/30 flex-shrink-0">
            <img src="/icon.svg" alt="Programas" className="w-full h-full object-cover" />
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

        {/* Subvention Ribbon & Close Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">
              Tarif Subventionné : <strong className="text-amber-400">200 FCFA</strong> / repas
            </span>
          </div>
          {onGuestAccess && (
            <button
              type="button"
              onClick={onGuestAccess}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold"
              title="Fermer et voir les menus"
            >
              <span>Voir le Menu</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-center">
        
        {/* Card Container */}
        <div className="bg-[#121217] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden pop-in">
          
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
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
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
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Numéro de matricule
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={loginMatricule}
                    onChange={(e) => setLoginMatricule(e.target.value.toUpperCase())}
                    placeholder="Ex: 01601834 ou UPGC-2026-0842"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono tracking-wider uppercase transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Votre identifiant officiel à l'université UPGC.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
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
                
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-black/60 border-white/30 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />
                    <span className="font-medium text-slate-300">Se souvenir de moi</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotMatricule(loginMatricule);
                      setActiveTab('forgot_password');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 hover:underline cursor-pointer transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-loading={isLoading ? "true" : undefined}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Vérification...' : 'Se connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB: RÉINITIALISATION MOT DE PASSE SÉCURISÉE EN 3 ÉTAPES (ANTI-USURPATION) */}
          {activeTab === 'forgot_password' && (
            <div className="space-y-4">
              {/* Stepper Header */}
              <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
                <div className={`flex items-center space-x-1.5 text-xs font-bold ${recoveryStep >= 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${recoveryStep === 1 ? 'bg-amber-500 text-black font-extrabold' : recoveryStep > 1 ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>
                    {recoveryStep > 1 ? '✓' : '1'}
                  </span>
                  <span>Matricule</span>
                </div>
                <div className={`h-0.5 flex-1 mx-2 ${recoveryStep >= 2 ? 'bg-amber-500' : 'bg-white/10'}`}></div>
                <div className={`flex items-center space-x-1.5 text-xs font-bold ${recoveryStep >= 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${recoveryStep === 2 ? 'bg-amber-500 text-black font-extrabold' : recoveryStep > 2 ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>
                    {recoveryStep > 2 ? '✓' : '2'}
                  </span>
                  <span>Identité</span>
                </div>
                <div className={`h-0.5 flex-1 mx-2 ${recoveryStep >= 3 ? 'bg-amber-500' : 'bg-white/10'}`}></div>
                <div className={`flex items-center space-x-1.5 text-xs font-bold ${recoveryStep >= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${recoveryStep === 3 ? 'bg-amber-500 text-black font-extrabold' : 'bg-white/10'}`}>
                    3
                  </span>
                  <span>Nouveau code</span>
                </div>
              </div>

              {/* ÉTAPE 1 : IDENTIFICATION DU MATRICULE */}
              {recoveryStep === 1 && (
                <form onSubmit={handleLookupMatriculeSubmit} className="space-y-4">
                  <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-200">
                    <span className="font-bold flex items-center space-x-1 mb-1 text-amber-300">
                      <ShieldCheck className="w-4 h-4 text-amber-400 inline" />
                      <span>Protection Anti-Usurpation CROU-K</span>
                    </span>
                    Pour protéger vos tickets et soldes de cantine, la réinitialisation requiert la preuve de propriété du compte étudiant.
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Numéro de Matricule Étudiant *
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={forgotMatricule}
                        onChange={(e) => setForgotMatricule(e.target.value.toUpperCase())}
                        placeholder="Ex: UPGC-2026-0842 ou 32165498"
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono tracking-wider uppercase transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-loading={isLoading ? "true" : undefined}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isLoading ? 'Recherche...' : 'Vérifier l\'existence du compte'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                    className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}

              {/* ÉTAPE 2 : VÉRIFICATION D'IDENTITÉ ANTI-USURPATION */}
              {recoveryStep === 2 && recoveryAccount && (
                <form onSubmit={handleVerifyIdentitySubmit} className="space-y-4">
                  {/* Fiche d'identité masquée */}
                  <div className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-2xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center space-x-1">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Compte Détecté : {recoveryAccount.matricule}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md">Vérifié</span>
                    </div>
                    <div className="text-slate-300">
                      Titulaire : <strong className="text-white font-mono">{recoveryAccount.maskedName}</strong>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      UFR : {recoveryAccount.campus || 'Université Peleforo Gbon Coulibaly'}
                    </div>
                    {recoveryAccount.hasPhone && (
                      <div className="text-slate-400 text-[11px]">
                        Téléphone lié : <span className="font-mono text-amber-300">{recoveryAccount.maskedPhone}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    Pour attester que vous êtes le vrai titulaire de ce compte :
                  </p>

                  {/* Champ Téléphone si présent sur le compte */}
                  {recoveryAccount.hasPhone ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Confirmez votre numéro de téléphone Wave / Mobile *
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          value={verifyPhone}
                          onChange={(e) => setVerifyPhone(e.target.value)}
                          placeholder="Ex: 07 08 12 34 56 ou 05 01 ..."
                          className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono tracking-wider transition-all"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Confirmez votre Nom complet tel qu'enregistré *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            value={verifyName}
                            onChange={(e) => setVerifyName(e.target.value)}
                            placeholder="Votre nom complet pour valider l'accès"
                            className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Votre numéro de mobile / Wave (Pour sécuriser votre compte) *
                        </label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                          <input
                            type="tel"
                            value={verifyPhone}
                            onChange={(e) => setVerifyPhone(e.target.value)}
                            placeholder="Ex: 07 08 12 34 56"
                            className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-all"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Code de Sécurité Temporaire CROU-K à 6 chiffres */}
                  <div className="p-3.5 bg-gradient-to-br from-amber-950/50 to-orange-950/40 border border-amber-500/40 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                      <span className="flex items-center space-x-1.5">
                        <Hash className="w-4 h-4 text-amber-400" />
                        <span>Code de Validation Sécurisé CROU-K</span>
                      </span>
                      <span className="text-base font-black font-mono tracking-widest px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg">
                        {generatedSecurityCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Saisissez ce code de sécurité à 6 chiffres pour valider la session en cours :
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={securityCodeInput}
                      onChange={(e) => setSecurityCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full py-2.5 px-4 bg-black/70 border border-amber-400/40 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                  >
                    <span>Valider mon Identité & Continuer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRecoveryStep(1); setErrorMsg(null); }}
                    className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Changer de matricule
                  </button>
                </form>
              )}

              {/* ÉTAPE 3 : CRÉATION DU NOUVEAU MOT DE PASSE */}
              {recoveryStep === 3 && recoveryAccount && (
                <form onSubmit={handleFinalPasswordResetSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <strong className="block text-emerald-300 font-bold">Identité confirmée avec succès !</strong>
                      Titulaire authentifié : {recoveryAccount.rawDisplayName}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Nouveau Mot de Passe *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        placeholder="Au moins 4 caractères (6+ recommandé)"
                        className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Jauge de force du mot de passe */}
                    {forgotNewPass.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2 text-[11px]">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full transition-all ${
                              forgotNewPass.length < 4 ? 'w-1/3 bg-red-500' :
                              forgotNewPass.length < 6 ? 'w-2/3 bg-amber-500' : 'w-full bg-emerald-500'
                            }`}
                          />
                        </div>
                        <span className={
                          forgotNewPass.length < 4 ? 'text-red-400 font-bold' :
                          forgotNewPass.length < 6 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'
                        }>
                          {forgotNewPass.length < 4 ? 'Trop court' : forgotNewPass.length < 6 ? 'Moyen' : 'Sécurisé'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Confirmer le Nouveau Mot de Passe *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        placeholder="Répétez votre mot de passe"
                        className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-loading={isLoading ? "true" : undefined}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isLoading ? 'Sécurisation...' : 'Enregistrer & Se Connecter'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRecoveryStep(2); setErrorMsg(null); }}
                    className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Étape précédente
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: INSCRIPTION SIMPLE ÉTUDIANT (Matricule + Mot de passe + Nom) */}
          {activeTab === 'register' && (
            <form onSubmit={handleStudentRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Numéro de matricule *
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
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nom et prénom(s) *
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
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Numéro de téléphone mobile (Wave)</span>
                  <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 bg-amber-500/20 rounded">Recommandé</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Ex: 07 08 12 34 56 (Protège vos tickets)"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
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
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Créer un mot de passe *
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

              <button
                type="submit"
                disabled={isLoading}
                data-loading={isLoading ? "true" : undefined}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Création...' : 'Créer mon compte'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: CONNEXION ADMINISTRATION */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-slate-800/60 border border-amber-500/30 rounded-2xl flex items-center space-x-2 text-xs text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Espace réservé à la Direction et aux contrôleurs du CROU.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Identifiant administrateur
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="Identifiant administrateur"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Mot de passe administrateur
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••"
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
                data-loading={isLoading ? "true" : undefined}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-sm rounded-2xl border border-amber-500/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Connexion...' : 'Connexion administration'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick guest preview link if needed */}
          {onGuestAccess && (
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-center">
              <button
                type="button"
                onClick={onGuestAccess}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-amber-300 hover:text-white transition-all inline-flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-98"
              >
                <span>🍽️ Découvrir le Menu du Jour Sans Connexion</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-slate-400">
                Vous pouvez consulter les plats du jour librement. Connectez-vous pour acheter vos tickets repas.
              </p>
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
