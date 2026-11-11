/**
 * Native Haptic Feedback for Mobile Devices (Android & WebKit)
 * Donne une sensation physique réelle de bouton / d'application native solide
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(28);
        break;
      case 'success':
        navigator.vibrate([15, 50, 25]);
        break;
      case 'warning':
        navigator.vibrate([35, 70, 35]);
        break;
      case 'error':
        navigator.vibrate([45, 60, 45, 60, 45]);
        break;
    }
  } catch {
    // Vibration not supported or permission denied
  }
};
