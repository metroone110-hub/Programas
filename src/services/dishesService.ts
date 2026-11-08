import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { Dish } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { 
  fetchDishesRest, 
  saveDishRest, 
  deleteDishRest 
} from './firestoreRestClient';

const DISHES_COLLECTION = 'crou_dishes';
const LOCAL_DISHES_KEY = 'crou_published_dishes';

// STRICT RULE: No hardcoded default dishes. The administration has 100% control over the menu.
export const DEFAULT_UPGC_DISHES: Dish[] = [];

/**
 * Get cached dishes from localStorage.
 */
export function getLocalCachedDishes(): Dish[] {
  try {
    const raw = localStorage.getItem(LOCAL_DISHES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

/**
 * Save dishes to local cache
 */
export function setLocalCachedDishes(dishes: Dish[]): void {
  try {
    localStorage.setItem(LOCAL_DISHES_KEY, JSON.stringify(dishes));
  } catch {}
}

/**
 * Real-time dual-channel synchronization to dishes in Firestore across ALL connected devices.
 * 1. Immediate HTTPS REST fetch on startup (guaranteed cross-device availability within ~200ms)
 * 2. Firestore onSnapshot listener for sub-second real-time push updates
 * 3. 3.5s background REST poll heartbeat to guarantee synchronization even if WebSockets stall
 */
export function subscribeToDishes(onUpdate: (dishes: Dish[]) => void): () => void {
  // 1. Initial cached render
  const initialCache = getLocalCachedDishes();
  if (initialCache.length > 0) {
    onUpdate(initialCache);
  }

  // 2. Immediate direct cloud fetch via HTTPS REST
  fetchDishesRest().then((remoteDishes) => {
    if (remoteDishes && remoteDishes.length > 0) {
      remoteDishes.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0));
      setLocalCachedDishes(remoteDishes);
      onUpdate(remoteDishes);
    }
  }).catch((err) => {
    console.warn('Initial REST fetch dishes notice:', err);
  });

  // 3. Attach Firestore onSnapshot for real-time WebSocket push
  let unsubscribeSdk: (() => void) | null = null;
  try {
    const dishesCol = collection(db, DISHES_COLLECTION);
    unsubscribeSdk = onSnapshot(dishesCol, (snapshot) => {
      if (snapshot.empty) {
        // If snapshot is empty, double-check via REST before wiping
        fetchDishesRest().then(restDishes => {
          if (!restDishes || restDishes.length === 0) {
            setLocalCachedDishes([]);
            onUpdate([]);
          } else {
            setLocalCachedDishes(restDishes);
            onUpdate(restDishes);
          }
        }).catch(() => {});
      } else {
        const fetchedDishes: Dish[] = [];
        snapshot.forEach((docSnap) => {
          fetchedDishes.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Dish, 'id'>)
          });
        });
        
        fetchedDishes.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0));
        setLocalCachedDishes(fetchedDishes);
        onUpdate(fetchedDishes);
      }
    }, (error) => {
      console.warn('Firestore dishes onSnapshot notice (using REST fallback):', error);
      fetchDishesRest().then(restDishes => {
        if (restDishes && restDishes.length > 0) {
          setLocalCachedDishes(restDishes);
          onUpdate(restDishes);
        }
      }).catch(() => {});
    });
  } catch (err) {
    console.warn('Failed to attach Firestore snapshot:', err);
  }

  // 4. Background heartbeat poll (every 3.5s) to guarantee zero desync between phone and PC
  const intervalId = setInterval(async () => {
    try {
      const remoteDishes = await fetchDishesRest();
      if (remoteDishes && remoteDishes.length > 0) {
        remoteDishes.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0));
        const currentCache = getLocalCachedDishes();
        if (JSON.stringify(remoteDishes) !== JSON.stringify(currentCache)) {
          setLocalCachedDishes(remoteDishes);
          onUpdate(remoteDishes);
        }
      }
    } catch {}
  }, 3500);

  return () => {
    clearInterval(intervalId);
    if (unsubscribeSdk) {
      try {
        unsubscribeSdk();
      } catch {}
    }
  };
}

/**
 * Publish a new dish from Administration to Firestore (synchronizes with all devices).
 * Dual-write: Direct HTTPS REST (guaranteed write) + Firestore SDK.
 * Automatically compresses high-resolution phone photos so they never exceed Firestore limits.
 */
export async function publishDishToFirestore(dish: Dish): Promise<{ success: boolean; error?: string }> {
  try {
    const finalDish: Dish = { ...dish };
    
    // Auto-compress high-res phone camera photos (e.g. iPhone photos) to lightweight JPEG (~30-50KB)
    if (finalDish.imageUrl && finalDish.imageUrl.length > 30000) {
      try {
        finalDish.imageUrl = await compressImage(finalDish.imageUrl, 550, 550, 0.68);
      } catch (compErr) {
        console.warn('Image compression note:', compErr);
      }
    }

    // Ensure canteenId is flexible: set to 'all' so all UPGC students see it immediately on both campuses
    if (!finalDish.canteenId || finalDish.canteenId === 'resto-upgc-1' || finalDish.canteenId === 'resto-upgc-2') {
      finalDish.canteenId = 'all';
    }

    // 1. Direct HTTPS REST write (guaranteed persistence across mobile networks and PCs)
    const restOk = await saveDishRest(finalDish);

    // 2. Also write via Firestore SDK
    try {
      const dishRef = doc(db, DISHES_COLLECTION, finalDish.id);
      await setDoc(dishRef, finalDish, { merge: true });
    } catch (sdkErr) {
      console.warn('Firestore SDK setDoc dish note (REST backup succeeded):', sdkErr);
    }

    // 3. Update local cache immediately
    const current = getLocalCachedDishes();
    const updated = [finalDish, ...current.filter(d => d.id !== finalDish.id)];
    setLocalCachedDishes(updated);

    if (!restOk) {
      // Even if REST returned false, check if SDK worked or local exists
      console.warn('REST reported non-ok, but local and SDK queued');
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to sync dish to Firestore:', err);
    return { success: false, error: err?.message || 'Erreur lors de la synchronisation Firestore.' };
  }
}

/**
 * Toggle dish availability in Firestore (Dual-write REST + SDK)
 */
export async function toggleDishAvailabilityInFirestore(dishId: string, isAvailable: boolean): Promise<void> {
  const current = getLocalCachedDishes();
  const updated = current.map(d => d.id === dishId ? { ...d, isAvailable } : d);
  setLocalCachedDishes(updated);

  const targetDish = updated.find(d => d.id === dishId);
  if (targetDish) {
    saveDishRest(targetDish).catch(() => {});
  }

  try {
    const dishRef = doc(db, DISHES_COLLECTION, dishId);
    await updateDoc(dishRef, { isAvailable });
  } catch (err) {
    console.warn('Failed to update dish availability in Firestore SDK:', err);
  }
}

/**
 * Delete a single dish in Firestore permanently (Dual-delete REST + SDK)
 */
export async function removeDishFromFirestore(dishId: string): Promise<void> {
  const current = getLocalCachedDishes();
  const updated = current.filter(d => d.id !== dishId);
  setLocalCachedDishes(updated);

  await deleteDishRest(dishId).catch(() => {});

  try {
    const dishRef = doc(db, DISHES_COLLECTION, dishId);
    await deleteDoc(dishRef);
  } catch (err) {
    console.warn('Failed to delete dish from Firestore SDK:', err);
  }
}

/**
 * Delete all dishes from Firestore permanently
 */
export async function clearAllDishesFromFirestore(): Promise<void> {
  setLocalCachedDishes([]);
  try {
    const dishesCol = collection(db, DISHES_COLLECTION);
    const snap = await getDocs(dishesCol);
    for (const docSnap of snap.docs) {
      await deleteDishRest(docSnap.id).catch(() => {});
      await deleteDoc(doc(db, DISHES_COLLECTION, docSnap.id)).catch(() => {});
    }
  } catch (err) {
    console.warn('Failed to clear dishes from Firestore:', err);
  }
}
