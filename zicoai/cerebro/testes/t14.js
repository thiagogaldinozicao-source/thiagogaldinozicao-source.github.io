// Agentes em segundo plano com laço de ferramentas
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
H.ctx.aba('precos').appendRow(['iPhone 15', 'novo', '128GB', '', '3.999', '', 1, '']);
let passo = 0; const vistos = [];
H.setFetch((u, o) => {
  if (/r\.jina\.ai/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'Loja Z: iPhone 15 128GB por R$ 4.299.' };
  if (/api\.telegram/.test(u)) return json({ ok: true, result: {} });
  if (typeof o.payload !== 'string') return json({});
  const b = JSON.parse(o.payload);
  if (!b.messages) return json({});
  const sys = b.messages[0].content;
  if (!/AGENTE em segundo plano/.test(sys)) return resp('Vou fazer isso em segundo plano. [[TAREFA: Comparar o preço do iPhone 15 na Loja Z (https://lojaz.com/ip15) com o nosso e anotar na base]]');
  // agente: sequência de ferramentas
  const ultimo = b.messages[b.messages.length - 1].content;
  vistos.push(ultimo.slice(0, 60));
  passo++;
  if (passo === 1) return resp('{"ferramenta":"ler_planilha","args":{"aba":"precos"},"porque":"ver nosso preço"}');
  if (passo === 2) { ok(/RESULTADO de ler_planilha:\n1: Produto/.test(ultimo) && /iPhone 15 \| novo \| 128GB/.test(ultimo), 'agente viu a planilha de preços'); return resp('{"ferramenta":"ler_pagina","args":{"url":"https://lojaz.com/ip15"}}'); }
  if (passo === 3) { ok(/Loja Z: iPhone 15 128GB por R\$ 4\.299/.test(ultimo), 'agente leu a página'); return resp('{"ferramenta":"calcular","args":{"conta":"4299 - 3999"}}'); }
  if (passo === 4) { ok(/= 300,00/.test(ultimo), 'agente calculou: ' + ultimo.slice(0, 50)); return resp('{"ferramenta":"acrescentar_planilha","args":{"aba":"base","valores":["Concorrente Loja Z iPhone 15","Loja Z vende o iPhone 15 128GB por R$ 4.299 (30/10/2026)"]}}'); }
  if (passo === 5) { ok(/RESULTADO de acrescentar_planilha:\nbase nova/.test(ultimo), 'agente gravou na base'); return resp('{"ferramenta":"apagar_tudo","args":{}}'); }
  if (passo === 6) { ok(/ERRO: ferramenta "apagar_tudo" não existe/.test(ultimo), 'ferramenta inexistente é recusada'); return resp('{"ferramenta":"escrever_planilha","args":{"aba":"mensagens","celula":"A1","valor":"x"}}'); }
  if (passo === 7) { ok(/ERRO: só posso escrever em/.test(ultimo), 'escrita em aba proibida é recusada'); return resp('{"ferramenta":"acrescentar_planilha","args":{"aba":"memoria","valores":["30/10","Cliente João CPF 123.456.789-00","agente"]}}'); }
  if (passo === 8) { ok(/ERRO: tem CPF/.test(ultimo), 'dado de cliente é barrado'); return resp('texto sem json'); }
  if (passo === 9) { ok(/Responda só com o JSON/.test(ultimo), 'sem JSON ela é cobrada'); return resp('{"resposta":"Nosso iPhone 15 128GB tá R$ 3.999; na Loja Z tá R$ 4.299. Estamos R$ 300 mais baratos. Anotei na base. [[MEMORIA: Loja Z é R$ 300 mais cara no iPhone 15]]"}'); }
  return resp('{"resposta":"fim"}');
});
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'compara o preço do iphone 15 da loja z com o nosso' }] });
ok(r.salvou.includes('tarefa') && /Agente trabalhando/.test(r.resposta), 'tag TAREFA vira tarefa');
const t = H.sheets.tarefas.rows[1];
ok(t[4] === 'pendente' && H.TRIGGERS.includes('rodarTarefas'), 'tarefa na fila com gatilho');
H.ctx.rodarTarefas();
const feita = H.sheets.tarefas.rows.find(x => x[0] === t[0]);
ok(feita[4] === 'concluída' && /🔧 ler_planilha \{"aba":"precos"\} · ver nosso preço → 1: Produto/.test(feita[5]) && /🔧 ler_pagina/.test(feita[5]) && /🔧 calcular/.test(feita[5]) && /Concluída com Gemini \(6 ferramentas\)/.test(feita[5]), 'rastro das ferramentas gravado: ' + feita[5].slice(0, 120));
ok(/R\$ 300 mais baratos/.test(feita[6]) && !/\[\[MEMORIA/.test(feita[6]), 'resposta final gravada com tags processadas');
ok(H.sheets.base.rows.some(x => x[0] === 'Concorrente Loja Z iPhone 15') && H.sheets.historico.rows.some(x => /agente:tf/.test(x[5])), 'escrita do agente na base com histórico');
ok(H.sheets.memoria.rows.some(x => /Loja Z é R\$ 300 mais cara/.test(x[1])), 'tag MEMORIA do agente virou memória');
const msgAgente = H.sheets.mensagens.rows.find(x => x[0] === t[2] && /Resultado da tarefa/.test(x[3]));
ok(msgAgente && /agente · Gemini/.test(msgAgente[4]) && /6 ferramentas/.test(msgAgente[6]), 'resultado postado na conversa com o rastro');
ok(!H.TRIGGERS.includes('rodarTarefas'), 'gatilho limpo após a rodada');
// listar / cancelar / modo agente / erro
let l = H.post({ pin: '1234', acao: 'tarefas' });
ok(l.ok && l.tarefas[0].status === 'concluída' && l.tarefas[0].passos.length >= 6, 'lista traz os passos');
r = H.post({ pin: '1234', acao: 'chat', modo: 'agente', mensagens: [{ role: 'user', content: 'levanta o preço do iphone 15 em 5 lojas' }] });
ok(r.ok && r.cerebro === 'agente' && r.tarefaId, 'modo agente cria tarefa direto');
const c = H.post({ pin: '1234', acao: 'cancelarTarefa', id: r.tarefaId });
ok(c.cancelada, 'cancelar antes de rodar');
H.ctx.rodarTarefas();
ok(H.sheets.tarefas.rows.find(x => x[0] === r.tarefaId)[4] === 'cancelada', 'cancelada não roda');
r = H.post({ pin: '1234', acao: 'tarefa', pedido: 'faz um relatório das vendas do mês' });
H.setFetch(() => ({ getResponseCode: () => 500, getContentText: () => 'x' }));
H.ctx.rodarTarefas();
ok(H.sheets.tarefas.rows.find(x => x[0] === r.id)[4] === 'erro', 'sem cérebro → erro, fila não trava');
// JSON inválido 2x → texto vira resposta final
H.setFetch((u, o) => { if (typeof o.payload !== 'string') return json({}); const b = JSON.parse(o.payload); if (!b.messages) return json({}); return resp('Resposta direta em texto, sem json.'); });
r = H.post({ pin: '1234', acao: 'tarefa', pedido: 'me explica tabela price em 3 linhas' });
H.ctx.rodarTarefas();
const f2 = H.sheets.tarefas.rows.find(x => x[0] === r.id);
ok(f2[4] === 'concluída' && /Resposta direta em texto/.test(f2[6]), 'modelo que não usa JSON ainda entrega resposta');
// resposta dobrada: respondeu tudo E criou tarefa → fica só 1 linha + aviso do agente
H.setFetch((u, o) => { const b = JSON.parse(o.payload); const sys2 = b.messages[0].content; if (/AGENTE em segundo plano/.test(sys2)) return resp('ok'); return resp('Vou pesquisar isso pra vc. Analisei o código e aqui vão 5 melhorias detalhadas: 1) feedback visual com escala 2) estética dourada 3) responsividade 4) prevenção de erro 5) placar. Quer que eu aplique agora? Só pedir. [[TAREFA: Listar apps publicados e analisar o jogo da velha]]'); });
let rd = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'lê o jogo da velha e me fala o que melhorar' }] });
ok(rd.ok && rd.salvou.includes('tarefa') && /Agente trabalhando/.test(rd.resposta) && !/5 melhorias detalhadas/.test(rd.resposta) && rd.resposta.length < 320, 'resposta dobrada vira 1 linha + agente: ' + JSON.stringify(rd.resposta).slice(0, 120));
ok(rd.passos.some(p => /Resposta encurtada/.test(p)), 'passo registra o corte');
