// v96: ACADEMIA DE CÓDIGO — ela conserta app com defeito só pelo pedido; nota pelas provas ESCONDIDAS no Mac; placar decide a ordem.
const H = require('./harness'), vm = require('vm'), fs = require('fs'), path = require('path');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const EX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'academia', 'exercicios.json'), 'utf8'));
ok(EX.length >= 6 && EX.every(e => e.pedido && e.provas.length && (e.html || e.url)), 'exercícios: ' + EX.length + ' com pedido, provas e app');
ok(EX.every(e => !e.html || !/provas|conserto/.test(e.pedido)), 'pedido não entrega a prova');
let resposta = '', vistoSistema = '';
const G = EX[0];   // gorjeta
H.setFetch((u, o) => {
  const r = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) });
  if (/academia\/exercicios\.json/.test(u)) return r(200, JSON.stringify(EX));
  try { const b = JSON.parse(o.payload); if (b.messages) vistoSistema = JSON.stringify(b.messages); } catch (e) {}
  return r(200, JSON.stringify({ choices: [{ message: { content: resposta } }] }));
});
// Mac de mentira: roda as provas de verdade? aqui simula: passa se o conserto certo está no html
run(`var _ultProvas = null; ponte = function(acao, d){ if (acao !== 'testar_html') return {}; _ultProvas = d.provas; var bom = /brl\\(total \\/ n\\)/.test(d.html); return { erros: [], avisos: [], botoesTestados: 1, provas: (d.provas||[]).map(function(p){ return { nome: p.nome, ok: bom, detalhe: bom ? '' : 'mostra R$ 110,00' }; }) }; };`);
H.PROPS.ACADEMIA_N = '0';   // no teste só o Gemini tem chave (Mac/PC fora): rodada 0 = gorjeta
// conserto certo
resposta = 'Faltava dividir pelas pessoas.\n<<<<<<< ANTES\n' + G.conserto[0][0] + '\n=======\n' + G.conserto[0][1] + '\n>>>>>>> DEPOIS';
let r = run('treinoCodigo(null, true)');
ok(r.ok && r.exercicio === 'gorjeta-por-pessoa' && r.passou === 'sim' && r.provas === '2/2', 'conserto certo: passou nas 2 provas escondidas (' + r.cerebro + ')');
ok(vistoSistema.indexOf('55,00') >= 0 && vistoSistema.indexOf('90 + 10% em 3') < 0, 'o cérebro viu o pedido, não as provas escondidas');
ok(run('JSON.stringify(_ultProvas)').indexOf('90 + 10% em 3') >= 0, 'as provas escondidas rodaram no Mac');
const linhaA = H.sheets.academia.rows[H.sheets.academia.rows.length - 1];
ok(linhaA[1] === 'gorjeta-por-pessoa' && linhaA[3] === 'sim', 'linha na aba academia');
// conserto errado (mexe noutro lugar): não passa
H.PROPS.ACADEMIA_N = '0';
resposta = 'Ajustei.\n<<<<<<< ANTES\nvar total = c + c * p / 100;\n=======\nvar total = c + c * p / 100 + 0;\n>>>>>>> DEPOIS';
r = run('treinoCodigo(null, true)');
ok(r.passou === 'não' && /R\$ 110,00/.test(r.detalhe + JSON.stringify(H.sheets.academia.rows.slice(-1))), 'conserto errado: reprovado com o motivo');
// fora do horário não roda sozinho
const h = Number(run("Utilities.formatDate(new Date(), FUSO, 'H')"));
r = run('treinoCodigo(null, false)');
ok((h >= 23 || h < 7) ? true : r.pulou && /23h às 7h/.test(r.pulou), 'de dia o gatilho não gasta cota');
// placar muda a ordem quando mexe em app
H.sheets.academia.rows.length = 1;
const hoje = run("Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd HH:mm:ss')");
for (let i = 0; i < 4; i++) { H.sheets.academia.rows.push([hoje, 'x', 'Mistral', 'sim', '2/2', 10, 'ok']); H.sheets.academia.rows.push([hoje, 'x', 'Gemini', 'não', '0/2', 10, 'erro']); }
const ordem = run("ordemPelaAcademia_(['gemini', 'mistral', 'nvidia'])");
ok(ordem[0] === 'mistral' && ordem.indexOf('gemini') > ordem.indexOf('nvidia'), 'quem acertou mais na academia vai primeiro: ' + ordem.join(' → '));
ok(H.sheets.destilacao && H.sheets.destilacao.rows.some(l => /\[academia:gorjeta-por-pessoa\]/.test(l[1]) && l[6] === 'aprovada' && l[5] === 'codigo'), 'conserto aprovado pelas provas vira treino pro nosso cérebro (destilação)');
ok(run('ACADEMIA_CEREBROS.filter(function(n){ return n === "mac" || n === "pc"; }).length') * 2 >= run('ACADEMIA_CEREBROS.length'), 'metade das rodadas é do nosso cérebro (Mac/PC)');
ok(/versão (1\d\d|9[7-9])/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 97 ou mais nova');
