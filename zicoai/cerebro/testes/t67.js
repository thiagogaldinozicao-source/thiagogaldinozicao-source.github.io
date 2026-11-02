// v89: PROVAS do app — ela escreve, o Mac roda (antigas + novas) a cada mudança; prova que já passava no código velho é avisada;
// e mexendo num app o sistema fica enxuto (sem memória, preços nem base da loja).
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
run('Utilities.getUuid = function(){ return "u" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2); }');
run(`var _arqs = {}; pastaRascunhos = function(){ return {
  getFilesByName: function(n){ var f = _arqs[n]; var dado = false; return { hasNext: function(){ return !!f && !dado; }, next: function(){ dado = true; return { setContent: function(t){ _arqs[n] = t; }, getBlob: function(){ return { getDataAsString: function(){ return _arqs[n]; } }; } }; } }; },
  createFile: function(n, t){ _arqs[n] = t; return {}; } }; };`);
const CALC = '<!doctype html><html><head><title>Calculadora</title></head><body><table id="pTab"><tr data-n="12"><td>12×</td><td>R$ 83,33</td></tr></table><script>var x=1;</script></body></html>';
const PROVA = { nome: '12x fecha no centavo', passos: [{ preencher: '#pV', valor: '1000' }], conferir: [{ js: 'return true' }] };
let resposta = 'Mostrei a 1ª parcela na tabela.\n<<<<<<< ANTES\n<td>R$ 83,33</td>\n=======\n<td>1ª R$ 83,37 + 11× R$ 83,33</td>\n>>>>>>> DEPOIS\n\n```provas\n' + JSON.stringify([PROVA]) + '\n```';
let sis = '';
H.setFetch((u, o) => {
  const r = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) });
  if (/api\.github\.com\/users\//.test(u)) return r(200, JSON.stringify([{ name: 'Calculadora-do-zicao', default_branch: 'main', fork: false, archived: false, private: false }]));
  if (/raw\.githubusercontent\.com\/thiagogaldinozicao-source\/Calculadora-do-zicao/.test(u)) return r(200, CALC);
  if (/api\.github\.com/.test(u)) return r(404, '{}');
  try { const b = JSON.parse(o.payload); if (b.messages && /CÓDIGO ATUAL/.test(b.messages[0].content)) sis = b.messages[0].content; } catch (e) {}
  return r(200, JSON.stringify({ choices: [{ message: { content: resposta } }] }));
});
// Mac de mentira: a prova falha no código velho (83,33 sozinho) e passa no novo
run(`var _chamadas = []; ponte = function(acao, d){ if (acao !== 'testar_html') return {}; _chamadas.push(d); var novo = /1ª R\\$ 83,37/.test(d.html); return { erros: (d.provas||[]).length && !novo ? ['Prova falhou: 12x fecha no centavo — tabela soma 999,96'] : [], avisos: [], botoesTestados: 3, provas: (d.provas||[]).map(function(p){ return { nome: p.nome, ok: novo, detalhe: novo ? '' : 'tabela soma 999,96' }; }) }; };`);
run("aba('memoria').appendRow(['30/10', 'dólar comercial 5,40 e iPhone 17 Pro Max R$ 7.500', 'chat'])");
let r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'Corrige um bug na minha calculadora: na tabela de parcelas, R$ 1.000 em 12x mostra 12× 83,33' }] });
ok(r.ok && /### PROVAS DO APP/.test(sis), 'o cérebro recebe a regra de escrever provas');
ok(!/dólar comercial|### MEMÓRIA|### BASE DA LOJA|### TABELA DE PREÇOS/.test(sis), 'mexendo no app: sem memória, base nem tabela de preços no sistema');
ok(r.passos.some(p => /Programando num app: usou só/.test(p)), 'passo explica o sistema enxuto');
ok(r.passos.some(p => /Mexendo num app: vai no cérebro que aguenta arquivo grande/.test(p)), 'mexendo no app: só cérebro rápido de arquivo grande (não estoura os 6 min)');
ok(!/```provas/.test(r.resposta), 'bloco de provas não aparece pro Thiago');
ok(run('_chamadas.length') === 2 && run('_chamadas[0].provas.length') === 1 && !/1ª R\$ 83,37/.test(run('_chamadas[0].html')), '1º roda a prova no código VELHO (tem que falhar)');
ok(r.passos.some(p => /falharam no código antigo \(pegam o defeito\)/.test(p)), 'passo: a prova pega o defeito');
ok(/Passou nas 1 prova\(s\): 12x fecha no centavo/.test(r.resposta), 'selo diz quais provas passaram');
ok(H.sheets.provas_apps && H.sheets.provas_apps.rows.some(l => l[0] === 'repo:Calculadora-do-zicao' && l[1] === '12x fecha no centavo'), 'prova guardada pro app');
// próximo pedido: a prova antiga roda junto
run('_chamadas = []');
resposta = 'Troquei o título.\n<<<<<<< ANTES\n<title>Calculadora</title>\n=======\n<title>Calc</title>\n>>>>>>> DEPOIS';
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', chatId: r.chatId, mensagens: [{ role: 'user', content: 'muda o título nela pra Calc' }] });
ok(run('_chamadas.length') >= 1 && run('_chamadas[_chamadas.length-1].provas.length') === 1 && run('_chamadas[_chamadas.length-1].provas[0].nome') === '12x fecha no centavo', 'mudança nova roda a prova antiga do app (não volta o defeito)');
ok(r.passos.some(p => /Não escreveu prova pro pedido \(roda as 1 antigas/.test(p)), 'avisa quando ela não escreveu prova nova');
// prova fraca (passa no código velho) é avisada e não é guardada
run('ponte = function(acao, d){ return { erros: [], avisos: [], botoesTestados: 1, provas: (d.provas||[]).map(function(p){ return { nome: p.nome, ok: true, detalhe: "" }; }) }; }');
resposta = 'Ajustei.\n<<<<<<< ANTES\n<title>Calc</title>\n=======\n<title>Calc 2</title>\n>>>>>>> DEPOIS\n```provas\n' + JSON.stringify([{ nome: 'prova fraca', passos: [], conferir: [{ js: 'return true' }] }]) + '\n```';
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', chatId: r.chatId, mensagens: [{ role: 'user', content: 'corrige o título nela' }] });
ok(/já passava antes do conserto/.test(r.resposta) && !H.sheets.provas_apps.rows.some(l => l[1] === 'prova fraca'), 'prova que não pega o defeito: avisa e não guarda');
// Mac sem o teste v2: provas não rodaram vira erro
run('ponte = function(acao, d){ return { erros: [], avisos: [], botoesTestados: 1 }; }');
const t = run('JSON.stringify(testarApp("<!doctype html><html><body>oi</body></html>", [{nome:"x",conferir:[{js:"return true"}]}]))');
ok(/precisa do testar-html v2/.test(t), 'Mac com o teste antigo: avisa que as provas não rodaram');
ok(/versão (1\d\d|89|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 89 ou mais nova');
