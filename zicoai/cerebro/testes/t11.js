// Calculadora exata, conversas antigas, trava de PIN, resposta vazia
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
let sys = '';
H.setFetch((u, o) => { if (/awesomeapi/.test(u)) return json({ USDBRL: { bid: '5.40', ask: '5.40', pctChange: '0', create_date: 'x' } }); if (typeof o.payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp('ok'); } } return json({}); });
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'simula 2.500 em 12x com 2,99% pro cliente' }] });
ok(/### CÁLCULO EXATO/.test(sys) && /parcela de R\$ 251,01/.test(sys) && r.passos.some(p => /Fez a conta por código/.test(p)), 'Price entra no sistema');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: '12x de 3000 no pagbank, quanto eu recebo?' }] });
ok(/Pagbank 12x de R\$ 3\.000,00: taxa 12,25%/.test(sys) && /vc recebe R\$ 2\.632,50/.test(sys), 'maquininha');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto fica um iphone de us$ 800 pra mim?' }] });
ok(/Importação/.test(sys) && /US\$ 960,00/.test(sys) && /R\$ 5\.280,00/.test(sys), 'importação com dólar ao vivo');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem?' }] });
ok(!/### CÁLCULO EXATO/.test(sys), 'sem conta, sem seção');
// conversas antigas
H.sheets.mensagens.rows.push(['antigo1', '2026-10-20 10:00:00', 'thiago', 'A Will mandou a lista nova, o frete dela subiu pra 20 por cento', '', 'iPhone']);
H.sheets.mensagens.rows.push(['antigo1', '2026-10-20 10:00:05', 'zicoai', 'Anotado sobre a Will', 'Gemini', 'iPhone']);
H.sheets.chats.rows.push(['antigo1', 'Lista da Will', '2026-10-20 10:00:00', '2026-10-20 10:00:05', 'iPhone']);
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'lembra o que a gente falou sobre o frete da Will?' }] });
ok(/### CONVERSAS ANTIGAS/.test(sys) && /Lista da Will/.test(sys) && /frete dela subiu pra 20/.test(sys) && !/Anotado sobre a Will/.test(sys), 'acha a conversa antiga (só o que o Thiago falou)');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'qual o frete da Will?' }] });
ok(!/### CONVERSAS ANTIGAS/.test(sys), 'sem gatilho, não vasculha conversas');
// resposta vazia → próximo cérebro
H.fetchLog.length = 0;
H.setFetch((u, o) => { if (typeof o.payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) return /generativelanguage/.test(u) ? resp('   ') : resp('groq salvou'); } return json({}); });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.ok && r.cerebro === 'Groq GPT-OSS 120B' && r.passos.some(p => /Gemini falhou/.test(p)), 'resposta vazia pula pro próximo: ' + r.cerebro);
// trava de PIN
for (let i = 0; i < 10; i++) H.post({ pin: 'errado', acao: 'teste' });
r = H.post({ pin: '1234', acao: 'teste' });
ok(!r.ok && /Muitas tentativas/.test(r.erro) && H.CACHE.pin_bloqueado, 'após 10 erros, bloqueia até o PIN certo por 10 min');
delete H.CACHE.pin_bloqueado; delete H.CACHE.pin_erros;
r = H.post({ pin: '1234', acao: 'teste' });
ok(r.ok, 'depois do bloqueio, PIN certo volta a funcionar');
