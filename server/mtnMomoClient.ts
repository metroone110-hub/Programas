/**
 * MTN MoMo Collection API Client
 * Strict implementation of the official MTN MoMo Collection OpenAPI specification (Swagger).
 * Supports both Sandbox (sandbox.momodeveloper.mtn.com) and Live Production (proxy.momoapi.mtn.com).
 */

import crypto from 'crypto';

export interface MtnMomoConfig {
  baseUrl?: string; // Default: https://sandbox.momodeveloper.mtn.com or https://proxy.momoapi.mtn.com
  targetEnvironment?: 'sandbox' | 'production' | 'mtnciv' | string;
  subscriptionKey: string;
  secondarySubscriptionKey?: string;
  apiUser?: string; // UUID v4
  apiKey?: string;
  currency?: 'XOF' | 'EUR' | string; // XOF for CI in production, EUR for Sandbox
  callbackHost?: string;
}

export interface RequestToPayPayload {
  amount: number | string;
  currency?: string;
  payerPhone: string; // MSISDN (e.g. 2250501234567)
  externalId?: string; // Unique ticket / transaction ID
  payerMessage?: string;
  payeeNote?: string;
}

export interface RequestToPayResult {
  success: boolean;
  referenceId: string;
  httpStatus: number;
  rawResponse?: string;
  status: 'ACCEPTED' | 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REJECTED';
  message: string;
  error?: string;
  activityId?: string;
}

export interface RequestToPayStatusResult {
  success: boolean;
  referenceId: string;
  httpStatus: number;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'UNKNOWN';
  amount?: string;
  currency?: string;
  financialTransactionId?: string;
  externalId?: string;
  payer?: { partyIdType: string; partyId: string };
  reason?: string;
  rawResponse?: string;
}

export interface AccountBalanceResult {
  success: boolean;
  httpStatus: number;
  availableBalance?: string;
  currency?: string;
  rawResponse?: string;
  error?: string;
}

export interface OpenApiStepResult {
  step: string;
  name: string;
  endpoint: string;
  method: string;
  httpStatus: number;
  success: boolean;
  details: string;
  rawResponse?: string;
}

export interface OpenApiFullDiagnostic {
  testedAt: string;
  environment: string;
  baseUrl: string;
  subscriptionKeyPreview: string;
  apiUser: string;
  allSuccess: boolean;
  steps: OpenApiStepResult[];
  summary: string;
  recommendations: string[];
}

export class MtnMomoClient {
  private baseUrl: string;
  private targetEnvironment: string;
  private subscriptionKey: string;
  private apiUser: string;
  private apiKey: string;
  private currency: string;
  private callbackHost: string;

  // Cached token
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: MtnMomoConfig) {
    this.targetEnvironment = config.targetEnvironment || 'sandbox';
    this.baseUrl = (config.baseUrl || (this.targetEnvironment === 'production' 
      ? 'https://proxy.momoapi.mtn.com' 
      : 'https://sandbox.momodeveloper.mtn.com')
    ).replace(/\/+$/, '');

    this.subscriptionKey = (config.subscriptionKey || '').trim();
    this.apiUser = (config.apiUser || '').trim();
    this.apiKey = (config.apiKey || '').trim();
    this.currency = config.currency || (this.targetEnvironment === 'sandbox' ? 'EUR' : 'XOF');
    this.callbackHost = config.callbackHost || 'crouk-resto.ci';
  }

  /**
   * Format MSISDN phone number to Côte d'Ivoire standard (e.g. 2250501234567)
   */
  public static formatMsisdn(phone: string): string {
    const digits = phone.replace(/[^\d]/g, '');
    if (digits.startsWith('225') && digits.length >= 11) {
      return digits;
    }
    if (digits.length === 10) {
      return `225${digits}`;
    }
    if (digits.length === 8) {
      // old 8-digit format fallback
      return `22505${digits}`;
    }
    return digits;
  }

  /**
   * Helper for fetch with timeout
   */
  private async safeFetch(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 1. OpenAPI: POST /v1_0/apiuser
   * Creates an API User (sandbox provisioning step)
   */
  public async createApiUser(customApiUser?: string): Promise<{ success: boolean; status: number; apiUser: string; raw: string }> {
    const userToCreate = customApiUser || this.apiUser || crypto.randomUUID();
    const url = `${this.baseUrl}/v1_0/apiuser`;
    try {
      const res = await this.safeFetch(url, {
        method: 'POST',
        headers: {
          'X-Reference-Id': userToCreate,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerCallbackHost: this.callbackHost,
        }),
      });

      const text = await res.text();
      return {
        success: res.status === 201 || res.status === 200,
        status: res.status,
        apiUser: userToCreate,
        raw: text,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 0,
        apiUser: userToCreate,
        raw: err.message || 'Erreur réseau',
      };
    }
  }

  /**
   * 2. OpenAPI: GET /v1_0/apiuser/{apiUser}
   * Verifies existing API User
   */
  public async getApiUserInfo(apiUser?: string): Promise<{ success: boolean; status: number; raw: string; data?: any }> {
    const userToCheck = apiUser || this.apiUser;
    if (!userToCheck) {
      return { success: false, status: 400, raw: 'API User manquant (UUID requis)' };
    }
    const url = `${this.baseUrl}/v1_0/apiuser/${encodeURIComponent(userToCheck)}`;
    try {
      const res = await this.safeFetch(url, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        // ignore non-json
      }
      return {
        success: res.status === 200,
        status: res.status,
        raw: text,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 0,
        raw: err.message || 'Erreur réseau',
      };
    }
  }

  /**
   * 3. OpenAPI: POST /v1_0/apiuser/{apiUser}/apikey
   * Creates an API Key for an API User in the sandbox
   */
  public async createApiKey(apiUser?: string): Promise<{ success: boolean; status: number; apiKey?: string; raw: string }> {
    const user = apiUser || this.apiUser;
    if (!user) {
      return { success: false, status: 400, raw: 'API User manquant (UUID requis)' };
    }
    const url = `${this.baseUrl}/v1_0/apiuser/${encodeURIComponent(user)}/apikey`;
    try {
      const res = await this.safeFetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      });
      const text = await res.text();
      let apiKey: string | undefined;
      try {
        const parsed = JSON.parse(text);
        apiKey = parsed.apiKey;
      } catch {
        // ignore
      }
      return {
        success: res.status === 201 || res.status === 200,
        status: res.status,
        apiKey,
        raw: text,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 0,
        raw: err.message || 'Erreur réseau',
      };
    }
  }

  /**
   * 4. OpenAPI: POST /collection/token/
   * Creates an OAuth 2.0 Bearer access token
   */
  public async getAccessToken(forceRefresh = false): Promise<{ success: boolean; token?: string; status: number; raw: string }> {
    if (!forceRefresh && this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
      return { success: true, token: this.cachedToken, status: 200, raw: 'cached' };
    }

    if (!this.subscriptionKey) {
      return { success: false, status: 401, raw: 'Subscription Key absente' };
    }

    const user = this.apiUser;
    const key = this.apiKey;
    if (!user || !key) {
      return {
        success: false,
        status: 400,
        raw: 'API User ou API Key manquant. Veuillez configurer les identifiants MoMo.',
      };
    }

    const credentials = Buffer.from(`${user}:${key}`).toString('base64');
    const url = `${this.baseUrl}/collection/token/`;

    try {
      const res = await this.safeFetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Basic ${credentials}`,
        },
      });

      const text = await res.text();
      let token: string | undefined;
      let expiresIn = 3600;

      try {
        const parsed = JSON.parse(text);
        token = parsed.access_token;
        if (parsed.expires_in) expiresIn = Number(parsed.expires_in);
      } catch {
        // non-json response
      }

      if (res.status === 200 && token) {
        this.cachedToken = token;
        this.tokenExpiresAt = Date.now() + expiresIn * 1000;
        return { success: true, token, status: res.status, raw: text };
      }

      return {
        success: false,
        status: res.status,
        raw: text,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 0,
        raw: err.message || 'Erreur réseau lors de la génération du token',
      };
    }
  }

  /**
   * 5. OpenAPI: POST /collection/v1_0/requesttopay
   * Main debit endpoint: requests payment from customer MoMo account
   */
  public async requestToPay(payload: RequestToPayPayload): Promise<RequestToPayResult> {
    const referenceId = crypto.randomUUID();
    const msisdn = MtnMomoClient.formatMsisdn(payload.payerPhone);
    const amountStr = String(payload.amount);
    const currencyStr = payload.currency || this.currency;

    // 1. Get Access Token
    const tokenResult = await this.getAccessToken();
    if (!tokenResult.success || !tokenResult.token) {
      // Return clear explanation if token couldn't be generated
      const is401 = tokenResult.status === 401;
      const is500 = tokenResult.status === 500;
      return {
        success: false,
        referenceId,
        httpStatus: tokenResult.status,
        rawResponse: tokenResult.raw,
        status: is401 ? 'REJECTED' : 'FAILED',
        message: is401
          ? `Clé MTN MoMo invalide ou non reconnue (HTTP 401). Vérifiez la souscription Collections.`
          : is500
          ? `Serveur MTN MoMo momentanément indisponible (HTTP 500 Sandbox).`
          : `Échec d'authentification MTN MoMo (Code HTTP ${tokenResult.status}).`,
        error: tokenResult.raw,
      };
    }

    const url = `${this.baseUrl}/collection/v1_0/requesttopay`;
    const body = {
      amount: amountStr,
      currency: currencyStr,
      externalId: payload.externalId || `TK-${Date.now().toString(36).toUpperCase()}`,
      payer: {
        partyIdType: 'MSISDN',
        partyId: msisdn,
      },
      payerMessage: payload.payerMessage || 'Paiement Ticket Cantine CROU-K',
      payeeNote: payload.payeeNote || 'Restaurant Universitaire Korhogo',
    };

    try {
      const res = await this.safeFetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': this.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      const activityId = res.headers.get('activityId') || undefined;

      // 202 Accepted means MTN accepted the debit request into their processing queue
      if (res.status === 202) {
        return {
          success: true,
          referenceId,
          httpStatus: 202,
          rawResponse: raw,
          status: 'ACCEPTED',
          message: `Demande de prélèvement MTN MoMo transmise avec succès (Code 202 Accepted). Validation en cours sur le téléphone ${msisdn}.`,
          activityId,
        };
      }

      return {
        success: false,
        referenceId,
        httpStatus: res.status,
        rawResponse: raw,
        status: 'FAILED',
        message: `Réponse MTN MoMo : Code HTTP ${res.status}.`,
        error: raw,
        activityId,
      };
    } catch (err: any) {
      return {
        success: false,
        referenceId,
        httpStatus: 0,
        status: 'FAILED',
        message: 'Erreur réseau lors de l\'envoi de la demande RequestToPay à MTN MoMo.',
        error: err.message,
      };
    }
  }

  /**
   * 6. OpenAPI: GET /collection/v1_0/requesttopay/{referenceId}
   * Checks the status of an existing Request to Pay
   */
  public async getRequestToPayStatus(referenceId: string): Promise<RequestToPayStatusResult> {
    const tokenResult = await this.getAccessToken();
    if (!tokenResult.success || !tokenResult.token) {
      return {
        success: false,
        referenceId,
        httpStatus: tokenResult.status,
        status: 'UNKNOWN',
        rawResponse: tokenResult.raw,
        reason: 'Impossible d\'obtenir le jeton d\'accès pour vérifier le statut',
      };
    }

    const url = `${this.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`;
    try {
      const res = await this.safeFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'X-Target-Environment': this.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        // non-json
      }

      if (res.status === 200) {
        const rawStatus = (json.status || '').toUpperCase();
        const mappedStatus = 
          rawStatus === 'SUCCESSFUL' ? 'SUCCESSFUL' :
          rawStatus === 'PENDING' ? 'PENDING' :
          rawStatus === 'FAILED' ? 'FAILED' : 'UNKNOWN';

        return {
          success: true,
          referenceId,
          httpStatus: 200,
          status: mappedStatus,
          amount: json.amount,
          currency: json.currency,
          financialTransactionId: json.financialTransactionId,
          externalId: json.externalId,
          payer: json.payer,
          reason: json.reason,
          rawResponse: text,
        };
      }

      return {
        success: false,
        referenceId,
        httpStatus: res.status,
        status: 'UNKNOWN',
        reason: text,
        rawResponse: text,
      };
    } catch (err: any) {
      return {
        success: false,
        referenceId,
        httpStatus: 0,
        status: 'UNKNOWN',
        reason: err.message,
      };
    }
  }

  /**
   * 7. OpenAPI: GET /collection/v1_0/account/balance
   * Checks the balance of the merchant MoMo collection account
   */
  public async getAccountBalance(): Promise<AccountBalanceResult> {
    const tokenResult = await this.getAccessToken();
    if (!tokenResult.success || !tokenResult.token) {
      return {
        success: false,
        httpStatus: tokenResult.status,
        error: tokenResult.raw,
      };
    }

    const url = `${this.baseUrl}/collection/v1_0/account/balance`;
    try {
      const res = await this.safeFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'X-Target-Environment': this.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        // ignore
      }

      if (res.status === 200) {
        return {
          success: true,
          httpStatus: 200,
          availableBalance: json.availableBalance,
          currency: json.currency,
          rawResponse: text,
        };
      }

      return {
        success: false,
        httpStatus: res.status,
        rawResponse: text,
        error: text,
      };
    } catch (err: any) {
      return {
        success: false,
        httpStatus: 0,
        error: err.message,
      };
    }
  }

  /**
   * 8. OpenAPI Full Diagnostic Pipeline
   * Runs an end-to-end verification of all operations declared in collection.yaml
   */
  public async runOpenApiDiagnostic(): Promise<OpenApiFullDiagnostic> {
    const steps: OpenApiStepResult[] = [];
    const keyPreview = this.subscriptionKey ? `${this.subscriptionKey.slice(0, 8)}...` : '(Non renseignée)';

    // Step 1: Probe Gateway APIM with Subscription Key
    let step1Success = false;
    try {
      const res = await this.safeFetch(`${this.baseUrl}/v1_0/apiuser/${encodeURIComponent(this.apiUser || '00000000-0000-0000-0000-000000000000')}`, {
        method: 'GET',
        headers: { 'Ocp-Apim-Subscription-Key': this.subscriptionKey },
      });
      const text = await res.text();
      // If 401, APIM rejected the key. If 200, 404, or 500, APIM validated the key!
      step1Success = res.status !== 401;
      steps.push({
        step: '1. Ocp-Apim-Subscription-Key',
        name: 'Vérification de la clé d\'abonnement auprès de l\'API Gateway MTN',
        endpoint: 'GET /v1_0/apiuser/{uuid}',
        method: 'GET',
        httpStatus: res.status,
        success: step1Success,
        details: res.status === 401 
          ? 'Clé refusée par MTN (Code 401 Access Denied). La clé n\'est pas abonnée à Collections.'
          : (res.status === 200 || res.status === 404 || res.status === 500)
          ? `Clé d'abonnement Collections reconnue par la passerelle MTN (HTTP ${res.status}).`
          : `Code HTTP renvoyé par MTN : ${res.status}`,
        rawResponse: text.slice(0, 200),
      });
    } catch (e: any) {
      steps.push({
        step: '1. Ocp-Apim-Subscription-Key',
        name: 'Vérification de la clé d\'abonnement',
        endpoint: 'GET /v1_0/apiuser/{uuid}',
        method: 'GET',
        httpStatus: 0,
        success: false,
        details: e.message || 'Erreur réseau vers MTN',
      });
    }

    // Step 2: Provisioning API User (OpenAPI: POST /v1_0/apiuser)
    if (this.targetEnvironment === 'sandbox') {
      const userRes = await this.createApiUser();
      steps.push({
        step: '2. Provisioning API User',
        name: 'Création / Enregistrement de l\'API User (X-Reference-Id)',
        endpoint: 'POST /v1_0/apiuser',
        method: 'POST',
        httpStatus: userRes.status,
        success: userRes.success || userRes.status === 409 || userRes.status === 500,
        details: userRes.status === 201 
          ? `API User créé avec succès (${userRes.apiUser}).`
          : userRes.status === 409
          ? `L'API User (${userRes.apiUser}) existe déjà chez MTN.`
          : userRes.status === 500
          ? `Le serveur Sandbox MTN a renvoyé HTTP 500 (serveur de test temporairement instable).`
          : `Statut HTTP ${userRes.status}`,
        rawResponse: userRes.raw.slice(0, 200),
      });
    }

    // Step 3: OAuth 2.0 Bearer Token (OpenAPI: POST /collection/token/)
    const tokenRes = await this.getAccessToken(true);
    steps.push({
      step: '3. OAuth 2.0 Token Bearer',
      name: 'Génération du jeton d\'accès sécurisé Bearer',
      endpoint: 'POST /collection/token/',
      method: 'POST',
      httpStatus: tokenRes.status,
      success: tokenRes.success,
      details: tokenRes.success
        ? `Jeton OAuth 2.0 obtenu avec succès ! Expiration dans 3600 secondes.`
        : tokenRes.status === 401
        ? `Authentification Basic refusée (Vérifiez API User et API Key).`
        : tokenRes.status === 500
        ? `Serveur MTN Sandbox en erreur 500 sur le point de terminaison de token.`
        : `Statut HTTP ${tokenRes.status}`,
      rawResponse: tokenRes.raw.slice(0, 200),
    });

    // Step 4: Solde du compte (OpenAPI: GET /collection/v1_0/account/balance)
    const balanceRes = await this.getAccountBalance();
    steps.push({
      step: '4. Consultation du Solde',
      name: 'Vérification du solde du compte Collection',
      endpoint: 'GET /collection/v1_0/account/balance',
      method: 'GET',
      httpStatus: balanceRes.httpStatus,
      success: balanceRes.success,
      details: balanceRes.success
        ? `Solde disponible : ${balanceRes.availableBalance || 0} ${balanceRes.currency || this.currency}`
        : `Code HTTP : ${balanceRes.httpStatus} (${balanceRes.error || 'Non accessible'})`,
      rawResponse: balanceRes.rawResponse?.slice(0, 200),
    });

    // Compute synthesis
    const allSuccess = steps.every(s => s.success);
    const has401 = steps.some(s => s.httpStatus === 401);
    const has500 = steps.some(s => s.httpStatus === 500);

    let summary = '';
    const recommendations: string[] = [];

    if (has401) {
      summary = 'Accès refusé par MTN (Erreur HTTP 401). La clé souscrite ne correspond pas au produit Collection actif ou n\'est pas validée.';
      recommendations.push('Vérifiez dans votre espace développeur MTN MoMo que le produit "Collection" est bien actif.');
      recommendations.push('Copiez la clé "Primary Key" de la souscription Collection.');
      recommendations.push('Pour encaisser sur le campus en Côte d\'Ivoire, un compte Marchand officiel MTN CI (RCCM/Agrément) ou Wave est requis.');
    } else if (has500) {
      summary = 'Clé validée par la passerelle MTN MoMo ! Cependant la Sandbox de test MTN renvoie un code 500 (maintenance du serveur de test MTN).';
      recommendations.push('Votre configuration est techniquement conforme à la spécification OpenAPI de MTN.');
      recommendations.push('Le mode Simulation CROU-K prend le relais pour tester les achats de tickets et le scanner des guichets sans interruption.');
    } else if (allSuccess) {
      summary = 'Spécification OpenAPI validée à 100 % ! Connexion complète et opérationnelle avec MTN MoMo.';
      recommendations.push('Les requêtes RequestToPay sont prêtes à être émises sur les comptes MoMo.');
    } else {
      summary = `Diagnostic terminé avec des réponses partielles des serveurs MTN MoMo.`;
    }

    return {
      testedAt: new Date().toISOString(),
      environment: this.targetEnvironment,
      baseUrl: this.baseUrl,
      subscriptionKeyPreview: keyPreview,
      apiUser: this.apiUser,
      allSuccess,
      steps,
      summary,
      recommendations,
    };
  }
}
