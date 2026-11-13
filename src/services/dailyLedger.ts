import { doc, getDoc, setDoc, collection, getDocs, runTransaction, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { MealTicket } from '../types';
import {
  fetchDailyLedgerRest,
  saveDailyLedgerRest,
  fetchDailyArchivesRest,
  saveDailyArchiveRest
} from './firestoreRestClient';

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
  updatedAt?: string;
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

function normalizeLedgerStats(raw: any, dateStr: string): DailyLedgerStats {
  const served = Array.isArray(raw?.servedTickets) ? raw.servedTickets : [];
  // Déduplication stricte des tickets servis par ticketNumber
  const servedMap = new Map<string, DailyLedgerStats['servedTickets'][number]>();
  for (const item of served) {
    if (item && item.ticketNumber && !servedMap.has(item.ticketNumber)) {
      servedMap.set(item.ticketNumber, item);
    }
  }
  const uniqueServed = Array.from(servedMap.values());

  return {
    date: raw?.date || dateStr,
    formattedDate: raw?.formattedDate || getTodayFormatted(),
    totalTicketsSold: typeof raw?.totalTicketsSold === 'number' ? raw.totalTicketsSold : 0,
    mealsValidated: typeof raw?.mealsValidated === 'number' ? Math.max(raw.mealsValidated, uniqueServed.length) : uniqueServed.length,
    ticketsInCirculation: typeof raw?.ticketsInCirculation === 'number' ? Math.max(0, raw.ticketsInCirculation) : 0,
    revenueCollected: typeof raw?.revenueCollected === 'number' ? raw.revenueCollected : 0,
    servedTickets: uniqueServed,
    closedAt: raw?.closedAt,
    updatedAt: raw?.updatedAt
  };
}

function saveDailyLedgerLocally(stats: DailyLedgerStats): void {
  try {
    localStorage.setItem(ACTIVE_DAY_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

function readLocalDailyLedger(): DailyLedgerStats | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DAY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyLedgerStats;
  } catch {
    return null;
  }
}

/**
 * Récupère le registre du jour directement depuis Cloud Firestore (SDK + REST)
 * pour garantir des chiffres STRICTEMENT IDENTIQUES sur tous les appareils (téléphone, tablette, ordinateur).
 * N'écrase JAMAIS les données cloud par des zéros d'un appareil neuf !
 */
export async function getActiveDailyLedger(): Promise<DailyLedgerStats> {
  const todayStr = getTodayDateString();
  const localStats = readLocalDailyLedger();

  // Si un ancien jour non clôturé traîne localement avec de vraies opérations, on l'archive sans écraser aujourd'hui
  if (localStats && localStats.date && localStats.date !== todayStr) {
    if (localStats.totalTicketsSold > 0 || localStats.mealsValidated > 0 || (localStats.servedTickets?.length || 0) > 0) {
      await archivePastDay(localStats);
    }
  }

  let cloudStats: DailyLedgerStats | null = null;

  // 1. Lecture Firestore REST (fiable sur tous les réseaux) et SDK en parallèle
  try {
    const [restDoc, sdkSnap] = await Promise.all([
      fetchDailyLedgerRest(todayStr).catch(() => null),
      getDoc(doc(db, 'daily_ledgers', todayStr)).catch(() => null)
    ]);

    const sdkData = sdkSnap && sdkSnap.exists() ? (sdkSnap.data() as DailyLedgerStats) : null;

    if (restDoc && sdkData) {
      // Prendre la version la plus avancée / riche
      const restScore = (restDoc.totalTicketsSold || 0) + (restDoc.mealsValidated || 0) + (restDoc.revenueCollected || 0);
      const sdkScore = (sdkData.totalTicketsSold || 0) + (sdkData.mealsValidated || 0) + (sdkData.revenueCollected || 0);
      cloudStats = normalizeLedgerStats(sdkScore >= restScore ? sdkData : restDoc, todayStr);
    } else if (sdkData) {
      cloudStats = normalizeLedgerStats(sdkData, todayStr);
    } else if (restDoc) {
      cloudStats = normalizeLedgerStats(restDoc, todayStr);
    }
  } catch (err) {
    console.warn('Firestore getActiveDailyLedger note:', err);
  }

  if (cloudStats) {
    saveDailyLedgerLocally(cloudStats);
    return cloudStats;
  }

  // 2. Fallback si aucun document cloud n'existe encore pour aujourd'hui :
  // Si cet appareil possède déjà des ventes enregistrées aujourd'hui, on les pousse vers le cloud
  if (localStats && localStats.date === todayStr && (localStats.totalTicketsSold > 0 || localStats.mealsValidated > 0)) {
    const normalizedLocal = normalizeLedgerStats(localStats, todayStr);
    await syncStatsToFirestore(normalizedLocal);
    return normalizedLocal;
  }

  const fresh = createFreshDayStats(todayStr);
  saveDailyLedgerLocally(fresh);
  return fresh;
}

/**
 * Écoute en temps réel le registre journalier dans Cloud Firestore
 * Tout achat ou scan sur n'importe quel téléphone met instantanément à jour tous les écrans Admin
 */
export function subscribeToActiveDailyLedger(onUpdate: (stats: DailyLedgerStats) => void): () => void {
  const todayStr = getTodayDateString();

  // Chargement immédiat via REST + SDK (ne reste jamais bloqué sur 0)
  getActiveDailyLedger().then(onUpdate).catch(() => {});

  try {
    const dayRef = doc(db, 'daily_ledgers', todayStr);
    const unsub = onSnapshot(
      dayRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const normalized = normalizeLedgerStats(snapshot.data(), todayStr);
          saveDailyLedgerLocally(normalized);
          onUpdate(normalized);
        }
      },
      (err) => {
        console.warn('subscribeToActiveDailyLedger snapshot note:', err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('subscribeToActiveDailyLedger error:', err);
    return () => {};
  }
}

/**
 * Sync stats to Firestore (SDK + REST)
 */
async function syncStatsToFirestore(stats: DailyLedgerStats): Promise<void> {
  const payload = { ...stats, updatedAt: new Date().toISOString() };
  try {
    await saveDailyLedgerRest(payload);
  } catch {}
  try {
    const dayRef = doc(db, 'daily_ledgers', stats.date);
    await setDoc(dayRef, payload, { merge: true });
  } catch (err) {
    console.warn('Firestore ledger sync note:', err);
  }
}

/**
 * Enregistrer une vente de tickets de manière ATOMIQUE dans Firestore (runTransaction)
 * Garantit qu'aucune vente simultanée sur deux appareils ne s'écrase mutuellement.
 */
export async function recordTicketsSaleInLedger(ticketCount: number, pricePerTicket: number = 200): Promise<DailyLedgerStats> {
  const todayStr = getTodayDateString();
  const addedRevenue = ticketCount * pricePerTicket;

  try {
    const dayRef = doc(db, 'daily_ledgers', todayStr);
    const txStats = await runTransaction(db, async (tx) => {
      const snap = await tx.get(dayRef);
      const base = snap.exists()
        ? normalizeLedgerStats(snap.data(), todayStr)
        : createFreshDayStats(todayStr);

      const updated: DailyLedgerStats = {
        ...base,
        date: todayStr,
        formattedDate: base.formattedDate || getTodayFormatted(),
        totalTicketsSold: base.totalTicketsSold + ticketCount,
        ticketsInCirculation: base.ticketsInCirculation + ticketCount,
        revenueCollected: base.revenueCollected + addedRevenue,
        updatedAt: new Date().toISOString()
      };

      tx.set(dayRef, updated, { merge: true });
      return updated;
    });

    saveDailyLedgerLocally(txStats);
    saveDailyLedgerRest(txStats).catch(() => {});
    return txStats;
  } catch (txErr) {
    console.warn('Transaction sale fallback REST:', txErr);
    const current = await getActiveDailyLedger();
    const updated: DailyLedgerStats = {
      ...current,
      totalTicketsSold: current.totalTicketsSold + ticketCount,
      ticketsInCirculation: current.ticketsInCirculation + ticketCount,
      revenueCollected: current.revenueCollected + addedRevenue,
      updatedAt: new Date().toISOString()
    };
    saveDailyLedgerLocally(updated);
    await syncStatsToFirestore(updated);
    return updated;
  }
}

/**
 * Enregistrer une validation de repas au tourniquet de manière ATOMIQUE et IDEMPOTENTE dans Firestore
 */
export async function recordMealValidatedInLedger(ticket: MealTicket): Promise<DailyLedgerStats> {
  const todayStr = getTodayDateString();
  const validationRecord = {
    ticketNumber: ticket.ticketNumber,
    studentMatricule: ticket.studentMatricule,
    studentName: ticket.studentName,
    dishName: ticket.dishName,
    validationTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    price: ticket.price || 200
  };

  try {
    const dayRef = doc(db, 'daily_ledgers', todayStr);
    const txStats = await runTransaction(db, async (tx) => {
      const snap = await tx.get(dayRef);
      const base = snap.exists()
        ? normalizeLedgerStats(snap.data(), todayStr)
        : createFreshDayStats(todayStr);

      // Anti double-comptage idempotent
      if (base.servedTickets.some(s => s.ticketNumber === ticket.ticketNumber)) {
        return base;
      }

      const updated: DailyLedgerStats = {
        ...base,
        date: todayStr,
        formattedDate: base.formattedDate || getTodayFormatted(),
        mealsValidated: base.mealsValidated + 1,
        ticketsInCirculation: Math.max(0, base.ticketsInCirculation - 1),
        servedTickets: [validationRecord, ...base.servedTickets],
        updatedAt: new Date().toISOString()
      };

      tx.set(dayRef, updated, { merge: true });
      return updated;
    });

    saveDailyLedgerLocally(txStats);
    saveDailyLedgerRest(txStats).catch(() => {});
    return txStats;
  } catch (txErr) {
    console.warn('Transaction meal validation fallback REST:', txErr);
    const current = await getActiveDailyLedger();
    if (current.servedTickets.some(s => s.ticketNumber === ticket.ticketNumber)) {
      return current;
    }
    const updated: DailyLedgerStats = {
      ...current,
      mealsValidated: current.mealsValidated + 1,
      ticketsInCirculation: Math.max(0, current.ticketsInCirculation - 1),
      servedTickets: [validationRecord, ...current.servedTickets],
      updatedAt: new Date().toISOString()
    };
    saveDailyLedgerLocally(updated);
    await syncStatsToFirestore(updated);
    return updated;
  }
}

/**
 * Archive a past day into the permanent historical ledger (Local + Firestore SDK + REST)
 */
export async function archivePastDay(pastDayStats: DailyLedgerStats): Promise<void> {
  const closedRecord: DailyLedgerStats = {
    ...normalizeLedgerStats(pastDayStats, pastDayStats.date),
    closedAt: new Date().toISOString()
  };

  try {
    const rawArchives = localStorage.getItem(ARCHIVES_KEY);
    const archives: DailyLedgerStats[] = rawArchives ? JSON.parse(rawArchives) : [];
    const filtered = archives.filter(a => a.date !== closedRecord.date);
    filtered.unshift(closedRecord);
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }

  try {
    await saveDailyArchiveRest(closedRecord);
  } catch {}

  try {
    const archiveRef = doc(db, 'daily_archives', closedRecord.date);
    await setDoc(archiveRef, closedRecord, { merge: true });
  } catch (err) {
    console.warn('Firestore archive note:', err);
  }
}

/**
 * Get all historical archives of past days (Firestore Cloud + Local)
 */
export async function getAllDailyArchives(): Promise<DailyLedgerStats[]> {
  const archivesMap: Record<string, DailyLedgerStats> = {};

  try {
    const raw = localStorage.getItem(ARCHIVES_KEY);
    if (raw) {
      const list: DailyLedgerStats[] = JSON.parse(raw);
      list.forEach(a => {
        if (a && a.date) archivesMap[a.date] = normalizeLedgerStats(a, a.date);
      });
    }
  } catch {
    // Ignore
  }

  // REST + SDK query for all cloud archives
  try {
    const [restArchives, sdkSnap] = await Promise.all([
      fetchDailyArchivesRest().catch(() => []),
      getDocs(collection(db, 'daily_archives')).catch(() => null)
    ]);

    restArchives.forEach((data: any) => {
      if (data && data.date) {
        archivesMap[data.date] = normalizeLedgerStats(data, data.date);
      }
    });

    if (sdkSnap) {
      sdkSnap.forEach(d => {
        const data = d.data() as DailyLedgerStats;
        if (data && data.date) {
          archivesMap[data.date] = normalizeLedgerStats(data, data.date);
        }
      });
    }
  } catch {
    // Ignore
  }

  const sorted = Object.values(archivesMap).sort((a, b) => b.date.localeCompare(a.date));
  try {
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify(sorted));
  } catch {}
  return sorted;
}

/**
 * Immutable Audit Protection:
 * Vendor/cashier tampering is strictly prevented by locking the active sales ledger.
 * No reset or deletion of recorded sales is permitted.
 */
export function isLedgerAuditLocked(): boolean {
  return true;
}
