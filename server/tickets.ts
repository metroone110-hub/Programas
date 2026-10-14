import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import type { VirtualTicket, TicketValidationResult, TicketStats } from '../src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

interface TicketsDataStore {
  tickets: VirtualTicket[];
  fraudAttemptsCount: number;
  recentScans: Array<{
    ticketId: string;
    token: string;
    status: 'valid' | 'used' | 'expired';
    validatedAt: string;
    isDoubleAttempt?: boolean;
  }>;
}

function ensureTicketsFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TICKETS_FILE)) {
    const initial: TicketsDataStore = {
      tickets: [],
      fraudAttemptsCount: 0,
      recentScans: [],
    };
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readTicketsStore(): TicketsDataStore {
  try {
    ensureTicketsFile();
    const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.tickets)) parsed.tickets = [];
    if (typeof parsed.fraudAttemptsCount !== 'number') parsed.fraudAttemptsCount = 0;
    if (!Array.isArray(parsed.recentScans)) parsed.recentScans = [];
    return parsed;
  } catch (err) {
    console.error('Error reading tickets store:', err);
    return { tickets: [], fraudAttemptsCount: 0, recentScans: [] };
  }
}

function writeTicketsStore(data: TicketsDataStore): void {
  try {
    ensureTicketsFile();
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tickets store:', err);
  }
}

function generateRandomCode(length = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[crypto.randomInt(0, digits.length)];
  }
  return code;
}

/**
 * Get all tickets for a specific student visitor
 */
export function getStudentTickets(visitorId: string): VirtualTicket[] {
  if (!visitorId) return [];
  const store = readTicketsStore();
  return store.tickets
    .filter(t => t.studentVisitorId === visitorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Generate test tickets for a student (Demonstration & Validation testing)
 */
export function createStudentTickets(
  visitorId: string, 
  type: 'unitaire' | 'souche'
): VirtualTicket[] {
  const store = readTicketsStore();
  const created: VirtualTicket[] = [];
  const now = new Date().toISOString();

  if (type === 'unitaire') {
    const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const ticketId = `TK-UPGC-${randPart}`;
    const token = `CROUK:TK:${ticketId}:${crypto.randomBytes(8).toString('hex')}`;
    const securityCode = generateRandomCode(6);

    const ticket: VirtualTicket = {
      id: ticketId,
      token,
      type: 'unitaire',
      label: 'Ticket Repas Étudiant (200 FCFA)',
      price: 200,
      currency: 'FCFA',
      status: 'valid',
      createdAt: now,
      securityCode,
      studentVisitorId: visitorId,
    };
    created.push(ticket);
    store.tickets.unshift(ticket);
  } else {
    // Souche de 10 tickets = 2 000 FCFA
    const packHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const packId = `SOUCHE-UPGC-${packHex}`;

    for (let i = 1; i <= 10; i++) {
      const randPart = crypto.randomBytes(2).toString('hex').toUpperCase();
      const ticketId = `TK-SOUCHE-${packHex}-${i}`;
      const token = `CROUK:TK:${ticketId}:${crypto.randomBytes(6).toString('hex')}`;
      const securityCode = generateRandomCode(6);

      const ticket: VirtualTicket = {
        id: ticketId,
        token,
        type: 'carnet_unit',
        packId,
        unitIndex: i,
        label: `Carnet 10 Repas • Ticket n°${i}/10`,
        price: 200,
        currency: 'FCFA',
        status: 'valid',
        createdAt: now,
        securityCode,
        studentVisitorId: visitorId,
      };
      created.push(ticket);
      store.tickets.unshift(ticket);
    }
  }

  writeTicketsStore(store);
  return created;
}

/**
 * Validate a ticket scanned or manually entered at the Resto U counter
 */
export function validateTicketAtCounter(
  tokenOrCode: string,
  validatedBy = 'Guichet Resto U UPGC'
): TicketValidationResult {
  if (!tokenOrCode || typeof tokenOrCode !== 'string') {
    return {
      success: false,
      code: 'NOT_FOUND',
      message: 'Code de ticket vide ou non reconnu',
    };
  }

  const clean = tokenOrCode.trim();
  const store = readTicketsStore();
  const now = new Date().toISOString();

  // Search by token, ID, or 6-digit security code
  const ticket = store.tickets.find(t => {
    if (t.token === clean) return true;
    if (t.id.toLowerCase() === clean.toLowerCase()) return true;
    // Allow clean security code match (ignoring spaces)
    if (t.securityCode.replace(/\s+/g, '') === clean.replace(/\s+/g, '')) return true;
    return false;
  });

  if (!ticket) {
    store.fraudAttemptsCount += 1;
    store.recentScans.unshift({
      ticketId: 'INCONNU',
      token: clean.slice(0, 32),
      status: 'expired',
      validatedAt: now,
      isDoubleAttempt: true,
    });
    store.recentScans = store.recentScans.slice(0, 50);
    writeTicketsStore(store);

    return {
      success: false,
      code: 'NOT_FOUND',
      message: 'Ticket inexistant dans le registre officiel CROU-K (Tentative non reconnue).',
    };
  }

  // Check if ticket is already used (Double passage / Fraud attempt)
  if (ticket.status === 'used') {
    store.fraudAttemptsCount += 1;
    store.recentScans.unshift({
      ticketId: ticket.id,
      token: ticket.token,
      status: 'used',
      validatedAt: now,
      isDoubleAttempt: true,
    });
    store.recentScans = store.recentScans.slice(0, 50);
    writeTicketsStore(store);

    return {
      success: false,
      code: 'ALREADY_USED',
      message: `ALERTE : Ce ticket a DÉJÀ été scanné et validé ! Double passage refusé.`,
      ticket,
      alreadyUsedAt: ticket.usedAt,
    };
  }

  // Validate the ticket
  ticket.status = 'used';
  ticket.usedAt = now;
  ticket.validatedBy = validatedBy;

  store.recentScans.unshift({
    ticketId: ticket.id,
    token: ticket.token,
    status: 'used',
    validatedAt: now,
    isDoubleAttempt: false,
  });
  store.recentScans = store.recentScans.slice(0, 50);

  writeTicketsStore(store);

  return {
    success: true,
    code: 'VALID',
    message: `Ticket VALIDE ! 1 repas (200 FCFA) accordé.`,
    ticket,
  };
}

/**
 * Get ticket statistics for admin dashboard
 */
export function getTicketStats(): TicketStats {
  const store = readTicketsStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalCreated = store.tickets.length;
  const totalValid = store.tickets.filter(t => t.status === 'valid').length;
  const totalUsed = store.tickets.filter(t => t.status === 'used').length;
  const revenueEstFCFA = (totalValid + totalUsed) * 200;

  const todayUsedCount = store.tickets.filter(t => 
    t.status === 'used' && t.usedAt && t.usedAt.startsWith(todayStr)
  ).length;

  return {
    totalCreated,
    totalValid,
    totalUsed,
    revenueEstFCFA,
    todayUsedCount,
    todayFraudAttemptsBlocked: store.fraudAttemptsCount,
    recentScans: store.recentScans.slice(0, 20),
  };
}

/**
 * Reset all tickets (Admin only)
 */
export function resetAllTickets(): void {
  const initial: TicketsDataStore = {
    tickets: [],
    fraudAttemptsCount: 0,
    recentScans: [],
  };
  writeTicketsStore(initial);
}
