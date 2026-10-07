// Service complet de notifications & alertes de repas pour Programas - Resto U UPGC

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  dishName?: string;
  type: 'favorite' | 'new_menu' | 'meal_time';
  timestamp: number;
  urgentMascot?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  alertOnNewMenu: boolean;
  alertOnFavoriteDishes: boolean;
  alertOnMealTimes: boolean; // Rappels automatiques 11h30, 14h30, 18h30 (Style Duolingo)
  favoriteDishes: string[];
  lastNotifiedMenuId?: string;
  lastCheckedAt?: string;
  notifiedSignatures?: string[]; // to prevent repeated notifications
}

const STORAGE_KEY = 'programas_notifications_v4';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled !== false,
        alertOnNewMenu: parsed.alertOnNewMenu !== false,
        alertOnFavoriteDishes: parsed.alertOnFavoriteDishes !== false,
        alertOnMealTimes: parsed.alertOnMealTimes !== false,
        favoriteDishes: Array.isArray(parsed.favoriteDishes) ? parsed.favoriteDishes : ['Sauce Graine', 'Attiéké', 'Poulet'],
        lastNotifiedMenuId: parsed.lastNotifiedMenuId,
        lastCheckedAt: parsed.lastCheckedAt,
        notifiedSignatures: Array.isArray(parsed.notifiedSignatures) ? parsed.notifiedSignatures : []
      };
    }
  } catch (e) {
    console.error('Erreur lecture notifications:', e);
  }

  return {
    enabled: true,
    alertOnNewMenu: true,
    alertOnFavoriteDishes: true,
    alertOnMealTimes: true,
    favoriteDishes: ['Sauce Graine', 'Attiéké', 'Poulet'],
    notifiedSignatures: []
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Erreur sauvegarde notifications:', e);
  }
}

export function clearNotificationSignatures(): void {
  try {
    const settings = getNotificationSettings();
    settings.notifiedSignatures = [];
    settings.lastNotifiedMenuId = undefined;
    saveNotificationSettings(settings);
  } catch (e) {
    console.error('Erreur nettoyage signatures:', e);
  }
}

export function clearSignaturesForDish(dishName: string): void {
  try {
    const norm = normalizeText(dishName);
    const settings = getNotificationSettings();
    settings.notifiedSignatures = (settings.notifiedSignatures || []).filter(
      sig => !sig.includes(norm)
    );
    saveNotificationSettings(settings);
  } catch (e) {
    console.error('Erreur nettoyage signatures plat:', e);
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * App Badging API & Pastille Rouge Numérotée (Style iOS, Android, WhatsApp, Duolingo)
 * Compatible avec :
 * 1. L'écran d'accueil du téléphone (Android PWA, iOS 16.4+ PWA "Sur l'écran d'accueil", macOS, Windows)
 * 2. L'icône de l'onglet du navigateur (Favicon dynamique généré avec pastille rouge et chiffre)
 * 3. Le titre de l'onglet : (1) Programas, (2) Programas...
 * 4. Les icônes internes de l'application (en-tête, cloche, barre de navigation)
 */
const UNREAD_BADGE_KEY = 'programas_unread_badge_count_v1';

export function updateFaviconBadge(count: number): void {
  if (typeof document === 'undefined') return;
  try {
    const iconLinks = document.querySelectorAll("link[rel*='icon']");
    if (count <= 0) {
      iconLinks.forEach(link => {
        const el = link as HTMLLinkElement;
        if (el.type === 'image/svg+xml') el.href = '/icon.svg';
        else if (el.rel.includes('apple-touch-icon')) el.href = '/apple-touch-icon.png';
        else el.href = '/favicon.png';
      });
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(img, 0, 0, 64, 64);

      // Pastille rouge badge
      const badgeText = count > 99 ? '99+' : String(count);
      const isWide = badgeText.length > 1;
      const badgeHeight = 24;
      const badgeWidth = isWide ? 36 : 24;
      const cx = 64 - badgeWidth / 2 - 2;
      const cy = 13;

      // Cercle ou pilule rouge éclatant
      ctx.fillStyle = '#E11D48'; // Rose/Rouge vif natif iOS/Android
      ctx.beginPath();
      if (isWide && typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(64 - badgeWidth - 2, 2, badgeWidth, badgeHeight, 12);
      } else {
        ctx.arc(64 - 13, 13, 13, 0, Math.PI * 2);
      }
      ctx.fill();

      // Bordure blanche éclatante
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Chiffre centré en blanc
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${isWide ? 12 : 14}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, isWide ? 64 - badgeWidth / 2 - 2 : 64 - 13, 14);

      const dataUrl = canvas.toDataURL('image/png');
      iconLinks.forEach(link => {
        (link as HTMLLinkElement).href = dataUrl;
      });
    };
    img.onerror = () => {
      // Fallback
      ctx.fillStyle = '#F5B726';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(48, 16, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count > 9 ? '9+' : String(count), 48, 16);
      const dataUrl = canvas.toDataURL('image/png');
      iconLinks.forEach(link => {
        (link as HTMLLinkElement).href = dataUrl;
      });
    };
    img.src = '/favicon.png';
  } catch (err) {
    console.warn('Erreur mise à jour badge favicon:', err);
  }
}

export function updateDocumentTitle(count: number): void {
  if (typeof document === 'undefined') return;
  const baseTitle = "Programas - Resto U UPGC Korhogo";
  if (count > 0) {
    document.title = `(${count}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
}

export function getUnreadBadgeCount(): number {
  try {
    const raw = localStorage.getItem(UNREAD_BADGE_KEY);
    return raw !== null ? parseInt(raw, 10) || 0 : 1; // 1 par défaut au chargement
  } catch {
    return 1;
  }
}

export function setAppBadgeCount(count: number): void {
  try {
    const safeCount = Math.max(0, count);
    localStorage.setItem(UNREAD_BADGE_KEY, String(safeCount));
    
    // 1. Support natif de l'API Badging sur l'OS mobile/bureau (PWA Android, iOS 16.4+, macOS, Windows)
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (safeCount > 0) {
        (navigator as any).setAppBadge(safeCount).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }

    // 2. Favicon dynamique avec pastille rouge et chiffre en direct sur l'onglet
    updateFaviconBadge(safeCount);

    // 3. Titre de l'onglet avec le chiffre : (1) Programas, (2) Programas...
    updateDocumentTitle(safeCount);

    // 4. Synchronisation instantanée de tous les composants React via événement personnalisé
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('programas-badge-updated', { detail: { count: safeCount } })
      );
    }
  } catch (e) {
    console.error('Erreur pastille badge:', e);
  }
}

export function incrementAppBadge(by = 1): number {
  const current = getUnreadBadgeCount();
  const next = current + by;
  setAppBadgeCount(next);
  return next;
}

export function clearAppBadge(): void {
  setAppBadgeCount(0);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    if (Notification.permission === 'granted') {
      return true;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Erreur demande de permission notification:', e);
    return false;
  }
}

/**
 * Web Audio Chime: Plays an audible, friendly bell chime when a notification fires.
 */
export function playNotificationSound(urgent = false): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = urgent ? 'triangle' : 'sine';
    osc1.frequency.setValueAtTime(urgent ? 784 : 659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = urgent ? 'triangle' : 'sine';
    osc2.frequency.setValueAtTime(urgent ? 1046.5 : 880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.65);

    // Tone 3 for urgent alerts (Duolingo style persistent 3rd high pitch!)
    if (urgent) {
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.25);
      gain3.gain.setValueAtTime(0.4, ctx.currentTime + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      osc3.start(ctx.currentTime + 0.25);
      osc3.stop(ctx.currentTime + 0.85);
    }

    if (navigator.vibrate) {
      navigator.vibrate(urgent ? [180, 80, 180, 80, 250] : [100, 50, 100]);
    }
  } catch {
    // Audio context may require user click
  }
}

export function sendLocalNotification(title: string, body: string, dataUrl?: string, urgent = false): boolean {
  playNotificationSound(urgent);
  incrementAppBadge(1);

  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg: any) => {
        reg.showNotification(title, {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: 'programas-meal-time-alert',
          vibrate: [200, 100, 200],
          data: { url: dataUrl || window.location.href }
        });
      });
      return true;
    }

    const notif = new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'programas-meal-time-alert'
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (e) {
    console.error('Erreur envoi notification système:', e);
    return false;
  }
}

/**
 * Normalizes text: lowercase, remove accents/diacritics, trim
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Checks if a dish title or description matches a search/favorite query.
 * Flexible: supports substring in both directions and token overlaps.
 */
export function dishMatchesQuery(dishTitle: string, dishDesc: string | undefined, query: string): boolean {
  const normTitle = normalizeText(dishTitle);
  const normDesc = normalizeText(dishDesc || '');
  const normQuery = normalizeText(query);

  if (normQuery.length < 2) return false;

  // Exact or substring match in either direction
  if (normTitle.includes(normQuery) || normQuery.includes(normTitle)) {
    return true;
  }
  if (normDesc.includes(normQuery)) {
    return true;
  }

  // Token matching: e.g. "poisson" matches "poisson frit" or "attiéké avec poisson"
  const queryTokens = normQuery.split(/[\s,+'"-]+/).filter(w => w.length >= 3);
  const titleTokens = normTitle.split(/[\s,+'"-]+/).filter(w => w.length >= 3);

  if (queryTokens.length > 0 && titleTokens.length > 0) {
    const hasMatch = queryTokens.some(qt => titleTokens.some(tt => tt.includes(qt) || qt.includes(tt)));
    if (hasMatch) return true;
  }

  return false;
}

/**
 * DUOLINGO-STYLE MEAL TIME REMINDERS (11h30, 14h30, 18h30)
 * Funny, urgent, insistent, persistent campus reminders!
 */
export const MEAL_TIME_MESSAGES = {
  '11h30': [
    {
      title: '🚨 À TABLE ! IL EST 11H30 !',
      body: 'Tu fais semblant d’étudier alors que ton ventre fait des bruits de tonnerre ! Le Resto U UPGC est ouvert, viens chercher ton plateau à 200 FCFA avant la queue !'
    },
    {
      title: '🔔 11H30 : LA MARMITE FUME AU CROU-K !',
      body: 'Le riz est chaud, la sauce est prête ! Laisse les cahiers 30 minutes et viens manger : la faim n’a jamais donné de licence !'
    },
    {
      title: '👨‍🍳 LE CHEF DU CAMPUS T’A VU (11H30) !',
      body: 'Si tu restes encore assis en amphi, la longue file d’attente va t’attraper sous le soleil de Korhogo ! Fonce au réfectoire !'
    }
  ],
  '14h30': [
    {
      title: '⚠️ 14H30 : DERNIER APPEL DU CHEF !',
      body: 'Le service de midi va fermer ses portes ! Fonce au réfectoire maintenant ou tu vas te retrouver à grignoter des biscuits sous un arbre !'
    },
    {
      title: '🏃‍♂️ COURS ! 14H30 DERNIERS PLATEAUX !',
      body: 'On commence à ramasser les marmites du midi ! Si tu as faim, c’est littéralement ta dernière chance avant ce soir !'
    },
    {
      title: '🚨 14H30 : FIN DU DÉJEUNER IMMINENTE !',
      body: 'Tu voulais jeûner ou quoi ?! Prépare tes 200 FCFA et va chercher ta part au guichet du CROU-K immédiatement !'
    }
  ],
  '18h30': [
    {
      title: '🌙 18H30 : L’HEURE DU DÎNER A SONNÉ !',
      body: 'La cuisine du soir est ouverte au Resto U UPGC ! Prépare ton ticket à 200 FCFA et viens recharger les batteries pour la nuit !'
    },
    {
      title: '🍲 À TABLE ! LE CROU-K TE RÉCLAME (18H30) !',
      body: 'Tu as révisé toute la journée, ton cerveau a besoin de calories ! Ne saute pas le dîner, le réfectoire t’attend !'
    },
    {
      title: '👨‍🍳 18H30 : DÉPOSE LE STYLO, C’EST LE SOIR !',
      body: 'Lâche WhatsApp 20 minutes et viens manger un bon repas chaud à 200 FCFA avant le rush du soir !'
    }
  ]
};

/**
 * Checks if current time matches 11h30, 14h30 or 18h30 and triggers the persistent Duolingo reminder.
 */
export function checkMealTimeReminders(): InAppAlert | null {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.alertOnMealTimes) {
    return null;
  }

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let currentSlot: '11h30' | '14h30' | '18h30' | null = null;

  // Window check: triggers during the rush window of each slot
  // 11:30 -> 12:15
  if (hours === 11 && minutes >= 30) {
    currentSlot = '11h30';
  } else if (hours === 12 && minutes <= 15) {
    currentSlot = '11h30';
  }
  // 14:30 -> 15:15
  else if (hours === 14 && minutes >= 30) {
    currentSlot = '14h30';
  } else if (hours === 15 && minutes <= 15) {
    currentSlot = '14h30';
  }
  // 18:30 -> 19:15
  else if (hours === 18 && minutes >= 30) {
    currentSlot = '18h30';
  } else if (hours === 19 && minutes <= 15) {
    currentSlot = '18h30';
  }

  if (!currentSlot) {
    return null;
  }

  const signature = `meal_time_${todayStr}_${currentSlot}`;
  const signatures = new Set<string>(settings.notifiedSignatures || []);

  if (signatures.has(signature)) {
    return null; // Already notified today for this slot
  }

  // Pick a random funny message for this slot
  const messages = MEAL_TIME_MESSAGES[currentSlot];
  const selectedMsg = messages[Math.floor(Math.random() * messages.length)];

  // Record signature to avoid repeated spamming
  signatures.add(signature);
  settings.notifiedSignatures = Array.from(signatures);
  saveNotificationSettings(settings);

  // Send system notification + persistent sound
  sendLocalNotification(selectedMsg.title, selectedMsg.body, undefined, true);

  return {
    id: `${Date.now()}`,
    title: selectedMsg.title,
    body: selectedMsg.body,
    type: 'meal_time',
    timestamp: Date.now(),
    urgentMascot: true
  };
}

/**
 * Generates a mock Duolingo alert for immediate user testing!
 */
export function triggerTestMealTimeAlert(slot: '11h30' | '14h30' | '18h30' = '11h30'): InAppAlert {
  const messages = MEAL_TIME_MESSAGES[slot];
  const selectedMsg = messages[Math.floor(Math.random() * messages.length)];

  sendLocalNotification(selectedMsg.title, selectedMsg.body, undefined, true);

  return {
    id: `${Date.now()}`,
    title: selectedMsg.title,
    body: selectedMsg.body,
    type: 'meal_time',
    timestamp: Date.now(),
    urgentMascot: true
  };
}

/**
 * Core check that compares the menus with student's favorites and newly distributed menu.
 */
export function checkAndNotifyMenuUpdates(
  currentMenu: { id?: string; date: string; service: string; items: Array<{ title: string; description?: string }> },
  allMenus: Array<{ id?: string; date: string; service: string; items: Array<{ title: string; description?: string }> }>
): { notified: boolean; inAppAlert?: InAppAlert; reason?: string } {
  // Check meal time automatic reminders first!
  const mealTimeAlert = checkMealTimeReminders();
  if (mealTimeAlert) {
    return {
      notified: true,
      inAppAlert: mealTimeAlert,
      reason: 'Rappel automatique repas'
    };
  }

  const settings = getNotificationSettings();
  if (!settings.enabled) {
    return { notified: false };
  }

  const signatures = new Set<string>(settings.notifiedSignatures || []);

  // 1. VÉRIFIER LES PLATS FAVORIS DE L'ÉTUDIANT
  // Check current menu first, then any other menus in history/upcoming
  if (settings.alertOnFavoriteDishes && settings.favoriteDishes.length > 0) {
    const menusToCheck = [currentMenu, ...allMenus.filter(m => m !== currentMenu)];

    for (const menu of menusToCheck) {
      if (!Array.isArray(menu?.items) || menu.items.length === 0) continue;

      for (const item of menu.items) {
        for (const fav of settings.favoriteDishes) {
          if (dishMatchesQuery(item.title, item.description, fav)) {
            // Include item title in signature
            const signature = `fav:${normalizeText(fav)}:${menu.date}:${menu.service}:${normalizeText(item.title)}`;
            
            if (!signatures.has(signature)) {
              signatures.add(signature);
              settings.notifiedSignatures = Array.from(signatures);
              settings.lastCheckedAt = new Date().toISOString();
              saveNotificationSettings(settings);

              const serviceLabel = menu.service === 'dejeuner' ? 'Midi' : 'Soir';
              const title = `🔔 Votre plat favori est disponible au Resto U !`;
              const body = `« ${item.title} » est servi au CROU-K (${serviceLabel}) au tarif subventionné de 200 FCFA.`;

              sendLocalNotification(title, body, undefined, false);

              return {
                notified: true,
                reason: `Plat favori : ${item.title}`,
                inAppAlert: {
                  id: `${Date.now()}`,
                  title,
                  body,
                  dishName: item.title,
                  type: 'favorite',
                  timestamp: Date.now()
                }
              };
            }
          }
        }
      }
    }
  }

  // 2. VÉRIFIER SI UN NOUVEAU MENU A ÉTÉ DISTRIBUÉ / PUBLIÉ
  if (settings.alertOnNewMenu && currentMenu && Array.isArray(currentMenu.items) && currentMenu.items.length > 0) {
    // Generate a content signature based on items list
    const itemsSummary = currentMenu.items.map(i => normalizeText(i.title)).sort().join('|');
    const menuContentSig = `new_menu:${currentMenu.date}:${currentMenu.service}:${itemsSummary}`;

    if (!signatures.has(menuContentSig)) {
      signatures.add(menuContentSig);
      settings.notifiedSignatures = Array.from(signatures);
      settings.lastNotifiedMenuId = currentMenu.id || `${currentMenu.date}-${currentMenu.service}`;
      settings.lastCheckedAt = new Date().toISOString();
      saveNotificationSettings(settings);

      const serviceLabel = currentMenu.service === 'dejeuner' ? 'Déjeuner (Midi)' : 'Dîner (Soir)';
      const title = '📢 Nouveau menu distribué au Resto U !';
      const body = `Le CROU-K vient de publier le menu du ${serviceLabel} avec ${currentMenu.items.length} plats (200 FCFA).`;

      sendLocalNotification(title, body, undefined, false);

      return {
        notified: true,
        reason: 'Nouveau menu distribué',
        inAppAlert: {
          id: `${Date.now()}`,
          title,
          body,
          type: 'new_menu',
          timestamp: Date.now()
        }
      };
    }
  }

  return { notified: false };
}
