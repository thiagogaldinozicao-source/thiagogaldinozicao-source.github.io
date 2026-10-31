// Modo capricho: pedido difícil → cérebro forte pensando mais + outro cérebro revisa antes de entregar
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
let chamadas = []; let revisor = 'OK'; let rascunho = 'Rascunho: o iPhone 13 tem tela de 6,1 polegadas e chip A15, bateria boa pra um dia inteiro de uso normal.';
H.setFetch((u, o) => {
  if (typeof (o || {}).payload !== 'string') return json({});
  const b = JSON.parse(o.payload);
  if (!b.messages) return json({});
  const ehRev = /Você é o REVISOR da ZicoAI/.test(b.messages[0].content);
  chamadas.push({ u, rev: ehRev, effort: b.reasoning_effort, modelo: b.model });
  return resp(ehRev ? revisor : rascunho);
});
const chat = (txt, extra) => H.post(Object.assign({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: txt }] }, extra || {}));

// 1) pergunta simples: sem capricho, 1 chamada só
let r = chat('oi tudo bem?');
ok(r.ok && chamadas.length === 1 && !chamadas[0].rev && !r.passos.some(p => /capricho/i.test(p)), 'pergunta simples não usa capricho');

// 2) capricho ligado, revisor aprova → fica o rascunho
chamadas = []; revisor = 'OK';
r = chat('me fala do iphone 13', { capricho: true });
ok(chamadas.length === 2 && chamadas[1].rev, 'capricho chama um revisor depois do rascunho');
ok(/^Rascunho:/.test(r.resposta) && !/revisão/.test(r.cerebro), 'revisor aprovou → entrega o rascunho');
ok(r.passos.some(p => /Modo capricho/.test(p)) && r.passos.some(p => /aprovou o rascunho/.test(p)), 'passos mostram capricho e aprovação');
ok(chamadas[0].u !== chamadas[1].u, 'revisor é outro cérebro: ' + chamadas.map(c => c.u.split('/')[2]).join(' → '));

// 3) revisor corrige → entrega a versão corrigida
chamadas = []; revisor = 'O iPhone 13 tem tela de 6,1", chip A15 Bionic e bateria que aguenta o dia todo no uso normal. Corrigido e completo.';
r = chat('me fala do iphone 13', { capricho: true });
ok(/A15 Bionic/.test(r.resposta) && /revisão/.test(r.cerebro) && r.passos.some(p => /corrigiu/.test(p)), 'revisor corrigiu → entrega a versão corrigida (' + r.cerebro + ')');

// 4) "OK, tá bom" também é aprovação
chamadas = []; revisor = 'OK, o rascunho está correto.';
r = chat('me fala do iphone 13', { capricho: true });
ok(/^Rascunho:/.test(r.resposta), '"OK, ..." conta como aprovação');

// 5) revisor só comenta (curto) num rascunho longo → mantém o rascunho
chamadas = []; rascunho = 'Plano completo: ' + 'passo detalhado com explicação. '.repeat(40); revisor = 'Faltou falar do prazo de entrega no plano.';
r = chat('me fala do iphone 13', { capricho: true });
ok(/^Plano completo/.test(r.resposta) && r.passos.some(p => /só observação/.test(p)), 'comentário curto do revisor não apaga o rascunho');

// 6) pedido difícil de código liga sozinho e pede raciocínio alto ao gpt-oss
chamadas = []; rascunho = 'Aqui o código corrigido:\n```js\nfunction soma(a,b){ return a+b; }\n```\nTestei mentalmente com 2+2 = 4.'; revisor = 'OK';
r = chat('corrige esse bug no meu script javascript: function soma(a,b){ return a-b }');
ok(r.passos.some(p => /Modo capricho/.test(p)) && chamadas.some(c => c.rev), 'código com bug liga o capricho sozinho');
ok(chamadas.some(c => !c.rev && c.effort === 'high') || chamadas.some(c => c.rev && c.effort === 'high'), 'gpt-oss pensa no máximo (reasoning_effort high)');

// 7) Thiago desligou o capricho → nada de revisão mesmo sendo difícil
chamadas = [];
r = chat('corrige esse bug no meu script javascript: function soma(a,b){ return a-b }', { capricho: false });
ok(!chamadas.some(c => c.rev) && !r.passos.some(p => /capricho/i.test(p)), 'capricho:false desliga');

// 8) revisor fora do ar → entrega o rascunho mesmo assim
chamadas = []; rascunho = 'Rascunho curto mas útil sobre o assunto pedido pelo Thiago.';
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (/REVISOR/.test(b.messages[0].content)) return { getResponseCode: () => 500, getContentText: () => 'erro' }; return resp(rascunho); });
r = chat('me fala do iphone 13', { capricho: true });
ok(r.ok && /^Rascunho curto/.test(r.resposta), 'revisor fora do ar → entrega o rascunho');

// 9) ehDificil
const vm = require('vm');
const d = t => vm.runInContext('ehDificil(' + JSON.stringify(t) + ', false)', H.ctx);
ok(!d('quanto tá o 13?') && !d('bom dia') && d('analisa e compara as vendas desse mês com o mês passado e me fala o que melhorar na loja') && vm.runInContext('ehDificil("x", true)', H.ctx), 'ehDificil separa fácil de difícil');
