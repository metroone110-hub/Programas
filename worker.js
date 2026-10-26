/**
 * Cloudflare Worker for CROU Resto U
 * Handles SPA static assets and incoming Jeko Webhooks (/api/webhook/jeko)
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Jeko Webhook endpoint
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

    // Default: Serve frontend static assets from ./dist
    return env.ASSETS.fetch(request);
  }
};
