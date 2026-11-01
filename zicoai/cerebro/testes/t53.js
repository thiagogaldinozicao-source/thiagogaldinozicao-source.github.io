// v74: navegador dela com um dono por vez; ela só usa quando o Thiago pede
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
run('var _chamou = []; ponteSemDetalhe = function(a, d){ _chamou.push(d.op); return { ok: true, titulo: "T", url: "https://x.com" }; };');
const usa = (ped, ferr) => run('FERRAMENTAS.' + (ferr || 'web_abrir') + '.run({ url: "https://x.com", texto: "oi" }, { pedido: ' + JSON.stringify(ped) + ' })');
ok(/só é usado quando o Thiago pede/.test(usa('qual a bateria do iphone 17?', 'web_pesquisar')), 'pergunta comum: ela não abre o navegador');
ok(!/^ERRO/.test(usa('abre o site da apple e vê a bateria do 17')), 'pediu "abre o site": usa');
ok(!/^ERRO/.test(usa('testa no navegador a calculadora', 'web_erros')), 'pediu "testa no navegador": usa');
ok(!/^ERRO/.test(usa('entra em thiagogaldinozicao-source.github.io/zicoai e clica em Enviar', 'web_clicar')), 'mandou link: usa');
run('_chamou = []');
let r = run('navegarManual({ op: "tocar", x: 10, y: 10 })');
ok(r.ok && run('_chamou.join()') === 'tocar', 'Thiago tocou: foi pro Mac');
ok(/Thiago está usando/.test(usa('abre o site da apple')), 'Thiago usando: ela fica de fora, mesmo pedindo');
ok(run('_chamou.join()') === 'tocar', 'nenhum comando dela chegou no navegador enquanto ele usa');
run('navegarManual({ op: "soltar" })');
ok(run('_chamou.join()') === 'tocar', 'soltar não chama o Mac');
ok(!/^ERRO/.test(usa('abre o site da apple')), 'fechou o painel: ela pode usar de novo (quando ele pedir)');
ok(run('webNav({ op: "abrir", url: "https://example.com/" })').indexOf('ERRO') !== 0, 'teste do editor (testarNavegadorZico) continua direto');
