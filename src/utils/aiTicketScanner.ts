import { GoogleGenAI } from '@google/genai';

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
 * Analyzes captured frames or photos of CROU tickets using gemini-2.5-flash
 */
export async function scanTicketWithGeminiAI(base64Image: string): Promise<AITicketScanResult> {
  try {
    const ai = new GoogleGenAI();
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: `Tu es le système IA officiel de vision et de reconnaissance optique du CROU Korhogo (UPGC).
Analyse cette image de ticket de repas ou de QR code.
Tâche :
1. Détecte le numéro de ticket (format CROUK-2026-XXXXXX, ou No 0162787, ou l'URL du QR code contenant tkt=...).
2. Vérifie la conformité avec le ticket officiel du CROU Korhogo (Mont Korhogo, 200 Frs, Restau. U 2026, 2 volets).
3. Détecte le matricule étudiant s'il est affiché sur l'écran ou le papier.

Réponds STRICTEMENT par un JSON valide (sans backticks markdown) :
{
  "detected": true,
  "ticketNumber": "CROUK-2026-XXXXXX",
  "isAuthenticFormat": true,
  "rawText": "description concise",
  "dishName": "Plat si visible ou null",
  "matricule": "Matricule si visible ou null",
  "confidence": 0.95
}`
            }
          ]
        }
      ]
    });

    const text = response.text?.trim() || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      detected: !!parsed.detected,
      ticketNumber: parsed.ticketNumber || undefined,
      isAuthenticFormat: !!parsed.isAuthenticFormat,
      rawText: parsed.rawText,
      dishName: parsed.dishName || undefined,
      matricule: parsed.matricule || undefined,
      confidence: parsed.confidence || 0.9
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
