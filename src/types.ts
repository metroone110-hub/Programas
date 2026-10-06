export type MealCategory = 'entree' | 'plat' | 'vegetarien' | 'accompagnement' | 'dessert';

export type DietaryTag = 
  | 'veggie' 
  | 'vegan' 
  | 'bio' 
  | 'fait_maison' 
  | 'viande_francaise' 
  | 'local' 
  | 'sans_porc' 
  | 'halal';

export interface MenuItem {
  id: string;
  title: string;
  description?: string;
  category: MealCategory;
  tags: DietaryTag[];
  allergens?: string[];
  priceExtra?: string; // ex: "+0,50€" pour option premium
  isAvailable: boolean;
}

export type ServiceType = 'dejeuner' | 'diner';

export interface ServiceMenu {
  id?: string;
  date: string; // format YYYY-MM-DD
  service: ServiceType;
  theme?: string;
  items: MenuItem[];
  publishedAt?: string;
}

export interface RestaurantPricing {
  ticketUnique?: number; // 200 FCFA pour tout le monde
  boursier: number;
  nonBoursier: number;
  personnel: number;
  visiteur: number;
  currency: string;
}

export interface AuthStatus {
  isConfigured: boolean;
  username?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}

export interface CommunityCrowdData {
  currentLevel: 'fluide' | 'moyen' | 'fort';
  totalVotes: number;
  lastVoteAt?: string;
  votes: {
    fluide: number;
    moyen: number;
    fort: number;
  };
}

export interface RestaurantHours {
  midi: string;
  soir: string;
  weekEnd: string;
  crowdLevel: 'faible' | 'moyen' | 'fort';
  customStatus?: string;
}

export interface RestaurantData {
  id: string;
  name: string;
  subname: string;
  campus: string;
  address: string;
  announcement: string;
  paymentMethods: string[];
  pricing: RestaurantPricing;
  hours: RestaurantHours;
  currentMenu: ServiceMenu;
  menuHistory?: ServiceMenu[];
  crowdReport?: CommunityCrowdData;
  updatedAt: string;
}

export interface ScanMenuResult {
  date?: string;
  service?: ServiceType;
  theme?: string;
  items: Array<{
    title: string;
    category: MealCategory;
    description?: string;
    tags?: DietaryTag[];
    allergens?: string[];
    priceExtra?: string;
  }>;
  pricing?: Partial<RestaurantPricing>;
  detectedNotes?: string;
}
