import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  getRestaurantData,
  saveRestaurantData,
  publishMenuWithHistory,
  deleteHistoricMenu,
  resetToDefaults,
} from './server/db.ts';
import {
  getAdminStatus,
  setupInitialAdmin,
  loginAdmin,
  verifySessionToken,
  updateAdminCredentials,
} from './server/auth.ts';
import {
  parseMenuImageWithGemini,
} from './server/gemini.ts';
import {
  recordAnalyticsEvent,
  getAnalyticsData,
  resetAnalyticsData,
} from './server/analytics.ts';
import {
  getStudentTickets,
  processMomoPayment,
  processPayment,
  diagnoseMomoApi,
  runMomoOpenApiDiagnostic,
  getMomoClient,
  diagnoseMoovApi,
  getMoovClient,
  diagnoseCinetPayApi,
  getCinetPayClient,
  createAndSaveTickets,
  loadTickets,
  getPaymentConfig,
  savePaymentConfig,
  validateTicketAtCounter,
  getTicketStats,
  resetAllTickets,
} from './server/tickets.ts';
import {
  updateStudentPresence,
  getLivePresence,
  RESTO_CROU_K,
} from './server/presence.ts';
import type { RestaurantData, ServiceMenu } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();

// Enable high payload limit for mobile menu photos (JPEG/PNG camera captures)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to check admin authorization via secure session token
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.authorization;
  return verifySessionToken(authHeader);
}

// ------------------- API ROUTES -------------------

// 1. GET /api/menu - Public: fetch restaurant info, hours, pricing, and current menu
app.get('/api/menu', (req: Request, res: Response) => {
  try {
    const data = getRestaurantData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Impossible de récupérer le menu' });
  }
});

// 2. Authentication endpoints
// GET /api/auth/status - Check if an admin account is initialized
app.get('/api/auth/status', (req: Request, res: Response) => {
  try {
    const status = getAdminStatus();
    res.json(status);
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Erreur statut authentification' });
  }
});

// POST /api/auth/setup - First-time personalized account initialization
app.post('/api/auth/setup', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = setupInitialAdmin(username, password);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res.json({
      success: true,
      token: result.token,
      username: username.trim(),
      message: 'Compte gestionnaire configuré avec succès !',
    });
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: 'Erreur lors de la configuration du compte' });
  }
});

// POST /api/auth/login - Admin login with personalized Pseudo and Password
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez saisir votre pseudo et votre mot de passe.',
      });
    }

    const result = loginAdmin(username, password);
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      token: result.token,
      username: result.username,
      message: 'Connexion gestionnaire réussie',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erreur lors de la tentative de connexion' });
  }
});

// POST /api/auth/update-credentials - Change pseudo or password
app.post('/api/auth/update-credentials', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const { oldPassword, newUsername, newPassword } = req.body;

    if (!oldPassword) {
      return res.status(400).json({ success: false, error: 'L\'ancien mot de passe est obligatoire pour confirmer la modification.' });
    }

    const result = updateAdminCredentials(token, oldPassword, newUsername, newPassword);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      username: result.username,
      message: 'Identifiants mis à jour avec succès.',
    });
  } catch (error) {
    console.error('Update credentials error:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des identifiants' });
  }
});

// 3. POST /api/menu - Admin: update and archive menu with date history
app.post('/api/menu', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { menu } = req.body as { menu: ServiceMenu };
    if (!menu || !Array.isArray(menu.items)) {
      return res.status(400).json({ error: 'Données de menu invalides' });
    }

    const updatedData = publishMenuWithHistory(menu);

    return res.json({
      success: true,
      message: 'Menu publié avec succès et archivé avec sa date dans l\'historique',
      data: updatedData,
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du menu' });
  }
});

// DELETE /api/menu/history/:date/:service - Admin: delete an archived menu
app.delete('/api/menu/history/:date/:service', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const { date, service } = req.params;
    const updatedData = deleteHistoricMenu(date, service);
    return res.json({
      success: true,
      message: 'Menu supprimé de l\'historique',
      data: updatedData,
    });
  } catch (error) {
    console.error('Error deleting historic menu:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression du menu' });
  }
});

// 4. POST /api/info - Admin: update hours, announcement, pricing, crowd level
app.post('/api/info', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { announcement, hours, pricing, name, campus } = req.body;
    const currentData = getRestaurantData();

    if (announcement !== undefined) currentData.announcement = announcement;
    if (hours) currentData.hours = { ...currentData.hours, ...hours };
    if (pricing) currentData.pricing = { ...currentData.pricing, ...pricing };
    if (name) currentData.name = name;
    if (campus) currentData.campus = campus;

    saveRestaurantData(currentData);
    return res.json({
      success: true,
      message: 'Informations du restaurant mises à jour',
      data: currentData,
    });
  } catch (error) {
    console.error('Error updating restaurant info:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des informations' });
  }
});

// 5. POST /api/menu/scan - Admin: OCR extraction of menu picture via Gemini 3.8 Flash
app.post('/api/menu/scan', async (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Aucune image n'a été fournie pour l'analyse" });
    }

    const extraction = await parseMenuImageWithGemini(imageBase64, mimeType || 'image/jpeg');
    return res.json({
      success: true,
      data: extraction,
    });
  } catch (error: any) {
    console.error('OCR analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur lors de l'analyse IA de l'image du menu",
    });
  }
});

// 6. POST /api/menu/reset - Admin: reset data to default demo menu
app.post('/api/menu/reset', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const freshData = resetToDefaults();
    return res.json({
      success: true,
      message: 'Menu réinitialisé avec les données par défaut du CROU',
      data: freshData,
    });
  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: 'Erreur de réinitialisation' });
  }
});

// 7. ANALYTICS ROUTES (DEVELOPER AUDIENCE & INTERACTION MONITORING)
// POST /api/analytics/track - Public: anonymous telemetry beacon
app.post('/api/analytics/track', (req: Request, res: Response) => {
  try {
    const { visitorId, type, action, device, metadata } = req.body;
    if (!visitorId || !type || !action) {
      return res.status(400).json({ error: 'Données de suivi incomplètes' });
    }
    recordAnalyticsEvent({
      visitorId: String(visitorId).slice(0, 64),
      type,
      action,
      device: typeof device === 'string' ? device.slice(0, 64) : undefined,
      metadata: typeof metadata === 'object' ? metadata : {},
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return res.status(500).json({ error: 'Erreur enregistrement télémétrie' });
  }
});

// GET /api/analytics - Admin/Dev only: get aggregated metrics
app.get('/api/analytics', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const data = getAnalyticsData();
    // Do not expose raw internal visitor IDs array
    const { uniqueVisitorsList, ...safeData } = data;
    return res.json({
      success: true,
      analytics: safeData,
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return res.status(500).json({ error: 'Erreur récupération statistiques' });
  }
});

// POST /api/analytics/reset - Admin/Dev only: reset metrics
app.post('/api/analytics/reset', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const fresh = resetAnalyticsData();
    const { uniqueVisitorsList, ...safeData } = fresh;
    return res.json({
      success: true,
      message: 'Statistiques réinitialisées avec succès',
      analytics: safeData,
    });
  } catch (error) {
    console.error('Reset analytics error:', error);
    return res.status(500).json({ error: 'Erreur réinitialisation statistiques' });
  }
});

// ------------------- MTN MOMO & CROU TICKETS API -------------------

// GET /api/tickets/my-tickets - Fetch tickets for student by visitorId or phone
app.get('/api/tickets/my-tickets', (req: Request, res: Response) => {
  try {
    const visitorId = (req.query.visitorId as string) || '';
    const phone = req.query.phone as string | undefined;
    if (!visitorId && !phone) {
      return res.json({ tickets: [] });
    }
    const tickets = getStudentTickets(visitorId, phone);
    return res.json({ success: true, tickets });
  } catch (error) {
    console.error('Fetch student tickets error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des tickets' });
  }
});

// POST /api/tickets/pay-momo - Pay via MTN MoMo / Wave / Demo
app.post('/api/tickets/pay-momo', async (req: Request, res: Response) => {
  try {
    const { phone, type, visitorId, paymentMethod, forceSimulation } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone requis' });
    }
    if (type !== 'unitaire' && type !== 'souche') {
      return res.status(400).json({ success: false, error: 'Type de ticket invalide' });
    }

    const result = await processPayment(
      phone,
      type,
      visitorId || 'vis_' + Date.now().toString(36),
      paymentMethod || 'MTN_MOMO',
      Boolean(forceSimulation)
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du traitement du paiement',
    });
  }
});

// GET /api/tickets/momo-diagnosis - Real-time diagnostic of MTN MoMo connection
app.get('/api/tickets/momo-diagnosis', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string | undefined;
    const diagnosis = await diagnoseMomoApi(key);
    return res.json({ success: true, diagnosis });
  } catch (error: any) {
    console.error('MTN MoMo diagnosis error:', error);
    return res.status(500).json({ error: error.message || 'Erreur diagnostic MoMo' });
  }
});

// POST /api/tickets/momo-diagnosis - Test any specific key live
app.post('/api/tickets/momo-diagnosis', async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    const diagnosis = await diagnoseMomoApi(key);
    return res.json({ success: true, diagnosis });
  } catch (error: any) {
    console.error('MTN MoMo diagnosis error:', error);
    return res.status(500).json({ error: error.message || 'Erreur diagnostic MoMo' });
  }
});

// GET /api/tickets/momo-openapi-diagnostic - Run comprehensive OpenAPI diagnostic pipeline
app.get('/api/tickets/momo-openapi-diagnostic', async (req: Request, res: Response) => {
  try {
    const diagnostic = await runMomoOpenApiDiagnostic(req.query as any);
    return res.json({ success: true, diagnostic });
  } catch (error: any) {
    console.error('MTN OpenAPI diagnostic error:', error);
    return res.status(500).json({ error: error.message || 'Erreur diagnostic OpenAPI MTN' });
  }
});

// POST /api/tickets/momo-openapi-diagnostic - Run diagnostic with custom parameters
app.post('/api/tickets/momo-openapi-diagnostic', async (req: Request, res: Response) => {
  try {
    const diagnostic = await runMomoOpenApiDiagnostic(req.body);
    return res.json({ success: true, diagnostic });
  } catch (error: any) {
    console.error('MTN OpenAPI diagnostic error:', error);
    return res.status(500).json({ error: error.message || 'Erreur diagnostic OpenAPI MTN' });
  }
});

// GET /api/tickets/momo-status/:referenceId - OpenAPI: GET /collection/v1_0/requesttopay/{referenceId}
app.get('/api/tickets/momo-status/:referenceId', async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    const client = getMomoClient();
    const result = await client.getRequestToPayStatus(referenceId);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tickets/momo-balance - OpenAPI: GET /collection/v1_0/account/balance
app.get('/api/tickets/momo-balance', async (req: Request, res: Response) => {
  try {
    const client = getMomoClient();
    const result = await client.getAccountBalance();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tickets/moov-diagnosis - Live diagnostic for Moov Money (Flooz)
app.get('/api/tickets/moov-diagnosis', async (req: Request, res: Response) => {
  try {
    const result = await diagnoseMoovApi();
    return res.json({ success: true, diagnosis: result });
  } catch (error: any) {
    console.error('Moov Money diagnosis error:', error);
    return res.status(500).json({ error: error.message || 'Erreur diagnostic Moov' });
  }
});

// POST /api/tickets/moov-diagnosis - Test Moov with custom parameters
app.post('/api/tickets/moov-diagnosis', async (req: Request, res: Response) => {
  try {
    const result = await diagnoseMoovApi(req.body);
    return res.json({ success: true, diagnosis: result });
  } catch (error: any) {
    console.error('Moov Money diagnosis error:', error);
    return res.status(500).json({ error: error.message || 'Erreur diagnostic Moov' });
  }
});

// POST /api/tickets/moov-push - Test direct USSD Push to a test phone number
app.post('/api/tickets/moov-push', async (req: Request, res: Response) => {
  try {
    const { phone, amount, message, config } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone requis' });
    }
    const client = getMoovClient(config);
    const result = await client.pushTransaction({
      phone,
      amount: Number(amount) || 200,
      message: message || 'Test USSD Moov Money CROU Korhogo',
    });
    return res.json({ success: true, result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tickets/moov-status/:referenceId - Query Moov transaction status
app.get('/api/tickets/moov-status/:referenceId', async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    const client = getMoovClient();
    const result = await client.getTransactionStatus(referenceId);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CINETPAY MULTI-OPERATOR API (Wave, Orange, MTN, Moov) ====================

// POST /api/tickets/cinetpay-init - Initialize multi-network payment
app.post('/api/tickets/cinetpay-init', async (req: Request, res: Response) => {
  try {
    const { type, phone, visitorId, customerName } = req.body;
    const cleanPhone = (phone || '').replace(/\D/g, '').replace(/^225/, '') || '0102030405';
    const amount = type === 'souche' ? 2000 : 200;
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const transactionId = `CP-CROUK-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const client = getCinetPayClient();
    const result = await client.initiatePayment({
      transactionId,
      amount,
      description: `Ticket Resto-U CROU-K (${amount} FCFA)`,
      customerPhone: cleanPhone,
      customerName: customerName || 'Étudiant UPGC',
      visitorId: visitorId || 'vis_' + Date.now().toString(36),
    });

    return res.json(result);
  } catch (error: any) {
    console.error('[CinetPay Init Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erreur initialisation CinetPay' });
  }
});

// GET /api/tickets/cinetpay-status/:transactionId - Check transaction status and retrieve tickets
app.get('/api/tickets/cinetpay-status/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const allTickets = loadTickets();
    const matched = allTickets.filter((t) => t.transactionId === transactionId);
    if (matched.length > 0) {
      return res.json({
        success: true,
        status: 'ACCEPTED',
        tickets: matched,
        message: 'Paiement CinetPay confirmé et ticket repas généré !',
      });
    }

    const client = getCinetPayClient();
    const check = await client.checkTransaction(transactionId);
    if (check.status === 'ACCEPTED') {
      const tickets = createAndSaveTickets({
        type: (check.amount && check.amount >= 2000) ? 'souche' : 'unitaire',
        phone: '0102030405',
        visitorId: 'vis_cinetpay',
        paymentMethod: 'CINETPAY',
        referenceId: transactionId,
        isSimulation: false,
      });
      return res.json({
        success: true,
        status: 'ACCEPTED',
        tickets,
        message: 'Paiement CinetPay validé avec succès !',
      });
    }

    return res.json({
      success: check.success,
      status: check.status,
      message: check.message,
    });
  } catch (error: any) {
    console.error('[CinetPay Check Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tickets/cinetpay-notify - Webhook IPN called directly by CinetPay servers
app.post('/api/tickets/cinetpay-notify', async (req: Request, res: Response) => {
  try {
    console.log('[CinetPay Webhook Received]:', req.body);
    const transactionId = req.body?.cpm_trans_id || req.body?.transaction_id;
    if (!transactionId) {
      return res.status(400).send('Transaction ID manquant');
    }

    const client = getCinetPayClient();
    const check = await client.checkTransaction(transactionId);
    if (check.status === 'ACCEPTED') {
      createAndSaveTickets({
        type: (check.amount && check.amount >= 2000) ? 'souche' : 'unitaire',
        phone: req.body?.cel_phone_num || '0102030405',
        visitorId: req.body?.cpm_custom || 'vis_cinetpay',
        paymentMethod: 'CINETPAY',
        referenceId: transactionId,
        isSimulation: false,
      });
      console.log(`[CinetPay Webhook] Ticket validé avec succès pour ${transactionId}`);
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('[CinetPay Webhook Error]:', error);
    return res.status(500).send('Erreur webhook CinetPay');
  }
});

// POST /api/tickets/cinetpay-simulate-success - Immediate test simulation for testing the CinetPay student UX
app.post('/api/tickets/cinetpay-simulate-success', (req: Request, res: Response) => {
  try {
    const { transactionId, type, phone, visitorId, operator } = req.body;
    const tickets = createAndSaveTickets({
      type: type === 'souche' ? 'souche' : 'unitaire',
      phone: phone || '0102030405',
      visitorId: visitorId || 'vis_sim',
      paymentMethod: 'CINETPAY',
      referenceId: transactionId || `CP-SIM-${Date.now().toString(36).toUpperCase()}`,
      isSimulation: true,
    });
    return res.json({
      success: true,
      status: 'ACCEPTED',
      tickets,
      message: `Paiement CinetPay test (${operator || 'Multi-opérateur'}) validé ! Votre ticket repas est prêt.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tickets/cinetpay-diagnosis - Real-time diagnosis of CinetPay credentials
app.get('/api/tickets/cinetpay-diagnosis', async (req: Request, res: Response) => {
  try {
    const result = await diagnoseCinetPayApi();
    return res.json({ success: true, diagnosis: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur diagnostic CinetPay' });
  }
});

// POST /api/tickets/cinetpay-diagnosis - Test CinetPay with custom parameters
app.post('/api/tickets/cinetpay-diagnosis', async (req: Request, res: Response) => {
  try {
    const result = await diagnoseCinetPayApi(req.body);
    return res.json({ success: true, diagnosis: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur diagnostic CinetPay' });
  }
});

// GET /api/tickets/payment-config - Get payment gateway configuration
app.get('/api/tickets/payment-config', (req: Request, res: Response) => {
  try {
    const config = getPaymentConfig();
    return res.json({ success: true, config });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lecture configuration' });
  }
});

// POST /api/tickets/payment-config - Save payment gateway configuration (Admin)
app.post('/api/tickets/payment-config', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const updated = savePaymentConfig(req.body);
    return res.json({ success: true, config: updated, message: 'Configuration enregistrée' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur sauvegarde configuration' });
  }
});

// POST /api/tickets/validate - Cashier/Admin endpoint to validate ticket at counter
app.post('/api/tickets/validate', (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ valid: false, status: 'not_found', message: 'Identifiant de ticket manquant' });
    }

    const result = validateTicketAtCounter(identifier);
    return res.json(result);
  } catch (error) {
    console.error('Ticket validation error:', error);
    return res.status(500).json({ valid: false, status: 'not_found', message: 'Erreur serveur lors de la vérification' });
  }
});

// GET /api/tickets/stats - Cashier & Admin stats
app.get('/api/tickets/stats', (req: Request, res: Response) => {
  try {
    const stats = getTicketStats();
    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Ticket stats error:', error);
    return res.status(500).json({ error: 'Erreur récupération statistiques tickets' });
  }
});

// POST /api/tickets/reset - Reset tickets (Admin only)
app.post('/api/tickets/reset', (req: Request, res: Response) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const success = resetAllTickets();
    return res.json({ success, message: 'Tous les tickets ont été réinitialisés' });
  } catch (error) {
    console.error('Reset tickets error:', error);
    return res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

// ------------------- PRESENCE & GOOGLE MAPS GEOFENCE ROUTES -------------------

// GET /api/presence/live - Real-time crowd count, active students in circle, and service forecast
app.get('/api/presence/live', (req: Request, res: Response) => {
  try {
    const visitorId = req.query.visitorId as string | undefined;
    const data = getLivePresence(visitorId);
    return res.json(data);
  } catch (error) {
    console.error('Presence live error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération de l’affluence' });
  }
});

// POST /api/presence/ping - Register or update a student's location / simulated presence in geofence
app.post('/api/presence/ping', (req: Request, res: Response) => {
  try {
    const { visitorId, lat, lng, simulatedInside } = req.body;
    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId requis' });
    }
    const result = updateStudentPresence(visitorId, lat, lng, simulatedInside);
    const liveData = getLivePresence(visitorId);
    return res.json({ success: true, ...result, live: liveData });
  } catch (error) {
    console.error('Presence ping error:', error);
    return res.status(500).json({ error: 'Erreur mise à jour présence' });
  }
});

// GET /download/contrat-mtn-momo.pdf & /contrat-mtn-momo.pdf - Direct download and view of completed MTN MoMo contract PDF
const servePdfContract = (req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'CONTRAT_PARTENARIAT_MTN_MOMO_REMPLI.pdf');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    const disposition = req.query.view === '1' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="CONTRAT_PARTENARIAT_MTN_MOMO_REMPLI.pdf"`);
    return res.sendFile(filePath);
  }
  return res.status(404).send('Fichier PDF introuvable');
};

app.get('/download/contrat-mtn-momo.pdf', servePdfContract);
app.get('/download/CONTRAT_PARTENARIAT_MTN_MOMO_REMPLI.pdf', servePdfContract);
app.get('/contrat-mtn-momo.pdf', servePdfContract);

// ------------------- VITE / STATIC SERVING -------------------
async function startServer() {
  if (!isProd) {
    // Development mode: attach Vite middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CROU Resto U] Serveur opérationnel sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
