// Cérebros extras opcionais, leitura de link, taxas, cripto, ntfy, comandos do Telegram
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
const cai = (cod, txt) => ({ getResponseCode: () => cod, getContentText: () => txt });
let sys = ''; const chamadas = [];
function mock(u, o) {
  chamadas.push({ u, o });
  if (/r\.jina\.ai/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'Título: iPhone 17 Pro\n\nPreço R$ 9.999 na loja X. Tela 6,3.' };
  if (/brasilapi.*taxas/.test(u)) return json([{ nome: 'Selic', valor: 10.5 }, { nome: 'CDI', valor: 10.4 }, { nome: 'IPCA', valor: 4.2 }]);
  if (/awesomeapi.*BTC/.test(u)) return json({ BTCBRL: { name: 'Bitcoin/Real Brasileiro', bid: '512345.67', pctChange: '1.2' }, ETHBRL: { name: 'Ethereum/Real Brasileiro', bid: '18000', pctChange: '-0.5' } });
  if (/ntfy\.sh/.test(u)) return { getResponseCode: () => 200, getContentText: () => '{}' };
  if (/api\.telegram/.test(u)) return json({ ok: true, result: {} });
  if (typeof o.payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp('ok'); } }
  return json({});
}
H.setFetch(mock);
// sem chaves: os opcionais nem são chamados
H.fetchLog.length = 0;
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(r.cerebro === 'Groq GPT-OSS 120B' && !H.fetchLog.some(f => /github|mistral|nvidia|cloudflare/.test(f.u)), 'sem chave, opcionais ficam fora');
// com GITHUB_TOKEN: código vai pro GPT-4.1 primeiro, sem reasoning_effort
H.PROPS.GITHUB_TOKEN = 'ghp'; H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(r.cerebro === 'GitHub GPT-4.1' && H.fetchLog[0].u === 'https://models.github.ai/inference/chat/completions' && H.fetchLog[0].body.model === 'openai/gpt-4.1' && !('reasoning_effort' in H.fetchLog[0].body) && H.fetchLog[0].h.Authorization === 'Bearer ghp', 'código → GitHub GPT-4.1 sem reasoning_effort');
// texto comum continua no Gemini
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.cerebro === 'Gemini', 'texto comum segue no Gemini');
// Mistral e NVIDIA como reservas quando Gemini e Groq caem
H.PROPS.MISTRAL_KEY = 'mk'; H.fetchLog.length = 0;
H.setFetch((u, o) => (/generativelanguage|groq/.test(u) && typeof o.payload === 'string' && JSON.parse(o.payload).messages) ? cai(429, 'rate limit') : mock(u, o));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi de novo' }] });
ok(r.cerebro === 'Mistral' && H.fetchLog.some(f => /api\.mistral\.ai/.test(f.u) && f.body.model === 'mistral-medium-latest'), 'Gemini e Groq fora → Mistral: ' + r.cerebro);
Object.keys(H.CACHE).forEach(k => { if (/^off_/.test(k)) delete H.CACHE[k]; });
// Cloudflare só com as duas props e URL montada com a conta
H.PROPS.CF_TOKEN = 'cft'; H.setFetch(mock); H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'cloudflare', mensagens: [{ role: 'user', content: 'oi' }] });
ok(!H.fetchLog.some(f => /cloudflare/.test(f.u)), 'Cloudflare sem CF_ACCOUNT_ID fica fora');
H.PROPS.CF_ACCOUNT_ID = 'acc1'; H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'cloudflare', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.cerebro === 'Cloudflare Llama 70B' && H.fetchLog[0].u === 'https://api.cloudflare.com/client/v4/accounts/acc1/ai/v1/chat/completions', 'Cloudflare com conta: URL certa');
// leitura de link
H.setFetch(mock);
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'resume isso https://exemplo.com/iphone-17-pro' }] });
ok(/### LEITURA DA PÁGINA https:\/\/exemplo\.com\/iphone-17-pro/.test(sys) && /Preço R\$ 9\.999/.test(sys) && chamadas.some(c => c.u === 'https://r.jina.ai/https://exemplo.com/iphone-17-pro'), 'lê a página do link pelo Jina');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto tá a selic?' }] });
ok(/### TAXAS/.test(sys) && /Selic: 10,5% ao ano/.test(sys), 'taxas BR');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'e o bitcoin hoje?' }] });
ok(/### CRIPTO/.test(sys) && /Bitcoin: R\$ 512\.345,67/.test(sys), 'bitcoin: ' + (sys.match(/Bitcoin[^\n]*/) || [''])[0]);
// ntfy no bom dia
H.PROPS.NTFY_TOPICO = 'zicoai-abc123';
chamadas.length = 0; H.ctx.bomDia();
const n = chamadas.find(c => /ntfy\.sh/.test(c.u));
const nb = n ? JSON.parse(n.o.payload) : {};
ok(n && nb.topic === 'zicoai-abc123' && nb.title === '☀️ Bom dia, Thiago' && nb.click, 'bom dia vai pro ntfy: ' + JSON.stringify(nb).slice(0, 80));
// telegram: typing antes de responder, comandos
H.PROPS.TELEGRAM_TOKEN = 'tok'; H.PROPS.TELEGRAM_SEGREDO = 'seg'; H.PROPS.TELEGRAM_CHAT_ID = '555';
chamadas.length = 0;
H.ctx.doPost({ parameter: { tg: 'seg' }, postData: { contents: JSON.stringify({ update_id: 99, message: { chat: { id: 555 }, text: 'oi' } }) } });
ok(chamadas.some(c => /sendChatAction/.test(c.u)) && chamadas.findIndex(c => /sendChatAction/.test(c.u)) < chamadas.findIndex(c => /sendMessage/.test(c.u)), 'typing antes da resposta');
chamadas.length = 0;
H.ctx.doPost({ parameter: { tg: 'seg' }, postData: { contents: JSON.stringify({ update_id: 100, message: { chat: { id: 555 }, text: '/cotas' } }) } });
ok(chamadas.some(c => /sendMessage/.test(c.u) && /Gemini: \d+\/480 hoje/.test(JSON.parse(c.o.payload).text)), '/cotas responde o uso');
chamadas.length = 0; H.ctx.ligarTelegram();
ok(chamadas.some(c => /setMyCommands/.test(c.u)), 'comandos registrados no bot');
// GitHub Models: endpoint novo responde "OK" em texto → tenta o antigo (Azure) e usa se vier JSON
H.PROPS.GITHUB_TOKEN = 'ghp'; H.fetchLog.length = 0;
H.setFetch((u, o) => { if (/models\.github\.ai/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'OK\r\n' }; if (/models\.inference\.ai\.azure\.com/.test(u)) return resp('do endpoint antigo'); return mock(u, o); });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(r.cerebro === 'GitHub GPT-4.1' && /do endpoint antigo/.test(r.resposta) && H.fetchLog.some(f => /azure\.com/.test(f.u) && f.body.model === 'gpt-4.1') && H.fetchLog.some(f => /models\.github\.ai/.test(f.u) && f.h['X-GitHub-Api-Version']), 'GitHub "OK" → endpoint antigo responde: ' + r.cerebro);
H.setFetch((u, o) => { if (/models\.github\.ai/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'OK\r\n' }; if (/azure\.com/.test(u)) return cai(401, '{"error":{"message":"bad token"}}'); return mock(u, o); });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(r.ok && r.cerebro !== 'GitHub GPT-4.1' && r.passos.some(p => /GitHub GPT-4\.1 falhou \(.*endpoint antigo: 401/.test(p)), 'os dois falham → passo explica, Groq responde');
