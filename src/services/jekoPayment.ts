/**
 * Jeko Partner API Payment Service (api.jeko.africa)
 * Production Configuration for CROU Korhogo (UPGC)
 *
 * Real Live Credentials:
 * - Store ID: 895f3110-845b-4d11-a291-f28dc954c0cd ("Programas")
 * - API Key ID: 32d9d6ef-d182-47bc-82ba-9c92c41510f3
 * - API Key: jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec
 * - Webhook Secret: 2b685054e12f163038602111f54a7d4bc3b9dc3e64df899761f50088c1d1e6e0
 */

export type JekoSupportedMethod = 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo' | 'jeko';

export interface JekoTransactionDetails {
  id?: string;
  amount?: {
    amount: number;
    currency: string;
  };
  fees?: {
    amount: number;
    currency: string;
  };
  status?: string;
  counterpartLabel?: string;
  counterpartIdentifier?: string;
  description?: string;
  executedAt?: string;
}

export interface JekoPaymentRequestResponse {
  id: string;
  storeId: string;
  reference: string;
  type: string;
  paymentMethod: string;
  status: 'pending' | 'success' | 'paid' | 'failed' | 'error';
  redirectUrl?: string;
  errorReason?: string | null;
  transaction?: JekoTransactionDetails;
}

export interface InitiatePaymentParams {
  amount: number; // In FCFA, e.g. 200, 400, 2000 FCFA
  studentMatricule?: string;
  studentName?: string;
  studentPhone?: string;
  orderDescription?: string;
  ticketQuantity?: number;
  paymentMethod?: string;
  customReference?: string;
}

export interface JekoTransactionResult {
  success: boolean;
  reference: string;
  transactionId?: string;
  redirectUrl?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message: string;
  amount: number;
  currency: 'XOF';
  paymentMethod: string;
  timestamp: string;
}

const env = (import.meta as any).env || {};

// Real Jeko Production Credentials
export const JEKO_CONFIG = {
  apiKey: env.VITE_JEKO_API_KEY || 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec',
  apiKeyId: env.VITE_JEKO_API_KEY_ID || '32d9d6ef-d182-47bc-82ba-9c92c41510f3',
  storeId: env.VITE_JEKO_STORE_ID || '895f3110-845b-4d11-a291-f28dc954c0cd',
  webhookSecret: env.JEKO_WEBHOOK_SECRET || '2b685054e12f163038602111f54a7d4bc3b9dc3e64df899761f50088c1d1e6e0',
  partnerApiEndpoint: 'https://api.jeko.africa/partner_api/payment_requests',
  currency: 'XOF' as const
};

/**
 * Format phone number to international E.164 (+225XXXXXXXXXX)
 */
export function formatIvorianPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('225') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+225${digits}`;
  }
  return rawPhone.trim().startsWith('+') ? rawPhone.trim() : `+${digits}`;
}

/**
 * Normalizes payment method name for Jeko Partner API enum
 * Enum choices supported by Jeko: ["orange", "wave", "mtn", "moov", "djamo", "jeko"]
 */
export function normalizeJekoMethod(method?: string): JekoSupportedMethod {
  const m = (method || 'wave').toLowerCase();
  if (m.includes('wave')) return 'wave';
  if (m.includes('orange')) return 'orange';
  if (m.includes('mtn')) return 'mtn';
  if (m.includes('moov')) return 'moov';
  if (m.includes('djamo')) return 'djamo';
  if (m.includes('carte') || m.includes('card') || m.includes('cb') || m.includes('visa')) return 'djamo';
  if (m.includes('jeko')) return 'jeko';
  return 'wave';
}

/**
 * Generates an auditable CROU transaction reference
 */
export function generateCrouReference(baseOrderId?: string, attempt: number = 1): string {
  if (baseOrderId) {
    const cleanId = baseOrderId.replace(/[^a-zA-Z0-9_-]/g, '');
    return attempt > 1 ? `CROUK-${cleanId}-T${attempt}` : `CROUK-${cleanId}`;
  }
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CROUK-${ts}-${rand}`;
}

/**
 * Creates direct payment request using the official Jeko Partner API specification
 * Dispatches to /api/jeko/payment_requests (Vite dev proxy or Express production server)
 * or falls back directly to api.jeko.africa.
 */
export async function createDirectPayment(
  orderId: string,
  amountFCFA: number,
  methodName: string = 'wave',
  payerPhone?: string,
  attempt: number = 1
): Promise<JekoPaymentRequestResponse> {
  const reference = generateCrouReference(orderId, attempt);
  const amountCents = Math.round(amountFCFA * 100);
  const paymentMethod = normalizeJekoMethod(methodName);
  const formattedPhone = formatIvorianPhone(payerPhone);

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const origin = isHttps ? window.location.origin : 'https://crou.ci';
  const successUrl = `${origin}/?payment_status=success&reference=${reference}&order=${orderId}`;
  const errorUrl = `${origin}/?payment_status=error&reference=${reference}&order=${orderId}`;

  const requestBody = {
    storeId: JEKO_CONFIG.storeId,
    amountCents,
    currency: JEKO_CONFIG.currency,
    reference,
    paymentDetails: {
      type: 'redirect',
      data: {
        paymentMethod,
        ...(formattedPhone ? { payerPhone: formattedPhone } : {}),
        successUrl,
        errorUrl
      }
    }
  };

  // 1. Try local proxy first (handles CORS in dev & production)
  try {
    const proxyRes = await fetch('/api/jeko/payment_requests', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': JEKO_CONFIG.apiKey,
        'X-API-KEY-ID': JEKO_CONFIG.apiKeyId
      },
      body: JSON.stringify(requestBody)
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && (data.redirectUrl || data.id)) {
        return data as JekoPaymentRequestResponse;
      }
    } else {
      const errText = await proxyRes.text();
      console.warn('Proxy response status:', proxyRes.status, errText);
    }
  } catch (err) {
    console.warn('Local proxy attempt note:', err);
  }

  // 2. Direct call to Jeko Partner API with real keys
  try {
    const response = await fetch(JEKO_CONFIG.partnerApiEndpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': JEKO_CONFIG.apiKey,
        'X-API-KEY-ID': JEKO_CONFIG.apiKeyId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      return data as JekoPaymentRequestResponse;
    }

    const errJson = await response.json().catch(() => null);
    const errMsg = errJson?.message || errJson?.errors?.[0]?.message || `Erreur Jeko (${response.status})`;

    // Reference already consumed retry handling (up to 3 attempts with fresh reference)
    if (attempt < 3 && errMsg.includes('reference')) {
      console.warn(`Jeko payment request retry attempt ${attempt + 1} with fresh reference...`);
      return createDirectPayment(orderId, amountFCFA, methodName, payerPhone, attempt + 1);
    }

    throw new Error(errMsg);
  } catch (err: any) {
    console.error('Jeko Partner API error:', err);
    throw new Error(err.message || 'Impossible d\'initialiser le paiement Jeko. Veuillez vérifier votre connexion.');
  }
}

/**
 * Checks payment status via official GET /partner_api/payment_requests/{paymentRequestId}
 */
export async function checkPaymentStatus(
  paymentRequestIdOrReference: string
): Promise<'success' | 'pending' | 'failed' | 'error'> {
  if (!paymentRequestIdOrReference) return 'error';

  // 1. Try local proxy first
  try {
    const proxyRes = await fetch(`/api/jeko/payment_requests/${encodeURIComponent(paymentRequestIdOrReference)}`, {
      headers: {
        'X-API-KEY': JEKO_CONFIG.apiKey,
        'X-API-KEY-ID': JEKO_CONFIG.apiKeyId
      }
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.status === 'success' || data.status === 'paid') return 'success';
      if (data.status === 'pending') return 'pending';
      if (data.status === 'failed') return 'failed';
      return 'pending';
    }
  } catch {
    // Proceed to direct call
  }

  // 2. Direct call to Jeko Partner API with real keys
  try {
    const response = await fetch(
      `https://api.jeko.africa/partner_api/payment_requests/${encodeURIComponent(paymentRequestIdOrReference)}`,
      {
        method: 'GET',
        headers: {
          'X-API-KEY': JEKO_CONFIG.apiKey,
          'X-API-KEY-ID': JEKO_CONFIG.apiKeyId
        }
      }
    );

    if (response.ok) {
      const data: JekoPaymentRequestResponse = await response.json();
      if (data.status === 'success' || data.status === 'paid') return 'success';
      if (data.status === 'pending') return 'pending';
      if (data.status === 'failed') return 'failed';
      return 'pending';
    }
  } catch (err) {
    console.warn('checkPaymentStatus direct error:', err);
  }

  return 'pending';
}

/**
 * Polling helper: checks payment status every intervalMs until success, error, or timeout
 * Exactly as in the official Jeko documentation snippet provided
 */
export function pollPaymentStatus(
  paymentRequestId: string,
  onStatusChange: (status: 'success' | 'pending' | 'failed' | 'error') => void,
  intervalMs: number = 6000,
  timeoutMs: number = 300000
): () => void {
  let isCancelled = false;

  const intervalId = setInterval(async () => {
    if (isCancelled) {
      clearInterval(intervalId);
      return;
    }

    const status = await checkPaymentStatus(paymentRequestId);
    onStatusChange(status);

    if (status === 'success' || status === 'failed') {
      clearInterval(intervalId);
    }
  }, intervalMs);

  const timeoutId = setTimeout(() => {
    clearInterval(intervalId);
    if (!isCancelled) {
      onStatusChange('error');
    }
  }, timeoutMs);

  return () => {
    isCancelled = true;
    clearInterval(intervalId);
    clearTimeout(timeoutId);
  };
}

/**
 * Main payment initiation wrapper for CROU app
 */
export async function initiateJekoPayment(
  params: InitiatePaymentParams
): Promise<JekoTransactionResult> {
  const orderId = params.customReference || `${Date.now()}`;

  const res = await createDirectPayment(
    orderId,
    params.amount,
    params.paymentMethod,
    params.studentPhone
  );

  return {
    success: true,
    reference: res.reference,
    transactionId: res.id,
    redirectUrl: res.redirectUrl,
    status: res.status === 'paid' || res.status === 'success' ? 'SUCCESS' : 'PENDING',
    message: 'Demande de paiement Jeko initialisée.',
    amount: params.amount,
    currency: 'XOF',
    paymentMethod: params.paymentMethod || 'wave',
    timestamp: new Date().toISOString()
  };
}
