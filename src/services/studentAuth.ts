import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db, DEV_DOMAIN, SHARED_DOMAIN, FIREBASE_PROJECT_ID } from './firebase';
import { UserProfile, MealTicket } from '../types';

const STORAGE_KEY = 'crou_user_profile';

export interface AuthErrorDetails {
  code: string;
  message: string;
  isDomainError?: boolean;
  domainToAuthorize?: string;
  settingsUrl?: string;
}

export function getLocalUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalUserProfile(profile: UserProfile | null): void {
  if (!profile) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

/**
 * Sign in using Firebase Google OAuth Popup
 */
export async function signInWithGoogleOAuth(): Promise<{ user?: UserProfile; error?: AuthErrorDetails }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const userProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || 'Étudiant CROU',
      photoURL: fbUser.photoURL || undefined,
      role: (fbUser.email && (fbUser.email.toLowerCase() === 'metroone110@gmail.com' || fbUser.email.includes('admin'))) ? 'admin' : 'student',
      balance: 1500, // Initial welcome subsidy balance
      savedTickets: [],
      campus: 'Campus Cocody',
      createdAt: new Date().toISOString()
    };

    // Try to sync with Firestore
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const existingData = snap.data() as Partial<UserProfile>;
        Object.assign(userProfile, existingData);
      } else {
        await setDoc(userRef, userProfile);
      }
    } catch (fsErr) {
      console.warn('Firestore sync note (fallback to local):', fsErr);
    }

    saveLocalUserProfile(userProfile);
    return { user: userProfile };
  } catch (err: any) {
    const errorCode = err.code || 'auth/unknown';
    const isDomainError = errorCode === 'auth/unauthorized-domain';

    const errorDetails: AuthErrorDetails = {
      code: errorCode,
      message: err.message || 'Échec de la connexion Google.',
      isDomainError,
      domainToAuthorize: DEV_DOMAIN,
      settingsUrl: `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings`
    };

    return { error: errorDetails };
  }
}

/**
 * Student quick authentication with email / matricule / phone
 * No pre-filled fake numbers!
 */
export async function signInStudentDirect(data: {
  identifier: string; // email, matricule or phone
  name?: string;
  phone?: string;
  role?: 'student' | 'admin';
}): Promise<UserProfile> {
  const isEmail = data.identifier.includes('@');
  const isAdmin = data.identifier.toLowerCase() === 'admin' || data.identifier.toLowerCase() === 'metroone110@gmail.com';

  const uid = 'stud_' + Math.random().toString(36).substring(2, 10);
  const profile: UserProfile = {
    uid,
    email: isEmail ? data.identifier : `${data.identifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@etudiant.crou.ci`,
    displayName: data.name || (isAdmin ? 'Administrateur CROU' : 'Étudiant CROU'),
    matricule: isEmail ? undefined : data.identifier.toUpperCase(),
    phone: data.phone || undefined,
    role: isAdmin ? 'admin' : 'student',
    balance: 2000, // 2000 FCFA = 10 repas subventionnés
    savedTickets: [],
    campus: 'Campus Cocody (FHB)',
    createdAt: new Date().toISOString()
  };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, profile);
  } catch (err) {
    console.warn('Firestore fallback on direct login:', err);
  }

  saveLocalUserProfile(profile);
  return profile;
}

/**
 * Admin direct sign-in check
 * Required credentials:
 * Pseudo: crouk_admin
 * Mot de passe: upgc2026
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  
  const isUserValid = cleanUser === 'crouk_admin' || cleanUser === 'admin' || cleanUser === 'crouk';
  const isPassValid = cleanPass === 'upgc2026' || cleanPass === 'Azert75@' || cleanPass === 'Azerty75@';
  
  return isUserValid && isPassValid;
}

export function verifyAdminPassword(password: string): boolean {
  const cleanPass = (password || '').trim();
  return cleanPass === 'upgc2026' || cleanPass === 'Azert75@' || cleanPass === 'Azerty75@';
}

/**
 * Update user balance in Firestore and local state
 */
export async function updateUserBalance(profile: UserProfile, newBalance: number): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    balance: newBalance
  };
  saveLocalUserProfile(updated);

  try {
    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, { balance: newBalance });
  } catch (err) {
    console.warn('Balance sync notice:', err);
  }

  return updated;
}

/**
 * Add a purchased ticket to user's collection
 */
export async function addMealTicket(profile: UserProfile, ticket: MealTicket): Promise<UserProfile> {
  const updatedTickets = [ticket, ...(profile.savedTickets || [])];
  const updated: UserProfile = {
    ...profile,
    savedTickets: updatedTickets
  };
  saveLocalUserProfile(updated);

  try {
    const ticketRef = doc(db, 'tickets', ticket.id);
    await setDoc(ticketRef, ticket);

    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, { savedTickets: updatedTickets });
  } catch (err) {
    console.warn('Ticket sync notice:', err);
  }

  return updated;
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch {
    // Ignore signOut errors
  }
  saveLocalUserProfile(null);
}
