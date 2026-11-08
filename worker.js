/**
 * Cloudflare Worker for CROU Resto U (UPGC Korhogo)
 * Handles:
 * - Rate Limiting (coarseLimit & rateLimit with Durable Objects)
 * - Support & Assistance Endpoints (/api/support/chat & /api/gemini/chat)
 * - Optical Ticket Verification (/api/gemini/scan-ticket)
 * - Jeko Partner API Payment Requests (/api/jeko/payment_requests)
 * - Jeko Partner API Status Verification (/api/jeko/payment_requests/:id)
 * - Jeko Webhooks (/api/webhook/jeko)
 * - SPA Static Assets
 */

import { RateLimiter, coarseLimit, rateLimit } from './worker/rateLimit.ts';

export { RateLimiter };

const DEFAULT_JEKO_API_KEY = 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec';
const DEFAULT_JEKO_KEY_ID = '32d9d6ef-d182-47bc-82ba-9c92c41510f3';
const DEFAULT_JEKO_STORE_ID = '32d9d6ef-d182-47bc-82ba-9c92c41510f3';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 0. Coarse Rate Limiting (IP-based, Cloudflare binding)
    const blocked = await coarseLimit(env, request);
    if (blocked) return blocked;

    // CORS pre-flight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY, X-API-KEY-ID'
        }
      });
    }

    // 1. Support & Student Assistance Chat Endpoint (Direct human counseling)
    if ((url.pathname === '/api/support/chat' || url.pathname === '/api/gemini/chat') && request.method === 'POST') {
      const tooMany = await rateLimit(env, request, 'login');
      if (tooMany) return tooMany;

      try {
        const body = await request.json();
        const apiKey = (env && env.GEMINI_API_KEY) || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : '');

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

        const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
        let replyText = '';

        for (const m of models) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey,
                'User-Agent': 'aistudio-build'
              },
              body: JSON.stringify({
                contents,
                systemInstruction: {
                  parts: [{
                    text: `Tu es M. Kouassi, conseiller officiel et humain du Service Restauration du CROU de Korhogo (UPGC). Tu réponds aux étudiants comme un conseiller chaleureux, bienveillant, poli, compréhensif et professionnel d'Afrique de l'Ouest (Côte d'Ivoire). Ne dis JAMAIS que tu es une intelligence artificielle, un modèle de langue ou un robot. Le ticket repas est subventionné à 200 FCFA (+10 FCFA Wave = 210 FCFA). Horaires du réfectoire : déjeuner 11h30-14h30, dîner 18h30-21h00. Aide les étudiants avec clarté et gentillesse.`
                  }]
                }
              })
            });

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (replyText) break;
            }
          } catch (mErr) {
            console.warn(`Worker model ${m} attempt note:`, mErr);
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

    // 2. Optical Ticket Scanner Endpoint
    if (url.pathname === '/api/gemini/scan-ticket' && request.method === 'POST') {
      const tooMany = await rateLimit(env, request, 'validate');
      if (tooMany) return tooMany;

      try {
        const body = await request.json();
        const apiKey = (env && env.GEMINI_API_KEY) || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : '');
        const cleanBase64 = (body.base64Image || '').replace(/^data:image\/[a-z]+;base64,/, '');

        const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
        let parsed = { detected: false, isAuthenticFormat: false, confidence: 0 };

        for (const m of models) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
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
                        text: `Tu es le scanner optique automatisé de Programas CROU Korhogo. Extrais le numéro de ticket (CROUK-2026-XXXXXX ou No 0162787). Réponds strictement par un JSON valide : {"detected": true, "ticketNumber": "CROUK-2026-XXXXXX", "isAuthenticFormat": true, "rawText": "ticket crou", "dishName": null, "matricule": null, "confidence": 0.95}`
                      }
                    ]
                  }
                ]
              })
            });

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
              const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleanJson);
              if (parsed.detected) break;
            }
          } catch (mErr) {
            console.warn(`Worker scan model ${m} attempt note:`, mErr);
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

    // 3. Jeko Partner API Payment Request Proxy
    if (url.pathname === '/api/jeko/payment_requests') {
      if (request.method === 'POST') {
        const tooMany = await rateLimit(env, request, 'purchase');
        if (tooMany) return tooMany;

        try {
          const clientBody = await request.json();
          const apiKey = (env && env.JEKO_API_KEY) || DEFAULT_JEKO_API_KEY;
          const apiKeyId = (env && env.JEKO_API_KEY_ID) || DEFAULT_JEKO_KEY_ID;
          const storeId = clientBody.storeId || (env && env.JEKO_STORE_ID) || DEFAULT_JEKO_STORE_ID;

          const partnerPayload = {
            storeId,
            amountCents: clientBody.amountCents || (clientBody.amount ? clientBody.amount * 100 : 20000),
            currency: clientBody.currency || 'XOF',
            reference: clientBody.reference || `CROUK-${Date.now()}`,
            paymentDetails: clientBody.paymentDetails || {
              type: 'redirect',
              data: {
                paymentMethod: clientBody.paymentMethod || 'wave',
                forceProviderDirect: clientBody.forceProviderDirect ?? true,
                ...(clientBody.payerPhone ? { payerPhone: clientBody.payerPhone } : {}),
                successUrl: clientBody.successUrl || `${url.origin}/payment/success`,
                errorUrl: clientBody.errorUrl || `${url.origin}/payment/error`
              }
            }
          };

          const jekoRes = await fetch('https://api.jeko.africa/partner_api/payment_requests', {
            method: 'POST',
            headers: {
              'X-API-KEY': apiKey,
              'X-API-KEY-ID': apiKeyId,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(partnerPayload)
          });

          const jekoData = await jekoRes.json();
          return new Response(JSON.stringify(jekoData), {
            status: jekoRes.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({
            status: 'error',
            message: err.message || 'Error communicating with Jeko Partner API'
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    }

    // 4. Jeko Partner API Status Verification Proxy
    if (url.pathname.startsWith('/api/jeko/payment_requests/') && request.method === 'GET') {
      const paymentRequestId = url.pathname.replace('/api/jeko/payment_requests/', '').trim();
      const apiKey = (env && env.JEKO_API_KEY) || DEFAULT_JEKO_API_KEY;
      const apiKeyId = (env && env.JEKO_API_KEY_ID) || DEFAULT_JEKO_KEY_ID;

      try {
        const jekoRes = await fetch(`https://api.jeko.africa/partner_api/payment_requests/${encodeURIComponent(paymentRequestId)}`, {
          method: 'GET',
          headers: {
            'X-API-KEY': apiKey,
            'X-API-KEY-ID': apiKeyId
          }
        });

        const jekoData = await jekoRes.json();
        return new Response(JSON.stringify(jekoData), {
          status: jekoRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          status: 'error',
          message: err.message || 'Error checking status on Jeko Partner API'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 5. Jeko Webhook listener
    if (url.pathname === '/api/webhook/jeko') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          console.log('[Jeko Webhook Event Received]:', JSON.stringify(body));
          return new Response(JSON.stringify({ 
            status: 'success', 
            message: 'Webhook received successfully',
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json', 
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({ 
            status: 'error', 
            message: 'Invalid JSON payload' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({
        status: 'active',
        service: 'CROU Korhogo Jeko Webhook Gateway',
        endpoint: '/api/webhook/jeko'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Dishes Cloud Sync Proxy (/api/dishes)
    if (url.pathname === '/api/dishes' || url.pathname.startsWith('/api/dishes/')) {
      const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/gen-lang-client-0578572037/databases/ai-studio-croumenurestou-b39ac6a3-5006-4e33-b867-e7ef5f24a19c/documents';
      const FIRESTORE_API_KEY = 'AIzaSyAwxZhgcBaVbCaKTcqHo2V4ihZpnaQ6SDQ';

      if (request.method === 'GET') {
        try {
          const fsRes = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: 'crou_dishes' }]
              }
            })
          });

          if (fsRes.ok) {
            const rows = await fsRes.json();
            const dishes = [];
            if (Array.isArray(rows)) {
              for (const r of rows) {
                if (r.document && r.document.fields) {
                  const f = r.document.fields;
                  const docName = r.document.name || '';
                  const docId = docName.split('/').pop();
                  const rawMeal = (f.mealType?.stringValue || '').toLowerCase();
                  const rawCat = (f.category?.stringValue || '').toLowerCase();

                  dishes.push({
                    id: f.id?.stringValue || docId,
                    name: f.name?.stringValue || 'Plat CROU',
                    description: f.description?.stringValue || '',
                    category: (rawCat === 'entree' || rawCat === 'dessert' || rawCat === 'boisson') ? rawCat : 'plat_principal',
                    price: f.price?.integerValue ? parseInt(f.price.integerValue, 10) : (f.price?.doubleValue || 200),
                    regularPrice: f.regularPrice?.integerValue ? parseInt(f.regularPrice.integerValue, 10) : 500,
                    mealType: (rawMeal === 'diner' || rawMeal === 'soir') ? 'diner' : 'dejeuner',
                    imageUrl: f.imageUrl?.stringValue || '',
                    isAvailable: f.isAvailable?.booleanValue !== false,
                    canteenId: f.canteenId?.stringValue || 'all',
                    tags: f.tags?.arrayValue?.values?.map(v => v.stringValue).filter(Boolean) || ['Distribution Officielle', 'Resto U'],
                    rating: f.rating?.doubleValue || 5.0,
                    ratingCount: f.ratingCount?.integerValue ? parseInt(f.ratingCount.integerValue, 10) : 1
                  });
                }
              }
            }
            return new Response(JSON.stringify({ dishes }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store'
              }
            });
          }
        } catch (e) {
          console.error('Worker fetch dishes err:', e);
        }
        return new Response(JSON.stringify({ dishes: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      if (request.method === 'POST') {
        try {
          const dish = await request.json();
          if (!dish || !dish.id) {
            return new Response(JSON.stringify({ error: 'Missing dish id' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
          }

          const rawMeal = ((dish.mealType || '')).toString().toLowerCase();
          const cleanMeal = (rawMeal === 'diner' || rawMeal === 'soir') ? 'diner' : 'dejeuner';
          const rawCat = ((dish.category || '')).toString();
          const cleanCat = (rawCat === 'entree' || rawCat === 'dessert' || rawCat === 'boisson') ? rawCat : 'plat_principal';

          const docId = dish.id.trim();
          const patchUrl = `${FIRESTORE_BASE}/crou_dishes/${encodeURIComponent(docId)}?key=${FIRESTORE_API_KEY}`;
          const fsRes = await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                id: { stringValue: docId },
                name: { stringValue: dish.name || 'Plat CROU' },
                description: { stringValue: dish.description || '' },
                category: { stringValue: cleanCat },
                price: { integerValue: String(dish.price || 200) },
                regularPrice: { integerValue: String(dish.regularPrice || 500) },
                mealType: { stringValue: cleanMeal },
                imageUrl: { stringValue: dish.imageUrl || '' },
                isAvailable: { booleanValue: dish.isAvailable !== false },
                canteenId: { stringValue: dish.canteenId || 'all' },
                tags: { arrayValue: { values: (dish.tags || ['Distribution Officielle', 'Resto U']).map(t => ({ stringValue: t })) } },
                rating: { doubleValue: dish.rating || 5.0 },
                ratingCount: { integerValue: String(dish.ratingCount || 1) },
                updatedAt: { stringValue: new Date().toISOString() }
              }
            })
          });

          return new Response(JSON.stringify({ success: fsRes.ok }), {
            status: fsRes.ok ? 200 : fsRes.status,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }

      if (request.method === 'DELETE') {
        const dishId = url.pathname.replace('/api/dishes/', '').trim();
        if (dishId) {
          try {
            await fetch(`${FIRESTORE_BASE}/crou_dishes/${encodeURIComponent(dishId)}?key=${FIRESTORE_API_KEY}`, {
              method: 'DELETE'
            });
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          } catch (e) {}
        }
      }
    }

    // 7. Default: Serve frontend static assets from ./dist
    return env.ASSETS.fetch(request);
  }
};
