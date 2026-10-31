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
let cachedUser: any | null = null;
let isSigningIn = false;

const OAUTH_CLIENT_ID = '648760950612-e5qsgef4mbl9pan8ae3b6a4gk7s64rot.apps.googleusercontent.com';
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';

// Initialize auth state listener
export function initDriveAuth(
  onAuthChange?: (user: any | null, token: string | null) => void
): () => void {
  // Listen to Firebase Auth or cached GIS token
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      cachedUser = user;
      if (onAuthChange) onAuthChange(user, cachedAccessToken);
    } else if (!cachedAccessToken) {
      cachedUser = null;
      if (onAuthChange) onAuthChange(null, null);
    }
  });

  return unsubscribe;
}

/**
 * Sign in with Google Identity Services (GIS) to obtain Google Drive OAuth access token
 * Prevents Firebase Auth "The requested action is invalid" popup error
 */
export async function signInWithGoogleForDrive(): Promise<{ user: any; accessToken: string }> {
  if (cachedAccessToken && cachedUser) {
    return { user: cachedUser, accessToken: cachedAccessToken };
  }

  isSigningIn = true;

  return new Promise((resolve, reject) => {
    // 1. Check if Google Identity Services (GIS) is available on window
    const google = (window as any).google;
    if (google && google.accounts && google.accounts.oauth2) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: OAUTH_CLIENT_ID,
          scope: DRIVE_SCOPES,
          callback: async (tokenResponse: any) => {
            isSigningIn = false;
            if (tokenResponse.error) {
              console.error('GIS token error:', tokenResponse);
              reject(new Error(`Autorisation Google Drive refusée : ${tokenResponse.error_description || tokenResponse.error}`));
              return;
            }

            if (tokenResponse.access_token) {
              cachedAccessToken = tokenResponse.access_token;
              
              // Fetch user profile info with the token
              let userProfile: any = {
                displayName: 'Administrateur CROU',
                email: 'metroone110@gmail.com'
              };

              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (userRes.ok) {
                  const userInfo = await userRes.json();
                  userProfile = {
                    displayName: userInfo.name || 'Administrateur CROU',
                    email: userInfo.email || 'metroone110@gmail.com',
                    photoURL: userInfo.picture
                  };
                }
              } catch {}

              cachedUser = userProfile;
              resolve({ user: userProfile, accessToken: tokenResponse.access_token });
            } else {
              reject(new Error('Aucun jeton d\'accès reçu de Google Drive.'));
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (gisErr) {
        console.warn('GIS init error, falling back:', gisErr);
      }
    }

    // 2. Fallback: Firebase popup with friendly error message
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        isSigningIn = false;
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          throw new Error('Jeton d\'accès introuvable.');
        }
        cachedAccessToken = credential.accessToken;
        cachedUser = result.user;
        resolve({ user: result.user, accessToken: cachedAccessToken });
      })
      .catch((err) => {
        isSigningIn = false;
        console.warn('Firebase popup note:', err);
        // Prompt admin with immediate direct download fallback
        reject(new Error(
          'La fenêtre de connexion Google a été bloquée ou a échoué. Utilisez le bouton "Télécharger en CSV" pour sauvegarder directement sur votre appareil.'
        ));
      });
  });
}

export function getCachedDriveUser(): any | null {
  return cachedUser || auth.currentUser;
}

export function getCachedDriveToken(): string | null {
  return cachedAccessToken;
}

export async function signOutDrive(): Promise<void> {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
  cachedUser = null;
}

/**
 * Utility to trigger immediate direct file download in the browser (100% resilient)
 */
export function downloadFileLocally(fileName: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

export function generateStudentRegistryCsvData(students: UserProfile[]): { fileName: string; content: string } {
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
  const content = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  return { fileName, content };
}

export function generateLedgerCsvData(ledger: DailyLedgerStats): { fileName: string; content: string } {
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

  const content = lines.join('\r\n');
  return { fileName, content };
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
