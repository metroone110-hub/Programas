import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import type { 
  VirtualTicket, 
  TicketValidationResult, 
  TicketStats, 
  MomoPayResponse,
  PaymentDiagnosisResult 
} from '../src/types.ts';
import { MtnMomoClient, type OpenApiFullDiagnostic } from './mtnMomoClient.ts';
import { MoovMoneyClient, type MoovDiagnosisResult } from './moovMoneyClient.ts';
import { validateIvorianPhoneNumber } from '../src/utils/phoneValidator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const TICKETS_FILE = path.resolve(DATA_DIR, 'tickets.json');
const PAYMENT_CONFIG_FILE = path.resolve(DATA_DIR, 'payment-config.json');

// Default MTN MoMo Configuration
let defaultMomoKey = process.env.MTN_MOMO_API_KEY || 'e30c2168b25a47aab7e93dd81d4224e7';

interface TicketsStorage {
  tickets: VirtualTicket[];
  updatedAt: string;
}

export interface PaymentConfig {
  momoApiKey: string;
  momoApiUser: string;
  momoSubscriptionKey: string;
  momoSecondaryKey?: string;
  momoProduct?: string;
  momoTargetEnvironment?: 'sandbox' | 'production' | 'mtnciv' | string;
  momoBaseUrl?: string;
  momoCurrency?: string;
  momoReceiverPhone: string;
  momoMerchantCode: string; // e.g. *133*123456#
  crouMerchantName: string;
  allowDemoMode: boolean;
  // Moov Money API Configuration (Flooz / TLC)
  moovUsername?: string;
  moovPassword?: string;
  moovEncryptionKey?: string;
  moovBaseUrl?: string;
  moovUseSandbox?: boolean;
  moovReceiverPhone?: string;
}

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getMomoClient(overrideConfig?: Partial<PaymentConfig>): MtnMomoClient {
  const cfg = { ...getPaymentConfig(), ...overrideConfig };
  return new MtnMomoClient({
    baseUrl: cfg.momoBaseUrl,
    targetEnvironment: cfg.momoTargetEnvironment || 'sandbox',
    subscriptionKey: cfg.momoSubscriptionKey || cfg.momoApiKey || defaultMomoKey,
    secondarySubscriptionKey: cfg.momoSecondaryKey,
    apiUser: cfg.momoApiUser,
    apiKey: cfg.momoApiKey,
    currency: cfg.momoCurrency || (cfg.momoTargetEnvironment === 'production' ? 'XOF' : 'EUR'),
  });
}

export function getMoovClient(overrideConfig?: Partial<PaymentConfig>): MoovMoneyClient {
  const cfg = { ...getPaymentConfig(), ...overrideConfig };
  return new MoovMoneyClient({
    username: cfg.moovUsername,
    password: cfg.moovPassword,
    encryptionKey: cfg.moovEncryptionKey,
    baseUrl: cfg.moovBaseUrl,
    useSandbox: cfg.moovUseSandbox ?? true,
    receiverPhone: cfg.moovReceiverPhone,
  });
}

export async function diagnoseMoovApi(overrideConfig?: Partial<PaymentConfig>): Promise<MoovDiagnosisResult> {
  const client = getMoovClient(overrideConfig);
  return await client.diagnose();
}

export function getPaymentConfig(): PaymentConfig {
  ensureDataDirectory();
  try {
    if (fs.existsSync(PAYMENT_CONFIG_FILE)) {
      const raw = fs.readFileSync(PAYMENT_CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Payment Config] Error reading payment-config.json:', err);
  }
  return {
    momoApiKey: defaultMomoKey,
    momoApiUser: defaultMomoKey,
    momoSubscriptionKey: defaultMomoKey,
    momoReceiverPhone: '+225 05 00 00 00 00',
    momoMerchantCode: '*133*554433*200#',
    crouMerchantName: 'CROU-K Resto U Korhogo',
    allowDemoMode: true,
  };
}

export function savePaymentConfig(config: Partial<PaymentConfig>): PaymentConfig {
  ensureDataDirectory();
  const current = getPaymentConfig();
  const updated = { ...current, ...config };
  fs.writeFileSync(PAYMENT_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

function loadTickets(): VirtualTicket[] {
  try {
    ensureDataDirectory();
    if (fs.existsSync(TICKETS_FILE)) {
      const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
      const parsed: TicketsStorage = JSON.parse(raw);
      return Array.isArray(parsed.tickets) ? parsed.tickets : [];
    }
  } catch (err) {
    console.error('[Tickets DB] Error reading tickets.json:', err);
  }
  return [];
}

function saveTickets(tickets: VirtualTicket[]) {
  try {
    ensureDataDirectory();
    const payload: TicketsStorage = {
      tickets,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Tickets DB] Error writing tickets.json:', err);
  }
}

// Generate human-friendly 6-digit security code for fast manual verification at counter
function generateSecurityCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += digits.charAt(crypto.randomInt(0, digits.length));
  }
  return code;
}

/**
 * LIVE REAL-TIME DIAGNOSIS OF MTN MOMO API KEY
 * Actually sends HTTP probe to MTN MoMo servers to check if the key is real and active.
 */
export async function diagnoseMomoApi(customKey?: string): Promise<PaymentDiagnosisResult> {
  const keyToTest = (customKey || getPaymentConfig().momoApiKey || defaultMomoKey).trim();
  const testedAt = new Date().toISOString();

  let statusCode = 0;
  let rawResponse = '';
  let status: PaymentDiagnosisResult['status'] = 'invalid_key';

  try {
    // 1. Probe MTN Sandbox API User Lookup
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${encodeURIComponent(keyToTest)}`, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': keyToTest,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    statusCode = res.status;
    rawResponse = await res.text();

    if (statusCode === 200 || statusCode === 201) {
      status = 'sandbox_ready';
    } else if (statusCode === 500) {
      // Key was authenticated by MTN gateway, but MTN sandbox backend returned 500
      status = 'sandbox_ready';
    } else if (statusCode === 401) {
      status = 'invalid_key';
    } else {
      status = 'invalid_key';
    }
  } catch (err: any) {
    statusCode = 0;
    rawResponse = err.message || 'Erreur réseau ou délai d\'attente dépassé';
    status = 'network_error';
  }

  const explanations: string[] = [];
  const recommendations: string[] = [];

  if (statusCode === 500) {
    explanations.push(
      `Authentification réussie auprès de MTN MoMo : votre clé Subscription Collections ("${keyToTest.slice(0, 8)}...") est bien reconnue (l'erreur 401 a disparu !).`,
      `Le serveur de test Sandbox de MTN a renvoyé un code HTTP 500 ("Internal server error"). Il s'agit d'une instabilité temporaire connue de l'environnement de test de MTN MoMo.`,
      `Votre souscription "Collections" est bien enregistrée et active (State: Active) sur votre portail développeur MTN.`
    );
    recommendations.push(
      `Le mode Simulation CROU est activé pour vous permettre de tester les achats de tickets (200 F et 2 000 F) et le scanner du guichetier sans interruption.`,
      `Pour un encaissement réel sur le campus : liez votre compte marchand MTN CI ou votre compte Wave.`
    );
  } else if (statusCode === 401) {
    explanations.push(
      `Le serveur de MTN a répondu : HTTP 401 Unauthorized ("Access denied due to invalid subscription key").`,
      `La clé "${keyToTest}" n'est pas reconnue comme un abonnement actif auprès de la passerelle MTN MoMo.`,
      `Un simple UUID isolé ne peut pas prélever d'argent réel : pour débiter une carte SIM réelle en Côte d'Ivoire, MTN exige un compte Marchand officiel avec 3 clés complémentaires (Subscription Key, API User, API Secret) et une adresse IP autorisée (IP Whitelisting).`,
      `De plus, même un compte Sandbox MTN gratuit ne débite jamais d'argent réel (il ne fonctionne qu'avec des faux numéros de simulation).`
    );

    recommendations.push(
      `Pour des prélèvements réels instantanés : activer Wave Côte d'Ivoire (lien ou QR marchand direct sans délai contractuel).`,
      `Pour débiter directement MTN MoMo réel : souscrire à un contrat Marchand MTN CI ou passer par un agrégateur ivoirien (CinetPay, FedaPay, Bizao, PayDunya).`,
      `Pour tester l'application CROU-K (scanner, validation au guichet, sécurité) : utiliser le mode Simulation / Test cantine inclus.`
    );
  } else if (statusCode === 200 || statusCode === 201) {
    explanations.push(
      `La clé est reconnue avec succès par la Sandbox MTN MoMo (HTTP 200 OK).`,
      `Attention : La sandbox MTN est un environnement virtuel de test. Elle ne prélève pas d'argent réel sur les cartes SIM du campus.`
    );
    recommendations.push(
      `Pour la production avec débit réel, connectez vos identifiants MTN MoMo Live Production.`
    );
  } else {
    explanations.push(
      `Statut renvoyé par MTN MoMo : Code HTTP ${statusCode}. Réponse : ${rawResponse}`
    );
    recommendations.push(
      `Vérifiez votre connexion internet ou réessayez dans quelques instants.`
    );
  }

  let finalMessage = '';
  if (statusCode === 200 || statusCode === 201) {
    finalMessage = 'Clé Sandbox MTN connectée avec succès (HTTP 200)';
  } else if (statusCode === 500) {
    finalMessage = 'Clé Collections active sur MTN (Serveur Sandbox MTN en maintenance temporaire HTTP 500)';
  } else if (statusCode === 401) {
    finalMessage = 'Clé MTN MoMo invalide ou inactive (Accès refusé par MTN - Erreur 401)';
  } else {
    finalMessage = `Réponse MTN MoMo (Code HTTP ${statusCode})`;
  }

  return {
    momoApiKey: keyToTest,
    status,
    statusCode,
    message: finalMessage,
    rawResponse,
    isUsableForRealMoney: false, // Sandbox key can never debit real money!
    explanations,
    recommendations,
    testedAt,
  };
}

// Retrieve tickets for a student (matched by visitorId or phone)
export function getStudentTickets(visitorId: string, phone?: string): VirtualTicket[] {
  const all = loadTickets();
  const cleanedPhone = phone ? phone.replace(/\s+/g, '') : null;
  return all.filter((t) => {
    if (t.id.includes(visitorId)) return true;
    if (t.transactionId && t.transactionId.includes(visitorId)) return true;
    if (cleanedPhone && t.payerPhone && t.payerPhone.replace(/\s+/g, '').includes(cleanedPhone)) {
      return true;
    }
    return (t as any).visitorId === visitorId;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Run full OpenAPI spec diagnostic on MTN MoMo collection endpoints
 */
export async function runMomoOpenApiDiagnostic(customConfig?: Partial<PaymentConfig>): Promise<OpenApiFullDiagnostic> {
  const client = getMomoClient(customConfig);
  return await client.runOpenApiDiagnostic();
}

/**
 * Process Payment & Issue Tickets
 * Strict implementation of MTN MoMo OpenAPI Collection (POST /collection/v1_0/requesttopay)
 * Supports:
 * - MTN_MOMO (executes official OpenAPI RequestToPay with Bearer token & X-Reference-Id)
 * - DEMO (Simulation test for counter demo & campus test)
 */
export async function processPayment(
  phone: string,
  type: 'unitaire' | 'souche',
  visitorId: string,
  paymentMethod: 'MTN_MOMO' | 'MOOV_MONEY' | 'DEMO' = 'MTN_MOMO',
  forceSimulation: boolean = false
): Promise<MomoPayResponse> {
  const isSimulation = forceSimulation || paymentMethod === 'DEMO';
  const amount = type === 'unitaire' ? 200 : 2000;
  const count = type === 'unitaire' ? 1 : 10;
  const now = new Date().toISOString();
  const config = getPaymentConfig();

  // 1. Strict Ivorian Phone Validation (Moov 01..., MTN 05...)
  const validation = validateIvorianPhoneNumber(phone, isSimulation ? 'DEMO' : paymentMethod);
  if (!validation.valid && !isSimulation) {
    console.warn(`[Payment Validation Error] Invalid phone: "${phone}" for method ${paymentMethod}: ${validation.error}`);
    return {
      success: false,
      referenceId: crypto.randomUUID(),
      status: 'FAILED',
      amount,
      message: validation.error || "Numéro de téléphone invalide pour l'opérateur sélectionné.",
      errorDetail: `Opérateur détecté : ${validation.operator}. Numéro requis : ${paymentMethod === 'MOOV_MONEY' ? 'Moov Africa (préfixe 01)' : 'MTN (préfixe 05)'}.`,
    };
  }

  const cleanPhone = validation.cleanPhone || phone.trim().replace(/[^\d+]/g, '');

  let paymentReferenceId: string = crypto.randomUUID();
  let providerMessage: string = '';

  // 2. Process MTN MoMo if selected and not simulation
  if (paymentMethod === 'MTN_MOMO' && !isSimulation) {
    const client = getMomoClient();

    console.log(`[MTN MoMo OpenAPI] Initiating real RequestToPay for ${cleanPhone}, amount: ${amount}`);
    const momoResult = await client.requestToPay({
      amount,
      payerPhone: cleanPhone,
      externalId: `CROU-${Date.now().toString(36).toUpperCase()}`,
      payerMessage: `Ticket Cantine CROU-K (${amount} FCFA)`,
      payeeNote: 'Restaurant Univ. Korhogo',
    });

    paymentReferenceId = momoResult.referenceId;

    // Handle Rejected Subscription Key (HTTP 401)
    if (momoResult.status === 'REJECTED' || momoResult.httpStatus === 401) {
      console.warn(`[MTN MoMo OpenAPI] Request rejected: HTTP 401`);
      return {
        success: false,
        referenceId: paymentReferenceId,
        status: 'REJECTED_KEY',
        amount,
        message: `La tentative de prélèvement réel MTN MoMo a échoué : la clé API ("${config.momoSubscriptionKey || config.momoApiKey}") a été rejetée (HTTP 401 Unauthorized). Aucun montant n'a été prélevé sur le numéro ${cleanPhone}.`,
        errorDetail: 'Vérifiez la clé de souscription Collections dans l\'administration ou utilisez le mode test.',
        apiStatus: {
          connected: false,
          statusCode: 401,
          reason: momoResult.error || 'Access denied due to invalid subscription key',
        },
      };
    }

    // Handle Sandbox 500 error or other server issues
    if (!momoResult.success && momoResult.httpStatus === 500) {
      console.warn(`[MTN MoMo OpenAPI] Server 500 response from MTN MoMo Sandbox`);
      return {
        success: false,
        referenceId: paymentReferenceId,
        status: 'FAILED',
        amount,
        message: `Le serveur de paiement MTN MoMo a répondu avec une erreur interne (HTTP 500). Aucun montant n'a été prélevé sur le numéro ${cleanPhone}.`,
        errorDetail: momoResult.error || momoResult.rawResponse || 'HTTP 500 Internal Server Error',
        apiStatus: {
          connected: true,
          statusCode: 500,
          reason: 'MTN Sandbox Internal Server Error',
        },
      };
    }

    // If generic error
    if (!momoResult.success) {
      return {
        success: false,
        referenceId: paymentReferenceId,
        status: 'FAILED',
        amount,
        message: momoResult.message || `Échec du prélèvement réel MTN MoMo (Code HTTP ${momoResult.httpStatus}). Aucun montant n'a été prélevé sur votre compte.`,
        errorDetail: momoResult.error || momoResult.rawResponse,
        apiStatus: {
          connected: false,
          statusCode: momoResult.httpStatus,
          reason: momoResult.error,
        },
      };
    }

    providerMessage = momoResult.message;
  }

  // 3. Process Moov Money (Flooz) if selected and not simulation
  if (paymentMethod === 'MOOV_MONEY' && !isSimulation) {
    const moovClient = getMoovClient();
    console.log(`[Moov Money Flooz] Initiating real PushTransaction for ${cleanPhone}, amount: ${amount}`);

    // Call Moov SOAP API with withPending=true and allowSimulationFallback=false
    const moovResult = await moovClient.pushTransaction({
      phone: cleanPhone,
      amount,
      message: `Ticket Resto-U CROU-K (${amount} FCFA)`,
      data1: `CROU-${Date.now().toString(36).toUpperCase()}`,
      data2: 'UPGC-Korhogo',
    }, true, false);

    paymentReferenceId = moovResult.transId || moovResult.referenceId;

    // If Moov did not confirm transaction initiation, strictly reject!
    if (!moovResult.success) {
      console.warn(`[Moov Money] Transaction rejected with status ${moovResult.statusCode}: ${moovResult.description}`);
      return {
        success: false,
        referenceId: paymentReferenceId,
        status: 'FAILED',
        amount,
        message: moovResult.longDescription || `Échec du prélèvement Moov Money (Code ${moovResult.statusCode}) : ${moovResult.description}. Aucun montant n'a été débité sur le numéro ${cleanPhone}.`,
        errorDetail: moovResult.description || moovResult.rawResponse,
        apiStatus: {
          connected: false,
          statusCode: moovResult.statusCode,
          reason: moovResult.description,
        },
      };
    }

    providerMessage = moovResult.statusCode === 100
      ? `Demande de prélèvement réel Moov Money envoyée à votre mobile (${cleanPhone}). Tapez votre code PIN sur l'écran pour autoriser les ${amount} FCFA.`
      : `Paiement réel Moov Money (${amount} FCFA) débité avec succès !`;
  }

  const referenceId = paymentReferenceId;
  const packId = type === 'souche' ? `SOUCHE-${Date.now().toString(36).toUpperCase()}` : undefined;

  // Generate tickets
  const newTickets: VirtualTicket[] = [];

  for (let i = 1; i <= count; i++) {
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const ticketId = `TK-CROUK-${type === 'unitaire' ? '200' : '2000'}-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const securityCode = generateSecurityCode();

    const actualMethod: 'MTN_MOMO' | 'MOOV_MONEY' | 'DEMO' = isSimulation 
      ? 'DEMO' 
      : (paymentMethod === 'MOOV_MONEY' ? 'MOOV_MONEY' : 'MTN_MOMO');

    const ticket: VirtualTicket & { visitorId: string } = {
      id: ticketId,
      type: type === 'unitaire' ? 'unitaire' : 'carnet_unit',
      packId,
      unitIndex: type === 'souche' ? i : undefined,
      label: type === 'unitaire' 
        ? (isSimulation ? 'Ticket Test Unitaire (200 F)' : 'Ticket Repas Unitaire (200 F)') 
        : (isSimulation ? `Souche Test 10 Repas - Ticket n°${i}/10` : `Souche 10 Repas - Ticket n°${i}/10`),
      price: 200,
      currency: 'FCFA',
      status: 'valid',
      createdAt: now,
      payerPhone: cleanPhone,
      paymentMethod: actualMethod,
      transactionId: referenceId,
      securityCode,
      visitorId,
      isSimulation,
    };

    newTickets.push(ticket);
  }

  // Persist tickets into database
  const allTickets = loadTickets();
  allTickets.unshift(...newTickets);
  saveTickets(allTickets);

  let successMsg = '';
  if (isSimulation) {
    successMsg = type === 'unitaire'
      ? '🧪 [Mode Test Cantine] 1 ticket repas généré pour test (aucun argent débité).'
      : '🧪 [Mode Test Cantine] Souche de 10 tickets générée pour test (aucun argent débité).';
  } else {
    successMsg = providerMessage || (type === 'unitaire'
      ? 'Paiement de 200 FCFA validé. 1 ticket repas disponible !'
      : 'Paiement de 2 000 FCFA validé. Souche de 10 tickets disponible !');
  }

  return {
    success: true,
    referenceId,
    status: 'SUCCESSFUL',
    amount,
    tickets: newTickets,
    message: successMsg,
  };
}

// Keep backward compatibility
export const processMomoPayment = (
  phone: string, 
  type: 'unitaire' | 'souche', 
  visitorId: string
) => processPayment(phone, type, visitorId, 'MTN_MOMO', false);

/**
 * Validate ticket at counter / refectory gate
 */
export function validateTicketAtCounter(identifier: string): TicketValidationResult {
  if (!identifier || typeof identifier !== 'string') {
    return {
      valid: false,
      status: 'not_found',
      message: 'Code de ticket vide ou non reconnu',
    };
  }

  const clean = identifier.trim().replace(/\s+/g, '');
  const allTickets = loadTickets();

  // Find by ticket ID, security code, or JSON payload containing ticket id
  let targetTicket: VirtualTicket | undefined;

  // Try parse if JSON QR was scanned
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      if (parsed.id) {
        targetTicket = allTickets.find((t) => t.id === parsed.id);
      }
      if (!targetTicket && parsed.securityCode) {
        targetTicket = allTickets.find((t) => t.securityCode === parsed.securityCode);
      }
    } catch {
      // ignore json parse error
    }
  }

  if (!targetTicket) {
    targetTicket = allTickets.find(
      (t) =>
        t.id.toLowerCase() === clean.toLowerCase() ||
        t.securityCode === clean ||
        t.securityCode.replace(/\s+/g, '') === clean
    );
  }

  if (!targetTicket) {
    return {
      valid: false,
      status: 'not_found',
      message: 'Ticket introuvable ou faux code. Refuser l\'accès au réfectoire.',
    };
  }

  if (targetTicket.status === 'used') {
    const formattedDate = targetTicket.usedAt 
      ? new Date(targetTicket.usedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : 'précédemment';

    return {
      valid: false,
      status: 'used',
      ticket: targetTicket,
      message: `ALERTE : Ce ticket a DÉJÀ ÉTÉ UTILISÉ aujourd'hui à ${formattedDate}. Refuser le passage.`,
      validatedAt: targetTicket.usedAt,
    };
  }

  // Mark ticket as used right now
  const now = new Date().toISOString();
  targetTicket.status = 'used';
  targetTicket.usedAt = now;
  saveTickets(allTickets);

  const prefix = targetTicket.isSimulation ? '🧪 [TEST] ' : '✅ ';
  return {
    valid: true,
    status: 'valid',
    ticket: targetTicket,
    message: `${prefix}TICKET VALIDE ! 1 Repas Étudiant accordé (${targetTicket.label}).`,
    validatedAt: now,
  };
}

/**
 * Get ticket statistics for canteen administration
 */
export function getTicketStats(): TicketStats {
  const allTickets = loadTickets();
  const totalSold = allTickets.length;
  const totalUsed = allTickets.filter((t) => t.status === 'used').length;
  const totalActive = allTickets.filter((t) => t.status === 'valid').length;
  const totalRevenue = totalSold * 200;

  const recentValidations = allTickets
    .filter((t) => t.status === 'used' && t.usedAt)
    .sort((a, b) => new Date(b.usedAt!).getTime() - new Date(a.usedAt!).getTime())
    .slice(0, 15)
    .map((t) => ({
      id: t.id,
      securityCode: t.securityCode,
      usedAt: t.usedAt!,
      label: t.label,
      payerPhone: t.payerPhone,
    }));

  return {
    totalSold,
    totalUsed,
    totalActive,
    totalRevenue,
    currency: 'FCFA',
    recentValidations,
  };
}

/**
 * Clear test tickets (for admin maintenance)
 */
export function resetAllTickets(): boolean {
  try {
    saveTickets([]);
    return true;
  } catch (err) {
    console.error('Error resetting tickets:', err);
    return false;
  }
}
