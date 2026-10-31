// Consertos do teste da v41: não prometer ação sem ferramenta, avisar status antigo (versão no sistema),
// tirar [[...]] perdido do começo da resposta, mostrar quando o seletor escolheu o cérebro
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });

let sys = '', devolve = 'ok, resposta de teste.';
H.setFetch((u, o) => { if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp(devolve); } } return resp('ok'); });
const chat = (t, extra) => H.post(Object.assign({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: t }] }, extra || {}));

chat('oi');
ok(/Seu cérebro está na versão \d+/.test(sys), 'sistema diz a versão do cérebro');
ok(!/\{VERSAO\}/.test(sys), 'nenhum {VERSAO} sobrando no sistema');
ok(/Nunca prometa ação que vc não tem como fazer/.test(sys), 'regra: não prometer ação sem ferramenta');
ok(/Texto colado com data ou versão/.test(sys) && /versão \d+ \(/.test(sys.split('Texto colado com data ou versão')[1] || ''), 'regra do status antigo com a versão preenchida');

// [[...]] perdido no começo some; tags de verdade e [[ dentro de código ficam
devolve = '[[ZicoAI — status (30/10/2026, 22:55)]]\n\nRecebido. Tudo certo.';
let r = chat('olha esse status');
ok(r.resposta.startsWith('Recebido.') && r.passos.some(p => /marcação \[\[\.\.\.\]\] perdida/.test(p)), 'tirou o [[...]] perdido do começo');
devolve = 'Usa assim:\n```js\nconst m = [[1, 2], [3, 4]];\n```';
r = chat('como faço uma matriz em js');
ok(/\[\[1, 2\], \[3, 4\]\]/.test(r.resposta), '[[ dentro de código continua igual');
devolve = 'Anotado.\n[[MEMORIA: o Thiago gosta de café sem açúcar]]';
r = chat('lembra que eu gosto de café sem açúcar');
ok(r.resposta === 'Anotado.' && r.salvou.indexOf('memória') >= 0, 'tag de verdade continua funcionando');

// seletor: quando o Thiago escolhe o cérebro, o Como respondi diz
devolve = 'resposta';
r = chat('explica uma coisa', { cerebro: 'gemini' });
ok(r.passos.some(p => /Seletor de cérebro em Gemini/.test(p)), 'Como respondi mostra que o seletor escolheu o cérebro');
r = chat('explica uma coisa difícil', { cerebro: 'gemini', capricho: true });
ok(r.passos.some(p => /no capricho o melhor é deixar em Auto/.test(p)), 'no capricho avisa que o melhor é Auto');
r = chat('oi de novo');
ok(!r.passos.some(p => /Seletor de cérebro/.test(p)), 'no Auto não aparece o aviso do seletor');
