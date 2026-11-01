// v75: cada conversa tem a sua aba no navegador dela (sessão = id da conversa)
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
run('var _ped = []; ponteSemDetalhe = function(a, d){ _ped.push(JSON.parse(JSON.stringify(d))); return { ok: true, titulo: "Aba de " + d.sessao, url: "https://x.com", tela: "SU1H" + d.sessao }; };');
// agente na conversa A pede o navegador
run('FERRAMENTAS.web_abrir.run({ url: "https://x.com" }, { chatId: "convA", pedido: "abre o site x.com" })');
ok(run('_ped[0].sessao') === 'convA', 'agente da conversa A usa a aba da conversa A');
// Thiago mexendo na conversa B pelo painel
let r = H.post({ pin: '1234', acao: 'navegar', op: 'tocar', x: 1, y: 1, chatId: 'convB' });
ok(r.ok && run('_ped[1].sessao') === 'convB', 'painel da conversa B mexe só na aba da conversa B');
// Thiago usando a B não trava a A
ok(!/Thiago está usando/.test(run('FERRAMENTAS.web_ler.run({}, { chatId: "convA", pedido: "lê o site aberto" })')), 'Thiago na conversa B: ela continua usando a aba da A');
ok(/Thiago está usando/.test(run('FERRAMENTAS.web_ler.run({}, { chatId: "convB", pedido: "lê o site aberto" })')), 'na conversa B (onde ele tá mexendo) ela fica de fora');
// tela ao vivo por conversa
let tA = H.post({ pin: '1234', acao: 'telaVivo', desde: 0, chatId: 'convA' }), tB = H.post({ pin: '1234', acao: 'telaVivo', desde: 0, chatId: 'convB' });
ok(tA.tela && tA.tela.img === 'SU1HconvA' && tB.tela && tB.tela.img === 'SU1HconvB', 'cada conversa vê só o print da sua aba');
ok(H.post({ pin: '1234', acao: 'telaVivo', desde: 0, chatId: 'convC' }).tela === null, 'conversa sem aba não vê print de ninguém');
// fechar o painel solta só aquela conversa
H.post({ pin: '1234', acao: 'navegar', op: 'soltar', chatId: 'convB' });
ok(!/Thiago está usando/.test(run('FERRAMENTAS.web_ler.run({}, { chatId: "convB", pedido: "lê o site aberto" })')), 'fechou o painel da B: ela pode usar a B de novo');
ok(run('sessaoNav("a b/../c")') === 'abc' && run('sessaoNav("")') === 'geral', 'nome da sessão limpo; sem conversa = geral');
ok(/versão (7[5-9]|[89]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 75 ou mais nova');
