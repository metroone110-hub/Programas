import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RestaurantData, ServiceMenu } from '../src/types.ts';

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
    id: `${new Date().toISOString().split('T')[0]}-dejeuner`,
    date: new Date().toISOString().split('T')[0],
    service: 'dejeuner',
    theme: '',
    items: [], // Zéro plat par défaut tant que le gestionnaire ne publie pas
    publishedAt: new Date().toISOString()
  },
  menuHistory: [],
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

/**
 * OPTION A: Automatic strict cleanup after 3 days.
 * Any menu older than 3 days is permanently purged from the database.
 */
export function purgeMenusOlderThanThreeDays(data: RestaurantData): boolean {
  if (!Array.isArray(data.menuHistory)) {
    data.menuHistory = [];
    return false;
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - 3);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const beforeCount = data.menuHistory.length;
  // Keep only today, yesterday, 2 days ago, 3 days ago (or future scheduled menus)
  data.menuHistory = data.menuHistory.filter((m) => m.date >= cutoffStr);

  return data.menuHistory.length !== beforeCount;
}

export function getRestaurantData(): RestaurantData {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed: RestaurantData = JSON.parse(raw);
    
    // Ensure menuHistory is initialized
    if (!Array.isArray(parsed.menuHistory)) {
      parsed.menuHistory = [];
    }

    // If currentMenu has items and is not yet in history, add it
    if (parsed.currentMenu && Array.isArray(parsed.currentMenu.items) && parsed.currentMenu.items.length > 0) {
      const exists = parsed.menuHistory.some(
        m => m.date === parsed.currentMenu.date && m.service === parsed.currentMenu.service
      );
      if (!exists) {
        parsed.menuHistory.unshift({
          ...parsed.currentMenu,
          publishedAt: parsed.currentMenu.publishedAt || parsed.updatedAt || new Date().toISOString()
        });
      }
    }

    // OPTION A: Purge anything older than 3 days
    const changed = purgeMenusOlderThanThreeDays(parsed);
    if (changed) {
      saveRestaurantData(parsed);
    }

    parsed.crowdReport = getCurrentCrowdReport();

    return parsed;
  } catch (error) {
    console.error('Erreur de lecture de la base de données:', error);
    return { ...INITIAL_DATA, crowdReport: getCurrentCrowdReport() };
  }
}

interface StoredCrowdVote {
  level: 'fluide' | 'moyen' | 'fort';
  timestamp: number;
}

let communityVotes: StoredCrowdVote[] = [
  { level: 'fluide', timestamp: Date.now() - 4 * 60 * 1000 }
];

export function recordCrowdVote(level: 'fluide' | 'moyen' | 'fort') {
  const now = Date.now();
  communityVotes.push({ level, timestamp: now });
  return getCurrentCrowdReport();
}

export function getCurrentCrowdReport() {
  const now = Date.now();
  const cutoff = now - 25 * 60 * 1000; // votes des 25 dernières minutes
  communityVotes = communityVotes.filter(v => v.timestamp >= cutoff);

  const counts = {
    fluide: 0,
    moyen: 0,
    fort: 0
  };

  for (const v of communityVotes) {
    if (counts[v.level] !== undefined) {
      counts[v.level]++;
    }
  }

  const total = communityVotes.length;
  let currentLevel: 'fluide' | 'moyen' | 'fort' = 'fluide';

  if (total > 0) {
    if (counts.fort >= counts.moyen && counts.fort >= counts.fluide) {
      currentLevel = 'fort';
    } else if (counts.moyen >= counts.fluide) {
      currentLevel = 'moyen';
    } else {
      currentLevel = 'fluide';
    }
  }

  const lastVote = communityVotes[communityVotes.length - 1];

  return {
    currentLevel,
    totalVotes: total,
    lastVoteAt: lastVote ? new Date(lastVote.timestamp).toISOString() : new Date().toISOString(),
    votes: counts
  };
}

export function saveRestaurantData(data: RestaurantData): boolean {
  try {
    ensureDbFile();
    // Enforce 3-day purge before saving
    purgeMenusOlderThanThreeDays(data);
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la base de données:', error);
    return false;
  }
}

/**
 * Publishes a menu: sets it as current and archives it in history with exact date and timestamp.
 * Purges any menus older than 3 days.
 */
export function publishMenuWithHistory(menu: ServiceMenu): RestaurantData {
  const data = getRestaurantData();
  
  if (!menu.publishedAt) {
    menu.publishedAt = new Date().toISOString();
  }
  if (!menu.id) {
    menu.id = `${menu.date}-${menu.service}`;
  }

  if (!Array.isArray(data.menuHistory)) {
    data.menuHistory = [];
  }

  // Update existing history entry or insert new one
  const existingIndex = data.menuHistory.findIndex(
    m => m.date === menu.date && m.service === menu.service
  );

  if (existingIndex >= 0) {
    data.menuHistory[existingIndex] = { ...menu };
  } else {
    data.menuHistory.unshift({ ...menu });
  }

  // Sort history descending by date, then service
  data.menuHistory.sort((a, b) => {
    if (b.date !== a.date) {
      return b.date.localeCompare(a.date);
    }
    return b.service === 'diner' ? 1 : -1;
  });

  // OPTION A: Purge anything older than 3 days
  purgeMenusOlderThanThreeDays(data);

  // Update current menu
  data.currentMenu = { ...menu };
  data.updatedAt = new Date().toISOString();

  saveRestaurantData(data);
  return data;
}

/**
 * Delete a specific menu from history
 */
export function deleteHistoricMenu(date: string, service: string): RestaurantData {
  const data = getRestaurantData();
  if (Array.isArray(data.menuHistory)) {
    data.menuHistory = data.menuHistory.filter(
      m => !(m.date === date && m.service === service)
    );
  }
  saveRestaurantData(data);
  return data;
}

export function resetToDefaults(): RestaurantData {
  ensureDbFile();
  const resetData: RestaurantData = {
    ...INITIAL_DATA,
    currentMenu: {
      id: `${new Date().toISOString().split('T')[0]}-dejeuner`,
      date: new Date().toISOString().split('T')[0],
      service: 'dejeuner',
      theme: '',
      items: [],
      publishedAt: new Date().toISOString()
    },
    menuHistory: [],
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(resetData, null, 2), 'utf-8');
  return resetData;
}
