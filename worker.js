/**
 * Cloudflare Worker for CROU Resto U (UPGC Korhogo)
 * Handles:
 * - Rate Limiting (coarseLimit & rateLimit with Durable Objects)
 * - Gemini AI Endpoints (/api/gemini/chat & /api/gemini/scan-ticket)
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

    // 1. Gemini AI Chat Endpoint
    if (url.pathname === '/api/gemini/chat' && request.method === 'POST') {
      const tooMany = await rateLimit(env, request, 'aiChat');
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
                    text: `Tu es l'Assistant IA Gemini officiel de Programas (CROU Korhogo UPGC). Repas officiel subventionné à 200 FCFA (+10 F frais de service). Horaires : 11h30-14h30 et 18h30-21h00. Aide les étudiants avec bienveillance, politesse et clarté.`
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

    // 2. Gemini AI Optical Ticket Scanner Endpoint
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
                        text: `Tu es le système IA de vision de Programas CROU Korhogo. Extrais le numéro de ticket (CROUK-2026-XXXXXX ou No 0162787). Réponds strictement par un JSON valide : {"detected": true, "ticketNumber": "CROUK-2026-XXXXXX", "isAuthenticFormat": true, "rawText": "ticket crou", "dishName": null, "matricule": null, "confidence": 0.95}`
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

    // 6. Default: Serve frontend static assets from ./dist
    return env.ASSETS.fetch(request);
  }
};
