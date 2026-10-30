import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { UserProfile } from '../types';
import { DailyLedgerStats } from './dailyLedger';

// In-memory access token cache (CRITICAL: Never store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let isSigningIn = false;

// Initialize auth state listener
export function initDriveAuth(
  onAuthChange?: (user: User | null, token: string | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    cachedUser = user;
    if (!user) {
      cachedAccessToken = null;
      if (onAuthChange) onAuthChange(null, null);
    } else {
      if (onAuthChange) onAuthChange(user, cachedAccessToken);
    }
  });
}

/**
 * Sign in with Google to get Google Drive authorization
 */
export async function signInWithGoogleForDrive(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Impossible de récupérer le jeton d\'accès Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export function getCachedDriveUser(): User | null {
  return cachedUser || auth.currentUser;
}

export function getCachedDriveToken(): string | null {
  return cachedAccessToken;
}

export async function signOutDrive(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
}

/**
 * Upload a file directly to Google Drive using the Drive v3 multipart upload endpoint
 */
export async function uploadFileToDrive(params: {
  fileName: string;
  mimeType: string;
  content: string;
  description?: string;
}): Promise<DriveUploadResult> {
  let token = cachedAccessToken;
  
  if (!token) {
    const authRes = await signInWithGoogleForDrive();
    token = authRes.accessToken;
  }

  const metadata = {
    name: params.fileName,
    mimeType: params.mimeType,
    description: params.description || 'Exporté depuis CROU Restaurant Universitaire UPGC'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${params.mimeType}; charset=UTF-8\r\n\r\n` +
    params.content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Erreur Google Drive HTTP ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    size: data.size,
    createdTime: data.createdTime
  };
}

/**
 * Export the registered students list to Google Drive as CSV
 */
export async function exportStudentRegistryToDrive(
  students: UserProfile[]
): Promise<DriveUploadResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `CROU_UPGC_Registre_Etudiants_${timestamp}.csv`;

  const headers = ['Matricule', 'Nom Complet', 'Email', 'UFR / Campus', 'Solde (FCFA)', 'Nb Tickets', 'Date Inscription'];
  const rows = students.map(s => [
    `"${s.matricule || s.uid}"`,
    `"${(s.displayName || '').replace(/"/g, '""')}"`,
    `"${s.email || ''}"`,
    `"${(s.campus || 'UPGC Korhogo').replace(/"/g, '""')}"`,
    s.balance || 0,
    (s.savedTickets || []).length,
    `"${s.createdAt || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

  return uploadFileToDrive({
    fileName,
    mimeType: 'text/csv',
    content: csvContent,
    description: `Registre des étudiants inscrits au restaurant CROU UPGC (Total: ${students.length} étudiants)`
  });
}

/**
 * Export the daily ledger and accounting records to Google Drive as CSV
 */
export async function exportLedgerToDrive(
  ledger: DailyLedgerStats
): Promise<DriveUploadResult> {
  const cleanDate = ledger.date.replace(/[\/\s]/g, '-');
  const fileName = `CROU_UPGC_Bilan_Comptable_${cleanDate}.csv`;

  const lines: string[] = [
    `\uFEFFBILAN JOURNALIER RESTAURANT CROU - UPGC KORHOGO`,
    `Date du Bilan;${ledger.formattedDate} (${ledger.date})`,
    `Recettes Totales Encaissées;${ledger.revenueCollected} FCFA`,
    `Plats / Repas Validés au Tourniquet;${ledger.mealsValidated}`,
    `Tickets en Circulation;${ledger.ticketsInCirculation}`,
    `Total Tickets Émis;${ledger.totalTicketsSold}`,
    ``,
    `DÉTAIL DES TICKETS VALIDÉS ET CONSOMMÉS AU TOURNIQUET:`,
    ['N° Ticket', 'Matricule Étudiant', 'Nom Étudiant', 'Plat Consommé', 'Heure Passage', 'Prix (FCFA)'].join(';')
  ];

  if (ledger.servedTickets && ledger.servedTickets.length > 0) {
    ledger.servedTickets.forEach(t => {
      lines.push([
        `"${t.ticketNumber}"`,
        `"${t.studentMatricule || ''}"`,
        `"${(t.studentName || '').replace(/"/g, '""')}"`,
        `"${(t.dishName || '').replace(/"/g, '""')}"`,
        `"${t.validationTime || ''}"`,
        t.price || 200
      ].join(';'));
    });
  } else {
    lines.push('Aucun ticket validé pour cette session.');
  }

  const csvContent = lines.join('\r\n');

  return uploadFileToDrive({
    fileName,
    mimeType: 'text/csv',
    content: csvContent,
    description: `Bilan comptable journalier CROU UPGC du ${ledger.formattedDate} - Recettes: ${ledger.revenueCollected} FCFA`
  });
}

/**
 * List files previously created by CROU app in Google Drive
 */
export async function listAppFilesFromDrive(): Promise<Array<{ id: string; name: string; webViewLink?: string; createdTime?: string }>> {
  const token = cachedAccessToken;
  if (!token) return [];

  try {
    const q = encodeURIComponent("name contains 'CROU_UPGC' and trashed = false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink,createdTime)&orderBy=createdTime desc&pageSize=10`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn('Error listing Drive files:', err);
    return [];
  }
}
