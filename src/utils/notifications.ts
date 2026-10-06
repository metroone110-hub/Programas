// Service complet de notifications & alertes de repas pour Programas - Resto U UPGC

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  dishName?: string;
  type: 'favorite' | 'new_menu';
  timestamp: number;
}

export interface NotificationSettings {
  enabled: boolean;
  alertOnNewMenu: boolean;
  alertOnFavoriteDishes: boolean;
  favoriteDishes: string[];
  lastNotifiedMenuId?: string;
  lastCheckedAt?: string;
  notifiedSignatures?: string[]; // to prevent repeated notifications for same dish & day
}

const STORAGE_KEY = 'programas_notifications_v2';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled !== false, // default enabled so students don't miss in-app alerts
        alertOnNewMenu: parsed.alertOnNewMenu !== false,
        alertOnFavoriteDishes: parsed.alertOnFavoriteDishes !== false,
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

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
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
 * Works on all modern browsers without needing external mp3 files.
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);

    // Vibrate phone if supported
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Audio context may require prior user interaction
  }
}

export function sendLocalNotification(title: string, body: string, dataUrl?: string): boolean {
  playNotificationSound();

  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: 'programas-menu-alert',
          data: { url: dataUrl || window.location.href }
        });
      });
      return true;
    }

    const notif = new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'programas-menu-alert'
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
 * Ex: "Sauce Graine" matches "Riz à la sauce graine de boeuf", "Graine", etc.
 */
export function dishMatchesQuery(dishTitle: string, dishDesc: string | undefined, query: string): boolean {
  const normTitle = normalizeText(dishTitle);
  const normDesc = normalizeText(dishDesc || '');
  const normQuery = normalizeText(query);

  if (normQuery.length < 2) return false;

  // Direct substring match
  if (normTitle.includes(normQuery) || normDesc.includes(normQuery)) {
    return true;
  }

  // Word-by-word match (ex: "sauce graine" -> matches if both "sauce" and "graine" are present)
  const words = normQuery.split(/\s+/).filter(w => w.length >= 3);
  if (words.length > 1) {
    const allWordsPresent = words.every(w => normTitle.includes(w) || normDesc.includes(w));
    if (allWordsPresent) return true;
  }

  return false;
}

/**
 * Core check that compares the menus with student's favorites and newly distributed menu.
 * Returns an InAppAlert if a notification is triggered!
 */
export function checkAndNotifyMenuUpdates(
  currentMenu: { id?: string; date: string; service: string; items: Array<{ title: string; description?: string }> },
  allMenus: Array<{ id?: string; date: string; service: string; items: Array<{ title: string; description?: string }> }>
): { notified: boolean; inAppAlert?: InAppAlert; reason?: string } {
  const settings = getNotificationSettings();
  if (!settings.enabled) {
    return { notified: false };
  }

  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const signatures = new Set<string>(settings.notifiedSignatures || []);

  // 1. VÉRIFIER EN PRIORITÉ LES PLATS FAVORIS DE L'ÉTUDIANT
  if (settings.alertOnFavoriteDishes && settings.favoriteDishes.length > 0) {
    for (const menu of allMenus) {
      const isTargetDay = menu.date === today || menu.date === tomorrowStr;
      if (!isTargetDay || !Array.isArray(menu.items)) continue;

      for (const item of menu.items) {
        for (const fav of settings.favoriteDishes) {
          if (dishMatchesQuery(item.title, item.description, fav)) {
            const signature = `fav:${normalizeText(fav)}:${menu.date}:${menu.service}`;
            
            // Si pas encore notifié pour cette journée/service
            if (!signatures.has(signature)) {
              signatures.add(signature);
              settings.notifiedSignatures = Array.from(signatures);
              settings.lastCheckedAt = new Date().toISOString();
              saveNotificationSettings(settings);

              const dayLabel = menu.date === today ? "aujourd'hui" : "demain";
              const serviceLabel = menu.service === 'dejeuner' ? 'Midi' : 'Soir';
              const title = `🔔 Votre plat favori est au menu ${dayLabel} !`;
              const body = `« ${item.title} » est servi au Resto U UPGC (${serviceLabel}) au tarif de 200 FCFA.`;

              // Déclencher alerte système + son
              sendLocalNotification(title, body);

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
  if (settings.alertOnNewMenu && currentMenu.id && Array.isArray(currentMenu.items) && currentMenu.items.length > 0) {
    const newMenuSignature = `new_menu:${currentMenu.id}`;
    if (!signatures.has(newMenuSignature) && settings.lastNotifiedMenuId && settings.lastNotifiedMenuId !== currentMenu.id) {
      signatures.add(newMenuSignature);
      settings.notifiedSignatures = Array.from(signatures);
      settings.lastNotifiedMenuId = currentMenu.id;
      settings.lastCheckedAt = new Date().toISOString();
      saveNotificationSettings(settings);

      const serviceLabel = currentMenu.service === 'dejeuner' ? 'Déjeuner (Midi)' : 'Dîner (Soir)';
      const title = '📢 Nouveau menu distribué au Resto U !';
      const body = `Le CROU-K vient de publier le menu du ${serviceLabel} avec ${currentMenu.items.length} plats.`;

      sendLocalNotification(title, body);

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

    if (!settings.lastNotifiedMenuId) {
      settings.lastNotifiedMenuId = currentMenu.id;
      saveNotificationSettings(settings);
    }
  }

  return { notified: false };
}
