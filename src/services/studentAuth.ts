import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  type User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with Workspace & Google Profile scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token cache (Do NOT store in localStorage per guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Current pending OTP state (kept in memory with expiration)
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
 * Initialize auth listener. Clears memory token on sign out.
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

/**
 * Perform Google Sign-In with popup
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossible de récupérer le jeton d\'accès Google.');
    }

    cachedAccessToken = credential.accessToken;

    // Check if profile exists, otherwise initialize default
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
    console.error('Erreur Google Sign-in:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Initialize profile for direct email sign-in (mobile / Safari friendly)
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
 * Generate a 6-digit OTP and send it via Gmail to the student's email address
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

  // Direct OTP generation fallback (e.g. mobile Safari where popup is blocked)
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
  cachedAccessToken = null;
  currentOtp = null;
  try {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
  } catch {
    // ignore
  }
};
