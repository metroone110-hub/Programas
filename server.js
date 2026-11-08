import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleGeminiChat, handleGeminiTicketScan } from './server/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer(async (req, res) => {
  const safeUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(DIST_DIR, safeUrl === '/' ? 'index.html' : safeUrl);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, X-API-KEY-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Jeko Partner API Payment Requests Proxy
  if (safeUrl === '/api/jeko/payment_requests' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const clientBody = JSON.parse(bodyData || '{}');
        const partnerPayload = {
          storeId: clientBody.storeId || process.env.JEKO_STORE_ID || '895f3110-845b-4d11-a291-f28dc954c0cd',
          amountCents: clientBody.amountCents || (clientBody.amount ? clientBody.amount * 100 : 20000),
          currency: clientBody.currency || 'XOF',
          reference: clientBody.reference || `CROUK-${Date.now()}`,
          paymentDetails: clientBody.paymentDetails || {
            type: 'redirect',
            data: {
              paymentMethod: clientBody.paymentMethod || 'wave',
              forceProviderDirect: clientBody.forceProviderDirect ?? true,
              ...(clientBody.payerPhone ? { payerPhone: clientBody.payerPhone } : {}),
              successUrl: clientBody.successUrl || `http://${req.headers.host}/payment/success`,
              errorUrl: clientBody.errorUrl || `http://${req.headers.host}/payment/error`
            }
          }
        };

        const jekoFetch = await fetch('https://api.jeko.africa/partner_api/payment_requests', {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.JEKO_API_KEY || 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec',
            'X-API-KEY-ID': process.env.JEKO_API_KEY_ID || '32d9d6ef-d182-47bc-82ba-9c92c41510f3',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(partnerPayload)
        });

        const jekoJson = await jekoFetch.json();
        res.writeHead(jekoFetch.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(jekoJson));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
    return;
  }

  // Jeko Partner API Status Check Proxy
  if (safeUrl.startsWith('/api/jeko/payment_requests/') && req.method === 'GET') {
    const paymentRequestId = safeUrl.replace('/api/jeko/payment_requests/', '').trim();
    try {
      const jekoFetch = await fetch(`https://api.jeko.africa/partner_api/payment_requests/${encodeURIComponent(paymentRequestId)}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': process.env.JEKO_API_KEY || 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec',
          'X-API-KEY-ID': process.env.JEKO_API_KEY_ID || '32d9d6ef-d182-47bc-82ba-9c92c41510f3'
        }
      });
      const jekoJson = await jekoFetch.json();
      res.writeHead(jekoFetch.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(jekoJson));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
    return;
  }

  // Jeko Webhook Endpoint
  if (safeUrl === '/api/webhook/jeko') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', received: true, timestamp: new Date().toISOString() }));
    return;
  }

  // Support & Student Assistance Chat Endpoint
  if ((safeUrl === '/api/gemini/chat' || safeUrl === '/api/support/chat') && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const { prompt, history, context } = JSON.parse(bodyData || '{}');
        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prompt requis' }));
          return;
        }
        const text = await handleGeminiChat(prompt, history, context);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text }));
      } catch (err) {
        console.error('Gemini chat error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Erreur Gemini' }));
      }
    });
    return;
  }

  // Gemini AI Optical Ticket Scanner Endpoint
  if (safeUrl === '/api/gemini/scan-ticket' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const { base64Image } = JSON.parse(bodyData || '{}');
        if (!base64Image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Image requise' }));
          return;
        }
        const result = await handleGeminiTicketScan(base64Image);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('Gemini ticket scan error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Erreur scan IA' }));
      }
    });
    return;
  }

  // Dishes Cloud Sync Endpoints (/api/dishes)
  if (safeUrl === '/api/dishes' || safeUrl.startsWith('/api/dishes/')) {
    const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/gen-lang-client-0578572037/databases/ai-studio-croumenurestou-b39ac6a3-5006-4e33-b867-e7ef5f24a19c/documents';
    const FIRESTORE_API_KEY = 'AIzaSyAwxZhgcBaVbCaKTcqHo2V4ihZpnaQ6SDQ';

    if (req.method === 'GET') {
      try {
        const fsRes = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'crou_dishes' }] } })
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
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store' });
          res.end(JSON.stringify({ dishes }));
          return;
        }
      } catch (err) {
        console.error('Server get dishes error:', err);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ dishes: [] }));
      return;
    }

    if (req.method === 'POST') {
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', async () => {
        try {
          const dish = JSON.parse(bodyData || '{}');
          if (!dish || !dish.id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing dish id' }));
            return;
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

          res.writeHead(fsRes.ok ? 200 : fsRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: fsRes.ok }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      const dishId = safeUrl.replace('/api/dishes/', '').trim();
      if (dishId) {
        try {
          await fetch(`${FIRESTORE_BASE}/crou_dishes/${encodeURIComponent(dishId)}?key=${FIRESTORE_API_KEY}`, {
            method: 'DELETE'
          });
        } catch (e) {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
  }

  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA Fallback: serve dist/index.html
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, content) => {
        if (indexErr) {
          res.writeHead(500);
          res.end('dist/index.html not found. Please run npm run build first.');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
    }
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${PORT}`);
});
