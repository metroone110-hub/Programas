// Client-side anonymous tracking for Developer Audience and Interactions
// Respects user privacy: zero personal data, completely transparent and non-intrusive.

const VISITOR_ID_KEY = 'programas_anon_visitor_id';
const SESSION_VISIT_KEY = 'programas_session_tracked';

function getOrGenerateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = 'vis_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return 'vis_temp_' + Math.random().toString(36).substring(2, 10);
  }
}

function detectDevice(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'Android Mobile';
  if (ua.includes('iphone')) return 'iPhone (iOS)';
  if (ua.includes('ipad')) return 'iPad (iPadOS)';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac Desktop';
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('linux')) return 'Linux PC';
  return 'Mobile / Web';
}

export function trackEvent(
  type: 'visit' | 'interaction' | 'share',
  action: string,
  metadata?: Record<string, any>
): void {
  try {
    const visitorId = getOrGenerateVisitorId();
    const device = detectDevice();

    const payload = {
      visitorId,
      type,
      action,
      device,
      metadata: metadata || {},
    };

    // Use sendBeacon if supported, otherwise fetch with keepalive
    const jsonStr = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/analytics/track', blob);
      if (ok) return;
    }

    // Fallback: standard asynchronous non-blocking fetch
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
      keepalive: true,
    }).catch(() => {
      // Fail silently to never impact user experience
    });
  } catch {
    // Fail silently
  }
}

/**
 * Tracks the visit once per session so fast re-renders or page reloads don't inflate numbers
 */
export function trackVisit(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const hasTracked = sessionStorage.getItem(SESSION_VISIT_KEY);
      if (hasTracked) return;
      sessionStorage.setItem(SESSION_VISIT_KEY, 'true');
    }
    trackEvent('visit', 'page_view');
  } catch {
    // Fail silently
  }
}

export function trackShare(action: 'whatsapp_share' | 'link_copied' | 'system_share', metadata?: Record<string, any>): void {
  trackEvent('share', action, metadata);
}

export function trackInteraction(action: string, metadata?: Record<string, any>): void {
  trackEvent('interaction', action, metadata);
}
