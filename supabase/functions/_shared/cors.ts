// supabase/functions/_shared/cors.ts
// @ts-ignore
declare const Deno: any;

// Whitelist via env ALLOWED_ORIGINS (CSV) + defaults
const DEFAULT_ORIGINS = [
  'https://sistema-dom-bosco-ten.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const ENV = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',')
  .map((s: string) => s.trim()).filter(Boolean);

const ALLOWED = new Set<string>([...DEFAULT_ORIGINS, ...ENV]);

export function buildCorsHeaders(origin: string | null) {
  const allow = origin && ALLOWED.has(origin) ? origin : DEFAULT_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function preflight(req: Request) {
  const headers = buildCorsHeaders(req.headers.get('Origin'));
  return new Response('ok', { headers });
}

export function json(body: unknown, init: ResponseInit & { origin?: string | null } = {}) {
  const headers = buildCorsHeaders(init.origin ?? null);
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...headers, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}
