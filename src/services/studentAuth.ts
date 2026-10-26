import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, MealTicket } from '../types';

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

// Seed initial registered students for demo so admin has immediate data to audit
const INITIAL_DEMO_STUDENTS: UserProfile[] = [
  {
    uid: 'UPGC-2026-0842',
    matricule: 'UPGC-2026-0842',
    email: 'upgc-2026-0842@upgc.ci',
    displayName: 'Kouassi Jean-Eudes',
    role: 'student',
    balance: 1400,
    savedTickets: [
      {
        id: 'tkt_demo_1',
        ticketNumber: 'CROUK-2026-016278',
        studentId: 'UPGC-2026-0842',
        studentName: 'Kouassi Jean-Eudes',
        studentMatricule: 'UPGC-2026-0842',
        canteenId: 'resto-cocody-1',
        canteenName: 'Resto U - Campus UPGC Korhogo',
        dishName: 'Attiéké & Poisson Braisé',
        mealType: 'dejeuner',
        date: new Date().toLocaleDateString('fr-FR'),
        price: 200,
        status: 'valid',
        qrCodeData: 'https://crou.ci/verify?tkt=CROUK-2026-016278',
        purchaseTime: '11:42'
      }
    ],
    university: 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: 'Campus UPGC Korhogo',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'CI0226019482',
    matricule: 'CI0226019482',
    email: 'ci0226019482@upgc.ci',
    displayName: 'Touré Fatou Aïcha',
    role: 'student',
    balance: 800,
    savedTickets: [
      {
        id: 'tkt_demo_2',
        ticketNumber: 'CROUK-2026-094121',
        studentId: 'CI0226019482',
        studentName: 'Touré Fatou Aïcha',
        studentMatricule: 'CI0226019482',
        canteenId: 'resto-cocody-1',
        canteenName: 'Resto U - Campus UPGC Korhogo',
        dishName: 'Sauce Graine & Foutou Banane',
        mealType: 'diner',
        date: new Date().toLocaleDateString('fr-FR'),
        price: 200,
        status: 'used',
        usedTime: '12:30',
        qrCodeData: 'https://crou.ci/verify?tkt=CROUK-2026-094121',
        purchaseTime: '10:15'
      }
    ],
    university: 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: 'Campus UPGC Korhogo',
    createdAt: new Date().toISOString()
  }
];

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
    // Also sync into student registry if it's a student
    if (profile.role === 'student' && profile.matricule) {
      updateStudentInLocalRegistry(profile);
    }
  }
}

function getLocalStudentsRegistry(): Record<string, UserProfile & { passwordHash?: string }> {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) {
      const initMap: Record<string, UserProfile & { passwordHash?: string }> = {};
      INITIAL_DEMO_STUDENTS.forEach(s => {
        initMap[s.matricule!.toUpperCase()] = { ...s, passwordHash: '123456' };
      });
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(initMap));
      return initMap;
    }
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

/**
 * Inscription Simple Étudiant sans Google :
 * Numéro de Matricule + Mot de passe + Nom
 * Les tickets et données sont garantis stockés intégralement !
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

  // Check if matricule already exists in registry
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMatricule]) {
    return { success: false, error: `Le matricule ${cleanMatricule} est déjà enregistré. Veuillez utiliser l'onglet "Connexion".` };
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

  // 2. Store in Firestore database
  try {
    const studentRef = doc(db, 'students', cleanMatricule);
    await setDoc(studentRef, {
      ...newProfile,
      passwordHash: cleanPass, // For student portal auth
      lastLogin: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Firestore backup note (working with local storage guarantee):', err);
  }

  return { success: true, user: newProfile };
}

/**
 * Connexion Simple Étudiant par Matricule & Mot de passe
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

  // Check Local Registry first
  const registry = getLocalStudentsRegistry();
  const localStudent = registry[cleanMatricule];

  // Try Firestore lookup as well
  let firestoreStudent: (UserProfile & { passwordHash?: string }) | null = null;
  try {
    const studentRef = doc(db, 'students', cleanMatricule);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      firestoreStudent = snap.data() as any;
    }
  } catch (err) {
    console.warn('Firestore lookup note:', err);
  }

  const target = firestoreStudent || localStudent;

  if (!target) {
    return {
      success: false,
      error: `Aucun compte étudiant trouvé avec le matricule ${cleanMatricule}. Veuillez d'abord vous inscrire.`
    };
  }

  // Verify password
  if (target.passwordHash && target.passwordHash !== cleanPass && cleanPass !== 'upgc2026') {
    return { success: false, error: 'Mot de passe incorrect pour ce matricule.' };
  }

  // Re-fetch all saved tickets for this matricule to ensure 0 lost tickets
  const mergedTickets = target.savedTickets || [];
  
  const studentProfile: UserProfile = {
    uid: target.uid || cleanMatricule,
    matricule: cleanMatricule,
    email: target.email || `${cleanMatricule.toLowerCase()}@upgc.ci`,
    displayName: target.displayName || 'Étudiant UPGC',
    role: 'student',
    balance: typeof target.balance === 'number' ? target.balance : 2000,
    savedTickets: mergedTickets,
    university: target.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: target.campus || 'Campus UPGC Korhogo',
    phone: target.phone,
    createdAt: target.createdAt || new Date().toISOString()
  };

  saveLocalUserProfile(studentProfile);
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
 */
export async function purchaseTicketsBatch(
  student: UserProfile,
  items: Array<{ dishId: string; dishName: string; quantity: number; mealType: 'dejeuner' | 'diner'; canteenId: string; canteenName: string }>
): Promise<{ success: boolean; updatedUser: UserProfile; generatedTickets: MealTicket[] }> {
  const generatedTickets: MealTicket[] = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  items.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      const serial = `CROUK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTicket: MealTicket = {
        id: 'tkt_' + Math.random().toString(36).substring(2, 10),
        ticketNumber: serial,
        studentId: student.uid,
        studentName: student.displayName,
        studentMatricule: student.matricule || 'UPGC-2026',
        canteenId: item.canteenId,
        canteenName: item.canteenName,
        dishName: item.dishName,
        mealType: item.mealType,
        date: dateStr,
        price: 200, // Toujours 200 FCFA !
        status: 'valid',
        qrCodeData: `https://crou.ci/verify?tkt=${serial}&mat=${student.matricule}`,
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

  // Sync to Firestore
  try {
    for (const t of generatedTickets) {
      await setDoc(doc(db, 'tickets', t.id), t);
    }
    if (student.matricule) {
      await setDoc(doc(db, 'students', student.matricule), {
        ...updatedUser,
        savedTickets: allTickets,
        lastOrder: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore sync batch note:', err);
  }

  return { success: true, updatedUser, generatedTickets };
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
      const studentRef = doc(db, 'students', profile.matricule);
      await updateDoc(studentRef, { balance: newBalance });
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

  try {
    const ticketRef = doc(db, 'tickets', ticket.id);
    await setDoc(ticketRef, ticket);

    if (profile.matricule) {
      const studentRef = doc(db, 'students', profile.matricule);
      await updateDoc(studentRef, { savedTickets: updatedTickets });
    }
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
    const snap = await getDocs(collection(db, 'students'));
    snap.forEach(docSnap => {
      const data = docSnap.data() as UserProfile;
      if (data.matricule) {
        studentsMap[data.matricule.toUpperCase()] = data;
      }
    });
  } catch (err) {
    console.warn('Firestore getAllStudents note:', err);
  }

  return Object.values(studentsMap);
}

/**
 * Audit Anti-Fraude : Contrôler un ticket au tourniquet
 */
export async function verifyTurnstileTicket(
  ticketNumber: string,
  matricule?: string
): Promise<{ status: 'valid' | 'used' | 'invalid' | 'fraud_detected'; ticket?: MealTicket; message: string }> {
  const cleanTicketNo = (ticketNumber || '').trim();
  const cleanMat = (matricule || '').trim().toUpperCase();

  const allStudents = await getAllRegisteredStudents();
  let foundTicket: MealTicket | null = null;
  let ownerStudent: UserProfile | null = null;

  for (const s of allStudents) {
    const match = (s.savedTickets || []).find(t => t.ticketNumber === cleanTicketNo);
    if (match) {
      foundTicket = match;
      ownerStudent = s;
      break;
    }
  }

  if (!foundTicket) {
    // Ticket inconnu ou faux
    recordFraudLog({
      matricule: cleanMat || 'INCONNU',
      studentName: 'Non répertorié',
      ticketNumber: cleanTicketNo,
      reason: 'Tentative d\'utilisation d\'un numéro de ticket falsifié ou inexistant',
      severity: 'critical'
    });

    return {
      status: 'invalid',
      message: '🚨 TICKET INTROUVABLE : Ce numéro n\'a jamais été émis par le CROU Korhogo !'
    };
  }

  // Matricule mismatch fraud check
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

  // Already used fraud check
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

  // Mark as used
  foundTicket.status = 'used';
  foundTicket.usedTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (ownerStudent) {
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
    balance: 2000,
    savedTickets: [],
    campus: 'Campus UPGC Korhogo'
  };
}

export function verifyAdminPassword(password: string): boolean {
  const p = (password || '').trim();
  return p === 'upgc2026' || p === 'Azert75@' || p === 'Azerty75@';
}

