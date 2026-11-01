// v93: FOCO NO CÓDIGO — com a calculadora DE VERDADE (116 mil letras): o cérebro recebe o mapa + só os trechos ligados ao pedido
// (~30 mil), e o bloco ANTES/DEPOIS copiado do trecho é aplicado no arquivo inteiro (o resto fica igual).
const H = require('./harness'), vm = require('vm'), fs = require('fs'), path = require('path');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const CALC = fs.readFileSync(path.join(__dirname, 'calc_real.html'), 'utf8');
const PEDIDO = 'corrige a calculadora: na tabela de parcelas, R$ 1.000 em 12x mostra 12× 83,33 = 999,96. a 1ª parcela tem que ser 83,37 igual no resumo. não mexe no deslizar pra apagar nem na velocidade';
const ANTES = "tb+='<tr data-n=\"'+key+'\"'+(key===k?' class=\"sel\"':'')+'><td>'+pName(key)+'</td><td>'+(c>1?money(x.par):'')+'</td>";
ok(CALC.length > 100000 && CALC.indexOf(ANTES) >= 0, 'arquivo real da calculadora (' + CALC.length + ' letras) tem a linha da tabela');
run(`var _rasc = {}; guardarRascunho_ = function(c, s, h){ _rasc[c] = { slug: s, html: h }; }; lerRascunho_ = function(c){ return _rasc[c] || null; };
codigoDoApp = function(s){ return s === 'repo:Calculadora-do-zicao' ? ${JSON.stringify(CALC)} : null; };
appDoPedido_ = function(p){ return /calculadora/i.test(p) ? 'repo:Calculadora-do-zicao' : null; };
ponte = function(acao, d){ return acao === 'testar_html' ? { erros: [], avisos: [], botoesTestados: 12, provas: (d.provas||[]).map(function(p){ return { nome: p.nome, ok: /1ª/.test(d.html.match(/<td>'\\+pTxt|pTxt=/) ? '1ª' : '') }; }) } : {}; };`);
// 1) o que vai pro cérebro
const tr = run(`trechosDoCodigo_(${JSON.stringify(CALC)}, ${JSON.stringify(PEDIDO)})`);
ok(tr.length < 32000 && tr.indexOf(ANTES) >= 0 && /function parcCalc/.test(tr), 'trechos: ' + tr.length + ' letras, com a linha da tabela e a parcCalc');
const mapa = run(`mapaDoCodigo_(${JSON.stringify(CALC)})`);
ok(/calcParc:\d+/.test(mapa) && /pTab/.test(mapa), 'mapa lista funções com linha e os ids');
// 2) pedido real: o sistema vai enxuto e o conserto aplica no arquivo inteiro
let sis = '';
const FIX = 'A tabela usava só x.par; agora mostra a 1ª com a sobra (x.first), igual o resumo.\n<<<<<<< ANTES\n' + ANTES + '\n=======\n' + ANTES.replace("(c>1?money(x.par):'')", "(c>1?(x.first?'1ª '+money(x.first):money(x.par)):'')") + '\n>>>>>>> DEPOIS';
H.setFetch((u, o) => { try { const b = JSON.parse(o.payload); if (b.messages) sis = b.messages[0].content; } catch (e) {} return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: FIX } }] }), getHeaders: () => ({}) }; });
const r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: PEDIDO }] });
ok(r.ok && r.passos.some(p => /mandou o mapa \+ só os trechos/.test(p)), 'passo: mandou mapa + trechos');
ok(sis.length < 60000 && /#### MAPA/.test(sis) && sis.indexOf(ANTES) >= 0, 'sistema com ' + sis.length + ' letras (antes ia o arquivo inteiro, ~125 mil)');
const rasc = run('Object.keys(_rasc).map(function(k){ return _rasc[k].html; })[0] || ""');
ok(rasc.length >= CALC.length && /x\.first\?'1ª '\+money\(x\.first\)/.test(rasc) && rasc.replace(/\(c>1\?\(x\.first\?'1ª '\+money\(x\.first\):money\(x\.par\)\):''\)/, "(c>1?money(x.par):'')") === CALC.replace(/\s+$/, ''), 'conserto aplicado no arquivo INTEIRO; o resto ficou igual letra por letra');
// 3) pedido sem nada a ver com o código: manda inteiro? não — app grande sem palavra útil cai no arquivo (cortado em 150 mil)
ok(run(`blocoCodigoApp_("<html>pequeno</html>", "muda a cor")`) === '```html\n<html>pequeno</html>\n```', 'app pequeno continua indo inteiro');
ok(/versão (9[3-9])/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 93 ou mais nova');
