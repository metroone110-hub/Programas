import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : Buffer.from('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=', 'base64').toString('utf-8'));

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

/**
 * Handle student assistant conversation with Gemini Flash
 */
export async function handleGeminiChat(prompt, history = [], context = '') {
  const systemInstruction = `Tu es M. Kouassi, conseiller d'assistance officiel et humain de l'équipe du Service Restauration du CROU de Korhogo (UPGC Côte d'Ivoire).
Informations fondamentales de Programas :
- Tu t'adresses aux étudiants avec chaleur, respect, politesse et bienveillance humaine. Tu ne dois JAMAIS mentionner que tu es une intelligence artificielle ou un robot.
- Prix officiel du ticket subventionné par l'État : 200 FCFA par repas (+10 FCFA frais de service Wave/Jeko = 210 FCFA au paiement).
- Deux services de restauration par jour : Déjeuner (11h30 – 14h30) et Dîner (18h30 – 21h00).
- Campus desservis : Université Peleforo Gon Coulibaly (UPGC), Restaurant Principal CROU-K et Annexe Campus 2.
- Moyens de paiement : Wave Money (recommandé), Jeko, Orange Money, MTN MoMo, Moov Money.
- Fonctionnalités clés : Ticket QR code haute sécurité, code PIN à 4 chiffres (verrouillage comme Wave/Djamo), borne tourniquet intelligente.
${context ? `\nPlats et menus du jour en temps réel :\n${context}` : ''}

Consignes pour tes réponses :
- Sois bienveillant, clair, concis et encourageant pour les étudiants.
- Réponds toujours en français chaleureux avec respect et politesse.`;

  const contents = [];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h && h.role && h.text) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      }
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction
        }
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`Model ${model} failed in handleGeminiChat, trying next:`, err.message);
    }
  }

  throw new Error('Impossible de contacter le service IA Gemini.');
}

/**
 * Handle optical ticket verification using Gemini Vision
 */
export async function handleGeminiTicketScan(base64Image) {
  const cleanBase64 = (base64Image || '').replace(/^data:image\/[a-z]+;base64,/, '');
  if (!cleanBase64) {
    return { detected: false, isAuthenticFormat: false, confidence: 0 };
  }

  const promptText = `Tu es le système IA officiel de vision et de reconnaissance optique du CROU Korhogo (UPGC).
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
}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
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
                text: promptText
              }
            ]
          }
        ]
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleanJson);
      } catch {
        return {
          detected: false,
          isAuthenticFormat: false,
          confidence: 0
        };
      }
    } catch (err) {
      console.warn(`Model ${model} failed in handleGeminiTicketScan:`, err.message);
    }
  }

  return {
    detected: false,
    isAuthenticFormat: false,
    confidence: 0
  };
}
