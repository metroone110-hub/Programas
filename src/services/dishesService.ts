import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { Dish } from '../types';

const DISHES_COLLECTION = 'crou_dishes';
const LOCAL_DISHES_KEY = 'crou_published_dishes';

/**
 * Authentic UPGC CROU-K dishes for Korhogo canteens
 * Seeded automatically so any device opening the app immediately sees the menu of the day.
 */
export const DEFAULT_UPGC_DISHES: Dish[] = [
  // --- DÉJEUNER (11h30 - 14h30) ---
  {
    id: 'upgc_dish_tchep_poisson',
    name: 'Tchep Djeun au Poisson Rouge',
    description: 'Riz rouge cuisiné dans un bouillon aromatique de légumes frais, servi avec darne de poisson rouge assaisonnée et piment.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    tags: ['Menu Officiel CROU-K', 'Déjeuner Chaud'],
    rating: 4.9,
    ratingCount: 184
  },
  {
    id: 'upgc_dish_sauce_gombo',
    name: 'Riz Blanc & Sauce Gombo Frais au Bœuf',
    description: 'Sauce gombo traditionnelle gluante et savoureuse, mijotée aux morceaux de bœuf tendre et épices locales de Korhogo.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    tags: ['Traditionnel', 'Riche en Fer'],
    rating: 4.8,
    ratingCount: 142
  },
  {
    id: 'upgc_dish_attieke_poisson',
    name: 'Attiéké Frais & Poisson Grillé (Sauce Moyo)',
    description: 'Semoule de manioc fine cuite à la vapeur, accompagnée de poisson grillé croustillant et sauce tomate-oignon pimentée.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    tags: ['Spécialité Ivoirienne', 'Coup de Cœur'],
    rating: 5.0,
    ratingCount: 230
  },
  {
    id: 'upgc_dish_placali_kpala',
    name: 'Placali & Sauce Kpala (Feuilles de Baobab)',
    description: 'Pâte de manioc onctueuse servie avec sauce feuille kpala typique du Nord de la Côte d\'Ivoire et poisson fumé.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    tags: ['Terroir Nord', 'Authentique'],
    rating: 4.7,
    ratingCount: 98
  },
  {
    id: 'upgc_dish_salade_composee',
    name: 'Salade Fraîche Tomate, Concombre & Œuf Dur',
    description: 'Entrée légère et vitaminée, vinaigrette maison du chef préparée le matin même.',
    category: 'entree',
    price: 200,
    regularPrice: 300,
    imageUrl: '',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    tags: ['Entrée Fraîcheur'],
    rating: 4.6,
    ratingCount: 65
  },
  {
    id: 'upgc_dish_jus_bissap',
    name: 'Jus de Bissap & Gingembre Frais Glacé',
    description: 'Infusion de fleurs d\'hibiscus pur jus, pointe de menthe fraîche et gingembre du terroir.',
    category: 'boisson',
    price: 200,
    regularPrice: 300,
    imageUrl: '',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    tags: ['Boisson Rafraîchissante', 'Fait Maison'],
    rating: 4.9,
    ratingCount: 210
  },

  // --- DÎNER (18h30 - 21h00) ---
  {
    id: 'upgc_dish_foutou_graine',
    name: 'Foutou Banane & Sauce Graine au Poisson Fumé',
    description: 'Foutou pilé moelleux et chaud servi dans une généreuse sauce graine onctueuse mijotée au poisson fumé et crabe.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'diner',
    canteenId: 'resto-upgc-1',
    tags: ['Dîner Complet', 'Favori Étudiant'],
    rating: 4.9,
    ratingCount: 255
  },
  {
    id: 'upgc_dish_riz_poulet',
    name: 'Riz Sauce Tomate & Cuisse de Poulet Braisé',
    description: 'Riz parfumé accompagné d\'une sauce tomate mijotée aux aromates et cuisse de poulet dorée.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'diner',
    canteenId: 'resto-upgc-1',
    tags: ['Classique Resto U', 'Riche en Protéines'],
    rating: 4.8,
    ratingCount: 178
  },
  {
    id: 'upgc_dish_alloco_brochettes',
    name: 'Alloco Chaud & Brochettes de Bœuf Épicées',
    description: 'Bananes plantains mûres frites à l\'huile végétale propre, servies avec 2 brochettes de bœuf bien marinées.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'diner',
    canteenId: 'resto-upgc-1',
    tags: ['Saveur Ivoirienne', 'Dîner Énergétique'],
    rating: 4.9,
    ratingCount: 192
  },
  {
    id: 'upgc_dish_ragout_pommes',
    name: 'Ragoût de Pommes de Terre du Nord & Bœuf',
    description: 'Mijoté réconfortant aux pommes de terre fondantes, carottes et viande de bœuf braisée.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: '',
    isAvailable: true,
    mealType: 'diner',
    canteenId: 'resto-upgc-1',
    tags: ['Cuisine Familiale'],
    rating: 4.7,
    ratingCount: 88
  },
  {
    id: 'upgc_dish_salade_fruits',
    name: 'Salade de Fruits Frais de Korhogo (Mangue & Papaye)',
    description: 'Sélection de fruits mûrs de saison coupés en dés, mangues parfumées du Poro et papaye douce.',
    category: 'dessert',
    price: 200,
    regularPrice: 300,
    imageUrl: '',
    isAvailable: true,
    mealType: 'diner',
    canteenId: 'resto-upgc-1',
    tags: ['Dessert Sain', 'Vitamines'],
    rating: 4.9,
    ratingCount: 114
  },
  {
    id: 'upgc_dish_yaourt_korhogo',
    name: 'Yaourt Nature Doux de Korhogo',
    description: 'Yaourt artisanal préparé avec du lait frais de pâturages locaux, légèrement sucré à la vanille.',
    category: 'dessert',
    price: 200,
    regularPrice: 300,
    imageUrl: '',
    isAvailable: true,
    mealType: 'diner',
    canteenId: 'resto-upgc-1',
    tags: ['Produit Laitier Local'],
    rating: 4.8,
    ratingCount: 135
  }
];

/**
 * Get cached dishes from localStorage (instant rendering on boot)
 */
export function getLocalCachedDishes(): Dish[] {
  try {
    const raw = localStorage.getItem(LOCAL_DISHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_UPGC_DISHES;
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
 * If collection is empty, seeds default dishes automatically so all devices see them.
 */
export function subscribeToDishes(onUpdate: (dishes: Dish[]) => void): () => void {
  try {
    const dishesCol = collection(db, DISHES_COLLECTION);
    
    const unsubscribe = onSnapshot(dishesCol, async (snapshot) => {
      if (snapshot.empty) {
        // First time initialization in Firestore: seed default UPGC dishes
        try {
          await seedInitialDishesIfEmpty();
        } catch (e) {
          console.warn('Seeding dishes note:', e);
        }
        onUpdate(DEFAULT_UPGC_DISHES);
        setLocalCachedDishes(DEFAULT_UPGC_DISHES);
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
 * Seed initial dishes in Firestore if collection is empty
 */
export async function seedInitialDishesIfEmpty(): Promise<Dish[]> {
  try {
    const dishesCol = collection(db, DISHES_COLLECTION);
    const snap = await getDocs(dishesCol);
    if (!snap.empty) {
      const list: Dish[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<Dish, 'id'>) }));
      return list;
    }

    // Write all default dishes into Firestore
    for (const dish of DEFAULT_UPGC_DISHES) {
      const dishRef = doc(db, DISHES_COLLECTION, dish.id);
      await setDoc(dishRef, dish, { merge: true });
    }
    return DEFAULT_UPGC_DISHES;
  } catch (err) {
    console.warn('Error seeding dishes to Firestore:', err);
    return DEFAULT_UPGC_DISHES;
  }
}

/**
 * Publish a new dish from Administration to Firestore (synchronizes with all devices)
 */
export async function publishDishToFirestore(dish: Dish): Promise<void> {
  // Update local cache immediately
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
 * Delete a dish in Firestore
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
