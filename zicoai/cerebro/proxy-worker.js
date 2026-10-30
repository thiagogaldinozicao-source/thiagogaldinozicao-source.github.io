// ZicoAI — atalho (proxy) no Cloudflare Workers, grátis.
// 1) Repassa chamadas de API que bloqueiam o Google (GET/POST com ?alvo=URL e cabeçalho x-zico-key).
// 2) Recebe o webhook do Telegram em /tg e entrega pro Apps Script (que responde com redirecionamento 302,
//    coisa que o Telegram não aceita direto).
// Variáveis do Worker (Settings → Variables and Secrets): SEGREDO (Secret) e ZICO_EXEC (texto, o link /exec da ZicoAI).
const PERMITIDOS = /^https:\/\/(models\.github\.ai|api\.github\.com|api\.mistral\.ai|integrate\.api\.nvidia\.com|api\.cerebras\.ai)\//;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

    // --- Telegram → ZicoAI ---
    if (url.pathname === '/tg') {
      if (!env.SEGREDO || req.headers.get('x-telegram-bot-api-secret-token') !== env.SEGREDO) return new Response('nope', { status: 403 });
      if (!env.ZICO_EXEC) return new Response('falta ZICO_EXEC', { status: 500 });
      const corpo = await req.text();
      try {
        await fetch(env.ZICO_EXEC + '?tg=' + encodeURIComponent(env.SEGREDO), { method: 'POST', headers: { 'content-type': 'application/json' }, body: corpo, redirect: 'follow' });
      } catch (e) { /* o Telegram reenvia se a gente não responder 200; aqui respondemos sempre */ }
      return new Response('ok', { status: 200 });
    }

    // --- proxy genérico ---
    if (!env.SEGREDO || req.headers.get('x-zico-key') !== env.SEGREDO) return new Response('nope', { status: 403 });
    const alvo = url.searchParams.get('alvo');
    if (!alvo || !PERMITIDOS.test(alvo)) return new Response('alvo nao permitido', { status: 400 });
    const h = new Headers();
    for (const [k, v] of req.headers) if (!/^(host|x-zico-key|cf-|content-length)/i.test(k)) h.set(k, v);
    h.set('user-agent', 'ZicoAI/1.0');
    const r = await fetch(alvo, { method: req.method, headers: h, body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer() });
    return new Response(r.body, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } });
  }
};
