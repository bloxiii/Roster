/**
 * Rate limiter en mémoire, configurable par route.
 *
 * Simple et adapté au MVP mono-instance. À remplacer par un store partagé
 * (Redis/Upstash) avant un scaling multi-instance.
 */

type RateLimiterConfig = {
  windowMs: number;
  maxRequests: number;
};

const stores = new Map<string, Map<string, number[]>>();

function getStore(name: string): Map<string, number[]> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

export function createRateLimiter(name: string, config: RateLimiterConfig) {
  const store = getStore(name);

  return function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = (store.get(ip) ?? []).filter(
      (t) => now - t < config.windowMs,
    );
    timestamps.push(now);
    store.set(ip, timestamps);
    return timestamps.length > config.maxRequests;
  };
}

/** Rate limiters pré-configurés pour chaque route. */
export const rateLimiters = {
  /** /api/agent/chat — 20 requêtes par 10 minutes par IP. */
  agentChat: createRateLimiter("agent-chat", {
    windowMs: 10 * 60 * 1000,
    maxRequests: 20,
  }),
  /**
   * /api/agent/chat, uniquement pour la démo publique (companies.plan ===
   * DEMO_COMPANY_PLAN) — plafond plus strict qui s'ajoute à agentChat
   * ci-dessus, vu que ce lien est public et sans authentification.
   */
  demoChat: createRateLimiter("demo-chat", {
    windowMs: 10 * 60 * 1000,
    maxRequests: 8,
  }),
  /** /api/contact — 5 soumissions par 10 minutes par IP. */
  contact: createRateLimiter("contact", {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
  }),
  /** /api/agent/widget-config — 60 requêtes par 10 minutes par IP (chargé à chaque page vue). */
  widgetConfig: createRateLimiter("widget-config", {
    windowMs: 10 * 60 * 1000,
    maxRequests: 60,
  }),
  /** /api/auth — 5 tentatives par 15 minutes par IP. */
  auth: createRateLimiter("auth", {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  }),
};
