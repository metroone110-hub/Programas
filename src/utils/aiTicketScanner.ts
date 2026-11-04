export interface AITicketScanResult {
  detected: boolean;
  ticketNumber?: string;
  isAuthenticFormat: boolean;
  rawText?: string;
  dishName?: string;
  matricule?: string;
  confidence: number;
}

/**
 * Google Gemini AI Powered Ticket Inspector
 * Analyzes captured frames or photos of CROU tickets using server-side Gemini Flash
 */
export async function scanTicketWithGeminiAI(base64Image: string): Promise<AITicketScanResult> {
  try {
    const res = await fetch('/api/gemini/scan-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ base64Image })
    });

    if (!res.ok) {
      throw new Error(`Erreur serveur HTTP: ${res.status}`);
    }

    const data = await res.json();
    return {
      detected: Boolean(data.detected),
      ticketNumber: data.ticketNumber || undefined,
      isAuthenticFormat: Boolean(data.isAuthenticFormat),
      rawText: data.rawText,
      dishName: data.dishName || undefined,
      matricule: data.matricule || undefined,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.9
    };
  } catch (err) {
    console.warn('Gemini vision analysis note:', err);
    return {
      detected: false,
      isAuthenticFormat: false,
      confidence: 0
    };
  }
}
