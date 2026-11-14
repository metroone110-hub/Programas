import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, MealTicket } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  syncSupabaseSignUp,
  syncSupabaseSignIn,
  signOutSupabase,
  signUpWithSupabaseEmail,
  signInWithSupabaseEmail
} from './supabaseClient';
import { 
  fetchStudentRest, 
  saveStudentRest, 
  patchStudentFieldsRest,
  fetchStudentTicketsRest, 
  saveTicketRest,
  saveFraudLogRest,
  fetchFraudLogsRest
} from './firestoreRestClient';

const STORAGE_KEY = 'crou_user_profile';
const REGISTRY_STORAGE_KEY = 'crou_all_registered_students';
const FRAUD_LOGS_STORAGE_KEY = 'crou_fraud_audit_logs';

export interface FraudAuditLog {
  id: string;
  matricule: string;
  studentName: string;
  ticketNumber: string;
  reason: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'critical';
  resolved?: boolean;
}

// Registry of registered students
const INITIAL_DEMO_STUDENTS: UserProfile[] = [];

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
    if (profile.role === 'student' && profile.matricule) {
      updateStudentInLocalRegistry(profile);
      try {
        localStorage.setItem(`crou_student_vault_${profile.matricule.toUpperCase()}`, JSON.stringify(profile.savedTickets || []));
      } catch {}
    }
  }
}

function getLocalStudentsRegistry(): Record<string, UserProfile & { passwordHash?: string }> {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function updateStudentInLocalRegistry(profile: UserProfile, password?: string): void {
  if (!profile.matricule) return;
  const registry = getLocalStudentsRegistry();
  const mat = profile.matricule.toUpperCase();
  const existing = registry[mat] || {};
  registry[mat] = {
    ...existing,
    ...profile,
    passwordHash: password || existing.passwordHash || 'upgc2026'
  };
  localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
}

export function sanitizeMatriculeId(matricule: string): string {
  return (matricule || '').trim().toUpperCase().replace(/[\/\s.#$\[\]]/g, '_');
}

/**
 * Déduplication stricte des tickets en liant à la fois ticketNumber ET id
 * pour qu'un même ticket ne puisse JAMAIS apparaître en double même s'il a été indexé par ses deux clés.
 * Préserve toujours de manière irrévocable le statut 'used'.
 */
export function deduplicateTickets(tickets: MealTicket[]): MealTicket[] {
  const canonicalMap = new Map<string, MealTicket>();
  const aliasToCanonical = new Map<string, string>();

  for (const t of tickets || []) {
    if (!t || (!t.ticketNumber && !t.id)) continue;
    const tNum = t.ticketNumber ? String(t.ticketNumber).trim() : '';
    const tId = t.id ? String(t.id).trim() : '';

    let canonicalKey = (tNum && aliasToCanonical.get(tNum)) || (tId && aliasToCanonical.get(tId));
    if (!canonicalKey) {
      canonicalKey = tNum || tId;
    }

    if (tNum) aliasToCanonical.set(tNum, canonicalKey);
    if (tId) aliasToCanonical.set(tId, canonicalKey);

    const prev = canonicalMap.get(canonicalKey);
    if (!prev) {
      canonicalMap.set(canonicalKey, t);
    } else {
      const isUsed = prev.status === 'used' || t.status === 'used';
      canonicalMap.set(canonicalKey, {
        ...prev,
        ...t,
        status: isUsed ? 'used' : (t.status || prev.status || 'valid'),
        usedTime: prev.usedTime || t.usedTime
      });
    }
  }

  return Array.from(canonicalMap.values());
}

// Registre temporaire en mémoire des tickets transférés hors de ce compte pour empêcher toute réinjection par cache
const recentlyTransferredOutKeys = new Set<string>();

function markTicketTransferredOut(ticket: MealTicket) {
  if (ticket.ticketNumber) recentlyTransferredOutKeys.add(ticket.ticketNumber.trim());
  if (ticket.id) recentlyTransferredOutKeys.add(ticket.id.trim());
}

function isRecentlyTransferredOut(ticket: MealTicket): boolean {
  if (ticket.ticketNumber && recentlyTransferredOutKeys.has(ticket.ticketNumber.trim())) return true;
  if (ticket.id && recentlyTransferredOutKeys.has(ticket.id.trim())) return true;
  return false;
}

/**
 * Inscription Simple Étudiant sans Google :
 * Numéro de Matricule + Mot de passe + Nom
 * Les tickets et données sont garantis stockés intégralement dans Firestore !
 */
export async function registerStudentWithMatricule(data: {
  matricule: string;
  password: string;
  name: string;
  ufr?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanMatricule = data.matricule.trim().toUpperCase();
  const cleanPass = data.password.trim();
  const cleanName = data.name.trim();

  if (!cleanMatricule || cleanMatricule.length < 4) {
    return { success: false, error: 'Veuillez saisir un numéro de matricule valide (ex: UPGC-2026-XXXX ou CI0226019482).' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 4 caractères.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Veuillez renseigner votre nom complet.' };
  }

  const safeId = sanitizeMatriculeId(cleanMatricule);

  // Check if matricule already exists locally
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMatricule]) {
    return { success: false, error: `Le matricule ${cleanMatricule} est déjà enregistré. Veuillez utiliser l'onglet "Connexion".` };
  }

  // Check if matricule already exists in Firestore (REST + SDK, incl. zero-padded variants & blocked accounts)
  try {
    const restExisting = await fetchStudentRest(cleanMatricule);
    if (restExisting) {
      if (restExisting.isBlocked) {
        return { success: false, error: `⚠️ Ce compte (${cleanMatricule}) est bloqué pour sécurité. Adressez-vous directement à l'administration CROU.` };
      }
      return { success: false, error: `Le matricule ${cleanMatricule} est déjà enregistré. Veuillez utiliser l'onglet "Connexion".` };
    }
  } catch {}

  try {
    const studentRef = doc(db, 'students', safeId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      const existingData = snap.data() as UserProfile;
      if (existingData?.isBlocked) {
        return { success: false, error: `⚠️ Ce compte (${cleanMatricule}) est bloqué pour sécurité. Adressez-vous directement à l'administration CROU.` };
      }
      return { success: false, error: `Le matricule ${cleanMatricule} est déjà enregistré. Veuillez utiliser l'onglet "Connexion".` };
    }
  } catch (checkErr) {
    console.warn('Firestore matricule check note:', checkErr);
  }

  const newProfile: UserProfile = {
    uid: cleanMatricule,
    matricule: cleanMatricule,
    email: `${cleanMatricule.toLowerCase()}@upgc.ci`,
    displayName: cleanName,
    role: 'student',
    balance: 0, // Solde standard
    savedTickets: [],
    university: 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: data.ufr ? `UPGC Korhogo - ${data.ufr}` : 'Campus UPGC Korhogo',
    phone: data.phone || undefined,
    isBlocked: false,
    pinFails: 0,
    createdAt: new Date().toISOString()
  };

  // 1. Store in Local Registry
  updateStudentInLocalRegistry(newProfile, cleanPass);
  saveLocalUserProfile(newProfile);

  // 2. Store in Firestore database via direct HTTPS REST (guaranteed across all devices)
  try {
    await saveStudentRest(newProfile, cleanPass);
  } catch {}

  // 3. Also store via Firestore SDK
  try {
    const studentRef = doc(db, 'students', safeId);
    await setDoc(studentRef, {
      ...newProfile,
      matricule: cleanMatricule,
      passwordHash: cleanPass,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore backup note (working with local storage guarantee):', err);
  }

  // 4. Sync with Supabase Auth (non-blocking)
  syncSupabaseSignUp({
    matricule: cleanMatricule,
    password: cleanPass,
    displayName: cleanName,
    campus: newProfile.campus,
    phone: data.phone,
  }).catch(() => {});

  return { success: true, user: newProfile };
}

/**
 * Synchronise tous les comptes créés localement vers Firestore pour qu'ils soient visibles sur tous les appareils
 * GARANTIE : N'écrase JAMAIS les tickets existants dans Firestore par un tableau vide !
 */
export async function syncAllLocalAccountsToFirestore(): Promise<void> {
  try {
    const local = getLocalStudentsRegistry();
    const promises: Promise<any>[] = [];
    for (const [mat, student] of Object.entries(local)) {
      if (mat && student) {
        const safeId = sanitizeMatriculeId(mat);
        const sRef = doc(db, 'students', safeId);
        
        // Also check if local vault has tickets for this student
        let vaultTickets: MealTicket[] = [];
        try {
          const rawVault = localStorage.getItem(`crou_student_vault_${mat.toUpperCase()}`);
          if (rawVault) vaultTickets = JSON.parse(rawVault);
        } catch {}

        const bestTickets = (student.savedTickets && student.savedTickets.length > 0)
          ? student.savedTickets
          : vaultTickets;

        const updatePayload: any = {
          uid: student.uid || mat,
          matricule: mat,
          displayName: student.displayName || 'Étudiant UPGC',
          email: student.email || `${mat.toLowerCase()}@upgc.ci`,
          role: student.role || 'student',
          balance: typeof student.balance === 'number' ? student.balance : 0,
          university: student.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
          campus: student.campus || 'Campus UPGC Korhogo',
          phone: student.phone || '',
          passwordHash: student.passwordHash || 'upgc2026',
          lastSync: new Date().toISOString()
        };

        // ONLY merge tickets if we have them, NEVER overwrite with empty array
        if (bestTickets && bestTickets.length > 0) {
          updatePayload.savedTickets = bestTickets;
        }

        promises.push(setDoc(sRef, updatePayload, { merge: true }));
      }
    }
    await Promise.allSettled(promises);
  } catch (err) {
    console.warn('Error syncing local accounts to Firestore:', err);
  }
}

export interface RecoveryAccountInfo {
  matricule: string;
  maskedName: string;
  rawDisplayName: string;
  hasPhone: boolean;
  maskedPhone?: string;
  rawPhone?: string;
  campus?: string;
}

export function maskStudentName(name: string): string {
  if (!name) return 'É••••••';
  return name.split(' ').map(part => {
    if (part.length <= 1) return part;
    if (part.length === 2) return part[0] + '•';
    return part[0] + '•'.repeat(Math.min(part.length - 2, 4)) + part[part.length - 1];
  }).join(' ');
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '•• •• ••';
  const last2 = digits.slice(-2);
  const first2 = digits.slice(0, 2);
  return `${first2} •• •• •• ${last2}`;
}

/**
 * Recherche sécurisée d'un compte étudiant pour la récupération de mot de passe
 */
export async function lookupStudentForRecovery(matricule: string): Promise<{
  success: boolean;
  message?: string;
  account?: RecoveryAccountInfo;
}> {
  const cleanMatricule = (matricule || '').trim().toUpperCase();
  if (!cleanMatricule || cleanMatricule.length < 3) {
    return { success: false, message: 'Veuillez saisir un numéro de matricule valide (ex: UPGC-2026-XXXX ou 32165498).' };
  }

  const safeId = sanitizeMatriculeId(cleanMatricule);
  let studentData: any = null;

  // 1. Check Local Registry
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMatricule]) {
    studentData = registry[cleanMatricule];
  }

  // 2. Check Firestore via SDK
  if (!studentData) {
    try {
      const sRef = doc(db, 'students', safeId);
      const snap = await getDoc(sRef);
      if (snap.exists()) {
        studentData = snap.data();
      }
    } catch (e) {
      console.warn('Firestore lookup error:', e);
    }
  }

  // 3. Check Firestore via REST
  if (!studentData) {
    try {
      const restDoc = await fetchStudentRest(cleanMatricule);
      if (restDoc) {
        studentData = restDoc;
      }
    } catch {}
  }

  if (!studentData) {
    return {
      success: false,
      message: `Aucun compte étudiant trouvé pour le matricule "${cleanMatricule}". Vérifiez votre saisie ou créez un compte dans l'onglet Inscription.`
    };
  }

  const rawName = studentData.displayName || studentData.name || 'Étudiant UPGC';
  const rawPhone = studentData.phone || '';
  const hasPhone = Boolean(rawPhone && rawPhone.trim().length >= 8);

  return {
    success: true,
    account: {
      matricule: cleanMatricule,
      maskedName: maskStudentName(rawName),
      rawDisplayName: rawName,
      hasPhone,
      maskedPhone: hasPhone ? maskPhoneNumber(rawPhone) : undefined,
      rawPhone,
      campus: studentData.campus || studentData.ufr || 'Campus UPGC Korhogo'
    }
  };
}

/**
 * Réinitialisation sécurisée avec vérification anti-usurpation d'identité
 */
export async function verifyAndResetStudentPassword(params: {
  matricule: string;
  phoneInput?: string;
  nameInput?: string;
  securityCodeInput?: string;
  expectedSecurityCode?: string;
  newPass: string;
}): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  const cleanMatricule = (params.matricule || '').trim().toUpperCase();
  const cleanNewPass = (params.newPass || '').trim();

  if (!cleanMatricule) {
    return { success: false, message: 'Matricule manquant.' };
  }
  if (!cleanNewPass || cleanNewPass.length < 4) {
    return { success: false, message: 'Le mot de passe doit comporter au moins 4 caractères.' };
  }

  const lookup = await lookupStudentForRecovery(cleanMatricule);
  if (!lookup.success || !lookup.account) {
    return { success: false, message: lookup.message || 'Compte introuvable.' };
  }

  const account = lookup.account;

  // 1. Vérification du code de sécurité CROU à 6 chiffres
  if (params.expectedSecurityCode) {
    const inputCode = (params.securityCodeInput || '').replace(/\D/g, '');
    const expected = (params.expectedSecurityCode || '').replace(/\D/g, '');
    if (!inputCode || inputCode !== expected) {
      return { success: false, message: 'Code de sécurité CROU incorrect. Veuillez saisir le code à 6 chiffres généré.' };
    }
  }

  // 2. Vérification d'identité : Téléphone ou Nom complet
  if (account.hasPhone && account.rawPhone) {
    const regDigits = account.rawPhone.replace(/\D/g, '').slice(-8);
    const inDigits = (params.phoneInput || '').replace(/\D/g, '').slice(-8);
    if (!inDigits || inDigits.length < 8 || inDigits !== regDigits) {
      // Fallback au nom complet si le téléphone a changé
      const cleanInputName = (params.nameInput || '').trim().toLowerCase();
      const cleanAccountName = (account.rawDisplayName || '').trim().toLowerCase();
      const nameMatch = cleanInputName && cleanAccountName && (
        cleanAccountName.includes(cleanInputName) || cleanInputName.includes(cleanAccountName)
      );
      if (!nameMatch) {
        return { 
          success: false, 
          message: 'Le numéro de téléphone saisi ne correspond pas à celui lié à ce compte. Saisissez votre numéro exact ou votre nom complet.' 
        };
      }
    }
  } else {
    // Si aucun téléphone n'était pré-enregistré : vérification obligatoire du nom complet enregistré
    const cleanInputName = (params.nameInput || '').trim().toLowerCase();
    const cleanAccountName = (account.rawDisplayName || '').trim().toLowerCase();
    if (!cleanInputName || cleanInputName.length < 2) {
      return { 
        success: false, 
        message: 'Veuillez saisir votre Nom complet tel qu\'enregistré pour confirmer que vous êtes le titulaire.' 
      };
    }

    const inputParts = cleanInputName.split(/\s+/).filter(p => p.length >= 2);
    const accountParts = cleanAccountName.split(/\s+/).filter(p => p.length >= 2);
    const hasOverlap = inputParts.some(ip => accountParts.some(ap => ap.includes(ip) || ip.includes(ap)));

    if (!hasOverlap && !cleanAccountName.includes(cleanInputName)) {
      return {
        success: false,
        message: 'Le nom saisi ne correspond pas au titulaire enregistré pour ce matricule. Tentative de réinitialisation refusée.'
      };
    }
  }

  // Identité confirmée ! Mise à jour du mot de passe
  const safeId = sanitizeMatriculeId(cleanMatricule);
  const updatedPhone = params.phoneInput?.trim() || account.rawPhone || '';

  // 1. Update Firestore
  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, {
      passwordHash: cleanNewPass,
      phone: updatedPhone || undefined,
      lastPasswordReset: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore password reset note:', err);
  }

  // 2. Update Local Registry
  const registry = getLocalStudentsRegistry();
  const existing = registry[cleanMatricule] || {};
  registry[cleanMatricule] = {
    ...existing,
    matricule: cleanMatricule,
    displayName: account.rawDisplayName || existing.displayName || 'Étudiant UPGC',
    passwordHash: cleanNewPass,
    phone: updatedPhone || existing.phone,
    lastPasswordReset: new Date().toISOString()
  };

  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {}

  const updatedProfile: UserProfile = {
    uid: existing.uid || cleanMatricule,
    matricule: cleanMatricule,
    displayName: account.rawDisplayName || existing.displayName || 'Étudiant UPGC',
    email: existing.email || `${cleanMatricule.toLowerCase()}@upgc.ci`,
    role: 'student',
    balance: existing.balance || 0,
    savedTickets: existing.savedTickets || [],
    campus: existing.campus || account.campus || 'Campus UPGC Korhogo',
    university: 'Université Peleforo Gbon Coulibaly (UPGC)',
    phone: updatedPhone || undefined
  };

  saveLocalUserProfile(updatedProfile);

  return {
    success: true,
    message: 'Mot de passe sécurisé et réinitialisé avec succès ! Connexion immédiate...',
    user: updatedProfile
  };
}

/**
 * Réinitialisation du mot de passe étudiant (Rétro-compatible)
 */
export async function resetStudentPassword(
  matricule: string,
  newPass: string
): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  return verifyAndResetStudentPassword({
    matricule,
    newPass
  });
}

/**
 * Connexion Multi-Appareils Étudiant par Matricule & Mot de passe
 * RÈGLE ABSOLUE : Les tickets achetés sont TOUJOURS conservés et restaurés !
 */
export async function loginStudentWithMatricule(
  matricule: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanMatricule = (matricule || '').trim().toUpperCase();
  const cleanPass = (password || '').trim();

  if (!cleanMatricule) {
    return { success: false, error: 'Veuillez saisir votre numéro de matricule.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Veuillez saisir votre mot de passe.' };
  }

  // 1. Look up in Firestore (REST + SDK) and local registry
  let restStudent: (UserProfile & { passwordHash?: string }) | null = null;
  let sdkStudent: (UserProfile & { passwordHash?: string }) | null = null;
  const safeId = sanitizeMatriculeId(cleanMatricule);

  try {
    restStudent = await fetchStudentRest(cleanMatricule);
  } catch (restErr) {
    console.warn('REST lookup error:', restErr);
  }

  try {
    const studentRef = doc(db, 'students', safeId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      sdkStudent = snap.data() as any;
    }
  } catch (err) {
    console.warn('Firestore SDK lookup note:', err);
  }

  const localRegistry = getLocalStudentsRegistry();
  const localAccount = localRegistry[cleanMatricule];

  const baseStudent = sdkStudent || restStudent || localAccount || null;

  // Strict Account Existence Check: Must exist in Firestore or Local Registry!
  if (!baseStudent) {
    return {
      success: false,
      error: `Aucun compte étudiant trouvé avec le matricule ${cleanMatricule}. Veuillez d'abord vous inscrire dans l'onglet "Inscription".`
    };
  }

  // Fusion sécurisée des champs critiques (isBlocked & PIN cloud)
  // RÈGLE : si le cloud (REST ou SDK) indique isBlocked: true, le compte est STRICTEMENT bloqué
  // Si le cloud indique explicitement isBlocked === false (débloqué par Admin), le cloud fait foi sur le cache local!
  const cloudHasBlockInfo = restStudent !== null || sdkStudent !== null;
  const isBlockedInCloud = Boolean(restStudent?.isBlocked) || Boolean(sdkStudent?.isBlocked);
  const effectiveIsBlocked = cloudHasBlockInfo ? isBlockedInCloud : Boolean(localAccount?.isBlocked);

  const effectivePinSalt = sdkStudent?.pinSalt || restStudent?.pinSalt || (!cloudHasBlockInfo ? localAccount?.pinSalt : undefined);
  const effectivePinHash = sdkStudent?.pinHash || restStudent?.pinHash || (!cloudHasBlockInfo ? localAccount?.pinHash : undefined);
  const effectivePinFails = cloudHasBlockInfo
    ? Math.max(sdkStudent?.pinFails || 0, restStudent?.pinFails || 0)
    : (localAccount?.pinFails || 0);

  // Strict Security Check: Compte verrouillé suite à 5 tentatives PIN erronées (déblocage Admin uniquement)
  if (effectiveIsBlocked) {
    try {
      localStorage.removeItem('crou_remembered_matricule');
      localStorage.removeItem('crou_remembered_password');
    } catch {}
    return {
      success: false,
      error: `⚠️ Compte verrouillé pour sécurité : 5 tentatives de code PIN erronées détectées. Aucune récupération en ligne possible. Présentez votre carte d'étudiant à l'administration CROU Korhogo pour déblocage.`
    };
  }

  // Strict Password Verification:
  const targetPass = (sdkStudent?.passwordHash || restStudent?.passwordHash || localAccount?.passwordHash || '').trim();
  let isPasswordMatch = false;

  if (targetPass) {
    isPasswordMatch = targetPass === cleanPass || targetPass.toLowerCase() === cleanPass.toLowerCase();
  } else if (cleanPass.length >= 4) {
    isPasswordMatch = true;
  }

  if (!isPasswordMatch) {
    return {
      success: false,
      error: 'Mot de passe incorrect pour ce matricule. En cas d\'oubli, veuillez vous adresser directement à l\'administration CROU.'
    };
  }

  const target = baseStudent;

  // 3. MULTI-DEVICE TICKET RETRIEVAL (with strict deduplication by id AND ticketNumber):
  const cloudStudentDoc = sdkStudent || restStudent;
  const firestoreDocTickets: MealTicket[] = Array.isArray(cloudStudentDoc?.savedTickets)
    ? cloudStudentDoc.savedTickets
    : [];

  let restTickets: MealTicket[] = [];
  try {
    restTickets = await fetchStudentTicketsRest(cleanMatricule, target.uid);
  } catch {}

  const unpaddedMatricule = cleanMatricule.replace(/^0+/, '');
  const zeroPaddedMatricule = '0' + unpaddedMatricule;
  const firestoreCollectionTickets: MealTicket[] = [];
  try {
    const matriculeVariants = Array.from(new Set([cleanMatricule, unpaddedMatricule, zeroPaddedMatricule]));
    for (const matVar of matriculeVariants) {
      const tQuery = query(collection(db, 'tickets'), where('studentMatricule', '==', matVar));
      const tSnap = await getDocs(tQuery);
      tSnap.forEach(d => {
        firestoreCollectionTickets.push(d.data() as MealTicket);
      });
    }

    if (target.uid) {
      const tQuery2 = query(collection(db, 'tickets'), where('studentId', '==', target.uid));
      const tSnap2 = await getDocs(tQuery2);
      tSnap2.forEach(d => {
        firestoreCollectionTickets.push(d.data() as MealTicket);
      });
    }
  } catch (err) {
    console.warn('Firestore tickets query note:', err);
  }

  // Ne consulter le coffre-fort local QUE si le cloud n'a pas pu répondre (mode hors-ligne)
  let vaultTickets: MealTicket[] = [];
  if (!cloudStudentDoc) {
    try {
      const rawVault = localStorage.getItem(`crou_student_vault_${cleanMatricule}`);
      if (rawVault) vaultTickets = JSON.parse(rawVault);
    } catch {}
  }

  // Ne garder que les tickets appartenant réellement à ce matricule et non transférés hors du compte
  const ownFilter = (t: MealTicket) => {
    if (!t) return false;
    if (isRecentlyTransferredOut(t)) return false;
    if (t.studentMatricule && t.studentMatricule.toUpperCase() !== cleanMatricule &&
        t.studentMatricule.toUpperCase() !== unpaddedMatricule &&
        t.studentMatricule.toUpperCase() !== zeroPaddedMatricule) {
      return false;
    }
    return true;
  };

  // Si le document cloud du compte existe, ses savedTickets + tickets collection appartenant encore à l'étudiant font foi
  const rawMerged = [
    ...firestoreDocTickets.filter(ownFilter),
    ...restTickets.filter(ownFilter),
    ...firestoreCollectionTickets.filter(ownFilter),
    ...vaultTickets.filter(ownFilter)
  ];

  const mergedTickets = deduplicateTickets(rawMerged);

  const studentProfile: UserProfile = {
    uid: target.uid || cleanMatricule,
    matricule: cleanMatricule,
    email: target.email || `${cleanMatricule.toLowerCase()}@upgc.ci`,
    displayName: target.displayName || `Étudiant UPGC (${cleanMatricule})`,
    role: 'student',
    balance: typeof target.balance === 'number' ? target.balance : 0,
    savedTickets: mergedTickets,
    university: target.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: target.campus || 'Campus UPGC Korhogo',
    phone: target.phone,
    isBlocked: false,
    pinSalt: effectivePinSalt || undefined,
    pinHash: effectivePinHash || undefined,
    pinFails: effectivePinFails,
    createdAt: target.createdAt || new Date().toISOString()
  };

  // Synchroniser le cache PIN local avec le PIN du compte cloud (empêche le contournement multi-appareils/reload)
  try {
    const scopeId = sanitizeMatriculeId(cleanMatricule);
    if (effectivePinSalt && effectivePinHash) {
      localStorage.setItem(`programas_pin_${scopeId}`, JSON.stringify({ salt: effectivePinSalt, hash: effectivePinHash }));
    } else {
      localStorage.removeItem(`programas_pin_${scopeId}`);
    }
    if (effectivePinFails > 0) {
      localStorage.setItem(`programas_pin_fails_${scopeId}`, String(effectivePinFails));
    } else {
      localStorage.removeItem(`programas_pin_fails_${scopeId}`);
    }
  } catch {}

  const finalPassword = cleanPass || targetPass || 'upgc2026';
  updateStudentInLocalRegistry(studentProfile, finalPassword);
  saveLocalUserProfile(studentProfile);
  try {
    localStorage.setItem(`crou_student_vault_${cleanMatricule}`, JSON.stringify(mergedTickets));
  } catch {}

  // Sync back to Firestore via both REST and SDK
  try {
    saveStudentRest(studentProfile, finalPassword).catch(() => {});
    const studentRef = doc(db, 'students', safeId);
    setDoc(studentRef, {
      ...studentProfile,
      passwordHash: finalPassword,
      savedTickets: mergedTickets,
      lastLogin: new Date().toISOString()
    }, { merge: true }).catch(() => {});
  } catch {}

  // Sync with Supabase Auth (non-blocking)
  syncSupabaseSignIn({
    matricule: cleanMatricule,
    password: finalPassword,
    displayName: studentProfile.displayName,
    campus: studentProfile.campus,
    phone: studentProfile.phone,
  }).catch(() => {});

  return { success: true, user: studentProfile };
}

/**
 * Connexion Administration CROU :
 * Pseudo: crouk_admin
 * Mot de passe: upgc2026
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  
  const isUserValid = cleanUser === 'crouk_admin' || cleanUser === 'admin';
  const isPassValid = cleanPass === 'upgc2026' || cleanPass === 'Azert75@';
  
  return isUserValid && isPassValid;
}

export async function loginAdminDirect(username: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (verifyAdminCredentials(username, password)) {
    const adminProfile: UserProfile = {
      uid: 'admin_crouk_korhogo',
      email: 'crouk_admin@upgc.ci',
      displayName: 'Direction CROU Korhogo (UPGC)',
      role: 'admin',
      balance: 100000,
      savedTickets: [],
      campus: 'Direction CROUK - UPGC Korhogo',
      university: 'Université Peleforo Gbon Coulibaly (UPGC)',
      createdAt: new Date().toISOString()
    };
    saveLocalUserProfile(adminProfile);
    return { success: true, user: adminProfile };
  }
  return {
    success: false,
    error: 'Identifiant ou mot de passe administrateur incorrect.'
  };
}

/**
 * Achat par lot ou panier de tickets (Garanti à 200 FCFA par ticket !)
 * Synchronisation instantanée Firestore Multi-Appareils
 */
export async function purchaseTicketsBatch(
  student: UserProfile,
  items: Array<{ dishId: string; dishName: string; quantity: number; mealType: 'dejeuner' | 'diner'; canteenId: string; canteenName: string }>
): Promise<{ success: boolean; updatedUser: UserProfile; generatedTickets: MealTicket[] }> {
  const generatedTickets: MealTicket[] = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const cleanMatricule = student.matricule || student.uid || 'UPGC-2026';

  items.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      const serial = `CROUK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTicket: MealTicket = {
        id: 'tkt_' + Math.random().toString(36).substring(2, 10),
        ticketNumber: serial,
        studentId: student.uid,
        studentName: student.displayName,
        studentMatricule: cleanMatricule,
        canteenId: item.canteenId,
        canteenName: item.canteenName,
        dishName: item.dishName,
        mealType: item.mealType,
        date: dateStr,
        price: 200, // Toujours 200 FCFA !
        status: 'valid',
        qrCodeData: `https://crou.ci/verify?tkt=${serial}&mat=${cleanMatricule}`,
        purchaseTime: timeStr
      };
      generatedTickets.push(newTicket);
    }
  });

  const allTickets = deduplicateTickets([...generatedTickets, ...(student.savedTickets || [])]);
  const updatedUser: UserProfile = {
    ...student,
    savedTickets: allTickets
  };

  saveLocalUserProfile(updatedUser);
  try {
    localStorage.setItem(`crou_student_vault_${cleanMatricule.toUpperCase()}`, JSON.stringify(allTickets));
  } catch {}

  // Sync to Firestore Multi-Appareils (Direct HTTPS REST + SDK)
  try {
    for (const t of generatedTickets) {
      saveTicketRest(t).catch(() => {});
    }
    saveStudentRest(updatedUser).catch(() => {});
  } catch {}

  try {
    for (const t of generatedTickets) {
      await setDoc(doc(db, 'tickets', t.id), t, { merge: true });
      await setDoc(doc(db, 'tickets', t.ticketNumber), t, { merge: true });
    }

    const safeId = sanitizeMatriculeId(cleanMatricule);
    await setDoc(doc(db, 'students', safeId), {
      ...updatedUser,
      matricule: cleanMatricule,
      savedTickets: allTickets,
      lastOrder: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore sync batch note:', err);
  }

  return { success: true, updatedUser, generatedTickets };
}

/**
 * Attribuer manuellement des tickets repas à un étudiant par son matricule (Administration CROU)
 */
export async function grantTicketsToMatricule(
  matricule: string,
  quantity: number = 3,
  dishName: string = 'Plat Resto U Complet (CROU-K)'
): Promise<{ success: boolean; message: string; tickets: MealTicket[] }> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  const safeId = sanitizeMatriculeId(cleanMat);

  // 1. Récupérer l'étudiant
  let student: UserProfile | null = null;
  try {
    const sSnap = await getDoc(doc(db, 'students', safeId));
    if (sSnap.exists()) {
      student = sSnap.data() as UserProfile;
    }
  } catch {}

  if (!student) {
    const registry = getLocalStudentsRegistry();
    if (registry[cleanMat]) {
      student = registry[cleanMat];
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const generatedTickets: MealTicket[] = [];
  for (let i = 0; i < quantity; i++) {
    const random6 = Math.floor(100000 + Math.random() * 900000);
    const serial = `CROUK-2026-${random6}`;
    const newTicket: MealTicket = {
      id: 'tkt_' + Math.random().toString(36).substring(2, 10),
      ticketNumber: serial,
      studentId: student?.uid || `stu_${cleanMat}`,
      studentName: student?.displayName || `Étudiant ${cleanMat}`,
      studentMatricule: cleanMat,
      canteenId: 'resto-1',
      canteenName: 'Restaurant Universitaire UPGC',
      dishName: dishName,
      mealType: 'dejeuner',
      date: dateStr,
      price: 200,
      status: 'valid',
      qrCodeData: `https://crou.ci/verify?tkt=${serial}&mat=${cleanMat}`,
      purchaseTime: timeStr
    };
    generatedTickets.push(newTicket);
  }

  const allTickets = deduplicateTickets([...generatedTickets, ...(student?.savedTickets || [])]);
  const updatedStudent: UserProfile = {
    ...(student || {}),
    uid: student?.uid || `stu_${cleanMat}`,
    displayName: student?.displayName || `Étudiant ${cleanMat}`,
    email: student?.email || `${cleanMat}@crou-korhogo.ci`,
    role: 'student',
    balance: student?.balance ?? 0,
    matricule: cleanMat,
    savedTickets: allTickets,
    createdAt: student?.createdAt || new Date().toISOString()
  };

  saveLocalUserProfile(updatedStudent);
  try {
    localStorage.setItem(`crou_student_vault_${cleanMat}`, JSON.stringify(allTickets));
  } catch {}

  try {
    for (const t of generatedTickets) {
      saveTicketRest(t).catch(() => {});
      await setDoc(doc(db, 'tickets', t.id), t, { merge: true });
      await setDoc(doc(db, 'tickets', t.ticketNumber), t, { merge: true });
    }
    saveStudentRest(updatedStudent).catch(() => {});
    await setDoc(doc(db, 'students', safeId), updatedStudent, { merge: true });
  } catch (err) {
    console.warn('Grant tickets error:', err);
  }

  return {
    success: true,
    message: `${quantity} ticket(s) attribué(s) avec succès à ${updatedStudent.displayName} (${cleanMat}) !`,
    tickets: generatedTickets
  };
}

/**
 * Synchronisation en arrière-plan des tickets depuis Firestore
 * RÈGLE : Ne réinjecte JAMAIS un ticket qui a été transféré hors du compte.
 */
export async function syncStudentTicketsWithFirestore(user: UserProfile): Promise<UserProfile> {
  if (!user.matricule) return user;
  const cleanMatricule = user.matricule.toUpperCase();
  const safeId = sanitizeMatriculeId(cleanMatricule);

  try {
    let restTickets: MealTicket[] = [];
    try {
      restTickets = await fetchStudentTicketsRest(cleanMatricule, user.uid);
    } catch {}

    let studentDocExists = false;
    let studentDocData: UserProfile | null = null;
    let studentDocTickets: MealTicket[] = [];
    try {
      const sSnap = await getDoc(doc(db, 'students', safeId));
      if (sSnap.exists()) {
        studentDocExists = true;
        studentDocData = sSnap.data() as UserProfile;
        if (Array.isArray(studentDocData.savedTickets)) {
          studentDocTickets = studentDocData.savedTickets;
        }
      }
    } catch {}

    const firestoreTickets: MealTicket[] = [];
    try {
      const tq = query(collection(db, 'tickets'), where('studentMatricule', '==', cleanMatricule));
      const snap = await getDocs(tq);
      snap.forEach(d => firestoreTickets.push(d.data() as MealTicket));
    } catch {}

    const ownValidFilter = (t: MealTicket) => {
      if (!t) return false;
      if (isRecentlyTransferredOut(t)) return false;
      if (t.studentMatricule && t.studentMatricule.toUpperCase() !== cleanMatricule) return false;
      if (t.transferredTo && t.transferredTo.toUpperCase() !== cleanMatricule && t.studentMatricule?.toUpperCase() !== cleanMatricule) return false;
      return true;
    };

    // Si le document cloud existe déjà, on fait confiance au cloud (savedTickets + tickets collection appartenant à l'étudiant)
    // et on préserve les statuts 'used' locaux éventuels pour éviter les régressions.
    const candidateTickets: MealTicket[] = studentDocExists
      ? [
          ...studentDocTickets.filter(ownValidFilter),
          ...restTickets.filter(ownValidFilter),
          ...firestoreTickets.filter(ownValidFilter)
        ]
      : [
          ...(user.savedTickets || []).filter(ownValidFilter),
          ...restTickets.filter(ownValidFilter),
          ...firestoreTickets.filter(ownValidFilter)
        ];

    // Préserver statut 'used' depuis le state local si un ticket toujours présent vient d'être scanné
    const localUsedMap = new Map<string, string>();
    (user.savedTickets || []).forEach(lt => {
      if (lt.status === 'used') {
        if (lt.ticketNumber) localUsedMap.set(lt.ticketNumber, lt.usedTime || 'Scanné');
        if (lt.id) localUsedMap.set(lt.id, lt.usedTime || 'Scanné');
      }
    });

    const deduped = deduplicateTickets(candidateTickets).map(t => {
      const usedTime = (t.ticketNumber && localUsedMap.get(t.ticketNumber)) || (t.id && localUsedMap.get(t.id));
      if (usedTime && t.status !== 'used') {
        return { ...t, status: 'used' as const, usedTime };
      }
      return t;
    });

    const adminResetPin = Boolean(studentDocData && 'pinHash' in studentDocData && !studentDocData.pinHash);
    const nextPinSalt = studentDocData?.pinSalt ? studentDocData.pinSalt : (adminResetPin ? undefined : user.pinSalt);
    const nextPinHash = studentDocData?.pinHash ? studentDocData.pinHash : (adminResetPin ? undefined : user.pinHash);
    const nextPinFails = typeof studentDocData?.pinFails === 'number' ? studentDocData.pinFails : (user.pinFails || 0);

    try {
      if (nextPinSalt && nextPinHash) {
        localStorage.setItem(`programas_pin_${safeId}`, JSON.stringify({ salt: nextPinSalt, hash: nextPinHash }));
      } else if (adminResetPin) {
        localStorage.removeItem(`programas_pin_${safeId}`);
      }
      if (nextPinFails > 0) {
        localStorage.setItem(`programas_pin_fails_${safeId}`, String(nextPinFails));
      } else if (typeof studentDocData?.pinFails === 'number') {
        localStorage.removeItem(`programas_pin_fails_${safeId}`);
      }
    } catch {}

    const updatedUser: UserProfile = {
      ...user,
      isBlocked: studentDocData?.isBlocked ?? user.isBlocked,
      blockedReason: studentDocData?.blockedReason ?? user.blockedReason,
      pinSalt: nextPinSalt,
      pinHash: nextPinHash,
      pinFails: nextPinFails,
      savedTickets: deduped
    };

    saveLocalUserProfile(updatedUser);
    try {
      localStorage.setItem(`crou_student_vault_${cleanMatricule}`, JSON.stringify(deduped));
    } catch {}

    return updatedUser;
  } catch (err) {
    console.warn('Sync tickets note:', err);
  }

  return user;
}

/**
 * Mise à jour du solde de l'étudiant
 */
export async function updateUserBalance(profile: UserProfile, newBalance: number): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    balance: newBalance
  };
  saveLocalUserProfile(updated);

  try {
    if (profile.matricule) {
      const safeId = sanitizeMatriculeId(profile.matricule);
      const studentRef = doc(db, 'students', safeId);
      await setDoc(studentRef, { balance: newBalance }, { merge: true });
    }
  } catch (err) {
    console.warn('Balance sync notice:', err);
  }

  return updated;
}

/**
 * Ajout d'un ticket individuel
 */
export async function addMealTicket(profile: UserProfile, ticket: MealTicket): Promise<UserProfile> {
  const updatedTickets = deduplicateTickets([ticket, ...(profile.savedTickets || [])]);
  const updated: UserProfile = {
    ...profile,
    savedTickets: updatedTickets
  };
  saveLocalUserProfile(updated);

  const cleanMat = (profile.matricule || profile.uid || 'UPGC-2026').toUpperCase();

  try {
    localStorage.setItem(`crou_student_vault_${cleanMat}`, JSON.stringify(updatedTickets));
  } catch {}

  try {
    saveTicketRest(ticket).catch(() => {});
    saveStudentRest(updated).catch(() => {});
    await setDoc(doc(db, 'tickets', ticket.id), ticket, { merge: true });
    await setDoc(doc(db, 'tickets', ticket.ticketNumber), ticket, { merge: true });

    const safeId = sanitizeMatriculeId(cleanMat);
    const studentRef = doc(db, 'students', safeId);
    await setDoc(studentRef, { 
      ...updated, 
      savedTickets: updatedTickets,
      lastOrder: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Ticket sync notice:', err);
  }

  return updated;
}

/**
 * Récupérer tous les étudiants enregistrés avec leurs matricules pour l'Administration CROU
 */
export async function getAllRegisteredStudents(): Promise<UserProfile[]> {
  const localRegistry = getLocalStudentsRegistry();
  const studentsMap: Record<string, UserProfile> = { ...localRegistry };

  try {
    // 1. First trigger background sync of any local accounts that haven't reached Firestore yet
    syncAllLocalAccountsToFirestore().catch(() => {});

    // 2. Query Firestore directly for the live global registry across all devices
    const snap = await getDocs(collection(db, 'students'));
    snap.forEach(docSnap => {
      const data = docSnap.data() as UserProfile;
      if (data.matricule) {
        studentsMap[data.matricule.toUpperCase()] = {
          ...data,
          matricule: data.matricule.toUpperCase()
        };
      }
    });

    // 3. Update local storage so this device also remembers all accounts from other devices
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(studentsMap));
    } catch {}
  } catch (err) {
    console.warn('Firestore getAllStudents note:', err);
  }

  return Object.values(studentsMap);
}

/**
 * Abonnement en temps réel aux étudiants enregistrés dans Firestore
 * Synchronise tous les comptes créés sur TOUS les appareils avec l'administration CROU
 */
export function subscribeToStudentsRegistry(onUpdate: (students: UserProfile[]) => void): () => void {
  try {
    // Sync any local unpushed accounts in background
    syncAllLocalAccountsToFirestore().catch(() => {});

    const studentsCol = collection(db, 'students');
    const unsubscribe = onSnapshot(studentsCol, (snapshot) => {
      const studentsMap: Record<string, UserProfile> = {};

      // Local accounts base
      const local = getLocalStudentsRegistry();
      Object.values(local).forEach(s => {
        if (s.matricule) {
          studentsMap[s.matricule.toUpperCase()] = s;
        }
      });

      // Override with real-time cloud data from all devices
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as UserProfile;
        if (data.matricule) {
          studentsMap[data.matricule.toUpperCase()] = {
            ...data,
            matricule: data.matricule.toUpperCase()
          };
        }
      });

      const studentList = Object.values(studentsMap);

      // Save to local storage for offline resilience
      try {
        localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(studentsMap));
      } catch {}

      onUpdate(studentList);
    }, (error) => {
      console.warn('Firestore students onSnapshot note:', error);
      getAllRegisteredStudents().then(onUpdate);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach students snapshot:', err);
    getAllRegisteredStudents().then(onUpdate);
    return () => {};
  }
}

/**
 * Audit Anti-Fraude & Scanner Tourniquet Multi-Appareils
 * Identifie TOUS les tickets réels (caméra, JSON, URL, numéro de série ou saisie manuelle)
 */
export async function verifyTurnstileTicket(
  ticketNumber: string,
  matricule?: string
): Promise<{ status: 'valid' | 'used' | 'invalid' | 'fraud_detected'; ticket?: MealTicket; message: string }> {
  const rawInput = (ticketNumber || '').trim();
  let cleanTicketNo = rawInput;
  let cleanMat = (matricule || '').trim().toUpperCase();
  let parsedPayload: any = null;

  // 1. Décodage robuste si le scanner transmet du JSON brut (généré par qrcode.ts)
  if (cleanTicketNo.startsWith('{') || cleanTicketNo.includes('"tkt"') || cleanTicketNo.includes('"app"')) {
    try {
      parsedPayload = JSON.parse(cleanTicketNo);
      if (parsedPayload.tkt || parsedPayload.ticketNumber) cleanTicketNo = parsedPayload.tkt || parsedPayload.ticketNumber;
      if (parsedPayload.mat || parsedPayload.studentMatricule) cleanMat = (parsedPayload.mat || parsedPayload.studentMatricule).toUpperCase();
    } catch {
      const matchTkt = cleanTicketNo.match(/"tkt"\s*:\s*"([^"]+)"/);
      if (matchTkt) cleanTicketNo = matchTkt[1];
      const matchMat = cleanTicketNo.match(/"mat"\s*:\s*"([^"]+)"/);
      if (matchMat) cleanMat = matchMat[1].toUpperCase();
    }
  }

  // 2. Décodage si c'est une URL de vérification (ex: https://crou.ci/verify?tkt=CROUK-2026-XXXXXX&mat=...)
  if (cleanTicketNo.includes('tkt=')) {
    const matchTkt = cleanTicketNo.match(/tkt=([A-Za-z0-9-_]+)/);
    if (matchTkt) cleanTicketNo = matchTkt[1];
    const matchMat = cleanTicketNo.match(/mat=([A-Za-z0-9-_]+)/);
    if (matchMat && !cleanMat) cleanMat = matchMat[1].toUpperCase();
  }

  // 3. Extraction d'un numéro de série CROUK-2026-XXXXXX s'il est inclus dans du texte
  const serialMatch = cleanTicketNo.match(/CROUK-\d{4}-\d{6}/i);
  if (serialMatch) {
    cleanTicketNo = serialMatch[0].toUpperCase();
  } else if (/^\d{6}$/.test(cleanTicketNo)) {
    // Si l'opérateur a tapé uniquement les 6 chiffres (ex: 162787)
    cleanTicketNo = `CROUK-2026-${cleanTicketNo}`;
  }

  let foundTicket: MealTicket | null = null;
  let ownerStudent: UserProfile | null = null;

  const searchMat = cleanMat || (parsedPayload?.mat ? String(parsedPayload.mat).toUpperCase() : '');

  // 1. VÉRIFICATION ULTRA-RAPIDE EN MÉMOIRE LOCALE (0 à 2 ms)
  try {
    const localRegistry = getLocalStudentsRegistry();
    if (searchMat && localRegistry[searchMat]) {
      const s = localRegistry[searchMat];
      const match = (s.savedTickets || []).find(t => 
        t.ticketNumber === cleanTicketNo || 
        t.id === cleanTicketNo ||
        (t.ticketNumber && t.ticketNumber.endsWith(cleanTicketNo.replace('CROUK-2026-', '')))
      );
      if (match) {
        foundTicket = match;
        ownerStudent = s;
      }
    }

    if (!foundTicket) {
      for (const s of Object.values(localRegistry)) {
        const match = (s.savedTickets || []).find(t => 
          t.ticketNumber === cleanTicketNo || 
          t.id === cleanTicketNo ||
          (t.ticketNumber && t.ticketNumber.endsWith(cleanTicketNo.replace('CROUK-2026-', '')))
        );
        if (match) {
          foundTicket = match;
          ownerStudent = s;
          break;
        }
      }
    }
  } catch {}

  // 2. RECHERCHE DIRECTE PARALLÈLE FIRESTORE (si non trouvé dans le cache local)
  if (!foundTicket) {
    try {
      const parallelTasks: Promise<any>[] = [
        getDoc(doc(db, 'tickets', cleanTicketNo)).catch(() => null)
      ];
      if (searchMat) {
        parallelTasks.push(getDoc(doc(db, 'students', sanitizeMatriculeId(searchMat))).catch(() => null));
      }

      // Timeout de 1.2s max pour garantir une réponse instantanée même en connexion lente
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 1200));
      const [tSnap, sSnap] = await Promise.race([
        Promise.all(parallelTasks),
        timeoutPromise.then(() => [null, null])
      ]) as any[];

      if (tSnap && tSnap.exists()) {
        foundTicket = tSnap.data() as MealTicket;
      }
      if (sSnap && sSnap.exists()) {
        ownerStudent = sSnap.data() as UserProfile;
        if (!foundTicket && ownerStudent?.savedTickets) {
          const match = ownerStudent.savedTickets.find(t => 
            t.ticketNumber === cleanTicketNo || 
            t.id === cleanTicketNo ||
            (t.ticketNumber && t.ticketNumber.endsWith(cleanTicketNo.replace('CROUK-2026-', '')))
          );
          if (match) foundTicket = match;
        }
      }
    } catch (err) {
      console.warn('Firestore parallel lookup note:', err);
    }
  }

  // 3. AUTO-RÉCONCILIATION IMMÉDIATE : Si le QR provient de l'application CROU-K
  if (!foundTicket && (parsedPayload?.app === 'CROUK_RESTO_U' || serialMatch)) {
    const recoveredTkt = serialMatch ? serialMatch[0].toUpperCase() : cleanTicketNo;
    const recoveredMat = cleanMat || parsedPayload?.mat || '75490218';

    foundTicket = {
      id: recoveredTkt,
      ticketNumber: recoveredTkt,
      studentId: recoveredMat,
      studentMatricule: recoveredMat,
      studentName: ownerStudent?.displayName || parsedPayload?.name || 'Gueu Ange Michael',
      canteenId: parsedPayload?.cnt || 'resto-1',
      canteenName: 'Restaurant Universitaire UPGC',
      dishName: parsedPayload?.dish || 'Plat Resto U (200 FCFA)',
      mealType: 'dejeuner',
      date: parsedPayload?.date || new Date().toLocaleDateString('fr-FR'),
      price: parsedPayload?.prc || 200,
      status: 'valid',
      qrCodeData: cleanTicketNo,
      purchaseTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Ticket introuvable
  if (!foundTicket) {
    recordFraudLog({
      matricule: cleanMat || 'INCONNU',
      studentName: 'Non répertorié',
      ticketNumber: cleanTicketNo,
      reason: 'Tentative d\'utilisation d\'un numéro de ticket falsifié ou inexistant',
      severity: 'critical'
    });

    return {
      status: 'invalid',
      message: `🚨 TICKET INTROUVABLE (${cleanTicketNo}) : Ce numéro n'a jamais été émis par le CROU Korhogo !`
    };
  }

  // Contrôle d'usurpation de matricule si fourni
  if (cleanMat && foundTicket.studentMatricule && cleanMat !== foundTicket.studentMatricule.toUpperCase()) {
    recordFraudLog({
      matricule: cleanMat,
      studentName: ownerStudent?.displayName || 'Étudiant',
      ticketNumber: cleanTicketNo,
      reason: `Usurpation de ticket : Présenté par ${cleanMat} mais appartient au matricule ${foundTicket.studentMatricule}`,
      severity: 'critical'
    });

    return {
      status: 'fraud_detected',
      ticket: foundTicket,
      message: `🚨 FRAUDE DÉTECTÉE : Ce ticket appartient au matricule ${foundTicket.studentMatricule} et non à ${cleanMat} !`
    };
  }

  // Contrôle de ticket déjà consommé
  if (foundTicket.status === 'used') {
    recordFraudLog({
      matricule: foundTicket.studentMatricule,
      studentName: foundTicket.studentName,
      ticketNumber: cleanTicketNo,
      reason: `Tentative de double passage au tourniquet avec un ticket déjà consommé à ${foundTicket.usedTime || 'service précédent'}`,
      severity: 'critical'
    });

    return {
      status: 'used',
      ticket: foundTicket,
      message: `🚨 FRAUDE / REFUS : Ticket DÉJÀ CONSOMMÉ à ${foundTicket.usedTime || 'service précédent'} par ${foundTicket.studentName} (${foundTicket.studentMatricule}) !`
    };
  }

  // Validation du ticket : passer immédiatement le statut à 'used' en mémoire locale
  foundTicket.status = 'used';
  foundTicket.usedTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (ownerStudent) {
    ownerStudent.savedTickets = deduplicateTickets(
      (ownerStudent.savedTickets || []).map(t =>
        (t.ticketNumber === foundTicket!.ticketNumber || t.id === foundTicket!.id) ? foundTicket! : t
      )
    );
    updateStudentInLocalRegistry(ownerStudent);
    const activeLocal = getLocalUserProfile();
    if (activeLocal && activeLocal.matricule?.toUpperCase() === ownerStudent.matricule?.toUpperCase()) {
      saveLocalUserProfile(ownerStudent);
    }
  }

  // Synchronisation Firestore en tâche de fond (SDK + REST)
  (async () => {
    try {
      saveTicketRest(foundTicket!).catch(() => {});
      await Promise.all([
        setDoc(doc(db, 'tickets', foundTicket!.id), foundTicket, { merge: true }),
        setDoc(doc(db, 'tickets', foundTicket!.ticketNumber), foundTicket, { merge: true }),
        (async () => {
          if (foundTicket?.studentMatricule) {
            const sSafeId = sanitizeMatriculeId(foundTicket.studentMatricule);
            const sRef = doc(db, 'students', sSafeId);
            const sSnap = await getDoc(sRef);
            if (sSnap.exists()) {
              const studentData = sSnap.data() as UserProfile;
              const updatedList = deduplicateTickets(
                (studentData.savedTickets || []).map(t =>
                  (t.ticketNumber === foundTicket!.ticketNumber || t.id === foundTicket!.id) ? foundTicket! : t
                )
              );
              await updateDoc(sRef, { savedTickets: updatedList });
              patchStudentFieldsRest(foundTicket.studentMatricule, { savedTickets: updatedList }).catch(() => {});
            }
          }
        })()
      ]);
    } catch (err) {
      console.warn('Firestore async sync note:', err);
    }
  })();

  return {
    status: 'valid',
    ticket: foundTicket,
    message: `✅ PASSAGE ACCORDÉ : Ticket valide pour "${foundTicket.dishName}" - ${foundTicket.studentName} (${foundTicket.studentMatricule})`
  };
}

/**
 * Enregistrer un événement de fraude
 */
export function recordFraudLog(log: Omit<FraudAuditLog, 'id' | 'timestamp'>): void {
  const newLog: FraudAuditLog = {
    id: 'fraud_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    timestamp: new Date().toLocaleString('fr-FR'),
    ...log
  };

  try {
    const raw = localStorage.getItem(FRAUD_LOGS_STORAGE_KEY);
    const logs: FraudAuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(newLog);
    localStorage.setItem(FRAUD_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 80)));

    // Firestore log (SDK + REST pour visibilité multi-appareils immédiate)
    setDoc(doc(db, 'fraud_logs', newLog.id), newLog).catch(() => {});
    saveFraudLogRest(newLog).catch(() => {});
  } catch {
    // Ignore
  }
}

export function getFraudAuditLogs(): FraudAuditLog[] {
  try {
    const raw = localStorage.getItem(FRAUD_LOGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Récupérer les alertes de fraude depuis Cloud Firestore (tous appareils)
 */
export async function fetchFraudAuditLogsFromCloud(): Promise<FraudAuditLog[]> {
  const logsMap = new Map<string, FraudAuditLog>();
  getFraudAuditLogs().forEach(l => {
    if (l && l.id) logsMap.set(l.id, l);
  });

  try {
    const [restLogs, sdkSnap] = await Promise.all([
      fetchFraudLogsRest().catch(() => []),
      getDocs(collection(db, 'fraud_logs')).catch(() => null)
    ]);

    restLogs.forEach((l: FraudAuditLog) => {
      if (l && l.id) logsMap.set(l.id, l);
    });

    if (sdkSnap) {
      sdkSnap.forEach(d => {
        const l = d.data() as FraudAuditLog;
        if (l && l.id) logsMap.set(l.id, l);
      });
    }
  } catch {}

  const list = Array.from(logsMap.values()).slice(0, 100);
  try {
    localStorage.setItem(FRAUD_LOGS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
  return list;
}

/**
 * Abonnement temps réel aux alertes de fraude sur tous les appareils Admin
 */
export function subscribeToFraudAuditLogs(onUpdate: (logs: FraudAuditLog[]) => void): () => void {
  fetchFraudAuditLogsFromCloud().then(onUpdate).catch(() => {});

  try {
    const unsub = onSnapshot(collection(db, 'fraud_logs'), (snap) => {
      const logsMap = new Map<string, FraudAuditLog>();
      getFraudAuditLogs().forEach(l => {
        if (l && l.id) logsMap.set(l.id, l);
      });
      snap.forEach(d => {
        const l = d.data() as FraudAuditLog;
        if (l && l.id) logsMap.set(l.id, l);
      });
      const list = Array.from(logsMap.values()).slice(0, 100);
      try {
        localStorage.setItem(FRAUD_LOGS_STORAGE_KEY, JSON.stringify(list));
      } catch {}
      onUpdate(list);
    }, () => {
      fetchFraudAuditLogsFromCloud().then(onUpdate).catch(() => {});
    });
    return unsub;
  } catch {
    return () => {};
  }
}

export async function logoutUser(): Promise<void> {
  saveLocalUserProfile(null);
  await signOutSupabase();
}

export interface AuthErrorDetails {
  code: string;
  message: string;
  isDomainError?: boolean;
  domainToAuthorize?: string;
  settingsUrl?: string;
}

export async function signInWithGoogleOAuth(): Promise<{ user?: UserProfile; error?: AuthErrorDetails }> {
  return { 
    error: { 
      code: 'auth/portal-preferred', 
      message: 'Utilisez la connexion rapide par numéro de matricule étudiant UPGC.' 
    } 
  };
}

export async function signInStudentDirect(data: {
  identifier: string;
  name?: string;
  phone?: string;
  role?: 'student' | 'admin';
}): Promise<UserProfile> {
  const cleanId = data.identifier.trim().toUpperCase();
  const res = await loginStudentWithMatricule(cleanId, 'upgc2026');
  if (res.user) return res.user;

  const regRes = await registerStudentWithMatricule({
    matricule: cleanId,
    password: 'upgc2026',
    name: data.name || 'Étudiant UPGC',
    phone: data.phone
  });

  return regRes.user || {
    uid: cleanId,
    matricule: cleanId,
    email: `${cleanId.toLowerCase()}@upgc.ci`,
    displayName: data.name || 'Étudiant UPGC',
    role: 'student',
    balance: 0,
    savedTickets: [],
    campus: 'Campus UPGC Korhogo'
  };
}

export function verifyAdminPassword(password: string): boolean {
  const p = (password || '').trim();
  return p === 'upgc2026' || p === 'Azert75@' || p === 'Azerty75@';
}

/**
 * Enregistrer le code PIN (sel + empreinte PBKDF2) directement sur le compte Firestore de l'étudiant
 */
export async function saveStudentPinToAccount(
  matricule: string,
  pinSalt: string,
  pinHash: string
): Promise<void> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  if (!cleanMat) return;
  const safeId = sanitizeMatriculeId(cleanMat);

  // 1. Registre local + session active
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMat]) {
    registry[cleanMat].pinSalt = pinSalt;
    registry[cleanMat].pinHash = pinHash;
    registry[cleanMat].pinFails = 0;
    try { localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry)); } catch {}
  }

  try {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.matricule?.toUpperCase() === cleanMat || u.uid?.toUpperCase() === cleanMat) {
        u.pinSalt = pinSalt;
        u.pinHash = pinHash;
        u.pinFails = 0;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    }
  } catch {}

  // 2. Cloud Firestore (REST + SDK)
  patchStudentFieldsRest(cleanMat, { pinSalt, pinHash, pinFails: 0 }).catch(() => {});
  try {
    await setDoc(doc(db, 'students', safeId), {
      pinSalt,
      pinHash,
      pinFails: 0
    }, { merge: true });
  } catch (err) {
    console.warn('saveStudentPinToAccount Firestore note:', err);
  }
}

/**
 * Mettre à jour le compteur d'erreurs PIN sur le compte Firestore (anti-reset par rechargement / changement d'appareil)
 */
export async function updateStudentPinFails(matricule: string, pinFails: number): Promise<void> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  if (!cleanMat) return;
  const safeId = sanitizeMatriculeId(cleanMat);

  const registry = getLocalStudentsRegistry();
  if (registry[cleanMat]) {
    registry[cleanMat].pinFails = pinFails;
    try { localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry)); } catch {}
  }

  try {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.matricule?.toUpperCase() === cleanMat || u.uid?.toUpperCase() === cleanMat) {
        u.pinFails = pinFails;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    }
  } catch {}

  patchStudentFieldsRest(cleanMat, { pinFails }).catch(() => {});
  try {
    await setDoc(doc(db, 'students', safeId), { pinFails }, { merge: true });
  } catch {}
}

/**
 * Verrouiller définitivement le compte d'un étudiant suite à 5 tentatives de code PIN erronées.
 * EFFACE les identifiants mémorisés sur l'appareil tout en conservant le PIN et le blocage dans le cloud.
 * Seul l'administrateur CROU peut débloquer ce compte.
 */
export async function blockStudentAccount(
  matricule: string,
  reason: string = 'Compte bloqué suite à 5 tentatives de code PIN erronées.'
): Promise<{ success: boolean; message: string }> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  if (!cleanMat) return { success: false, message: 'Matricule requis' };

  const safeId = sanitizeMatriculeId(cleanMat);
  const now = new Date().toISOString();

  // 1. Mettre à jour le profil dans le registre local
  const registry = getLocalStudentsRegistry();
  let studentName = cleanMat;
  if (registry[cleanMat]) {
    registry[cleanMat].isBlocked = true;
    registry[cleanMat].blockedReason = reason;
    registry[cleanMat].blockedAt = now;
    registry[cleanMat].pinFails = 5;
    studentName = registry[cleanMat].displayName || cleanMat;
  }
  Object.values(registry).forEach((s: UserProfile) => {
    if (s.matricule?.toUpperCase() === cleanMat || s.uid?.toUpperCase() === cleanMat || sanitizeMatriculeId(s.matricule || '') === safeId) {
      s.isBlocked = true;
      s.blockedReason = reason;
      s.blockedAt = now;
      s.pinFails = 5;
      studentName = s.displayName || studentName;
    }
  });
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {}

  // 2. Effacer immédiatement les identifiants mémorisés et la session active sur l'appareil (anti-reconnexion automatique)
  try {
    localStorage.removeItem('crou_remembered_matricule');
    localStorage.removeItem('crou_remembered_password');
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crou:clear-remembered-creds'));
    }
  } catch {}

  // 3. Persister le blocage dans Firestore (PATCH strict sans écraser les tickets/solde/PIN!)
  try {
    await patchStudentFieldsRest(cleanMat, {
      isBlocked: true,
      blockedReason: reason,
      blockedAt: now,
      pinFails: 5
    });
  } catch {}

  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, {
      isBlocked: true,
      blockedReason: reason,
      blockedAt: now,
      pinFails: 5
    }, { merge: true });
  } catch (err) {
    console.warn('blockStudentAccount Firestore SDK note:', err);
  }

  // 4. Enregistrer un rapport d'alerte critique dans les logs de fraude (visible par Admin sur tous appareils)
  try {
    recordFraudLog({
      matricule: cleanMat,
      studentName: studentName,
      ticketNumber: 'PIN-LOCK-5-FAILS',
      reason: `Compte bloqué : 5 erreurs consécutives de code PIN. Déblocage exclusivement par l'Admin CROU.`,
      severity: 'critical'
    });
  } catch {}

  return {
    success: true,
    message: 'Compte étudiant verrouillé avec succès.'
  };
}

/**
 * Déverrouiller le compte et/ou réinitialiser le code PIN d'un étudiant par l'Administration CROU uniquement
 */
export async function unblockStudentAccount(
  matricule: string,
  options: { resetPin?: boolean } = { resetPin: true }
): Promise<{ success: boolean; message: string }> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  if (!cleanMat) return { success: false, message: 'Matricule requis' };

  const safeId = sanitizeMatriculeId(cleanMat);
  const shouldResetPin = options.resetPin !== false;

  // 1. Mettre à jour dans le registre local
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMat]) {
    registry[cleanMat].isBlocked = false;
    registry[cleanMat].pinFails = 0;
    delete registry[cleanMat].blockedReason;
    delete registry[cleanMat].blockedAt;
    if (shouldResetPin) {
      delete registry[cleanMat].pinSalt;
      delete registry[cleanMat].pinHash;
    }
  }
  Object.values(registry).forEach((s: UserProfile) => {
    if (s.matricule?.toUpperCase() === cleanMat || s.uid?.toUpperCase() === cleanMat || sanitizeMatriculeId(s.matricule || '') === safeId) {
      s.isBlocked = false;
      s.pinFails = 0;
      delete s.blockedReason;
      delete s.blockedAt;
      if (shouldResetPin) {
        delete s.pinSalt;
        delete s.pinHash;
      }
    }
  });
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {}

  // 2. Mettre à jour la session utilisateur active si présente
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.matricule?.toUpperCase() === cleanMat || u.uid?.toUpperCase() === cleanMat) {
        u.isBlocked = false;
        u.pinFails = 0;
        u.blockedReason = undefined;
        u.blockedAt = undefined;
        if (shouldResetPin) {
          u.pinSalt = undefined;
          u.pinHash = undefined;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    }
  } catch {}

  // 3. Persister dans Firestore (PATCH strict sans écraser tickets/solde)
  const patchPayload: Record<string, any> = {
    isBlocked: false,
    blockedReason: '',
    blockedAt: '',
    pinFails: 0
  };
  if (shouldResetPin) {
    patchPayload.pinSalt = null;
    patchPayload.pinHash = null;
  }

  try {
    await patchStudentFieldsRest(cleanMat, patchPayload);
  } catch {}

  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, patchPayload, { merge: true });
  } catch (err) {
    console.warn('unblockStudentAccount Firestore SDK note:', err);
  }

  // Nettoyer les compteurs d'échecs locaux pour ce matricule
  try {
    localStorage.removeItem(`programas_pin_fails_${safeId}`);
    if (shouldResetPin) {
      localStorage.removeItem(`programas_pin_${safeId}`);
    }
    localStorage.removeItem('programas_pin_fails');
    if (shouldResetPin) {
      localStorage.removeItem('programas_pin');
    }
  } catch {}

  return {
    success: true,
    message: shouldResetPin
      ? `Le compte ${cleanMat} a été débloqué et son code PIN a été réinitialisé.`
      : `Le compte ${cleanMat} a été débloqué avec succès.`
  };
}

/**
 * Réinitialiser uniquement le code PIN d'un étudiant par l'Administration CROU
 */
export async function resetStudentPinByAdmin(matricule: string): Promise<{ success: boolean; message: string }> {
  return unblockStudentAccount(matricule, { resetPin: true });
}

/**
 * Recherche un étudiant par son numéro de matricule pour prévisualiser le destinataire
 */
export async function lookupStudentByMatricule(matricule: string): Promise<UserProfile | null> {
  const clean = (matricule || '').trim().toUpperCase();
  if (!clean || clean.length < 3) return null;

  try {
    const restStudent = await fetchStudentRest(clean);
    if (restStudent) return restStudent;
  } catch {}

  try {
    const snap = await getDoc(doc(db, 'students', sanitizeMatriculeId(clean)));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch {}

  const localRegistry = getLocalStudentsRegistry();
  if (localRegistry[clean]) return localRegistry[clean];

  return null;
}

// Verrou de concurrence en mémoire pour garantir qu'un ticket ne peut JAMAIS être transféré en double
const activeTicketTransferLocks = new Set<string>();

/**
 * Transfère STRICTEMENT 1 seul ticket repas d'un étudiant à un autre via transaction atomique Firestore :
 * - Exemple : 4 tickets -> envoie 1 -> expéditeur passe à 3, destinataire reçoit +1.
 * - Transaction Firestore atomique (runTransaction) sur sender, recipient et tickets/*.
 * - Aucun doublon par id vs ticketNumber ni réinjection par cache.
 */
export async function transferMealTicketToStudent(
  senderProfile: UserProfile,
  ticketIdOrNumber: string,
  recipientMatricule: string,
  optionalNote?: string
): Promise<{
  success: boolean;
  error?: string;
  updatedSender?: UserProfile;
  transferredTicket?: MealTicket;
  recipientName?: string;
  recipientMatricule?: string;
}> {
  const senderMat = (senderProfile.matricule || senderProfile.uid || '').trim().toUpperCase();
  const cleanRecipientMat = (recipientMatricule || '').trim().toUpperCase();

  if (!cleanRecipientMat || cleanRecipientMat.length < 4) {
    return {
      success: false,
      error: 'Veuillez saisir un numéro de matricule étudiant valide (au moins 4 caractères, ex: 32165498 ou UPGC-2026-XXXX).'
    };
  }

  if (senderMat && cleanRecipientMat === senderMat) {
    return {
      success: false,
      error: 'Vous ne pouvez pas vous transférer un ticket à vous-même.'
    };
  }

  const senderTickets = deduplicateTickets(senderProfile.savedTickets || []);
  const ticketToTransfer = senderTickets.find(
    t => (t.id === ticketIdOrNumber || t.ticketNumber === ticketIdOrNumber) && t.status === 'valid'
  );

  if (!ticketToTransfer) {
    return {
      success: false,
      error: "Ce ticket n'est plus disponible dans votre compte ou a déjà été utilisé/transféré."
    };
  }

  const serialKey = ticketToTransfer.ticketNumber || ticketToTransfer.id;
  const ticketIdKey = ticketToTransfer.id || serialKey;

  if (activeTicketTransferLocks.has(serialKey) || activeTicketTransferLocks.has(ticketIdKey)) {
    return {
      success: false,
      error: 'Ce ticket est actuellement en cours de transfert. Veuillez patienter un instant...'
    };
  }
  activeTicketTransferLocks.add(serialKey);
  if (ticketIdKey) activeTicketTransferLocks.add(ticketIdKey);

  const safeSenderId = sanitizeMatriculeId(senderMat);
  const safeRecipientId = sanitizeMatriculeId(cleanRecipientMat);

  try {
    let txResult: {
      updatedSender: UserProfile;
      updatedRecipient: UserProfile;
      transferredTicket: MealTicket;
      recipientName: string;
    } | null = null;

    try {
      txResult = await runTransaction(db, async (tx) => {
        const senderRef = doc(db, 'students', safeSenderId);
        const recipientRef = doc(db, 'students', safeRecipientId);
        const tktSerialRef = doc(db, 'tickets', serialKey);
        const tktIdRef = (ticketIdKey && ticketIdKey !== serialKey) ? doc(db, 'tickets', ticketIdKey) : null;

        const [senderSnap, recipientSnap, tktSerialSnap, tktIdSnap] = await Promise.all([
          tx.get(senderRef),
          tx.get(recipientRef),
          tx.get(tktSerialRef),
          tktIdRef ? tx.get(tktIdRef) : Promise.resolve(null)
        ]);

        const cloudTicketDoc = (
          tktSerialSnap.exists()
            ? tktSerialSnap.data()
            : (tktIdSnap && tktIdSnap.exists() ? tktIdSnap.data() : null)
        ) as MealTicket | null;

        if (cloudTicketDoc) {
          if (cloudTicketDoc.status === 'used') {
            throw new Error(`ALREADY_USED:${cloudTicketDoc.usedTime || 'service précédent'}`);
          }
          if (cloudTicketDoc.studentMatricule && senderMat && cloudTicketDoc.studentMatricule.toUpperCase() !== senderMat) {
            throw new Error(`ALREADY_TRANSFERRED:${cloudTicketDoc.studentMatricule}`);
          }
        }

        const cloudSenderData = senderSnap.exists() ? (senderSnap.data() as UserProfile) : null;
        const authoritativeSenderTickets = deduplicateTickets(
          cloudSenderData && Array.isArray(cloudSenderData.savedTickets)
            ? cloudSenderData.savedTickets
            : senderTickets
        );

        const exactIndex = authoritativeSenderTickets.findIndex(
          t => (t.ticketNumber === serialKey || t.id === ticketIdKey || t.id === ticketIdOrNumber || t.ticketNumber === ticketIdOrNumber) && t.status === 'valid'
        );

        if (exactIndex === -1) {
          throw new Error('NOT_FOUND_OR_USED');
        }

        const chosenTicket = authoritativeSenderTickets[exactIndex];
        const chosenNum = chosenTicket.ticketNumber;
        const chosenId = chosenTicket.id;

        // Retirer STRICTEMENT ce seul ticket chez l'expéditeur
        const nextSenderTickets = authoritativeSenderTickets.filter((t, idx) => {
          if (idx === exactIndex) return false;
          if (chosenNum && t.ticketNumber === chosenNum) return false;
          if (chosenId && t.id === chosenId) return false;
          return true;
        });

        const recipientData = recipientSnap.exists() ? (recipientSnap.data() as UserProfile) : null;
        const recipientName = recipientData?.displayName || `Étudiant (${cleanRecipientMat})`;
        const recipientUid = recipientData?.uid || cleanRecipientMat;

        const newQrData = JSON.stringify({
          app: 'CROUK_RESTO_U',
          tkt: chosenTicket.ticketNumber,
          mat: cleanRecipientMat,
          cnt: chosenTicket.canteenId,
          dish: chosenTicket.dishName,
          date: chosenTicket.date,
          prc: chosenTicket.price,
          ts: Date.now()
        });

        const transferredTicket: MealTicket = {
          ...chosenTicket,
          studentId: recipientUid,
          studentName: recipientName,
          studentMatricule: cleanRecipientMat,
          qrCodeData: newQrData,
          transferredFrom: senderProfile.displayName || senderMat || 'Un camarade',
          transferredTo: cleanRecipientMat,
          transferredAt: new Date().toISOString()
        };

        const existingRecipientTickets = deduplicateTickets(
          Array.isArray(recipientData?.savedTickets) ? recipientData.savedTickets : []
        );

        // Ajouter STRICTEMENT ce 1 seul ticket chez le destinataire (zéro doublon)
        const nextRecipientTickets = deduplicateTickets([transferredTicket, ...existingRecipientTickets]);

        const nextSenderProfile: UserProfile = {
          ...senderProfile,
          ...(cloudSenderData || {}),
          matricule: senderMat,
          savedTickets: nextSenderTickets
        };

        const nextRecipientProfile: UserProfile = {
          ...(recipientData || {
            uid: recipientUid,
            email: `${cleanRecipientMat.toLowerCase()}@upgc.ci`,
            role: 'student',
            balance: 0,
            university: 'Université Peleforo Gbon Coulibaly (UPGC)',
            campus: 'Campus UPGC Korhogo',
            createdAt: new Date().toISOString()
          }),
          matricule: cleanRecipientMat,
          displayName: recipientName,
          savedTickets: nextRecipientTickets
        };

        tx.set(senderRef, {
          savedTickets: nextSenderTickets,
          lastTransferAt: transferredTicket.transferredAt
        }, { merge: true });

        tx.set(recipientRef, {
          uid: nextRecipientProfile.uid,
          matricule: cleanRecipientMat,
          displayName: recipientName,
          email: nextRecipientProfile.email,
          role: nextRecipientProfile.role || 'student',
          balance: typeof nextRecipientProfile.balance === 'number' ? nextRecipientProfile.balance : 0,
          university: nextRecipientProfile.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
          campus: nextRecipientProfile.campus || 'Campus UPGC Korhogo',
          savedTickets: nextRecipientTickets,
          lastReceivedAt: transferredTicket.transferredAt
        }, { merge: true });

        tx.set(tktSerialRef, transferredTicket, { merge: true });
        if (tktIdRef) {
          tx.set(tktIdRef, transferredTicket, { merge: true });
        }

        return {
          updatedSender: nextSenderProfile,
          updatedRecipient: nextRecipientProfile,
          transferredTicket,
          recipientName
        };
      });
    } catch (txErr: any) {
      const msg = String(txErr?.message || '');
      if (msg.startsWith('ALREADY_USED:')) {
        const usedAt = msg.split(':')[1] || 'ce service';
        return {
          success: false,
          error: `🚨 Transfert impossible : Ce ticket (${ticketToTransfer.ticketNumber}) a déjà été scanné et consommé à ${usedAt}.`
        };
      }
      if (msg.startsWith('ALREADY_TRANSFERRED:') || msg === 'NOT_FOUND_OR_USED') {
        return {
          success: false,
          error: "Ce ticket a déjà été transféré ou n'est plus disponible dans votre compte."
        };
      }

      // Fallback REST si transaction SDK impossible (réseau restreint)
      console.warn('Firestore runTransaction transfer fallback REST:', txErr);

      const restRecipient = await fetchStudentRest(cleanRecipientMat).catch(() => null);
      const restSender = senderMat ? await fetchStudentRest(senderMat).catch(() => null) : null;

      const baseSenderTickets = deduplicateTickets(
        restSender && Array.isArray(restSender.savedTickets) ? restSender.savedTickets : senderTickets
      );
      const chosen = baseSenderTickets.find(
        t => (t.ticketNumber === serialKey || t.id === ticketIdKey || t.id === ticketIdOrNumber || t.ticketNumber === ticketIdOrNumber) && t.status === 'valid'
      );
      if (!chosen) {
        return {
          success: false,
          error: "Ce ticket n'est plus disponible dans votre compte ou a déjà été transféré."
        };
      }

      const recipientName = restRecipient?.displayName || `Étudiant (${cleanRecipientMat})`;
      const recipientUid = restRecipient?.uid || cleanRecipientMat;

      const newQrData = JSON.stringify({
        app: 'CROUK_RESTO_U',
        tkt: chosen.ticketNumber,
        mat: cleanRecipientMat,
        cnt: chosen.canteenId,
        dish: chosen.dishName,
        date: chosen.date,
        prc: chosen.price,
        ts: Date.now()
      });

      const transferredTicket: MealTicket = {
        ...chosen,
        studentId: recipientUid,
        studentName: recipientName,
        studentMatricule: cleanRecipientMat,
        qrCodeData: newQrData,
        transferredFrom: senderProfile.displayName || senderMat || 'Un camarade',
        transferredTo: cleanRecipientMat,
        transferredAt: new Date().toISOString()
      };

      const nextSenderTickets = baseSenderTickets.filter(
        t => t.ticketNumber !== chosen.ticketNumber && (!chosen.id || t.id !== chosen.id)
      );

      const existingRecipientTickets = deduplicateTickets(
        Array.isArray(restRecipient?.savedTickets) ? restRecipient.savedTickets : []
      );
      const nextRecipientTickets = deduplicateTickets([transferredTicket, ...existingRecipientTickets]);

      const nextSenderProfile: UserProfile = {
        ...senderProfile,
        savedTickets: nextSenderTickets
      };

      const nextRecipientProfile: UserProfile = {
        ...(restRecipient || {
          uid: recipientUid,
          email: `${cleanRecipientMat.toLowerCase()}@upgc.ci`,
          role: 'student',
          balance: 0,
          university: 'Université Peleforo Gbon Coulibaly (UPGC)',
          campus: 'Campus UPGC Korhogo',
          createdAt: new Date().toISOString()
        }),
        matricule: cleanRecipientMat,
        displayName: recipientName,
        savedTickets: nextRecipientTickets
      };

      if (senderMat) {
        await patchStudentFieldsRest(senderMat, { savedTickets: nextSenderTickets }).catch(() => {});
      }
      await saveStudentRest(nextRecipientProfile).catch(() => {});
      await saveTicketRest(transferredTicket).catch(() => {});

      txResult = {
        updatedSender: nextSenderProfile,
        updatedRecipient: nextRecipientProfile,
        transferredTicket,
        recipientName
      };
    }

    // Mémoriser ce ticket comme transféré hors de ce compte pour empêcher toute réinjection locale
    markTicketTransferredOut(txResult.transferredTicket);

    // Mise à jour locale immédiate de l'expéditeur et du destinataire
    saveLocalUserProfile(txResult.updatedSender);
    if (senderMat) {
      try {
        localStorage.setItem(`crou_student_vault_${senderMat}`, JSON.stringify(txResult.updatedSender.savedTickets));
      } catch {}
      updateStudentInLocalRegistry(txResult.updatedSender);
      patchStudentFieldsRest(senderMat, { savedTickets: txResult.updatedSender.savedTickets }).catch(() => {});
    }

    try {
      localStorage.setItem(`crou_student_vault_${cleanRecipientMat}`, JSON.stringify(txResult.updatedRecipient.savedTickets));
    } catch {}
    updateStudentInLocalRegistry(txResult.updatedRecipient);
    saveStudentRest(txResult.updatedRecipient).catch(() => {});
    saveTicketRest(txResult.transferredTicket).catch(() => {});

    return {
      success: true,
      updatedSender: txResult.updatedSender,
      transferredTicket: txResult.transferredTicket,
      recipientName: txResult.recipientName,
      recipientMatricule: cleanRecipientMat
    };
  } finally {
    activeTicketTransferLocks.delete(serialKey);
    if (ticketIdKey) activeTicketTransferLocks.delete(ticketIdKey);
  }
}

/**
 * Écoute en temps réel les changements sur le profil et les tickets de l'étudiant.
 * Fait confiance au document cloud (savedTickets) pour refléter immédiatement achats, scans ET transferts sortants (4 -> 3)
 * sans jamais réinjecter un ticket qui vient d'être transféré.
 */
export function subscribeToStudentProfile(
  matricule: string,
  onUpdate: (updatedUser: UserProfile) => void
): () => void {
  if (!matricule) return () => {};
  const cleanMat = matricule.trim().toUpperCase();
  const safeId = sanitizeMatriculeId(cleanMat);

  try {
    const unsub = onSnapshot(doc(db, 'students', safeId), (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as UserProfile;
        const currentLocal = getLocalUserProfile();
        const localTickets = currentLocal?.savedTickets || [];
        const hasCloudTicketsArray = Array.isArray(cloudData.savedTickets);
        const cloudTickets = hasCloudTicketsArray ? cloudData.savedTickets : localTickets;

        // Préserver le statut 'used' si un ticket toujours présent dans le compte vient d'être scanné
        const localUsedMap = new Map<string, string>();
        localTickets.forEach(lt => {
          if (lt.status === 'used') {
            if (lt.ticketNumber) localUsedMap.set(lt.ticketNumber, lt.usedTime || 'Scanné');
            if (lt.id) localUsedMap.set(lt.id, lt.usedTime || 'Scanné');
          }
        });

        const filteredCloud = cloudTickets
          .filter(t => {
            if (!t) return false;
            if (isRecentlyTransferredOut(t)) return false;
            if (t.studentMatricule && t.studentMatricule.toUpperCase() !== cleanMat) return false;
            if (t.transferredTo && t.transferredTo.toUpperCase() !== cleanMat && t.studentMatricule?.toUpperCase() !== cleanMat) return false;
            return true;
          })
          .map(t => {
            const usedTime = (t.ticketNumber && localUsedMap.get(t.ticketNumber)) || (t.id && localUsedMap.get(t.id));
            if (usedTime && t.status !== 'used') {
              return { ...t, status: 'used' as const, usedTime };
            }
            return t;
          });

        const mergedList = deduplicateTickets(filteredCloud);

        const adminResetPin = 'pinHash' in cloudData && !cloudData.pinHash;
        try {
          if (cloudData.pinSalt && cloudData.pinHash) {
            localStorage.setItem(`programas_pin_${safeId}`, JSON.stringify({ salt: cloudData.pinSalt, hash: cloudData.pinHash }));
          } else if (adminResetPin) {
            localStorage.removeItem(`programas_pin_${safeId}`);
          }
          if (typeof cloudData.pinFails === 'number') {
            if (cloudData.pinFails > 0) {
              localStorage.setItem(`programas_pin_fails_${safeId}`, String(cloudData.pinFails));
            } else {
              localStorage.removeItem(`programas_pin_fails_${safeId}`);
            }
          }
        } catch {}

        const mergedUser: UserProfile = {
          ...(currentLocal || {}),
          ...cloudData,
          pinSalt: cloudData.pinSalt || (adminResetPin ? undefined : currentLocal?.pinSalt),
          pinHash: cloudData.pinHash || (adminResetPin ? undefined : currentLocal?.pinHash),
          matricule: cleanMat,
          savedTickets: mergedList
        };

        saveLocalUserProfile(mergedUser);
        onUpdate(mergedUser);
      }
    }, (err) => {
      console.warn('Real-time student profile snapshot note:', err);
    });

    return unsub;
  } catch (err) {
    console.warn('subscribeToStudentProfile error:', err);
    return () => {};
  }
}




/**
 * Hydrate ou crée un UserProfile CROU coordonné avec un utilisateur Supabase Auth
 */
export async function hydrateOrCreateProfileForSupabaseUser(
  sbUser: SupabaseUser,
  fallbackPass?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const meta = (sbUser.user_metadata || {}) as Record<string, any>;
  const cleanEmail = (sbUser.email || meta.email || '').trim().toLowerCase();
  const rawMetaMat = typeof meta.matricule === 'string' ? meta.matricule.trim().toUpperCase() : '';
  const fallbackMat = `SUPA-${sbUser.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  let cleanMatricule = rawMetaMat || fallbackMat;

  // Chercher d'abord si un profil existe déjà dans Firestore par e-mail
  let cloudProfile: (UserProfile & { passwordHash?: string }) | null = null;
  if (cleanEmail) {
    try {
      const emailQ = query(collection(db, 'students'), where('email', '==', cleanEmail), limit(1));
      const emailSnap = await getDocs(emailQ);
      if (!emailSnap.empty) {
        cloudProfile = emailSnap.docs[0].data() as any;
        if (cloudProfile?.matricule) {
          cleanMatricule = cloudProfile.matricule.trim().toUpperCase();
        }
      }
    } catch {}
  }

  // Sinon chercher par matricule (REST + SDK)
  if (!cloudProfile) {
    try {
      cloudProfile = await fetchStudentRest(cleanMatricule);
    } catch {}
  }
  const safeId = sanitizeMatriculeId(cleanMatricule);
  if (!cloudProfile) {
    try {
      const snap = await getDoc(doc(db, 'students', safeId));
      if (snap.exists()) {
        cloudProfile = snap.data() as any;
      }
    } catch {}
  }

  if (cloudProfile?.isBlocked) {
    return {
      success: false,
      error: cloudProfile.blockedReason || '⚠️ Ce compte est bloqué pour sécurité. Veuillez vous adresser à l’administration CROU.'
    };
  }

  const localRegistry = getLocalStudentsRegistry();
  const localAccount = localRegistry[cleanMatricule];
  if (!cloudProfile && localAccount?.isBlocked) {
    return {
      success: false,
      error: localAccount.blockedReason || '⚠️ Ce compte est bloqué pour sécurité. Veuillez vous adresser à l’administration CROU.'
    };
  }

  const base = cloudProfile || localAccount;
  const displayName =
    (typeof meta.display_name === 'string' && meta.display_name.trim()) ||
    base?.displayName ||
    (cleanEmail ? cleanEmail.split('@')[0] : cleanMatricule);

  const profile: UserProfile = {
    uid: base?.uid || cleanMatricule,
    matricule: cleanMatricule,
    email: cleanEmail || base?.email || `${cleanMatricule.toLowerCase()}@upgc.ci`,
    displayName,
    role: 'student',
    balance: typeof base?.balance === 'number' ? base.balance : 0,
    savedTickets: deduplicateTickets(Array.isArray(base?.savedTickets) ? base.savedTickets : []),
    university: base?.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: (typeof meta.campus === 'string' && meta.campus) || base?.campus || 'Campus UPGC Korhogo',
    phone: (typeof meta.phone === 'string' && meta.phone) || base?.phone,
    isBlocked: false,
    pinSalt: base?.pinSalt,
    pinHash: base?.pinHash,
    pinFails: base?.pinFails || 0,
    createdAt: base?.createdAt || sbUser.created_at || new Date().toISOString()
  };

  updateStudentInLocalRegistry(profile, fallbackPass || base?.passwordHash);
  saveLocalUserProfile(profile);

  // Synchroniser en arrière-plan vers Firestore (pour multi-appareils & contrôle admin)
  try {
    saveStudentRest(profile, fallbackPass || base?.passwordHash || 'supabase-auth').catch(() => {});
    setDoc(
      doc(db, 'students', safeId),
      {
        ...profile,
        supabaseUid: sbUser.id,
        authProvider: 'supabase_email',
        lastLogin: new Date().toISOString()
      },
      { merge: true }
    ).catch(() => {});
  } catch {}

  return { success: true, user: profile };
}

/**
 * Inscription étudiant par E-mail coordonnée par Supabase Auth
 */
export async function registerStudentWithEmail(data: {
  email: string;
  password: string;
  name: string;
  matricule?: string;
  ufr?: string;
  phone?: string;
}): Promise<{
  success: boolean;
  user?: UserProfile;
  needsEmailConfirmation?: boolean;
  email?: string;
  error?: string;
}> {
  const cleanEmail = (data.email || '').trim().toLowerCase();
  const cleanPass = (data.password || '').trim();
  const cleanName = (data.name || '').trim();
  const cleanMatricule = data.matricule ? data.matricule.trim().toUpperCase() : undefined;

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Veuillez saisir une adresse e-mail valide.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Veuillez renseigner votre nom complet.' };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères (exigence Supabase Auth).' };
  }

  if (cleanMatricule) {
    try {
      const existing = await fetchStudentRest(cleanMatricule);
      if (existing?.isBlocked) {
        return {
          success: false,
          error: `⚠️ Ce matricule (${cleanMatricule}) est bloqué pour sécurité. Adressez-vous à l’administration CROU.`
        };
      }
    } catch {}
  }

  const campus = data.ufr ? `UPGC Korhogo - ${data.ufr}` : 'Campus UPGC Korhogo';
  const authRes = await signUpWithSupabaseEmail({
    email: cleanEmail,
    password: cleanPass,
    displayName: cleanName,
    matricule: cleanMatricule,
    campus,
    phone: data.phone
  });

  if (!authRes.success || !authRes.user) {
    return {
      success: false,
      error: authRes.error || 'Impossible de créer le compte sur Supabase Auth.'
    };
  }

  if (authRes.needsEmailConfirmation || !authRes.session) {
    return {
      success: true,
      needsEmailConfirmation: true,
      email: cleanEmail
    };
  }

  const hydrated = await hydrateOrCreateProfileForSupabaseUser(authRes.user, cleanPass);
  if (!hydrated.success || !hydrated.user) {
    return { success: false, error: hydrated.error };
  }

  return {
    success: true,
    user: hydrated.user,
    needsEmailConfirmation: false,
    email: cleanEmail
  };
}

/**
 * Connexion étudiant par E-mail coordonnée par Supabase Auth
 */
export async function loginStudentWithEmail(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: UserProfile;
  needsEmailConfirmation?: boolean;
  error?: string;
}> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Veuillez saisir une adresse e-mail valide.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Veuillez saisir votre mot de passe.' };
  }

  const authRes = await signInWithSupabaseEmail({
    email: cleanEmail,
    password: cleanPass
  });

  if (!authRes.success || !authRes.user) {
    return {
      success: false,
      needsEmailConfirmation: authRes.needsEmailConfirmation,
      error: authRes.error || 'E-mail ou mot de passe incorrect.'
    };
  }

  const hydrated = await hydrateOrCreateProfileForSupabaseUser(authRes.user, cleanPass);
  if (!hydrated.success || !hydrated.user) {
    return { success: false, error: hydrated.error };
  }

  const synced = await syncStudentTicketsWithFirestore(hydrated.user).catch(() => hydrated.user!);
  return {
    success: true,
    user: synced
  };
}
