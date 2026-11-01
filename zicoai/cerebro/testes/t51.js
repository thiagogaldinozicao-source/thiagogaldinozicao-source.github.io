// v73: Mistral grátis = 1 pedido por segundo: fila entre agentes e 1 nova tentativa no 429
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.MISTRAL_KEY = 'm';
const resp = (cod, t, h) => ({ getResponseCode: () => cod, getContentText: () => t, getHeaders: () => h || {} });
let n = 0;
H.setFetch(u => { n++; return n === 1 ? resp(429, '{"message":"Requests rate limit exceeded"}', { 'Retry-After': '1' }) : resp(200, JSON.stringify({ choices: [{ message: { content: 'oi do mistral' } }] })); });
let t = run('PASSOS = []; chamarCompatSemDetalhe(CEREBROS.mistral, [{role:"user",content:"oi"}], 100)');
ok(t === 'oi do mistral' && n === 2, '429 de 1 por segundo: espera e tenta de novo (não troca de cérebro à toa)');
ok(/esbarrou no limite de 1 pedido por segundo/.test(run('PASSOS.join("|")')), 'passo explica a espera');
// dois pedidos seguidos: o segundo espera ~1,15 s (relógio de mentira do harness)
n = 10; H.setFetch(() => resp(200, JSON.stringify({ choices: [{ message: { content: 'ok' } }] })));
run('CacheService.getScriptCache().put("ritmo_Mistral", String(Date.now()))');
const antes = run('Date.now()'); run('chamarCompatSemDetalhe(CEREBROS.mistral, [{role:"user",content:"oi"}], 100)'); const depois = run('Date.now()');
ok(depois - antes >= 1000, 'pedido logo depois de outro espera a vez (' + (depois - antes) + ' ms)');
// cota do mês (não é o limite por segundo): não fica tentando
n = 0; H.setFetch(() => { n++; return resp(429, '{"message":"monthly quota exceeded"}'); });
let erro = ''; try { run('chamarCompatSemDetalhe(CEREBROS.mistral, [{role:"user",content:"oi"}], 100)'); } catch (e) { erro = String(e.message); }
ok(n === 1 && /429/.test(erro), 'cota do mês acabou: não insiste, troca de cérebro');
ok(run('CEREBROS.groq.rps') === undefined, 'os outros cérebros não ganham espera');
