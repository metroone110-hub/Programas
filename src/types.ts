export type MealType = 'dejeuner' | 'diner';

export type CrowdLevel = 'faible' | 'moyen' | 'eleve';

export interface Canteen {
  id: string;
  name: string;
  campus: string;
  city: string;
  status: 'ouvert' | 'ferme' | 'bientot_ouvert';
  crowdLevel: CrowdLevel;
  waitingTimeMinutes: number;
  openingHoursDejeuner: string;
  openingHoursDiner: string;
  address: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: 'plat_principal' | 'entree' | 'dessert' | 'boisson';
  price: number; // in FCFA (e.g. 200 FCFA)
  regularPrice?: number; // non-subsidized (e.g. 1500 FCFA)
  imageUrl: string;
  isAvailable: boolean;
  mealType: MealType;
  canteenId: string;
  calories?: number;
  tags: string[];
  allergens?: string[];
  rating?: number;
  ratingCount?: number;
}

export interface MealTicket {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentMatricule: string;
  canteenId: string;
  canteenName: string;
  dishName: string;
  mealType: MealType;
  date: string;
  price: number;
  status: 'valid' | 'used' | 'cancelled';
  qrCodeData: string;
  purchaseTime: string;
  usedTime?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  matricule?: string;
  phone?: string;
  university?: string;
  campus?: string;
  role: 'student' | 'admin' | 'staff';
  balance: number; // In FCFA
  savedTickets: MealTicket[];
  createdAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'recharge' | 'ticket_purchase' | 'refund';
  amount: number;
  paymentMethod: 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Solde CROU';
  date: string;
  status: 'success' | 'pending' | 'failed';
  reference: string;
}
