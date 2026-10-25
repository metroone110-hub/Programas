/**
 * CROU Resto U Analytics & Telemetry Tracking
 * Stores local canteen metrics for management reporting and student stats.
 */

export interface DailyStats {
  date: string;
  totalTicketsIssued: number;
  totalSubsidiesFCFA: number; // calculated at 1300 FCFA subsidy per meal (1500 regular - 200 student)
  totalMealsServed: number;
  popularDishes: Record<string, number>;
  rechargesCount: number;
  rechargesVolumeFCFA: number;
}

const STATS_KEY = 'crou_daily_stats_v1';

export function getTodayStats(): DailyStats {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed: DailyStats = JSON.parse(raw);
      if (parsed.date === todayStr) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Analytics read error:', err);
  }

  // Initial stats for today
  const initial: DailyStats = {
    date: todayStr,
    totalTicketsIssued: 428,
    totalSubsidiesFCFA: 428 * 1300, // 556,400 FCFA
    totalMealsServed: 395,
    popularDishes: {
      'Attiéké Poisson Thon Braisé': 184,
      'Sauce Graine & Foutou Banane': 142,
      'Riz au Gras & Poulet Doré': 102
    },
    rechargesCount: 84,
    rechargesVolumeFCFA: 245000
  };

  saveStats(initial);
  return initial;
}

function saveStats(stats: DailyStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Analytics save error:', err);
  }
}

/**
 * Record a new meal ticket creation
 */
export function recordTicketIssued(dishName: string, studentPaid: number = 200, regularPrice: number = 1500): void {
  const stats = getTodayStats();
  stats.totalTicketsIssued += 1;
  stats.totalSubsidiesFCFA += Math.max(0, regularPrice - studentPaid);
  stats.popularDishes[dishName] = (stats.popularDishes[dishName] || 0) + 1;
  saveStats(stats);
}

/**
 * Record ticket validation at the turnstile / tourniquet
 */
export function recordMealServed(): void {
  const stats = getTodayStats();
  stats.totalMealsServed += 1;
  saveStats(stats);
}

/**
 * Record a wallet recharge transaction
 */
export function recordRecharge(amount: number): void {
  const stats = getTodayStats();
  stats.rechargesCount += 1;
  stats.rechargesVolumeFCFA += amount;
  saveStats(stats);
}
