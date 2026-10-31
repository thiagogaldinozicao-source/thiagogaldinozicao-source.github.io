// v50: aba detalhes legível (uma linha por passo), formato antigo preservado com outro nome, vetor resumido
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k';
// aba no formato antigo (v49) já existe
const velha = H.ctx.aba('detalhes'); velha.rows.splice(0); velha.rows.push(['Id', 'Parte0', 'Parte1'], ['msg_velha', "'[{\"tipo\":\"x\"}]", '']);
velha.setName = n => { H.sheets[n] = velha; delete H.sheets.detalhes; velha.name = n; };
H.setFetch((u, o) => { if (/batchEmbedContents/.test(u)) { const b = JSON.parse(o.payload); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ embeddings: b.requests.map(() => ({ values: Array.from({ length: 256 }, (_, i) => i / 1000) })) }) }; } return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '=SOMA(1;2) resposta que começa com igual' } }] }) }; });
const r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto tá o iphone 13 no pix?' }] });
ok(r.ok, 'chat responde');
ok(H.sheets.detalhes_v49 && H.sheets.detalhes_v49.rows[1][0] === 'msg_velha', 'aba antiga renomeada pra detalhes_v49, nada apagado');
const d = H.sheets.detalhes;
ok(d.rows[0].join('|') === 'Data|Id|Nº|Tipo|Título|Solicitação|Resposta|ms', 'aba nova com colunas legíveis');
const linhas = d.rows.slice(1);
ok(linhas.length === r.detalhes.length && linhas.every(l => l.length === 8), 'uma linha por passo (' + linhas.length + ')');
ok(linhas.map(l => l[2]).join(',') === linhas.map((_, i) => i + 1).join(','), 'passos numerados em ordem');
const emb = linhas.find(l => /embedding/.test(l[4]));
ok(emb && /vetor\(es\) de 256 números/.test(emb[6]) && !/0\.001/.test(emb[6]), 'vetor do significado vira "1 vetor(es) de 256 números", sem os números');
ok(linhas.every(l => l.every(c => !/^[=+\-@]/.test(String(c)))), 'nada vira fórmula (resposta começando com = ganha apóstrofo)');
// reabrir a conversa traz os detalhes lidos da aba nova, numa leitura só
let leituras = 0; const gr = d.getRange.bind(d); d.getRange = (...a) => { leituras++; return gr(...a); };
vm.runInContext('DETALHES_POR_ID = null;', H.ctx);
const msgs = H.ctx.abrirChat(r.chatId);
const resp = msgs.find(m => m.role === 'assistant');
ok(resp && resp.detalhes.length === linhas.length && resp.detalhes[0].titulo === linhas[0][4], 'conversa reaberta traz os detalhes da aba nova');
ok(leituras <= 3, 'abrir conversa lê a aba de detalhes uma vez (' + leituras + ' leituras)');
// tarefa regravando: troca as linhas dela, não duplica
vm.runInContext('guardarDetalhes("tarefa_t", [{tipo:"ferramenta",titulo:"a",pedido:"1",resposta:"2",ms:1}]); guardarDetalhes("tarefa_t", [{tipo:"ferramenta",titulo:"a",pedido:"1",resposta:"2",ms:1},{tipo:"ferramenta",titulo:"b",pedido:"3",resposta:"4",ms:1}]);', H.ctx);
ok(d.rows.filter(l => l[1] === 'tarefa_t').length === 2 && vm.runInContext('lerDetalhes("tarefa_t").length', H.ctx) === 2, 'tarefa regravada fica com as linhas novas, sem duplicar');
ok(/versão 50/.test(vm.runInContext('VERSAO_CEREBRO', H.ctx)), 'cérebro na versão 50');
