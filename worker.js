/**
 * Cloudflare Worker for CROU Resto U (UPGC Korhogo)
 * Handles:
 * - Jeko Partner API Payment Requests (/api/jeko/payment_requests)
 * - Jeko Partner API Status Verification (/api/jeko/payment_requests/:id)
 * - Jeko Webhooks (/api/webhook/jeko)
 * - SPA Static Assets
 */

const DEFAULT_JEKO_API_KEY = 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec';
const DEFAULT_JEKO_KEY_ID = '32d9d6ef-d182-47bc-82ba-9c92c41510f3';
const DEFAULT_JEKO_STORE_ID = '32d9d6ef-d182-47bc-82ba-9c92c41510f3';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    // 1. Jeko Partner API Payment Request Proxy (Bypasses browser CORS)
    if (url.pathname === '/api/jeko/payment_requests') {
      if (request.method === 'POST') {
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

    // 2. Jeko Partner API Status Verification Proxy
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

    // 3. Jeko Webhook listener
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

      // GET health check on webhook
      return new Response(JSON.stringify({
        status: 'active',
        service: 'CROU Korhogo Jeko Webhook Gateway',
        endpoint: '/api/webhook/jeko'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Default: Serve frontend static assets from ./dist
    return env.ASSETS.fetch(request);
  }
};
