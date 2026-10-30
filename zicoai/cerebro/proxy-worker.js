// ZicoAI — atalho (proxy) no Cloudflare Workers, grátis.
// Serve pra chamar APIs que bloqueiam os servidores do Google (ex.: models.github.ai).
// Como usar: dash.cloudflare.com → Workers & Pages → Create → Start with Hello World → Deploy →
// Edit code → apaga tudo, cola este arquivo, Deploy. Em Settings → Variables and Secrets, cria
// SEGREDO (tipo Secret) com uma palavra longa. A URL do worker (https://xxx.workers.dev) e o
// mesmo segredo vão nas Propriedades do script da ZicoAI: PROXY_URL e PROXY_SEGREDO.
const PERMITIDOS = /^https:\/\/(models\.github\.ai|api\.github\.com|api\.mistral\.ai|integrate\.api\.nvidia\.com|api\.cerebras\.ai)\//;

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
    if (!env.SEGREDO || req.headers.get('x-zico-key') !== env.SEGREDO) return new Response('nope', { status: 403 });
    const alvo = new URL(req.url).searchParams.get('alvo');
    if (!alvo || !PERMITIDOS.test(alvo)) return new Response('alvo não permitido', { status: 400 });
    const h = new Headers();
    for (const [k, v] of req.headers) if (!/^(host|x-zico-key|cf-|content-length)/i.test(k)) h.set(k, v);
    h.set('user-agent', 'ZicoAI/1.0');
    const r = await fetch(alvo, { method: req.method, headers: h, body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer() });
    const out = new Headers({ 'content-type': r.headers.get('content-type') || 'application/json' });
    return new Response(r.body, { status: r.status, headers: out });
  }
};
