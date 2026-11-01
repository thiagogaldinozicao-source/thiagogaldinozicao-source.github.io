// v78: o Mac é o trabalhador das tarefas (ponteTarefa), sem gastar gatilho do Google
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PONTE_SEGREDO_MAC = 'sm';
const gatilhos = () => run('ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "rodarTarefas").length');
run('var _rodou = []; agente = function(id, pedido, chat, ap, prazo){ _rodou.push({ id: id, prazoMs: prazo - Date.now() }); atualizarTarefa(id, { status: _rodou.length === 1 ? "pendente" : "concluída", resultado: "ok" }); };');
// sem Mac: tarefa nova liga gatilho (como antes)
run('criarTarefa("pesquisa o preço do iphone 15 em 3 lojas", "c1", "IPHONE")');
ok(gatilhos() === 1, 'sem o Mac trabalhando: tarefa nova liga gatilho do Google');
run('ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t))');
// Mac chama: roda a tarefa e marca que ele tá trabalhando
let r = H.post({ acao: 'ponteTarefa', segredo: 'sm' });
ok(r.ok && r.rodou && r.status === 'pendente' && run('_rodou.length') === 1, 'Mac pegou a tarefa e rodou uma rodada');
ok(run('_rodou[0].prazoMs') > 280000 && run('_rodou[0].prazoMs') <= 300000, 'rodada do Mac tem até 5 min');
r = H.post({ acao: 'ponteTarefa', segredo: 'sm' });
ok(r.rodou && r.status === 'concluída', 'pausou → o Mac emenda a próxima rodada na hora');
r = H.post({ acao: 'ponteTarefa', segredo: 'sm' });
ok(r.ok && r.nada, 'fila vazia: responde rápido "nada"');
run('_rodou = []'); run('pegarProxima = (function(f){ return function(){ globalThis._buscou = (globalThis._buscou||0)+1; return f(); }; })(pegarProxima)');
H.post({ acao: 'ponteTarefa', segredo: 'sm' });
ok(!run('globalThis._buscou'), 'fila vazia lembrada no cache: nem lê a planilha');
// Mac trabalhando: tarefa nova NÃO liga gatilho e o Mac pega
run('criarTarefa("compara o 15 com o 16 e me fala qual vale mais", "c1", "IPHONE")');
ok(gatilhos() === 0, 'Mac trabalhando: tarefa nova não gasta gatilho do Google');
r = H.post({ acao: 'ponteTarefa', segredo: 'sm' });
ok(r.rodou, 'tarefa nova: o Mac pega na batida seguinte (fila vazia esquecida)');
// Mac sumiu há mais de 2 min: o app olhando as tarefas reativa o Google
run('CacheService.getScriptCache().put("mac_agentes", String(Date.now() - 180000), 300)');
run('criarTarefa("resume as vendas da semana", "c1", "IPHONE")');
ok(gatilhos() === 1, 'Mac parado há 3 min: tarefa nova volta pro gatilho');
run('ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t))');
H.post({ pin: '1234', acao: 'tarefas' });
ok(gatilhos() === 1, 'app abriu a lista com tarefa parada e Mac fora: o Google assume');
// segurança e desligar
ok(H.post({ acao: 'ponteTarefa', segredo: 'errado' }).erro === 'segredo errado', 'sem o segredo do Mac não roda nada');
H.PROPS.MAC_AGENTES = 'nao';
ok(H.post({ acao: 'ponteTarefa', segredo: 'sm' }).nada === true && run('macTrabalhando()') === false, 'MAC_AGENTES=nao desliga');
ok(/versão (7[8-9]|[89]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 78 ou mais nova');
