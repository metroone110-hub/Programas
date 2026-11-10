import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, MealTicket, Dish } from '../types';

const config = firebaseConfig as any;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId || '(default)'}/documents`;
const API_KEY = config.apiKey;

/**
 * Convertit un champ typé Firestore REST ({ stringValue: 'x' }) en valeur JavaScript pure
 */
export function fromFirestoreRestValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map(fromFirestoreRestValue);
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = fromFirestoreRestValue(v);
    }
    return res;
  }
  return val;
}

/**
 * Convertit une valeur JavaScript en format typé Firestore REST
 */
export function toFirestoreRestValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreRestValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreRestDoc(doc: any): any {
  if (!doc || !doc.fields) return null;
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    res[k] = fromFirestoreRestValue(v);
  }
  return res;
}

export function toFirestoreRestFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreRestValue(v);
    }
  }
  return fields;
}

/**
 * Récupère un étudiant via l'API REST officielle Firestore (HTTPS direct sans WebSocket/WebChannel)
 * Teste le matricule exact, sans zéro initial et avec zéro initial.
 */
export async function fetchStudentRest(matricule: string): Promise<(UserProfile & { passwordHash?: string }) | null> {
  const clean = (matricule || '').trim().toUpperCase();
  if (!clean) return null;

  const unpadded = clean.replace(/^0+/, '');
  const zeroPadded = '0' + unpadded;
  const candidates = Array.from(new Set([clean, unpadded, zeroPadded]));

  for (const cand of candidates) {
    try {
      const url = `${BASE_URL}/students/${encodeURIComponent(cand)}?key=${API_KEY}`;
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const docJson = await res.json();
        const data = fromFirestoreRestDoc(docJson);
        if (data && (data.matricule || data.uid)) {
          return {
            uid: data.uid || cand,
            matricule: data.matricule || cand,
            displayName: data.displayName || `Étudiant (${cand})`,
            email: data.email || `${cand.toLowerCase()}@upgc.ci`,
            role: data.role || 'student',
            balance: typeof data.balance === 'number' ? data.balance : 0,
            savedTickets: Array.isArray(data.savedTickets) ? data.savedTickets : [],
            university: data.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
            campus: data.campus || 'Campus UPGC Korhogo',
            phone: data.phone || '',
            passwordHash: data.passwordHash,
            createdAt: data.createdAt || new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.warn('REST fetch student attempt failed for cand:', cand, err);
    }
  }

  return null;
}

/**
 * Sauvegarde ou met à jour un profil étudiant dans Firestore via l'API REST (UPSERT garanti)
 */
export async function saveStudentRest(student: UserProfile, passwordHash?: string): Promise<boolean> {
  if (!student.matricule) return false;
  const safeId = student.matricule.trim().toUpperCase();

  const dataToSave: Record<string, any> = {
    uid: student.uid || safeId,
    matricule: safeId,
    displayName: student.displayName || `Étudiant (${safeId})`,
    email: student.email || `${safeId.toLowerCase()}@upgc.ci`,
    role: student.role || 'student',
    balance: typeof student.balance === 'number' ? student.balance : 0,
    savedTickets: student.savedTickets || [],
    university: student.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: student.campus || 'Campus UPGC Korhogo',
    phone: student.phone || '',
    lastSync: new Date().toISOString()
  };

  if (passwordHash) {
    dataToSave.passwordHash = passwordHash;
  } else {
    // Si passwordHash n'est pas fourni, tenter de préserver celui du registre local
    try {
      const reg = JSON.parse(localStorage.getItem('crou_local_students_registry') || '{}');
      if (reg[safeId]?.passwordHash) {
        dataToSave.passwordHash = reg[safeId].passwordHash;
      }
    } catch {}
  }

  // UpdateMask garantit que SEULS les champs spécifiés sont mis à jour,
  // empêchant Firestore REST d'effacer les champs omis (comme passwordHash).
  const fieldKeys = Object.keys(dataToSave);
  const maskQuery = fieldKeys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `${BASE_URL}/students/${encodeURIComponent(safeId)}?${maskQuery}&key=${API_KEY}`;

  const payload = {
    fields: toFirestoreRestFields(dataToSave)
  };

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('REST save student failed:', err);
    return false;
  }
}

/**
 * Récupère tous les tickets d'un étudiant via REST structuredQuery
 */
export async function fetchStudentTicketsRest(matricule: string, uid?: string): Promise<MealTicket[]> {
  const clean = (matricule || '').trim().toUpperCase();
  const unpadded = clean.replace(/^0+/, '');
  const zeroPadded = '0' + unpadded;
  const variants = Array.from(new Set([clean, unpadded, zeroPadded, uid].filter(Boolean) as string[]));

  const allTickets: MealTicket[] = [];
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId || '(default)'}/documents:runQuery?key=${API_KEY}`;

  for (const matVal of variants) {
    try {
      const queryPayload = {
        structuredQuery: {
          from: [{ collectionId: 'tickets' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'studentMatricule' },
              op: 'EQUAL',
              value: { stringValue: matVal }
            }
          }
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload)
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          rows.forEach(r => {
            if (r.document) {
              const ticket = fromFirestoreRestDoc(r.document) as MealTicket;
              if (ticket && (ticket.ticketNumber || ticket.id)) {
                allTickets.push(ticket);
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('REST fetch tickets error for variant:', matVal, err);
    }
  }

  // Also query by studentId if uid is present
  if (uid) {
    try {
      const queryPayload = {
        structuredQuery: {
          from: [{ collectionId: 'tickets' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'studentId' },
              op: 'EQUAL',
              value: { stringValue: uid }
            }
          }
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload)
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          rows.forEach(r => {
            if (r.document) {
              const ticket = fromFirestoreRestDoc(r.document) as MealTicket;
              if (ticket && (ticket.ticketNumber || ticket.id)) {
                allTickets.push(ticket);
              }
            }
          });
        }
      }
    } catch {}
  }

  // Deduplicate by ticketNumber or id
  const map = new Map<string, MealTicket>();
  allTickets.forEach(t => {
    const key = t.ticketNumber || t.id;
    if (key) map.set(key, t);
  });
  return Array.from(map.values());
}

/**
 * Sauvegarde un ticket individuel dans Firestore via REST
 */
export async function saveTicketRest(ticket: MealTicket): Promise<boolean> {
  if (!ticket || (!ticket.id && !ticket.ticketNumber)) return false;
  const docId = ticket.ticketNumber || ticket.id;
  const url = `${BASE_URL}/tickets/${encodeURIComponent(docId)}?key=${API_KEY}`;

  const payload = {
    fields: toFirestoreRestFields(ticket)
  };

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('REST save ticket failed:', err);
    return false;
  }
}

/**
 * Récupère tous les plats du menu en temps réel via l'API REST officielle Firestore
 * Utilise runQuery pour récupérer immédiatement tous les documents de crou_dishes.
 */
export async function fetchDishesRest(): Promise<Dish[]> {
  // 1. Try local server endpoint /api/dishes if available
  try {
    const apiRes = await fetch('/api/dishes', { method: 'GET', cache: 'no-store' });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data?.dishes) && data.dishes.length > 0) {
        return data.dishes;
      }
    }
  } catch {}

  // 2. Direct Firestore HTTPS REST API
  const url = `${BASE_URL}:runQuery?key=${API_KEY}`;
  const queryPayload = {
    structuredQuery: {
      from: [{ collectionId: 'crou_dishes' }]
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload)
    });

    if (res.ok) {
      const rows = await res.json();
      const dishes: Dish[] = [];
      if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          if (r.document) {
            const raw = fromFirestoreRestDoc(r.document);
            if (raw && (raw.name || raw.id)) {
              const docName = r.document.name || '';
              const docId = docName.split('/').pop() || raw.id;
              const rawMeal = (raw.mealType || '').toString().toLowerCase();
              const normalizedMeal = (rawMeal === 'diner' || rawMeal === 'soir') ? 'diner' : 'dejeuner';
              const rawCat = (raw.category || '').toString();
              const normalizedCat = (rawCat === 'entree' || rawCat === 'dessert' || rawCat === 'boisson') ? rawCat : 'plat_principal';

              dishes.push({
                id: raw.id || docId,
                name: raw.name || 'Plat CROU',
                description: raw.description || '',
                category: normalizedCat as any,
                price: typeof raw.price === 'number' ? raw.price : 200,
                regularPrice: typeof raw.regularPrice === 'number' ? raw.regularPrice : 500,
                mealType: normalizedMeal,
                imageUrl: raw.imageUrl || '',
                isAvailable: raw.isAvailable !== false,
                canteenId: raw.canteenId || 'all',
                tags: Array.isArray(raw.tags) ? raw.tags : ['Distribution Officielle', 'Resto U'],
                rating: typeof raw.rating === 'number' ? raw.rating : 5.0,
                ratingCount: typeof raw.ratingCount === 'number' ? raw.ratingCount : 1
              });
            }
          }
        });
      }
      return dishes;
    }
  } catch (err) {
    console.warn('REST fetch dishes error:', err);
  }
  return [];
}

/**
 * Sauvegarde un plat dans Firestore via REST (garantie instantanée tous appareils)
 */
export async function saveDishRest(dish: Dish): Promise<boolean> {
  if (!dish || !dish.id) return false;
  const docId = dish.id.trim();

  // 1. Try /api/dishes endpoint if available
  try {
    const apiRes = await fetch('/api/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dish)
    });
    if (apiRes.ok) {
      return true;
    }
  } catch {}

  // 2. Direct Firestore HTTPS REST API
  const url = `${BASE_URL}/crou_dishes/${encodeURIComponent(docId)}?key=${API_KEY}`;

  const cleanMeal = ((dish.mealType as string) === 'diner' || (dish.mealType as string) === 'soir') ? 'diner' : 'dejeuner';
  const cleanCat = (dish.category === 'entree' || dish.category === 'dessert' || dish.category === 'boisson') ? dish.category : 'plat_principal';

  const payload = {
    fields: toFirestoreRestFields({
      id: docId,
      name: dish.name,
      description: dish.description || '',
      category: cleanCat,
      price: dish.price || 200,
      regularPrice: dish.regularPrice || 500,
      mealType: cleanMeal,
      imageUrl: dish.imageUrl || '',
      isAvailable: dish.isAvailable !== false,
      canteenId: dish.canteenId || 'all',
      tags: dish.tags || ['Distribution Officielle', 'Resto U'],
      rating: dish.rating || 5.0,
      ratingCount: dish.ratingCount || 1,
      updatedAt: new Date().toISOString()
    })
  };

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('REST save dish error:', err);
    return false;
  }
}

/**
 * Supprime un plat de Firestore via REST
 */
export async function deleteDishRest(dishId: string): Promise<boolean> {
  if (!dishId) return false;
  // 1. Try /api/dishes/:id
  try {
    await fetch(`/api/dishes/${encodeURIComponent(dishId.trim())}`, { method: 'DELETE' });
  } catch {}

  // 2. Direct Firestore REST
  const url = `${BASE_URL}/crou_dishes/${encodeURIComponent(dishId.trim())}?key=${API_KEY}`;

  try {
    const res = await fetch(url, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('REST delete dish error:', err);
    return false;
  }
}

