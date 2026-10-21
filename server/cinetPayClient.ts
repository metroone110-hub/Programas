/**
 * CinetPay Mobile Money Aggregator Client
 * Handles Côte d'Ivoire Multi-Operator Mobile Money (Wave, Orange Money, MTN MoMo, Moov Flooz)
 * Documentation: https://docs.cinetpay.com/
 */

import type { CinetPayDiagnosisResult, CinetPayInitResponse } from '../src/types.ts';

export interface CinetPayConfig {
  apiKey?: string;
  siteId?: string;
  secretKey?: string;
  mode?: 'sandbox' | 'production';
  notifyUrl?: string;
  returnUrl?: string;
}

export interface CinetPayInitParams {
  transactionId: string;
  amount: number;
  description: string;
  customerPhone?: string;
  customerName?: string;
  visitorId: string;
  returnUrl?: string;
  notifyUrl?: string;
  channels?: string; // 'ALL' | 'MOBILE_MONEY' | 'WALLET'
}

export interface CinetPayCheckResult {
  success: boolean;
  code: string;
  message: string;
  status: 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'WAITING_FOR_PAYMENT' | 'UNKNOWN';
  amount?: number;
  currency?: string;
  paymentMethod?: string; // WAVE_CI, OM_CI, MOMO_CI, MOOV_CI
  operatorId?: string;
  transactionId: string;
  rawResponse?: any;
}

export class CinetPayClient {
  private apiKey: string;
  private siteId: string;
  private secretKey?: string;
  private mode: 'sandbox' | 'production';
  private notifyUrl?: string;
  private returnUrl?: string;

  constructor(config: CinetPayConfig = {}) {
    this.apiKey = (config.apiKey || process.env.CINETPAY_API_KEY || '').trim();
    this.siteId = (config.siteId || process.env.CINETPAY_SITE_ID || '').trim();
    this.secretKey = (config.secretKey || process.env.CINETPAY_SECRET_KEY || '').trim();
    this.mode = config.mode || 'sandbox';
    this.notifyUrl = config.notifyUrl;
    this.returnUrl = config.returnUrl;
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.siteId);
  }

  /**
   * Initialize a multi-operator payment session on CinetPay
   */
  async initiatePayment(params: CinetPayInitParams): Promise<CinetPayInitResponse> {
    const {
      transactionId,
      amount,
      description,
      customerPhone = '0102030405',
      customerName = 'Étudiant UPGC',
      visitorId,
      returnUrl = this.returnUrl,
      notifyUrl = this.notifyUrl,
      channels = 'ALL',
    } = params;

    // Clean phone number (strip +225 or spaces, ensure standard 10 digits)
    const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^225/, '') || '0102030405';

    // If no credentials yet configured, return a simulated sandbox payment session
    if (!this.apiKey || !this.siteId) {
      console.log(`[CinetPay] Keys not configured yet. Providing simulated sandbox checkout session for ${amount} FCFA.`);
      return {
        success: true,
        transactionId,
        amount,
        currency: 'XOF',
        mode: 'simulation',
        paymentUrl: `/api/tickets/cinetpay-simulated-checkout?transId=${encodeURIComponent(transactionId)}&amount=${amount}&phone=${encodeURIComponent(cleanPhone)}&visitorId=${encodeURIComponent(visitorId)}`,
        paymentToken: `sim_token_${Date.now().toString(36)}`,
        message: 'Session de test CinetPay prête (Mode Sandbox CROU). Vous pouvez tester l\'ensemble du flux Wave, Orange, MTN et Moov.',
      };
    }

    try {
      const payload = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: transactionId,
        amount: amount,
        currency: 'XOF',
        description: description || `Ticket Repas Restaurant U CROU-K (${amount} FCFA)`,
        notify_url: notifyUrl || 'https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app/api/tickets/cinetpay-notify',
        return_url: returnUrl || 'https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app/?cinetpay_return=1',
        channels: channels,
        customer_id: visitorId,
        customer_name: customerName,
        customer_surname: 'Korhogo',
        customer_phone_number: cleanPhone,
        customer_city: 'Korhogo',
        customer_country: 'CI',
      };

      console.log(`[CinetPay] Calling CinetPay v2 API for ${amount} FCFA, transId: ${transactionId}...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        console.warn(`[CinetPay] HTTP ${res.status} from CinetPay API:`, data);
        return {
          success: false,
          transactionId,
          amount,
          currency: 'XOF',
          mode: this.mode,
          message: data?.description || data?.message || `Erreur serveur CinetPay (HTTP ${res.status})`,
          error: JSON.stringify(data),
        };
      }

      if (data.code === '201' && data.data?.payment_url) {
        return {
          success: true,
          transactionId,
          amount,
          currency: 'XOF',
          mode: this.mode,
          paymentUrl: data.data.payment_url,
          paymentToken: data.data.payment_token,
          message: 'Guichet de paiement CinetPay initialisé avec succès',
        };
      }

      return {
        success: false,
        transactionId,
        amount,
        currency: 'XOF',
        mode: this.mode,
        message: data.description || data.message || 'Réponse inattendue de CinetPay',
        error: `Code: ${data.code}`,
      };
    } catch (err: any) {
      console.error('[CinetPay] Network or initiation error:', err);
      return {
        success: false,
        transactionId,
        amount,
        currency: 'XOF',
        mode: this.mode,
        message: err.message || 'Erreur réseau lors de la communication avec CinetPay',
        error: err.name,
      };
    }
  }

  /**
   * Check status of a transaction on CinetPay
   */
  async checkTransaction(transactionId: string): Promise<CinetPayCheckResult> {
    if (!this.apiKey || !this.siteId) {
      return {
        success: true,
        code: '00',
        message: 'Simulation Sandbox CinetPay',
        status: 'ACCEPTED',
        transactionId,
      };
    }

    try {
      const payload = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: transactionId,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        return {
          success: false,
          code: String(res.status),
          message: 'Erreur lors de la vérification de la transaction CinetPay',
          status: 'UNKNOWN',
          transactionId,
          rawResponse: data,
        };
      }

      const statusMap: Record<string, CinetPayCheckResult['status']> = {
        ACCEPTED: 'ACCEPTED',
        REFUSED: 'REFUSED',
        CANCELLED: 'CANCELLED',
        WAITING_FOR_PAYMENT: 'WAITING_FOR_PAYMENT',
      };

      const status = statusMap[data.data?.status] || 'UNKNOWN';

      return {
        success: data.code === '00',
        code: data.code,
        message: data.message || data.description || 'Statut vérifié',
        status,
        amount: data.data?.amount,
        currency: data.data?.currency,
        paymentMethod: data.data?.payment_method,
        operatorId: data.data?.operator_id,
        transactionId,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERR',
        message: err.message || 'Erreur réseau vérification CinetPay',
        status: 'UNKNOWN',
        transactionId,
      };
    }
  }

  /**
   * Run real-time diagnosis on CinetPay configuration
   */
  async diagnose(): Promise<CinetPayDiagnosisResult> {
    const testedAt = new Date().toISOString();
    const apiKeyPreview = this.apiKey ? `${this.apiKey.slice(0, 6)}...${this.apiKey.slice(-4)}` : 'Non renseignée';
    const siteId = this.siteId || 'Non renseigné';
    const supportedChannels = ['Wave Côte d\'Ivoire', 'Orange Money CI', 'MTN Mobile Money CI', 'Moov Money (Flooz) CI'];

    if (!this.apiKey || !this.siteId) {
      return {
        testedAt,
        apiKeyPreview,
        siteId,
        mode: this.mode,
        connected: false,
        httpStatus: 0,
        code: 'MISSING_CREDENTIALS',
        message: 'Clé API ou Site ID CinetPay manquant',
        description: 'Pour activer l\'encaissement réel tout-en-un (Wave, Orange, MTN, Moov), saisissez vos identifiants CinetPay dans le formulaire ci-dessous.',
        supportedChannels,
        isUsableForRealMoney: false,
        explanations: [
          'Le module CinetPay est pré-installé et prêt à l\'emploi dans votre application.',
          'Aucune clé marchande CinetPay n\'a encore été enregistrée dans la configuration.',
          'Le mode test Sandbox reste utilisable pour valider le parcours étudiant et le scanner du guichetier sans bloquer l\'application.'
        ],
        recommendations: [
          'Créez votre compte marchand sur https://cinetpay.com.',
          'Récupérez votre "API Key" et votre "Site ID" depuis votre tableau de bord CinetPay.',
          'Collez-les dans les champs ci-dessous et cliquez sur "Enregistrer la configuration CinetPay".'
        ]
      };
    }

    try {
      // Probe CinetPay with a dummy check request to verify authentication
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: 'PROBE_CHECK_' + Date.now(),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const raw = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }

      const httpStatus = res.status;
      const code = data?.code || String(httpStatus);
      const isAuthError = code === '623' || code === '624' || code === '627' || httpStatus === 401 || httpStatus === 403;
      const isKeyRecognized = !isAuthError;

      if (isAuthError) {
        return {
          testedAt,
          apiKeyPreview,
          siteId,
          mode: this.mode,
          connected: false,
          httpStatus,
          code,
          message: 'Identifiants CinetPay non valides',
          description: data?.description || data?.message || 'La clé API ou le Site ID n\'a pas été reconnu par la passerelle CinetPay.',
          supportedChannels,
          isUsableForRealMoney: false,
          explanations: [
            `CinetPay a rejeté la requête avec le code ${code} (HTTP ${httpStatus}).`,
            'Vérifiez que votre Site ID correspond bien à un service actif sur votre compte CinetPay.',
            'Assurez-vous qu\'aucun espace n\'a été copié par erreur dans l\'API Key.'
          ],
          recommendations: [
            'Connectez-vous sur votre espace CinetPay -> Paramètres -> API.',
            'Regénérez votre clé API ou copiez à nouveau votre Site ID exact.'
          ],
          rawResponse: raw,
        };
      }

      // If key is recognized (even if transaction probe not found, which is normal for a probe test)
      return {
        testedAt,
        apiKeyPreview,
        siteId,
        mode: this.mode,
        connected: true,
        httpStatus,
        code,
        message: 'Passerelle CinetPay connectée avec succès !',
        description: 'Votre compte CinetPay est actif et répond aux requêtes d\'authentification.',
        supportedChannels,
        isUsableForRealMoney: this.mode === 'production',
        explanations: [
          `Authentification réussie auprès des serveurs CinetPay (Code ${code}).`,
          'Les 4 réseaux Mobile Money ivoiriens (Wave, Orange Money, MTN MoMo, Moov Flooz) sont prêts à être encaissés.',
          this.mode === 'production' 
            ? '✅ Mode Débit Réel actif : les prélèvements seront réellement effectués sur les comptes étudiants.'
            : '🧪 Mode Sandbox / Test actif : transactions d\'évaluation avant mise en service définitive.'
        ],
        recommendations: [
          'Effectuez un achat de test à 200 FCFA depuis l\'interface étudiant pour vérifier la réception du Push.',
          'Consultez vos encaissements consolidés en direct sur votre dashboard CinetPay.'
        ],
        rawResponse: raw,
      };
    } catch (err: any) {
      return {
        testedAt,
        apiKeyPreview,
        siteId,
        mode: this.mode,
        connected: false,
        httpStatus: 0,
        code: 'NETWORK_ERROR',
        message: 'Erreur réseau lors du test CinetPay',
        description: err.message || 'Impossible de joindre le serveur CinetPay',
        supportedChannels,
        isUsableForRealMoney: false,
        explanations: [
          'Le serveur de l\'application n\'a pas pu établir la connexion avec https://api-checkout.cinetpay.com.',
          'Le réseau est peut-être temporairement inaccessible.'
        ],
        recommendations: [
          'Réessayez le diagnostic dans quelques instants.',
          'Vérifiez la disponibilité du service sur status.cinetpay.com.'
        ],
      };
    }
  }
}
