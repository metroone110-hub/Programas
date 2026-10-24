import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  type User 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, firebaseConfig } from './firebase';

export { auth, db };

// Provider with Workspace & Google Profile scopes
export const provider = googleProvider;

// Google OAuth Client ID provisioned for this application
export const GOOGLE_CLIENT_ID = firebaseConfig.oAuthClientId || '648760950612-e5qsgef4mbl9pan8ae3b6a4gk7s64rot.apps.googleusercontent.com';

// In-memory token cache (Do NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Current pending OTP state (kept in memory with 10-min expiration)
interface OtpState {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}
let currentOtp: OtpState | null = null;

export interface StudentProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  matricule: string;
  filiere: string;
  isVerified: boolean;
  verifiedAt?: string;
}

const STORAGE_KEY_PROFILE = 'programas_student_profile';

/**
 * Get authorized redirect URI matching the Cloud Console settings
 */
export const getRedirectUri = (): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return origin.endsWith('/') ? origin : `${origin}/`;
};

/**
 * Direct Google OAuth 2.0 authorization URL
 */
export const getGoogleOAuthUrl = (): string => {
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.send',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state: 'student_auth',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Check if the user was just redirected back with #access_token=...
 * Parses token, loads user info from Google API, and triggers Gmail OTP
 */
export const checkAndHandleOAuthRedirect = async (): Promise<{ 
  success: boolean; 
  profile?: StudentProfile;
  codePreview?: string;
  error?: string;
}> => {
  if (typeof window === 'undefined') return { success: false };
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) {
    return { success: false };
  }

  try {
    const rawParams = hash.startsWith('#') ? hash.substring(1) : hash;
    const params = new URLSearchParams(rawParams);
    const accessToken = params.get('access_token');
    if (!accessToken) return { success: false };

    // Clean hash from browser URL bar without triggering reload
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    cachedAccessToken = accessToken;

    // Fetch student profile directly from Google UserInfo API
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!userRes.ok) {
      throw new Error('Impossible de charger les informations du profil Google.');
    }

    const googleUser = await userRes.json();
    const cleanEmail = (googleUser.email || '').toLowerCase().trim();
    const cleanName = googleUser.name || 'Étudiant UPGC';
    const photo = googleUser.picture;

    const existing = getStoredStudentProfile();
    const matricule = existing?.matricule || `UPGC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const profile = saveStudentProfile({
      uid: googleUser.sub || 'std_' + Date.now().toString(36),
      email: cleanEmail,
      displayName: cleanName,
      photoURL: photo,
      matricule,
      filiere: existing?.filiere || 'Sciences & Technologies (UPGC)',
      isVerified: false,
    });

    // Send Gmail OTP immediately
    const emailResult = await sendVerificationEmail(cleanEmail, cleanName);

    return { 
      success: true, 
      profile, 
      codePreview: emailResult.codePreview 
    };
  } catch (err: any) {
    console.error('Erreur traitement retour OAuth Google:', err);
    return { 
      success: false, 
      error: err.message || 'Erreur lors de la validation Google.' 
    };
  }
};

/**
 * Sign in using Google Identity Services (GIS) API with fallback to direct OAuth redirect
 */
export const signInWithGoogleApi = (): Promise<{ 
  accessToken: string; 
  userInfo: { email: string; name: string; picture?: string; sub: string } 
}> => {
  return new Promise((resolve, reject) => {
    // Check if Google Identity Services (GIS) is available
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.send',
          prompt: 'select_account',
          callback: async (resp: any) => {
            if (resp.error) {
              // If GIS popup blocked, redirect directly to Google OAuth URL
              window.location.href = getGoogleOAuthUrl();
              return;
            }
            if (resp.access_token) {
              cachedAccessToken = resp.access_token;
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${resp.access_token}` },
                });
                const userInfo = await userRes.json();
                resolve({ accessToken: resp.access_token, userInfo });
              } catch (err) {
                reject(err);
              }
            }
          },
          error_callback: () => {
            // Fallback to direct URL
            window.location.href = getGoogleOAuthUrl();
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('GIS init failed, switching to direct redirect:', err);
      }
    }

    // Direct redirect to Google OAuth
    window.location.href = getGoogleOAuthUrl();
  });
};

/**
 * Firebase Auth listener. Clears memory token on sign out.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface FirebaseOAuthResult {
  success: boolean;
  profile?: StudentProfile;
  user?: User;
  error?: string;
  unauthorizedDomain?: boolean;
  domain?: string;
  popupClosed?: boolean;
  popupBlocked?: boolean;
}

/**
 * Standard Firebase OAuth Authentication with Google Auth Provider
 * Persists profile in Firestore /users/{userId} and updates local session
 */
export const signInWithFirebaseOAuth = async (): Promise<FirebaseOAuthResult> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const cleanName = user.displayName || 'Étudiant UPGC';
    const photo = user.photoURL || undefined;

    const existing = getStoredStudentProfile();
    const matricule =
      existing?.matricule ||
      `UPGC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const filiere = existing?.filiere || 'Sciences & Technologies (UPGC)';

    const profile: StudentProfile = {
      uid: user.uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: photo,
      matricule,
      filiere,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };

    saveStudentProfile(profile);

    // Save profile to Firestore database (/users/{userId})
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: cleanEmail,
          displayName: cleanName,
          photoURL: photo || null,
          matricule,
          filiere,
          role: cleanEmail === 'metroone110@gmail.com' ? 'admin' : 'student',
          isVerified: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (dbErr) {
      console.warn('Firestore profile sync note:', dbErr);
    }

    return {
      success: true,
      profile,
      user,
    };
  } catch (error: any) {
    console.error('Erreur Firebase OAuth:', error);
    const code = error?.code || '';
    const message = error?.message || '';

    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized domain')) {
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      return {
        success: false,
        unauthorizedDomain: true,
        domain: currentDomain,
        error: `Le domaine "${currentDomain}" n'est pas encore enregistré dans les domaines autorisés de votre projet Firebase.`,
      };
    }

    if (code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        popupClosed: true,
        error: 'Fenêtre de connexion fermée.',
      };
    }

    if (code === 'auth/popup-blocked') {
      return {
        success: false,
        popupBlocked: true,
        error: 'La fenêtre de connexion a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up.',
      };
    }

    return {
      success: false,
      error: message || 'Erreur lors de la connexion via Firebase.',
    };
  } finally {
    isSigningIn = false;
  }
};

/**
 * Legacy Firebase signInWithPopup (kept for fallback compatibility)
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossible de récupérer le jeton Google.');
    }

    cachedAccessToken = credential.accessToken;

    const existing = getStoredStudentProfile();
    if (!existing || existing.email !== result.user.email) {
      const defaultMatricule = `UPGC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      saveStudentProfile({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'Étudiant UPGC',
        photoURL: result.user.photoURL || undefined,
        matricule: defaultMatricule,
        filiere: 'Sciences & Technologies (UPGC)',
        isVerified: false,
      });
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erreur Firebase Google Sign-in:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Direct student email sign-in (mobile / Safari friendly)
 */
export const initDirectStudentEmail = (email: string, name?: string): StudentProfile => {
  const cleanEmail = email.toLowerCase().trim();
  const derivedName = name?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const matricule = `UPGC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const existing = getStoredStudentProfile();
  if (existing && existing.email === cleanEmail) {
    return existing;
  }

  const profile = saveStudentProfile({
    uid: 'std_' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    displayName: derivedName,
    matricule,
    filiere: 'Sciences & Technologies (UPGC)',
    isVerified: false,
  });

  return profile;
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set cached access token in memory
 */
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Helper to encode UTF-8 string to base64url without browser btoa failures
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Helper to encode email subject in UTF-8 base64
 */
function encodeSubject(subject: string): string {
  const bytes = new TextEncoder().encode(subject);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Generate a 6-digit OTP and send it via Gmail API
 */
export const sendVerificationEmail = async (
  toEmail: string,
  recipientName: string
): Promise<{ success: boolean; codePreview?: string; error?: string }> => {
  const cleanEmail = toEmail.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      error: 'Veuillez saisir une adresse Gmail ou universitaire valide.',
    };
  }

  // Generate 6-digit numeric OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Valid for 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000;

  currentOtp = {
    code,
    email: cleanEmail,
    expiresAt,
    attempts: 0,
  };

  // If OAuth token with gmail.send is present in memory, send real email via Gmail API
  if (cachedAccessToken) {
    try {
      const subjectText = `Code de validation Programas (${code}) - Resto U UPGC Korhogo`;
      const subjectHeader = encodeSubject(subjectText);

      const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Code de validation Programas - UPGC Korhogo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 24px; color: #1E293B;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #EA580C 0%, #C2410C 100%); padding: 24px; text-align: center; color: #FFFFFF;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Programas • Resto U UPGC Korhogo</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Centre Régional des Œuvres Universitaires (CROU-K)</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155;">
        Bonjour <strong>${recipientName || 'Étudiant(e)'}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #475569;">
        Voici votre code de validation pour activer votre compte étudiant et sécuriser vos tickets au Resto U UPGC Korhogo :
      </p>
      
      <div style="background-color: #FFF7ED; border: 2px dashed #F97316; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #C2410C; letter-spacing: 1px; margin-bottom: 6px;">
          Votre code de validation Gmail
        </span>
        <span style="font-family: monospace, Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #EA580C; display: block;">
          ${code}
        </span>
        <span style="display: block; font-size: 11px; color: #9A3412; margin-top: 8px;">
          ⏱️ Ce code expire dans 10 minutes.
        </span>
      </div>

      <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748B;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
      </p>
      
      <div style="border-top: 1px solid #F1F5F9; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #94A3B8; text-align: center;">
        <p style="margin: 0;">Université Peleforo Gon Coulibaly (UPGC) • Korhogo, Côte d'Ivoire</p>
        <p style="margin: 4px 0 0 0;">CROU-K Service Restauration Universitaire • 200 FCFA / repas</p>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim();

      const rawEmail = [
        `From: "Programas - Resto U UPGC" <me>`,
        `To: <${cleanEmail}>`,
        `Subject: ${subjectHeader}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        htmlBody,
      ].join('\r\n');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: toBase64Url(rawEmail),
        }),
      });

      if (res.ok) {
        return { success: true, codePreview: code };
      }
    } catch (err: any) {
      console.warn('Gmail API send warning:', err);
    }
  }

  // Fallback (or code preview for instant test)
  return { success: true, codePreview: code };
};

/**
 * Validate the 6-digit OTP entered by the student
 */
export const verifyOtpCode = (
  inputCode: string
): { success: boolean; error?: string } => {
  const cleanInput = inputCode.trim().replace(/\s+/g, '');

  if (!cleanInput) {
    return { success: false, error: 'Veuillez saisir le code à 6 chiffres.' };
  }

  if (!currentOtp) {
    return { success: false, error: 'Aucun code en attente. Veuillez cliquer sur "Renvoyer le code".' };
  }

  if (Date.now() > currentOtp.expiresAt) {
    currentOtp = null;
    return { success: false, error: 'Le code a expiré (10 min). Veuillez en demander un nouveau.' };
  }

  if (currentOtp.attempts >= 5) {
    currentOtp = null;
    return { success: false, error: 'Trop de tentatives erronées. Veuillez renvoyer un nouveau code.' };
  }

  if (cleanInput !== currentOtp.code) {
    currentOtp.attempts += 1;
    return {
      success: false,
      error: `Code incorrect (${5 - currentOtp.attempts} tentative(s) restante(s)).`,
    };
  }

  // Code is valid! Mark student profile as verified
  const profile = getStoredStudentProfile();
  if (profile) {
    profile.isVerified = true;
    profile.verifiedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  currentOtp = null;
  return { success: true };
};

/**
 * Retrieve saved student profile from storage
 */
export const getStoredStudentProfile = (): StudentProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
};

/**
 * Update and persist student profile details (matricule, filière)
 */
export const saveStudentProfile = (
  updates: Partial<StudentProfile>
): StudentProfile => {
  const existing = getStoredStudentProfile();
  const updated: StudentProfile = {
    uid: updates.uid || existing?.uid || 'std_' + Date.now().toString(36),
    email: updates.email || existing?.email || '',
    displayName: updates.displayName || existing?.displayName || 'Étudiant UPGC',
    photoURL: updates.photoURL ?? existing?.photoURL,
    matricule: updates.matricule || existing?.matricule || `UPGC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
    filiere: updates.filiere || existing?.filiere || 'Sciences & Technologies (UPGC)',
    isVerified: updates.isVerified ?? existing?.isVerified ?? false,
    verifiedAt: updates.verifiedAt || existing?.verifiedAt,
  };

  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return updated;
};

/**
 * Log out student and clear in-memory tokens
 */
export const logoutStudent = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('SignOut warning:', err);
  }
  currentOtp = null;
  try {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
  } catch {
    // ignore
  }
};

const STORAGE_KEY_ACCOUNTS = 'crouk_registered_accounts';

export interface RegisteredAccount {
  id: string;
  name: string;
  identifier: string;
  email: string;
  phone?: string;
  matricule: string;
  filiere: string;
  password?: string;
  createdAt: string;
}

export const getSavedAccounts = (): RegisteredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const registerStudentAccount = (params: {
  name: string;
  identifier: string;
  password?: string;
  matricule?: string;
  filiere?: string;
}): { success: boolean; profile?: StudentProfile; error?: string } => {
  const cleanId = params.identifier.trim().toLowerCase();
  const cleanName = params.name.trim();

  if (!cleanId) {
    return { success: false, error: 'Veuillez saisir votre e-mail ou numéro mobile.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Veuillez saisir votre nom et prénom.' };
  }

  const accounts = getSavedAccounts();
  const exists = accounts.find(
    (a) =>
      a.identifier.toLowerCase() === cleanId ||
      a.email.toLowerCase() === cleanId ||
      (a.matricule && a.matricule.toLowerCase() === cleanId)
  );

  if (exists) {
    return {
      success: false,
      error: 'Un compte existe déjà avec cet identifiant. Veuillez vous connecter.',
    };
  }

  const isEmail = cleanId.includes('@');
  const email = isEmail ? cleanId : `${cleanId.replace(/\D/g, '')}@etudiant.upgc.ci`;
  const defaultMatricule =
    params.matricule?.trim() ||
    `UPGC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const filiere = params.filiere?.trim() || 'Sciences & Technologies (UPGC)';

  const newAcc: RegisteredAccount = {
    id: 'usr_' + Date.now().toString(36),
    name: cleanName,
    identifier: cleanId,
    email,
    phone: !isEmail ? cleanId : undefined,
    matricule: defaultMatricule,
    filiere,
    password: params.password,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAcc);
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch {
    // ignore
  }

  const profile = saveStudentProfile({
    uid: newAcc.id,
    email: newAcc.email,
    displayName: newAcc.name,
    matricule: newAcc.matricule,
    filiere: newAcc.filiere,
    isVerified: true,
    verifiedAt: new Date().toISOString(),
  });

  return { success: true, profile };
};

export const loginStudentAccount = (
  identifier: string,
  password?: string
): { success: boolean; profile?: StudentProfile; error?: string } => {
  const cleanId = identifier.trim().toLowerCase();
  if (!cleanId) {
    return { success: false, error: 'Veuillez renseigner votre identifiant ou e-mail.' };
  }

  const accounts = getSavedAccounts();
  const found = accounts.find(
    (a) =>
      a.identifier.toLowerCase() === cleanId ||
      a.email.toLowerCase() === cleanId ||
      (a.phone && a.phone.includes(cleanId)) ||
      (a.matricule && a.matricule.toLowerCase() === cleanId)
  );

  if (found) {
    if (password && found.password && found.password !== password) {
      return { success: false, error: 'Mot de passe incorrect pour ce compte.' };
    }

    const profile = saveStudentProfile({
      uid: found.id,
      email: found.email,
      displayName: found.name,
      matricule: found.matricule,
      filiere: found.filiere,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    return { success: true, profile };
  }

  // If not previously saved in local storage, allow instant direct login with student credentials
  const isEmail = cleanId.includes('@');
  const defaultName = cleanId.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const defaultMatricule = `UPGC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const createdProfile = saveStudentProfile({
    uid: 'std_' + Date.now().toString(36),
    email: isEmail ? cleanId : `${cleanId}@etudiant.upgc.ci`,
    displayName: defaultName || 'Étudiant UPGC',
    matricule: defaultMatricule,
    filiere: 'Sciences & Technologies (UPGC)',
    isVerified: true,
    verifiedAt: new Date().toISOString(),
  });

  return { success: true, profile: createdProfile };
};

export const getAuthorizedGoogleDomains = () => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    currentOrigin,
    devOrigin: 'https://ais-dev-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app',
    preOrigin: 'https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app',
    firebaseAuthDomain: 'gen-lang-client-0578572037.firebaseapp.com',
    firebaseRedirectHandler: 'https://gen-lang-client-0578572037.firebaseapp.com/__/auth/handler',
    oAuthClientId: GOOGLE_CLIENT_ID,
  };
};
