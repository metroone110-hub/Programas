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

const DISHES_COLLECTION = 'crou_dishes';
const LOCAL_DISHES_KEY = 'crou_published_dishes';

// STRICT RULE: No hardcoded dishes. The administration has 100% control over the menu.
export const DEFAULT_UPGC_DISHES: Dish[] = [];

/**
 * Get cached dishes from localStorage.
 * If empty or null, strictly returns an empty array [].
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
 * Real-time subscription to dishes in Firestore across ALL connected devices.
 * If collection is empty, the menu is strictly empty [].
 */
export function subscribeToDishes(onUpdate: (dishes: Dish[]) => void): () => void {
  try {
    const dishesCol = collection(db, DISHES_COLLECTION);
    
    const unsubscribe = onSnapshot(dishesCol, (snapshot) => {
      if (snapshot.empty) {
        setLocalCachedDishes([]);
        onUpdate([]);
      } else {
        const fetchedDishes: Dish[] = [];
        snapshot.forEach((docSnap) => {
          fetchedDishes.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Dish, 'id'>)
          });
        });
        
        // Sort so newer/available dishes appear nicely
        fetchedDishes.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0));
        
        setLocalCachedDishes(fetchedDishes);
        onUpdate(fetchedDishes);
      }
    }, (error) => {
      console.warn('Firestore dishes onSnapshot notice (using local fallback):', error);
      onUpdate(getLocalCachedDishes());
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach Firestore snapshot:', err);
    onUpdate(getLocalCachedDishes());
    return () => {};
  }
}

/**
 * Publish a new dish from Administration to Firestore (synchronizes with all devices)
 */
export async function publishDishToFirestore(dish: Dish): Promise<void> {
  const current = getLocalCachedDishes();
  const updated = [dish, ...current.filter(d => d.id !== dish.id)];
  setLocalCachedDishes(updated);

  try {
    const dishRef = doc(db, DISHES_COLLECTION, dish.id);
    await setDoc(dishRef, dish, { merge: true });
  } catch (err) {
    console.error('Failed to sync dish to Firestore:', err);
  }
}

/**
 * Toggle dish availability in Firestore
 */
export async function toggleDishAvailabilityInFirestore(dishId: string, isAvailable: boolean): Promise<void> {
  const current = getLocalCachedDishes();
  const updated = current.map(d => d.id === dishId ? { ...d, isAvailable } : d);
  setLocalCachedDishes(updated);

  try {
    const dishRef = doc(db, DISHES_COLLECTION, dishId);
    await updateDoc(dishRef, { isAvailable });
  } catch (err) {
    console.warn('Failed to update dish availability in Firestore:', err);
  }
}

/**
 * Delete a single dish in Firestore permanently
 */
export async function removeDishFromFirestore(dishId: string): Promise<void> {
  const current = getLocalCachedDishes();
  const updated = current.filter(d => d.id !== dishId);
  setLocalCachedDishes(updated);

  try {
    const dishRef = doc(db, DISHES_COLLECTION, dishId);
    await deleteDoc(dishRef);
  } catch (err) {
    console.warn('Failed to delete dish from Firestore:', err);
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
      await deleteDoc(doc(db, DISHES_COLLECTION, docSnap.id));
    }
  } catch (err) {
    console.warn('Failed to clear dishes from Firestore:', err);
  }
}
