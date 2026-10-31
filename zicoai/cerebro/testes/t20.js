// Imagem com pedido detalhado, NVIDIA com modelo reserva, agentes em paralelo, tarefa longa que continua, agente chefe e PC reserva
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
// Drive de mentira pro progresso das tarefas
const FILES = {};
const pasta = { getFilesByName: n => { let usado = false; return { hasNext: () => (n in FILES) && !usado, next: () => { usado = true; return { setContent: t => { FILES[n] = t; }, getBlob: () => ({ getDataAsString: () => FILES[n] }), setTrashed: () => { delete FILES[n]; } }; } }; }, createFile: (n, t) => { FILES[n] = t; return {}; } };
H.ctx.DriveApp.getFoldersByName = () => { let u = false; return { hasNext: () => !u, next: () => { u = true; return pasta; } }; };

// 1) imagem: pedido curto vira detalhado; pedido longo passa igual
const LONGO = 'Professional product photography of a gold iPhone 17 Pro lying on a dark walnut table, back facing up, triple camera in a triangle, soft studio light from the left, shallow depth of field, black background, photorealistic';
let chamadas = 0;
H.setFetch((u, o) => {
  if (typeof (o || {}).payload !== 'string') return json({});
  const b = JSON.parse(o.payload); if (!b.messages) return json({});
  if (/You write prompts for an image/.test(b.messages[0].content)) { chamadas++; return resp('"' + LONGO + '"'); }
  return resp('Saindo! [[IMAGEM: gold iphone on a table]]');
});
let r = H.post({ pin: '1234', acao: 'chat', modo: 'imagem', mensagens: [{ role: 'user', content: 'iphone dourado na mesa' }] });
ok(chamadas === 1 && r.resposta.includes(encodeURIComponent('walnut table')) && !r.resposta.includes('%22'), 'pedido curto virou pedido detalhado em inglês (sem aspas)');
ok(r.passos.some(p => /^Detalhou o pedido da imagem \(Gemini\): Professional product/.test(p)), '"Como respondi" mostra o pedido detalhado');
const longo2 = LONGO + ' ' + LONGO;
ok(H.ctx.detalharPromptImagem(longo2) === longo2 && chamadas === 1, 'pedido já detalhado passa igual, sem gastar chamada');
H.setFetch(() => ({ getResponseCode: () => 500, getContentText: () => 'x' }));
ok(H.ctx.detalharPromptImagem('gato pixel art') === 'gato pixel art', 'sem cérebro: segue com o pedido original');

// 2) NVIDIA: modelo fora do ar (410) usa o reserva
H.PROPS.NVIDIA_KEY = 'nv'; const modelos = [];
H.setFetch((u, o) => { const b = JSON.parse(o.payload); modelos.push(b.model); if (/nemotron/.test(b.model)) return { getResponseCode: () => 410, getContentText: () => '{"title":"Gone","status":410,"detail":"The model has reached its end of life"}' }; return resp('oi do reserva'); });
ok(H.ctx.chamarCompat(require('vm').runInContext('CEREBROS', H.ctx).nvidia, [{ role: 'user', content: 'oi' }], 50) === 'oi do reserva' && modelos.join() === 'nvidia/nemotron-3.5-super-vl-120b-a12b,google/gemma-4-31b-it', 'NVIDIA 410 → modelo reserva: ' + modelos.join(' → '));
delete H.PROPS.NVIDIA_KEY;

// 3) fila em paralelo: no máximo 3 trabalhadores
H.TRIGGERS.length = 0;
const ids = ['pesquisa A completa', 'pesquisa B completa', 'pesquisa C completa', 'pesquisa D completa', 'pesquisa E completa'].map(p => H.ctx.criarTarefa(p, '', 'pc').id);
ok(H.TRIGGERS.filter(t => t === 'rodarTarefas').length === 3, 'cinco tarefas → 3 trabalhadores ao mesmo tempo (não 5, não 1)');
// cada trabalhador pega uma tarefa diferente
let fila = [];
H.setFetch((u, o) => { const b = JSON.parse(o.payload); const ped = b.messages[1].content; return resp('{"resposta":"feito: ' + ped.replace('PEDIDO DO THIAGO: ', '') + '"}'); });
H.ctx.rodarTarefas();
const st = id => H.sheets.tarefas.rows.find(x => x[0] === id);
ok(ids.every(id => st(id)[4] === 'concluída'), 'um trabalhador sozinho ainda limpa a fila inteira se der tempo');
ok(!H.TRIGGERS.includes('rodarTarefas') || H.TRIGGERS.filter(t => t === 'rodarTarefas').length <= 2, 'trabalhador apaga só o próprio gatilho');
H.TRIGGERS.length = 0;

// 4) tarefa longa: passa do tempo, salva e continua na próxima rodada
let passoLongo = 0;
H.setFetch((u, o) => {
  const b = JSON.parse(o.payload); if (!b.messages) return json({});
  passoLongo++; H.ctx.Utilities.sleep(120000);   // cada passo "demora" 2 min
  if (passoLongo < 4) return resp('{"ferramenta":"calcular","args":{"conta":"' + passoLongo + '*1000"},"porque":"conta ' + passoLongo + '"}');
  const viu = b.messages.filter(m => /RESULTADO de calcular/.test(m.content)).length;
  return resp('{"resposta":"Fiz ' + viu + ' contas sem perder nada."}');
});
const longa = H.ctx.criarTarefa('levantamento grande que demora muito', 'cLonga', 'pc').id;
H.ctx.rodarTarefas();
ok(st(longa)[4] === 'pendente' && /Pausou \(limite de tempo do Google\)/.test(st(longa)[5]) && FILES[longa + '.json'], 'passou do tempo: salvou o progresso e voltou pra fila');
ok(H.TRIGGERS.includes('rodarTarefas'), 'agendou a continuação sozinha');
H.ctx.rodarTarefas(); H.ctx.rodarTarefas(); H.ctx.rodarTarefas();
ok(st(longa)[4] === 'concluída' && /Fiz 3 contas sem perder nada/.test(st(longa)[6]) && /Continuou de onde parou/.test(st(longa)[5]) && /rodadas\)/.test(st(longa)[5]), 'continuou de onde parou e terminou: ' + st(longa)[5].slice(-80));
ok(!FILES[longa + '.json'], 'progresso apagado no fim');
H.TRIGGERS.length = 0;

// 5) agente chefe divide em partes, as partes rodam e ele junta
H.setFetch((u, o) => {
  const b = JSON.parse(o.payload); if (!b.messages) return json({});
  const sys = b.messages[0].content, ped = b.messages[1].content, ult = b.messages[b.messages.length - 1].content;
  if (/Você é UMA PARTE/.test(sys)) return resp('{"resposta":"' + (/Loja X/.test(ped) ? 'Loja X: R$ 4.100' : 'Loja Y: R$ 4.350') + '"}');
  if (/RESULTADO de dividir_em_agentes/.test(ult)) return resp('{"resposta":"Comparei: ' + (/Loja X: R\$ 4\.100/.test(ult) && /Loja Y: R\$ 4\.350/.test(ult) ? 'X é a mais barata (R$ 4.100), Y R$ 4.350' : 'faltou parte') + '"}');
  return resp('{"ferramenta":"dividir_em_agentes","args":{"partes":["Pesquisar o preço do iPhone 16 na Loja X","Pesquisar o preço do iPhone 16 na Loja Y"]},"porque":"duas lojas ao mesmo tempo"}');
});
const chefe = H.post({ pin: '1234', acao: 'chat', modo: 'agente', mensagens: [{ role: 'user', content: 'compara o iphone 16 na loja X e na loja Y' }] });
H.ctx.rodarTarefas();
const filhas = H.sheets.tarefas.rows.filter(x => x[9] === chefe.tarefaId);
ok(filhas.length === 2 && filhas.every(x => /^\[parte de tf/.test(x[3])) && H.sheets.tarefas.rows[0][9] === 'Pai', 'chefe criou 2 partes ligadas a ele');
for (let i = 0; i < 4 && st(chefe.tarefaId)[4] !== 'concluída'; i++) H.ctx.rodarTarefas();
ok(st(chefe.tarefaId)[4] === 'concluída' && /X é a mais barata/.test(st(chefe.tarefaId)[6]), 'chefe juntou o resultado das partes: ' + st(chefe.tarefaId)[6]);
ok(filhas.every(x => st(x[0])[4] === 'concluída'), 'partes concluídas');
const postadas = H.sheets.mensagens.rows.filter(x => /Resultado da tarefa/.test(x[3]));
ok(postadas.filter(x => x[0] === chefe.chatId).length === 1 && !postadas.some(x => /Loja X: R\$ 4\.100"?$/.test(x[3])), 'só o chefe posta na conversa');
// parte não pode dividir de novo
ok(H.ctx.listarTarefas().some(t => t.pai === chefe.tarefaId), 'lista do app mostra de quem é a parte');

// 6) cancelar o chefe cancela as partes
H.setFetch((u, o) => resp('{"ferramenta":"dividir_em_agentes","args":{"partes":["parte um bem descrita","parte dois bem descrita"]}}'));
const c2 = H.post({ pin: '1234', acao: 'tarefa', pedido: 'tarefa que vai ser cancelada no meio' });
const l2 = H.sheets.tarefas.rows.find(x => x[0] === c2.id);
H.ctx.atualizarTarefa(c2.id, { status: 'rodando' });
H.ctx.agente(c2.id, l2[3], '', 'pc', require('vm').runInContext('Date.now()', H.ctx) + 270000, '');
ok(st(c2.id)[4] === 'esperando', 'chefe dormindo esperando as partes: ' + st(c2.id)[4] + ' ' + st(c2.id)[5].slice(-150));
H.post({ pin: '1234', acao: 'cancelarTarefa', id: c2.id });
ok(H.sheets.tarefas.rows.filter(x => x[9] === c2.id).every(x => x[4] === 'cancelada') && st(c2.id)[4] === 'cancelada', 'cancelou o chefe e as partes');

// 7) nuvem toda sem cota do dia → PC de casa como reserva do agente
H.PROPS.PC_URL = 'https://pc.ts.net/x'; H.PROPS.PC_MODELO_CODIGO = 'zicoai-dev';
['gemini', 'groq', 'groq2'].forEach(n => { H.PROPS['rpd_' + n + '_20261030'] = '99999'; });
const urls = [];
H.setFetch((u, o) => { urls.push(u); return resp('{"resposta":"respondi pelo PC"}'); });
const t7 = H.ctx.criarTarefa('tarefa com a nuvem esgotada', '', 'pc').id;
H.ctx.rodarTarefas();
ok(st(t7)[4] === 'concluída' && /respondi pelo PC/.test(st(t7)[6]) && /Concluída com PC \(zicoai-dev\)/.test(st(t7)[5]) && urls.some(x => /pc\.ts\.net\/x\/v1\/chat/.test(x)), 'nuvem sem cota: agente usou o PC (zicoai-dev)');
