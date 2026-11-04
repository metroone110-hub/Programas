/**
 * Cloudflare Pages Function for /api/gemini/scan-ticket
 */
const DEFAULT_KEY = typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : '';
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = (env && env.GEMINI_API_KEY) || DEFAULT_KEY;

  try {
    const body = await request.json();
    const cleanBase64 = (body.base64Image || '').replace(/^data:image\/[a-z]+;base64,/, '');

    let parsed = { detected: false, isAuthenticFormat: false, confidence: 0 };
    for (const m of MODELS) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
            'User-Agent': 'aistudio-build'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                  {
                    text: `Tu es le système IA de vision de Programas CROU Korhogo. Extrais le numéro de ticket (CROUK-2026-XXXXXX ou No 0162787). Réponds strictement par un JSON valide : {"detected": true, "ticketNumber": "CROUK-2026-XXXXXX", "isAuthenticFormat": true, "rawText": "ticket crou", "dishName": null, "matricule": null, "confidence": 0.95}`
                  }
                ]
              }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanJson);
          if (parsed.detected) break;
        }
      } catch (e) {
        console.warn(`CF Pages scan error with ${m}:`, e);
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY'
    }
  });
}
