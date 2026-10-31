// Fase 1 do treino: exemplos por tipo, placar dos cérebros, estudo noturno e revisão
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
const ctx = c => vm.runInContext(c, H.ctx);

// tipos
const tipos = [['faz um app de lista em html', 'código'], ['responde pro cliente que pediu desconto', 'cliente'], ['iphone 13 vs 14 qual melhor', 'comparativo'], ['quanto fica 2500 em 12x', 'preço'], ['qual a garantia do seminovo', 'loja'], ['me conta uma piada', 'geral']];
ok(tipos.every(([t, e]) => ctx('tipoTarefa(' + JSON.stringify(t) + ')') === e), 'tipo de tarefa: ' + tipos.map(([t]) => ctx('tipoTarefa(' + JSON.stringify(t) + ')')).join(', '));

// 👍 vira exemplo com tipo e origem
H.setFetch(() => resp('ok'));
let r = H.post({ pin: '1234', acao: 'feedback', nota: 'up', pergunta: 'quanto fica 2500 em 12x no cartão?', resposta: 'Fica 12x de R$ 245,00 (total R$ 2.940,00).', cerebro: 'Groq GPT-OSS 120B' });
const ex = H.sheets.exemplos.rows;
ok(r.salvou.includes('exemplo') && ex[0][5] === 'Tipo' && ex[ex.length - 1][5] === 'preço' && ex[ex.length - 1][6] === '👍 Thiago', '👍 vira exemplo com tipo e origem');
r = H.post({ pin: '1234', acao: 'feedback', nota: 'up', pergunta: 'quanto fica 2500 em 12x no cartão?', resposta: 'Fica 12x de R$ 245,00 (total R$ 2.940,00).' });
ok(!r.salvou.includes('exemplo'), 'mesma pergunta não duplica');

// estudo noturno: lê material, gera com modelo aberto, revisor confere, código quebrado é reprovado
const chamados = [];
H.setFetch((u, o) => {
  if (/r\.jina\.ai/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'Flexbox organiza itens em linha ou coluna. display:flex; justify-content; align-items. '.repeat(30) };
  if (typeof (o || {}).payload !== 'string') return json({});
  const b = JSON.parse(o.payload); chamados.push(b.model);
  const sys = b.messages[0].content;
  if (/material de estudo/.test(sys)) return resp(JSON.stringify({ exercicios: [
    { pergunta: 'como eu centralizo um botão na tela com flexbox?', resposta: 'Use no pai:\n```js\nconst pai = document.body; pai.style.display = "flex"; pai.style.justifyContent = "center";\n```' },
    { pergunta: 'faz um script que soma dois números', resposta: 'Assim:\n```js\nfunction soma(a, b) { return a + b \n```' },
    { pergunta: 'qual o preço do iphone 15 na loja?', resposta: 'Fica R$ 9.999 à vista.' }
  ] }));
  if (/corrige a prova/.test(sys)) { const u2 = b.messages[1].content; return resp(/preço do iphone 15/.test(u2) ? '{"nota":2.5,"faltou":"inventou preço"}' : '{"nota":9,"faltou":""}'); }
  return resp('ok');
});
const e1 = H.ctx.estudoNoturno(0);
const novos = H.sheets.exemplos.rows.filter(l => /revisar/.test(l[6] || ''));
ok(e1.salvos === 1 && novos.length === 1 && /centralizo um botão/.test(novos[0][1]) && novos[0][5] === 'código', 'estudo: salvou só o exercício aprovado (' + e1.detalhe.join(' | ') + ')');
ok(e1.detalhe.some(d => /sintaxe/.test(d)) && e1.detalhe.some(d => /revisor \(2\.5\)/.test(d)), 'código quebrado e preço inventado foram reprovados');
ok(chamados[0] === 'openai/gpt-oss-120b', 'exercícios gerados por modelo aberto (Groq), não pelo Gemini');
ok(H.sheets.treino.rows.some(l => l[1] === 'estudo' && l[2] === 1), 'estudo anotado na aba treino');

// resumo + revisão pelo Thiago
let t = H.post({ pin: '1234', acao: 'treinoResumo' });
ok(t.ok && t.treino.meta === 200 && t.treino.porTipo['preço'].aprovados === 1 && t.treino.porTipo['código'].revisar === 1 && t.revisar.length === 1, 'resumo por tipo e lista pra revisar');
ok(H.post({ pin: '1234', acao: 'revisarExemplo', pergunta: t.revisar[0].pergunta, aprovado: true }).ok, 'Thiago aprova o exercício');
t = H.post({ pin: '1234', acao: 'treinoResumo' });
ok(t.treino.porTipo['código'].aprovados === 1 && t.treino.porTipo['código'].revisar === 0, 'aprovado passa a contar pra meta');

// placar: um cérebro por dia faz 5 perguntas da prova e ganha nota por tipo
const prova = H.ctx.aba('prova');
[['1', 'loja', 'qual a garantia do seminovo?', 'a|b|c|d', 'inventar'], ['2', 'cálculo', 'quanto fica 3000 em 10x?', 'a|b|c|d', 'errar conta'], ['3', 'código', 'faz um app de lista em html', 'a|b|c|d', 'faltar arquivo']].forEach(l => prova.appendRow(l));
H.setFetch((u, o) => { if (typeof (o || {}).payload !== 'string') return json({}); const b = JSON.parse(o.payload); if (/corrige a prova/.test(b.messages[0].content)) return resp('{"nota":7.5,"faltou":"faltou detalhe"}'); return resp('resposta da prova'); });
const p1 = H.ctx.placarDiario('groq');
ok(p1 && p1.cerebro === 'Groq GPT-OSS 120B' && p1.perguntas === 3 && p1.media === 7.5, 'placar do dia: ' + JSON.stringify(p1));
const pl = H.post({ pin: '1234', acao: 'treinoResumo' }).placar;
ok(pl.length === 1 && pl[0].cerebro === 'Groq GPT-OSS 120B' && pl[0].tipos.length === 3, 'placar por cérebro e por tipo: ' + JSON.stringify(pl[0].tipos.map(x => x.tipo)));

// rotinas novas ligam sozinhas
const criados = [];
const nt = H.ctx.ScriptApp.newTrigger;
H.ctx.ScriptApp.newTrigger = fn => ({ timeBased: () => ({ everyHours: h => ({ create: () => { criados.push(fn + '@h' + h); } }), everyDays: () => ({ atHour: h => ({ create: () => { criados.push(fn + '@' + h); } }) }), onWeekDay: d => ({ atHour: h => ({ create: () => { criados.push(fn + '@' + d + h); } }) }) }) });
H.ctx.garantirRotinasTreino();
ok(criados.join() === 'estudoNoturno@1,estudar@h4,placarDiario@2,arquivarMensagens@SUNDAY5', 'estudo (1h), estudo 24h de reserva (4 em 4h), placar (2h) e arquivo (domingo 5h) ligados sozinhos: ' + criados.join());
H.ctx.garantirRotinasTreino();
ok(criados.length === 4, 'não cria de novo (fica anotado no cache)');
H.ctx.ScriptApp.newTrigger = nt;

// resumo ao vivo: passos vão pro cache enquanto a resposta é montada
{
  H.setFetch(() => resp('ok'));
  const r = H.post({ pin: '1234', acao: 'chat', reqId: 'abc123', mensagens: [{ role: 'user', content: 'oi' }] });
  const v = H.post({ pin: '1234', acao: 'aoVivo', reqId: 'abc123' });
  ok(v.ok && v.passos.length > 0 && v.passos[v.passos.length - 1] === r.passos[r.passos.length - 1], 'aoVivo devolve os passos da resposta: ' + v.passos.length);
  ok(H.post({ pin: '1234', acao: 'aoVivo', reqId: 'outro' }).passos.length === 0, 'pedido que não existe volta vazio');
}

// trajetórias: o agente recebe como o Claude resolveu tarefa parecida
{
  H.ctx.aba('trajetorias').appendRow(["'30/10/2026", 'Instalar a ponte do PC e conectar na ZicoAI', '🔧 pc_status → ...', 'Antivírus pode bloquear: liberar só a pasta. Funnel deu 502: o PC busca os pedidos.', 'Claude']);
  let sysA = '';
  H.setFetch((u, o) => { if (typeof (o || {}).payload !== 'string') return json({}); const b = JSON.parse(o.payload); sysA = b.messages[0].content; return resp('{"resposta":"feito"}'); });
  const id = H.ctx.criarTarefa('a ponte do PC parou, conecta ela de novo', '', 'pc').id;
  H.ctx.rodarTarefas();
  ok(/### COMO TAREFAS PARECIDAS FORAM RESOLVIDAS/.test(sysA) && /Funnel deu 502/.test(sysA), 'agente recebeu a trajetória parecida do Claude');
  ok(H.sheets.tarefas.rows.find(x => x[0] === id)[5].includes('📚 Lembrou de 1 tarefa'), 'passo mostra que lembrou');
}
