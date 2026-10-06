// Service de gestion des notifications locales et alertes de plats pour Programas

export interface NotificationSettings {
  enabled: boolean;
  alertOnNewMenu: boolean;
  alertOnFavoriteDishes: boolean;
  favoriteDishes: string[];
  lastNotifiedMenuId?: string;
  lastCheckedAt?: string;
}

const STORAGE_KEY = 'programas_notifications_v1';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        alertOnNewMenu: parsed.alertOnNewMenu !== false,
        alertOnFavoriteDishes: parsed.alertOnFavoriteDishes !== false,
        favoriteDishes: Array.isArray(parsed.favoriteDishes) ? parsed.favoriteDishes : [],
        lastNotifiedMenuId: parsed.lastNotifiedMenuId,
        lastCheckedAt: parsed.lastCheckedAt
      };
    }
  } catch (e) {
    console.error('Erreur lecture notifications:', e);
  }

  return {
    enabled: false,
    alertOnNewMenu: true,
    alertOnFavoriteDishes: true,
    favoriteDishes: ['Sauce Graine', 'Attiéké', 'Poulet']
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

export function sendLocalNotification(title: string, body: string, dataUrl?: string): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    // Si Service Worker disponible, utiliser reg.showNotification pour PWA mobile
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

    // Fallback notification standard
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
    console.error('Erreur envoi notification:', e);
    return false;
  }
}

export function checkAndNotifyMenuUpdates(
  currentMenu: { id?: string; date: string; service: string; items: Array<{ title: string; description?: string }> },
  allMenus: Array<{ id?: string; date: string; service: string; items: Array<{ title: string; description?: string }> }>
): { notified: boolean; reason?: string } {
  const settings = getNotificationSettings();
  if (!settings.enabled || Notification.permission !== 'granted') {
    return { notified: false };
  }

  let notified = false;
  let reason: string | undefined;

  // 1. Vérifier si un nouveau menu a été distribué / publié
  if (settings.alertOnNewMenu && currentMenu.id && currentMenu.items.length > 0) {
    if (settings.lastNotifiedMenuId && settings.lastNotifiedMenuId !== currentMenu.id) {
      const serviceLabel = currentMenu.service === 'dejeuner' ? 'Déjeuner (Midi)' : 'Dîner (Soir)';
      sendLocalNotification(
        '📢 Nouveau menu publié au Resto U !',
        `Le CROU-K vient de mettre en ligne le menu du ${serviceLabel} (${currentMenu.items.length} plats disponibles).`
      );
      notified = true;
      reason = 'Nouveau menu distribué';
    }
  }

  // 2. Vérifier si un des plats favoris de l'étudiant est au menu (Aujourd'hui ou Demain)
  if (settings.alertOnFavoriteDishes && settings.favoriteDishes.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    const matchedFavorites: Array<{ dish: string; date: string; service: string }> = [];

    // Parcourir tous les menus connus
    for (const menu of allMenus) {
      const isTargetDay = menu.date === today || menu.date === tomorrowStr;
      if (!isTargetDay || !Array.isArray(menu.items)) continue;

      for (const item of menu.items) {
        for (const fav of settings.favoriteDishes) {
          const normFav = fav.toLowerCase().trim();
          if (normFav.length < 2) continue;

          if (item.title.toLowerCase().includes(normFav) || (item.description && item.description.toLowerCase().includes(normFav))) {
            const dayLabel = menu.date === today ? "aujourd'hui" : "demain";
            matchedFavorites.push({
              dish: item.title,
              date: dayLabel,
              service: menu.service === 'dejeuner' ? 'Midi' : 'Soir'
            });
          }
        }
      }
    }

    if (matchedFavorites.length > 0 && settings.lastNotifiedMenuId !== currentMenu.id) {
      const first = matchedFavorites[0];
      sendLocalNotification(
        `🔔 Votre plat favori est au menu ${first.date} !`,
        `« ${first.dish} » est servi au Resto U UPGC (${first.service}). Ticket à 200 FCFA !`
      );
      notified = true;
      reason = `Plat favori détecté : ${first.dish}`;
    }
  }

  // Enregistrer le dernier ID de menu vu
  if (currentMenu.id) {
    settings.lastNotifiedMenuId = currentMenu.id;
    settings.lastCheckedAt = new Date().toISOString();
    saveNotificationSettings(settings);
  }

  return { notified, reason };
}
