import { Canteen, Dish } from '../types';

export const INITIAL_CANTEENS: Canteen[] = [
  {
    id: 'resto-upgc-1',
    name: 'Resto U 1 - Campus Principal (UPGC)',
    campus: 'Université Peleforo Gon Coulibaly',
    city: 'Korhogo',
    status: 'ouvert',
    crowdLevel: 'faible',
    waitingTimeMinutes: 6,
    openingHoursDejeuner: '11h30 - 14h30',
    openingHoursDiner: '18h30 - 21h00',
    address: 'Campus UPGC, Route de Dikodougou, Korhogo'
  },
  {
    id: 'resto-upgc-2',
    name: 'Resto U 2 - Cité Universitaire (CROUK)',
    campus: 'CROU Korhogo',
    city: 'Korhogo',
    status: 'ouvert',
    crowdLevel: 'moyen',
    waitingTimeMinutes: 10,
    openingHoursDejeuner: '11h30 - 14h30',
    openingHoursDiner: '18h30 - 21h00',
    address: 'Face aux Résidences Universitaires CROUK, Korhogo'
  },
  {
    id: 'resto-cocody-1',
    name: 'Resto U 1 - Campus Cocody (FHB)',
    campus: 'Université Félix Houphouët-Boigny',
    city: 'Abidjan',
    status: 'ouvert',
    crowdLevel: 'moyen',
    waitingTimeMinutes: 12,
    openingHoursDejeuner: '11h30 - 14h30',
    openingHoursDiner: '18h30 - 21h00',
    address: 'Près du Hall 1 & Amphi Montesquieu, Cocody'
  },
  {
    id: 'resto-cocody-2',
    name: 'Resto U 2 - Bâtiment Central (FHB)',
    campus: 'Université Félix Houphouët-Boigny',
    city: 'Abidjan',
    status: 'ouvert',
    crowdLevel: 'faible',
    waitingTimeMinutes: 5,
    openingHoursDejeuner: '11h30 - 14h30',
    openingHoursDiner: '18h30 - 21h00',
    address: 'Face à la Grande Bibliothèque Universitaire'
  },
  {
    id: 'resto-abobo-adjame',
    name: 'Resto U Abobo-Adjamé (UNA)',
    campus: 'Université Nangui Abrogoua',
    city: 'Abidjan',
    status: 'ouvert',
    crowdLevel: 'eleve',
    waitingTimeMinutes: 25,
    openingHoursDejeuner: '11h30 - 14h30',
    openingHoursDiner: '18h30 - 20h30',
    address: 'Entrée principale campus UNA, Abobo'
  }
];

export const INITIAL_DISHES: Dish[] = [
  {
    id: 'dish-tchiep-poulet',
    name: 'Tchiep Poulet CROU',
    description: 'Riz au gras parfumé aux épices locales, cuisse de poulet braisée dorée et bananes plantains frites.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    calories: 650,
    tags: ['Plat Chaud', 'Poulet braisé', 'CROU-K'],
    allergens: [],
    rating: 4.9,
    ratingCount: 380
  },
  {
    id: 'dish-sauce-graine',
    name: 'Sauce Graine & Foutou',
    description: 'Onctueuse sauce à base de pulpe de noix de palme mijotée avec bœuf tendre et boule de foutou banane.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    calories: 780,
    tags: ['Plat Chaud', 'Traditionnel', 'Viande de bœuf'],
    allergens: [],
    rating: 4.8,
    ratingCount: 418
  },
  {
    id: 'dish-alloco-poisson',
    name: 'Alloco & Poisson Braisé',
    description: 'Poisson capitaine ou carpe braisé au feu de bois, accompagné de bananes plantains frites bien dorées et sauce tomate oignons.',
    category: 'plat_principal',
    price: 200,
    regularPrice: 500,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    mealType: 'diner',
    canteenId: 'resto-upgc-1',
    calories: 590,
    tags: ['Spécialité Ivoirienne', 'Poisson braisé', 'Alloco'],
    allergens: ['Poisson'],
    rating: 4.9,
    ratingCount: 290
  },
  {
    id: 'dish-salade-fruits',
    name: 'Salade de Fruits du Poro',
    description: 'Salade vitaminée de mangues fraîches du Grand Nord, ananas sucrés, papaye et zestes de citron.',
    category: 'dessert',
    price: 200,
    regularPrice: 300,
    imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    mealType: 'dejeuner',
    canteenId: 'resto-upgc-1',
    calories: 180,
    tags: ['Dessert & Fraîcheur', 'Fruits locaux', 'Vitamines'],
    allergens: [],
    rating: 4.7,
    ratingCount: 185
  }
];
