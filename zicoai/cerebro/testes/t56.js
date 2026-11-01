// testarMistral (editor): mostra o motivo exato, nunca a chave
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.MISTRAL_KEY = 'chave-secreta-xyz';
const resp = (cod, t, h) => ({ getResponseCode: () => cod, getContentText: () => t, getHeaders: () => h || {} });
let n = 0; H.setFetch(() => (++n === 1 ? resp(200, JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { 'x-ratelimit-remaining-req-minute': '49' }) : resp(401, '{"message":"Unauthorized"}')));
const r = run('testarMistral()');
ok(r.ok && /^200 .*ok.*49/.test(r['ministral-8b-2512']), 'modelo small: 200 + resposta + limites');
ok(/^401 .*Unauthorized/.test(r['ministral-14b-2512']) && Object.keys(r).length === 5, 'testa 4 modelos e mostra o código e o motivo');
ok(!/chave-secreta/.test(JSON.stringify(r)) && /termina em xyz/.test(r.chave), 'não mostra a chave');
delete H.PROPS.MISTRAL_KEY; ok(run('testarMistral()').erro === 'sem MISTRAL_KEY', 'sem chave: avisa');
