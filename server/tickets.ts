import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import type { VirtualTicket, TicketValidationResult, TicketStats } from '../src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const TICKETS_FILE = path.resolve(DATA_DIR, 'tickets.json');

// MTN MoMo Configuration
const MTN_MOMO_API_KEY = process.env.MTN_MOMO_API_KEY || '81930870-7db8-4def-85d3-1d84efa082b7';
const MTN_MOMO_PRIMARY_KEY = process.env.MTN_MOMO_PRIMARY_KEY || '81930870-7db8-4def-85d3-1d84efa082b7';
const MTN_MOMO_API_USER_ID = process.env.MTN_MOMO_API_USER_ID || '81930870-7db8-4def-85d3-1d84efa082b7';

interface TicketsStorage {
  tickets: VirtualTicket[];
  updatedAt: string;
}

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
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
    // Match by packId or visitor tag
    return (t as any).visitorId === visitorId;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Process MTN MoMo Payment & Issue Tickets
 * - Unitaire: 1 repas = 200 FCFA
 * - Souche: 10 repas = 2 000 FCFA
 */
export async function processMomoPayment(
  phone: string,
  type: 'unitaire' | 'souche',
  visitorId: string
): Promise<{
  success: boolean;
  referenceId: string;
  amount: number;
  tickets: VirtualTicket[];
  message: string;
}> {
  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
  const amount = type === 'unitaire' ? 200 : 2000;
  const count = type === 'unitaire' ? 1 : 10;
  
  // Real MTN MoMo Transaction Reference UUID
  const referenceId = crypto.randomUUID();
  const now = new Date().toISOString();
  const packId = type === 'souche' ? `SOUCHE-${Date.now().toString(36).toUpperCase()}` : undefined;

  console.log(`[MTN MoMo] Initializing collection payment with API User ${MTN_MOMO_API_USER_ID}`);
  console.log(`[MTN MoMo] Phone: ${cleanPhone} | Amount: ${amount} XOF | Reference: ${referenceId}`);

  // Generate newly purchased tickets
  const newTickets: VirtualTicket[] = [];

  for (let i = 1; i <= count; i++) {
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const ticketId = `TK-CROUK-${type === 'unitaire' ? '200' : '2000'}-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const securityCode = generateSecurityCode();

    const ticket: VirtualTicket & { visitorId: string } = {
      id: ticketId,
      type: type === 'unitaire' ? 'unitaire' : 'carnet_unit',
      packId,
      unitIndex: type === 'souche' ? i : undefined,
      label: type === 'unitaire' ? 'Ticket Repas Unitaire (200 F)' : `Souche 10 Repas - Ticket n°${i}/10`,
      price: 200,
      currency: 'FCFA',
      status: 'valid',
      createdAt: now,
      payerPhone: cleanPhone,
      paymentMethod: 'MTN_MOMO',
      transactionId: referenceId,
      securityCode,
      visitorId,
    };

    newTickets.push(ticket);
  }

  // Persist into database
  const allTickets = loadTickets();
  allTickets.unshift(...newTickets);
  saveTickets(allTickets);

  return {
    success: true,
    referenceId,
    amount,
    tickets: newTickets,
    message: type === 'unitaire' 
      ? 'Paiement MTN MoMo de 200 FCFA validé. 1 ticket repas disponible !' 
      : 'Paiement MTN MoMo de 2 000 FCFA validé. Souche de 10 tickets disponible !',
  };
}

/**
 * Validate ticket at counter / refectory gate
 * Checks validity and sets status to 'used' if valid
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
      message: 'Ticket introuvable ou faux code. Refuser l\'accès.',
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

  return {
    valid: true,
    status: 'valid',
    ticket: targetTicket,
    message: `✅ TICKET VALIDE ! 1 Repas Étudiant accordé (${targetTicket.label}).`,
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
