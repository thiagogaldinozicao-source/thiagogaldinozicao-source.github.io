const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
// sem PC configurado: gemini primeiro
H.fetchLog.length = 0; H.setFetch(() => resp('nuvem'));
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem' }] });
ok(H.fetchLog[0].u.includes('generativelanguage'), 'sem PC: gemini primeiro');
// com PC: pc primeiro
H.PROPS.PC_URL = 'https://desk.ts.net/zz/';
H.fetchLog.length = 0; H.setFetch(u => resp(u.includes('ts.net') ? 'do pc' : 'nuvem'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem' }] });
ok(H.fetchLog[0].u === 'https://desk.ts.net/zz/v1/chat/completions' && H.fetchLog[0].body.model === 'zicoai' && r.cerebro === 'PC (zicoai)', 'PC primeiro: ' + r.cerebro);
// foto: pc primeiro
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', imagem: 'data:image/jpeg;base64,AA', mensagens: [{ role: 'user', content: 'lê' }] });
ok(H.fetchLog[0].u.includes('ts.net'), 'foto vai pro PC');
// programação: groq primeiro
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(H.fetchLog[0].u.includes('groq'), 'código vai pro groq');
// PC offline (502 html) → marca desligado e cai pro gemini; próxima nem tenta
H.fetchLog.length = 0;
H.setFetch(u => u.includes('ts.net') ? { getResponseCode: () => 502, getContentText: () => '<html>bad gateway</html>' } : resp('nuvem'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi de novo' }] });
ok(r.cerebro === 'Gemini' && H.CACHE.pc_off, 'PC fora → gemini e marca: ' + r.passos.join(' | '));
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'mais uma' }] });
ok(!H.fetchLog.some(f => f.u.includes('ts.net')), 'não tenta PC por 3 min: ' + r.passos.join(' | '));
// escolher PC no seletor com PC fora → nuvem
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'pc', mensagens: [{ role: 'user', content: 'x' }] });
ok(r.ok && r.cerebro === 'Gemini', 'PC escolhido mas fora → nuvem');
// PC_MODELO
delete H.CACHE.pc_off; H.PROPS.PC_MODELO = 'qwen3.5:9b'; H.fetchLog.length = 0; H.setFetch(() => resp('ok'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'teste' }] });
ok(H.fetchLog[0].body.model === 'qwen3.5:9b', 'PC_MODELO respeitado');
H.ctx.instalar();
