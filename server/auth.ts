import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_DIR, 'admin_account.json');

interface AdminAccountData {
  isConfigured: boolean;
  username: string;
  salt: string;
  hash: string;
  tokens: string[]; // Active valid session tokens
  updatedAt: string;
}

function ensureAuthFile(): AdminAccountData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(AUTH_FILE)) {
    const initial: AdminAccountData = {
      isConfigured: false,
      username: '',
      salt: '',
      hash: '',
      tokens: [],
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erreur lecture compte admin:', err);
    return {
      isConfigured: false,
      username: '',
      salt: '',
      hash: '',
      tokens: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveAccount(data: AdminAccountData): boolean {
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erreur sauvegarde compte admin:', err);
    return false;
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function getAdminStatus(): { isConfigured: boolean; username?: string } {
  const account = ensureAuthFile();
  return {
    isConfigured: account.isConfigured,
    username: account.isConfigured ? account.username : undefined,
  };
}

export function setupInitialAdmin(username: string, password: string): { success: boolean; token?: string; error?: string } {
  const account = ensureAuthFile();

  if (account.isConfigured) {
    return { success: false, error: 'Le compte administrateur a déjà été initialisé.' };
  }

  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'Le pseudo doit comporter au moins 3 caractères.' };
  }

  if (!cleanPass || cleanPass.length < 5) {
    return { success: false, error: 'Le mot de passe doit comporter au moins 5 caractères pour être sécurisé.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(cleanPass, salt);
  const token = 'crouk_' + crypto.randomBytes(32).toString('hex');

  account.isConfigured = true;
  account.username = cleanUser;
  account.salt = salt;
  account.hash = hash;
  account.tokens = [token];

  saveAccount(account);
  return { success: true, token };
}

export function loginAdmin(username: string, password: string): { success: boolean; token?: string; username?: string; error?: string } {
  const account = ensureAuthFile();

  if (!account.isConfigured) {
    return {
      success: false,
      error: 'Le compte administrateur n\'a pas encore été configuré. Veuillez créer vos identifiants personnalisés.',
    };
  }

  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (cleanUser.toLowerCase() !== account.username.toLowerCase()) {
    return { success: false, error: 'Identifiant (pseudo) incorrect.' };
  }

  const testHash = hashPassword(cleanPass, account.salt);
  if (testHash !== account.hash) {
    return { success: false, error: 'Mot de passe incorrect.' };
  }

  const token = 'crouk_' + crypto.randomBytes(32).toString('hex');
  // Keep last 10 active tokens
  account.tokens = [token, ...(account.tokens || []).slice(0, 9)];
  saveAccount(account);

  return { success: true, token, username: account.username };
}

export function verifySessionToken(token?: string): boolean {
  if (!token) return false;
  const cleanToken = token.replace('Bearer ', '').trim();
  if (!cleanToken) return false;

  const account = ensureAuthFile();
  if (!account.isConfigured) return false;

  return account.tokens.includes(cleanToken);
}

export function updateAdminCredentials(
  token: string,
  oldPassword: string,
  newUsername?: string,
  newPassword?: string
): { success: boolean; error?: string; username?: string } {
  if (!verifySessionToken(token)) {
    return { success: false, error: 'Session invalide ou expirée.' };
  }

  const account = ensureAuthFile();
  const testOldHash = hashPassword(oldPassword.trim(), account.salt);
  if (testOldHash !== account.hash) {
    return { success: false, error: 'L\'ancien mot de passe fourni est incorrect.' };
  }

  if (newUsername && newUsername.trim().length >= 3) {
    account.username = newUsername.trim();
  }

  if (newPassword && newPassword.trim().length >= 5) {
    const newSalt = crypto.randomBytes(16).toString('hex');
    account.salt = newSalt;
    account.hash = hashPassword(newPassword.trim(), newSalt);
  }

  saveAccount(account);
  return { success: true, username: account.username };
}
