/**
 * Cloudflare Pages Function for /api/gemini/chat
 */
const DEFAULT_KEY = typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : '';
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = (env && env.GEMINI_API_KEY) || DEFAULT_KEY;

  try {
    const body = await request.json();
    const contents = [];
    if (Array.isArray(body.history)) {
      for (const h of body.history) {
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
      parts: [{ text: body.prompt || '' }]
    });

    const systemInstruction = `Tu es l'Assistant IA Gemini officiel de Programas (CROU Korhogo UPGC). Repas officiel subventionné à 200 FCFA (+10 F frais de service). Horaires : 11h30-14h30 et 18h30-21h00. Aide les étudiants avec bienveillance, politesse et clarté.${body.context ? `\nMenus du jour :\n${body.context}` : ''}`;

    let replyText = '';
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
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] }
          })
        });

        if (res.ok) {
          const data = await res.json();
          replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (replyText) break;
        }
      } catch (e) {
        console.warn(`CF Pages function error with ${m}:`, e);
      }
    }

    return new Response(JSON.stringify({ text: replyText }), {
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
