// v91: uma foto grande (700 KB) fazia TODO cérebro dizer "conversa grande demais pro plano grátis" (base64 contado como texto).
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const foto = 'data:image/jpeg;base64,' + 'A'.repeat(1000000);
ok(run('estimarTokens')(JSON.stringify([{ role: 'user', content: [{ type: 'text', text: 'oi' }, { type: 'image_url', image_url: { url: foto } }] }])) < 3000, 'foto de 1 MB conta como ~1.300 tokens, não 300 mil');
ok(run('estimarTokens')('x'.repeat(32000)) === 10000, 'texto normal continua igual');
let chamou = 0;
H.setFetch((u, o) => { chamou++; return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'É um iPhone 15 Pro.' } }] }), getHeaders: () => ({}) }; });
const r = H.post({ pin: '1234', acao: 'chat', aparelho: 'iPhone', imagem: foto, mensagens: [{ role: 'user', content: 'que celular é esse?' }] });
ok(r.ok && /iPhone 15 Pro/.test(r.resposta) && !r.passos.some(p => /grande demais/.test(p)), 'chat com foto grande responde (' + (r.cerebro || r.erro) + ')');
ok(/versão (1\d\d|9[1-9])/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 91 ou mais nova');
