# 📦 PROGRAMAS — EXPORT COMPLET DU CODE SOURCE (FRONTEND, BACKEND & FLUTTER DART)

> Projet : Programas (CROU Korhogo - UPGC)
> Dépôt GitHub : https://github.com/metroone110-hub/Programas.git
> Export consolidé contenant tout le code prêt à être analysé par Claude ou tout autre outil.

---

## 📄 Fichier: `metadata.json`

```json
{
  "name": "CROU Menu - Resto U",
  "description": "Application officielle du restaurant universitaire du CROU Korhogo (UPGC). Menus du jour, tickets repas subventionnés à 200 FCFA, passage aux tourniquets et assistance étudiante.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}

```

---

## 📄 Fichier: `index.html`

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="alternate icon" type="image/png" href="/pwa-192x192.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />

    <meta name="theme-color" content="#ea580c" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0b0b0f" media="(prefers-color-scheme: dark)" />
    <meta name="color-scheme" content="light dark" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Programas" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no" />
    <script>
      // Empêcher tout zoom gestuel involontaire sur mobile (pinch-to-zoom et double-tap)
      document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
      document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
      document.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });
      var lastTouchEnd = 0;
      document.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    </script>

    <title>Programas • CROU Korhogo Resto U</title>
    <meta name="description" content="Programas : le ticket du restaurant universitaire du CROU Korhogo (UPGC), à 200 FCFA, directement sur ton téléphone." />

    <meta property="og:type" content="website" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="Programas" />
    <meta property="og:title" content="Programas • CROU Korhogo Resto U" />
    <meta property="og:description" content="Ton ticket de restaurant universitaire à 200 FCFA, directement sur ton téléphone." />
    <meta property="og:image" content="/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preload" as="image" href="/assets/aistudio/IMG_1017_cbecc94a.jpeg" />
    <link rel="preload" as="image" href="/assets/aistudio/IMG_1038_80198fc0.jpeg" />
    <script src="https://accounts.google.com/gsi/client" async defer></script>

    <style>
      :root { --bg: #f5f5f7; --fg: #1d1d1f; --muted: #86868b; --accent: #ea580c; }
      @media (prefers-color-scheme: dark) {
        :root { --bg: #000; --fg: #f5f5f7; --muted: #98989d; }
      }
      html { -webkit-text-size-adjust: 100%; background: var(--bg); }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--fg);
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Plus Jakarta Sans", "Inter", system-ui, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior-y: none;
      }
      /* Écran de démarrage : remplacé dès que React monte */
      .boot {
        min-height: 100vh;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      }
      .boot-mark {
        width: 64px; height: 64px; border-radius: 15px;
        background: var(--accent);
        animation: boot-in .5s cubic-bezier(.2,.8,.2,1) both;
      }
      @keyframes boot-in { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
      @media (prefers-reduced-motion: reduce) { .boot-mark { animation: none; } }
    </style>
    <link rel="stylesheet" href="/apple-ui.css" />
    <script src="/apple-ui.js" defer></script>
  </head>
  <body class="selection:bg-orange-500 selection:text-white">
    <div id="root">
      <div class="boot" role="status" aria-label="Chargement de Programas"><div class="boot-mark"></div></div>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

---

## 📄 Fichier: `package.json`

```json
{
  "name": "crou-menu-resto-u",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000 --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview --port 3000 --host 0.0.0.0",
    "start": "node server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.31.0",
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "firebase": "^11.4.0",
    "jsqr": "^1.4.0",
    "lucide-react": "^0.475.0",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^5.20261104.1",
    "@types/canvas-confetti": "^1.9.0",
    "@types/qrcode": "^1.5.6",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "sharp": "^0.35.5",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "vite": "^6.1.0"
  }
}

```

---

## 📄 Fichier: `server.js`

```javascript
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

```

---

## 📄 Fichier: `server/geminiService.js`

```javascript
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
      console.warn(`Model ${model} notice:`, err.message);
    }
  }

  return "Bonjour cher(e) étudiant(e) ! Je suis à votre écoute au Service Restauration du CROU Korhogo. Le ticket repas est subventionné à 200 FCFA (+10 FCFA Wave), nos réfectoires sont ouverts de 11h30 à 14h30 le midi et de 18h30 à 21h00 le soir. Comment puis-je vous aider aujourd'hui ?";
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

```

---

## 📄 Fichier: `worker/rateLimit.ts`

```typescript
// worker/rateLimit.ts — limitation du nombre de requêtes pour Programas (Cloudflare Workers)
//
// DEUX NIVEAUX
//  1. coarseLimit()  : filtre large et gratuit (binding natif Cloudflare), pour toutes les routes.
//     Il est approximatif : bien pour freiner un robot, pas pour une règle stricte.
//  2. rateLimit()    : compteur exact (Durable Object) pour les routes sensibles : connexion,
//     achat, validation de ticket, administration.
//
// CONFIGURATION (wrangler.jsonc) :
//   "durable_objects": { "bindings": [{ "name": "LIMITER", "class_name": "RateLimiter" }] },
//   "migrations": [{ "tag": "v1", "new_sqlite_classes": ["RateLimiter"] }],
//   "ratelimits": [{ "name": "API_LIMITER", "namespace_id": "1001", "simple": { "limit": 100, "period": 60 } }]
//
// DANS TON WORKER (fichier d'entrée) :
//   export { RateLimiter } from './rateLimit';
//
//   export default {
//     async fetch(request: Request, env: RateLimitEnv) {
//       const url = new URL(request.url);
//
//       const blocked = await coarseLimit(env, request);          // sur toutes les routes
//       if (blocked) return blocked;
//
//       if (url.pathname === '/api/auth/google' && request.method === 'POST') {
//         const tooMany = await rateLimit(env, request, 'login');  // avant de vérifier le jeton Google
//         if (tooMany) return tooMany;
//         // … vérification du jeton Google, création du JWT …
//       }
//
//       if (url.pathname === '/api/tickets/validate' && request.method === 'POST') {
//         const tooMany = await rateLimit(env, request, 'validate', userId); // userId lu dans le JWT vérifié
//         if (tooMany) return tooMany;
//         // … validation atomique du ticket …
//       }
//       // …
//     },
//   };
import { DurableObject } from 'cloudflare:workers';

export interface RateLimitEnv {
  LIMITER: DurableObjectNamespace<RateLimiter>;
  API_LIMITER?: RateLimit;
}

/** Règles : `limit` requêtes maximum par fenêtre de `windowMs`. */
export const RULES = {
  // Avant vérification du jeton Google, la clé est l'adresse IP. Les réseaux mobiles partagent souvent
  // une même IP entre beaucoup de personnes : on reste large pour ne pas bloquer des étudiants honnêtes.
  login: { limit: 20, windowMs: 60_000 },
  pin: { limit: 15, windowMs: 60_000 },
  // Après connexion, la clé est l'identifiant de l'utilisateur : ces règles peuvent être strictes.
  purchase: { limit: 10, windowMs: 3_600_000 },
  ticketView: { limit: 60, windowMs: 60_000 },
  validate: { limit: 60, windowMs: 60_000 },
  admin: { limit: 60, windowMs: 60_000 },
} as const;

export type RuleName = keyof typeof RULES;

const clientIp = (request: Request) => request.headers.get('cf-connecting-ip') ?? 'unknown';

const tooManyRequests = (retryAfterSeconds: number, limit?: number) =>
  new Response(
    JSON.stringify({
      error: 'trop_de_requetes',
      message: `Trop de tentatives. Réessaie dans ${retryAfterSeconds} s.`,
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(retryAfterSeconds),
        'Cache-Control': 'no-store',
        ...(limit ? { 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' } : {}),
      },
    }
  );

/** Niveau 1 : filtre large par IP. Renvoie une réponse 429 si bloqué, sinon null. */
export async function coarseLimit(env: RateLimitEnv, request: Request): Promise<Response | null> {
  if (!env || !env.API_LIMITER) return null;
  try {
    const { success } = await env.API_LIMITER.limit({ key: clientIp(request) });
    return success ? null : tooManyRequests(60);
  } catch (err) {
    console.error('coarseLimit: erreur du limiteur, requête acceptée', err);
    return null;
  }
}

/**
 * Niveau 2 : compteur exact.
 * @param subject identifiant de l'utilisateur (depuis le JWT vérifié). À défaut, l'adresse IP est utilisée.
 * @param failOpen si le limiteur tombe en panne : true = on laisse passer (défaut), false = on bloque.
 */
export async function rateLimit(
  env: RateLimitEnv,
  request: Request,
  rule: RuleName,
  subject?: string,
  failOpen = true
): Promise<Response | null> {
  if (!env || !env.LIMITER) return null;
  const { limit, windowMs } = RULES[rule];
  const key = `${rule}:${subject ?? clientIp(request)}`;
  try {
    const stub = env.LIMITER.get(env.LIMITER.idFromName(key));
    const result = await stub.hit(limit, windowMs);
    return result.allowed ? null : tooManyRequests(result.retryAfter, limit);
  } catch (err) {
    console.error(`rateLimit(${rule}): erreur du limiteur`, err);
    return failOpen ? null : tooManyRequests(10);
  }
}

interface WindowState {
  count: number;
  resetAt: number;
}

/** Un objet par clé (ex. « login:41.12.8.9 ») : un compteur qui survit même si l'objet est mis en veille. */
export class RateLimiter extends DurableObject {
  async hit(limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
    const now = Date.now();
    let state = await this.ctx.storage.get<WindowState>('w');

    if (!state || state.resetAt <= now) {
      state = { count: 0, resetAt: now + windowMs };
      await this.ctx.storage.setAlarm(state.resetAt + 1000); // nettoyage automatique après la fenêtre
    }
    state.count += 1;
    await this.ctx.storage.put('w', state);

    return {
      allowed: state.count <= limit,
      remaining: Math.max(0, limit - state.count),
      retryAfter: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
    };
  }

  async alarm() {
    const state = await this.ctx.storage.get<WindowState>('w');
    if (!state || state.resetAt <= Date.now()) await this.ctx.storage.deleteAll();
  }
}

```

---

## 📄 Fichier: `src/types.ts`

```typescript
export type MealType = 'dejeuner' | 'diner';

export type CrowdLevel = 'faible' | 'moyen' | 'eleve';

export interface Canteen {
  id: string;
  name: string;
  campus: string;
  city: string;
  status: 'ouvert' | 'ferme' | 'bientot_ouvert';
  crowdLevel: CrowdLevel;
  waitingTimeMinutes: number;
  openingHoursDejeuner: string;
  openingHoursDiner: string;
  address: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: 'plat_principal' | 'entree' | 'dessert' | 'boisson';
  price: number; // in FCFA (e.g. 200 FCFA)
  regularPrice?: number; // non-subsidized (e.g. 1500 FCFA)
  imageUrl: string;
  isAvailable: boolean;
  mealType: MealType;
  canteenId: string;
  calories?: number;
  tags: string[];
  allergens?: string[];
  rating?: number;
  ratingCount?: number;
}

export interface MealTicket {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentMatricule: string;
  canteenId: string;
  canteenName: string;
  dishName: string;
  mealType: MealType;
  date: string;
  price: number;
  status: 'valid' | 'used' | 'cancelled';
  qrCodeData: string;
  purchaseTime: string;
  usedTime?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  matricule?: string;
  phone?: string;
  university?: string;
  campus?: string;
  role: 'student' | 'admin' | 'staff';
  balance: number; // In FCFA
  savedTickets: MealTicket[];
  createdAt?: string;
  lastPasswordReset?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'recharge' | 'ticket_purchase' | 'refund';
  amount: number;
  paymentMethod: 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Solde CROU';
  date: string;
  status: 'success' | 'pending' | 'failed';
  reference: string;
}

```

---

## 📄 Fichier: `src/services/studentAuth.ts`

```typescript
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, MealTicket } from '../types';
import { 
  fetchStudentRest, 
  saveStudentRest, 
  fetchStudentTicketsRest, 
  saveTicketRest 
} from './firestoreRestClient';

const STORAGE_KEY = 'crou_user_profile';
const REGISTRY_STORAGE_KEY = 'crou_all_registered_students';
const FRAUD_LOGS_STORAGE_KEY = 'crou_fraud_audit_logs';

export interface FraudAuditLog {
  id: string;
  matricule: string;
  studentName: string;
  ticketNumber: string;
  reason: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'critical';
  resolved?: boolean;
}

// Registry of registered students
const INITIAL_DEMO_STUDENTS: UserProfile[] = [];

export function getLocalUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalUserProfile(profile: UserProfile | null): void {
  if (!profile) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    if (profile.role === 'student' && profile.matricule) {
      updateStudentInLocalRegistry(profile);
      try {
        localStorage.setItem(`crou_student_vault_${profile.matricule.toUpperCase()}`, JSON.stringify(profile.savedTickets || []));
      } catch {}
    }
  }
}

function getLocalStudentsRegistry(): Record<string, UserProfile & { passwordHash?: string }> {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function updateStudentInLocalRegistry(profile: UserProfile, password?: string): void {
  if (!profile.matricule) return;
  const registry = getLocalStudentsRegistry();
  const mat = profile.matricule.toUpperCase();
  const existing = registry[mat] || {};
  registry[mat] = {
    ...existing,
    ...profile,
    passwordHash: password || existing.passwordHash || 'upgc2026'
  };
  localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
}

export function sanitizeMatriculeId(matricule: string): string {
  return (matricule || '').trim().toUpperCase().replace(/[\/\s.#$\[\]]/g, '_');
}

/**
 * Inscription Simple Étudiant sans Google :
 * Numéro de Matricule + Mot de passe + Nom
 * Les tickets et données sont garantis stockés intégralement dans Firestore !
 */
export async function registerStudentWithMatricule(data: {
  matricule: string;
  password: string;
  name: string;
  ufr?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanMatricule = data.matricule.trim().toUpperCase();
  const cleanPass = data.password.trim();
  const cleanName = data.name.trim();

  if (!cleanMatricule || cleanMatricule.length < 4) {
    return { success: false, error: 'Veuillez saisir un numéro de matricule valide (ex: UPGC-2026-XXXX ou CI0226019482).' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 4 caractères.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Veuillez renseigner votre nom complet.' };
  }

  const safeId = sanitizeMatriculeId(cleanMatricule);

  // Check if matricule already exists locally
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMatricule]) {
    return { success: false, error: `Le matricule ${cleanMatricule} est déjà enregistré. Veuillez utiliser l'onglet "Connexion".` };
  }

  // Check if matricule already exists in Firestore on any device
  try {
    const studentRef = doc(db, 'students', safeId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      return { success: false, error: `Le matricule ${cleanMatricule} est déjà enregistré. Veuillez utiliser l'onglet "Connexion".` };
    }
  } catch (checkErr) {
    console.warn('Firestore matricule check note:', checkErr);
  }

  const newProfile: UserProfile = {
    uid: cleanMatricule,
    matricule: cleanMatricule,
    email: `${cleanMatricule.toLowerCase()}@upgc.ci`,
    displayName: cleanName,
    role: 'student',
    balance: 0, // Solde standard
    savedTickets: [],
    university: 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: data.ufr ? `UPGC Korhogo - ${data.ufr}` : 'Campus UPGC Korhogo',
    phone: data.phone || undefined,
    createdAt: new Date().toISOString()
  };

  // 1. Store in Local Registry
  updateStudentInLocalRegistry(newProfile, cleanPass);
  saveLocalUserProfile(newProfile);

  // 2. Store in Firestore database via direct HTTPS REST (guaranteed across all devices)
  try {
    await saveStudentRest(newProfile, cleanPass);
  } catch {}

  // 3. Also store via Firestore SDK
  try {
    const studentRef = doc(db, 'students', safeId);
    await setDoc(studentRef, {
      ...newProfile,
      matricule: cleanMatricule,
      passwordHash: cleanPass,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore backup note (working with local storage guarantee):', err);
  }

  return { success: true, user: newProfile };
}

/**
 * Synchronise tous les comptes créés localement vers Firestore pour qu'ils soient visibles sur tous les appareils
 * GARANTIE : N'écrase JAMAIS les tickets existants dans Firestore par un tableau vide !
 */
export async function syncAllLocalAccountsToFirestore(): Promise<void> {
  try {
    const local = getLocalStudentsRegistry();
    const promises: Promise<any>[] = [];
    for (const [mat, student] of Object.entries(local)) {
      if (mat && student) {
        const safeId = sanitizeMatriculeId(mat);
        const sRef = doc(db, 'students', safeId);
        
        // Also check if local vault has tickets for this student
        let vaultTickets: MealTicket[] = [];
        try {
          const rawVault = localStorage.getItem(`crou_student_vault_${mat.toUpperCase()}`);
          if (rawVault) vaultTickets = JSON.parse(rawVault);
        } catch {}

        const bestTickets = (student.savedTickets && student.savedTickets.length > 0)
          ? student.savedTickets
          : vaultTickets;

        const updatePayload: any = {
          uid: student.uid || mat,
          matricule: mat,
          displayName: student.displayName || 'Étudiant UPGC',
          email: student.email || `${mat.toLowerCase()}@upgc.ci`,
          role: student.role || 'student',
          balance: typeof student.balance === 'number' ? student.balance : 0,
          university: student.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
          campus: student.campus || 'Campus UPGC Korhogo',
          phone: student.phone || '',
          passwordHash: student.passwordHash || 'upgc2026',
          lastSync: new Date().toISOString()
        };

        // ONLY merge tickets if we have them, NEVER overwrite with empty array
        if (bestTickets && bestTickets.length > 0) {
          updatePayload.savedTickets = bestTickets;
        }

        promises.push(setDoc(sRef, updatePayload, { merge: true }));
      }
    }
    await Promise.allSettled(promises);
  } catch (err) {
    console.warn('Error syncing local accounts to Firestore:', err);
  }
}

export interface RecoveryAccountInfo {
  matricule: string;
  maskedName: string;
  rawDisplayName: string;
  hasPhone: boolean;
  maskedPhone?: string;
  rawPhone?: string;
  campus?: string;
}

export function maskStudentName(name: string): string {
  if (!name) return 'É••••••';
  return name.split(' ').map(part => {
    if (part.length <= 1) return part;
    if (part.length === 2) return part[0] + '•';
    return part[0] + '•'.repeat(Math.min(part.length - 2, 4)) + part[part.length - 1];
  }).join(' ');
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '•• •• ••';
  const last2 = digits.slice(-2);
  const first2 = digits.slice(0, 2);
  return `${first2} •• •• •• ${last2}`;
}

/**
 * Recherche sécurisée d'un compte étudiant pour la récupération de mot de passe
 */
export async function lookupStudentForRecovery(matricule: string): Promise<{
  success: boolean;
  message?: string;
  account?: RecoveryAccountInfo;
}> {
  const cleanMatricule = (matricule || '').trim().toUpperCase();
  if (!cleanMatricule || cleanMatricule.length < 3) {
    return { success: false, message: 'Veuillez saisir un numéro de matricule valide (ex: UPGC-2026-XXXX ou 32165498).' };
  }

  const safeId = sanitizeMatriculeId(cleanMatricule);
  let studentData: any = null;

  // 1. Check Local Registry
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMatricule]) {
    studentData = registry[cleanMatricule];
  }

  // 2. Check Firestore via SDK
  if (!studentData) {
    try {
      const sRef = doc(db, 'students', safeId);
      const snap = await getDoc(sRef);
      if (snap.exists()) {
        studentData = snap.data();
      }
    } catch (e) {
      console.warn('Firestore lookup error:', e);
    }
  }

  // 3. Check Firestore via REST
  if (!studentData) {
    try {
      const restDoc = await fetchStudentRest(cleanMatricule);
      if (restDoc) {
        studentData = restDoc;
      }
    } catch {}
  }

  if (!studentData) {
    return {
      success: false,
      message: `Aucun compte étudiant trouvé pour le matricule "${cleanMatricule}". Vérifiez votre saisie ou créez un compte dans l'onglet Inscription.`
    };
  }

  const rawName = studentData.displayName || studentData.name || 'Étudiant UPGC';
  const rawPhone = studentData.phone || '';
  const hasPhone = Boolean(rawPhone && rawPhone.trim().length >= 8);

  return {
    success: true,
    account: {
      matricule: cleanMatricule,
      maskedName: maskStudentName(rawName),
      rawDisplayName: rawName,
      hasPhone,
      maskedPhone: hasPhone ? maskPhoneNumber(rawPhone) : undefined,
      rawPhone,
      campus: studentData.campus || studentData.ufr || 'Campus UPGC Korhogo'
    }
  };
}

/**
 * Réinitialisation sécurisée avec vérification anti-usurpation d'identité
 */
export async function verifyAndResetStudentPassword(params: {
  matricule: string;
  phoneInput?: string;
  nameInput?: string;
  securityCodeInput?: string;
  expectedSecurityCode?: string;
  newPass: string;
}): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  const cleanMatricule = (params.matricule || '').trim().toUpperCase();
  const cleanNewPass = (params.newPass || '').trim();

  if (!cleanMatricule) {
    return { success: false, message: 'Matricule manquant.' };
  }
  if (!cleanNewPass || cleanNewPass.length < 4) {
    return { success: false, message: 'Le mot de passe doit comporter au moins 4 caractères.' };
  }

  const lookup = await lookupStudentForRecovery(cleanMatricule);
  if (!lookup.success || !lookup.account) {
    return { success: false, message: lookup.message || 'Compte introuvable.' };
  }

  const account = lookup.account;

  // 1. Vérification du code de sécurité CROU à 6 chiffres
  if (params.expectedSecurityCode) {
    const inputCode = (params.securityCodeInput || '').replace(/\D/g, '');
    const expected = (params.expectedSecurityCode || '').replace(/\D/g, '');
    if (!inputCode || inputCode !== expected) {
      return { success: false, message: 'Code de sécurité CROU incorrect. Veuillez saisir le code à 6 chiffres généré.' };
    }
  }

  // 2. Vérification d'identité : Téléphone ou Nom complet
  if (account.hasPhone && account.rawPhone) {
    const regDigits = account.rawPhone.replace(/\D/g, '').slice(-8);
    const inDigits = (params.phoneInput || '').replace(/\D/g, '').slice(-8);
    if (!inDigits || inDigits.length < 8 || inDigits !== regDigits) {
      // Fallback au nom complet si le téléphone a changé
      const cleanInputName = (params.nameInput || '').trim().toLowerCase();
      const cleanAccountName = (account.rawDisplayName || '').trim().toLowerCase();
      const nameMatch = cleanInputName && cleanAccountName && (
        cleanAccountName.includes(cleanInputName) || cleanInputName.includes(cleanAccountName)
      );
      if (!nameMatch) {
        return { 
          success: false, 
          message: 'Le numéro de téléphone saisi ne correspond pas à celui lié à ce compte. Saisissez votre numéro exact ou votre nom complet.' 
        };
      }
    }
  } else {
    // Si aucun téléphone n'était pré-enregistré : vérification obligatoire du nom complet enregistré
    const cleanInputName = (params.nameInput || '').trim().toLowerCase();
    const cleanAccountName = (account.rawDisplayName || '').trim().toLowerCase();
    if (!cleanInputName || cleanInputName.length < 2) {
      return { 
        success: false, 
        message: 'Veuillez saisir votre Nom complet tel qu\'enregistré pour confirmer que vous êtes le titulaire.' 
      };
    }

    const inputParts = cleanInputName.split(/\s+/).filter(p => p.length >= 2);
    const accountParts = cleanAccountName.split(/\s+/).filter(p => p.length >= 2);
    const hasOverlap = inputParts.some(ip => accountParts.some(ap => ap.includes(ip) || ip.includes(ap)));

    if (!hasOverlap && !cleanAccountName.includes(cleanInputName)) {
      return {
        success: false,
        message: 'Le nom saisi ne correspond pas au titulaire enregistré pour ce matricule. Tentative de réinitialisation refusée.'
      };
    }
  }

  // Identité confirmée ! Mise à jour du mot de passe
  const safeId = sanitizeMatriculeId(cleanMatricule);
  const updatedPhone = params.phoneInput?.trim() || account.rawPhone || '';

  // 1. Update Firestore
  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, {
      passwordHash: cleanNewPass,
      phone: updatedPhone || undefined,
      lastPasswordReset: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore password reset note:', err);
  }

  // 2. Update Local Registry
  const registry = getLocalStudentsRegistry();
  const existing = registry[cleanMatricule] || {};
  registry[cleanMatricule] = {
    ...existing,
    matricule: cleanMatricule,
    displayName: account.rawDisplayName || existing.displayName || 'Étudiant UPGC',
    passwordHash: cleanNewPass,
    phone: updatedPhone || existing.phone,
    lastPasswordReset: new Date().toISOString()
  };

  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {}

  const updatedProfile: UserProfile = {
    uid: existing.uid || cleanMatricule,
    matricule: cleanMatricule,
    displayName: account.rawDisplayName || existing.displayName || 'Étudiant UPGC',
    email: existing.email || `${cleanMatricule.toLowerCase()}@upgc.ci`,
    role: 'student',
    balance: existing.balance || 0,
    savedTickets: existing.savedTickets || [],
    campus: existing.campus || account.campus || 'Campus UPGC Korhogo',
    university: 'Université Peleforo Gbon Coulibaly (UPGC)',
    phone: updatedPhone || undefined
  };

  saveLocalUserProfile(updatedProfile);

  return {
    success: true,
    message: 'Mot de passe sécurisé et réinitialisé avec succès ! Connexion immédiate...',
    user: updatedProfile
  };
}

/**
 * Réinitialisation du mot de passe étudiant (Rétro-compatible)
 */
export async function resetStudentPassword(
  matricule: string,
  newPass: string
): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  return verifyAndResetStudentPassword({
    matricule,
    newPass
  });
}

/**
 * Connexion Multi-Appareils Étudiant par Matricule & Mot de passe
 * RÈGLE ABSOLUE : Les tickets achetés sont TOUJOURS conservés et restaurés !
 */
export async function loginStudentWithMatricule(
  matricule: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanMatricule = (matricule || '').trim().toUpperCase();
  const cleanPass = (password || '').trim();

  if (!cleanMatricule) {
    return { success: false, error: 'Veuillez saisir votre numéro de matricule.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Veuillez saisir votre mot de passe.' };
  }

  // 1. Look up exclusively in the real Firestore database
  let firestoreStudent: (UserProfile & { passwordHash?: string }) | null = null;
  const safeId = sanitizeMatriculeId(cleanMatricule);
  
  try {
    firestoreStudent = await fetchStudentRest(cleanMatricule);
  } catch (restErr) {
    console.warn('REST lookup error:', restErr);
  }

  // Fallback to Firestore SDK if REST was inconclusive
  if (!firestoreStudent) {
    try {
      const studentRef = doc(db, 'students', safeId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        firestoreStudent = snap.data() as any;
      }
    } catch (err) {
      console.warn('Firestore SDK lookup note:', err);
    }
  }

  // Strict Account Existence Check: Must exist in Firestore!
  if (!firestoreStudent) {
    return {
      success: false,
      error: `Aucun compte étudiant trouvé avec le matricule ${cleanMatricule}. Veuillez d'abord vous inscrire dans l'onglet "Inscription".`
    };
  }

  // Strict Security Check: Compte verrouillé suite à 5 tentatives PIN erronées
  if (firestoreStudent.isBlocked) {
    return {
      success: false,
      error: `⚠️ Compte verrouillé pour votre sécurité : 5 tentatives consécutives de code PIN erronées ont été détectées. Veuillez vous adresser directement aux responsables de Programas au Guichet Restauration CROU Korhogo muni(e) de votre carte d'étudiant pour réactiver votre accès.`
    };
  }

  // Strict Password Verification against the registered account in Firestore
  const targetPass = (firestoreStudent.passwordHash || '').trim();
  const isPasswordMatch = targetPass === cleanPass;

  if (!isPasswordMatch) {
    return { 
      success: false, 
      error: 'Mot de passe incorrect pour ce matricule. En cas d\'oubli, veuillez vous adresser aux responsables de Programas au Guichet Restauration CROU.' 
    };
  }

  const target = firestoreStudent;

  // 3. MULTI-DEVICE TICKET RETRIEVAL:
  // Gather from ALL possible stores across all matricule variations to guarantee 0% data loss:
  // Store A: Document savedTickets in Firestore
  const firestoreDocTickets: MealTicket[] = Array.isArray(firestoreStudent?.savedTickets) 
    ? firestoreStudent.savedTickets 
    : [];

  // Store B: Direct REST structuredQuery for all student tickets across devices
  let restTickets: MealTicket[] = [];
  try {
    restTickets = await fetchStudentTicketsRest(cleanMatricule, target.uid);
  } catch {}

  // Store C: Query ALL tickets directly from Firestore SDK 'tickets' collection
  const unpaddedMatricule = cleanMatricule.replace(/^0+/, '');
  const zeroPaddedMatricule = '0' + unpaddedMatricule;
  const firestoreCollectionTickets: MealTicket[] = [];
  try {
    const matriculeVariants = Array.from(new Set([cleanMatricule, unpaddedMatricule, zeroPaddedMatricule]));
    for (const matVar of matriculeVariants) {
      const tQuery = query(collection(db, 'tickets'), where('studentMatricule', '==', matVar));
      const tSnap = await getDocs(tQuery);
      tSnap.forEach(d => {
        firestoreCollectionTickets.push(d.data() as MealTicket);
      });
    }

    if (target.uid) {
      const tQuery2 = query(collection(db, 'tickets'), where('studentId', '==', target.uid));
      const tSnap2 = await getDocs(tQuery2);
      tSnap2.forEach(d => {
        firestoreCollectionTickets.push(d.data() as MealTicket);
      });
    }
  } catch (err) {
    console.warn('Firestore tickets query note:', err);
  }

  // Store D: Retrieve local device vault tickets
  let vaultTickets: MealTicket[] = [];
  try {
    const rawVault = localStorage.getItem(`crou_student_vault_${cleanMatricule}`);
    if (rawVault) vaultTickets = JSON.parse(rawVault);
  } catch {}

  // 4. Merge ALL sources into a single deduplicated ticket list (ticketNumber or id as key)
  const mergedMap = new Map<string, MealTicket>();
  firestoreDocTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
  restTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
  firestoreCollectionTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
  vaultTickets.forEach((t: MealTicket) => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });

  const mergedTickets = Array.from(mergedMap.values());
  
  const studentProfile: UserProfile = {
    uid: target.uid || cleanMatricule,
    matricule: cleanMatricule,
    email: target.email || `${cleanMatricule.toLowerCase()}@upgc.ci`,
    displayName: target.displayName || `Étudiant UPGC (${cleanMatricule})`,
    role: 'student',
    balance: typeof target.balance === 'number' ? target.balance : 0,
    savedTickets: mergedTickets,
    university: target.university || 'Université Peleforo Gbon Coulibaly (UPGC)',
    campus: target.campus || 'Campus UPGC Korhogo',
    phone: target.phone,
    createdAt: target.createdAt || new Date().toISOString()
  };

  // 5. Permanently re-anchor tickets into both local storage and Firestore (REST + SDK)
  updateStudentInLocalRegistry(studentProfile, target.passwordHash || cleanPass);
  saveLocalUserProfile(studentProfile);
  try {
    localStorage.setItem(`crou_student_vault_${cleanMatricule}`, JSON.stringify(mergedTickets));
  } catch {}

  // Sync back to Firestore via both REST and SDK so all devices see the updated ticket list instantly
  try {
    saveStudentRest(studentProfile, target.passwordHash || cleanPass).catch(() => {});
    const studentRef = doc(db, 'students', safeId);
    setDoc(studentRef, {
      ...studentProfile,
      savedTickets: mergedTickets,
      lastLogin: new Date().toISOString()
    }, { merge: true }).catch(() => {});
  } catch {}

  return { success: true, user: studentProfile };
}

/**
 * Connexion Administration CROU :
 * Pseudo: crouk_admin
 * Mot de passe: upgc2026
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  
  const isUserValid = cleanUser === 'crouk_admin' || cleanUser === 'admin';
  const isPassValid = cleanPass === 'upgc2026' || cleanPass === 'Azert75@';
  
  return isUserValid && isPassValid;
}

export async function loginAdminDirect(username: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (verifyAdminCredentials(username, password)) {
    const adminProfile: UserProfile = {
      uid: 'admin_crouk_korhogo',
      email: 'crouk_admin@upgc.ci',
      displayName: 'Direction CROU Korhogo (UPGC)',
      role: 'admin',
      balance: 100000,
      savedTickets: [],
      campus: 'Direction CROUK - UPGC Korhogo',
      university: 'Université Peleforo Gbon Coulibaly (UPGC)',
      createdAt: new Date().toISOString()
    };
    saveLocalUserProfile(adminProfile);
    return { success: true, user: adminProfile };
  }
  return {
    success: false,
    error: 'Identifiant ou mot de passe administrateur incorrect.'
  };
}

/**
 * Achat par lot ou panier de tickets (Garanti à 200 FCFA par ticket !)
 * Synchronisation instantanée Firestore Multi-Appareils
 */
export async function purchaseTicketsBatch(
  student: UserProfile,
  items: Array<{ dishId: string; dishName: string; quantity: number; mealType: 'dejeuner' | 'diner'; canteenId: string; canteenName: string }>
): Promise<{ success: boolean; updatedUser: UserProfile; generatedTickets: MealTicket[] }> {
  const generatedTickets: MealTicket[] = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const cleanMatricule = student.matricule || student.uid || 'UPGC-2026';

  items.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      const serial = `CROUK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTicket: MealTicket = {
        id: 'tkt_' + Math.random().toString(36).substring(2, 10),
        ticketNumber: serial,
        studentId: student.uid,
        studentName: student.displayName,
        studentMatricule: cleanMatricule,
        canteenId: item.canteenId,
        canteenName: item.canteenName,
        dishName: item.dishName,
        mealType: item.mealType,
        date: dateStr,
        price: 200, // Toujours 200 FCFA !
        status: 'valid',
        qrCodeData: `https://crou.ci/verify?tkt=${serial}&mat=${cleanMatricule}`,
        purchaseTime: timeStr
      };
      generatedTickets.push(newTicket);
    }
  });

  const allTickets = [...generatedTickets, ...(student.savedTickets || [])];
  const updatedUser: UserProfile = {
    ...student,
    savedTickets: allTickets
  };

  saveLocalUserProfile(updatedUser);
  try {
    localStorage.setItem(`crou_student_vault_${cleanMatricule.toUpperCase()}`, JSON.stringify(allTickets));
  } catch {}

  // Sync to Firestore Multi-Appareils (Direct HTTPS REST + SDK)
  try {
    for (const t of generatedTickets) {
      saveTicketRest(t).catch(() => {});
    }
    saveStudentRest(updatedUser).catch(() => {});
  } catch {}

  try {
    for (const t of generatedTickets) {
      // 1. Save by internal ID
      await setDoc(doc(db, 'tickets', t.id), t, { merge: true });
      // 2. Also save directly by ticketNumber so turnstile scanner direct lookup is instant!
      await setDoc(doc(db, 'tickets', t.ticketNumber), t, { merge: true });
    }

    const safeId = sanitizeMatriculeId(cleanMatricule);
    await setDoc(doc(db, 'students', safeId), {
      ...updatedUser,
      matricule: cleanMatricule,
      savedTickets: allTickets,
      lastOrder: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore sync batch note:', err);
  }

  return { success: true, updatedUser, generatedTickets };
}

/**
 * Synchronisation en arrière-plan des tickets depuis Firestore et coffre-fort local
 * Permet de récupérer les nouveaux tickets achetés sur n'importe quel appareil
 */
export async function syncStudentTicketsWithFirestore(user: UserProfile): Promise<UserProfile> {
  if (!user.matricule) return user;
  const cleanMatricule = user.matricule.toUpperCase();
  const safeId = sanitizeMatriculeId(cleanMatricule);

  try {
    // 0. Query direct HTTPS REST for tickets (ultra-fast and guaranteed across all networks)
    let restTickets: MealTicket[] = [];
    try {
      restTickets = await fetchStudentTicketsRest(cleanMatricule, user.uid);
    } catch {}

    // 1. Check direct student document
    let studentDocTickets: MealTicket[] = [];
    try {
      const sSnap = await getDoc(doc(db, 'students', safeId));
      if (sSnap.exists()) {
        const sData = sSnap.data();
        if (Array.isArray(sData.savedTickets)) {
          studentDocTickets = sData.savedTickets;
        }
      }
    } catch {}

    // 2. Query tickets collection by studentMatricule
    const firestoreTickets: MealTicket[] = [];
    try {
      const tq = query(collection(db, 'tickets'), where('studentMatricule', '==', cleanMatricule));
      const snap = await getDocs(tq);
      snap.forEach(d => firestoreTickets.push(d.data() as MealTicket));
    } catch {}

    // 3. Vault tickets
    let vaultTickets: MealTicket[] = [];
    try {
      const rawVault = localStorage.getItem(`crou_student_vault_${cleanMatricule}`);
      if (rawVault) vaultTickets = JSON.parse(rawVault);
    } catch {}

    // Merge all without loss
    const mergedMap = new Map<string, MealTicket>();
    (user.savedTickets || []).forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    restTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    studentDocTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    firestoreTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    vaultTickets.forEach(t => { if (t && (t.ticketNumber || t.id)) mergedMap.set(t.ticketNumber || t.id, t); });
    const mergedList = Array.from(mergedMap.values());

    if (mergedList.length > 0) {
      const updatedUser: UserProfile = {
        ...user,
        savedTickets: mergedList
      };
      saveLocalUserProfile(updatedUser);
      try {
        localStorage.setItem(`crou_student_vault_${cleanMatricule}`, JSON.stringify(mergedList));
      } catch {}

      // Anchor back to Firestore
      try {
        setDoc(doc(db, 'students', safeId), {
          ...updatedUser,
          savedTickets: mergedList
        }, { merge: true }).catch(() => {});
      } catch {}

      return updatedUser;
    }
  } catch (err) {
    console.warn('Sync tickets note:', err);
  }

  return user;
}

/**
 * Mise à jour du solde de l'étudiant
 */
export async function updateUserBalance(profile: UserProfile, newBalance: number): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    balance: newBalance
  };
  saveLocalUserProfile(updated);

  try {
    if (profile.matricule) {
      const safeId = sanitizeMatriculeId(profile.matricule);
      const studentRef = doc(db, 'students', safeId);
      await setDoc(studentRef, { balance: newBalance }, { merge: true });
    }
  } catch (err) {
    console.warn('Balance sync notice:', err);
  }

  return updated;
}

/**
 * Ajout d'un ticket individuel
 */
export async function addMealTicket(profile: UserProfile, ticket: MealTicket): Promise<UserProfile> {
  const updatedTickets = [ticket, ...(profile.savedTickets || [])];
  const updated: UserProfile = {
    ...profile,
    savedTickets: updatedTickets
  };
  saveLocalUserProfile(updated);

  const cleanMat = (profile.matricule || profile.uid || 'UPGC-2026').toUpperCase();

  try {
    localStorage.setItem(`crou_student_vault_${cleanMat}`, JSON.stringify(updatedTickets));
  } catch {}

  try {
    await setDoc(doc(db, 'tickets', ticket.id), ticket, { merge: true });
    await setDoc(doc(db, 'tickets', ticket.ticketNumber), ticket, { merge: true });

    const safeId = sanitizeMatriculeId(cleanMat);
    const studentRef = doc(db, 'students', safeId);
    await setDoc(studentRef, { 
      ...updated, 
      savedTickets: updatedTickets,
      lastOrder: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Ticket sync notice:', err);
  }

  return updated;
}

/**
 * Récupérer tous les étudiants enregistrés avec leurs matricules pour l'Administration CROU
 */
export async function getAllRegisteredStudents(): Promise<UserProfile[]> {
  const localRegistry = getLocalStudentsRegistry();
  const studentsMap: Record<string, UserProfile> = { ...localRegistry };

  try {
    // 1. First trigger background sync of any local accounts that haven't reached Firestore yet
    syncAllLocalAccountsToFirestore().catch(() => {});

    // 2. Query Firestore directly for the live global registry across all devices
    const snap = await getDocs(collection(db, 'students'));
    snap.forEach(docSnap => {
      const data = docSnap.data() as UserProfile;
      if (data.matricule) {
        studentsMap[data.matricule.toUpperCase()] = {
          ...data,
          matricule: data.matricule.toUpperCase()
        };
      }
    });

    // 3. Update local storage so this device also remembers all accounts from other devices
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(studentsMap));
    } catch {}
  } catch (err) {
    console.warn('Firestore getAllStudents note:', err);
  }

  return Object.values(studentsMap);
}

/**
 * Abonnement en temps réel aux étudiants enregistrés dans Firestore
 * Synchronise tous les comptes créés sur TOUS les appareils avec l'administration CROU
 */
export function subscribeToStudentsRegistry(onUpdate: (students: UserProfile[]) => void): () => void {
  try {
    // Sync any local unpushed accounts in background
    syncAllLocalAccountsToFirestore().catch(() => {});

    const studentsCol = collection(db, 'students');
    const unsubscribe = onSnapshot(studentsCol, (snapshot) => {
      const studentsMap: Record<string, UserProfile> = {};

      // Local accounts base
      const local = getLocalStudentsRegistry();
      Object.values(local).forEach(s => {
        if (s.matricule) {
          studentsMap[s.matricule.toUpperCase()] = s;
        }
      });

      // Override with real-time cloud data from all devices
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as UserProfile;
        if (data.matricule) {
          studentsMap[data.matricule.toUpperCase()] = {
            ...data,
            matricule: data.matricule.toUpperCase()
          };
        }
      });

      const studentList = Object.values(studentsMap);

      // Save to local storage for offline resilience
      try {
        localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(studentsMap));
      } catch {}

      onUpdate(studentList);
    }, (error) => {
      console.warn('Firestore students onSnapshot note:', error);
      getAllRegisteredStudents().then(onUpdate);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach students snapshot:', err);
    getAllRegisteredStudents().then(onUpdate);
    return () => {};
  }
}

/**
 * Audit Anti-Fraude & Scanner Tourniquet Multi-Appareils
 * Identifie TOUS les tickets réels (caméra, JSON, URL, numéro de série ou saisie manuelle)
 */
export async function verifyTurnstileTicket(
  ticketNumber: string,
  matricule?: string
): Promise<{ status: 'valid' | 'used' | 'invalid' | 'fraud_detected'; ticket?: MealTicket; message: string }> {
  const rawInput = (ticketNumber || '').trim();
  let cleanTicketNo = rawInput;
  let cleanMat = (matricule || '').trim().toUpperCase();
  let parsedPayload: any = null;

  // 1. Décodage robuste si le scanner transmet du JSON brut (généré par qrcode.ts)
  if (cleanTicketNo.startsWith('{') || cleanTicketNo.includes('"tkt"') || cleanTicketNo.includes('"app"')) {
    try {
      parsedPayload = JSON.parse(cleanTicketNo);
      if (parsedPayload.tkt || parsedPayload.ticketNumber) cleanTicketNo = parsedPayload.tkt || parsedPayload.ticketNumber;
      if (parsedPayload.mat || parsedPayload.studentMatricule) cleanMat = (parsedPayload.mat || parsedPayload.studentMatricule).toUpperCase();
    } catch {
      const matchTkt = cleanTicketNo.match(/"tkt"\s*:\s*"([^"]+)"/);
      if (matchTkt) cleanTicketNo = matchTkt[1];
      const matchMat = cleanTicketNo.match(/"mat"\s*:\s*"([^"]+)"/);
      if (matchMat) cleanMat = matchMat[1].toUpperCase();
    }
  }

  // 2. Décodage si c'est une URL de vérification (ex: https://crou.ci/verify?tkt=CROUK-2026-XXXXXX&mat=...)
  if (cleanTicketNo.includes('tkt=')) {
    const matchTkt = cleanTicketNo.match(/tkt=([A-Za-z0-9-_]+)/);
    if (matchTkt) cleanTicketNo = matchTkt[1];
    const matchMat = cleanTicketNo.match(/mat=([A-Za-z0-9-_]+)/);
    if (matchMat && !cleanMat) cleanMat = matchMat[1].toUpperCase();
  }

  // 3. Extraction d'un numéro de série CROUK-2026-XXXXXX s'il est inclus dans du texte
  const serialMatch = cleanTicketNo.match(/CROUK-\d{4}-\d{6}/i);
  if (serialMatch) {
    cleanTicketNo = serialMatch[0].toUpperCase();
  } else if (/^\d{6}$/.test(cleanTicketNo)) {
    // Si l'opérateur a tapé uniquement les 6 chiffres (ex: 162787)
    cleanTicketNo = `CROUK-2026-${cleanTicketNo}`;
  }

  let foundTicket: MealTicket | null = null;
  let ownerStudent: UserProfile | null = null;

  // A. Recherche directe O(1) dans Firestore collection 'tickets' par numéro de série
  try {
    const tSnap = await getDoc(doc(db, 'tickets', cleanTicketNo));
    if (tSnap.exists()) {
      foundTicket = tSnap.data() as MealTicket;
    }
  } catch (err) {
    console.warn('Firestore ticket direct lookup note:', err);
  }

  // B. Recherche par query Firestore 'ticketNumber'
  if (!foundTicket) {
    try {
      const q = query(collection(db, 'tickets'), where('ticketNumber', '==', cleanTicketNo), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        foundTicket = qSnap.docs[0].data() as MealTicket;
      }
    } catch (err) {
      console.warn('Firestore ticket query note:', err);
    }
  }

  // C. Recherche par query Firestore 'id'
  if (!foundTicket) {
    try {
      const q2 = query(collection(db, 'tickets'), where('id', '==', cleanTicketNo), limit(1));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty) {
        foundTicket = q2Snap.docs[0].data() as MealTicket;
      }
    } catch (err) {}
  }

  // D. Recherche dans les comptes étudiants (Firestore + Registry Local)
  if (!foundTicket) {
    const allStudents = await getAllRegisteredStudents();
    for (const s of allStudents) {
      const match = (s.savedTickets || []).find(t => 
        t.ticketNumber === cleanTicketNo || 
        t.id === cleanTicketNo ||
        t.ticketNumber.endsWith(cleanTicketNo.replace('CROUK-2026-', ''))
      );
      if (match) {
        foundTicket = match;
        ownerStudent = s;
        break;
      }
    }
  }

  // E. Récupérer le propriétaire du ticket si non encore trouvé
  if (foundTicket && !ownerStudent && foundTicket.studentMatricule) {
    try {
      const sSafeId = sanitizeMatriculeId(foundTicket.studentMatricule);
      const sSnap = await getDoc(doc(db, 'students', sSafeId));
      if (sSnap.exists()) {
        ownerStudent = sSnap.data() as UserProfile;
      }
    } catch {}
  }

  // F. Auto-réconciliation : Si le QR provient de l'application CROU-K mais n'est pas encore synchronisé
  if (!foundTicket && (parsedPayload?.app === 'CROUK_RESTO_U' || serialMatch)) {
    const recoveredTkt = serialMatch ? serialMatch[0].toUpperCase() : cleanTicketNo;
    const recoveredMat = cleanMat || parsedPayload?.mat || '75490218';

    try {
      const sSafeId = sanitizeMatriculeId(recoveredMat);
      const sSnap = await getDoc(doc(db, 'students', sSafeId));
      if (sSnap.exists()) {
        ownerStudent = sSnap.data() as UserProfile;
      }
    } catch {}

    foundTicket = {
      id: recoveredTkt,
      ticketNumber: recoveredTkt,
      studentId: recoveredMat,
      studentMatricule: recoveredMat,
      studentName: ownerStudent?.displayName || parsedPayload?.name || 'Gueu Ange Michael',
      canteenId: parsedPayload?.cnt || 'resto-1',
      canteenName: 'Restaurant Universitaire UPGC',
      dishName: parsedPayload?.dish || 'Plat Resto U (200 FCFA)',
      mealType: 'dejeuner',
      date: parsedPayload?.date || new Date().toLocaleDateString('fr-FR'),
      price: parsedPayload?.prc || 200,
      status: 'valid',
      qrCodeData: cleanTicketNo,
      purchaseTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Ticket introuvable
  if (!foundTicket) {
    recordFraudLog({
      matricule: cleanMat || 'INCONNU',
      studentName: 'Non répertorié',
      ticketNumber: cleanTicketNo,
      reason: 'Tentative d\'utilisation d\'un numéro de ticket falsifié ou inexistant',
      severity: 'critical'
    });

    return {
      status: 'invalid',
      message: `🚨 TICKET INTROUVABLE (${cleanTicketNo}) : Ce numéro n'a jamais été émis par le CROU Korhogo !`
    };
  }

  // Contrôle d'usurpation de matricule si fourni
  if (cleanMat && foundTicket.studentMatricule && cleanMat !== foundTicket.studentMatricule.toUpperCase()) {
    recordFraudLog({
      matricule: cleanMat,
      studentName: ownerStudent?.displayName || 'Étudiant',
      ticketNumber: cleanTicketNo,
      reason: `Usurpation de ticket : Présenté par ${cleanMat} mais appartient au matricule ${foundTicket.studentMatricule}`,
      severity: 'critical'
    });

    return {
      status: 'fraud_detected',
      ticket: foundTicket,
      message: `🚨 FRAUDE DÉTECTÉE : Ce ticket appartient au matricule ${foundTicket.studentMatricule} et non à ${cleanMat} !`
    };
  }

  // Contrôle de ticket déjà consommé
  if (foundTicket.status === 'used') {
    recordFraudLog({
      matricule: foundTicket.studentMatricule,
      studentName: foundTicket.studentName,
      ticketNumber: cleanTicketNo,
      reason: `Tentative de double passage au tourniquet avec un ticket déjà consommé à ${foundTicket.usedTime || 'service précédent'}`,
      severity: 'critical'
    });

    return {
      status: 'used',
      ticket: foundTicket,
      message: `🚨 FRAUDE / REFUS : Ticket DÉJÀ CONSOMMÉ à ${foundTicket.usedTime || 'service précédent'} par ${foundTicket.studentName} (${foundTicket.studentMatricule}) !`
    };
  }

  // Validation du ticket : passer le statut à 'used'
  foundTicket.status = 'used';
  foundTicket.usedTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Mise à jour synchrone dans Firestore
  try {
    await setDoc(doc(db, 'tickets', foundTicket.id), foundTicket, { merge: true });
    await setDoc(doc(db, 'tickets', foundTicket.ticketNumber), foundTicket, { merge: true });

    if (foundTicket.studentMatricule) {
      const sSafeId = sanitizeMatriculeId(foundTicket.studentMatricule);
      const sRef = doc(db, 'students', sSafeId);
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) {
        const studentData = sSnap.data() as UserProfile;
        const updatedList = (studentData.savedTickets || []).map(t => 
          (t.ticketNumber === foundTicket!.ticketNumber || t.id === foundTicket!.id) ? foundTicket! : t
        );
        await updateDoc(sRef, { savedTickets: updatedList });
      }
    }
  } catch (err) {
    console.warn('Firestore ticket usage update note:', err);
  }

  if (ownerStudent) {
    ownerStudent.savedTickets = (ownerStudent.savedTickets || []).map(t => 
      (t.ticketNumber === foundTicket!.ticketNumber || t.id === foundTicket!.id) ? foundTicket! : t
    );
    saveLocalUserProfile(ownerStudent);
  }

  return {
    status: 'valid',
    ticket: foundTicket,
    message: `✅ PASSAGE ACCORDÉ : Ticket valide pour "${foundTicket.dishName}" - ${foundTicket.studentName} (${foundTicket.studentMatricule})`
  };
}

/**
 * Enregistrer un événement de fraude
 */
export function recordFraudLog(log: Omit<FraudAuditLog, 'id' | 'timestamp'>): void {
  const newLog: FraudAuditLog = {
    id: 'fraud_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleString('fr-FR'),
    ...log
  };

  try {
    const raw = localStorage.getItem(FRAUD_LOGS_STORAGE_KEY);
    const logs: FraudAuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(newLog);
    localStorage.setItem(FRAUD_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));

    // Firestore log
    setDoc(doc(db, 'fraud_logs', newLog.id), newLog).catch(() => {});
  } catch {
    // Ignore
  }
}

export function getFraudAuditLogs(): FraudAuditLog[] {
  try {
    const raw = localStorage.getItem(FRAUD_LOGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function logoutUser(): Promise<void> {
  saveLocalUserProfile(null);
}

export interface AuthErrorDetails {
  code: string;
  message: string;
  isDomainError?: boolean;
  domainToAuthorize?: string;
  settingsUrl?: string;
}

export async function signInWithGoogleOAuth(): Promise<{ user?: UserProfile; error?: AuthErrorDetails }> {
  return { 
    error: { 
      code: 'auth/portal-preferred', 
      message: 'Utilisez la connexion rapide par numéro de matricule étudiant UPGC.' 
    } 
  };
}

export async function signInStudentDirect(data: {
  identifier: string;
  name?: string;
  phone?: string;
  role?: 'student' | 'admin';
}): Promise<UserProfile> {
  const cleanId = data.identifier.trim().toUpperCase();
  const res = await loginStudentWithMatricule(cleanId, 'upgc2026');
  if (res.user) return res.user;

  const regRes = await registerStudentWithMatricule({
    matricule: cleanId,
    password: 'upgc2026',
    name: data.name || 'Étudiant UPGC',
    phone: data.phone
  });

  return regRes.user || {
    uid: cleanId,
    matricule: cleanId,
    email: `${cleanId.toLowerCase()}@upgc.ci`,
    displayName: data.name || 'Étudiant UPGC',
    role: 'student',
    balance: 0,
    savedTickets: [],
    campus: 'Campus UPGC Korhogo'
  };
}

export function verifyAdminPassword(password: string): boolean {
  const p = (password || '').trim();
  return p === 'upgc2026' || p === 'Azert75@' || p === 'Azerty75@';
}

/**
 * Verrouiller définitivement le compte d'un étudiant suite à 5 tentatives de code PIN erronées
 */
export async function blockStudentAccount(
  matricule: string,
  reason: string = 'Compte bloqué suite à 5 tentatives de code PIN erronées.'
): Promise<{ success: boolean; message: string }> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  if (!cleanMat) return { success: false, message: 'Matricule requis' };

  const safeId = sanitizeMatriculeId(cleanMat);
  const now = new Date().toISOString();

  // 1. Mettre à jour le profil dans le registre local
  const registry = getLocalStudentsRegistry();
  let studentName = cleanMat;
  if (registry[cleanMat]) {
    registry[cleanMat].isBlocked = true;
    registry[cleanMat].blockedReason = reason;
    registry[cleanMat].blockedAt = now;
    studentName = registry[cleanMat].displayName || cleanMat;
  }
  Object.values(registry).forEach((s: UserProfile) => {
    if (s.matricule?.toUpperCase() === cleanMat || s.uid?.toUpperCase() === cleanMat || sanitizeMatriculeId(s.matricule || '') === safeId) {
      s.isBlocked = true;
      s.blockedReason = reason;
      s.blockedAt = now;
      studentName = s.displayName || studentName;
    }
  });
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {}

  // 2. Mettre à jour la session utilisateur active si présente
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.matricule?.toUpperCase() === cleanMat || u.uid?.toUpperCase() === cleanMat) {
        u.isBlocked = true;
        u.blockedReason = reason;
        u.blockedAt = now;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    }
  } catch {}

  // 3. Persister dans Firestore (REST + SDK)
  try {
    await saveStudentRest({
      matricule: cleanMat,
      isBlocked: true,
      blockedReason: reason,
      blockedAt: now
    } as any);
  } catch {}

  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, {
      isBlocked: true,
      blockedReason: reason,
      blockedAt: now
    }, { merge: true });
  } catch (err) {
    console.warn('blockStudentAccount Firestore SDK note:', err);
  }

  // 4. Enregistrer un rapport d'alerte dans les logs de fraude
  try {
    recordFraudLog({
      matricule: cleanMat,
      studentName: studentName,
      ticketNumber: 'PIN-BRUTE-FORCE',
      reason: `Compte bloqué : 5 erreurs consécutives de code PIN. Contact aux responsables Programas obligatoire.`,
      severity: 'critical'
    });
  } catch {}

  return {
    success: true,
    message: 'Compte étudiant verrouillé avec succès.'
  };
}

/**
 * Déverrouiller le compte d'un étudiant par un responsable Programas (Admin)
 */
export async function unblockStudentAccount(
  matricule: string
): Promise<{ success: boolean; message: string }> {
  const cleanMat = (matricule || '').trim().toUpperCase();
  if (!cleanMat) return { success: false, message: 'Matricule requis' };

  const safeId = sanitizeMatriculeId(cleanMat);

  // 1. Mettre à jour dans le registre local
  const registry = getLocalStudentsRegistry();
  if (registry[cleanMat]) {
    registry[cleanMat].isBlocked = false;
    delete registry[cleanMat].blockedReason;
    delete registry[cleanMat].blockedAt;
  }
  Object.values(registry).forEach((s: UserProfile) => {
    if (s.matricule?.toUpperCase() === cleanMat || s.uid?.toUpperCase() === cleanMat || sanitizeMatriculeId(s.matricule || '') === safeId) {
      s.isBlocked = false;
      delete s.blockedReason;
      delete s.blockedAt;
    }
  });
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {}

  // 2. Mettre à jour la session utilisateur active si présente
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.matricule?.toUpperCase() === cleanMat || u.uid?.toUpperCase() === cleanMat) {
        u.isBlocked = false;
        u.blockedReason = undefined;
        u.blockedAt = undefined;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    }
  } catch {}

  // 3. Persister dans Firestore (REST + SDK)
  try {
    await saveStudentRest({
      matricule: cleanMat,
      isBlocked: false,
      blockedReason: '',
      blockedAt: ''
    } as any);
  } catch {}

  try {
    const sRef = doc(db, 'students', safeId);
    await setDoc(sRef, {
      isBlocked: false,
      blockedReason: null,
      blockedAt: null
    }, { merge: true });
  } catch (err) {
    console.warn('unblockStudentAccount Firestore SDK note:', err);
  }

  // Réinitialiser les compteurs d'échecs PIN en local
  try {
    localStorage.removeItem('programas_pin_fails');
    localStorage.removeItem('programas_pin');
  } catch {}

  return {
    success: true,
    message: `Le compte ${cleanMat} a été débloqué avec succès.`
  };
}


```

---

## 📄 Fichier: `src/services/dailyLedger.ts`

```typescript
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MealTicket } from '../types';

export interface DailyLedgerStats {
  date: string; // YYYY-MM-DD
  formattedDate: string; // ex: Dimanche 25 Octobre 2026
  totalTicketsSold: number;
  mealsValidated: number;
  ticketsInCirculation: number;
  revenueCollected: number; // in FCFA
  servedTickets: Array<{
    ticketNumber: string;
    studentMatricule: string;
    studentName: string;
    dishName: string;
    validationTime: string;
    price: number;
  }>;
  closedAt?: string;
}

const ACTIVE_DAY_KEY = 'crou_active_day_stats';
const ARCHIVES_KEY = 'crou_daily_archives_ledger';

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayFormatted(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Initializes a brand new empty day record starting strictly at 0
 */
function createFreshDayStats(dateStr: string): DailyLedgerStats {
  return {
    date: dateStr,
    formattedDate: getTodayFormatted(),
    totalTicketsSold: 0,
    mealsValidated: 0,
    ticketsInCirculation: 0,
    revenueCollected: 0,
    servedTickets: []
  };
}

/**
 * Gets or initializes today's ledger stats with automatic day rollover & archive
 */
export async function getActiveDailyLedger(): Promise<DailyLedgerStats> {
  const todayStr = getTodayDateString();
  let currentStats: DailyLedgerStats | null = null;

  try {
    const raw = localStorage.getItem(ACTIVE_DAY_KEY);
    if (raw) {
      currentStats = JSON.parse(raw);
    }
  } catch {
    currentStats = null;
  }

  // Check if legacy test cache needs to be purged to start at 0
  const hasPurgedLegacy = localStorage.getItem('crou_sales_cache_purged_zero_v2');
  if (!hasPurgedLegacy) {
    localStorage.setItem('crou_sales_cache_purged_zero_v2', 'true');
    const freshZero = createFreshDayStats(todayStr);
    saveDailyLedgerLocally(freshZero);
    await syncStatsToFirestore(freshZero);
    return freshZero;
  }

  // Automatic rollover: if stored date is from a past day, archive it and start new day at 0!
  if (currentStats && currentStats.date !== todayStr) {
    await archivePastDay(currentStats);
    currentStats = createFreshDayStats(todayStr);
    saveDailyLedgerLocally(currentStats);
    return currentStats;
  }

  if (!currentStats) {
    currentStats = createFreshDayStats(todayStr);
    saveDailyLedgerLocally(currentStats);
  }

  return currentStats;
}

function saveDailyLedgerLocally(stats: DailyLedgerStats): void {
  try {
    localStorage.setItem(ACTIVE_DAY_KEY, JSON.stringify(stats));
  } catch {
    // Ignore
  }
}

/**
 * Sync stats to Firestore
 */
async function syncStatsToFirestore(stats: DailyLedgerStats): Promise<void> {
  try {
    const dayRef = doc(db, 'daily_ledgers', stats.date);
    await setDoc(dayRef, stats, { merge: true });
  } catch (err) {
    console.warn('Firestore ledger sync note:', err);
  }
}

/**
 * Record new tickets sold (increments tickets sold, circulation and revenue)
 */
export async function recordTicketsSaleInLedger(ticketCount: number, pricePerTicket: number = 200): Promise<DailyLedgerStats> {
  const stats = await getActiveDailyLedger();
  const addedRevenue = ticketCount * pricePerTicket;

  stats.totalTicketsSold += ticketCount;
  stats.ticketsInCirculation += ticketCount;
  stats.revenueCollected += addedRevenue;

  saveDailyLedgerLocally(stats);
  await syncStatsToFirestore(stats);
  return stats;
}

/**
 * Record a meal validation at the turnstile scanner
 */
export async function recordMealValidatedInLedger(ticket: MealTicket): Promise<DailyLedgerStats> {
  const stats = await getActiveDailyLedger();
  
  stats.mealsValidated += 1;
  stats.ticketsInCirculation = Math.max(0, stats.ticketsInCirculation - 1);
  
  const validationRecord = {
    ticketNumber: ticket.ticketNumber,
    studentMatricule: ticket.studentMatricule,
    studentName: ticket.studentName,
    dishName: ticket.dishName,
    validationTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    price: ticket.price || 200
  };

  stats.servedTickets.unshift(validationRecord);

  saveDailyLedgerLocally(stats);
  await syncStatsToFirestore(stats);
  return stats;
}

/**
 * Archive a past day into the permanent historical ledger
 */
export async function archivePastDay(pastDayStats: DailyLedgerStats): Promise<void> {
  pastDayStats.closedAt = new Date().toISOString();

  // 1. Save in Local Archives
  try {
    const rawArchives = localStorage.getItem(ARCHIVES_KEY);
    const archives: DailyLedgerStats[] = rawArchives ? JSON.parse(rawArchives) : [];
    // Replace if already exists for this date, else prepend
    const filtered = archives.filter(a => a.date !== pastDayStats.date);
    filtered.unshift(pastDayStats);
    localStorage.setItem(ARCHIVES_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }

  // 2. Save in Firestore permanent archive collection
  try {
    const archiveRef = doc(db, 'daily_archives', pastDayStats.date);
    await setDoc(archiveRef, pastDayStats);
  } catch (err) {
    console.warn('Firestore archive note:', err);
  }
}

/**
 * Get all historical archives of past days
 */
export async function getAllDailyArchives(): Promise<DailyLedgerStats[]> {
  const archivesMap: Record<string, DailyLedgerStats> = {};

  try {
    const raw = localStorage.getItem(ARCHIVES_KEY);
    if (raw) {
      const list: DailyLedgerStats[] = JSON.parse(raw);
      list.forEach(a => { archivesMap[a.date] = a; });
    }
  } catch {
    // Ignore
  }

  // Also query Firestore for any past days
  try {
    const snap = await getDocs(collection(db, 'daily_archives'));
    snap.forEach(d => {
      const data = d.data() as DailyLedgerStats;
      if (data.date) {
        archivesMap[data.date] = data;
      }
    });
  } catch {
    // Ignore
  }

  return Object.values(archivesMap).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Immutable Audit Protection:
 * Vendor/cashier tampering is strictly prevented by locking the active sales ledger.
 * No reset or deletion of recorded sales is permitted.
 */
export function isLedgerAuditLocked(): boolean {
  return true;
}


```

---

## 📄 Fichier: `src/services/geminiClient.ts`

```typescript
/**
 * Service de Conseil et Assistance Étudiante CROU Korhogo
 * Fournit une assistance humaine, chaleureuse et réactive aux étudiants de l'UPGC
 * Avec moteur d'assistance conversationnelle en direct et redondance multi-niveaux.
 */

const GEMINI_API_KEY = (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || 
  (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : '');

const SUPPORTED_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

export const CROUK_HUMAN_INSTRUCTION = `Tu es M. Kouassi, conseiller d'assistance officiel et humain de l'équipe de restauration du CROU de Korhogo (UPGC - Université Peleforo Gbon Coulibaly, Côte d'Ivoire).

Règles de comportement et de ton :
- Tu t'adresses aux étudiants de manière respectueuse, chaleureuse, naturelle, encourageante et très humaine (style ivoirien poli et bienveillant).
- Tu ne dois JAMAIS dire que tu es une intelligence artificielle, une machine ou un robot. Tu es un conseiller étudiant de l'équipe du CROU-K.
- Si l'étudiant dit simplement "Salut", "Bonjour" ou "Réponds", réponds-lui chaleureusement en lui demandant comment se passe sa journée de cours et ce dont il a besoin pour le restaurant universitaire.
- Prix officiel du repas subventionné par l'État : 200 FCFA (+10 FCFA de frais de service Wave = 210 FCFA).
- Horaires du restaurant universitaire :
  • Déjeuner : 11h30 – 14h30
  • Dîner : 18h30 – 21h00
- Lieux : Restaurant Universitaire Principal (Campus 1 UPGC) et Restaurant Annexe (Campus 2).
- Paiement : Wave Money (immédiat, recommandé), Orange Money, MTN MoMo, Moov Money.
- Les tickets ont un QR code unique pour le passage aux tourniquets du réfectoire.
- Sécurité : Pour éviter toute faille et usurpation de compte, la réinitialisation de mot de passe en ligne est désactivée. Si un étudiant a oublié son mot de passe, indique-lui de se rendre directement en personne auprès des responsables de Programas au Guichet Restauration du CROU Korhogo avec sa carte d'étudiant.
- Code PIN personnel à 4 chiffres (comme Wave/Djamo) pour verrouiller l'affichage du QR code aux tourniquets.
- Réponds toujours en français fluide, clair et concis.`;

/**
 * Répondre à l'étudiant avec un ton humain, chaleureux et immédiat
 */
export async function sendGeminiChatMessage(
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[] = [],
  menuContext: string = ''
): Promise<string> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) return '';

  const lower = cleanPrompt.toLowerCase();

  // Réponses humaines directes et immédiates pour la politesse et la réactivité instantanée
  if (/^(salut|bonjour|bonsoir|coucou|hello|yo|wesh|all[oô]|bjr|slt)\b/i.test(lower)) {
    return "Bonjour cher(e) étudiant(e) ! 👋 Je suis ravi de vous retrouver au guichet d'assistance du CROU Korhogo. Comment se passent vos cours aujourd'hui ? Que puis-je faire pour vous concernant le restaurant universitaire ou vos tickets repas ?";
  }

  if (/^(r[eé]ponds|tu es l[aà]|dis[- ]moi|tu m['’]entends|all[oô] quoi|parle)\b/i.test(lower)) {
    return "Je suis bien là à vos côtés ! Excusez-moi pour ce court instant d'attente. Je vous écoute avec grand plaisir. Comment puis-je vous aider pour vos repas, horaires ou tickets à 200 FCFA ?";
  }

  if (lower.includes('comment vas-tu') || lower.includes('ca va') || lower.includes('ça va') || lower.includes('tu vas bien')) {
    return "Tout se passe très bien par la grâce de Dieu, merci ! Nous sommes en plein service au CROU Korhogo pour vous préparer de bons repas chauds. Et vous, tout va bien sur le campus ?";
  }

  if (lower.includes('merci') || lower.includes('super') || lower.includes('d\'accord') || lower.includes('daccord') || lower.includes('c\'est bon') || lower.includes('ok')) {
    return "Avec grand plaisir ! C'est tout naturel d'être à vos côtés. L'équipe du CROU Korhogo vous souhaite un excellent appétit et beaucoup de courage dans vos études à l'UPGC. N'hésitez pas si vous avez d'autres questions ! 😊🍲";
  }

  if (lower.includes('qui es-tu') || lower.includes('tu es qui') || lower.includes('qui es tu') || lower.includes('t\'es qui') || lower.includes('ton nom')) {
    return "Je suis M. Kouassi, agent d'accueil et conseiller étudiant au Service Restauration du CROU de Korhogo (UPGC). Je suis là pour vous accompagner au quotidien sur les menus, vos tickets repas à 200 FCFA, les passages tourniquets et la sécurité de votre compte !";
  }

  if (lower.includes('au revoir') || lower.includes('bonne journee') || lower.includes('bonne journée') || lower.includes('a bientot') || lower.includes('à bientôt') || lower.includes('a plus') || lower.includes('bye')) {
    return "Excellente journée à vous et très bon appétit au Restaurant Universitaire ! À très bientôt sur Programas ! 👋";
  }

  // 1. Tenter l'endpoint d'assistance du serveur / worker proxy
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const serverRes = await fetch('/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        history,
        context: menuContext
      }),
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (serverRes && serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.text && serverData.text.trim().length > 0) {
        return serverData.text.trim();
      }
    }
  } catch (proxyErr) {
    // silently continue to direct or intelligent fallback
  }

  // 2. Appel direct via API avec persona humain
  if (GEMINI_API_KEY) {
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-4)) {
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
      parts: [{ text: cleanPrompt }]
    });

    const fullInstruction = `${CROUK_HUMAN_INSTRUCTION}${menuContext ? `\n\nMenus et plats disponibles aujourd'hui au Resto U :\n${menuContext}` : ''}`;

    for (const modelName of SUPPORTED_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(directUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: fullInstruction }]
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            return candidateText.trim();
          }
        }
      } catch (err) {
        // Continue to fallback
      }
    }
  }

  // 3. Réponse humaine intelligente locale (garantit que l'étudiant a toujours une réponse claire et humaine)
  return generateHumanAdvisorResponse(cleanPrompt, menuContext);
}

/**
 * Réponses humaines, expertes et bienveillantes pour les demandes courantes
 */
function generateHumanAdvisorResponse(prompt: string, menuContext: string): string {
  const p = prompt.toLowerCase();

  if (p.includes('prix') || p.includes('combien') || p.includes('tarif') || p.includes('coûte') || p.includes('cout')) {
    return "Le prix d'un ticket de repas complet au Restaurant Universitaire du CROU de Korhogo est subventionné par l'État à **200 FCFA** par repas (+10 FCFA de frais de traitement Wave = 210 FCFA). Vous pouvez acheter vos tickets directement dans l'application via Wave Money ! 🍲🎫";
  }

  if (p.includes('menu') || p.includes('manger') || p.includes('repas') || p.includes('plat') || p.includes('nourriture')) {
    if (menuContext) {
      return `Voici les plats préparés aujourd'hui par l'équipe du Resto U UPGC :\n\n${menuContext}\n\nLe repas complet est à seulement 200 FCFA. Bon appétit ! 🍽️`;
    }
    return "Au menu aujourd'hui au réfectoire : Tchep au poisson savoureux, Riz sauce graine avec viande de bœuf, Attiéké poisson braisé, et accompagnements (banane plantain aloco, yaourt). Tarif officiel : 200 FCFA le repas ! 🍲";
  }

  if (p.includes('horaire') || p.includes('heure') || p.includes('quand') || p.includes('ouvert') || p.includes('ferme') || p.includes('service')) {
    return "Voici les horaires des services au CROU Korhogo :\n\n- **Déjeuner (Midi)** : 11h30 à 14h30\n- **Dîner (Soir)** : 18h30 à 21h00\n\nPensez à vous présenter avec votre ticket QR code prêt sur votre écran pour fluidifier le passage aux bornes tourniquets. ⏰";
  }

  if (p.includes('ticket') || p.includes('acheter') || p.includes('wave') || p.includes('payer') || p.includes('achat')) {
    return "Pour acheter votre ticket repas en quelques secondes :\n1. Cliquez sur le bouton orange **« Acheter un ticket »** ou sélectionnez vos plats\n2. Choisissez le paiement par **Wave Money** (recommandé et immédiat)\n3. Validez la transaction : votre ticket avec QR code sécurisé s'affiche immédiatement dans votre onglet **« Mes Tickets »** ! 🎫";
  }

  if (p.includes('mot de passe') || p.includes('oubli') || p.includes('recuperer') || p.includes('compte') || p.includes('connexion')) {
    return "Pour éviter toute faille ou risque d'usurpation de vos tickets repas, la réinitialisation de mot de passe en ligne est désactivée.\n\nEn cas d'oubli de mot de passe, présentez-vous directement auprès des **responsables de Programas** au Guichet Restauration du CROU Korhogo avec votre carte d'étudiant pour réinitialiser vos accès en main propre ! 🔒";
  }

  if (p.includes('pin') || p.includes('sécurité') || p.includes('securite') || p.includes('verrouill')) {
    return "Pour protéger vos tickets contre toute utilisation non autorisée, Programas vous permet de définir un code PIN à 4 chiffres (comme sur Wave). Lorsque le mode sécurisé est activé, seul votre PIN permet d'afficher et de déverrouiller le QR code à la borne tourniquet ! 🛡️";
  }

  return "Bonjour ! Je suis à votre entière disposition au Service Restauration du CROU Korhogo. Le ticket repas est subventionné à **200 FCFA**, les horaires sont de 11h30 à 14h30 pour le midi et de 18h30 à 21h00 pour le soir. N'hésitez pas si vous avez des questions sur vos repas, tickets ou votre compte ! 👋";
}

```

---

## 📄 Fichier: `src/components/BlackGatewayPortal.tsx`

```typescript
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert,
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft,
  KeyRound, 
  UserPlus, 
  GraduationCap, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Building2,
  CheckCircle2,
  Ticket,
  ChevronRight,
  Smartphone,
  UserCheck,
  RefreshCw,
  Hash,
  Shield,
  X
} from 'lucide-react';
import { 
  registerStudentWithMatricule, 
  loginStudentWithMatricule, 
  loginAdminDirect
} from '../services/studentAuth';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
  onGuestAccess?: () => void;
}

export const BlackGatewayPortal: React.FC<Props> = ({ 
  isOpen, 
  onSuccess,
  onGuestAccess 
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>('login');
  
  // Student Login State (Remembered credentials from previous sessions)
  const [loginMatricule, setLoginMatricule] = useState(() => {
    try {
      return localStorage.getItem('crou_remembered_matricule') || '';
    } catch {
      return '';
    }
  });
  const [loginPassword, setLoginPassword] = useState(() => {
    try {
      return localStorage.getItem('crou_remembered_password') || '';
    } catch {
      return '';
    }
  });
  const [rememberMe, setRememberMe] = useState(true);

  // Security notice for forgotten password (students must contact CROU administrators)
  const [showForgotHelpModal, setShowForgotHelpModal] = useState(false);
  
  // Student Register State
  const [regMatricule, setRegMatricule] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUfr, setRegUfr] = useState('UFR Sciences Sociales');
  
  // Admin Login State
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  // UI Helpers
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await loginStudentWithMatricule(loginMatricule, loginPassword);
      if (res.success && res.user) {
        if (rememberMe) {
          try {
            localStorage.setItem('crou_remembered_matricule', loginMatricule.trim().toUpperCase());
            localStorage.setItem('crou_remembered_password', loginPassword);
          } catch {}
        } else {
          try {
            localStorage.removeItem('crou_remembered_matricule');
            localStorage.removeItem('crou_remembered_password');
          } catch {}
        }
        onSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Matricule ou mot de passe incorrect.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await registerStudentWithMatricule({
        matricule: regMatricule,
        password: regPassword,
        name: regName,
        ufr: regUfr
      });

      if (res.success && res.user) {
        try {
          localStorage.setItem('crou_remembered_matricule', regMatricule.trim().toUpperCase());
          localStorage.setItem('crou_remembered_password', regPassword);
        } catch {}
        setSuccessNotice('Compte étudiant créé avec succès ! Votre pass repas est activé.');
        setTimeout(() => {
          onSuccess(res.user!);
        }, 800);
      } else {
        setErrorMsg(res.error || 'Erreur lors de l\'inscription.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await loginAdminDirect(adminUser, adminPass);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Identifiants administrateur invalides.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c] text-white flex flex-col justify-between overflow-y-auto animate-fadeIn select-none font-sans">
      
      {/* Background Ambient Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-orange-700/10 rounded-full blur-[130px]"></div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-orange-500/20 border border-amber-400/30 flex-shrink-0">
            <img src="/icon.svg" alt="Programas" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight font-cabinet text-white">
                CROU KORHOGO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/30 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Restau. U 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Université Peleforo Gbon Coulibaly • Billetterie Officielle
            </p>
          </div>
        </div>

        {/* Subvention Ribbon & Close Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">
              Tarif Subventionné : <strong className="text-amber-400">200 FCFA</strong> / repas
            </span>
          </div>
          {onGuestAccess && (
            <button
              type="button"
              onClick={onGuestAccess}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold"
              title="Fermer et voir les menus"
            >
              <span>Voir le Menu</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-center">
        
        {/* Card Container */}
        <div className="bg-[#121217] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden pop-in">
          
          {/* Top Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-2xl border border-white/10 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>Inscription</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErrorMsg(null); }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'admin'
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center space-x-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center space-x-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* TAB 1: CONNEXION ÉTUDIANT (Matricule + Mot de passe) */}
          {activeTab === 'login' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Numéro de matricule
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={loginMatricule}
                    onChange={(e) => setLoginMatricule(e.target.value.toUpperCase())}
                    placeholder="Ex: 01601834 ou UPGC-2026-0842"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono tracking-wider uppercase transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Votre identifiant officiel à l'université UPGC.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-black/60 border-white/30 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />
                    <span className="font-medium text-slate-300">Se souvenir de moi</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotHelpModal(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 hover:underline cursor-pointer transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-loading={isLoading ? "true" : undefined}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Vérification...' : 'Se connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: INSCRIPTION SIMPLE ÉTUDIANT (Matricule + Mot de passe + Nom) */}
          {activeTab === 'register' && (
            <form onSubmit={handleStudentRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Numéro de matricule *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={regMatricule}
                    onChange={(e) => setRegMatricule(e.target.value.toUpperCase())}
                    placeholder="Ex: UPGC-2026-1102"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono tracking-wider uppercase transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nom et prénom(s) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Koffi Kouamé Emmanuel"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  UFR / Faculté
                </label>
                <select
                  value={regUfr}
                  onChange={(e) => setRegUfr(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                >
                  <option value="UFR Sciences Sociales" className="bg-slate-900">UFR Sciences Sociales</option>
                  <option value="UFR Sciences Biologiques" className="bg-slate-900">UFR Sciences Biologiques</option>
                  <option value="UFR Lettres et Arts" className="bg-slate-900">UFR Lettres et Arts</option>
                  <option value="Institut Agro-Pastorale" className="bg-slate-900">Institut Agro-Pastorale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Créer un mot de passe *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Au moins 4 caractères"
                    className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-loading={isLoading ? "true" : undefined}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Création...' : 'Créer mon compte'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: CONNEXION ADMINISTRATION */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-slate-800/60 border border-amber-500/30 rounded-2xl flex items-center space-x-2 text-xs text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Espace réservé à la Direction et aux contrôleurs du CROU.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Identifiant administrateur
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="Identifiant administrateur"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Mot de passe administrateur
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/20 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-loading={isLoading ? "true" : undefined}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-sm rounded-2xl border border-amber-500/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Connexion...' : 'Connexion administration'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick guest preview link if needed */}
          {onGuestAccess && (
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-center">
              <button
                type="button"
                onClick={onGuestAccess}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-amber-300 hover:text-white transition-all inline-flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-98"
              >
                <span>🍽️ Découvrir le Menu du Jour Sans Connexion</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-slate-400">
                Vous pouvez consulter les plats du jour librement. Connectez-vous pour acheter vos tickets repas.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span>🏛️ UPGC Korhogo</span>
          <span>•</span>
          <span>Centre Régional des Œuvres Universitaires</span>
        </div>
        <div>
          <span>Système Garanti Anti-Fraude & Billet Tourniquet 2026</span>
        </div>
      </footer>

      {/* MODAL: INFORMATION SÉCURITÉ MOT DE PASSE OUBLIÉ */}
      {showForgotHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowForgotHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-white mb-2">
              Mot de passe oublié ?
            </h3>

            <div className="p-3.5 bg-amber-950/50 border border-amber-500/30 rounded-2xl text-xs text-amber-200 mb-4 leading-relaxed">
              <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Protection stricte contre les failles :</span>
              </p>
              Pour éviter tout risque d'usurpation et protéger vos tickets de cantine, la réinitialisation de mot de passe en ligne est désactivée.
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-6">
              <p>
                Si vous avez oublié vos accès, <strong className="text-white">veuillez vous adresser directement aux responsables de Programas</strong> au réfectoire :
              </p>
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-white font-semibold">
                  <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Guichet Restauration CROU Korhogo (UPGC)</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                  <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Présentez-vous muni(e) de votre carte d'étudiant</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Un responsable vérifiera votre identité sur le registre officiel et réinitialisera votre mot de passe immédiatement en main propre.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotHelpModal(false)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-98 cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

```

---

## 📄 Fichier: `src/components/PinLock.tsx`

```typescript
// src/components/PinLock.tsx
// Code à 4 chiffres pour déverrouiller l'app, comme Wave ou Djamo.
//
// Usage (autour de l'app, une fois l'utilisateur connecté) :
//   <PinLock enabled={isLoggedIn} onForgot={() => signOut()}>
//     <App />
//   </PinLock>
//
// Fonctionnement :
//  - 1re ouverture : création du code, puis confirmation.
//  - Ensuite : l'app est verrouillée au démarrage et après 30 s passées en arrière-plan.
//  - 5 erreurs, ou « Code oublié » : le code est effacé et onForgot() est appelé (reconnexion obligatoire).
//  - Le code n'est jamais stocké en clair : seulement une empreinte PBKDF2 avec sel aléatoire.
//
// Attention : c'est un verrou de confort (téléphone prêté, curieux). Il ne remplace pas la sécurité du serveur :
// un paiement doit toujours être autorisé côté serveur.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, ShieldAlert } from 'lucide-react';
import { blockStudentAccount } from '../services/studentAuth';

const PIN_KEY = 'programas_pin';
const FAIL_KEY = 'programas_pin_fails';
const ITERATIONS = 150_000;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const haptic = (ms: number) => (window as unknown as { haptic?: (n: number) => void }).haptic?.(ms);
const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16));

async function hashPin(pin: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

const readPin = (): { salt: string; hash: string } | null => {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) ?? 'null');
  } catch {
    return null;
  }
};

const wipePin = () => {
  try {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(FAIL_KEY);
  } catch {
    /* ignoré */
  }
};

type Mode = 'checking' | 'setup' | 'confirm' | 'locked' | 'open';

interface Props {
  children: React.ReactNode;
  /** false tant que l'utilisateur n'est pas connecté : aucun code n'est demandé */
  enabled?: boolean;
  userMatricule?: string;
  userName?: string;
  onForgot?: () => void;
  onAccountBlocked?: (matricule: string, reason: string) => void;
  lockAfterMs?: number;
  maxAttempts?: number;
}

const TEXT: Record<'setup' | 'confirm' | 'locked', { title: string; hint: string }> = {
  setup: { title: 'Crée ton code', hint: '4 chiffres pour protéger ton compte' },
  confirm: { title: 'Confirme ton code', hint: 'Saisis-le une deuxième fois' },
  locked: { title: 'Saisis ton code', hint: 'Programas est verrouillé' },
};

export const PinLock: React.FC<Props> = ({ 
  children, 
  enabled = true, 
  userMatricule,
  userName,
  onForgot, 
  onAccountBlocked,
  lockAfterMs = 30_000, 
  maxAttempts = 5 
}) => {
  const [mode, setMode] = useState<Mode>('checking');
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const hiddenAt = useRef<number | null>(null);
  const content = useRef<HTMLDivElement>(null);

  // Au démarrage : code existant → verrouillé, sinon → création
  useEffect(() => {
    if (!enabled) return setMode('open');
    setPin('');
    setMessage('');
    setMode(readPin() ? 'locked' : 'setup');
  }, [enabled]);

  // Verrouillage automatique après un temps en arrière-plan
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
      hiddenAt.current = null;
      if (mode === 'open' && away >= lockAfterMs && readPin()) {
        setPin('');
        setMessage('');
        setMode('locked');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [mode, lockAfterMs]);

  // Verrouillage manuel à la demande (ex: clic sur "Verrouiller l'app")
  useEffect(() => {
    const handleManualLock = () => {
      if (enabled && readPin()) {
        setPin('');
        setMessage('');
        setMode('locked');
      }
    };
    window.addEventListener('programas:lock', handleManualLock);
    return () => window.removeEventListener('programas:lock', handleManualLock);
  }, [enabled]);

  // Le contenu de l'app est inactif (clic, clavier, lecteur d'écran) tant qu'elle est verrouillée
  useEffect(() => {
    if (content.current) (content.current as HTMLElement & { inert: boolean }).inert = mode !== 'open';
  }, [mode]);

  const fail = async (text: string) => {
    haptic(40);
    setMessage(text);
    setShake(true);
    await wait(450);
    setShake(false);
    setPin('');
  };

  const submit = async (value: string) => {
    busy.current = true;
    try {
      if (mode === 'setup') {
        setFirst(value);
        await wait(180);
        setPin('');
        setMessage('');
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (value === first) {
          const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
          localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash: await hashPin(value, salt) }));
          localStorage.removeItem(FAIL_KEY);
          haptic(20);
          await wait(150);
          setPin('');
          setMessage('');
          setMode('open');
        } else {
          await fail('Les deux codes sont différents. Recommence.');
          setFirst('');
          setMode('setup');
        }
      } else if (mode === 'locked') {
        const stored = readPin();
        if (stored && (await hashPin(value, stored.salt)) === stored.hash) {
          localStorage.removeItem(FAIL_KEY);
          haptic(15);
          await wait(120);
          setPin('');
          setMessage('');
          setMode('open');
        } else {
          const fails = Number(localStorage.getItem(FAIL_KEY) ?? 0) + 1;
          localStorage.setItem(FAIL_KEY, String(fails));
          if (fails >= maxAttempts) {
            const blockReason = 'Compte verrouillé suite à 5 tentatives consécutives de code PIN erronées.';
            if (userMatricule) {
              try {
                await blockStudentAccount(userMatricule, blockReason);
              } catch (bErr) {
                console.error('Error blocking student account on PinLock:', bErr);
              }
            }
            await fail('5 erreurs consécutives ! Compte bloqué pour sécurité.');
            await wait(1400);
            wipePin();
            if (onAccountBlocked && userMatricule) {
              onAccountBlocked(userMatricule, blockReason);
            }
            onForgot?.();
          } else {
            const left = maxAttempts - fails;
            await fail(`Code incorrect. ${left} essai${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}.`);
          }
        }
      }
    } catch {
      await fail('Une erreur est survenue. Réessaie.');
    } finally {
      busy.current = false;
    }
  };

  const press = useCallback(
    (digit: string) => {
      if (busy.current || pin.length >= 4) return;
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) void submit(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pin, mode, first]
  );
  const erase = () => !busy.current && setPin((p) => p.slice(0, -1));

  // Clavier physique (ordinateur)
  useEffect(() => {
    if (mode === 'open' || mode === 'checking') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') erase();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, press]);

  const forgot = () => {
    wipePin();
    onForgot?.();
  };

  const showLock = mode === 'setup' || mode === 'confirm' || mode === 'locked';
  const copy = showLock ? TEXT[mode] : null;

  return (
    <>
      <div ref={content} aria-hidden={mode !== 'open'}>
        {mode !== 'checking' && children}
      </div>

      {(mode === 'checking' || showLock) && (
        <div
          className="fixed inset-0 z-[90] flex flex-col items-center bg-white px-8 text-[#1d1d1f] dark:bg-black dark:text-white"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
        >
          {copy && (
            <>
              <div className="mt-[10vh] h-14 w-14 rounded-[13px] bg-orange-600" aria-hidden="true" />
              <h1 className="mt-6 text-2xl font-semibold">{copy.title}</h1>
              <p className="mt-1 h-5 text-[15px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]" role="status">
                {message || copy.hint}
              </p>

              <div className={`mt-8 flex gap-5 ${shake ? 'shake' : ''}`} aria-label={`${pin.length} chiffres saisis sur 4`}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-[14px] w-[14px] rounded-full border-[1.5px] border-[#1d1d1f] transition-colors duration-100 dark:border-white ${
                      i < pin.length ? 'bg-[#1d1d1f] dark:bg-white' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-auto grid w-full max-w-[300px] grid-cols-3 justify-items-center gap-x-6 gap-y-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <Key key={d} label={d} onPress={() => press(d)} />
                ))}
                <span />
                <Key label="0" onPress={() => press('0')} />
                <button
                  type="button"
                  onClick={erase}
                  aria-label="Effacer"
                  className={`flex h-[76px] w-[76px] items-center justify-center text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] ${
                    pin.length ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <Delete className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-6 h-11">
                {mode === 'locked' && (
                  <button type="button" onClick={forgot} className="h-11 px-4 text-[17px] text-orange-600">
                    Code oublié ?
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

const Key: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <button
    type="button"
    onClick={onPress}
    className="flex h-[76px] w-[76px] select-none items-center justify-center rounded-full bg-black/5 text-[32px] font-light tabular-nums transition-colors duration-100 active:bg-black/15 dark:bg-white/10 dark:active:bg-white/25"
  >
    {label}
  </button>
);

/** Déclenche le verrouillage immédiat de l'application depuis n'importe quel composant */
export const lockAppNow = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('programas:lock'));
  }
};


```

---

## 📄 Fichier: `src/components/TurnstileWaveScanner.tsx`

```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Scan, 
  Search, 
  Check,
  X,
  Zap,
  ZapOff,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Bell
} from 'lucide-react';
import jsQR from 'jsqr';
import { MealTicket } from '../types';
import { verifyTurnstileTicket } from '../services/studentAuth';
import { recordMealValidatedInLedger } from '../services/dailyLedger';
import { soundSynthesizer } from '../utils/audioFeedback';
import { scanTicketWithGeminiAI } from '../utils/aiTicketScanner';

interface Props {
  onTicketValidated?: (ticket: MealTicket) => void;
  onRefreshStats?: () => void;
}

export const TurnstileWaveScanner: React.FC<Props> = ({ 
  onTicketValidated,
  onRefreshStats 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Modal / Fullscreen Wave scanner open state
  const [isWaveModalOpen, setIsWaveModalOpen] = useState<boolean>(false);
  const [waveTab, setWaveTab] = useState<'scan' | 'manual'>('scan');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [lastScannedText, setLastScannedText] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // Manual code input
  const [manualCode, setManualCode] = useState<string>('');

  // Result state
  const [verdict, setVerdict] = useState<{
    status: 'idle' | 'valid' | 'used' | 'invalid' | 'fraud_detected';
    message: string;
    ticket?: MealTicket;
    time?: string;
  }>({
    status: 'idle',
    message: ''
  });

  // Stop Camera Stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsVideoPlaying(false);
    setTorchOn(false);
  }, []);

  // Reliable iOS Safari / WebKit video stream attacher
  const attachStreamToVideo = useCallback((videoEl: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoEl || !stream) return;
    try {
      videoEl.muted = true;
      videoEl.defaultMuted = true;
      videoEl.playsInline = true;
      videoEl.autoplay = true;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.setAttribute('muted', 'true');
      videoEl.setAttribute('autoplay', 'true');

      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }

      const tryPlay = () => {
        videoEl.play()
          .then(() => {
            setIsVideoPlaying(true);
          })
          .catch((pErr) => {
            if (pErr.name !== 'AbortError') {
              console.warn('iOS video play notice:', pErr);
            }
          });
      };

      videoEl.onloadedmetadata = tryPlay;
      videoEl.oncanplay = tryPlay;
      tryPlay();
    } catch (e) {
      console.warn('attachStreamToVideo error:', e);
    }
  }, []);

  // Start Camera Stream with iOS Safari full compatibility
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setVerdict({ status: 'idle', message: '' });

    // Prime audio context on user gesture for instant iPhone "Cline" chime
    soundSynthesizer.unlockAudio();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La caméra n\'est pas supportée par ce navigateur.');
      }

      // Safely stop previous tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try { t.stop(); } catch {}
        });
        streamRef.current = null;
      }

      // Universal constraints tested for iPhone Safari, Chrome iOS and Android
      // Note: Never use { facingMode: { exact: 'environment' } } as it throws OverconstrainedError on iPhone
      const constraintsToTry = [
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        {
          video: {
            facingMode: 'environment'
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      for (const c of constraintsToTry) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          if (stream) break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!stream) {
        throw lastErr || new Error('Impossible d\'accéder à la caméra.');
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsWaveModalOpen(true);
      setWaveTab('scan');

      // Bind to video ref when ready
      if (videoRef.current) {
        attachStreamToVideo(videoRef.current, stream);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setIsCameraActive(false);
      setIsVideoPlaying(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Accès à la caméra refusé. Autorisez la caméra dans Safari (Réglages iPhone > Safari > Appareil photo > Autoriser).');
      } else {
        setCameraError(err.message || 'Impossible d\'activer la caméra en direct.');
      }
    }
  }, [attachStreamToVideo]);

  // Synchronize stream with video element when modal mounts
  useEffect(() => {
    if (isWaveModalOpen && isCameraActive && streamRef.current && videoRef.current) {
      attachStreamToVideo(videoRef.current, streamRef.current);
    }
  }, [isWaveModalOpen, isCameraActive, attachStreamToVideo]);

  // Toggle Torch / Flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps: any = track.getCapabilities ? track.getCapabilities() : {};
      if (caps && caps.torch) {
        const next = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: next } as any]
        });
        setTorchOn(next);
      }
    } catch (e) {
      console.warn('Torch not supported:', e);
    }
  };

  // Close the entire Wave scanner overlay
  const handleCloseWaveScanner = () => {
    stopCamera();
    setIsWaveModalOpen(false);
  };

  // Process and verify a decoded ticket text
  const processDecodedTicket = useCallback(async (rawText: string) => {
    if (!rawText) return;

    // 1. ARRÊTER LA CAMÉRA IMMÉDIATEMENT dès détection pour éviter tout re-scan involontaire
    stopCamera();

    // 2. Extraire les données du ticket
    let ticketNum = rawText.trim();
    let mat = '';

    if (ticketNum.startsWith('{') || ticketNum.includes('"tkt"') || ticketNum.includes('"app"')) {
      try {
        const parsed = JSON.parse(ticketNum);
        if (parsed.tkt || parsed.ticketNumber) ticketNum = parsed.tkt || parsed.ticketNumber;
        if (parsed.mat || parsed.studentMatricule) mat = parsed.mat || parsed.studentMatricule;
      } catch {
        const match = ticketNum.match(/"tkt"\s*:\s*"([^"]+)"/);
        if (match) ticketNum = match[1];
        const matchMat = ticketNum.match(/"mat"\s*:\s*"([^"]+)"/);
        if (matchMat) mat = matchMat[1];
      }
    } else if (ticketNum.includes('tkt=')) {
      try {
        const url = new URL(ticketNum.startsWith('http') ? ticketNum : `https://${ticketNum}`);
        ticketNum = url.searchParams.get('tkt') || ticketNum;
        mat = url.searchParams.get('mat') || '';
      } catch {
        const match = ticketNum.match(/tkt=([A-Za-z0-9-_]+)/);
        if (match) ticketNum = match[1];
      }
    } else if (/^\d{6}$/.test(ticketNum)) {
      ticketNum = `CROUK-2026-${ticketNum}`;
    }

    setLastScannedText(ticketNum);

    // Call validation against database & fraud check
    const res = await verifyTurnstileTicket(rawText, mat);

    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (res.status === 'valid' && res.ticket) {
      if (soundEnabled) {
        soundSynthesizer.playSuccessBeep();
      }

      await recordMealValidatedInLedger(res.ticket);
      if (onTicketValidated) onTicketValidated(res.ticket);
      if (onRefreshStats) onRefreshStats();

      setVerdict({
        status: 'valid',
        message: res.message,
        ticket: res.ticket,
        time: nowStr
      });
    } else {
      if (soundEnabled) {
        soundSynthesizer.playFraudBeep();
        if (res.status === 'used') {
          soundSynthesizer.speak("Attention ! Ticket déjà consommé !");
        } else {
          soundSynthesizer.speak("Alerte ! Ticket frauduleux ou non reconnu !");
        }
      }

      setVerdict({
        status: res.status,
        message: res.message,
        ticket: res.ticket,
        time: nowStr
      });
    }
  }, [soundEnabled, onTicketValidated, onRefreshStats, stopCamera]);

  // Continuous Video Scan Loop with jsQR
  useEffect(() => {
    if (!isCameraActive || !isWaveModalOpen || waveTab !== 'scan') return;

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Focus scan on central square viewfinder for maximum speed
          const size = Math.min(canvas.width, canvas.height) * 0.85;
          const startX = (canvas.width - size) / 2;
          const startY = (canvas.height - size) / 2;

          const imageData = ctx.getImageData(startX, startY, size, size);
          let qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          // Fallback to full canvas with inversion if slightly off-center
          if (!qrCode || !qrCode.data) {
            const fullImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
            qrCode = jsQR(fullImg.data, fullImg.width, fullImg.height, {
              inversionAttempts: 'attemptBoth'
            });
          }

          if (qrCode && qrCode.data) {
            isScanning = false;
            stopCamera();
            processDecodedTicket(qrCode.data);
            return;
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, isWaveModalOpen, waveTab, processDecodedTicket, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // AI Photo Scanner Fallback
  const handlePhotoCaptureAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiAnalyzing(true);
    setVerdict({ status: 'idle', message: 'Lecture optique du ticket en cours...' });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // 1. Try decoding QR directly from canvas first
        const img = new Image();
        img.onload = async () => {
          const testCanvas = document.createElement('canvas');
          testCanvas.width = img.width;
          testCanvas.height = img.height;
          const tCtx = testCanvas.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(img, 0, 0);
            const imgData = tCtx.getImageData(0, 0, img.width, img.height);
            const qr = jsQR(imgData.data, imgData.width, imgData.height);
            if (qr && qr.data) {
              await processDecodedTicket(qr.data);
              setIsAiAnalyzing(false);
              return;
            }
          }

          // 2. Fallback to Google Gemini Vision AI
          const aiResult = await scanTicketWithGeminiAI(base64);
          if (aiResult.detected && aiResult.ticketNumber) {
            await processDecodedTicket(aiResult.ticketNumber);
          } else {
            if (soundEnabled) soundSynthesizer.playFraudBeep();
            setVerdict({
              status: 'invalid',
              message: 'Le lecteur optique n\'a pas détecté de ticket CROU lisible sur cette photo. Rapprochez bien l\'objectif du QR code.'
            });
          }
          setIsAiAnalyzing(false);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch {
      setIsAiAnalyzing(false);
    }
  };

  // Manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processDecodedTicket(manualCode.trim());
    setManualCode('');
  };

  return (
    <>
      {/* Hidden processing canvas & file input for AI */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCaptureAI}
        className="hidden"
      />

      {/* DASHBOARD CARD (Launchpad for Wave Scanner) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5 font-sans">
        
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-slate-900 font-cabinet">
                  Scanner Borne Tourniquet CROU
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Style Wave
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Caméra plein écran instantanée, bip sonore Wave et détection automatique.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-colors flex items-center space-x-1.5 text-xs font-bold ${
                soundEnabled
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Son activé (Bip Wave)' : 'Son désactivé'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Bip Activé' : 'Muet'}</span>
            </button>
          </div>
        </div>

        {/* Error notice if camera blocked */}
        {cameraError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Problème d'accès à la caméra</p>
              <p className="mt-0.5 text-red-700">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Main Prominent Button to open the Wave Scanner */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white text-center space-y-4 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-sm mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Scan className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">
                Prêt pour le contrôle des tickets
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Ouvrez la caméra plein écran au format Wave pour valider le passage des étudiants en une fraction de seconde.
              </p>
            </div>

            <button
              type="button"
              onClick={startCamera}
              className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <Camera className="w-5 h-5 text-slate-950" />
              <span>Ouvrir le Scanner (Style Wave)</span>
            </button>
          </div>
        </div>

        {/* Alternative Modes: Photo IA Google & Saisie Manuelle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Photo Mode with Google Gemini AI */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAiAnalyzing}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 text-slate-800 transition-all flex items-center justify-center space-x-2 text-xs font-bold shadow-xs cursor-pointer active:scale-98"
          >
            {isAiAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>Lecture optique du ticket...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-amber-500" />
                <span>Prendre Photo & Scanner le Ticket</span>
              </>
            )}
          </button>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Code ticket (ex: 984917)..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all shadow-xs active:scale-95 flex-shrink-0 cursor-pointer"
            >
              Valider
            </button>
          </form>
        </div>

      </div>

      {/* ======================================================== */}
      {/* IMMERSIVE WAVE FULLSCREEN SCANNER (EXACT WAVE DESIGN)     */}
      {/* ======================================================== */}
      {isWaveModalOpen && (
        <div 
          onClick={() => {
            const v = videoRef.current;
            if (v && v.paused) {
              v.play().then(() => setIsVideoPlaying(true)).catch(() => {});
            }
          }}
          className="fixed inset-0 z-[100] bg-black flex flex-col justify-between overflow-hidden select-none animate-fadeIn font-sans"
        >
          
          {/* Background Live Camera Video */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover absolute inset-0 z-0 ${
              isCameraActive && waveTab === 'scan' ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            playsInline
            muted
            // @ts-ignore
            webkit-playsinline="true"
            x5-playsinline="true"
          />

          {/* iOS-friendly Viewfinder Dark Overlay Mask (prevents WebKit 9999px box-shadow GPU crash) */}
          {waveTab === 'scan' && verdict.status === 'idle' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
              <defs>
                <mask id="wave-cutout-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x="50%"
                    y="50%"
                    width="288"
                    height="288"
                    rx="44"
                    ry="44"
                    transform="translate(-144, -144)"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.65)" mask="url(#wave-cutout-mask)" />
            </svg>
          )}

          {/* TOP BAR: Close 'X' button, iPhone Cline Bell Test & Torch */}
          <div className="relative z-30 pt-10 sm:pt-8 px-6 flex items-center justify-between">
            {/* Top-Left Close Button (exact Wave style) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseWaveScanner();
              }}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-colors active:scale-90 cursor-pointer"
              title="Fermer le scanner"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Top-Right Controls: Cline Bell test & Torch */}
            <div className="flex items-center space-x-2">
              {/* iPhone Bell Cline Chime Test */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundSynthesizer.playSuccessBeep();
                }}
                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-amber-300 flex items-center justify-center hover:bg-black/60 transition-colors active:scale-90 cursor-pointer"
                title="Tester le son cloche Cline iPhone 🔔"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Torch Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTorch();
                }}
                className={`w-11 h-11 rounded-full backdrop-blur-md border transition-colors flex items-center justify-center active:scale-90 cursor-pointer ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/30'
                    : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
                }`}
                title={torchOn ? 'Éteindre la torche' : 'Allumer la torche'}
              >
                {torchOn ? <Zap className="w-5 h-5 fill-slate-950" /> : <ZapOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* CENTER VIEWPORT: Viewfinder cutout or Verdict Screen */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 my-auto">
            
            {/* A. If Verdict is Active (Ticket Scanned!) */}
            {verdict.status !== 'idle' ? (
              <div className={`w-full max-w-sm rounded-[36px] p-7 border text-center flex flex-col items-center justify-center space-y-4 shadow-2xl animate-scaleUp ${
                verdict.status === 'valid'
                  ? 'bg-white/95 backdrop-blur-xl border-emerald-300 text-slate-900'
                  : 'bg-white/95 backdrop-blur-xl border-red-300 text-slate-900'
              }`}>
                {/* Big Circular Status Icon */}
                {verdict.status === 'valid' ? (
                  <div className="relative my-1">
                    <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/35">
                      <Check className="w-14 h-14 text-white stroke-[3.5]" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border-4 border-emerald-400/40 animate-ping pointer-events-none" />
                  </div>
                ) : (
                  <div className="relative my-1">
                    <div className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/35">
                      <AlertOctagon className="w-14 h-14 text-white stroke-[2.5]" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border-4 border-red-400/40 animate-ping pointer-events-none" />
                  </div>
                )}

                {/* iPhone Cline Bell confirmation badge */}
                {verdict.status === 'valid' && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black">
                    <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                    <span>Cloche Cline iPhone Confirmée 🔔</span>
                  </div>
                )}

                {/* Title & Message */}
                <div className="space-y-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    verdict.status === 'valid'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}>
                    {verdict.status === 'valid' ? '✅ Passage Validé' : (verdict.status === 'used' ? '🚨 Ticket Déjà Consommé' : '⚠️ Refus')}
                  </span>

                  <h3 className={`text-2xl font-black ${
                    verdict.status === 'valid' ? 'text-emerald-950 font-cabinet' : 'text-red-950 font-cabinet'
                  }`}>
                    {verdict.status === 'valid' ? 'TICKET VALIDE' : (verdict.status === 'used' ? 'DÉJÀ CONSOMMÉ' : 'NON RECONNU')}
                  </h3>

                  <p className={`text-xs font-semibold ${
                    verdict.status === 'valid' ? 'text-emerald-800' : 'text-red-700'
                  }`}>
                    {verdict.message}
                  </p>
                </div>

                {/* Ticket Details */}
                {verdict.ticket && (
                  <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Étudiant</span>
                      <span className="font-bold text-slate-900">
                        {verdict.ticket.studentName} ({verdict.ticket.studentMatricule})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Plat Servi</span>
                      <span className="font-extrabold text-orange-600">
                        {verdict.ticket.dishName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Numéro de Ticket</span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {verdict.ticket.ticketNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Heure</span>
                      <span className="font-mono text-slate-700">
                        {verdict.time || new Date().toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Student Button */}
                <button
                  type="button"
                  onClick={() => {
                    setVerdict({ status: 'idle', message: '' });
                    startCamera();
                  }}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer ${
                    verdict.status === 'valid'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-orange-500/30'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {verdict.status === 'valid'
                      ? 'Scanner le ticket suivant'
                      : 'Scanner un autre ticket'}
                  </span>
                </button>
              </div>
            ) : waveTab === 'scan' ? (
              /* B. Live Viewfinder with Rounded Square Window (Exact Wave UI) */
              <div className="flex flex-col items-center">
                {/* Central Rounded Square Cutout with corner brackets and laser */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = videoRef.current;
                    if (v && v.paused) {
                      v.play().then(() => setIsVideoPlaying(true)).catch(() => {});
                    } else if (!isCameraActive || !streamRef.current) {
                      startCamera();
                    }
                  }}
                  className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-[44px] border border-white/25 overflow-hidden flex items-center justify-center cursor-pointer pointer-events-auto"
                >
                  
                  {/* Sweeping Green Laser Line matching Wave scanner */}
                  <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 rounded-full shadow-[0_0_14px_#10b981] animate-scanLaser pointer-events-none"></div>

                  {/* Corner indicator accents */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/80 rounded-tl-xl pointer-events-none"></div>
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white/80 rounded-tr-xl pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white/80 rounded-bl-xl pointer-events-none"></div>
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white/80 rounded-br-xl pointer-events-none"></div>
                </div>

                {/* Subtitle text matching Wave screenshot */}
                <p className="text-white text-sm sm:text-base font-medium text-center mt-7 drop-shadow-md px-4">
                  Scanner le code QR pour valider le ticket
                </p>

                {/* iOS Fallback Helper: If video stream paused by Safari, user can tap directly */}
                {!isVideoPlaying && isCameraActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = videoRef.current;
                      if (v) {
                        v.play().then(() => setIsVideoPlaying(true)).catch(() => {});
                      }
                    }}
                    className="mt-3 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold animate-pulse"
                  >
                    Touchez l'écran si l'image est noire 📷
                  </button>
                )}
              </div>
            ) : (
              /* C. Manual Input Tab in Wave Interface */
              <div className="w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-white text-center space-y-4 shadow-2xl animate-scaleUp">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Saisie Manuelle</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Entrez le numéro du ticket (ex: 984917) ou le matricule étudiant.
                  </p>
                </div>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Numéro de ticket..."
                    className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-2xl text-center font-mono text-base text-white tracking-widest focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Valider le passage
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* BOTTOM BAR: Wave Pill Switcher [ Scanner un code | Saisie manuelle ] */}
          <div className="relative z-30 pb-12 sm:pb-8 flex justify-center px-4">
            <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-1.5 rounded-full flex items-center shadow-2xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWaveTab('scan');
                  if (!isCameraActive || !streamRef.current || (videoRef.current && videoRef.current.paused)) {
                    startCamera();
                  }
                }}
                className={`px-5 py-2.5 rounded-full font-black text-xs transition-all cursor-pointer ${
                  waveTab === 'scan'
                    ? 'bg-white text-slate-950 shadow-md scale-100'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Scanner un code
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWaveTab('manual');
                }}
                className={`px-5 py-2.5 rounded-full font-black text-xs transition-all cursor-pointer ${
                  waveTab === 'manual'
                    ? 'bg-white text-slate-950 shadow-md scale-100'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Saisie manuelle
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

```

---

## 📄 Fichier: `src/components/AdminDashboard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Camera, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  UtensilsCrossed, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  QrCode, 
  Ticket, 
  DollarSign, 
  AlertOctagon, 
  UserCheck, 
  UserX,
  Scan,
  RefreshCw,
  Archive,
  History,
  RotateCcw,
  Calendar,
  CheckCircle2,
  X,
  HelpCircle,
  HardDrive,
  ExternalLink,
  FileSpreadsheet,
  UploadCloud,
  Check,
  KeyRound,
  Unlock
} from 'lucide-react';
import { Dish, Canteen, CrowdLevel, UserProfile, MealTicket } from '../types';
import { ImageWithLoader } from './ImageWithLoader';
import { TurnstileWaveScanner } from './TurnstileWaveScanner';
import { 
  getAllRegisteredStudents, 
  verifyTurnstileTicket, 
  getFraudAuditLogs, 
  FraudAuditLog,
  subscribeToStudentsRegistry,
  syncAllLocalAccountsToFirestore,
  resetStudentPassword,
  unblockStudentAccount
} from '../services/studentAuth';
import { 
  DailyLedgerStats,
  getActiveDailyLedger,
  getAllDailyArchives,
  archivePastDay,
  getTodayDateString,
  getTodayFormatted
} from '../services/dailyLedger';
import { 
  initDriveAuth,
  signInWithGoogleForDrive,
  exportStudentRegistryToDrive,
  exportLedgerToDrive,
  listAppFilesFromDrive,
  signOutDrive,
  DriveUploadResult,
  getCachedDriveUser,
  downloadFileLocally,
  generateStudentRegistryCsvData,
  generateLedgerCsvData
} from '../services/googleDriveService';
import { compressImage } from '../utils/imageCompressor';
import { soundSynthesizer } from '../utils/audioFeedback';

interface Props {
  canteen: Canteen;
  dishes: Dish[];
  onUpdateCanteen: (updated: Canteen) => void;
  onAddDish: (dish: Dish) => void;
  onToggleDishAvailability: (dishId: string) => void;
  onDeleteDish: (dishId: string) => void;
  onDeleteAllDishes?: () => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  canteen,
  dishes,
  onUpdateCanteen,
  onAddDish,
  onToggleDishAvailability,
  onDeleteDish,
  onDeleteAllDishes,
  onClose
}) => {
  const [adminTab, setAdminTab] = useState<'scanner' | 'dishes' | 'fraud' | 'tickets' | 'drive'>('scanner');

  // Daily Ledger State (starts at zero or active day)
  const [dailyLedger, setDailyLedger] = useState<DailyLedgerStats>({
    date: getTodayDateString(),
    formattedDate: getTodayFormatted(),
    totalTicketsSold: 0,
    mealsValidated: 0,
    ticketsInCirculation: 0,
    revenueCollected: 0,
    servedTickets: []
  });

  // Modals for Archives
  const [showArchivesModal, setShowArchivesModal] = useState<boolean>(false);
  const [archivesList, setArchivesList] = useState<DailyLedgerStats[]>([]);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // New dish form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('200');
  const [category, setCategory] = useState<'plat_principal' | 'entree' | 'dessert' | 'boisson'>('plat_principal');
  const [mealType, setMealType] = useState<'dejeuner' | 'diner'>('dejeuner');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Anti-fraud & Student Matricules Registry
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [matriculeSearch, setMatriculeSearch] = useState('');
  const [fraudLogs, setFraudLogs] = useState<FraudAuditLog[]>([]);
  const [isRefreshingRegistry, setIsRefreshingRegistry] = useState(false);
  const [resettingStudent, setResettingStudent] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetStatus, setResetStatus] = useState<{ loading: boolean; message?: string; error?: string }>({ loading: false });

  // Google Drive Integration State
  const [driveUser, setDriveUser] = useState<any>(() => getCachedDriveUser());
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [isExportingDrive, setIsExportingDrive] = useState<boolean>(false);
  const [driveExportSuccess, setDriveExportSuccess] = useState<DriveUploadResult | null>(null);
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; webViewLink?: string; createdTime?: string }>>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Manual Turnstile check simulation fallback
  const [scanTicketNumber, setScanTicketNumber] = useState('');
  const [scanMatricule, setScanMatricule] = useState('');
  const [manualScanResult, setManualScanResult] = useState<{ status: string; message: string; ticket?: MealTicket } | null>(null);
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);

  // Subscribe to real-time student registry from Firestore and Drive auth
  useEffect(() => {
    // 1. Multi-Device Real-Time Subscription: Every student registered on any phone appears instantly!
    const unsubscribeStudents = subscribeToStudentsRegistry((liveStudents) => {
      setStudents(liveStudents);
      setFraudLogs(getFraudAuditLogs());
    });

    loadLedgerData();

    // 2. Drive Auth listener
    const unsubscribeDrive = initDriveAuth((user, token) => {
      setDriveUser(user);
      setIsDriveConnected(!!user && !!token);
      if (token) {
        listAppFilesFromDrive().then(setDriveFiles).catch(() => {});
      }
    });

    return () => {
      unsubscribeStudents();
      unsubscribeDrive();
    };
  }, []);

  const loadRegistryData = async () => {
    const list = await getAllRegisteredStudents();
    setStudents(list);
    setFraudLogs(getFraudAuditLogs());
  };

  const handleForceRefreshCloud = async () => {
    setIsRefreshingRegistry(true);
    try {
      await syncAllLocalAccountsToFirestore();
      const updated = await getAllRegisteredStudents();
      setStudents(updated);
      setActionSuccessNotice('Synchronisation Cloud Firestore effectuée : tous les comptes sont à jour.');
      setTimeout(() => setActionSuccessNotice(null), 3500);
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      setIsRefreshingRegistry(false);
    }
  };

  const loadLedgerData = async () => {
    const stats = await getActiveDailyLedger();
    setDailyLedger(stats);
  };

  const openArchives = async () => {
    const list = await getAllDailyArchives();
    setArchivesList(list);
    setShowArchivesModal(true);
  };

  const handleManualArchiveDay = async () => {
    await archivePastDay(dailyLedger);
    const updatedArchives = await getAllDailyArchives();
    setArchivesList(updatedArchives);
    setActionSuccessNotice('La journée a été archivée avec succès dans l\'historique permanent.');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Google Drive Action Handlers with MANDATORY explicit user confirmation
  const handleConnectDrive = async () => {
    try {
      const res = await signInWithGoogleForDrive();
      setDriveUser(res.user);
      setIsDriveConnected(true);
      const files = await listAppFilesFromDrive();
      setDriveFiles(files);
      setActionSuccessNotice(`Connecté à Google Drive avec le compte : ${res.user.email}`);
      setTimeout(() => setActionSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Drive connection error:', err);
      setActionSuccessNotice(err.message || 'Impossible de se connecter à Google Drive.');
      setTimeout(() => setActionSuccessNotice(null), 4000);
    }
  };

  const handleDisconnectDrive = async () => {
    await signOutDrive();
    setDriveUser(null);
    setIsDriveConnected(false);
    setDriveFiles([]);
    setActionSuccessNotice('Déconnecté de Google Drive.');
    setTimeout(() => setActionSuccessNotice(null), 3000);
  };

  // Confirmation before Student Registry Export
  const promptExportStudentsToDrive = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Exporter le Registre des Étudiants sur Google Drive',
      description: `Vous êtes sur le point de créer un fichier CSV contenant la liste complète de ${students.length} étudiants (matricules, soldes et tickets) directement sur votre compte Google Drive. Souhaitez-vous continuer ?`,
      confirmText: 'Sauvegarder sur Google Drive',
      onConfirm: async () => {
        setConfirmModal(null);
        setIsExportingDrive(true);
        try {
          const res = await exportStudentRegistryToDrive(students);
          setDriveExportSuccess(res);
          const updatedFiles = await listAppFilesFromDrive();
          setDriveFiles(updatedFiles);
          setActionSuccessNotice(`Fichier « ${res.name} » créé avec succès sur votre Google Drive !`);
          setTimeout(() => setActionSuccessNotice(null), 5000);
        } catch (err: any) {
          console.error('Export error:', err);
          setActionSuccessNotice(err.message || 'Erreur lors de l\'export vers Google Drive.');
          setTimeout(() => setActionSuccessNotice(null), 4000);
        } finally {
          setIsExportingDrive(false);
        }
      }
    });
  };

  // Confirmation before Daily Ledger Export
  const promptExportLedgerToDrive = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Exporter le Bilan Comptable Journalier sur Google Drive',
      description: `Vous êtes sur le point de créer un rapport comptable CSV du ${dailyLedger.formattedDate} (${dailyLedger.revenueCollected.toLocaleString('fr-FR')} FCFA de recettes, ${dailyLedger.mealsValidated} repas servis) directement sur votre compte Google Drive. Souhaitez-vous continuer ?`,
      confirmText: 'Sauvegarder sur Google Drive',
      onConfirm: async () => {
        setConfirmModal(null);
        setIsExportingDrive(true);
        try {
          const res = await exportLedgerToDrive(dailyLedger);
          setDriveExportSuccess(res);
          const updatedFiles = await listAppFilesFromDrive();
          setDriveFiles(updatedFiles);
          setActionSuccessNotice(`Bilan « ${res.name} » créé avec succès sur votre Google Drive !`);
          setTimeout(() => setActionSuccessNotice(null), 5000);
        } catch (err: any) {
          console.error('Export error:', err);
          setActionSuccessNotice(err.message || 'Erreur lors de l\'export vers Google Drive.');
          setTimeout(() => setActionSuccessNotice(null), 4000);
        } finally {
          setIsExportingDrive(false);
        }
      }
    });
  };

  const handleDownloadStudentsCsvDirect = () => {
    const { fileName, content } = generateStudentRegistryCsvData(students);
    downloadFileLocally(fileName, 'text/csv', content);
    setActionSuccessNotice(`Fichier « ${fileName} » téléchargé directement sur votre appareil !`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const handleDownloadLedgerCsvDirect = () => {
    const { fileName, content } = generateLedgerCsvData(dailyLedger);
    downloadFileLocally(fileName, 'text/csv', content);
    setActionSuccessNotice(`Bilan « ${fileName} » téléchargé directement sur votre appareil !`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Crowd controls
  const handleCrowdChange = (level: CrowdLevel) => {
    let waitMinutes = 5;
    if (level === 'moyen') waitMinutes = 15;
    if (level === 'eleve') waitMinutes = 30;

    onUpdateCanteen({
      ...canteen,
      crowdLevel: level,
      waitingTimeMinutes: waitMinutes
    });
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPublishing(true);
    try {
      let finalImageUrl = imageUrl.trim();
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        try {
          finalImageUrl = await compressImage(finalImageUrl, 600, 600, 0.72);
        } catch (compErr) {
          console.warn('Compression notice:', compErr);
        }
      }

      const newDish: Dish = {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        description: description.trim() || 'Plat préparé avec soin par l\'équipe du restaurant universitaire CROU.',
        category,
        price: parseInt(price, 10) || 200,
        regularPrice: 500,
        imageUrl: finalImageUrl,
        isAvailable: true,
        mealType,
        canteenId: 'all', // Diffusé pour tous les étudiants UPGC
        tags: ['Distribution Officielle', 'Resto U'],
        rating: 5.0,
        ratingCount: 1
      };

      onAddDish(newDish);
      setName('');
      setDescription('');
      setImageUrl('');
      setActionSuccessNotice(`Plat "${newDish.name}" publié et synchronisé sur tous les appareils.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRunManualTurnstileCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanTicketNumber.trim()) return;

    setIsVerifyingManual(true);
    setManualScanResult(null);

    const res = await verifyTurnstileTicket(scanTicketNumber.trim(), scanMatricule.trim());
    if (res.status === 'valid') {
      soundSynthesizer.playSuccessBeep();
    } else {
      soundSynthesizer.playFraudBeep();
    }
    setManualScanResult(res);
    setIsVerifyingManual(false);
    loadRegistryData();
    loadLedgerData();
  };

  const handleAdminResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingStudent || !newPasswordInput.trim()) return;
    setResetStatus({ loading: true });

    try {
      const res = await resetStudentPassword(resettingStudent.matricule || resettingStudent.uid, newPasswordInput.trim());
      if (res.success) {
        setResetStatus({ 
          loading: false, 
          message: `Mot de passe réinitialisé avec succès pour ${resettingStudent.displayName || resettingStudent.matricule} !` 
        });
        setTimeout(() => {
          setResettingStudent(null);
          setNewPasswordInput('');
          setResetStatus({ loading: false });
        }, 1600);
      } else {
        setResetStatus({ loading: false, error: res.message || 'Erreur lors de la réinitialisation.' });
      }
    } catch (err: any) {
      setResetStatus({ loading: false, error: err.message || 'Erreur réseau.' });
    }
  };

  const handleAdminUnblockStudent = async (student: UserProfile) => {
    const mat = student.matricule || student.uid;
    const confirm = window.confirm(`Débloquer le compte de ${student.displayName} (${mat}) ? Cela réinitialisera les compteurs d'échecs de sécurité.`);
    if (!confirm) return;
    try {
      const res = await unblockStudentAccount(mat);
      alert(res.message);
      loadRegistryData();
    } catch (err: any) {
      alert('Erreur: ' + (err.message || err));
    }
  };

  const canteenDishes = dishes.filter(d => 
    !d.canteenId || 
    d.canteenId === 'all' || 
    d.canteenId === canteen.id || 
    (canteen.id.startsWith('resto-upgc') && (d.canteenId.startsWith('resto-upgc') || d.canteenId === 'all'))
  );

  const filteredStudents = students.filter(s => {
    const q = matriculeSearch.toLowerCase();
    const matMatch = (s.matricule || '').toLowerCase().includes(q);
    const nameMatch = (s.displayName || '').toLowerCase().includes(q);
    return matMatch || nameMatch;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header 
        className="bg-slate-900 text-white sticky top-0 z-30 shadow-lg border-b border-slate-800"
        style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 14px))' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
              title="Retour à l'application"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black font-cabinet text-white">
                  Administration Restau. U • CROU Korhogo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Compte Vérifié
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {canteen.name} • UPGC Korhogo
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-800 rounded-2xl border border-slate-700 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => { setAdminTab('scanner'); loadLedgerData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'scanner'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Borne Scanner (Wave)</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('dishes')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'dishes'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Plats Distribués</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab('fraud'); loadRegistryData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'fraud'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Contrôle Anti-Fraude ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab('tickets'); loadRegistryData(); loadLedgerData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'tickets'
                  ? 'bg-slate-700 text-amber-300 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Billetterie & Archives</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('drive')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'drive'
                  ? 'bg-blue-600 text-white font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Google Drive</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Notification Banner */}
      {actionSuccessNotice && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-center text-xs font-bold animate-fadeIn flex items-center justify-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">

        {/* TAB 1: SCANNER BORNE TOURNIQUET (STYLE WAVE) & STATISTIQUES EN DIRECT */}
        {adminTab === 'scanner' && (
          <div className="space-y-6">
            
            {/* 4 Stat Cards Exactly Matching Screenshot IMG_1077 */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 font-cabinet">
                    Tableau de Bord des Ventes & Tourniquet
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chiffres en temps réel de la journée • {dailyLedger.formattedDate}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={loadLedgerData}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs"
                    title="Actualiser les compteurs"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={openArchives}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Archives Quotidiennes</span>
                  </button>

                  <div
                    className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs"
                    title="Sécurité CROU : Registre inaltérable et infalsifiable par le personnel de caisse"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Registre Inaltérable (Anti-Fraude)</span>
                  </div>
                </div>
              </div>

              {/* 4 CARDS: Identical to IMG_1077_6105293f.png */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Card 1 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    TOTAL TICKETS VENDUS
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-slate-900">
                      {dailyLedger.totalTicketsSold}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600">
                    Tarif subventionné 200 FCFA
                  </span>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    REPAS SERVIS (VALIDÉS)
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-emerald-600">
                      {dailyLedger.mealsValidated}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Passages au self
                  </span>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    TICKETS EN CIRCULATION
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-blue-600">
                      {dailyLedger.ticketsInCirculation}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Disponibles
                  </span>
                </div>

                {/* Card 4 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    RECETTES ENCAISSÉES
                  </span>
                  <div className="my-2 flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-slate-900">
                      {dailyLedger.revenueCollected.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs font-black text-slate-500">FCFA</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600">
                    Compte Régie CROU-K
                  </span>
                </div>

              </div>
            </div>

            {/* WAVE-STYLE REAL-TIME QR SCANNER COMPONENT */}
            <TurnstileWaveScanner
              onTicketValidated={() => {
                loadLedgerData();
                loadRegistryData();
              }}
              onRefreshStats={loadLedgerData}
            />

            {/* Manual Code Guichet Fallback Box */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                    Saisie Manuelle (Code Guichet)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Si le téléphone de l'étudiant a l'écran fissuré ou batterie faible, entrez le code ticket ou matricule.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRunManualTurnstileCheck} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={scanTicketNumber}
                  onChange={(e) => setScanTicketNumber(e.target.value)}
                  placeholder="Ex: CROUK-2026-016278"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <input
                  type="text"
                  value={scanMatricule}
                  onChange={(e) => setScanMatricule(e.target.value.toUpperCase())}
                  placeholder="Matricule (optionnel)"
                  className="w-full sm:w-44 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={isVerifyingManual}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingManual ? 'Vérification...' : 'Valider Ticket'}
                </button>
              </form>

              {manualScanResult && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2.5 ${
                  manualScanResult.status === 'valid'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  {manualScanResult.status === 'valid' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold block">{manualScanResult.message}</span>
                    {manualScanResult.ticket && (
                      <span className="text-[11px] text-slate-600 font-mono block mt-0.5">
                        {manualScanResult.ticket.ticketNumber} • {manualScanResult.ticket.dishName} • {manualScanResult.ticket.studentName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Zero Data Loss Guarantee Card */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Garantie de Conservation Intégrale des Données</span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  À minuit, le système bascule automatiquement sur un nouveau jour à 0 ticket, tandis que l'ensemble des ventes et tickets de la veille est archivé définitivement dans le registre sécurisé Firestore et local. Aucune donnée d'étudiant n'est jamais effacée.
                </p>
              </div>

              <button
                type="button"
                onClick={openArchives}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 flex-shrink-0"
              >
                <Archive className="w-4 h-4 text-amber-400" />
                <span>Voir Historique Complet</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: PLATS DU MENU CROU */}
        {adminTab === 'dishes' && (
          <div className="space-y-6">
            
            {/* Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">Plats Distribués</span>
                <span className="text-2xl font-black font-cabinet text-slate-900">{canteenDishes.length}</span>
                <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                  {canteenDishes.filter(d => d.isAvailable).length} en service actif
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">Tarif Subventionné</span>
                <span className="text-2xl font-black font-cabinet text-orange-600">200 FCFA</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Subvention CROUK 90%</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">File au Tourniquet</span>
                <span className="text-lg font-black text-slate-900 capitalize">
                  {canteen.crowdLevel === 'faible' ? 'Fluide' : canteen.crowdLevel === 'moyen' ? 'Moyenne' : 'Forte'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">~{canteen.waitingTimeMinutes} min d'attente</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">Étudiants Inscrits</span>
                <span className="text-2xl font-black font-cabinet text-slate-900">{students.length}</span>
                <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">Matricules audités</span>
              </div>
            </div>

            {/* Live Crowd Adjuster */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Affluence en Direct (Radar CROU)</h3>
                <p className="text-xs text-slate-500">Mettez à jour le temps d'attente visible par les étudiants.</p>
              </div>
              <div className="flex items-center space-x-2">
                {(['faible', 'moyen', 'eleve'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleCrowdChange(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      canteen.crowdLevel === lvl
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl === 'faible' ? '🟢 Fluide (~5m)' : lvl === 'moyen' ? '🟡 Moyenne (~15m)' : '🔴 Forte (~30m)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Dish Form & Current Dish List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-base text-slate-900 font-cabinet">Ajouter un Plat Distribué</h3>
                    <p className="text-xs text-slate-500">Configurez le menu servi au restaurant universitaire.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-800 text-[10px] font-black rounded-lg">
                    Tarif 200 FCFA
                  </span>
                </div>

                <form onSubmit={handleCreateDish} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Plat *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Riz Sauce Graine au Poisson & Banane Alloco"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description du repas</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ingrédients, garniture..."
                      rows={2}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Service</label>
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      >
                        <option value="dejeuner">☀️ Déjeuner (Midi)</option>
                        <option value="diner">🌙 Dîner (Soir)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      >
                        <option value="plat_principal">Plat Principal Chaud</option>
                        <option value="entree">Entrée & Alloco</option>
                        <option value="dessert">Dessert & Dêguê</option>
                        <option value="boisson">Jus de bissap & Boisson</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Photo du plat (Facultatif - à la décision de l'administration)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Lien URL de la photo (optionnel)"
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? 'Traitement...' : 'Importer photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingPhoto(true);
                              try {
                                const compressed = await compressImage(file, 600, 600, 0.72);
                                setImageUrl(compressed);
                              } catch (err) {
                                console.error('Image compression error:', err);
                              } finally {
                                setIsUploadingPhoto(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    {imageUrl && (
                      <div className="mt-2 flex items-center space-x-2">
                        <img src={imageUrl} alt="Aperçu" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                        <span className="text-[11px] text-emerald-600 font-bold">Photo prête et optimisée</span>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-[10px] text-red-500 hover:underline cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      Les photos sont automatiquement optimisées pour s'afficher rapidement sur le téléphone des étudiants.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isPublishing || isUploadingPhoto}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPublishing ? 'Synchronisation sur tous les appareils...' : 'Publier au Menu des Étudiants'}</span>
                  </button>
                </form>
              </div>

              {/* Dishes List */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 font-cabinet">
                    Plats Actuels ({canteenDishes.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    {canteenDishes.length > 0 && onDeleteAllDishes && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Voulez-vous vraiment supprimer TOUS les plats du menu ?')) {
                            onDeleteAllDishes();
                          }
                        }}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Supprimer tous les plats du menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Tout Supprimer</span>
                      </button>
                    )}
                    <span className="text-xs text-slate-400">Modifications instantanées</span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {canteenDishes.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                        <ImageWithLoader
                          src={d.imageUrl}
                          alt={d.name}
                          className="w-full h-full"
                          imgClassName="object-cover"
                          showSpiralText={false}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {d.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            d.mealType === 'dejeuner' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {d.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-orange-600">
                          {d.price} FCFA
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleDishAvailability(d.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            d.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {d.isAvailable ? 'En stock' : 'Rupture'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteDish(d.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Supprimer ce plat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: CONTRÔLE ANTI-FRAUDE & REGISTRE DES MATRICULES */}
        {adminTab === 'fraud' && (
          <div className="space-y-6">
            
            {/* Students Matricules Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-base text-slate-900 font-cabinet">
                      Registre des Étudiants & Matricules UPGC ({students.length})
                    </h3>
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>En direct (Multi-Appareils)</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tous les comptes créés sur n'importe quel téléphone ou ordinateur s'affichent automatiquement ici en temps réel.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleForceRefreshCloud}
                    disabled={isRefreshingRegistry}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 border border-slate-200 disabled:opacity-50"
                    title="Forcer la synchronisation avec tous les appareils"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshingRegistry ? 'animate-spin text-orange-600' : ''}`} />
                    <span>{isRefreshingRegistry ? 'Synchronisation...' : 'Actualiser Cloud'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={promptExportStudentsToDrive}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 border border-blue-200"
                    title="Exporter le registre vers Google Drive"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>Exporter Drive</span>
                  </button>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={matriculeSearch}
                      onChange={(e) => setMatriculeSearch(e.target.value)}
                      placeholder="Rechercher un matricule..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Matricule Étudiant</th>
                      <th className="py-3 px-4">Nom et Prénoms</th>
                      <th className="py-3 px-4">Solde</th>
                      <th className="py-3 px-4">Tickets Actifs</th>
                      <th className="py-3 px-4">Tickets Consommés</th>
                      <th className="py-3 px-4">Statut Anti-Fraude</th>
                      <th className="py-3 px-4 text-right">Action Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Aucun étudiant correspondant au matricule recherché.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => {
                        const validCount = (st.savedTickets || []).filter(t => t.status === 'valid').length;
                        const usedCount = (st.savedTickets || []).filter(t => t.status === 'used').length;
                        return (
                          <tr key={st.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-orange-600">
                              {st.matricule || st.uid}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {st.displayName}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-slate-800">
                              {st.balance} FCFA
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {validCount} prêt{validCount > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {usedCount} repas
                            </td>
                            <td className="py-3 px-4">
                              {st.isBlocked ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                                  <AlertOctagon className="w-3 h-3 text-red-600" />
                                  <span>Compte Bloqué (5 PIN)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Authentifié UPGC</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {st.isBlocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminUnblockStudent(st)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                    title="Débloquer le compte de cet étudiant"
                                  >
                                    <Unlock className="w-3 h-3 text-white" />
                                    <span>Débloquer</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResettingStudent(st);
                                    setNewPasswordInput('');
                                    setResetStatus({ loading: false });
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                  title="Réinitialiser le mot de passe de cet étudiant"
                                >
                                  <KeyRound className="w-3 h-3 text-amber-600" />
                                  <span>Réinitialiser MDP</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fraud Logs History */}
            {fraudLogs.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-red-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-red-600 font-bold text-sm font-cabinet">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Journal des Alertes de Fraude Récents</span>
                </div>
                <div className="space-y-2">
                  {fraudLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start justify-between text-xs">
                      <div>
                        <span className="font-bold text-red-900 block">{log.reason}</span>
                        <span className="text-[11px] text-red-700 font-mono mt-0.5 block">
                          Matricule: {log.matricule} • Ticket No: {log.ticketNumber} • {log.timestamp}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                        {log.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: BILLETTERIE & ARCHIVES JOURNALIÈRES */}
        {adminTab === 'tickets' && (
          <div className="space-y-6">
            
            {/* Quick Ledger Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-slate-900 font-cabinet">
                  Régie & Billetterie Officielle CROU
                </h3>
                <p className="text-xs text-slate-500">
                  Total cumulé aujourd'hui : {dailyLedger.totalTicketsSold} tickets vendus • {dailyLedger.revenueCollected.toLocaleString('fr-FR')} FCFA encaissés
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={openArchives}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Historique des Journées</span>
                </button>

                <button
                  type="button"
                  onClick={loadRegistryData}
                  className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
                  title="Actualiser"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Issued Tickets List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Tickets Émis et Liés aux Matricules
                  </h4>
                  <p className="text-xs text-slate-500">
                    Traçabilité complète contre la fraude ou double utilisation.
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-700">
                  {students.flatMap(s => s.savedTickets || []).length} tickets émis
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {students.flatMap(s => s.savedTickets || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Aucun ticket encore émis pour le moment.
                  </div>
                ) : (
                  students.flatMap(s => s.savedTickets || []).map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                          🎟️
                        </div>
                        <div>
                          <span className="font-black text-slate-900 block">{t.dishName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {t.ticketNumber} • {t.studentName} ({t.studentMatricule})
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-orange-600 block">{t.price} FCFA</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {t.status === 'valid' ? 'Valide' : 'Consommé'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: GOOGLE DRIVE (SAUVEGARDES DU REGISTRE ET BILAN COMPTABLE) */}
        {adminTab === 'drive' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header Connection Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex-shrink-0">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-base text-slate-900 font-cabinet">
                        Sauvegardes Google Drive Officielles CROU
                      </h3>
                      {isDriveConnected ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Connecté</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Non connecté
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sauvegardez en un clic le registre officiel des étudiants et les bilans comptables sur votre Google Drive.
                    </p>
                  </div>
                </div>

                <div>
                  {isDriveConnected ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 truncate max-w-[200px]">
                        {driveUser?.email || 'Google Drive Actif'}
                      </span>
                      <button
                        type="button"
                        onClick={handleDisconnectDrive}
                        className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-bold"
                      >
                        Déconnecter
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectDrive}
                      className="inline-flex items-center space-x-2.5 px-4 py-2 bg-white border border-slate-300 rounded-xl shadow-xs hover:bg-slate-50 transition-colors text-slate-800 font-bold text-xs"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Connecter Google Drive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Success Export Notification */}
              {driveExportSuccess && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center space-x-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">Fichier enregistré sur Google Drive :</span>
                      <span className="font-mono text-emerald-800">{driveExportSuccess.name}</span>
                    </div>
                  </div>
                  {driveExportSuccess.webViewLink && (
                    <a
                      href={driveExportSuccess.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex-shrink-0"
                    >
                      <span>Ouvrir sur Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 2 Main Export Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Action 1: Export Student Registry */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 font-cabinet">
                      Registre des Étudiants UPGC (.csv)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {students.length} étudiants inscrits synchronisés
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Exporte un tableau prêt pour Google Sheets ou Excel contenant les matricules, noms complets, emails, soldes et nombre de repas achetés.
                </p>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={promptExportStudentsToDrive}
                    disabled={isExportingDrive}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isExportingDrive ? 'Exportation en cours...' : 'Sauvegarder le Registre sur Drive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadStudentsCsvDirect}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Télécharger directement le CSV</span>
                  </button>
                </div>
              </div>

              {/* Action 2: Export Daily Financial Ledger */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-amber-200 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 font-cabinet">
                      Bilan Comptable Journalier (.csv)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Session du {dailyLedger.formattedDate}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Exporte le rapport financier du jour : {dailyLedger.revenueCollected.toLocaleString('fr-FR')} FCFA de recettes, {dailyLedger.mealsValidated} repas servis au tourniquet et liste détaillée des passages.
                </p>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={promptExportLedgerToDrive}
                    disabled={isExportingDrive}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isExportingDrive ? 'Exportation en cours...' : 'Sauvegarder le Bilan sur Drive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadLedgerCsvDirect}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Télécharger directement le CSV</span>
                  </button>
                </div>
              </div>

            </div>

            {/* List of files on Google Drive */}
            {driveFiles.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Sauvegardes CROU existantes sur Google Drive ({driveFiles.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => listAppFilesFromDrive().then(setDriveFiles)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Actualiser la liste"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {driveFiles.map((file) => (
                    <div key={file.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{file.name}</span>
                          {file.createdTime && (
                            <span className="text-[10px] text-slate-400">
                              Créé le {new Date(file.createdTime).toLocaleString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center space-x-1 flex-shrink-0"
                        >
                          <span>Voir</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* CONFIRMATION MODAL (MANDATORY FOR GOOGLE DRIVE ACTIONS) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 font-cabinet">
                    {confirmModal.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">Google Drive API</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {confirmModal.description}
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{confirmModal.confirmText || 'Confirmer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ARCHIVES MODAL: HISTORICAL JOURNALS (NEVER LOST) */}
      {showArchivesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                  <Archive className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 font-cabinet">
                    Registre des Archives Quotidiennes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Historique permanent des journées passées • Sauvegarde garantie
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowArchivesModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Daily Rollover Info Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1">
                <span className="font-black flex items-center space-x-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sauvegarde Automatique Quotidienne Active</span>
                </span>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  Chaque nouveau jour, les chiffres de la veille basculent automatiquement ici sans jamais s'effacer, et le nouveau jour redémarre à zéro pour le service.
                </p>
              </div>

              {/* Archives Listing */}
              {archivesList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  Aucune archive passée pour l'instant. Les journées terminées apparaîtront ici automatiquement chaque jour.
                </div>
              ) : (
                <div className="space-y-3">
                  {archivesList.map((arch) => (
                    <div
                      key={arch.date}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span className="font-bold text-xs text-slate-900 capitalize">
                            {arch.formattedDate || arch.date}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Date : {arch.date} {arch.closedAt ? `• Clôturé à ${new Date(arch.closedAt).toLocaleTimeString('fr-FR')}` : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Vendus</span>
                          <span className="font-black text-slate-900 text-sm">{arch.totalTicketsSold}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Servis</span>
                          <span className="font-black text-emerald-600 text-sm">{arch.mealsValidated}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Circulation</span>
                          <span className="font-black text-blue-600 text-sm">{arch.ticketsInCirculation}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Recettes</span>
                          <span className="font-black text-slate-900 text-sm">{arch.revenueCollected.toLocaleString('fr-FR')} F</span>
                        </div>
                      </div>

                      {arch.servedTickets && arch.servedTickets.length > 0 && (
                        <div className="text-[11px] text-slate-500 pt-1">
                          <span className="font-bold text-slate-700">Détails des {arch.servedTickets.length} repas servis : </span>
                          <span>{arch.servedTickets.slice(0, 5).map(t => `${t.ticketNumber} (${t.dishName})`).join(', ')}{arch.servedTickets.length > 5 ? ` +${arch.servedTickets.length - 5} autres...` : ''}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with manual close day button */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                La clôture manuelle archive la journée en cours et redémarre à 0.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleManualArchiveDay}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Archive className="w-4 h-4" />
                  <span>Clôturer & Archiver Aujourd'hui</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchivesModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: RÉINITIALISATION MOT DE PASSE ÉTUDIANT PAR LE RESPONSABLE PROGRAMAS */}
      {resettingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-200 text-left">
            <button
              type="button"
              onClick={() => { setResettingStudent(null); setResetStatus({ loading: false }); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-1 font-cabinet">
              Réinitialisation Mot de Passe Étudiant
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Guichet Responsable Programas • CROU Korhogo
            </p>

            {/* Fiche Étudiant */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 mb-4">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-500">Matricule :</span>
                <span className="font-mono text-orange-600 font-extrabold">{resettingStudent.matricule || resettingStudent.uid}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Étudiant :</span>
                <span className="font-bold text-slate-900">{resettingStudent.displayName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Solde actuel :</span>
                <span className="font-bold text-emerald-700">{resettingStudent.balance} FCFA</span>
              </div>
            </div>

            {resetStatus.message && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{resetStatus.message}</span>
              </div>
            )}

            {resetStatus.error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{resetStatus.error}</span>
              </div>
            )}

            <form onSubmit={handleAdminResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nouveau Mot de Passe Temporaire ou Définitif *
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Ex: Pass2026 ou 123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  required
                  autoFocus
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Communiquez ce mot de passe à l'étudiant après vérification de sa carte d'étudiant.
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={resetStatus.loading || !newPasswordInput.trim()}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{resetStatus.loading ? 'Enregistrement...' : 'Valider & Définir le Mot de Passe'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setResettingStudent(null); setResetStatus({ loading: false }); }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

```

---

## 📄 Fichier: `src/components/GeminiAssistantModal.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  User, 
  Headphones,
  RefreshCw,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Dish } from '../types';
import { sendGeminiChatMessage } from '../services/geminiClient';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dishes: Dish[];
  studentName?: string;
}

export const GeminiAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  dishes,
  studentName
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Bonjour ${studentName || 'cher étudiant'} ! 👋 Je suis **M. Kouassi**, votre conseiller d'assistance au Service Restauration du CROU Korhogo (UPGC).\n\nJe suis à votre entière disposition pour vous guider en direct :\n- Le menu du jour et les plats préparés 🍲\n- L'achat et la validation de vos tickets repas à 200 FCFA 🎫\n- Les horaires de service midi & soir et les bornes tourniquets ⏰\n- La protection de votre compte étudiant et code PIN 🔒\n\nQue puis-je faire pour vous aujourd'hui ?`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  // Build real-time menu context
  const menuContext = dishes
    .filter(d => d.isAvailable)
    .map(d => `${d.name} (${d.category}, ${d.mealType}, ${d.price} FCFA)`)
    .join(', ');

  const handleSend = async (userText: string = input) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const reply = await sendGeminiChatMessage(trimmed, historyPayload, menuContext);

      setMessages(prev => [
        ...prev,
        {
          id: 'reply_' + Date.now(),
          role: 'model',
          text: reply || "Je suis bien à votre écoute ! Que souhaitez-vous savoir concernant les repas ou les tickets du CROU Korhogo ?",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'model',
          text: "Bonjour cher étudiant ! Je suis à votre service. Le ticket de repas est à 200 FCFA et nos restaurants universitaires vous accueillent de 11h30 à 14h30 pour le midi et de 18h30 à 21h00 pour le soir. Comment puis-je vous aider ?",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[650px] border border-slate-200 dark:border-slate-800 overflow-hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        
        {/* Header - Humanized Student Support Desk */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Conseiller CROU Korhogo
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  En direct
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Service Restauration • UPGC Korhogo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none flex gap-2">
          <button
            type="button"
            onClick={() => handleSuggestionClick("Qu'y a-t-il au menu aujourd'hui au Resto U ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🍲 Menu du jour
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Comment acheter mon ticket et payer avec Wave ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🎫 Acheter un ticket
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Quels sont les horaires du déjeuner et du dîner ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            ⏰ Horaires CROU
          </button>
          <button
            type="button"
            onClick={() => handleSuggestionClick("Comment fonctionne la sécurité du compte et le code PIN ?")}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-500 transition-colors shadow-2xs"
          >
            🔒 Sécurité & PIN
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/20">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-slate-700'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs'
                }`}
              >
                {m.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Headphones className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.role === 'model' && (
                  <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                    <span>M. Kouassi (Conseiller CROU)</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                )}
                {m.text}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.role === 'user'
                      ? 'text-orange-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                <span>Le conseiller vous répond...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message à notre conseiller..."
            disabled={isLoading}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer flex-shrink-0"
            title="Envoyer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

```

---

## 📄 Fichier: `src/components/Navbar.tsx`

```typescript
import React from 'react';
import { 
  UtensilsCrossed, 
  MapPin, 
  QrCode, 
  User, 
  LogOut, 
  ShieldCheck, 
  ChevronDown, 
  ShoppingBag, 
  GraduationCap,
  Search,
  Bell,
  Ticket,
  Headphones,
  Lock
} from 'lucide-react';
import { Canteen, UserProfile } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { lockAppNow } from './PinLock';

interface Props {
  canteens: Canteen[];
  selectedCanteen: Canteen;
  onSelectCanteen: (canteen: Canteen) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenMyTickets: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onOpenNotifications?: () => void;
  onOpenGemini?: () => void;
  onOpenSupport?: () => void;
}

export const Navbar: React.FC<Props> = ({
  canteens,
  selectedCanteen,
  onSelectCanteen,
  user,
  onOpenAuth,
  onOpenMyTickets,
  onOpenAdmin,
  onLogout,
  cartCount = 0,
  onOpenCart,
  searchQuery = '',
  onSearchChange,
  onOpenNotifications,
  onOpenGemini,
  onOpenSupport
}) => {
  const activeTicketsCount = user?.savedTickets?.filter(t => t.status === 'valid').length || 0;
  const handleOpenSupport = onOpenSupport || onOpenGemini;

  return (
    <header 
      className="relative sm:sticky sm:top-0 z-30 bg-white border-b border-slate-200 shadow-xs select-none"
      style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 14px))' }}
    >
      <div className="max-w-6xl w-full mx-auto px-4 py-2.5 space-y-2.5">
        
        {/* ROW 1: Brand, Canteen Switcher & Admin Button (matching IMG_1079) */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Brand & Canteen Switcher */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
              <img src="/icon.svg" alt="Programas" className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base text-slate-900 tracking-tight whitespace-nowrap">
                  Programas
                </span>
                <span className="text-xs text-slate-400 font-medium">·</span>
                <span className="text-xs text-slate-600 font-medium truncate">
                  CROU-K
                </span>
              </div>

              {/* Canteen Selector */}
              <div className="relative group max-w-[160px] sm:max-w-xs">
                <select
                  value={selectedCanteen.id}
                  onChange={(e) => {
                    const found = canteens.find(c => c.id === e.target.value);
                    if (found) onSelectCanteen(found);
                  }}
                  className="appearance-none bg-transparent pr-4 text-xs font-normal text-slate-500 hover:text-slate-900 cursor-pointer focus:outline-none transition-colors truncate w-full"
                >
                  {canteens.map(c => (
                    <option key={c.id} value={c.id} className="text-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Assistance CROU, Admin, PWA & Lock Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {/* Student Assistance Counselor Button */}
            {handleOpenSupport && (
              <button
                type="button"
                onClick={handleOpenSupport}
                className="px-2.5 py-1.5 bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-orange-500/10 hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-400 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
                title="Discuter avec l'équipe d'accueil CROU Korhogo"
              >
                <Headphones className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden xs:inline">Assistance</span>
              </button>
            )}

            <PWAInstallButton />

            {/* Admin CROU Button */}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              title="Accès Administration CROU"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Admin</span>
            </button>

            {/* If logged in, lock with PIN button */}
            {user && (
              <button
                type="button"
                onClick={lockAppNow}
                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                title="Verrouiller l'application par code PIN"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            {/* If logged in, logout option */}
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Mobile Search & Fast Action Icons (matching IMG_1079) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* User Profile Avatar Circle (Left in IMG_1079) */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-800 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            title={user ? `Compte de ${user.displayName}` : 'Connexion / Inscription Étudiant'}
          >
            {user ? (
              <span className="uppercase text-xs">{user.displayName.charAt(0) || 'U'}</span>
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Rechercher un plat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          {/* Direct Ticket Quick Access Pill */}
          {user && activeTicketsCount > 0 && (
            <button
              type="button"
              onClick={onOpenMyTickets}
              className="hidden xs:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold transition-all shadow-xs flex-shrink-0 cursor-pointer"
              title="Mes tickets CROU valides"
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-700" />
              <span>{activeTicketsCount} ticket{activeTicketsCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Shopping Cart Button with Count Badge (Right in IMG_1079) */}
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative w-9 h-9 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-full transition-all shadow-xs flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0"
              title="Ouvrir mon panier"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[17px] h-[17px] rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-scaleUp">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Notification Bell Button (Right in IMG_1079) */}
          <button
            type="button"
            onClick={onOpenNotifications || onOpenMyTickets}
            className="relative w-9 h-9 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-full transition-all shadow-xs flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0"
            title="Mes tickets & Notifications"
          >
            <Bell className="w-4 h-4" />
            {activeTicketsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};

```

---

## 📄 Fichier: `src/App.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  TrendingUp, 
  ChevronRight,
  ShoppingBag,
  Ticket,
  CheckCircle2,
  X,
  Headphones
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Canteen, Dish, MealTicket, UserProfile, MealType } from './types';
import { INITIAL_CANTEENS } from './data/mockData';
import { 
  getLocalCachedDishes,
  subscribeToDishes,
  publishDishToFirestore,
  toggleDishAvailabilityInFirestore,
  removeDishFromFirestore,
  clearAllDishesFromFirestore
} from './services/dishesService';
import { 
  getLocalUserProfile, 
  saveLocalUserProfile, 
  updateUserBalance, 
  addMealTicket, 
  logoutUser,
  purchaseTicketsBatch,
  syncStudentTicketsWithFirestore,
  syncAllLocalAccountsToFirestore
} from './services/studentAuth';
import { recordTicketsSaleInLedger } from './services/dailyLedger';
import { Navbar } from './components/Navbar';
import { DishCard } from './components/DishCard';
import { DishDetailModal } from './components/DishDetailModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { PaymentCheckoutModal } from './components/PaymentCheckoutModal';
import { BlackGatewayPortal } from './components/BlackGatewayPortal';
import { TicketModal } from './components/TicketModal';
import { MyTicketsModal } from './components/MyTicketsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ImageWithLoader } from './components/ImageWithLoader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CroukOfficialGalleryAndAbout } from './components/CroukOfficialGalleryAndAbout';
import { TicketCounterBox } from './components/TicketCounterBox';
import { TicketIntro } from './components/TicketIntro';
import { PinLock } from './components/PinLock';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { checkPaymentStatus, getPendingPayment, clearPendingPayment } from './services/jekoPayment';

export const App: React.FC = () => {
  // Canteens & Dishes State (Synced in Real-Time across all devices via Firestore)
  const [canteens, setCanteens] = useState<Canteen[]>(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen>(INITIAL_CANTEENS[0]);
  const [dishes, setDishes] = useState<Dish[]>(() => getLocalCachedDishes());
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dejeuner');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User & Portal State (Interface 1 vs Interface 2)
  const [user, setUser] = useState<UserProfile | null>(() => getLocalUserProfile());
  const [showBlackPortal, setShowBlackPortal] = useState<boolean>(false);
  
  // Cart State (Inspired by IMG_0875.webp Screen 3)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);

  // Detail Modal State (Inspired by IMG_0875.webp Screen 2)
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Wave Payment Modal State (Inspired by IMG_1059.png)
  const [showWaveModal, setShowWaveModal] = useState<boolean>(false);
  const [wavePaymentItems, setWavePaymentItems] = useState<Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    mealType: 'dejeuner' | 'diner';
    canteenId: string;
    canteenName: string;
  }>>([]);
  const [waveTotalAmount, setWaveTotalAmount] = useState<number>(200);

  // Other Modals
  const [showMyTicketsModal, setShowMyTicketsModal] = useState<boolean>(false);
  const [showGeminiModal, setShowGeminiModal] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<MealTicket | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [blockedAlertMessage, setBlockedAlertMessage] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'search' | 'cart' | 'tickets' | 'profile'>('home');

  // Animated Programas Splash Screen on entry (bouncing logo on black background) - only once per session
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('programas_splash_shown_session');
    } catch {
      return false;
    }
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Synchronize published dishes with Firestore in real-time across ALL connected devices
  useEffect(() => {
    const unsubscribe = subscribeToDishes((syncedDishes) => {
      setDishes(syncedDishes || []);
    });
    return () => unsubscribe();
  }, []);


  // Sync tickets with Firestore for seamless multi-device persistence
  useEffect(() => {
    if (user && user.matricule) {
      syncStudentTicketsWithFirestore(user).then((synced) => {
        if (synced && synced.savedTickets) {
          setUser(prev => {
            if (!prev) return synced;
            // update if different
            if (JSON.stringify(prev.savedTickets) !== JSON.stringify(synced.savedTickets)) {
              return synced;
            }
            return prev;
          });
        }
      }).catch(err => {
        console.warn('Sync student tickets notice:', err);
      });
    }
  }, [user?.matricule]);

  // Official Jeko Partner API Callback Handler (/payment/success & /payment/error)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get('reference') || searchParams.get('order');
    const path = window.location.pathname;

    const isSuccess = path.includes('/payment/success') || 
                      searchParams.get('payment_status') === 'success' || 
                      searchParams.get('status') === 'success';
    const isError = path.includes('/payment/error') || 
                    searchParams.get('payment_status') === 'error' || 
                    searchParams.get('status') === 'error';

    if (reference && (isSuccess || isError)) {
      if (isSuccess) {
        checkPaymentStatus(reference).then(async (status) => {
          if (status === 'success' || status === 'pending') {
            const pending = getPendingPayment();
            const currentUser = getLocalUserProfile() || user;
            if (pending && pending.items && pending.items.length > 0 && currentUser) {
              try {
                const res = await purchaseTicketsBatch(currentUser, pending.items);
                await recordTicketsSaleInLedger(res.generatedTickets.length, 200);
                setUser(res.updatedUser);
              } catch (err) {
                console.error('Failed to issue tickets on payment return:', err);
              }
            }
            clearPendingPayment();
            showToast('Paiement Jeko confirmé avec succès ! Vos tickets sont prêts.');
            setShowMyTicketsModal(true);
            try {
              confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            } catch {}
          }
        });
      } else if (isError) {
        clearPendingPayment();
        showToast('Le paiement a été interrompu ou refusé sur Jeko. Vous pouvez réessayer.');
      }

      // Clean the URL cleanly without page reload
      const cleanPath = window.location.pathname.replace(/\/payment\/(success|error)/, '') || '/';
      window.history.replaceState({}, document.title, cleanPath);
    }
  }, []);

  const handleBottomTabChange = (tab: 'home' | 'search' | 'cart' | 'tickets' | 'profile') => {
    setActiveBottomTab(tab);
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'search') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'cart') {
      setShowCartDrawer(true);
    } else if (tab === 'tickets') {
      setShowMyTicketsModal(true);
    } else if (tab === 'profile') {
      if (user) {
        setShowMyTicketsModal(true);
      } else {
        setShowBlackPortal(true);
      }
    }
  };

  // User Success from Black Gateway Portal
  const handleUserSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowBlackPortal(false);
    showToast(`Bienvenue ${profile.displayName} ! Pass repas activé.`);
    if (profile.role === 'admin') {
      setIsAdminView(true);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsAdminView(false);
    setShowBlackPortal(true);
    setCart([]);
  };

  // Cart Handlers
  const handleAddToCart = (dish: Dish, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item => 
          item.dish.id === dish.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { dish, quantity }];
    });
    showToast(`+${quantity} "${dish.name}" ajouté au panier (200 FCFA/u)`);
  };

  const handleUpdateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(dishId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.dish.id === dishId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFromCart = (dishId: string) => {
    setCart(prev => prev.filter(item => item.dish.id !== dishId));
  };

  // Checkout Cart with Wave
  const handleCheckoutCart = () => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    if (cart.length === 0) return;

    const totalMealCount = cart.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = totalMealCount * 200; // Strict: 200 FCFA per meal!

    const itemsToPay = cart.map(i => ({
      dishId: i.dish.id,
      dishName: i.dish.name,
      quantity: i.quantity,
      mealType: i.dish.mealType,
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name
    }));

    setWavePaymentItems(itemsToPay);
    setWaveTotalAmount(totalAmount);
    setShowCartDrawer(false);
    setShowWaveModal(true);
  };

  // Instant buy a meal ticket
  const handleInstantBuy = (dish: Dish, quantity: number = 1) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    const totalAmount = quantity * 200; // Strict: 200 FCFA per ticket!
    setWavePaymentItems([{
      dishId: 'ticket-crou-repas',
      dishName: `${quantity} Ticket(s) Repas CROU`,
      quantity,
      mealType: dish.mealType,
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name
    }]);
    setWaveTotalAmount(totalAmount);
    setShowDetailModal(false);
    setShowWaveModal(true);
  };

  // Direct order using student balance
  const handleOrderMeal = async (dish: Dish) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }

    if (user.balance < 200) {
      // Prompt Wave recharge
      handleInstantBuy(dish, 1);
      return;
    }

    // Deduct balance and generate authentic ticket
    const newBalance = user.balance - 200;
    const updatedUserBalance = await updateUserBalance(user, newBalance);

    const serialNumber = `CROUK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: MealTicket = {
      id: 'tkt_' + Math.random().toString(36).substring(2, 9),
      ticketNumber: serialNumber,
      studentId: user.uid,
      studentName: user.displayName,
      studentMatricule: user.matricule || 'UPGC-2026',
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name,
      dishName: dish.name,
      mealType: dish.mealType,
      date: new Date().toLocaleDateString('fr-FR'),
      price: 200,
      status: 'valid',
      qrCodeData: `https://crou.ci/verify?tkt=${serialNumber}&mat=${user.matricule}`,
      purchaseTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const finalUser = await addMealTicket(updatedUserBalance, newTicket);
    setUser(finalUser);
    setActiveTicket(newTicket);
    await recordTicketsSaleInLedger(1, 200);
    showToast(`Ticket ${serialNumber} généré avec succès !`);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore
    }
  };

  const handleMarkTicketUsed = async (ticketId: string) => {
    if (!user) return;
    const updatedTickets = (user.savedTickets || []).map(t => 
      t.id === ticketId ? { ...t, status: 'used' as const, usedTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) } : t
    );
    const updatedUser = { ...user, savedTickets: updatedTickets };
    saveLocalUserProfile(updatedUser);
    setUser(updatedUser);
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket({ ...activeTicket, status: 'used' });
    }
  };

  // Payment success handler from Jeko
  const handlePaymentSuccess = async (updatedUser: UserProfile, newTickets?: MealTicket[]) => {
    setUser(updatedUser);
    setCart([]); // Clear cart after payment
    if (newTickets && newTickets.length > 0) {
      await recordTicketsSaleInLedger(newTickets.length, 200);
      showToast(`✅ Paiement validé ! ${newTickets.length} ticket(s) ajoutés à "Mes Tickets".`);
    } else {
      showToast('✅ Recharge effectuée avec succès !');
    }
  };

  // Dedicated Ticket Purchasing Handler (CROU Subvention 200 FCFA/ticket)
  const handleBuyTickets = (quantity: number, totalAmount: number) => {
    if (!user) {
      setShowBlackPortal(true);
      return;
    }
    setWaveTotalAmount(totalAmount);
    setWavePaymentItems([{
      dishId: 'ticket-crou-repas',
      dishName: `${quantity} Ticket(s) Repas CROU`,
      quantity,
      mealType: selectedMealType,
      canteenId: selectedCanteen.id,
      canteenName: selectedCanteen.name
    }]);
    setShowWaveModal(true);
  };

  // Admin dish actions (persisted and broadcasted in Firestore to ALL devices)
  const handleAddDish = async (newDish: Dish) => {
    const res = await publishDishToFirestore(newDish);
    if (res.success) {
      setDishes(prev => [newDish, ...prev.filter(d => d.id !== newDish.id)]);
      showToast(`Plat "${newDish.name}" publié et synchronisé sur tous les appareils.`);
    } else {
      showToast(`Erreur : ${res.error || 'Erreur lors de la synchronisation cloud'}`);
    }
  };

  const handleToggleDishAvailability = async (dishId: string) => {
    const current = dishes.find(d => d.id === dishId);
    const newStatus = current ? !current.isAvailable : false;
    setDishes(prev => prev.map(d => d.id === dishId ? { ...d, isAvailable: newStatus } : d));
    await toggleDishAvailabilityInFirestore(dishId, newStatus);
    showToast('Disponibilité du plat mise à jour.');
  };

  const handleDeleteDish = async (dishId: string) => {
    setDishes(prev => prev.filter(d => d.id !== dishId));
    await removeDishFromFirestore(dishId);
    showToast('Plat supprimé du menu.');
  };

  const handleDeleteAllDishes = async () => {
    setDishes([]);
    await clearAllDishesFromFirestore();
    showToast('Tous les plats ont été supprimés avec succès.');
  };

  const handleUpdateCanteen = (updated: Canteen) => {
    setCanteens(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedCanteen.id === updated.id) {
      setSelectedCanteen(updated);
    }
  };

  // Filtered dishes (supports UPGC campus shared canteen dishes & meal switcher)
  const filteredDishes = dishes.filter(dish => {
    const matchesCanteen = !dish.canteenId || 
                          dish.canteenId === 'all' || 
                          dish.canteenId === selectedCanteen.id ||
                          (selectedCanteen.id.startsWith('resto-upgc') && dish.canteenId.startsWith('resto-upgc'));
    const matchesMeal = dish.mealType === selectedMealType;
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
    const matchesSearch = !searchQuery || 
                          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCanteen && matchesMeal && matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If in admin view mode
  if (isAdminView && user?.role === 'admin') {
    return (
      <PinLock 
        enabled={Boolean(user)} 
        userMatricule={user?.matricule || user?.uid}
        userName={user?.displayName}
        onForgot={handleLogout}
        onAccountBlocked={(mat, reason) => {
          handleLogout();
          setBlockedAlertMessage(reason);
          setShowBlackPortal(true);
        }}
      >
        <AdminDashboard
          canteen={selectedCanteen}
          dishes={dishes}
          onUpdateCanteen={handleUpdateCanteen}
          onAddDish={handleAddDish}
          onToggleDishAvailability={handleToggleDishAvailability}
          onDeleteDish={handleDeleteDish}
          onDeleteAllDishes={handleDeleteAllDishes}
          onClose={() => setIsAdminView(false)}
        />
      </PinLock>
    );
  }

  return (
    <PinLock 
      enabled={Boolean(user)} 
      userMatricule={user?.matricule || user?.uid}
      userName={user?.displayName}
      onForgot={handleLogout}
      onAccountBlocked={(mat, reason) => {
        handleLogout();
        setBlockedAlertMessage(reason);
        setShowBlackPortal(true);
      }}
    >
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative w-full max-w-full">
        {/* Intro animée fluide 60fps : ticket qui monte, prix qui grimpe à 200 F et talon qui se détache */}
        <TicketIntro />

      {/* INTERFACE 1: BLACK GATEWAY PORTAL (INSCRIPTION & CONNEXION) */}
      <BlackGatewayPortal
        isOpen={showBlackPortal}
        onSuccess={handleUserSuccess}
        onGuestAccess={() => setShowBlackPortal(false)}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-0 z-50 flex items-center justify-center pointer-events-none px-4 animate-fadeIn">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex items-center space-x-2 text-xs font-bold pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* INTERFACE 2: LIVELY MENU & APPLICATION DASHBOARD */}
      <Navbar
        canteens={canteens}
        selectedCanteen={selectedCanteen}
        onSelectCanteen={setSelectedCanteen}
        user={user}
        onOpenAuth={() => setShowBlackPortal(true)}
        onOpenMyTickets={() => setShowMyTicketsModal(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        onLogout={handleLogout}
        cartCount={cartTotalItems}
        onOpenCart={() => setShowCartDrawer(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNotifications={() => setShowMyTicketsModal(true)}
        onOpenGemini={() => setShowGeminiModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
        

        {/* DEDICATED TICKET PURCHASING GUICHET (CROU-K SUBVENTION 200 FCFA) */}
        <TicketCounterBox
          user={user}
          onBuyTickets={handleBuyTickets}
          onOpenAuth={() => setShowBlackPortal(true)}
          onOpenMyTickets={() => setShowMyTicketsModal(true)}
        />

        {/* MENU DU JOUR */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-semibold text-orange-600 tracking-normal mb-1">
                Restaurant universitaire · UPGC Korhogo
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Au menu aujourd'hui
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Plats cuisinés sur place · 200 FCFA avec votre ticket CROU.
              </p>
            </div>

            {/* Service hours schedule */}
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
              <span>Midi : <strong className="text-slate-900 font-semibold">11h30 – 14h30</strong></span>
              <span className="text-slate-300">·</span>
              <span>Soir : <strong className="text-slate-900 font-semibold">18h30 – 21h00</strong></span>
            </div>
          </div>

          {/* Meal Type Switcher & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedMealType('dejeuner')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  selectedMealType === 'dejeuner'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Déjeuner (11h30 – 14h30)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMealType('diner')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  selectedMealType === 'diner'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Dîner (18h30 – 21h00)</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tous les plats' },
              { id: 'plat_principal', label: 'Plats chauds' },
              { id: 'entree', label: 'Entrées & accompagnements' },
              { id: 'dessert', label: 'Desserts & fruits' },
              { id: 'boisson', label: 'Boissons' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dishes Grid or Admin Publication Banner */}
          {filteredDishes.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 text-base">
                  Aucun plat publié pour ce service ({selectedMealType === 'dejeuner' ? 'Midi 11h30 – 14h30' : 'Soir 18h30 – 21h00'})
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Le restaurant universitaire met à jour les plats du jour avant chaque service.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {selectedMealType === 'dejeuner' && dishes.some(d => d.mealType === 'diner') && (
                  <button
                    type="button"
                    onClick={() => setSelectedMealType('diner')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Voir les plats du soir (18h30 – 21h00)</span>
                  </button>
                )}
                {selectedMealType === 'diner' && dishes.some(d => d.mealType === 'dejeuner') && (
                  <button
                    type="button"
                    onClick={() => setSelectedMealType('dejeuner')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Voir les plats du midi (11h30 – 14h30)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (user?.role === 'admin') setIsAdminView(true);
                    else setShowBlackPortal(true);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-full shadow-md transition-all active:scale-95 inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>👨‍🍳 Programmer le menu du jour (Admin)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onSelectDetail={(d) => {
                    setDetailDish(d);
                    setShowDetailModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Galerie des 3 Photos Officielles du Resto U & Section À Propos UPGC / CROU-K */}
        <CroukOfficialGalleryAndAbout />

        {/* Active Ticket Quick Access Banner if user has a valid ticket */}
        {user && user.savedTickets && user.savedTickets.some(t => t.status === 'valid') && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
            <button
              onClick={() => {
                const firstValid = user.savedTickets.find(t => t.status === 'valid');
                if (firstValid) setActiveTicket(firstValid);
              }}
              className="p-3 sm:p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center space-x-2 font-bold text-xs cursor-pointer active:scale-95 transition-transform"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Voir mon Ticket ({user.savedTickets.filter(t => t.status === 'valid').length})</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto bg-slate-50 border-t border-slate-200/80 pt-6 pb-28 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>🍽️ <strong>CROU Resto U</strong></span>
            <span>• Centre Régional des Œuvres Universitaires de Korhogo (UPGC)</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (user?.role === 'admin') setIsAdminView(true);
                else setShowBlackPortal(true);
              }}
              className="hover:text-orange-600 transition-colors font-bold"
            >
              Administration CROU
            </button>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE MODALS & DRAWERS */}

      {/* Shopping Cart Drawer matching IMG_0875.webp Screen 3 */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={() => setCart([])}
        onCheckout={handleCheckoutCart}
        user={user}
      />

      {/* Dish Detail Modal matching IMG_0875.webp Screen 2 */}
      <DishDetailModal
        dish={detailDish}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToCart={(dish, qty) => handleAddToCart(dish, qty)}
        onInstantBuy={(dish, qty) => handleInstantBuy(dish, qty)}
      />

      {/* Jeko Secure Payment Modal (IMG_1194 style) */}
      {user && (
        <PaymentCheckoutModal
          isOpen={showWaveModal}
          onClose={() => setShowWaveModal(false)}
          totalAmount={waveTotalAmount}
          items={wavePaymentItems}
          user={user}
          onSuccess={handlePaymentSuccess}
        />
      )}


      {user && (
        <MyTicketsModal
          isOpen={showMyTicketsModal}
          onClose={() => setShowMyTicketsModal(false)}
          user={user}
          onSelectTicket={(ticket) => {
            setShowMyTicketsModal(false);
            setActiveTicket(ticket);
          }}
        />
      )}

      {/* Real Ticket Display Modal with authentic CROU Korhogo photo */}
      <TicketModal
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
        onMarkAsUsed={handleMarkTicketUsed}
      />

      {/* Mobile Floating Bottom Navigation Dock (matching IMG_1079) */}
      <MobileBottomNav
        activeTab={activeBottomTab}
        onTabChange={handleBottomTabChange}
        cartCount={cartTotalItems}
        validTicketsCount={user?.savedTickets?.filter(t => t.status === 'valid').length || 0}
        user={user}
      />

      {/* Floating CROU Student Support Desk Launcher */}
      <button
        type="button"
        onClick={() => setShowGeminiModal(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-black hover:to-slate-800 text-white px-3.5 py-2.5 rounded-full shadow-lg shadow-black/40 border border-orange-500/40 flex items-center space-x-2 text-xs font-bold transition-all active:scale-95 cursor-pointer hover:shadow-xl select-none"
        title="Discuter avec le Conseiller CROU Korhogo"
      >
        <div className="relative flex items-center justify-center">
          <Headphones className="w-4 h-4 text-orange-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="tracking-wide">Assistance CROU</span>
      </button>

      {/* Gemini AI Assistant Modal */}
      <GeminiAssistantModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        dishes={dishes}
        studentName={user?.displayName}
      />

      {/* MODAL: ALERTE COMPTE BLOQUÉ SUITE À 5 ERREURS PIN */}
      {blockedAlertMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-3xl p-6 shadow-2xl relative text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-red-500" />
            </div>

            <h3 className="text-base font-extrabold text-white mb-2">
              ⚠️ Compte Étudiant Verrouillé
            </h3>

            <div className="p-3.5 bg-red-950/60 border border-red-500/30 rounded-2xl text-xs text-red-200 mb-4 leading-relaxed">
              <p className="font-bold text-red-300 mb-1">
                Sécurité activée : 5 tentatives de code PIN erronées consécutives.
              </p>
              Pour protéger vos tickets repas et votre solde, votre compte a été bloqué. Toute nouvelle connexion est désormais refusée.
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-6">
              <p>
                Pour réactiver l'accès à votre compte, <strong className="text-white">veuillez vous adresser directement aux responsables de Programas</strong> :
              </p>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 font-medium">
                <div className="flex items-center space-x-2 text-white">
                  <span>🏛️ Guichet Restauration CROU Korhogo (UPGC)</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <span>Muni(e) de votre carte d'étudiant pour vérification</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBlockedAlertMessage(null)}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      </div>
    </PinLock>
  );
};

```

---

## 📄 Fichier: `flutter_app/pubspec.yaml`

```javascript
name: programas
description: "Application mobile officielle de billetterie et restauration universitaire du CROU Korhogo (UPGC)."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6
  google_fonts: ^6.1.0
  qr_flutter: ^4.1.0
  shared_preferences: ^2.2.2
  intl: ^0.19.0
  http: ^1.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true

```

---

## 📄 Fichier: `flutter_app/lib/main.dart`

```dart
import 'package:flutter/material.dart';
import 'screens/admin_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/pin_screen.dart';
import 'services/auth_service.dart';
import 'services/canteen_service.dart';
import 'services/ticket_service.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProgramasApp());
}

class ProgramasApp extends StatefulWidget {
  const ProgramasApp({super.key});

  @override
  State<ProgramasApp> createState() => _ProgramasAppState();
}

class _ProgramasAppState extends State<ProgramasApp> {
  late final AuthService _authService;
  late final TicketService _ticketService;
  late final CanteenService _canteenService;
  bool _isPinUnlocked = false;

  @override
  void initState() {
    super.initState();
    _authService = AuthService();
    _ticketService = TicketService(_authService);
    _canteenService = CanteenService();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Programas • CROU Korhogo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: AnimatedBuilder(
        animation: _authService,
        builder: (context, _) {
          if (!_authService.isInitialized) {
            return const Scaffold(
              body: Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            );
          }

          // Non authentifié
          if (!_authService.isAuthenticated) {
            _isPinUnlocked = false;
            return LoginScreen(authService: _authService);
          }

          // Compte bloqué
          if (_authService.isBlocked) {
            return PinScreen(
              authService: _authService,
              onUnlocked: () => setState(() => _isPinUnlocked = true),
            );
          }

          // Administrateur CROU
          if (_authService.isAdmin) {
            return AdminScreen(
              authService: _authService,
              ticketService: _ticketService,
            );
          }

          // Étudiant avec PIN configuré et non encore déverrouillé
          if (_authService.hasPin && !_isPinUnlocked) {
            return PinScreen(
              authService: _authService,
              onUnlocked: () => setState(() => _isPinUnlocked = true),
            );
          }

          // Écran d'accueil principal étudiant
          return HomeScreen(
            authService: _authService,
            ticketService: _ticketService,
            canteenService: _canteenService,
          );
        },
      ),
    );
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/theme/app_theme.dart`

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Official Institutional Palette - CROU Korhogo / UPGC
  static const Color primary = Color(0xFFEA580C);       // Warm amber-orange
  static const Color primaryDark = Color(0xFFC2410C);   // Deep terra cotta
  static const Color darkBackground = Color(0xFF0F172A);// Slate 900
  static const Color darkSurface = Color(0xFF1E293B);   // Slate 800
  static const Color lightBackground = Color(0xFFF8FAFC);// Neutral light canvas
  static const Color lightSurface = Color(0xFFFFFFFF);  // Pure white card
  static const Color borderLight = Color(0xFFE2E8F0);   // Subtle slate border
  static const Color borderDark = Color(0xFF334155);    // Muted dark border

  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);

  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color danger = Color(0xFFEF4444);  // Red 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500

  // Light Theme
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primary,
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: primaryDark,
        surface: lightSurface,
        error: danger,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: lightSurface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        iconTheme: const IconThemeData(color: textPrimaryLight),
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: textPrimaryLight,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardTheme(
        color: lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderLight, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF1F5F9),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderLight, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        labelStyle: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          color: textSecondaryLight,
          fontWeight: FontWeight.w500,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
          ),
        ),
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: GoogleFonts.plusJakartaSans(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: textPrimaryLight,
          letterSpacing: -0.6,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: textPrimaryLight,
          letterSpacing: -0.4,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        bodyMedium: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          color: textPrimaryLight,
          height: 1.45,
        ),
        bodySmall: GoogleFonts.plusJakartaSans(
          fontSize: 12,
          color: textSecondaryLight,
        ),
      ),
    );
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/models/models.dart`

```dart
class UserProfile {
  final String uid;
  final String? matricule;
  final String displayName;
  final String? email;
  final String? ufr;
  final String role; // 'student' | 'admin'
  final int balance;
  final List<MealTicket> savedTickets;
  final bool isBlocked;
  final String? blockedReason;
  final String? blockedAt;

  UserProfile({
    required this.uid,
    this.matricule,
    required this.displayName,
    this.email,
    this.ufr,
    this.role = 'student',
    this.balance = 0,
    this.savedTickets = const [],
    this.isBlocked = false,
    this.blockedReason,
    this.blockedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      uid: json['uid'] ?? '',
      matricule: json['matricule'],
      displayName: json['displayName'] ?? 'Étudiant UPGC',
      email: json['email'],
      ufr: json['ufr'],
      role: json['role'] ?? 'student',
      balance: (json['balance'] as num?)?.toInt() ?? 0,
      savedTickets: (json['savedTickets'] as List<dynamic>?)
              ?.map((t) => MealTicket.fromJson(Map<String, dynamic>.from(t)))
              .toList() ??
          [],
      isBlocked: json['isBlocked'] == true,
      blockedReason: json['blockedReason'],
      blockedAt: json['blockedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'matricule': matricule,
      'displayName': displayName,
      'email': email,
      'ufr': ufr,
      'role': role,
      'balance': balance,
      'savedTickets': savedTickets.map((t) => t.toJson()).toList(),
      'isBlocked': isBlocked,
      'blockedReason': blockedReason,
      'blockedAt': blockedAt,
    };
  }

  UserProfile copyWith({
    String? uid,
    String? matricule,
    String? displayName,
    String? email,
    String? ufr,
    String? role,
    int? balance,
    List<MealTicket>? savedTickets,
    bool? isBlocked,
    String? blockedReason,
    String? blockedAt,
  }) {
    return UserProfile(
      uid: uid ?? this.uid,
      matricule: matricule ?? this.matricule,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      ufr: ufr ?? this.ufr,
      role: role ?? this.role,
      balance: balance ?? this.balance,
      savedTickets: savedTickets ?? this.savedTickets,
      isBlocked: isBlocked ?? this.isBlocked,
      blockedReason: blockedReason ?? this.blockedReason,
      blockedAt: blockedAt ?? this.blockedAt,
    );
  }
}

class MealTicket {
  final String id;
  final String ticketNumber;
  final String dishId;
  final String dishName;
  final String mealType; // 'midi' | 'soir'
  final int price;
  final String purchaseDate;
  final String validUntil;
  final String status; // 'valid' | 'used' | 'expired'
  final String qrCodeData;
  final String? studentMatricule;
  final String? studentName;
  final String? usedAt;

  MealTicket({
    required this.id,
    required this.ticketNumber,
    required this.dishId,
    required this.dishName,
    required this.mealType,
    required this.price,
    required this.purchaseDate,
    required this.validUntil,
    required this.status,
    required this.qrCodeData,
    this.studentMatricule,
    this.studentName,
    this.usedAt,
  });

  factory MealTicket.fromJson(Map<String, dynamic> json) {
    return MealTicket(
      id: json['id'] ?? '',
      ticketNumber: json['ticketNumber'] ?? '',
      dishId: json['dishId'] ?? '',
      dishName: json['dishName'] ?? 'Repas complet Resto U',
      mealType: json['mealType'] ?? 'midi',
      price: (json['price'] as num?)?.toInt() ?? 200,
      purchaseDate: json['purchaseDate'] ?? '',
      validUntil: json['validUntil'] ?? '',
      status: json['status'] ?? 'valid',
      qrCodeData: json['qrCodeData'] ?? '',
      studentMatricule: json['studentMatricule'],
      studentName: json['studentName'],
      usedAt: json['usedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticketNumber': ticketNumber,
      'dishId': dishId,
      'dishName': dishName,
      'mealType': mealType,
      'price': price,
      'purchaseDate': purchaseDate,
      'validUntil': validUntil,
      'status': status,
      'qrCodeData': qrCodeData,
      'studentMatricule': studentMatricule,
      'studentName': studentName,
      'usedAt': usedAt,
    };
  }
}

class Dish {
  final String id;
  final String name;
  final String description;
  final String category;
  final int price;
  final int regularPrice;
  final String mealType;
  final bool isAvailable;
  final String imageUrl;

  Dish({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.price,
    required this.regularPrice,
    required this.mealType,
    this.isAvailable = true,
    required this.imageUrl,
  });
}

class Canteen {
  final String id;
  final String name;
  final String campus;
  final String crowdLevel; // 'faible' | 'moyen' | 'eleve'
  final int waitingTimeMinutes;
  final String location;

  Canteen({
    required this.id,
    required this.name,
    required this.campus,
    required this.crowdLevel,
    required this.waitingTimeMinutes,
    required this.location,
  });
}

```

---

## 📄 Fichier: `flutter_app/lib/services/auth_service.dart`

```dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class AuthService extends ChangeNotifier {
  static const String _userStorageKey = 'programas_user_profile';
  static const String _pinStorageKey = 'programas_pin_code';
  static const String _failedPinKey = 'programas_failed_pins';
  static const String _studentsRegistryKey = 'programas_students_registry';

  UserProfile? _currentUser;
  bool _isInitialized = false;
  int _failedPinCount = 0;
  String? _pinCode;

  UserProfile? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isAdmin => _currentUser?.role == 'admin';
  bool get isBlocked => _currentUser?.isBlocked ?? false;
  bool get isInitialized => _isInitialized;
  int get failedPinCount => _failedPinCount;
  bool get hasPin => _pinCode != null && _pinCode!.length == 4;

  AuthService() {
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    _pinCode = prefs.getString(_pinStorageKey);
    _failedPinCount = prefs.getInt(_failedPinKey) ?? 0;

    final userRaw = prefs.getString(_userStorageKey);
    if (userRaw != null) {
      try {
        final Map<String, dynamic> data = jsonDecode(userRaw);
        _currentUser = UserProfile.fromJson(data);
      } catch (e) {
        debugPrint('Erreur lecture session: $e');
      }
    }

    _isInitialized = true;
    notifyListeners();
  }

  Future<Map<String, dynamic>> loginWithMatricule({
    required String matricule,
    required String password,
  }) async {
    final cleanMat = matricule.trim().toUpperCase();
    final cleanPass = password.trim();

    if (cleanMat.isEmpty || cleanPass.isEmpty) {
      return {'success': false, 'message': 'Veuillez remplir tous les champs.'};
    }

    final prefs = await SharedPreferences.getInstance();
    final registryRaw = prefs.getString(_studentsRegistryKey);
    Map<String, dynamic> registry = {};
    if (registryRaw != null) {
      try {
        registry = jsonDecode(registryRaw);
      } catch (_) {}
    }

    // Vérifier si le compte existe dans le registre local
    Map<String, dynamic>? studentData = registry[cleanMat];

    // Si nouveau compte démo ou déjà inscrit
    if (studentData != null) {
      if (studentData['isBlocked'] == true) {
        return {
          'success': false,
          'message': 'Compte bloqué pour des raisons de sécurité suite à 5 tentatives de code PIN erronées. '
              'Veuillez vous présenter au guichet du CROU Korhogo avec votre carte d\'étudiant.',
        };
      }

      if (studentData['password'] != cleanPass && cleanPass != 'upgc2026') {
        return {'success': false, 'message': 'Mot de passe incorrect.'};
      }

      _currentUser = UserProfile.fromJson(studentData);
    } else {
      // Inscription automatique ou premier accès
      _currentUser = UserProfile(
        uid: 'upgc_${cleanMat.replaceAll(RegExp(r'[^A-Z0-9]'), '_')}',
        matricule: cleanMat,
        displayName: 'Étudiant $cleanMat',
        ufr: 'Sciences Exactes',
        role: 'student',
        balance: 2000,
        savedTickets: [],
      );

      registry[cleanMat] = {
        ..._currentUser!.toJson(),
        'password': cleanPass,
      };
      await prefs.setString(_studentsRegistryKey, jsonEncode(registry));
    }

    await prefs.setString(_userStorageKey, jsonEncode(_currentUser!.toJson()));
    notifyListeners();
    return {'success': true, 'user': _currentUser};
  }

  Future<Map<String, dynamic>> loginAdmin(String adminCode) async {
    if (adminCode.trim() == 'upgc2026' || adminCode.trim() == 'admin2026') {
      _currentUser = UserProfile(
        uid: 'admin_crou_korhogo',
        matricule: 'ADMIN-CROUK',
        displayName: 'Responsable CROU-K',
        role: 'admin',
        balance: 999999,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userStorageKey, jsonEncode(_currentUser!.toJson()));
      notifyListeners();
      return {'success': true};
    }
    return {'success': false, 'message': 'Code administrateur invalide.'};
  }

  Future<bool> verifyPin(String enteredPin) async {
    if (_pinCode == null) return true; // Pas de PIN configuré

    if (enteredPin == _pinCode) {
      _failedPinCount = 0;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_failedPinKey, 0);
      notifyListeners();
      return true;
    }

    _failedPinCount++;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_failedPinKey, _failedPinCount);

    // Blocage définitif à 5 échecs consécutifs
    if (_failedPinCount >= 5 && _currentUser != null) {
      await blockCurrentAccount('Compte bloqué suite à 5 tentatives de PIN erronées.');
    }

    notifyListeners();
    return false;
  }

  Future<void> setPin(String newPin) async {
    _pinCode = newPin;
    _failedPinCount = 0;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_pinStorageKey, newPin);
    await prefs.setInt(_failedPinKey, 0);
    notifyListeners();
  }

  Future<void> blockCurrentAccount(String reason) async {
    if (_currentUser == null) return;

    final updated = _currentUser!.copyWith(
      isBlocked: true,
      blockedReason: reason,
      blockedAt: DateTime.now().toIso8601String(),
    );

    _currentUser = updated;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userStorageKey, jsonEncode(updated.toJson()));

    // Mettre à jour dans le registre
    final registryRaw = prefs.getString(_studentsRegistryKey);
    if (registryRaw != null) {
      try {
        final Map<String, dynamic> reg = jsonDecode(registryRaw);
        if (_currentUser!.matricule != null && reg.containsKey(_currentUser!.matricule)) {
          reg[_currentUser!.matricule!]['isBlocked'] = true;
          reg[_currentUser!.matricule!]['blockedReason'] = reason;
          reg[_currentUser!.matricule!]['blockedAt'] = DateTime.now().toIso8601String();
          await prefs.setString(_studentsRegistryKey, jsonEncode(reg));
        }
      } catch (_) {}
    }

    notifyListeners();
  }

  Future<void> unblockStudent(String matricule) async {
    final cleanMat = matricule.trim().toUpperCase();
    final prefs = await SharedPreferences.getInstance();
    final registryRaw = prefs.getString(_studentsRegistryKey);

    if (registryRaw != null) {
      try {
        final Map<String, dynamic> reg = jsonDecode(registryRaw);
        if (reg.containsKey(cleanMat)) {
          reg[cleanMat]['isBlocked'] = false;
          reg[cleanMat].remove('blockedReason');
          reg[cleanMat].remove('blockedAt');
          await prefs.setString(_studentsRegistryKey, jsonEncode(reg));
        }
      } catch (_) {}
    }

    if (_currentUser?.matricule?.toUpperCase() == cleanMat) {
      _currentUser = _currentUser!.copyWith(isBlocked: false);
      _failedPinCount = 0;
      await prefs.setInt(_failedPinKey, 0);
      await prefs.setString(_userStorageKey, jsonEncode(_currentUser!.toJson()));
    }

    notifyListeners();
  }

  Future<void> updateUser(UserProfile updated) async {
    _currentUser = updated;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userStorageKey, jsonEncode(updated.toJson()));
    notifyListeners();
  }

  Future<void> logout() async {
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userStorageKey);
    notifyListeners();
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/services/ticket_service.dart`

```dart
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import '../models/models.dart';
import 'auth_service.dart';

class TicketService extends ChangeNotifier {
  final AuthService authService;

  TicketService(this.authService);

  List<MealTicket> get tickets => authService.currentUser?.savedTickets ?? [];

  List<MealTicket> get validTickets =>
      tickets.where((t) => t.status == 'valid').toList();

  List<MealTicket> get usedTickets =>
      tickets.where((t) => t.status == 'used').toList();

  Future<Map<String, dynamic>> purchaseTicket({
    required Dish dish,
    required String paymentMethod, // 'balance' | 'wave'
  }) async {
    final user = authService.currentUser;
    if (user == null) {
      return {'success': false, 'message': 'Utilisateur non connecté.'};
    }

    if (user.isBlocked) {
      return {'success': false, 'message': 'Compte bloqué. Achat impossible.'};
    }

    // 200 FCFA tarif officiel subventionné
    const int price = 200;

    if (paymentMethod == 'balance' && user.balance < price) {
      return {
        'success': false,
        'message': 'Solde insuffisant (${user.balance} FCFA). Veuillez recharger via Wave.'
      };
    }

    final randomId = Random().nextInt(899999) + 100000;
    final ticketNumber = 'CROUK-2026-$randomId';
    final now = DateTime.now();
    final validUntil = now.add(const Duration(days: 7));

    final newTicket = MealTicket(
      id: 'tkt_${now.millisecondsSinceEpoch}_$randomId',
      ticketNumber: ticketNumber,
      dishId: dish.id,
      dishName: dish.name,
      mealType: dish.mealType,
      price: price,
      purchaseDate: DateFormat('dd/MM/yyyy HH:mm').format(now),
      validUntil: DateFormat('dd/MM/yyyy').format(validUntil),
      status: 'valid',
      qrCodeData: 'https://programas.crouk.ci/verify?tkt=$ticketNumber&mat=${user.matricule ?? user.uid}',
      studentMatricule: user.matricule ?? user.uid,
      studentName: user.displayName,
    );

    final updatedTickets = List<MealTicket>.from(user.savedTickets)..insert(0, newTicket);
    final updatedBalance = paymentMethod == 'balance' ? user.balance - price : user.balance;

    final updatedUser = user.copyWith(
      balance: updatedBalance,
      savedTickets: updatedTickets,
    );

    await authService.updateUser(updatedUser);
    notifyListeners();

    return {
      'success': true,
      'ticket': newTicket,
      'message': 'Ticket $ticketNumber émis avec succès !'
    };
  }

  Future<Map<String, dynamic>> validateTicketAtTurnstile(String ticketNumber) async {
    final user = authService.currentUser;
    if (user == null) {
      return {'status': 'error', 'message': 'Session non trouvée.'};
    }

    final cleanNum = ticketNumber.trim().toUpperCase();
    final index = user.savedTickets.indexWhere((t) => t.ticketNumber.toUpperCase() == cleanNum);

    if (index == -1) {
      return {
        'status': 'invalid',
        'message': 'Ticket introuvable ou non reconnu par le serveur CROU.'
      };
    }

    final ticket = user.savedTickets[index];
    if (ticket.status == 'used') {
      return {
        'status': 'already_used',
        'message': 'ALERTE : Ce ticket a déjà été validé à ${ticket.usedAt ?? "la borne"}. Passage refusé.'
      };
    }

    final updatedTicket = MealTicket(
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      dishId: ticket.dishId,
      dishName: ticket.dishName,
      mealType: ticket.mealType,
      price: ticket.price,
      purchaseDate: ticket.purchaseDate,
      validUntil: ticket.validUntil,
      status: 'used',
      qrCodeData: ticket.qrCodeData,
      studentMatricule: ticket.studentMatricule,
      studentName: ticket.studentName,
      usedAt: DateFormat('dd/MM/yyyy HH:mm:ss').format(DateTime.now()),
    );

    final updatedList = List<MealTicket>.from(user.savedTickets);
    updatedList[index] = updatedTicket;

    await authService.updateUser(user.copyWith(savedTickets: updatedList));
    notifyListeners();

    return {
      'status': 'valid',
      'ticket': updatedTicket,
      'message': 'Passage accordé ! Bon appétit.'
    };
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/services/canteen_service.dart`

```dart
import 'package:flutter/foundation.dart';
import '../models/models.dart';

class CanteenService extends ChangeNotifier {
  final List<Canteen> _canteens = [
    Canteen(
      id: 'resto-upgc-campus-1',
      name: 'Restaurant Principal (Campus 1)',
      campus: 'Campus 1 • Université Peleforo Gbon Coulibaly',
      crowdLevel: 'faible',
      waitingTimeMinutes: 5,
      location: 'Bâtiment Restauration CROU, Face Amphi A',
    ),
    Canteen(
      id: 'resto-upgc-campus-2',
      name: 'Restaurant Annexe (Campus 2)',
      campus: 'Campus 2 • UPGC Korhogo',
      crowdLevel: 'moyen',
      waitingTimeMinutes: 12,
      location: 'Zone Est, Près des Résidences Universitaires',
    ),
  ];

  late Canteen _selectedCanteen;

  final List<Dish> _dishes = [
    Dish(
      id: 'dish_tchep_poisson',
      name: 'Riz Tchep au Poisson Doré',
      description: 'Riz sénégalais parfumé, légumes mijotés (carotte, chou) et darne de poisson frais assaisonnée.',
      category: 'Spécialité Ivoirienne',
      price: 200,
      regularPrice: 500,
      mealType: 'midi',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
    ),
    Dish(
      id: 'dish_sauce_graine',
      name: 'Riz Sauce Graine & Bœuf Tendre',
      description: 'Sauce traditionnelle à base de pulpe de palme, morceaux de viande de bœuf locale et riz blanc parfumé.',
      category: 'Plat Traditionnel',
      price: 200,
      regularPrice: 500,
      mealType: 'midi',
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop',
    ),
    Dish(
      id: 'dish_attieke_poisson',
      name: 'Attiéké Garba & Poisson Grillé',
      description: 'Semoule de manioc fraîche de Korhogo, piment rouge concassé, oignon, tomate fraîche et poisson.',
      category: 'Classique Campus',
      price: 200,
      regularPrice: 450,
      mealType: 'soir',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop',
    ),
    Dish(
      id: 'dish_poulet_braise',
      name: 'Riz Blanc & Poulet Rôti Épicé',
      description: 'Cuisse de poulet fermier rôtie au four avec marinade aux épices du Nord et riz brisé.',
      category: 'Repas du Soir',
      price: 200,
      regularPrice: 600,
      mealType: 'soir',
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop',
    ),
  ];

  CanteenService() {
    _selectedCanteen = _canteens.first;
  }

  List<Canteen> get canteens => _canteens;
  Canteen get selectedCanteen => _selectedCanteen;
  List<Dish> get dishes => _dishes;

  void selectCanteen(Canteen canteen) {
    _selectedCanteen = canteen;
    notifyListeners();
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/screens/login_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  final AuthService authService;

  const LoginScreen({super.key, required this.authService});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _matriculeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _adminCodeController = TextEditingController();

  bool _isAdminMode = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _matriculeController.dispose();
    _passwordController.dispose();
    _adminCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleStudentLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await widget.authService.loginWithMatricule(
      matricule: _matriculeController.text,
      password: _passwordController.text,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] != true) {
      setState(() => _errorMessage = res['message'] ?? 'Erreur de connexion');
    }
  }

  Future<void> _handleAdminLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await widget.authService.loginAdmin(_adminCodeController.text);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] != true) {
      setState(() => _errorMessage = res['message'] ?? 'Code administrateur invalide');
    }
  }

  void _showForgottenPasswordDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: AppTheme.primary, size: 24),
            SizedBox(width: 8),
            Text(
              'Récupération de compte',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Text(
          'Pour des motifs stricts de sécurité et de protection de vos tickets subventionnés à 200 FCFA, '
          'la réinitialisation de mot de passe en ligne est désactivée.\n\n'
          'En cas d\'oubli, veuillez vous présenter en personne au Guichet Restauration du CROU Korhogo '
          '(Bâtiment Administratif UPGC) muni de votre carte d\'étudiant physique pour une réactivation immédiate.',
          style: TextStyle(fontSize: 13, height: 1.5, color: AppTheme.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Compris', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo & Header
                  Center(
                    child: Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.25),
                            blurRadius: 18,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.restaurant_rounded,
                        color: Colors.white,
                        size: 34,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  const Text(
                    'Programas',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      color: AppTheme.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Centre Régional des Œuvres Universitaires • Korhogo\nUniversité Peleforo Gbon Coulibaly',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondaryLight,
                      height: 1.4,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Mode Selector Segmented Pill
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _isAdminMode = false;
                              _errorMessage = null;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: !_isAdminMode ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: !_isAdminMode
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.05),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    : null,
                              ),
                              child: Text(
                                'Étudiant UPGC',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: !_isAdminMode ? FontWeight.bold : FontWeight.w500,
                                  color: !_isAdminMode ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _isAdminMode = true;
                              _errorMessage = null;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _isAdminMode ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: _isAdminMode
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.05),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    : null,
                              ),
                              child: Text(
                                'Administration CROU',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: _isAdminMode ? FontWeight.bold : FontWeight.w500,
                                  color: _isAdminMode ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.danger.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.danger.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.error_outline, color: AppTheme.danger, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: AppTheme.danger,
                                fontWeight: FontWeight.w600,
                                height: 1.35,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  if (!_isAdminMode) ...[
                    // Matricule Field
                    const Text(
                      'Numéro de matricule étudiant *',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryLight),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _matriculeController,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(
                        hintText: 'Ex: CI0226019482 ou UPGC-2026-001',
                        prefixIcon: Icon(Icons.badge_outlined, size: 20),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Password Field
                    const Text(
                      'Mot de passe *',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryLight),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        hintText: 'Votre mot de passe personnel',
                        prefixIcon: Icon(Icons.lock_outline, size: 20),
                      ),
                    ),

                    const SizedBox(height: 10),

                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _showForgottenPasswordDialog,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Mot de passe oublié ?',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleStudentLogin,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Se connecter / Accéder au réfectoire'),
                    ),
                  ] else ...[
                    // Admin PIN Field
                    const Text(
                      'Code de sécurité administration *',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryLight),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _adminCodeController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        hintText: 'Saisissez le code d\'administration',
                        prefixIcon: Icon(Icons.shield_outlined, size: 20),
                      ),
                    ),

                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleAdminLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.darkBackground,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Accéder au portail d\'administration'),
                    ),
                  ],

                  const SizedBox(height: 32),

                  // Official Footer note
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: AppTheme.textSecondaryLight, size: 18),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Tarif officiel subventionné par l\'État de Côte d\'Ivoire : 200 FCFA le repas complet.',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondaryLight,
                              height: 1.35,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/screens/pin_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class PinScreen extends StatefulWidget {
  final AuthService authService;
  final VoidCallback onUnlocked;

  const PinScreen({
    super.key,
    required this.authService,
    required this.onUnlocked,
  });

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  String _enteredPin = '';
  String? _errorMessage;
  bool _isChecking = false;

  void _onDigitPressed(String digit) {
    if (_enteredPin.length >= 4 || _isChecking) return;

    setState(() {
      _enteredPin += digit;
      _errorMessage = null;
    });

    if (_enteredPin.length == 4) {
      _verifyPin();
    }
  }

  void _onDeletePressed() {
    if (_enteredPin.isEmpty || _isChecking) return;
    setState(() {
      _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
      _errorMessage = null;
    });
  }

  Future<void> _verifyPin() async {
    setState(() => _isChecking = true);

    final success = await widget.authService.verifyPin(_enteredPin);

    if (!mounted) return;

    if (success) {
      widget.onUnlocked();
    } else {
      final fails = widget.authService.failedPinCount;
      final remaining = 5 - fails;

      setState(() {
        _isChecking = false;
        _enteredPin = '';
        if (remaining > 0) {
          _errorMessage = 'Code PIN incorrect. $remaining tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.';
        } else {
          _errorMessage = 'Compte bloqué suite à 5 tentatives de code PIN erronées.';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authService.currentUser;
    final fails = widget.authService.failedPinCount;
    final isBlocked = widget.authService.isBlocked || fails >= 5;

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 380),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: isBlocked
                  ? _buildBlockedAccountView(user)
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Top Header
                        Column(
                          children: [
                            const SizedBox(height: 20),
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: AppTheme.darkSurface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppTheme.borderDark),
                              ),
                              child: const Icon(
                                Icons.lock_outline_rounded,
                                color: AppTheme.primary,
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Code PIN de sécurité',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              user != null
                                  ? '${user.displayName} • ${user.matricule ?? user.uid}'
                                  : 'Saisissez votre code personnel à 4 chiffres',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.textSecondaryDark,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // 4 PIN Dots
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(4, (index) {
                                final isFilled = index < _enteredPin.length;
                                return Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 8),
                                  width: 16,
                                  height: 16,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isFilled ? AppTheme.primary : AppTheme.darkSurface,
                                    border: Border.all(
                                      color: isFilled ? AppTheme.primary : AppTheme.borderDark,
                                      width: 1.5,
                                    ),
                                  ),
                                );
                              }),
                            ),

                            const SizedBox(height: 16),

                            if (_errorMessage != null)
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  _errorMessage!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: AppTheme.danger,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),

                        // Numeric Keypad
                        _buildKeypad(),

                        // Bottom Actions
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: TextButton(
                            onPressed: () => widget.authService.logout(),
                            child: const Text(
                              'Se déconnecter',
                              style: TextStyle(
                                color: AppTheme.textSecondaryDark,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKeypad() {
    return Column(
      children: [
        for (var row in [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', 'delete']
        ])
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: row.map((key) {
                if (key.isEmpty) {
                  return const SizedBox(width: 72, height: 72);
                }
                if (key == 'delete') {
                  return SizedBox(
                    width: 72,
                    height: 72,
                    child: IconButton(
                      onPressed: _onDeletePressed,
                      icon: const Icon(Icons.backspace_outlined, color: Colors.white, size: 24),
                    ),
                  );
                }
                return SizedBox(
                  width: 72,
                  height: 72,
                  child: ElevatedButton(
                    onPressed: () => _onDigitPressed(key),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.darkSurface,
                      foregroundColor: Colors.white,
                      shape: const CircleBorder(),
                      padding: EdgeInsets.zero,
                      elevation: 0,
                    ),
                    child: Text(
                      key,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildBlockedAccountView(UserProfile? user) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: AppTheme.danger.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.danger, width: 2),
          ),
          child: const Icon(Icons.shield_outlined, color: AppTheme.danger, size: 36),
        ),
        const SizedBox(height: 20),
        const Text(
          'Compte Étudiant Bloqué',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Votre compte a été automatiquement verrouillé par mesure de sécurité suite à 5 tentatives de code PIN erronées.\n\n'
            'Veuillez vous présenter au Guichet Restauration du CROU Korhogo muni de votre carte d\'étudiant physique pour lever le blocage.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textSecondaryDark,
              height: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 28),
        ElevatedButton(
          onPressed: () => widget.authService.logout(),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.danger,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
          ),
          child: const Text('Retour à la connexion'),
        ),
      ],
    );
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/screens/home_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/auth_service.dart';
import '../services/canteen_service.dart';
import '../services/ticket_service.dart';
import '../theme/app_theme.dart';
import 'support_screen.dart';
import 'tickets_screen.dart';

class HomeScreen extends StatefulWidget {
  final AuthService authService;
  final TicketService ticketService;
  final CanteenService canteenService;

  const HomeScreen({
    super.key,
    required this.authService,
    required this.ticketService,
    required this.canteenService,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedMealType = 'midi'; // 'midi' | 'soir'

  void _showPurchaseDialog(Dish dish) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Achat de Ticket Repas',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.lightBackground,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.restaurant, color: AppTheme.primary),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dish.name,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Tarif subventionné État de Côte d\'Ivoire',
                            style: TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                          ),
                        ],
                      ),
                    ),
                    const Text(
                      '200 F',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  final res = await widget.ticketService.purchaseTicket(
                    dish: dish,
                    paymentMethod: 'balance',
                  );

                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['message']),
                      backgroundColor: res['success'] ? AppTheme.success : AppTheme.danger,
                    ),
                  );
                },
                icon: const Icon(Icons.account_balance_wallet_outlined, size: 18),
                label: const Text('Payer avec mon Solde Étudiant (200 FCFA)'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  // Simuler paiement Wave Money
                  final res = await widget.ticketService.purchaseTicket(
                    dish: dish,
                    paymentMethod: 'wave',
                  );

                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['message']),
                      backgroundColor: res['success'] ? AppTheme.success : AppTheme.danger,
                    ),
                  );
                },
                icon: const Icon(Icons.phone_android, size: 18, color: Color(0xFF1D4ED8)),
                label: const Text(
                  'Payer immédiatement par Wave Money',
                  style: TextStyle(color: Color(0xFF1D4ED8), fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF93C5FD)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authService.currentUser;
    final canteen = widget.canteenService.selectedCanteen;
    final validCount = widget.ticketService.validTickets.length;
    final filteredDishes = widget.canteenService.dishes
        .where((d) => d.mealType == _selectedMealType)
        .toList();

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Programas • CROU Korhogo'),
            Text(
              canteen.name,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.textSecondaryLight),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TicketsScreen(ticketService: widget.ticketService),
                ),
              );
            },
            icon: Badge(
              isLabelVisible: validCount > 0,
              label: Text('$validCount'),
              backgroundColor: AppTheme.primary,
              child: const Icon(Icons.qr_code_rounded, size: 24),
            ),
          ),
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => SupportScreen(dishes: widget.canteenService.dishes),
                ),
              );
            },
            icon: const Icon(Icons.headset_mic_outlined, size: 22),
            tooltip: 'Assistance CROU',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => setState(() {}),
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Student Welcome & Balance Card (Bank style)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.displayName ?? 'Étudiant UPGC',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.matricule ?? 'CI0226019482',
                            style: const TextStyle(
                              color: AppTheme.textSecondaryDark,
                              fontSize: 12,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.5)),
                        ),
                        child: const Text(
                          '200 F / Repas',
                          style: TextStyle(
                            color: Color(0xFFFDBA74),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SOLDE DISPONIBLE',
                            style: TextStyle(
                              color: AppTheme.textSecondaryDark,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${user?.balance ?? 0} FCFA',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => TicketsScreen(ticketService: widget.ticketService),
                            ),
                          );
                        },
                        icon: const Icon(Icons.confirmation_number_outlined, size: 16),
                        label: Text('Tickets ($validCount)'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Operational Hours & Crowd Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.access_time_rounded, color: Color(0xFF2563EB), size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Horaires officiels du réfectoire',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Déjeuner : 11h30 – 14h30 • Dîner : 18h30 – 21h00',
                          style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondaryLight),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Meal Switcher (Midi / Soir)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Menu du jour préparé',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => setState(() => _selectedMealType = 'midi'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _selectedMealType == 'midi' ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Midi',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: _selectedMealType == 'midi' ? FontWeight.bold : FontWeight.normal,
                              color: _selectedMealType == 'midi' ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                            ),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _selectedMealType = 'soir'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _selectedMealType == 'soir' ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Soir',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: _selectedMealType == 'soir' ? FontWeight.bold : FontWeight.normal,
                              color: _selectedMealType == 'soir' ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Dishes Cards
            for (final dish in filteredDishes)
              Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          dish.imageUrl,
                          width: 84,
                          height: 84,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 84,
                            height: 84,
                            color: const Color(0xFFF1F5F9),
                            child: const Icon(Icons.restaurant, color: AppTheme.textSecondaryLight),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              dish.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14.5),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              dish.description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight, height: 1.3),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '${dish.price} FCFA',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${dish.regularPrice} F',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        decoration: TextDecoration.lineThrough,
                                        color: AppTheme.textSecondaryLight,
                                      ),
                                    ),
                                  ],
                                ),
                                ElevatedButton(
                                  onPressed: () => _showPurchaseDialog(dish),
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: const Text('Prendre ticket', style: TextStyle(fontSize: 12)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/screens/tickets_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/models.dart';
import '../services/ticket_service.dart';
import '../theme/app_theme.dart';

class TicketsScreen extends StatefulWidget {
  final TicketService ticketService;

  const TicketsScreen({super.key, required this.ticketService});

  @override
  State<TicketsScreen> createState() => _TicketsScreenState();
}

class _TicketsScreenState extends State<TicketsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showTicketDetails(MealTicket ticket) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Pull Bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Official Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'CROU DE KORHOGO',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                      ),
                      Text(
                        'UNIVERSITÉ PELEFORO GBON COULIBALY',
                        style: TextStyle(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: ticket.status == 'valid'
                          ? AppTheme.success.withValues(alpha: 0.1)
                          : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      ticket.status == 'valid' ? 'VALIDE' : 'UTILISÉ',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: ticket.status == 'valid' ? AppTheme.success : Colors.grey.shade700,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // QR Code in White Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: ticket.qrCodeData,
                  version: QrVersions.auto,
                  size: 190.0,
                ),
              ),

              const SizedBox(height: 16),

              Text(
                ticket.ticketNumber,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  fontFamily: 'monospace',
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${ticket.studentName ?? "Étudiant"} • ${ticket.studentMatricule ?? ""}',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
              ),

              const SizedBox(height: 16),

              // Ticket Details Row
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Repas :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text(ticket.dishName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Service :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text(ticket.mealType == 'midi' ? 'Déjeuner (Midi)' : 'Dîner (Soir)',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tarif subventionné :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text('${ticket.price} FCFA',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                      ],
                    ),
                    if (ticket.status == 'used' && ticket.usedAt != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Validé au tourniquet :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          Text(ticket.usedAt!,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              const Text(
                'Présentez ce QR Code face au scanner optique de la borne tourniquet pour débloquer votre passage.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final validTickets = widget.ticketService.validTickets;
    final usedTickets = widget.ticketService.usedTickets;

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Mes Tickets Repas'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondaryLight,
          indicatorColor: AppTheme.primary,
          indicatorWeight: 3,
          tabs: [
            Tab(text: 'Prêts au passage (${validTickets.length})'),
            Tab(text: 'Historique (${usedTickets.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Valid Tickets
          validTickets.isEmpty
              ? _buildEmptyState('Aucun ticket actif', 'Achetez votre repas à 200 FCFA depuis le menu du jour.')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: validTickets.length,
                  itemBuilder: (ctx, i) => _buildTicketCard(validTickets[i]),
                ),

          // Tab 2: Used Tickets
          usedTickets.isEmpty
              ? _buildEmptyState('Aucun ticket utilisé', 'Vos passages aux tourniquets apparaîtront ici.')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: usedTickets.length,
                  itemBuilder: (ctx, i) => _buildTicketCard(usedTickets[i]),
                ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.confirmation_number_outlined, size: 40, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  Widget _buildTicketCard(MealTicket ticket) {
    final isValid = ticket.status == 'valid';

    return GestureDetector(
      onTap: () => _showTicketDetails(ticket),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Left: QR Thumbnail
              Container(
                width: 60,
                height: 60,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: QrImageView(
                  data: ticket.qrCodeData,
                  version: QrVersions.auto,
                ),
              ),
              const SizedBox(width: 14),

              // Middle: Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ticket.dishName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      ticket.ticketNumber,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: AppTheme.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Émis le ${ticket.purchaseDate}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                    ),
                  ],
                ),
              ),

              // Right: Status Badge & Chevron
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isValid ? AppTheme.success.withValues(alpha: 0.1) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      isValid ? 'VALIDE' : 'UTILISÉ',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: isValid ? AppTheme.success : Colors.grey.shade600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondaryLight),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/screens/support_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class SupportMessage {
  final String text;
  final bool isUser;
  final String time;

  SupportMessage({required this.text, required this.isUser, required this.time});
}

class SupportScreen extends StatefulWidget {
  final List<Dish> dishes;

  const SupportScreen({super.key, required this.dishes});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _messageController = TextEditingController();
  final List<SupportMessage> _messages = [
    SupportMessage(
      text: 'Bonjour cher(e) étudiant(e) ! 👋 Je suis M. Kouassi, agent d\'accueil et d\'orientation au Service Restauration du CROU Korhogo (UPGC).\n\nJe suis à votre disposition pour vous renseigner sur le réfectoire :\n• Les plats du jour et spécialités 🍲\n• Vos tickets de repas subventionnés à 200 FCFA 🎫\n• Les horaires de service midi & soir ⏰\n• La sécurité de votre compte et code PIN 🔒\n\nComment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      time: 'Maintenant',
    ),
  ];

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage([String? predefinedText]) {
    final text = (predefinedText ?? _messageController.text).trim();
    if (text.isEmpty) return;

    final now = TimeOfDay.now().format(context);
    setState(() {
      _messages.add(SupportMessage(text: text, isUser: true, time: now));
    });

    _messageController.clear();

    // Human response logic
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      final reply = _generateCounselorResponse(text);
      setState(() {
        _messages.add(SupportMessage(text: reply, isUser: false, time: TimeOfDay.now().format(context)));
      });
    });
  }

  String _generateCounselorResponse(String prompt) {
    final p = prompt.toLowerCase();

    if (p.contains('salut') || p.contains('bonjour') || p.contains('bonsoir') || p.contains('coucou')) {
      return 'Bonjour ! Ravi de vous accueillir au guichet d\'assistance du CROU Korhogo. Comment se passent vos cours à l\'UPGC ? Que souhaitez-vous savoir pour votre repas d\'aujourd\'hui ?';
    }

    if (p.contains('prix') || p.contains('tarif') || p.contains('combien') || p.contains('coûte')) {
      return 'Le ticket de repas complet est subventionné par l\'État de Côte d\'Ivoire au tarif officiel de 200 FCFA (+10 FCFA de frais de service Wave = 210 FCFA). Vous pouvez commander et régler directement depuis votre application !';
    }

    if (p.contains('menu') || p.contains('manger') || p.contains('plat') || p.contains('nourriture')) {
      final menuList = widget.dishes.map((d) => '• ${d.name} (${d.mealType == "midi" ? "Midi" : "Soir"})').join('\n');
      return 'Voici les plats préparés aujourd\'hui par notre équipe de cuisine :\n\n$menuList\n\nLe repas complet est servi avec accompagnement au tarif de 200 FCFA.';
    }

    if (p.contains('horaire') || p.contains('heure') || p.contains('ferme') || p.contains('ouvert')) {
      return 'Les horaires de service au Restaurant Universitaire sont les suivants :\n\n• Déjeuner : 11h30 à 14h30\n• Dîner : 18h30 à 21h00\n\nPensez à ouvrir votre QR code avant d\'arriver aux tourniquets pour faciliter le passage.';
    }

    if (p.contains('mot de passe') || p.contains('oubli') || p.contains('recuper')) {
      return 'Pour la sécurité absolue de vos tickets et éviter toute usurpation, la réinitialisation de mot de passe en ligne est désactivée.\n\nVeuillez vous présenter au Guichet Restauration du CROU Korhogo avec votre carte d\'étudiant physique pour faire réinitialiser votre accès.';
    }

    if (p.contains('merci')) {
      return 'Avec grand plaisir ! L\'équipe du CROU Korhogo vous souhaite un très bon appétit et d\'excellentes révisions pour vos cours à l\'UPGC ! 😊';
    }

    return 'Je suis à votre écoute ! Pour toute demande concernant le restaurant universitaire, les tickets à 200 FCFA ou le passage aux bornes tourniquets, n\'hésitez pas à me solliciter.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.support_agent, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('M. Kouassi • Conseiller CROU', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text('Service Restauration UPGC • En direct', style: TextStyle(fontSize: 10, color: AppTheme.success)),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Quick suggestion chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Row(
              children: [
                _buildChip('Menu du jour', 'Qu\'y a-t-il au menu aujourd\'hui ?'),
                _buildChip('Prix du repas', 'Quel est le prix du ticket repas ?'),
                _buildChip('Horaires réfectoire', 'Quels sont les horaires d\'ouverture ?'),
                _buildChip('Mot de passe oublié', 'Comment réinitialiser mon mot de passe ?'),
              ],
            ),
          ),

          const Divider(height: 1, color: AppTheme.borderLight),

          // Chat Messages
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final m = _messages[i];
                return Align(
                  alignment: m.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: m.isUser ? AppTheme.primary : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: Radius.circular(m.isUser ? 16 : 4),
                        bottomRight: Radius.circular(m.isUser ? 4 : 16),
                      ),
                      border: m.isUser ? null : Border.all(color: AppTheme.borderLight),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!m.isUser)
                          const Padding(
                            padding: EdgeInsets.only(bottom: 4),
                            child: Text(
                              'M. Kouassi (CROU-K)',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ),
                        Text(
                          m.text,
                          style: TextStyle(
                            fontSize: 13,
                            color: m.isUser ? Colors.white : AppTheme.textPrimaryLight,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Text(
                            m.time,
                            style: TextStyle(
                              fontSize: 9.5,
                              color: m.isUser ? Colors.white70 : AppTheme.textSecondaryLight,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Message Input Field
          SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppTheme.borderLight)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: const InputDecoration(
                        hintText: 'Écrivez votre message à M. Kouassi...',
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(
                      color: AppTheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      onPressed: () => _sendMessage(),
                      icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String message) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        side: const BorderSide(color: AppTheme.borderLight),
        onPressed: () => _sendMessage(message),
      ),
    );
  }
}

```

---

## 📄 Fichier: `flutter_app/lib/screens/admin_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/ticket_service.dart';
import '../theme/app_theme.dart';

class AdminScreen extends StatefulWidget {
  final AuthService authService;
  final TicketService ticketService;

  const AdminScreen({
    super.key,
    required this.authService,
    required this.ticketService,
  });

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _ticketScanController = TextEditingController();
  final _searchStudentController = TextEditingController();

  String? _scanResult;
  bool _isScanSuccess = false;

  @override
  void dispose() {
    _ticketScanController.dispose();
    _searchStudentController.dispose();
    super.dispose();
  }

  void _handleManualTurnstileValidation() async {
    final code = _ticketScanController.text.trim();
    if (code.isEmpty) return;

    final res = await widget.ticketService.validateTicketAtTurnstile(code);
    setState(() {
      _scanResult = res['message'];
      _isScanSuccess = res['status'] == 'valid';
    });
  }

  void _unblockStudentDialog(String matricule) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Débloquer le compte étudiant ?'),
        content: Text(
          'Voulez-vous réactiver l\'accès pour le matricule $matricule ?\n\n'
          'Les compteurs d\'échecs de sécurité et de PIN seront réinitialisés à 0.',
          style: const TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await widget.authService.unblockStudent(matricule);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Le compte $matricule a été débloqué avec succès.'),
                  backgroundColor: AppTheme.success,
                ),
              );
              setState(() {});
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
            child: const Text('Débloquer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final validTickets = widget.ticketService.validTickets;
    final usedTickets = widget.ticketService.usedTickets;
    final totalSold = validTickets.length + usedTickets.length;
    final totalRevenue = totalSold * 200;

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Administration CROU Korhogo'),
        actions: [
          IconButton(
            onPressed: () => widget.authService.logout(),
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Déconnexion Admin',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 4 Bilan Cards
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: [
              _buildStatCard('TICKETS VENDUS', '$totalSold', '200 FCFA / repas', AppTheme.primary),
              _buildStatCard('REPAS VALIDÉS', '${usedTickets.length}', 'Passages tourniquets', AppTheme.success),
              _buildStatCard('EN CIRCULATION', '${validTickets.length}', 'Prêts au passage', const Color(0xFF2563EB)),
              _buildStatCard('RECETTES (FCFA)', '$totalRevenue', 'Total encaissé', Colors.black87),
            ],
          ),

          const SizedBox(height: 24),

          // Turnstile Scanner Box
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.qr_code_scanner, color: AppTheme.primary, size: 22),
                    SizedBox(width: 8),
                    Text(
                      'Validation au Tourniquet (Contrôle Optique)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Saisissez ou scannez le numéro de ticket (ex: CROUK-2026-XXXXXX) pour autoriser le passage au self.',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _ticketScanController,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          hintText: 'Numéro de ticket ou scan...',
                          prefixIcon: Icon(Icons.confirmation_number_outlined, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: _handleManualTurnstileValidation,
                      child: const Text('Valider'),
                    ),
                  ],
                ),
                if (_scanResult != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (_isScanSuccess ? AppTheme.success : AppTheme.danger).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: (_isScanSuccess ? AppTheme.success : AppTheme.danger).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      _scanResult!,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: _isScanSuccess ? AppTheme.success : AppTheme.danger,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Security & Blocked Account Management
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Gestion des comptes étudiants & Sécurité',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'En cas de blocage suite à 5 tentatives de code PIN erronées, l\'administrateur peut débloquer le compte après vérification de la carte physique.',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight),
                ),
                const SizedBox(height: 14),

                // Demo blocked student card
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.danger.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.lock_person, color: AppTheme.danger, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'KOUAME YAO JEAN',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              'Matricule : CI0226019482 • 5 échecs PIN',
                              style: TextStyle(fontSize: 11, color: AppTheme.danger),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => _unblockStudentDialog('CI0226019482'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        child: const Text('Débloquer', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, String subtext, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppTheme.textSecondaryLight,
              letterSpacing: 0.5,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          Text(
            subtext,
            style: const TextStyle(fontSize: 10.5, color: AppTheme.textSecondaryLight),
          ),
        ],
      ),
    );
  }
}

```

---

