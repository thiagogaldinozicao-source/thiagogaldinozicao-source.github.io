// v74: estudo só aprova o que foi conferido (defeitos da noite de 31/10)
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const resp = (cod, t) => ({ getResponseCode: () => cod, getContentText: () => t || '', getHeaders: () => ({}) });
// via.placeholder.com não existe mais (DNS falha); o resto abre
H.setFetch(u => { if (/via\.placeholder/.test(u)) throw new Error('DNS error: via.placeholder.com'); if (/sumiu/.test(u)) return resp(404); return resp(200, 'ok'); });
let rodadas = [];
run('var _rodadas = []; testarApp = function(h){ _rodadas.push(h); return /throw/.test(h) ? { erros: ["Uncaught Error: boom"], avisos: [], rodou: true } : { erros: [], avisos: [], rodou: true }; };');
const cod = { tema: 'JS', tipo: 'código' }, cmp = { tema: 'iPhone', tipo: 'comparativo' }, cli = { tema: 'WhatsApp', tipo: 'cliente' };
const chk = (t, p, r, m) => run('checarExercicio_(' + JSON.stringify(t) + ',' + JSON.stringify(p) + ',' + JSON.stringify(r) + ',' + JSON.stringify(m || '') + ')');

// 1) marcas
ok(/marca \[PREÇO\]/.test(chk(cod, 'faz um app que mostra [PREÇO] do iphone', '```html\n<p>oi</p>\n```')), 'pergunta de programação com [PREÇO]: reprova');
ok(/marca/.test(chk(cod, 'faz um card de produto', '```html\n<p>Garantia: [GARANTIA]</p>\n```')), 'código com [GARANTIA] dentro: reprova');
ok(chk(cli, 'cliente perguntou o preço do 15, o q respondo?', 'Fala! O 15 tá [PREÇO] no Pix 🔥') === '', 'texto pra cliente pode usar [PREÇO] na resposta');
ok(/marca/.test(chk(cli, 'quanto tá o [MODELO]?', 'Tá [PREÇO]')), 'pergunta de cliente com marca: reprova');

// 2) código roda no Mac antes de aprovar
ok(/link que não abre: https:\/\/via\.placeholder/.test(chk(cod, 'faz um card com foto', '```html\n<img src="https://via.placeholder.com/150">\n```')), 'imagem do via.placeholder.com: reprova (site não existe)');
run('_rodadas = []');
ok(chk(cod, 'faz um contador', '```html\n<button onclick="n++">+</button><script>var n=0</script>\n```') === '' && run('_rodadas.length') === 1, 'html bom: rodou no Mac e passou');
ok(/rodou com erro/.test(chk(cod, 'faz um botão', '```html\n<script>throw new Error("x")</script>\n```')), 'html que dá erro no navegador: reprova');
run('_rodadas = []');
ok(chk(cod, 'soma um array', '```js\nconst s=[1,2].reduce((a,b)=>a+b,0); console.log(s);\n```') === '' && /<script>/.test(run('_rodadas[0]')), 'js solto roda dentro de uma página no Mac');
ok(/sem como rodar python/.test(chk(cod, 'lê um csv', '```python\nimport csv\n```')), 'python: não aprova sem rodar');
ok(/Apps Script/.test(chk(cod, 'lê a planilha', '```js\nSpreadsheetApp.getActive();\n```')), 'Apps Script: não aprova sem rodar');
run('testarApp = function(){ return { erros: [], avisos: [], rodou: false }; }');
ok(/Mac fora do ar/.test(chk(cod, 'faz um contador', '```html\n<p>1</p>\n```')), 'Mac desligado: código não é aprovado');
ok(chk(cod, 'o que é flexbox?', 'É um jeito de alinhar coisas na tela em linha ou coluna.') === '', 'sem código: não precisa do Mac');

// 3) comparativo só com fonte do material
const mat = '\n\n[FONTE https://www.apple.com/br/iphone/compare/]\nA19 Pro ...';
ok(/sem fonte/.test(chk(cmp, 'qual a bateria do 17 pro?', 'Até 33 h de vídeo.', mat)), 'comparativo sem fonte: reprova');
ok(/fora do material/.test(chk(cmp, 'qual o chip do 17?', 'A19. Fonte: https://www.gsmarena.com/iphone17', mat)), 'fonte que não foi lida: reprova');
ok(chk(cmp, 'qual o chip do 17 pro?', 'A19 Pro.\nFonte: https://www.apple.com/br/iphone/compare/', mat) === '', 'fonte do material: passa');

// 4) "tema: ?" no log: toda rodada diz o que fez
run('PropertiesService.getScriptProperties().setProperty("ESTUDO_ULTIMA", String(Date.now()))');
let r = run('estudar()');
ok(r.tema && r.tema.tema && r.tema.tema !== '?', 'rodada pulada tem tema: ' + (r.tema && r.tema.tema));
run('PropertiesService.getScriptProperties().setProperty("ESTUDO_ULTIMA", "0"); PropertiesService.getScriptProperties().setProperty("ESTUDO_TEMA", "1"); PropertiesService.getScriptProperties().setProperty("MODELOS_TESTADOS", Utilities.formatDate(new Date(), FUSO, "yyyyMMdd"));');
run('aprenderComErros = function(){ return { ok: true, aprendeu: false }; }; temCerebro = function(n){ return n === "mac"; }; placarMacRodada = function(){ return { ok: true, tipo: "cliente" }; };');
r = run('estudar()');
ok(r.placarMac && /placar Mac × nuvem \(cliente\)/.test(r.tema && r.tema.tema), 'rodada de placar mostra o tipo: ' + (r.tema && r.tema.tema));
ok(/versão (7[4-9]|[89]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 74 ou mais nova');
