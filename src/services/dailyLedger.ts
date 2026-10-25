import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MealTicket } from '../types';

export interface DailyLedgerStats {
  date: string; // YYYY-MM-DD
  formattedDate: string; // ex: Dimanche 25 Octobre 2026
  totalTicketsSold: number;
  mealsValidated: number;
  ticketsInCirculation: number;
  revenueCollected: number; // in FCFA
  servedTickets: Array<{
    ticketNumber: string;
    studentMatricule: string;
    studentName: string;
    dishName: string;
    validationTime: string;
    price: number;
  }>;
  closedAt?: string;
}

const ACTIVE_DAY_KEY = 'crou_active_day_stats';
const ARCHIVES_KEY = 'crou_daily_archives_ledger';

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayFormatted(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Initializes a brand new empty day record starting strictly at 0
 */
function createFreshDayStats(dateStr: string): DailyLedgerStats {
  return {
    date: dateStr,
    formattedDate: getTodayFormatted(),
    totalTicketsSold: 0,
    mealsValidated: 0,
    ticketsInCirculation: 0,
    revenueCollected: 0,
    servedTickets: []
  };
}

/**
 * Gets or initializes today's ledger stats with automatic day rollover & archive
 */
export async function getActiveDailyLedger(): Promise<DailyLedgerStats> {
  const todayStr = getTodayDateString();
  let currentStats: DailyLedgerStats | null = null;

  try {
    const raw = localStorage.getItem(ACTIVE_DAY_KEY);
    if (raw) {
      currentStats = JSON.parse(raw);
    }
  } catch {
    currentStats = null;
  }

  // Check if legacy test cache needs to be purged to start at 0
  const hasPurgedLegacy = localStorage.getItem('crou_sales_cache_purged_zero_v2');
  if (!hasPurgedLegacy) {
    localStorage.setItem('crou_sales_cache_purged_zero_v2', 'true');
    const freshZero = createFreshDayStats(todayStr);
    saveDailyLedgerLocally(freshZero);
    await syncStatsToFirestore(freshZero);
    return freshZero;
  }

  // Automatic rollover: if stored date is from a past day, archive it and start new day at 0!
  if (currentStats && currentStats.date !== todayStr) {
    await archivePastDay(currentStats);
    currentStats = createFreshDayStats(todayStr);
    saveDailyLedgerLocally(currentStats);
    return currentStats;
  }

  if (!currentStats) {
    currentStats = createFreshDayStats(todayStr);
    saveDailyLedgerLocally(currentStats);
  }

  return currentStats;
}

function saveDailyLedgerLocally(stats: DailyLedgerStats): void {
  try {
    localStorage.setItem(ACTIVE_DAY_KEY, JSON.stringify(stats));
  } catch {
    // Ignore
  }
}

/**
 * Sync stats to Firestore
 */
async function syncStatsToFirestore(stats: DailyLedgerStats): Promise<void> {
  try {
    const dayRef = doc(db, 'daily_ledgers', stats.date);
    await setDoc(dayRef, stats, { merge: true });
  } catch (err) {
    console.warn('Firestore ledger sync note:', err);
  }
}

/**
 * Record new tickets sold (increments tickets sold, circulation and revenue)
 */
export async function recordTicketsSaleInLedger(ticketCount: number, pricePerTicket: number = 200): Promise<DailyLedgerStats> {
  const stats = await getActiveDailyLedger();
  const addedRevenue = ticketCount * pricePerTicket;

  stats.totalTicketsSold += ticketCount;
  stats.ticketsInCirculation += ticketCount;
  stats.revenueCollected += addedRevenue;

  saveDailyLedgerLocally(stats);
  await syncStatsToFirestore(stats);
  return stats;
}

/**
 * Record a meal validation at the turnstile scanner
 */
export async function recordMealValidatedInLedger(ticket: MealTicket): Promise<DailyLedgerStats> {
  const stats = await getActiveDailyLedger();
  
  stats.mealsValidated += 1;
  stats.ticketsInCirculation = Math.max(0, stats.ticketsInCirculation - 1);
  
  const validationRecord = {
    ticketNumber: ticket.ticketNumber,
    studentMatricule: ticket.studentMatricule,
    studentName: ticket.studentName,
    dishName: ticket.dishName,
    validationTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    price: ticket.price || 200
  };

  stats.servedTickets.unshift(validationRecord);

  saveDailyLedgerLocally(stats);
  await syncStatsToFirestore(stats);
  return stats;
}

/**
 * Archive a past day into the permanent historical ledger
 */
export async function archivePastDay(pastDayStats: DailyLedgerStats): Promise<void> {
  pastDayStats.closedAt = new Date().toISOString();

  // 1. Save in Local Archives
  try {
    const rawArchives = localStorage.getItem(ARCHIVES_KEY);
    const archives: DailyLedgerStats[] = rawArchives ? JSON.parse(rawArchives) : [];
    // Replace if already exists for this date, else prepend
    const filtered = archives.filter(a => a.date !== pastDayStats.date);
    filtered.unshift(pastDayStats);
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }

  // 2. Save in Firestore permanent archive collection
  try {
    const archiveRef = doc(db, 'daily_archives', pastDayStats.date);
    await setDoc(archiveRef, pastDayStats);
  } catch (err) {
    console.warn('Firestore archive note:', err);
  }
}

/**
 * Get all historical archives of past days
 */
export async function getAllDailyArchives(): Promise<DailyLedgerStats[]> {
  const archivesMap: Record<string, DailyLedgerStats> = {};

  try {
    const raw = localStorage.getItem(ARCHIVES_KEY);
    if (raw) {
      const list: DailyLedgerStats[] = JSON.parse(raw);
      list.forEach(a => { archivesMap[a.date] = a; });
    }
  } catch {
    // Ignore
  }

  // Also query Firestore for any past days
  try {
    const snap = await getDocs(collection(db, 'daily_archives'));
    snap.forEach(d => {
      const data = d.data() as DailyLedgerStats;
      if (data.date) {
        archivesMap[data.date] = data;
      }
    });
  } catch {
    // Ignore
  }

  return Object.values(archivesMap).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Reset all sales caches completely to zero as explicitly requested by user!
 */
export async function resetAllSalesAndCountersToZero(): Promise<DailyLedgerStats> {
  const todayStr = getTodayDateString();
  const freshStats = createFreshDayStats(todayStr);

  localStorage.setItem(ACTIVE_DAY_KEY, JSON.stringify(freshStats));

  try {
    await syncStatsToFirestore(freshStats);
  } catch {
    // Ignore
  }

  return freshStats;
}
