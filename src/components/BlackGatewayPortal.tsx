import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  KeyRound,
  UserPlus,
  GraduationCap,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Mail,
  RefreshCw
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  registerStudentWithMatricule,
  loginStudentWithMatricule,
  registerStudentWithEmail,
  loginStudentWithEmail,
  loginAdminDirect
} from '../services/studentAuth';
import {
  resendSupabaseConfirmationEmail,
  sendSupabasePasswordReset
} from '../services/supabaseClient';
import { UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';

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
  const [authMethod, setAuthMethod] = useState<'matricule' | 'email'>('email');

  const [loginMatricule, setLoginMatricule] = useState(() => {
    try {
      return localStorage.getItem('crou_remembered_matricule') || '';
    } catch {
      return '';
    }
  });
  const [loginEmail, setLoginEmail] = useState(() => {
    try {
      return localStorage.getItem('crou_remembered_email') || '';
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

  useEffect(() => {
    const clearCreds = () => {
      setLoginMatricule('');
      setLoginEmail('');
      setLoginPassword('');
    };
    window.addEventListener('crou:clear-remembered-creds', clearCreds);
    return () => window.removeEventListener('crou:clear-remembered-creds', clearCreds);
  }, []);

  useEffect(() => {
    if (isOpen) {
      try {
        setLoginMatricule(localStorage.getItem('crou_remembered_matricule') || '');
        setLoginEmail(localStorage.getItem('crou_remembered_email') || '');
        setLoginPassword(localStorage.getItem('crou_remembered_password') || '');
      } catch {}
    }
  }, [isOpen]);

  const [regMatricule, setRegMatricule] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUfr, setRegUfr] = useState('UFR Sciences Sociales');

  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);
    setPendingConfirmationEmail(null);
    setIsLoading(true);
    try {
      if (authMethod === 'email') {
        const res = await loginStudentWithEmail(loginEmail, loginPassword);
        if (res.success && res.user) {
          if (rememberMe) {
            try {
              localStorage.setItem('crou_remembered_email', loginEmail.trim().toLowerCase());
            } catch {}
          } else {
            try {
              localStorage.removeItem('crou_remembered_email');
            } catch {}
          }
          triggerHaptic('success');
          onSuccess(res.user);
        } else {
          triggerHaptic('error');
          if (res.needsEmailConfirmation) {
            setPendingConfirmationEmail(loginEmail.trim().toLowerCase());
          }
          setErrorMsg(res.error || 'E-mail ou mot de passe incorrect.');
        }
        return;
      }

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
        triggerHaptic('success');
        onSuccess(res.user);
      } else {
        triggerHaptic('error');
        setErrorMsg(res.error || 'Matricule ou mot de passe incorrect.');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);
    setPendingConfirmationEmail(null);
    setIsLoading(true);
    try {
      if (authMethod === 'email') {
        const res = await registerStudentWithEmail({
          email: regEmail,
          password: regPassword,
          name: regName,
          matricule: regMatricule || undefined,
          ufr: regUfr
        });
        if (res.success) {
          try {
            localStorage.setItem('crou_remembered_email', regEmail.trim().toLowerCase());
            setLoginEmail(regEmail.trim().toLowerCase());
          } catch {}
          triggerHaptic('success');

          if (res.needsEmailConfirmation || !res.user) {
            const targetEmail = res.email || regEmail.trim().toLowerCase();
            setPendingConfirmationEmail(targetEmail);
            setSuccessNotice(
              `Un e-mail de confirmation vient d'être envoyé à ${targetEmail}. Cliquez sur le lien reçu pour activer votre compte.`
            );
          } else {
            setSuccessNotice('Compte créé avec Supabase Auth ! Votre pass repas est activé.');
            setTimeout(() => {
              onSuccess(res.user!);
            }, 700);
          }
        } else {
          triggerHaptic('error');
          setErrorMsg(res.error || "Erreur lors de l'inscription par e-mail.");
        }
        return;
      }

      const res = await registerStudentWithMatricule({
        matricule: regMatricule,
        password: regPassword,
        name: regName,
        ufr: regUfr
      });
      if (res.success && res.user) {
        try {
          localStorage.setItem('crou_remembered_matricule', regMatricule.trim().toUpperCase());
          localStorage.setItem('crou_remembered_password', regPassword);
        } catch {}
        triggerHaptic('success');
        setSuccessNotice('Compte étudiant créé ! Votre pass repas est activé.');
        setTimeout(() => {
          onSuccess(res.user!);
        }, 700);
      } else {
        triggerHaptic('error');
        setErrorMsg(res.error || "Erreur lors de l'inscription.");
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err.message || 'Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    try {
      const res = await resendSupabaseConfirmationEmail(pendingConfirmationEmail);
      if (res.success) {
        triggerHaptic('success');
        setSuccessNotice(`E-mail de confirmation renvoyé à ${pendingConfirmationEmail}.`);
      } else {
        triggerHaptic('error');
        setErrorMsg(res.error || "Impossible de renvoyer l'e-mail.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du renvoi de l'e-mail.");
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = loginEmail.trim().toLowerCase();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setErrorMsg('Saisissez d’abord votre adresse e-mail ci-dessus pour recevoir le lien de réinitialisation.');
      return;
    }
    setErrorMsg(null);
    setSuccessNotice(null);
    setIsLoading(true);
    try {
      const res = await sendSupabasePasswordReset(targetEmail);
      if (res.success) {
        triggerHaptic('success');
        setSuccessNotice(`Un lien de réinitialisation de mot de passe a été envoyé à ${targetEmail}.`);
      } else {
        triggerHaptic('error');
        setErrorMsg(res.error || 'Impossible d’envoyer le lien de réinitialisation.');
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
    setSuccessNotice(null);
    setIsLoading(true);
    try {
      const res = await loginAdminDirect(adminUser, adminPass);
      if (res.success && res.user) {
        triggerHaptic('success');
        onSuccess(res.user);
      } else {
        triggerHaptic('error');
        setErrorMsg(res.error || 'Identifiants administrateur invalides.');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[var(--ios-bg)] text-[var(--ios-fg)] flex flex-col justify-between overflow-y-auto select-none"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
        >
          {/* Top Bar */}
          <header className="w-full max-w-lg mx-auto px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-[14px] overflow-hidden shadow-sm border border-[var(--ios-border)] flex-shrink-0">
                <img src="/icon.svg" alt="Programas" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <span className="block text-[17px] font-extrabold tracking-tight truncate">
                  Programas · CROU Korhogo
                </span>
                <span className="block text-[13px] text-[var(--ios-fg-secondary)] truncate">
                  Tarif étudiant · 200 FCFA / repas
                </span>
              </div>
            </div>
            {onGuestAccess && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onGuestAccess();
                }}
                aria-label="Fermer et explorer le menu"
                className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-surface)] border border-[var(--ios-border)] text-[var(--ios-fg)] flex items-center justify-center flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </header>

          {/* Main Auth Card */}
          <main className="w-full max-w-lg mx-auto px-5 py-4 flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="ios-card p-6 sm:p-7 shadow-xl space-y-5"
            >
              <div>
                <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-tight">
                  {activeTab === 'login' && 'Connexion'}
                  {activeTab === 'register' && 'Inscription'}
                  {activeTab === 'admin' && 'Administration'}
                </h1>
                <p className="text-[15px] text-[var(--ios-fg-secondary)] mt-1">
                  {activeTab === 'login' && 'Accédez à votre pass repas UPGC'}
                  {activeTab === 'register' && 'Créez votre compte étudiant CROU'}
                  {activeTab === 'admin' && 'Espace direction et contrôleurs'}
                </p>
              </div>

              {/* iOS Segmented Control */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--ios-bg)] rounded-[16px] border border-[var(--ios-border)]">
                {[
                  { id: 'login', label: 'Connexion', icon: User },
                  { id: 'register', label: 'Inscription', icon: UserPlus },
                  { id: 'admin', label: 'Admin', icon: ShieldCheck }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveTab(tab.id as any);
                        setErrorMsg(null);
                        setSuccessNotice(null);
                        setPendingConfirmationEmail(null);
                      }}
                      className={`ios-btn-spring min-h-[42px] px-2 rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-1.5 ${
                        active
                          ? 'bg-[var(--ios-surface)] text-[#ea580c] shadow-sm'
                          : 'text-[var(--ios-fg-secondary)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Auth Method Sub-Switch (E-mail Supabase vs Matricule UPGC) */}
              {(activeTab === 'login' || activeTab === 'register') && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--ios-bg)] rounded-[14px] border border-[var(--ios-border)]">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setAuthMethod('email');
                      setErrorMsg(null);
                    }}
                    className={`ios-btn-spring min-h-[38px] px-3 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 ${
                      authMethod === 'email'
                        ? 'bg-[#ea580c] text-white shadow-sm'
                        : 'text-[var(--ios-fg-secondary)]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Par E-mail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setAuthMethod('matricule');
                      setErrorMsg(null);
                    }}
                    className={`ios-btn-spring min-h-[38px] px-3 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 ${
                      authMethod === 'matricule'
                        ? 'bg-[#ea580c] text-white shadow-sm'
                        : 'text-[var(--ios-fg-secondary)]'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Par Matricule</span>
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-[16px] space-y-2 text-[14px] text-red-600 dark:text-red-400">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                  {pendingConfirmationEmail && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold underline underline-offset-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                      <span>{isResending ? 'Envoi...' : "Renvoyer l'e-mail de confirmation"}</span>
                    </button>
                  )}
                </div>
              )}

              {successNotice && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-[16px] space-y-2.5 text-[14px] text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{successNotice}</span>
                  </div>
                  {pendingConfirmationEmail && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={isResending}
                        className="px-3 py-1.5 rounded-[10px] bg-emerald-600 text-white text-[12px] font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                        <span>{isResending ? 'Envoi...' : "Renvoyer l'e-mail"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('login');
                          setAuthMethod('email');
                          setSuccessNotice(null);
                          setErrorMsg(null);
                        }}
                        className="px-3 py-1.5 rounded-[10px] border border-emerald-600/30 text-[12px] font-bold"
                      >
                        J'ai confirmé · Se connecter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: CONNEXION ÉTUDIANT */}
              {activeTab === 'login' && (
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  {authMethod === 'email' ? (
                    <div>
                      <label className="block text-[14px] font-semibold text-[var(--ios-fg)] mb-1.5">
                        Adresse e-mail
                      </label>
                      <div className="relative">
                        <Mail className="w-5 h-5 text-[#ea580c] absolute left-4 top-4" />
                        <input
                          type="email"
                          name="email"
                          autoComplete="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="etudiant@exemple.com"
                          className="w-full min-h-[54px] pl-11 pr-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] text-[var(--ios-fg)] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[14px] font-semibold text-[var(--ios-fg)] mb-1.5">
                        Numéro de matricule
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-5 h-5 text-[#ea580c] absolute left-4 top-4" />
                        <input
                          type="text"
                          name="username"
                          autoComplete="username"
                          value={loginMatricule}
                          onChange={(e) => setLoginMatricule(e.target.value.toUpperCase())}
                          placeholder="Ex : 01601834"
                          className="w-full min-h-[54px] pl-11 pr-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] font-mono uppercase tracking-wider text-[var(--ios-fg)] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[14px] font-semibold text-[var(--ios-fg)] mb-1.5">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-[#ea580c] absolute left-4 top-4" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        className="w-full min-h-[54px] pl-11 pr-12 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] text-[var(--ios-fg)] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-3 top-2.5 w-10 h-10 flex items-center justify-center text-[var(--ios-fg-secondary)]"
                      >
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-3 gap-2">
                      <label className="flex items-center gap-2 text-[14px] text-[var(--ios-fg)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-5 h-5 rounded accent-[#ea580c] cursor-pointer"
                        />
                        <span>Se souvenir</span>
                      </label>
                      {authMethod === 'email' ? (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[13px] font-semibold text-[#ea580c] hover:underline text-right"
                        >
                          Mot de passe oublié ?
                        </button>
                      ) : (
                        <span className="text-[12px] text-[var(--ios-fg-secondary)] text-right">
                          Accès gérés par l'Admin CROU
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-loading={isLoading ? 'true' : undefined}
                    className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[17px] rounded-[20px] shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Connexion...' : 'Se connecter'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}

              {/* TAB 2: INSCRIPTION ÉTUDIANT */}
              {activeTab === 'register' && (
                <form onSubmit={handleStudentRegister} className="space-y-3.5">
                  {authMethod === 'email' ? (
                    <>
                      <div>
                        <label className="block text-[14px] font-semibold mb-1.5">
                          Adresse e-mail *
                        </label>
                        <div className="relative">
                          <Mail className="w-5 h-5 text-[#ea580c] absolute left-4 top-4" />
                          <input
                            type="email"
                            autoComplete="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="etudiant@exemple.com"
                            className="w-full min-h-[54px] pl-11 pr-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[14px] font-semibold mb-1.5">
                          Nom et prénom(s) *
                        </label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Ex : Koffi Kouamé Emmanuel"
                          className="w-full min-h-[54px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[14px] font-semibold mb-1.5">
                          Numéro de matricule <span className="text-[12px] font-normal text-[var(--ios-fg-secondary)]">(optionnel)</span>
                        </label>
                        <input
                          type="text"
                          value={regMatricule}
                          onChange={(e) => setRegMatricule(e.target.value.toUpperCase())}
                          placeholder="Ex : UPGC-2026-1102"
                          className="w-full min-h-[50px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[15px] font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[14px] font-semibold mb-1.5">
                          Numéro de matricule *
                        </label>
                        <input
                          type="text"
                          value={regMatricule}
                          onChange={(e) => setRegMatricule(e.target.value.toUpperCase())}
                          placeholder="Ex : UPGC-2026-1102"
                          className="w-full min-h-[54px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[14px] font-semibold mb-1.5">
                          Nom et prénom(s) *
                        </label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Ex : Koffi Kouamé Emmanuel"
                          className="w-full min-h-[54px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[14px] font-semibold mb-1.5">
                      UFR / Faculté
                    </label>
                    <select
                      value={regUfr}
                      onChange={(e) => setRegUfr(e.target.value)}
                      className="w-full min-h-[54px] px-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                    >
                      <option value="UFR Sciences Sociales">UFR Sciences Sociales</option>
                      <option value="UFR Sciences Biologiques">UFR Sciences Biologiques</option>
                      <option value="UFR Lettres et Arts">UFR Lettres et Arts</option>
                      <option value="Institut Agro-Pastorale">Institut Agro-Pastorale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[14px] font-semibold mb-1.5">
                      Créer un mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        minLength={authMethod === 'email' ? 6 : 4}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder={authMethod === 'email' ? 'Au moins 6 caractères' : 'Au moins 4 caractères'}
                        className="w-full min-h-[54px] pl-4 pr-12 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-3 top-2.5 w-10 h-10 flex items-center justify-center text-[var(--ios-fg-secondary)]"
                      >
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-loading={isLoading ? 'true' : undefined}
                    className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[17px] rounded-[20px] shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>
                      {isLoading
                        ? 'Création...'
                        : authMethod === 'email'
                        ? "S'inscrire avec mon e-mail"
                        : 'Créer mon compte'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}

              {/* TAB 3: ADMIN */}
              {activeTab === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-[14px] font-semibold mb-1.5">
                      Identifiant administrateur
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-[#ea580c] absolute left-4 top-4" />
                      <input
                        type="text"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        placeholder="Identifiant"
                        className="w-full min-h-[54px] pl-11 pr-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] font-mono focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-semibold mb-1.5">
                      Mot de passe administrateur
                    </label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 text-[#ea580c] absolute left-4 top-4" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full min-h-[54px] pl-11 pr-12 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[18px] text-[16px] font-mono focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? 'Masquer' : 'Afficher'}
                        className="absolute right-3 top-2.5 w-10 h-10 flex items-center justify-center text-[var(--ios-fg-secondary)]"
                      >
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-loading={isLoading ? 'true' : undefined}
                    className="ios-btn-spring w-full min-h-[56px] bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] font-bold text-[17px] rounded-[20px] shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Connexion...' : 'Connexion administration'}</span>
                    <ShieldCheck className="w-5 h-5" />
                  </button>
                </form>
              )}

              {onGuestAccess && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onGuestAccess();
                  }}
                  className="ios-btn-spring w-full min-h-[48px] px-4 rounded-[16px] bg-[var(--ios-bg)] border border-[var(--ios-border)] text-[14px] font-semibold text-[var(--ios-fg)]"
                >
                  Consulter le menu sans connexion
                </button>
              )}
            </motion.div>
          </main>

          <footer className="text-center px-5 py-2 text-[12px] text-[var(--ios-fg-secondary)]">
            UPGC Korhogo · Centre Régional des Œuvres Universitaires
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
