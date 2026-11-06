export interface AITicketScanResult {
  detected: boolean;
  ticketNumber?: string;
  isAuthenticFormat: boolean;
  rawText?: string;
  dishName?: string;
  matricule?: string;
  confidence: number;
}

const GEMINI_API_KEY = (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || 
  (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : '');

/**
 * Google Gemini AI Powered Ticket Inspector
 * Analyzes captured frames or photos of CROU tickets using server-side Gemini Flash
 * with direct client API fallback
 */
export async function scanTicketWithGeminiAI(base64Image: string): Promise<AITicketScanResult> {
  const cleanBase64 = (base64Image || '').replace(/^data:image\/[a-z]+;base64,/, '');
  if (!cleanBase64) {
    return { detected: false, isAuthenticFormat: false, confidence: 0 };
  }

  // 1. Try server proxy
  try {
    const res = await fetch('/api/gemini/scan-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ base64Image: cleanBase64 })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.detected || data.ticketNumber)) {
        return {
          detected: Boolean(data.detected),
          ticketNumber: data.ticketNumber || undefined,
          isAuthenticFormat: Boolean(data.isAuthenticFormat),
          rawText: data.rawText,
          dishName: data.dishName || undefined,
          matricule: data.matricule || undefined,
          confidence: typeof data.confidence === 'number' ? data.confidence : 0.9
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Server ticket scan proxy note, trying direct API:', proxyErr);
  }

  // 2. Direct Gemini Vision fallback
  const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
  for (const model of models) {
    try {
      const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(directUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                {
                  text: `Tu es le lecteur optique officiel de tickets du CROU Korhogo. Détecte le numéro de ticket (CROUK-2026-XXXXXX ou No 0162787). Réponds en JSON strict : {"detected": true, "ticketNumber": "CROUK-2026-XXXXXX", "isAuthenticFormat": true, "rawText": "ticket", "dishName": null, "matricule": null, "confidence": 0.95}`
                }
              ]
            }
          ]
        })
      });

      if (res.ok) {
        const geminiData = await res.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.detected || parsed.ticketNumber) {
          return {
            detected: Boolean(parsed.detected),
            ticketNumber: parsed.ticketNumber || undefined,
            isAuthenticFormat: Boolean(parsed.isAuthenticFormat),
            rawText: parsed.rawText,
            dishName: parsed.dishName || undefined,
            matricule: parsed.matricule || undefined,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9
          };
        }
      }
    } catch (e) {
      console.warn(`Vision model ${model} direct call failed:`, e);
    }
  }

  return {
    detected: false,
    isAuthenticFormat: false,
    confidence: 0
  };
}
