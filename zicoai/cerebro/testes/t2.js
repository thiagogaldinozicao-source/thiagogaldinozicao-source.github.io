const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const cai = (cod, txt) => ({ getResponseCode: () => cod, getContentText: () => txt });
// sem PC configurado: gemini primeiro
H.fetchLog.length = 0; H.setFetch(() => resp('nuvem'));
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem' }] });
ok(H.fetchLog[0].u.includes('generativelanguage'), 'sem PC: gemini primeiro');
// com PC ligado: nuvem continua primeiro (PC 8B é reserva)
H.PROPS.PC_URL = 'https://desk.ts.net/zz/';
H.fetchLog.length = 0; H.setFetch(u => resp(u.includes('ts.net') ? 'do pc' : 'nuvem'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem' }] });
ok(H.fetchLog[0].u.includes('ts.net') && r.cerebro === 'PC (zicoai)' && !H.fetchLog.some(f => f.u.includes('googleapis')), 'Auto com PC ligado prioriza local');
// foto: gemini primeiro, PC reserva
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', imagem: 'data:image/jpeg;base64,AA', mensagens: [{ role: 'user', content: 'lê' }] });
ok(H.fetchLog[0].u.includes('generativelanguage') && r.cerebro === 'Gemini', 'foto vai pro Gemini');
// programação: groq primeiro
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(H.fetchLog[0].u.includes('ts.net'), 'Auto com PC ligado também prioriza local no código');
// nuvem toda fora (429) → PC responde
H.fetchLog.length = 0;
H.setFetch(u => u.includes('ts.net') ? cai(503, 'local indisponível') : resp('reserva nuvem'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi de novo' }] });
ok(r.ok && /Gemini|Groq/.test(r.cerebro) && H.fetchLog.some(f => f.u.includes('ts.net')) && H.fetchLog.some(f => /googleapis|groq/.test(f.u)), 'local falhou → Auto usa reserva: ' + r.passos.join(' | '));
Object.keys(H.CACHE).forEach(k => { if (/^off_/.test(k)) delete H.CACHE[k]; }); // tira o castigo do teste anterior
delete H.CACHE.pc_off;
// Thiago escolhe PC no seletor → PC primeiro
H.fetchLog.length = 0; H.setFetch(u => resp(u.includes('ts.net') ? 'do pc' : 'nuvem'));
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'pc', mensagens: [{ role: 'user', content: 'x' }] });
ok(H.fetchLog[0].u.includes('ts.net') && r.cerebro === 'PC (zicoai)', 'seletor PC → PC primeiro');
// PC offline (502 html) com PC escolhido → marca desligado e cai pro gemini; próxima nem tenta
H.fetchLog.length = 0;
H.setFetch(u => u.includes('ts.net') ? cai(502, '<html>bad gateway</html>') : resp('nuvem'));
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'pc', mensagens: [{ role: 'user', content: 'oi de novo' }] });
ok(!r.ok && r.selecaoMantida && !H.fetchLog.some(f => /googleapis|groq/.test(f.u)), 'PC manual fora: explica sem trocar pela nuvem');
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'pc', mensagens: [{ role: 'user', content: 'mais uma' }] });
ok(!r.ok && r.selecaoMantida && !H.fetchLog.some(f => /googleapis|groq/.test(f.u)), 'nova tentativa manual também não muda de cérebro');
// PC_MODELO
delete H.CACHE.pc_off; H.PROPS.PC_MODELO = 'qwen3.5:9b'; H.fetchLog.length = 0; H.setFetch(() => resp('ok'));
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'pc', mensagens: [{ role: 'user', content: 'teste' }] });
ok(H.fetchLog[0].body.model === 'qwen3.5:9b', 'PC_MODELO respeitado');
H.ctx.instalar();
