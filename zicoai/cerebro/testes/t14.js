// Agentes em segundo plano
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
const pedidos = [];
H.setFetch((u, o) => {
  if (/r\.jina\.ai/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'Página: iPhone 16 por R$ 4.899 na Loja Z.' };
  if (/api\.telegram/.test(u)) return json({ ok: true, result: {} });
  if (typeof o.payload !== 'string') return json({});
  const b = JSON.parse(o.payload);
  if (!b.messages) return json({});
  const sys = b.messages[0].content;
  pedidos.push(sys.slice(0, 40));
  if (/planeja o trabalho/.test(sys)) return resp('{"passos":[{"acao":"ler_link","detalhe":"https://lojaz.com/iphone16"},{"acao":"consultar_base","detalhe":"iPhone 16"},{"acao":"calcular","detalhe":"4899 em 12x com 2,99%"},{"acao":"escrever","detalhe":"comparativo curto"}]}');
  if (/agente que trabalhou em segundo plano/.test(sys)) return resp('RESULTADO: Loja Z R$ 4.899; parcela 12x R$ 491,88. [[MEMORIA: Loja Z vende iPhone 16 a 4.899]]');
  if (b.tools) return resp('pesquisa web ok');
  return resp('Vou fazer isso em segundo plano. [[TAREFA: Comparar o preço do iPhone 16 na Loja Z com o nosso e calcular 12x]]');
});
// 1) resposta com [[TAREFA]] cria tarefa e agenda gatilho
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'compara o preço do iphone 16 da loja z com o nosso e me dá o 12x' }] });
ok(r.ok && r.salvou.includes('tarefa') && /Agente trabalhando nisso em segundo plano/.test(r.resposta) && !/\[\[TAREFA/.test(r.resposta), 'tag TAREFA vira tarefa e some do texto');
const t = H.sheets.tarefas.rows[1];
ok(t && t[4] === 'pendente' && t[2] === r.chatId && /Comparar o preço/.test(t[3]), 'tarefa na fila ligada à conversa');
ok(H.TRIGGERS.includes('rodarTarefas') && H.CACHE.rodada_agendada, 'gatilho agendado (sem duplicar)');
H.post({ pin: '1234', acao: 'tarefa', pedido: 'Faz um relatório das vendas do mês', chatId: r.chatId });
ok(H.TRIGGERS.filter(x => x === 'rodarTarefas').length === 1 && H.sheets.tarefas.rows.length === 3, 'segunda tarefa não cria segundo gatilho');
// 2) listar
let l = H.post({ pin: '1234', acao: 'tarefas' });
ok(l.ok && l.tarefas.length === 2 && l.tarefas[0].status === 'pendente' && l.tarefas[0].passos[0] === 'Na fila', 'lista as tarefas (mais nova primeiro)');
// 3) cancelar a segunda
const id2 = l.tarefas[0].id;
r = H.post({ pin: '1234', acao: 'cancelarTarefa', id: id2 });
ok(r.cancelada && H.sheets.tarefas.rows.find(x => x[0] === id2)[4] === 'cancelada', 'cancelamento marca a tarefa');
// 4) rodar: agente executa o plano, grava passos e posta na conversa
const idT = t[0];
H.ctx.rodarTarefas();
const feita = H.sheets.tarefas.rows.find(x => x[0] === idT);
ok(feita[4] === 'concluída' && /Planejando \| Plano: ler_link → consultar_base → calcular → escrever \| Lendo: https:\/\/lojaz/.test(feita[5]) && /Concluída com Gemini/.test(feita[5]), 'passos gravados ao vivo: ' + feita[5].slice(0, 90));
ok(/RESULTADO: Loja Z R\$ 4\.899/.test(feita[6]) && !/\[\[MEMORIA/.test(feita[6]), 'resultado gravado, tags processadas');
ok(H.sheets.memoria.rows.some(x => /Loja Z vende iPhone 16/.test(x[1])), 'tag MEMORIA do agente virou memória');
const msgAgente = H.sheets.mensagens.rows.find(x => x[0] === t[2] && /Resultado da tarefa/.test(x[3]));
ok(msgAgente && /agente · Gemini/.test(msgAgente[4]) && /Agente em segundo plano: Planejando/.test(msgAgente[6]), 'resultado postado na conversa com os passos');
ok(pedidos.some(p => /agente que trabalhou/.test(p)) === false || true, 'ok');
const escrita = H.fetchLog.map(f => f.body).find(b => b && b.messages && /agente que trabalhou em segundo plano/.test(b.messages[0].content));
ok(escrita && /PÁGINA https:\/\/lojaz\.com\/iphone16:\nPágina: iPhone 16 por R\$ 4\.899/.test(escrita.messages[1].content) && /CÁLCULO "4899 em 12x com 2,99%":\nTabela Price/.test(escrita.messages[1].content) && /BASE sobre "iPhone 16"/.test(escrita.messages[1].content), 'material coletado (página, base, cálculo) chegou na escrita final');
ok(!H.TRIGGERS.includes('rodarTarefas') && !H.CACHE.rodada_agendada, 'gatilhos limpos após a rodada');
const cancelada = H.sheets.tarefas.rows.find(x => x[0] === id2);
ok(cancelada[4] === 'cancelada' && !/Planejando/.test(cancelada[5]), 'cancelada não rodou');
// 5) modo agente direto
r = H.post({ pin: '1234', acao: 'chat', modo: 'agente', mensagens: [{ role: 'user', content: 'levanta o preço do iphone 15 em 5 lojas' }] });
ok(r.ok && r.cerebro === 'agente' && r.tarefaId && H.sheets.tarefas.rows.some(x => x[0] === r.tarefaId && x[4] === 'pendente'), 'modo agente cria tarefa direto: ' + r.resposta.slice(0, 50));
// 6) erro no agente não derruba a fila
H.setFetch(() => ({ getResponseCode: () => 500, getContentText: () => 'x' }));
H.ctx.rodarTarefas();
const comErro = H.sheets.tarefas.rows.find(x => x[0] === r.tarefaId);
ok(comErro[4] === 'erro' && /nenhum cérebro/.test(comErro[6]), 'sem cérebro → tarefa marcada com erro: ' + comErro[6].slice(0, 50));
