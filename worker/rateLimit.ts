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

export interface RateLimitEnv {
  LIMITER?: any;
  API_LIMITER?: any;
  [key: string]: any;
}

/** Règles : `limit` requêtes maximum par fenêtre de `windowMs`. */
export const RULES = {
  // Avant vérification du jeton Google, la clé est l'adresse IP. Les réseaux mobiles partagent souvent
  // une même IP entre beaucoup de personnes : on reste large pour ne pas bloquer des étudiants honnêtes.
  login: { limit: 20, windowMs: 60_000 },
  // Après connexion, la clé est l'identifiant de l'utilisateur : ces règles peuvent être strictes.
  purchase: { limit: 10, windowMs: 3_600_000 },
  ticketView: { limit: 60, windowMs: 60_000 },
  validate: { limit: 60, windowMs: 60_000 },
  admin: { limit: 60, windowMs: 60_000 },
  aiChat: { limit: 30, windowMs: 60_000 },
} as const;

export type RuleName = keyof typeof RULES;

const clientIp = (request: Request) => request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';

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

// Fallback in-memory cache for node / dev / environments without Cloudflare Durable Objects
const inMemoryCache = new Map<string, { count: number; resetAt: number }>();

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
  const { limit, windowMs } = RULES[rule];
  const key = `${rule}:${subject ?? clientIp(request)}`;

  // If Cloudflare Durable Object LIMITER is available
  if (env && env.LIMITER && typeof env.LIMITER.idFromName === 'function') {
    try {
      const stub = env.LIMITER.get(env.LIMITER.idFromName(key));
      const result = await stub.hit(limit, windowMs);
      return result.allowed ? null : tooManyRequests(result.retryAfter, limit);
    } catch (err) {
      console.error(`rateLimit(${rule}): erreur du limiteur DO`, err);
      return failOpen ? null : tooManyRequests(10);
    }
  }

  // Graceful in-memory sliding window fallback
  try {
    const now = Date.now();
    let state = inMemoryCache.get(key);
    if (!state || state.resetAt <= now) {
      state = { count: 0, resetAt: now + windowMs };
    }
    state.count += 1;
    inMemoryCache.set(key, state);

    if (state.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
      return tooManyRequests(retryAfter, limit);
    }
    return null;
  } catch (err) {
    console.error(`rateLimit(${rule}) fallback error:`, err);
    return null;
  }
}

interface WindowState {
  count: number;
  resetAt: number;
}

/** Un objet par clé (ex. « login:41.12.8.9 ») : un compteur qui survit même si l'objet est mis en veille. */
export class RateLimiter {
  ctx: any;
  constructor(ctx: any, _env: any) {
    this.ctx = ctx;
  }

  async hit(limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
    const now = Date.now();
    let state = await this.ctx.storage.get('w') as WindowState | undefined;

    if (!state || state.resetAt <= now) {
      state = { count: 0, resetAt: now + windowMs };
      if (this.ctx.storage.setAlarm) {
        await this.ctx.storage.setAlarm(state.resetAt + 1000); // nettoyage automatique après la fenêtre
      }
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
    const state = await this.ctx.storage.get('w') as WindowState | undefined;
    if (!state || state.resetAt <= Date.now()) {
      await this.ctx.storage.deleteAll();
    }
  }
}
