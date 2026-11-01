// v99: PARES BOA × RUIM pro treino DPO — erro corrigido e academia viram par; só 'aprovada' com prova; GPT/Groq/Claude fora; nada apagado.
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
run("aba('preferencias'); aba('destilacao'); aba('estudo_erros'); aba('aulas')");
const P = () => H.sheets.preferencias.rows.slice(1);
// 1) academia: nosso cérebro falha antes de algum grande passar → fica 'sem par'
const E = { id: 'gorjeta-por-pessoa', pedido: 'a gorjeta não divide por pessoa' };
run('var _E = ' + JSON.stringify(E));
run("parDaAcademia_(_E, 'Mac (qwen3:8b)', 'não', 'Ajustei.\\n<<<<<<< ANTES\\nvar t = c;\\n=======\\nvar t = c + 0;\\n>>>>>>> DEPOIS')");
ok(P().length === 1 && P()[0][7] === 'sem par' && P()[0][6] === 'Mac (qwen3:8b)' && /\[academia:gorjeta-por-pessoa\]/.test(P()[0][2]), 'nosso cérebro falhou: guarda a ruim esperando a boa');
// um grande passa → completa o par
run("parDaAcademia_(_E, 'Gemini Flash', 'sim', 'Faltava dividir.\\n<<<<<<< ANTES\\nbrl(total)\\n=======\\nbrl(total / n)\\n>>>>>>> DEPOIS')");
ok(P()[0][7] === 'aprovada' && /total \/ n/.test(P()[0][3]) && P()[0][5] === 'Gemini Flash', 'grande passou nas provas: par completo e aprovado');
// GPT passou: não serve de boa
run("parDaAcademia_({ id: 'dolar-virgula', pedido: 'dólar com vírgula' }, 'PC (qwen3.6:35b)', 'não', 'tentei x')");
run("parDaAcademia_({ id: 'dolar-virgula', pedido: 'dólar com vírgula' }, 'Claude', 'sim', 'conserto do claude')");
ok(P().find(l => /dolar-virgula/.test(l[2]))[7] === 'sem par', 'conserto do Claude não vira resposta boa');
// destilação aprovada já existente → par na hora
H.sheets.destilacao.rows.push(['2026-11-01', 'estoque\n[academia:estoque-negativo]', '', 'conserto bom do mistral', 'Mistral (academia)', 'codigo', 'aprovada']);
run("parDaAcademia_({ id: 'estoque-negativo', pedido: 'estoque fica negativo' }, 'PC (qwen3.6:35b)', 'não', 'conserto ruim do pc')");
const est = P().find(l => /estoque-negativo/.test(l[2]));
ok(est && est[7] === 'aprovada' && est[3] === 'conserto bom do mistral', 'já tinha conserto aprovado: par sai na hora');
// grande que falha / sem teste: não vira par
const n0 = P().length;
run("parDaAcademia_(_E, 'Mistral', 'não', 'errado do mistral'); parDaAcademia_(_E, 'Mac (qwen3:8b)', 'sem teste', 'qualquer')");
ok(P().length === n0, 'grande que errou ou Mac fora do ar: não vira par');
// repetido não duplica
run("parDaAcademia_({ id: 'estoque-negativo', pedido: 'estoque fica negativo' }, 'PC (qwen3.6:35b)', 'não', 'conserto ruim do pc')");
ok(P().length === n0, 'mesmo par não entra 2 vezes');

// 2) erro corrigido (professor): ruim = o que ela disse, boa = resposta certa
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ causa: 'inventou', regra: 'Preço só da tabela, nunca de cabeça.', porque: 'x', situacoes: ['preço'], erro_comum: 'x', resposta_certa: 'Não tenho esse preço confirmado, vou ver na tabela.', tipo: 'preço' }) } }] }), getHeaders: () => ({}) }));
const r = run("licaoDoErro_({ conversa: 'c1', pedido: 'quanto ta o 15 pro? meu numero 35 98888-7777', errada: 'O 15 Pro tá R$ 4.500', quando: '2026-11-01 10:00:00', reclamacao: 'de onde vc tirou?', cerebroErrado: 'Mac (qwen3:8b)' })");
const pe = P().find(l => /15 pro/i.test(l[2]));
ok(r.aprendeu && pe && pe[3] === 'Não tenho esse preço confirmado, vou ver na tabela.' && pe[4] === 'O 15 Pro tá R$ 4.500' && pe[6] === 'Mac (qwen3:8b)', 'erro reclamado vira par (boa = certa, ruim = a dela)');
ok(!/98888/.test(pe[2]), 'telefone de cliente sai mascarado no par');
ok(['aprovada', 'revisar'].indexOf(pe[7]) >= 0, 'status depende da nota de outro cérebro (' + pe[7] + ')');

// 3) estudo_erros antigos viram pares uma vez (autor da aula; aprovada só se virou aula)
H.sheets.aulas.rows.push(['X7', 'X', 'Garantia', 'garantia', 'Garantia só da base.', '...', 'aprendeu sozinha com o erro de 2026-10-31 (nota 9 de outro cérebro; autor Gemini 3.1 Flash-Lite)']);
H.sheets.estudo_erros.rows.push(['2026-10-31', 'c9', 'qual a garantia do seminovo?', 'É 1 ano!', 'tá errado', 'inventou', 'regra', 'aula', 'A garantia tá na base: 90 dias.', '', 'virou aula X7']);
H.sheets.estudo_erros.rows.push(['2026-10-31', 'c8', 'faz um post', 'post ruim', 'feio', 'x', 'regra', 'aula', 'post melhor', '', 'revisar']);
H.sheets.estudo_erros.rows.push(['2026-11-01', 'c7', 'arruma a calculadora', 'conserto certo', 'corrige', 'x', 'regra', 'aula', 'outro', '', 'descartado 01/11 (Claude): erro era do TESTE']);
const n = run('paresAntigos_()');
ok(n === 2 && P().find(l => /garantia do seminovo/.test(l[2]))[7] === 'aprovada' && P().find(l => /faz um post/.test(l[2]))[7] === 'revisar', 'erros antigos viram par (só o que virou aula fica aprovado)');
ok(!P().some(l => /arruma a calculadora/.test(l[2])), 'lição descartada não vira par');

// 4) exporta só aprovados, sem GPT, no formato DPO; só o Mac puxa
const j = run('preferenciasJsonl()');
const linhasJ = j.jsonl.split('\n').map(x => JSON.parse(x));
ok(j.total === P().filter(l => l[7] === 'aprovada').length && linhasJ.every(x => x.prompt[0].role === 'user' && x.chosen[0].content && x.rejected[0].content), 'jsonl com prompt/chosen/rejected (' + j.total + ')');
ok(!/claude/i.test(j.jsonl), 'nada do Claude no treino');
let x = H.post({ pin: '1234', acao: 'pontePreferencias', disp: 'nav' });
ok(x && x.ok === false, 'só o Mac puxa os pares');
x = H.post({ pin: '1234', acao: 'preferencias' });
ok(x.ok && x.placar.aprovada >= 3, 'ação preferencias mostra o placar: ' + JSON.stringify(x.placar));
ok(P().length >= 6 && P().every(l => l[7]), 'nada apagado, toda linha com status');
ok(/versão (1\d\d|99|1\d\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 99 ou mais nova');
