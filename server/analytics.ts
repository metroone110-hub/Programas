import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

export interface DailyStat {
  date: string; // YYYY-MM-DD
  visits: number;
  uniqueVisitors: number;
  interactions: number;
  shares: number;
  visitorsSet?: string[]; // stored temporarily for unique count per day
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'visit' | 'interaction' | 'share';
  action: string;
  label: string;
  device?: string;
  details?: Record<string, any>;
}

export interface AnalyticsData {
  totalVisits: number;
  totalUniqueVisitors: number;
  totalInteractions: number;
  totalShares: number;
  uniqueVisitorsList: string[]; // List of anonymous visitor IDs
  sharesBreakdown: {
    whatsapp: number;
    linkCopied: number;
    systemShare: number;
  };
  interactionsBreakdown: {
    favoriteToggle: number;
    menuView: number;
    dateSwitch: number;
    notificationToggle: number;
    dishSearch: number;
    hoursView: number;
  };
  deviceBreakdown: {
    android: number;
    ios: number;
    desktop: number;
    other: number;
  };
  dailyStats: Record<string, DailyStat>; // Keyed by YYYY-MM-DD
  recentEvents: ActivityEvent[];
  lastUpdated: string;
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalVisits: 0,
  totalUniqueVisitors: 0,
  totalInteractions: 0,
  totalShares: 0,
  uniqueVisitorsList: [],
  sharesBreakdown: {
    whatsapp: 0,
    linkCopied: 0,
    systemShare: 0,
  },
  interactionsBreakdown: {
    favoriteToggle: 0,
    menuView: 0,
    dateSwitch: 0,
    notificationToggle: 0,
    dishSearch: 0,
    hoursView: 0,
  },
  deviceBreakdown: {
    android: 0,
    ios: 0,
    desktop: 0,
    other: 0,
  },
  dailyStats: {},
  recentEvents: [],
  lastUpdated: new Date().toISOString(),
};

function ensureAnalyticsFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ANALYTICS_FILE)) {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(DEFAULT_ANALYTICS, null, 2), 'utf-8');
  }
}

export function getAnalyticsData(): AnalyticsData {
  try {
    ensureAnalyticsFile();
    const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ANALYTICS,
      ...parsed,
      sharesBreakdown: { ...DEFAULT_ANALYTICS.sharesBreakdown, ...(parsed.sharesBreakdown || {}) },
      interactionsBreakdown: { ...DEFAULT_ANALYTICS.interactionsBreakdown, ...(parsed.interactionsBreakdown || {}) },
      deviceBreakdown: { ...DEFAULT_ANALYTICS.deviceBreakdown, ...(parsed.deviceBreakdown || {}) },
      dailyStats: parsed.dailyStats || {},
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents : [],
    };
  } catch (error) {
    console.error('Error reading analytics file:', error);
    return { ...DEFAULT_ANALYTICS };
  }
}

export function saveAnalyticsData(data: AnalyticsData): void {
  try {
    ensureAnalyticsFile();
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving analytics file:', error);
  }
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface TrackPayload {
  visitorId: string;
  type: 'visit' | 'interaction' | 'share';
  action: string;
  device?: string;
  metadata?: Record<string, any>;
}

export function recordAnalyticsEvent(payload: TrackPayload): AnalyticsData {
  const data = getAnalyticsData();
  const today = getTodayString();

  // Initialize today stat if not present
  if (!data.dailyStats[today]) {
    data.dailyStats[today] = {
      date: today,
      visits: 0,
      uniqueVisitors: 0,
      interactions: 0,
      shares: 0,
      visitorsSet: [],
    };
  }
  const todayStat = data.dailyStats[today];
  if (!Array.isArray(todayStat.visitorsSet)) {
    todayStat.visitorsSet = [];
  }

  // Handle unique visitor calculation
  const isGlobalNewVisitor = !data.uniqueVisitorsList.includes(payload.visitorId);
  if (isGlobalNewVisitor && payload.visitorId) {
    data.uniqueVisitorsList.push(payload.visitorId);
    data.totalUniqueVisitors = data.uniqueVisitorsList.length;
  }

  const isTodayNewVisitor = !todayStat.visitorsSet.includes(payload.visitorId);
  if (isTodayNewVisitor && payload.visitorId) {
    todayStat.visitorsSet.push(payload.visitorId);
    todayStat.uniqueVisitors = todayStat.visitorsSet.length;
  }

  // Device detection update
  if (payload.device) {
    const dev = payload.device.toLowerCase();
    if (dev.includes('android')) data.deviceBreakdown.android++;
    else if (dev.includes('iphone') || dev.includes('ios') || dev.includes('ipad')) data.deviceBreakdown.ios++;
    else if (dev.includes('mac') || dev.includes('win') || dev.includes('linux') || dev.includes('desktop')) data.deviceBreakdown.desktop++;
    else data.deviceBreakdown.other++;
  }

  let humanLabel = '';

  // Classify event
  if (payload.type === 'visit') {
    data.totalVisits++;
    todayStat.visits++;
    humanLabel = isTodayNewVisitor ? 'Nouveau visiteur sur l’app' : 'Visite de l’application';
  } else if (payload.type === 'share') {
    data.totalShares++;
    todayStat.shares++;

    if (payload.action === 'whatsapp_share') {
      data.sharesBreakdown.whatsapp++;
      humanLabel = `Partage du menu sur WhatsApp (${payload.metadata?.service || 'repas'})`;
    } else if (payload.action === 'link_copied') {
      data.sharesBreakdown.linkCopied++;
      humanLabel = 'Lien de l’app copié pour partage';
    } else {
      data.sharesBreakdown.systemShare++;
      humanLabel = 'Partage système de l’application';
    }
  } else if (payload.type === 'interaction') {
    data.totalInteractions++;
    todayStat.interactions++;

    switch (payload.action) {
      case 'favorite_toggle':
        data.interactionsBreakdown.favoriteToggle++;
        humanLabel = payload.metadata?.dish 
          ? `Plat favori : « ${payload.metadata.dish} »` 
          : 'Gestion des plats favoris';
        break;
      case 'menu_view':
        data.interactionsBreakdown.menuView++;
        humanLabel = `Consultation du menu (${payload.metadata?.date || today})`;
        break;
      case 'date_switch':
        data.interactionsBreakdown.dateSwitch++;
        humanLabel = 'Navigation dans l’historique des jours';
        break;
      case 'notification_toggle':
        data.interactionsBreakdown.notificationToggle++;
        humanLabel = payload.metadata?.slot 
          ? `Test de notification Duolingo (${payload.metadata.slot})` 
          : 'Configuration des alertes de repas';
        break;
      case 'dish_search':
        data.interactionsBreakdown.dishSearch++;
        humanLabel = payload.metadata?.query 
          ? `Recherche de plat : « ${payload.metadata.query} »` 
          : 'Recherche de plats';
        break;
      case 'hours_view':
        data.interactionsBreakdown.hoursView++;
        humanLabel = 'Consultation des horaires & tarifs (200 FCFA)';
        break;
      default:
        humanLabel = payload.action;
    }
  }

  // Prepend event to recent events log (keep max 30)
  const newEvent: ActivityEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    type: payload.type,
    action: payload.action,
    label: humanLabel,
    device: payload.device,
    details: payload.metadata,
  };

  data.recentEvents.unshift(newEvent);
  if (data.recentEvents.length > 30) {
    data.recentEvents = data.recentEvents.slice(0, 30);
  }

  // Keep dailyStats clean (last 30 days)
  const keys = Object.keys(data.dailyStats).sort();
  if (keys.length > 30) {
    const toRemove = keys.slice(0, keys.length - 30);
    for (const k of toRemove) {
      delete data.dailyStats[k];
    }
  }

  saveAnalyticsData(data);
  return data;
}

export function resetAnalyticsData(): AnalyticsData {
  const fresh = { ...DEFAULT_ANALYTICS, lastUpdated: new Date().toISOString() };
  saveAnalyticsData(fresh);
  return fresh;
}
