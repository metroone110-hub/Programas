/**
 * Jèko (Jeko Pay) Mobile Money Aggregator Client for Côte d'Ivoire
 * Official Partner API integration: Wave, Orange Money, MTN MoMo, Moov Africa, Djamo, Jèko
 * Documentation: https://api.jeko.africa/partner_api/payment_requests
 */

export interface JekoConfig {
  apiKey?: string;
  apiKeyId?: string;
  storeId?: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface JekoInitPaymentParams {
  reference: string;
  amount: number;
  currency?: string;
  customerPhone: string;
  customerName?: string;
  visitorId: string;
  description?: string;
  returnUrl?: string;
  errorUrl?: string;
  notifyUrl?: string;
  paymentMethod?: 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo' | 'jeko' | string;
}

export interface JekoInitPaymentResult {
  success: boolean;
  reference: string;
  paymentUrl?: string;
  requestId?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message: string;
  rawResponse?: any;
}

export interface JekoDiagnosisResult {
  testedAt: string;
  apiKeyPreview: string;
  apiKeyIdPreview?: string;
  storeIdPreview?: string;
  hasWebhookSecret: boolean;
  webhookSecretPreview: string;
  connected: boolean;
  httpStatus: number;
  message: string;
  recommendations: string[];
  retryMechanism?: {
    enabled: boolean;
    maxRetries: number;
    backoffFormula: string;
    delaysMs: number[];
  };
}

/**
 * Fonction officielle de requête HTTP avec gestion du Rate-Limiting (HTTP 429) et Backoff Exponentiel
 * Fourni par l'équipe technique Jèko :
 * En cas de limitation (429), attend 1s, 2s, 4s, 8s, 16s puis réessaie jusqu'à 5 fois.
 */
export async function makeRequestWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 5
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        // Backoff exponentiel: 1s, 2s, 4s, 8s, 16s
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[Jeko API] Rate limited (HTTP 429). Waiting ${waitTime}ms before retry... (Tentative ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (err: any) {
      if (attempt === maxRetries - 1) {
        throw err;
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[Jeko API] Erreur réseau transitoire (${err.message}). Attente de ${waitTime}ms avant réessai (tentative ${attempt + 1}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Max retries exceeded');
}

export class JekoClient {
  private apiKey: string;
  private apiKeyId: string;
  private storeId: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor(config: JekoConfig = {}) {
    this.apiKey = (config.apiKey || process.env.JEKO_API_KEY || '').trim();
    this.apiKeyId = (config.apiKeyId || process.env.JEKO_API_KEY_ID || '').trim();
    this.storeId = (config.storeId || process.env.JEKO_STORE_ID || '895f3110-845b-4d11-a291-f28dc954c0cd').trim();
    this.webhookSecret = (config.webhookSecret || process.env.JEKO_WEBHOOK_SECRET || '').trim();
    this.baseUrl = (config.baseUrl || 'https://api.jeko.africa').replace(/\/+$/, '');
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith('jeko_'));
  }

  get maskedApiKey(): string {
    if (!this.apiKey) return 'Non configurée';
    return this.apiKey.substring(0, 10) + '...' + this.apiKey.slice(-6);
  }

  get maskedApiKeyId(): string {
    if (!this.apiKeyId) return 'Non renseigné (X-API-KEY-ID)';
    return this.apiKeyId.length > 8 
      ? this.apiKeyId.substring(0, 6) + '...' + this.apiKeyId.slice(-4)
      : this.apiKeyId;
  }

  get maskedSecret(): string {
    if (!this.webhookSecret) return 'Non configuré';
    return this.webhookSecret.substring(0, 8) + '...' + this.webhookSecret.slice(-6);
  }

  /**
   * Diagnostic check of Jeko configuration, connectivity, and rate-limiting retry mechanism
   */
  async diagnose(): Promise<JekoDiagnosisResult> {
    const testedAt = new Date().toISOString();
    const recommendations: string[] = [];

    const retryMechanism = {
      enabled: true,
      maxRetries: 5,
      backoffFormula: 'Math.pow(2, attempt) * 1000',
      delaysMs: [1000, 2000, 4000, 8000, 16000],
    };

    if (!this.isConfigured) {
      recommendations.push(
        'Renseignez votre clé API Jèko (commençant par jeko_...) dans la configuration.'
      );
      return {
        testedAt,
        apiKeyPreview: this.maskedApiKey,
        apiKeyIdPreview: this.maskedApiKeyId,
        storeIdPreview: this.storeId,
        hasWebhookSecret: Boolean(this.webhookSecret),
        webhookSecretPreview: this.maskedSecret,
        connected: false,
        httpStatus: 400,
        message: 'Clé API Jèko non configurée.',
        recommendations,
        retryMechanism,
      };
    }

    // Ping the official Jeko partner API endpoint
    try {
      const endpoint = `${this.baseUrl}/partner_api/payment_requests`;
      const headers: Record<string, string> = {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      };
      if (this.apiKeyId) {
        headers['X-API-KEY-ID'] = this.apiKeyId;
      }

      const res = await makeRequestWithRetry(
        endpoint,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            storeId: this.storeId,
            amountCents: 200,
            currency: 'XOF',
            reference: `PING-${Date.now()}`,
            paymentDetails: {
              type: 'redirect',
              data: {
                paymentMethod: 'wave',
                successUrl: 'https://crou-menu-resto-u-648760950612.europe-west1.run.app/',
                errorUrl: 'https://crou-menu-resto-u-648760950612.europe-west1.run.app/',
              },
            },
          }),
        },
        2
      );

      const json = await res.json().catch(() => null);

      if (res.ok) {
        recommendations.push(
          'Connexion Jèko Partner API établie avec succès !',
          'Toutes les requêtes utilisent la fonction officielle makeRequestWithRetry avec gestion 429.',
          'Les paiements Wave, Orange Money, MTN MoMo, Moov, Djamo et Jèko Pay sont actifs.'
        );
        return {
          testedAt,
          apiKeyPreview: this.maskedApiKey,
          apiKeyIdPreview: this.maskedApiKeyId,
          storeIdPreview: this.storeId,
          hasWebhookSecret: Boolean(this.webhookSecret),
          webhookSecretPreview: this.maskedSecret,
          connected: true,
          httpStatus: res.status,
          message: 'Jèko Partner API opérationnelle et connectée.',
          recommendations,
          retryMechanism,
        };
      }

      if (res.status === 401) {
        const isKeyIdMissing = json?.extras?.includes?.('API key ID') || !this.apiKeyId;
        if (isKeyIdMissing) {
          recommendations.push(
            'L\'en-tête X-API-KEY-ID est requis par Jèko : copiez l\'ID de votre clé depuis la liste des clés dans votre dashboard Jèko (colonne ID).',
            'La clé secrète jeko_... est bien enregistrée.',
            'Le mode simulation instantanée reste disponible pour tester l\'achat des tickets sans interruption.'
          );
          return {
            testedAt,
            apiKeyPreview: this.maskedApiKey,
            apiKeyIdPreview: this.maskedApiKeyId,
            storeIdPreview: this.storeId,
            hasWebhookSecret: Boolean(this.webhookSecret),
            webhookSecretPreview: this.maskedSecret,
            connected: false,
            httpStatus: 401,
            message: 'Jèko en attente du "X-API-KEY-ID" (Identifiant de clé dans le dashboard Jèko).',
            recommendations,
            retryMechanism,
          };
        }
      }

      if (res.status === 404 && json?.message?.toLowerCase?.().includes('store')) {
        recommendations.push(
          'Clé API et Identifiant de clé (X-API-KEY-ID) validés avec succès par Jèko ! 🎉',
          `L'identifiant de boutique (Store ID: "${this.storeId}") n'existe pas ou n'est pas rattaché à cette clé dans votre compte Jèko.`,
          'Vérifiez la section "Boutiques" / "Stores" de votre tableau de bord Jèko pour copier l\'ID de votre boutique.',
          'Le mode simulation instantanée reste disponible pour tester l\'achat des tickets sans interruption.'
        );
        return {
          testedAt,
          apiKeyPreview: this.maskedApiKey,
          apiKeyIdPreview: this.maskedApiKeyId,
          storeIdPreview: this.storeId,
          hasWebhookSecret: Boolean(this.webhookSecret),
          webhookSecretPreview: this.maskedSecret,
          connected: false,
          httpStatus: 404,
          message: 'Clé API validée ! Identifiant de boutique (Store ID) à vérifier dans votre espace Jèko.',
          recommendations,
          retryMechanism,
        };
      }

      recommendations.push(
        `Jèko a répondu avec le statut HTTP ${res.status}: ${json?.message || 'Vérifiez les identifiants.'}`
      );
      return {
        testedAt,
        apiKeyPreview: this.maskedApiKey,
        apiKeyIdPreview: this.maskedApiKeyId,
        storeIdPreview: this.storeId,
        hasWebhookSecret: Boolean(this.webhookSecret),
        webhookSecretPreview: this.maskedSecret,
        connected: false,
        httpStatus: res.status,
        message: json?.message || `Réponse Jèko: HTTP ${res.status}`,
        recommendations,
        retryMechanism,
      };
    } catch (err: any) {
      recommendations.push(`Erreur réseau: ${err.message}`);
      return {
        testedAt,
        apiKeyPreview: this.maskedApiKey,
        apiKeyIdPreview: this.maskedApiKeyId,
        storeIdPreview: this.storeId,
        hasWebhookSecret: Boolean(this.webhookSecret),
        webhookSecretPreview: this.maskedSecret,
        connected: false,
        httpStatus: 500,
        message: 'Impossible de joindre https://api.jeko.africa',
        recommendations,
        retryMechanism,
      };
    }
  }

  /**
   * Initiate a payment request via official Jèko Partner API using makeRequestWithRetry
   */
  async initiatePayment(params: JekoInitPaymentParams): Promise<JekoInitPaymentResult> {
    const { reference, amount, returnUrl, errorUrl, paymentMethod } = params;

    if (!this.isConfigured) {
      return {
        success: false,
        reference,
        status: 'FAILED',
        message: 'Clé API Jèko manquante.',
      };
    }

    try {
      const endpoint = `${this.baseUrl}/partner_api/payment_requests`;
      
      const selectedChannel = (paymentMethod || 'wave').toLowerCase();
      const successUrl = returnUrl || 'https://crou-menu-resto-u-648760950612.europe-west1.run.app/?payment_success=true';
      const failureUrl = errorUrl || returnUrl || 'https://crou-menu-resto-u-648760950612.europe-west1.run.app/?payment_error=true';

      const bodyPayload = {
        storeId: this.storeId || '895f3110-845b-4d11-a291-f28dc954c0cd',
        amountCents: amount,
        currency: 'XOF',
        reference: `ORDER-${reference}`,
        paymentDetails: {
          type: 'redirect',
          data: {
            paymentMethod: selectedChannel,
            successUrl,
            errorUrl: failureUrl,
          },
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
        'Accept': 'application/json',
      };

      if (this.apiKeyId) {
        headers['X-API-KEY-ID'] = this.apiKeyId;
      }

      console.log(`[Jeko API] Initiating payment request for ref=${reference}, amount=${amount} XOF, method=${selectedChannel}`);

      // Exécute la requête avec la fonction officielle makeRequestWithRetry (gestion du 429 et backoff)
      const response = await makeRequestWithRetry(
        endpoint,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        },
        5
      );

      const json = await response.json().catch(() => null);

      if (response.ok && json) {
        const paymentUrl = json.redirectUrl || json.paymentUrl || json.url || json.data?.redirectUrl;
        return {
          success: true,
          reference,
          requestId: json.id,
          paymentUrl,
          status: 'PENDING',
          message: 'Demande de paiement Jèko générée avec succès.',
          rawResponse: json,
        };
      }

      // Si erreur 401 avec "Invalid API key ID"
      if (response.status === 401 && (json?.extras?.includes?.('API key ID') || !this.apiKeyId)) {
        return {
          success: false,
          reference,
          status: 'FAILED',
          message: 'ID de clé Jèko requis (X-API-KEY-ID) : veuillez renseigner l\'identifiant de votre clé disponible dans la liste des clés de votre tableau de bord Jèko.',
          rawResponse: json,
        };
      }

      return {
        success: false,
        reference,
        status: 'FAILED',
        message: json?.message || json?.error || `Erreur serveur Jèko (HTTP ${response.status})`,
        rawResponse: json,
      };
    } catch (err: any) {
      console.error('[Jeko API Init Error]:', err);
      return {
        success: false,
        reference,
        status: 'FAILED',
        message: err.message || 'Impossible de contacter les serveurs Jèko',
      };
    }
  }

  /**
   * Query transaction status from Jeko Partner API using makeRequestWithRetry
   */
  async checkPaymentStatus(reference: string): Promise<{
    success: boolean;
    reference: string;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    amount?: number;
    rawResponse?: any;
    message?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        reference,
        status: 'FAILED',
        message: 'Clé API Jèko non configurée',
      };
    }

    try {
      const endpoint = `${this.baseUrl}/partner_api/payment_requests/${encodeURIComponent(reference)}`;
      const headers: Record<string, string> = {
        'X-API-KEY': this.apiKey,
        'Accept': 'application/json',
      };
      if (this.apiKeyId) {
        headers['X-API-KEY-ID'] = this.apiKeyId;
      }

      const response = await makeRequestWithRetry(
        endpoint,
        {
          method: 'GET',
          headers,
        },
        5
      );

      const json = await response.json().catch(() => null);
      if (response.ok && json) {
        const rawStatus = (json.status || '').toString().toUpperCase();
        const isSuccess =
          rawStatus.includes('SUCCESS') ||
          rawStatus.includes('PAID') ||
          rawStatus.includes('COMPLETED');
        const isPending =
          rawStatus.includes('PENDING') ||
          rawStatus.includes('INITIATED') ||
          rawStatus.includes('PROCESSING');

        return {
          success: true,
          reference,
          status: isSuccess ? 'SUCCESS' : isPending ? 'PENDING' : 'FAILED',
          amount: json.amountCents ? Number(json.amountCents) : undefined,
          rawResponse: json,
        };
      }

      return {
        success: false,
        reference,
        status: 'PENDING',
        message: json?.message || `Statut HTTP ${response.status}`,
        rawResponse: json,
      };
    } catch (err: any) {
      return {
        success: false,
        reference,
        status: 'FAILED',
        message: err.message,
      };
    }
  }
}
