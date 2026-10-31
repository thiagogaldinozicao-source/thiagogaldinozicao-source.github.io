// Pesquisa profunda (várias buscas, abre e lê páginas, compara com fontes) e "conhecer a si mesma"
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const txt = t => ({ getResponseCode: () => 200, getContentText: () => t });
const ctx = c => vm.runInContext(c, H.ctx);

ok(ctx('querPesquisaProfunda("qual o melhor cérebro de ia grátis que existe hoje?")') && ctx('querPesquisaProfunda("pesquisa profunda sobre placas de vídeo")') && !ctx('querPesquisaProfunda("qual a diferença entre o 13 e o 14?")') && !ctx('querPesquisaProfunda("oi tudo bem")'), 'detecta quando precisa pesquisa profunda');

const abertas = []; let leitor = '', sysLeitor = '';
H.setFetch((u, o) => {
  if (/r\.jina\.ai\/https:\/\/html\.duckduckgo/.test(u)) {
    const q = decodeURIComponent((u.match(/q=([^&]+)/) || [])[1] || '');
    return txt('Resultados\n[Free LLM API Tiers October 2026](//duckduckgo.com/l/?uddg=' + encodeURIComponent('https://dev.to/x/free-llm-2026') + '&rut=1)\n[Ranking de IAs grátis](https://site-a.com.br/ranking)\n[Anúncio](https://www.bing.com/aclk?x)\n[Outra do mesmo site](https://site-a.com.br/outra)\n[Comparativo](https://blog-b.com/comparativo-' + q.length + ')\n'.repeat(1) + 'texto texto '.repeat(60));
  }
  if (/r\.jina\.ai\/https:\/\//.test(u)) { abertas.push(u.replace('https://r.jina.ai/', '')); return txt('Publicado em outubro de 2026. Gemini é o mais forte no geral; Groq o mais rápido; NVIDIA com 10 mil pedidos por dia. '.repeat(10)); }
  if (typeof (o || {}).payload !== 'string') return txt('{}');
  const b = JSON.parse(o.payload);
  if (/Monte 3 buscas/.test(b.messages[0].content)) return resp('{"buscas":["melhor IA grátis 2026","free LLM API October 2026","ranking modelos IA gratuitos"]}');
  if (/### PESQUISA PROFUNDA/.test(b.messages[0].content)) { leitor = b.model; sysLeitor = b.messages[0].content; return resp('O mais forte no geral é o Gemini [1]; o mais rápido é o Groq [2].'); }
  return resp('resposta normal');
});
const r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'qual o melhor cérebro de ia grátis que existe hoje?' }] });
ok(/Gemini \[1\]/.test(r.resposta) && /\*\*Fontes:\*\*/.test(r.resposta) && /dev\.to\/x\/free-llm-2026/.test(r.resposta), 'respondeu com fontes citadas');
ok(abertas.length >= 3 && abertas.some(u => /dev\.to\/x\/free-llm-2026/.test(u)) && !abertas.some(u => /bing\.com|duckduckgo/.test(u)), 'abriu as páginas de verdade (link do DuckDuckGo decodificado, anúncio fora): ' + abertas.length);
ok(new Set(abertas.map(u => u.split('/')[2])).size === abertas.length, 'não abre dois links do mesmo site');
ok(leitor === 'gemini-3.1-flash-lite' && /Confira a DATA/.test(sysLeitor) && /\[1\] /.test(sysLeitor), 'Gemini (contexto grande) leu e comparou, com regra de data');
ok(r.passos.some(p => /Pesquisa profunda: 3 buscas/.test(p)) && r.passos.some(p => /Leu \d+ páginas inteiras/.test(p)) && r.passos.some(p => /Comparou as \d+ fontes/.test(p)), 'resumo mostra buscas, leitura e comparação');
ok(r.passos.some(p => /Olhou os próprios cérebros/.test(p)) && /### MEUS CÉREBROS/.test(sysLeitor) && /Groq GPT-OSS 120B \(openai\/gpt-oss-120b\)/.test(sysLeitor), 'sabe os próprios cérebros e limites');
// ferramenta do agente
ok(/pesquisa_profunda/.test(ctx('PROMPT_AGENTE')), 'agente tem a ferramenta pesquisa_profunda');
// sem link nenhum: cai pra pesquisa normal
H.setFetch((u, o) => { if (/r\.jina\.ai/.test(u)) return txt('captcha'); if (typeof (o || {}).payload !== 'string') return txt('{}'); const b = JSON.parse(o.payload); if (b.tools) return resp('pelo groq'); return resp('{"buscas":["x"]}'); });
const r2 = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'qual o melhor celular hoje no mercado?' }] });
ok(r2.ok && r2.passos.some(p => /não achou links/.test(p)), 'sem links: segue com a pesquisa normal');
