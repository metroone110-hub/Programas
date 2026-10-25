/**
 * CROU Resto U Notifications Service
 * Manages in-app alerts and browser notifications for lunch/dinner times,
 * ticket generation, and low balance warnings.
 */

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
}

const NOTIFS_STORAGE_KEY = 'crou_user_notifications';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

export function showSystemNotification(title: string, body: string, icon = '🍽️'): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    } catch (e) {
      console.warn('Native notification not supported in iframe', e);
    }
  }
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_STORAGE_KEY);
    if (!raw) return getDefaultNotifications();
    return JSON.parse(raw);
  } catch {
    return getDefaultNotifications();
  }
}

export function addNotification(title: string, message: string, type: 'info' | 'success' | 'warning' = 'info'): AppNotification {
  const notifs = getStoredNotifications();
  const newNotif: AppNotification = {
    id: 'notif_' + Math.random().toString(36).substring(2, 9),
    title,
    message,
    type,
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    read: false
  };

  const updated = [newNotif, ...notifs.slice(0, 19)];
  try {
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota
  }

  showSystemNotification(title, message);
  return newNotif;
}

function getDefaultNotifications(): AppNotification[] {
  return [
    {
      id: 'notif-welcome',
      title: 'Bienvenue sur Resto U CROU',
      message: 'Les repas étudiants subventionnés sont disponibles à 200 FCFA avec QR code.',
      type: 'info',
      timestamp: 'Aujourd\'hui',
      read: false
    },
    {
      id: 'notif-hours',
      title: 'Service Déjeuner Ouvert',
      message: 'Le service déjeuner est ouvert de 11h30 à 14h30 au restaurant universitaire.',
      type: 'success',
      timestamp: '11h30',
      read: true
    }
  ];
}
