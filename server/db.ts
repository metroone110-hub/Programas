import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RestaurantData } from '../src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'menu.json');

const INITIAL_DATA: RestaurantData = {
  id: 'crou-k-resto-upgc',
  name: 'Programas',
  subname: 'Resto U UPGC Korhogo • CROU-K',
  campus: 'Campus Principal UPGC, Korhogo (Côte d’Ivoire)',
  address: 'BP 1328 Korhogo, Région du Poro, Côte d’Ivoire',
  announcement: '🇨🇮 Bienvenue sur Programas - Resto U UPGC Korhogo (CROU-K)',
  paymentMethods: ['Tickets CROU-K', 'Wave', 'Orange Money', 'MTN Mobile Money', 'Moov Money'],
  pricing: {
    ticketUnique: 200, // 200 FCFA pour tout le monde
    boursier: 200,
    nonBoursier: 200,
    personnel: 200,
    visiteur: 200,
    currency: 'FCFA'
  },
  hours: {
    midi: '11h30 - 14h30',
    soir: '18h30 - 21h00',
    weekEnd: 'Fermé le dimanche (Service réduit samedi midi)',
    crowdLevel: 'faible',
    customStatus: 'En attente de publication du menu'
  },
  currentMenu: {
    date: new Date().toISOString().split('T')[0],
    service: 'dejeuner',
    theme: '',
    items: [] // Zéro plat par défaut tant que le gestionnaire ne publie pas
  },
  updatedAt: new Date().toISOString()
};

function ensureDbFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
}

export function getRestaurantData(): RestaurantData {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur de lecture de la base de données:', error);
    return INITIAL_DATA;
  }
}

export function saveRestaurantData(data: RestaurantData): boolean {
  try {
    ensureDbFile();
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la base de données:', error);
    return false;
  }
}

export function resetToDefaults(): RestaurantData {
  ensureDbFile();
  const resetData: RestaurantData = {
    ...INITIAL_DATA,
    currentMenu: {
      date: new Date().toISOString().split('T')[0],
      service: 'dejeuner',
      theme: '',
      items: []
    },
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(resetData, null, 2), 'utf-8');
  return resetData;
}
