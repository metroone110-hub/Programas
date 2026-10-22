import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  Ticket, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  ExternalLink,
  GraduationCap,
  Sparkles,
  Edit2,
  Check
} from 'lucide-react';
import { 
  initAuth, 
  googleSignIn, 
  sendVerificationEmail, 
  verifyOtpCode, 
  getStoredStudentProfile, 
  saveStudentProfile, 
  logoutStudent,
  type StudentProfile 
} from '../services/studentAuth';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTickets: () => void;
  validTicketsCount: number;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenTickets,
  validTicketsCount,
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStoredStudentProfile());
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [step, setStep] = useState<'login' | 'otp_pending' | 'overview'>('login');
  
  // OTP state
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [codePreview, setCodePreview] = useState<string | null>(null);

  // Edit matricule / filiere inline
  const [isEditingInfo, setIsEditingInfo] = useState<boolean>(false);
  const [editMatricule, setEditMatricule] = useState<string>('');
  const [editFiliere, setEditFiliere] = useState<string>('');

  // Sync auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        const p = getStoredStudentProfile();
        if (p) {
          setProfile(p);
          if (p.isVerified) {
            setStep('overview');
          } else {
            setStep('otp_pending');
          }
        }
      },
      () => {
        const p = getStoredStudentProfile();
        if (!p) {
          setProfile(null);
          setStep('login');
        } else if (p.isVerified) {
          setStep('overview');
        } else {
          setStep('otp_pending');
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Update step and form when modal opens
  useEffect(() => {
    if (isOpen) {
      const p = getStoredStudentProfile();
      setProfile(p);
      setOtpError(null);
      setOtpSuccessMsg(null);
      if (!p) {
        setStep('login');
      } else if (p.isVerified) {
        setStep('overview');
        setEditMatricule(p.matricule);
        setEditFiliere(p.filiere);
      } else {
        setStep('otp_pending');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setOtpError(null);
    try {
      const res = await googleSignIn();
      const p = getStoredStudentProfile();
      setProfile(p);

      if (p?.isVerified) {
        setStep('overview');
      } else {
        // Send OTP email immediately
        setStep('otp_pending');
        setIsSendingOtp(true);
        const emailRes = await sendVerificationEmail(
          res.user.email || '',
          res.user.displayName || 'Étudiant'
        );
        setIsSendingOtp(false);
        if (emailRes.success) {
          setOtpSuccessMsg('Code de validation envoyé à votre adresse Gmail !');
          if (emailRes.codePreview) {
            setCodePreview(emailRes.codePreview);
          }
        } else {
          setOtpError(emailRes.error || 'Erreur lors de l\'envoi du code Gmail.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setOtpError(err.message || 'La connexion Google a été annulée.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!profile?.email) return;
    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccessMsg(null);
    const res = await sendVerificationEmail(profile.email, profile.displayName);
    setIsSendingOtp(false);
    if (res.success) {
      setOtpSuccessMsg('Nouveau code envoyé dans votre boîte Gmail !');
      if (res.codePreview) {
        setCodePreview(res.codePreview);
      }
    } else {
      setOtpError(res.error || 'Impossible d\'envoyer le code.');
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = () => {
    setOtpError(null);
    const res = verifyOtpCode(otpCode);
    if (res.success) {
      const p = getStoredStudentProfile();
      setProfile(p);
      setStep('overview');
      if (p) {
        setEditMatricule(p.matricule);
        setEditFiliere(p.filiere);
      }
    } else {
      setOtpError(res.error || 'Code invalide.');
    }
  };

  // Handle Save Info
  const handleSaveInfo = () => {
    if (!profile) return;
    const updated = saveStudentProfile({
      matricule: editMatricule.trim() || profile.matricule,
      filiere: editFiliere.trim() || profile.filiere,
    });
    setProfile(updated);
    setIsEditingInfo(false);
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutStudent();
    setProfile(null);
    setStep('login');
    setOtpCode('');
    setCodePreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                Compte Étudiant UPGC
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Resto U Korhogo • CROU-K
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto">
          {/* STEP 1: LOGIN */}
          {step === 'login' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4 shadow-xs">
                <User className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-1">
                Connexion Étudiant UPGC
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
                Connectez-vous avec votre compte Google pour enregistrer votre profil étudiant et recevoir vos codes de validation repas par Gmail.
              </p>

              {otpError && (
                <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{otpError}</p>
                </div>
              )}

              {/* Official Google Sign-In Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl text-slate-700 text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                )}
                <span>Continuer avec Google</span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Authentification officielle Google OAuth & CROU-K</span>
              </div>
            </div>
          )}

          {/* STEP 2: OTP PENDING */}
          {step === 'otp_pending' && (
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                <Mail className="w-7 h-7" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-1">
                Vérification du compte
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mb-3">
                Un code à 6 chiffres a été envoyé par e-mail à :
              </p>
              <div className="inline-block bg-slate-100 text-slate-800 text-xs font-mono font-bold px-3 py-1 rounded-full mb-4 border border-slate-200">
                {profile?.email}
              </div>

              {otpSuccessMsg && (
                <div className="w-full mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">{otpSuccessMsg}</p>
                </div>
              )}

              {otpError && (
                <div className="w-full mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-left flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{otpError}</p>
                </div>
              )}

              {/* Code Preview helper if sent */}
              {codePreview && (
                <div className="w-full mb-4 p-2 bg-orange-50 border border-orange-200 rounded-xl text-center">
                  <span className="text-[10px] text-orange-700 font-bold block mb-0.5">
                    Code reçu dans votre Gmail :
                  </span>
                  <span className="text-base font-mono font-black text-orange-900 tracking-widest">
                    {codePreview}
                  </span>
                </div>
              )}

              {/* OTP Code Input */}
              <div className="w-full mb-4">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Saisissez le code à 6 chiffres
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 849201"
                  className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-900"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otpCode.trim().length !== 6}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-40"
              >
                Valider mon compte étudiant
              </button>

              <div className="flex items-center justify-between w-full mt-4 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                  className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  <span>Renvoyer le code</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                >
                  Changer de compte
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OVERVIEW (CLEAN STUDENT PROFILE) */}
          {step === 'overview' && profile && (
            <div className="space-y-4">
              {/* Identity Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl" />
                
                <div className="flex items-center gap-3.5 relative z-10">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.displayName}
                      className="w-14 h-14 rounded-full border-2 border-white/20 shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-500 border-2 border-white/20 flex items-center justify-center text-white font-black text-lg shadow-md">
                      {profile.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="font-extrabold text-sm truncate text-white">
                        {profile.displayName}
                      </h4>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-300 truncate font-mono">
                      {profile.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Vérifié Gmail ✅
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Info Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Informations Universitaires UPGC
                  </span>
                  {!isEditingInfo ? (
                    <button
                      onClick={() => setIsEditingInfo(true)}
                      className="text-xs text-orange-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modifier</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveInfo}
                      className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Enregistrer</span>
                    </button>
                  )}
                </div>

                {!isEditingInfo ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Matricule UPGC</span>
                      <span className="font-mono font-bold text-slate-800">{profile.matricule}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">UFR / Filière</span>
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">{profile.filiere}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 font-medium">Campus</span>
                      <span className="font-bold text-slate-800">Korhogo (CROU-K)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Matricule Étudiant
                      </label>
                      <input
                        type="text"
                        value={editMatricule}
                        onChange={(e) => setEditMatricule(e.target.value)}
                        placeholder="Ex: UPGC-2025-1024"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        UFR / Département
                      </label>
                      <input
                        type="text"
                        value={editFiliere}
                        onChange={(e) => setEditFiliere(e.target.value)}
                        placeholder="Ex: Sciences Sociales, Biologie..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tickets Wallet Card */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider block">
                    Portefeuille Repas
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900">
                      {validTicketsCount}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      ticket(s) actif(s)
                    </span>
                  </div>
                  <span className="text-[11px] text-orange-800 font-medium">
                    200 FCFA / plat chaud complet
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenTickets();
                  }}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Mes tickets</span>
                </button>
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
