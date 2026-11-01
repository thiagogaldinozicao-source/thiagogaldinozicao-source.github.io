// v74: trajetórias DELA (aprovadas pelo Thiago) viram treino do Mac; as do Claude ficam só de consulta
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PONTE_SEGREDO_MAC = 'sm';
const res = 'O iPhone 15 128GB tá R$ 3.999 no Pix na nossa tabela, abaixo da média das 3 lojas.';
run('aba("tarefas")'); run('aba("detalhes")');
H.sheets.tarefas.rows.push(['tf1', '2026-11-01 06:00:00', 'c1', 'compara o preço do 15 com 3 lojas', 'concluída', '', res, '', 'IPHONE', '']);
H.sheets.tarefas.rows.push(['tf2', '2026-11-01 06:00:00', 'c1', 'manda msg pro cliente 35 98877-6655', 'concluída', '', 'Mandei pro 35 98877-6655 o orçamento do 13.', '', 'IPHONE', '']);
const det = (id, n, nome, ped, resp) => H.sheets.detalhes.rows.push(['2026-11-01', id, n, 'ferramenta', nome, JSON.stringify(ped), resp, 10]);
det('tf1', 1, 'pesquisar_web', { nome: 'pesquisar_web', args: { pergunta: 'preço iphone 15 128gb' }, porque: 'preciso do preço das lojas antes de comparar' }, 'Magalu 4.299, Americanas 4.199, Casas Bahia 4.399');
det('tf1', 2, 'ler_planilha', { nome: 'ler_planilha', args: { aba: 'precos', token: 'abc123secreto' } }, 'iPhone 15 128GB · Pix 3999');
det('tf2', 1, 'ler_planilha', { nome: 'ler_planilha', args: { aba: 'base' } }, 'cliente 35 98877-6655 pediu orçamento');

let r = H.post({ acao: 'feedback', pin: H.PROPS.PIN, nota: 'up', chatId: 'c1', resposta: res, pergunta: 'compara o preço do 15 com 3 lojas', cerebro: 'Agente' });
ok(r.ok && r.salvou.indexOf('trajetória') >= 0, '👍 no resultado da tarefa: trajetória dela aprovada');
const linha = H.sheets.trajetorias_ela.rows[1];
ok(linha && linha[1] === 'tf1' && linha[4] === 2 && linha[5] === 'aprovada', 'aba trajetorias_ela com 2 passos');
const msgs = JSON.parse(linha[3]);
ok(/preciso do preço das lojas/.test(msgs[1].content), 'a decisão ("porque") vai junto com a ferramenta');
ok(/^RESULTADO: Magalu/.test(msgs[2].content), 'resultado de cada ferramenta');
ok(/"resposta"/.test(msgs[msgs.length - 1].content), 'termina com a resposta final');
ok(!/abc123secreto/.test(linha[3]), 'segredo mascarado');
H.post({ acao: 'feedback', pin: H.PROPS.PIN, nota: 'up', chatId: 'c1', resposta: res, pergunta: 'x', cerebro: 'Agente' });
ok(H.sheets.trajetorias_ela.rows.length === 2, '👍 repetido não duplica');
// dado de cliente: esconde; o resultado não chega com telefone
r = run('aprovarTrajetoria("tf2", "teste")');
ok(r.ok && !/98877/.test(H.sheets.trajetorias_ela.rows[2][3]), 'telefone de cliente vira ••• na trajetória');
ok(/9915/.test(run('esconderPessoal("35 99158-0070")')), 'o telefone da loja fica');
// trajetórias do Claude: só consulta
run('aba("trajetorias").appendRow(["30/10", "pedido do Claude", "passos", "lições", "Claude"])');
r = H.post({ acao: 'ponteTrajetorias', segredo: 'sm' });
ok(r.ok && r.total === 2, 'Mac puxa só as dela aprovadas (' + r.total + ')');
const l1 = JSON.parse(r.jsonl.split('\n')[0]);
ok(l1.messages[0].role === 'system' && l1.messages[1].role === 'user', 'formato MLX: {"messages":[system, user, ...]}');
ok(!/pedido do Claude/.test(r.jsonl), 'trajetória do Claude nunca vai pro treino');
ok(H.post({ acao: 'ponteTrajetorias', segredo: 'errado' }).erro === 'segredo errado', 'sem o segredo do Mac não sai nada');
