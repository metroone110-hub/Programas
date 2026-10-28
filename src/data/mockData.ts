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

// Par défaut, aucun plat pré-rempli : l'administration CROU publie le menu du jour avec date et heure
export const INITIAL_DISHES: Dish[] = [];
