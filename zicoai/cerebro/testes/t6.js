// Controle de cota: tokens/min, pedidos/min, pedidos/dia, castigo por 429, contexto enxuto pro Groq
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const cai = (cod, txt) => ({ getResponseCode: () => cod, getContentText: () => txt });
// 1) uso registrado após sucesso
H.setFetch(() => resp('ok'));
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.cerebro === 'Gemini' && H.ctx.usoDia('gemini') === 1 && H.ctx.usoMinuto('gemini').pedidos === 1 && H.ctx.usoMinuto('gemini').tokens > 100, 'uso do Gemini registrado: ' + JSON.stringify(H.ctx.usoMinuto('gemini')));
// 2) Groq no limite de tokens do minuto → pulado sem chamar
H.fetchLog.length = 0;
H.ctx.registrarUso('groq', 7000);
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html simples' }] });
ok(r.cerebro === 'Gemini' && !H.fetchLog.some(f => f.u.includes('groq')) && r.passos.some(p => /Groq GPT-OSS 120B pulado: limite de tokens do minuto/.test(p)), 'Groq cheio no minuto é pulado: ' + r.passos.filter(p => /pulado/.test(p)).join(' | '));
// 3) cota do dia acabou → pulado
H.PROPS['rpd_gemini_20261030'] = '480';
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi de novo' }] });
ok(!H.fetchLog.some(f => f.u.includes('generativelanguage')) && r.passos.some(p => /Gemini pulado: cota do dia acabou/.test(p)), 'Gemini sem cota do dia é pulado: ' + r.cerebro);
delete H.PROPS['rpd_gemini_20261030'];
// 4) 429 com "try again in 12.5s" → castigo 13s, próximo pedido pula direto
H.fetchLog.length = 0;
H.setFetch(u => u.includes('generativelanguage') ? cai(429, '{"error":{"message":"Rate limit reached. Please try again in 12.5s."}}') : resp('groq respondeu'));
Object.keys(H.CACHE).forEach(k => { if (/^tk_|^rq_/.test(k)) delete H.CACHE[k]; });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.cerebro === 'Groq GPT-OSS 120B' && H.CACHE.off_gemini && r.passos.some(p => /Gemini deu limite \(Rate limit reached.*\), fica 13s de castigo/.test(p)), '429 → castigo: ' + r.passos.filter(p => /castigo/.test(p)).join(' | '));
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(!H.fetchLog.some(f => f.u.includes('generativelanguage')) && r.passos.some(p => /Gemini pulado: de castigo/.test(p)), 'de castigo não é nem chamado');
delete H.CACHE.off_gemini;
// 5) conversa grande + Groq: recebe versão enxuta (sistema curto, histórico cortado) em vez de ser pulado
H.setFetch(u => u.includes('groq') ? resp('código groq') : resp('gemini'));
H.fetchLog.length = 0;
const grande = 'x'.repeat(9000);
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'groq', mensagens: [{ role: 'user', content: grande }, { role: 'assistant', content: grande }, { role: 'user', content: 'faz um código html' }] });
const b = H.fetchLog[0].body;
ok(r.cerebro === 'Groq GPT-OSS 120B' && b.messages.length === 4 && b.messages[1].content.length <= 1520 && /cortado/.test(b.messages[1].content) && !/### APRENDIZADOS/.test(b.messages[0].content) || /PERFIL/.test(b.messages[0].content), 'Groq recebe contexto enxuto: ' + b.messages.map(m => m.content.length).join(','));
ok(r.passos.some(p => /Resumiu o contexto pra caber no Groq/.test(p)), 'passo "Resumiu o contexto"');
// 6) Gemini com conversa grande recebe tudo
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: grande }, { role: 'assistant', content: grande }, { role: 'user', content: 'e aí' }] });
ok(H.fetchLog[0].body.messages[1].content.length === 9000, 'Gemini recebe a conversa inteira');
// 7) rpm Cerebras (4/min)
H.PROPS.CEREBRAS_KEY = 'c';
for (let i = 0; i < 4; i++) H.ctx.registrarUso('cerebras', 100);
H.fetchLog.length = 0;
H.setFetch(u => u.includes('groq') ? cai(429, 'rate limit') : resp('x'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(!H.fetchLog.some(f => f.u.includes('cerebras')) && r.passos.some(p => /Cerebras GPT-OSS 120B pulado: limite de pedidos do minuto/.test(p)), 'Cerebras respeita 4 pedidos/min');
// 8) ação cotas
r = H.post({ pin: '1234', acao: 'cotas' });
ok(r.ok && r.cotas['Gemini'] && typeof r.cotas['Gemini'].hoje === 'number' && r.cotas['Groq GPT-OSS 120B'].tpm === 7800, 'ação cotas devolve uso: ' + JSON.stringify(r.cotas['Gemini']));
// 9) todos no limite do minuto → espera o minuto virar e responde (não falha)
Object.keys(H.CACHE).forEach(k => { if (/^off_|^tk_|^rq_/.test(k)) delete H.CACHE[k]; });
delete H.PROPS.CEREBRAS_KEY;
for (let i = 0; i < 9; i++) H.ctx.registrarUso('gemini', 10);
H.ctx.registrarUso('groq', 7700); H.ctx.registrarUso('groq2', 7700);
H.fetchLog.length = 0; H.setFetch(() => resp('depois da espera'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.ok && r.cerebro === 'Gemini' && r.passos.some(p => /esperou \d+s pra tentar de novo/.test(p)), 'espera o minuto virar e responde: ' + r.passos.filter(p => /esperou/.test(p)).join(''));
