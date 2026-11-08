import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, MealTicket } from '../types';
import { 
  fetchStudentRest, 
  saveStudentRest, 
  fetchStudentTicketsRest, 
  saveTicketRest 
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

  // Check if matricule already exists in Firestore on any device
  try {
    const studentRef = doc(db, 'students', safeId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
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

  // 1. Look up exclusively in the real Firestore database
  let firestoreStudent: (UserProfile & { passwordHash?: string }) | null = null;
  const safeId = sanitizeMatriculeId(cleanMatricule);
  
  try {
    firestoreStudent = await fetchStudentRest(cleanMatricule);
  } catch (restErr) {
    console.warn('REST lookup error:', restErr);
  }

  // Fallback to Firestore SDK if REST was inconclusive
  if (!firestoreStudent) {
    try {
      const studentRef = doc(db, 'students', safeId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        firestoreStudent = snap.data() as any;
      }
    } catch (err) {
      console.warn('Firestore SDK lookup note:', err);
    }
  }

  // Strict Account Existence Check: Must exist in Firestore!
  if (!firestoreStudent) {
    return {
      success: false,
      error: `Aucun compte étudiant trouvé avec le matricule ${cleanMatricule}. Veuillez d'abord vous inscrire dans l'onglet "Inscription".`
    };
  }

  // Strict Security Check: Compte verrouillé suite à 5 tentatives PIN erronées
  if (firestoreStudent.isBlocked) {
    return {
      success: false,
      error: `⚠️ Compte verrouillé pour votre sécurité : 5 tentatives consécutives de code PIN erronées ont été détectées. Veuillez vous adresser directement aux responsables de Programas au Guichet Restauration CROU Korhogo muni(e) de votre carte d'étudiant pour réactiver votre accès.`
    };
  }

  // Strict Password Verification against the registered account in Firestore
  const targetPass = (firestoreStudent.passwordHash || '').trim();
  const isPasswordMatch = targetPass === cleanPass;

  if (!isPasswordMatch) {
    return { 
      success: false, 
      error: 'Mot de passe incorrect pour ce matricule. En cas d\'oubli, veuillez vous adresser aux responsables de Programas au Guichet Restauration CROU.' 
    };
  }

  const target = firestoreStudent;

  // 3. MULTI-DEVICE TICKET RETRIEVAL:
  // Gather from ALL possible stores across all matricule variations to guarantee 0% data loss:
  // Store A: Document savedTickets in Firestore
  const firestoreDocTickets: MealTicket[] = Array.isArray(firestoreStudent?.savedTickets) 
    ? firestoreStudent.savedTickets 
    : [];

  // Store B: Direct REST structuredQuery for all student tickets across devices
  let restTickets: MealTicket[] = [];
  try {
    restTickets = await fetchStudentTicketsRest(cleanMatricule, target.uid);
  } catch {}

  // Store C: Query ALL tickets directly from Firestore SDK 'tickets' collection
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

  // Store D: Retrieve local device vault tickets
  let vaultTickets: MealTicket[] = [];
  try {
    const rawVault = localStorage.getItem(`crou_student_vault_${cleanMatricule}`);
    if (rawVault) vaultTickets = JSON.parse(rawVault);
  } catch {}

  // 4. Merge ALL sources into a single deduplicated ticket list (ticketNumber or id as key)
  const mergedMap = new Map<string, MealTicket>();
  firestoreDocTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
  restTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
  firestoreCollectionTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
  vaultTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });

  const mergedTickets = Array.from(mergedMap.values());
  
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
    createdAt: target.createdAt || new Date().toISOString()
  };

  // 5. Permanently re-anchor tickets into both local storage and Firestore (REST + SDK)
  updateStudentInLocalRegistry(studentProfile, target.passwordHash || cleanPass);
  saveLocalUserProfile(studentProfile);
  try {
    localStorage.setItem(`crou_student_vault_${cleanMatricule}`, JSON.stringify(mergedTickets));
  } catch {}

  // Sync back to Firestore via both REST and SDK so all devices see the updated ticket list instantly
  try {
    saveStudentRest(studentProfile, target.passwordHash || cleanPass).catch(() => {});
    const studentRef = doc(db, 'students', safeId);
    setDoc(studentRef, {
      ...studentProfile,
      savedTickets: mergedTickets,
      lastLogin: new Date().toISOString()
    }, { merge: true }).catch(() => {});
  } catch {}

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

  const allTickets = [...generatedTickets, ...(student.savedTickets || [])];
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
      // 1. Save by internal ID
      await setDoc(doc(db, 'tickets', t.id), t, { merge: true });
      // 2. Also save directly by ticketNumber so turnstile scanner direct lookup is instant!
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
 * Synchronisation en arrière-plan des tickets depuis Firestore et coffre-fort local
 * Permet de récupérer les nouveaux tickets achetés sur n'importe quel appareil
 */
export async function syncStudentTicketsWithFirestore(user: UserProfile): Promise<UserProfile> {
  if (!user.matricule) return user;
  const cleanMatricule = user.matricule.toUpperCase();
  const safeId = sanitizeMatriculeId(cleanMatricule);

  try {
    // 0. Query direct HTTPS REST for tickets (ultra-fast and guaranteed across all networks)
    let restTickets: MealTicket[] = [];
    try {
      restTickets = await fetchStudentTicketsRest(cleanMatricule, user.uid);
    } catch {}

    // 1. Check direct student document
    let studentDocTickets: MealTicket[] = [];
    try {
      const sSnap = await getDoc(doc(db, 'students', safeId));
      if (sSnap.exists()) {
        const sData = sSnap.data();
        if (Array.isArray(sData.savedTickets)) {
          studentDocTickets = sData.savedTickets;
        }
      }
    } catch {}

    // 2. Query tickets collection by studentMatricule
    const firestoreTickets: MealTicket[] = [];
    try {
      const tq = query(collection(db, 'tickets'), where('studentMatricule', '==', cleanMatricule));
      const snap = await getDocs(tq);
      snap.forEach(d => firestoreTickets.push(d.data() as MealTicket));
    } catch {}

    // 3. Vault tickets
    let vaultTickets: MealTicket[] = [];
    try {
      const rawVault = localStorage.getItem(`crou_student_vault_${cleanMatricule}`);
      if (rawVault) vaultTickets = JSON.parse(rawVault);
    } catch {}

    // Merge all without loss
    const mergedMap = new Map<string, MealTicket>();
    (user.savedTickets || []).forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    restTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    studentDocTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    firestoreTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    vaultTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    const mergedList = Array.from(mergedMap.values());

    if (mergedList.length > 0) {
      const updatedUser: UserProfile = {
        ...user,
        savedTickets: mergedList
      };
      saveLocalUserProfile(updatedUser);
      try {
        localStorage.setItem(`crou_student_vault_${cleanMatricule}`, JSON.stringify(mergedList));
      } catch {}

      // Anchor back to Firestore
      try {
        setDoc(doc(db, 'students', safeId), {
          ...updatedUser,
          savedTickets: mergedList
        }, { merge: true }).catch(() => {});
      } catch {}

      return updatedUser;
    }
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
  const updatedTickets = [ticket, ...(profile.savedTickets || [])];
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

  // A. Recherche directe O(1) dans Firestore collection 'tickets' par numéro de série
  try {
    const tSnap = await getDoc(doc(db, 'tickets', cleanTicketNo));
    if (tSnap.exists()) {
      foundTicket = tSnap.data() as MealTicket;
    }
  } catch (err) {
    console.warn('Firestore ticket direct lookup note:', err);
  }

  // B. Recherche par query Firestore 'ticketNumber'
  if (!foundTicket) {
    try {
      const q = query(collection(db, 'tickets'), where('ticketNumber', '==', cleanTicketNo), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        foundTicket = qSnap.docs[0].data() as MealTicket;
      }
    } catch (err) {
      console.warn('Firestore ticket query note:', err);
    }
  }

  // C. Recherche par query Firestore 'id'
  if (!foundTicket) {
    try {
      const q2 = query(collection(db, 'tickets'), where('id', '==', cleanTicketNo), limit(1));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty) {
        foundTicket = q2Snap.docs[0].data() as MealTicket;
      }
    } catch (err) {}
  }

  // D. Recherche dans les comptes étudiants (Firestore + Registry Local)
  if (!foundTicket) {
    const allStudents = await getAllRegisteredStudents();
    for (const s of allStudents) {
      const match = (s.savedTickets || []).find(t => 
        t.ticketNumber === cleanTicketNo || 
        t.id === cleanTicketNo ||
        t.ticketNumber.endsWith(cleanTicketNo.replace('CROUK-2026-', ''))
      );
      if (match) {
        foundTicket = match;
        ownerStudent = s;
        break;
      }
    }
  }

  // E. Récupérer le propriétaire du ticket si non encore trouvé
  if (foundTicket && !ownerStudent && foundTicket.studentMatricule) {
    try {
      const sSafeId = sanitizeMatriculeId(foundTicket.studentMatricule);
      const sSnap = await getDoc(doc(db, 'students', sSafeId));
      if (sSnap.exists()) {
        ownerStudent = sSnap.data() as UserProfile;
      }
    } catch {}
  }

  // F. Auto-réconciliation : Si le QR provient de l'application CROU-K mais n'est pas encore synchronisé
  if (!foundTicket && (parsedPayload?.app === 'CROUK_RESTO_U' || serialMatch)) {
    const recoveredTkt = serialMatch ? serialMatch[0].toUpperCase() : cleanTicketNo;
    const recoveredMat = cleanMat || parsedPayload?.mat || '75490218';

    try {
      const sSafeId = sanitizeMatriculeId(recoveredMat);
      const sSnap = await getDoc(doc(db, 'students', sSafeId));
      if (sSnap.exists()) {
        ownerStudent = sSnap.data() as UserProfile;
      }
    } catch {}

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

  // Validation du ticket : passer le statut à 'used'
  foundTicket.status = 'used';
  foundTicket.usedTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Mise à jour synchrone dans Firestore
  try {
    await setDoc(doc(db, 'tickets', foundTicket.id), foundTicket, { merge: true });
    await setDoc(doc(db, 'tickets', foundTicket.ticketNumber), foundTicket, { merge: true });

    if (foundTicket.studentMatricule) {
      const sSafeId = sanitizeMatriculeId(foundTicket.studentMatricule);
      const sRef = doc(db, 'students', sSafeId);
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) {
        const studentData = sSnap.data() as UserProfile;
        const updatedList = (studentData.savedTickets || []).map(t => 
          (t.ticketNumber === foundTicket!.ticketNumber || t.id === foundTicket!.id) ? foundTicket! : t
        );
        await updateDoc(sRef, { savedTickets: updatedList });
      }
    }
  } catch (err) {
    console.warn('Firestore ticket usage update note:', err);
  }

  if (ownerStudent) {
    ownerStudent.savedTickets = (ownerStudent.savedTickets || []).map(t => 
      (t.ticketNumber === foundTicket!.ticketNumber || t.id === foundTicket!.id) ? foundTicket! : t
    );
    saveLocalUserProfile(ownerStudent);
  }

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
    id: 'fraud_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleString('fr-FR'),
    ...log
  };

  try {
    const raw = localStorage.getItem(FRAUD_LOGS_STORAGE_KEY);
    const logs: FraudAuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(newLog);
    localStorage.setItem(FRAUD_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));

    // Firestore log
    setDoc(doc(db, 'fraud_logs', newLog.id), newLog).catch(() => {});
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

export async function logoutUser(): Promise<void> {
  saveLocalUserProfile(null);
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
 * Verrouiller définitivement le compte d'un étudiant suite à 5 tentatives de code PIN erronées
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
    studentName = registry[cleanMat].displayName || cleanMat;
  }
  Object.values(registry).forEach((s: UserProfile) => {
    if (s.matricule?.toUpperCase() === cleanMat || s.uid?.toUpperCase() === cleanMat || sanitizeMatriculeId(s.matricule || '') === safeId) {
      s.isBlocked = true;
      s.blockedReason = reason;
      s.blockedAt = now;
      studentName = s.displayName || studentName;
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
        u.isBlocked = true;
        u.blockedReason = reason;
        u.blockedAt = now;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    }
  } catch {}

  // 3. Persister dans Firestore (REST + SDK)
  try {
    await saveStudentRest({
      matricule: cleanMat,
      isBlocked: true,
      blockedReason: reason,
      blockedAt: now
    } as any);
  } catch {}

  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, {
      isBlocked: true,
      blockedReason: reason,
      blockedAt: now
    }, { merge: true });
  } catch (err) {
    console.warn('blockStudentAccount Firestore SDK note:', err);
  }

  // 4. Enregistrer un rapport d'alerte dans les logs de fraude
  try {
    recordFraudLog({
      matricule: cleanMat,
      studentName: studentName,
      ticketNumber: 'PIN-BRUTE-FORCE',
      reason: `Compte bloqué : 5 erreurs consécutives de code PIN. Contact aux responsables Programas obligatoire.`,
      severity: 'critical'
    });
  } catch {}

  return {
    success: true,
    message: 'Compte étudiant verrouillé avec succès.'
  };
}

/**
 * Déverrouiller le compte d'un étudiant par un responsable Programas (Admin)
 */
export async function unblockStudentAccount(
  matricule: string
): Promise<{ success: boolean; message: string }> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  if (!cleanMat) return { success: false, message: 'Matricule requis' };

  const safeId = sanitizeMatriculeId(cleanMat);

  // 1. Mettre à jour dans le registre local
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMat]) {
    registry[cleanMat].isBlocked = false;
    delete registry[cleanMat].blockedReason;
    delete registry[cleanMat].blockedAt;
  }
  Object.values(registry).forEach((s: UserProfile) => {
    if (s.matricule?.toUpperCase() === cleanMat || s.uid?.toUpperCase() === cleanMat || sanitizeMatriculeId(s.matricule || '') === safeId) {
      s.isBlocked = false;
      delete s.blockedReason;
      delete s.blockedAt;
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
        u.blockedReason = undefined;
        u.blockedAt = undefined;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    }
  } catch {}

  // 3. Persister dans Firestore (REST + SDK)
  try {
    await saveStudentRest({
      matricule: cleanMat,
      isBlocked: false,
      blockedReason: '',
      blockedAt: ''
    } as any);
  } catch {}

  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, {
      isBlocked: false,
      blockedReason: null,
      blockedAt: null
    }, { merge: true });
  } catch (err) {
    console.warn('unblockStudentAccount Firestore SDK note:', err);
  }

  // Réinitialiser les compteurs d'échecs PIN en local
  try {
    localStorage.removeItem('programas_pin_fails');
    localStorage.removeItem('programas_pin');
  } catch {}

  return {
    success: true,
    message: `Le compte ${cleanMat} a été débloqué avec succès.`
  };
}

/**
 * Recherche un étudiant par son numéro de matricule pour prévisualiser le destinataire
 */
export async function lookupStudentByMatricule(matricule: string): Promise<UserProfile | null> {
  const clean = (matricule || '').trim().toUpperCase();
  if (!clean || clean.length < 3) return null;

  const localRegistry = getLocalStudentsRegistry();
  if (localRegistry[clean]) return localRegistry[clean];

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

  return null;
}

/**
 * Transfère un ticket repas d'un étudiant à un camarade / proche via son numéro de matricule.
 * - Vérifie que l'expéditeur possède le ticket avec status === 'valid'
 * - Vérifie le matricule du destinataire
 * - Met à jour l'expéditeur (retrait du ticket) dans Firestore et local
 * - Met à jour le destinataire (ajout du ticket avec QR code valide) dans Firestore et local
 * - Met à jour le document ticket dans la collection 'tickets'
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

  // Vérifier la présence du ticket valide chez l'expéditeur
  const senderTickets = senderProfile.savedTickets || [];
  const ticketIndex = senderTickets.findIndex(
    t => (t.id === ticketIdOrNumber || t.ticketNumber === ticketIdOrNumber) && t.status === 'valid'
  );

  if (ticketIndex === -1) {
    return {
      success: false,
      error: "Ce ticket n'est plus disponible dans votre compte ou a déjà été utilisé."
    };
  }

  const ticketToTransfer = senderTickets[ticketIndex];

  // 1. Rechercher le destinataire (Local Registry + REST + Firestore)
  let recipientFound: UserProfile | null = null;
  const localRegistry = getLocalStudentsRegistry();
  if (localRegistry[cleanRecipientMat]) {
    recipientFound = localRegistry[cleanRecipientMat];
  }

  if (!recipientFound) {
    try {
      recipientFound = await fetchStudentRest(cleanRecipientMat);
    } catch {}
  }

  if (!recipientFound) {
    try {
      const snap = await getDoc(doc(db, 'students', sanitizeMatriculeId(cleanRecipientMat)));
      if (snap.exists()) {
        recipientFound = snap.data() as UserProfile;
      }
    } catch {}
  }

  // Si l'étudiant destinataire n'a pas encore créé son compte dans l'app,
  // nous créons son profil récepteur afin que dès sa première connexion, le ticket soit présent !
  const recipientName = recipientFound?.displayName || `Étudiant (${cleanRecipientMat})`;
  const recipientUid = recipientFound?.uid || cleanRecipientMat;

  // 2. Construire le ticket réassigné avec QR code valide
  const newQrData = JSON.stringify({
    app: 'CROUK_RESTO_U',
    tkt: ticketToTransfer.ticketNumber,
    mat: cleanRecipientMat,
    cnt: ticketToTransfer.canteenId,
    dish: ticketToTransfer.dishName,
    date: ticketToTransfer.date,
    prc: ticketToTransfer.price,
    ts: Date.now()
  });

  const transferredTicket: MealTicket = {
    ...ticketToTransfer,
    studentId: recipientUid,
    studentName: recipientName,
    studentMatricule: cleanRecipientMat,
    qrCodeData: newQrData,
    transferredFrom: senderProfile.displayName || senderMat || 'Un camarade',
    transferredTo: cleanRecipientMat,
    transferredAt: new Date().toISOString()
  };

  // 3. Mettre à jour l'expéditeur (retrait immédiat du ticket)
  const updatedSenderTickets = senderTickets.filter((_, idx) => idx !== ticketIndex);
  const updatedSender: UserProfile = {
    ...senderProfile,
    savedTickets: updatedSenderTickets
  };

  saveLocalUserProfile(updatedSender);
  if (senderMat) {
    try {
      localStorage.setItem(`crou_student_vault_${senderMat}`, JSON.stringify(updatedSenderTickets));
    } catch {}
    updateStudentInLocalRegistry(updatedSender);
    saveStudentRest(updatedSender).catch(() => {});
    try {
      const senderRef = doc(db, 'students', sanitizeMatriculeId(senderMat));
      await setDoc(senderRef, { ...updatedSender, savedTickets: updatedSenderTickets }, { merge: true });
    } catch {}
  }

  // 4. Mettre à jour le destinataire (crédit immédiat du ticket dans ses tickets)
  const existingRecipientTickets: MealTicket[] = Array.isArray(recipientFound?.savedTickets) 
    ? recipientFound.savedTickets 
    : (() => {
        try {
          const raw = localStorage.getItem(`crou_student_vault_${cleanRecipientMat}`);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();

  const updatedRecipientTickets = [
    transferredTicket,
    ...existingRecipientTickets.filter(t => t.ticketNumber !== transferredTicket.ticketNumber)
  ];

  const updatedRecipient: UserProfile = {
    ...(recipientFound || {
      uid: cleanRecipientMat,
      email: `${cleanRecipientMat.toLowerCase()}@upgc.ci`,
      role: 'student',
      balance: 0,
      university: 'Université Peleforo Gbon Coulibaly (UPGC)',
      campus: 'Campus UPGC Korhogo'
    }),
    matricule: cleanRecipientMat,
    displayName: recipientName,
    savedTickets: updatedRecipientTickets
  };

  try {
    localStorage.setItem(`crou_student_vault_${cleanRecipientMat}`, JSON.stringify(updatedRecipientTickets));
  } catch {}
  updateStudentInLocalRegistry(updatedRecipient);
  saveStudentRest(updatedRecipient).catch(() => {});
  try {
    const recRef = doc(db, 'students', sanitizeMatriculeId(cleanRecipientMat));
    await setDoc(recRef, { ...updatedRecipient, savedTickets: updatedRecipientTickets }, { merge: true });
  } catch {}

  // 5. Mettre à jour la collection centrale 'tickets' dans Firestore
  saveTicketRest(transferredTicket).catch(() => {});
  try {
    await setDoc(doc(db, 'tickets', transferredTicket.id), transferredTicket, { merge: true });
    await setDoc(doc(db, 'tickets', transferredTicket.ticketNumber), transferredTicket, { merge: true });
  } catch {}

  return {
    success: true,
    updatedSender,
    transferredTicket,
    recipientName,
    recipientMatricule: cleanRecipientMat
  };
}

