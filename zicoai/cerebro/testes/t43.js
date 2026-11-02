// v57: agente em etapas (plano → uma etapa por vez → conferência com prova → checklist e resultado honesto)
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
const run = s => vm.runInContext(s, H.ctx);
// cérebro forte ligado (no Apps Script vem de GEMINI_FORTE)
H.PROPS.GEMINI_FORTE = 'gemini-forte-teste';
// Drive de mentira pro progresso das tarefas (estado entre rodadas)
const FILES = {};
const pasta = { getFilesByName: n => { let usado = false; return { hasNext: () => (n in FILES) && !usado, next: () => { usado = true; return { setContent: t => { FILES[n] = t; }, getBlob: () => ({ getDataAsString: () => FILES[n] }), setTrashed: () => { delete FILES[n]; } }; } }; }, createFile: (n, t) => { FILES[n] = t; return {}; } };
H.ctx.DriveApp.getFoldersByName = () => { let u = false; return { hasNext: () => !u, next: () => { u = true; return pasta; } }; };
H.ctx.aba('precos').appendRow(['iPhone 15', 'novo', '128GB', '', '3.999', '', 1, '']);
const st = id => H.sheets.tarefas.rows.find(x => x[0] === id);

ok((+(run('VERSAO_CEREBRO')).match(/versão (1\d\d|\d+)/)[1] >= 57), 'cérebro na versão 57 ou mais nova');

// 1) rota automática: só pedido CLARAMENTE grande
const g = t => run('ehPedidoGrande')(t);
ok(g('faz tudo isso pra mim: atualiza os preços e posta no grupo'), 'rota: "faz tudo isso"');
ok(g('coloca agentes pra pesquisar o iPhone 17 em 4 lojas'), 'rota: "coloca agentes"');
ok(g('faz em etapas: lê a planilha, calcula a margem e anota na base'), 'rota: "em etapas"');
ok(g('tenho várias coisas pra vc fazer hoje, bora'), 'rota: "várias coisas"');
ok(g('preciso disso:\n1. atualiza a lista de preços\n2. cria um app de estoque\n3. pesquisa o dólar de hoje'), 'rota: lista de 3 pedidos');
ok(!g('o iPhone 15 faz tudo que o 16 faz?'), 'não rota: pergunta comum com "faz tudo"');
ok(!g('quais cores tem?\n- azul\n- preto\n- branco'), 'não rota: lista de cores');
ok(!g('- iPhone 15 128GB novo\n- iPhone 16 256GB seminovo\n- iPhone 17 Pro 512GB'), 'não rota: lista de produtos (sem pedido)');
ok(!g('oi, tudo bem?'), 'não rota: conversa curta');
ok(!g('```\n1. atualiza\n2. cria\n3. testa\n```'), 'não rota: bloco de código colado');

// 2) tarefa grande do começo ao fim, com fetch falso
let chamadas = [];   // {modelo, ultimo}
let n = 0;
H.setFetch((u, o) => {
  if (/r\.jina\.ai/.test(u)) return { getResponseCode: () => 500, getContentText: () => 'fora do ar' };
  if (/api\.telegram|ntfy/.test(u)) return json({ ok: true, result: {} });
  if (typeof o.payload !== 'string') return json({});
  const b = JSON.parse(o.payload);
  if (!b.messages) return json({});
  const sys = b.messages[0].content;
  if (!/AGENTE em segundo plano/.test(sys)) return resp('Resposta normal do chat.');
  const ultimo = b.messages[b.messages.length - 1].content;
  chamadas.push({ modelo: b.model, ultimo });
  n++;
  if (n === 1) return resp(JSON.stringify({ pensamento: 'Planejando', plano: [
    { fazer: 'Ler nosso preço do iPhone 15', prova: 'ler_planilha mostra a linha do iPhone 15' },
    { fazer: 'Ver o preço da Loja Z', prova: 'página da loja lida com o preço' },
    { fazer: 'Anotar a diferença na base', prova: 'base lida de volta com a linha nova' }],
    ferramenta: 'ler_planilha', args: { aba: 'precos' } }));
  if (n === 2) return resp(JSON.stringify({ etapa: { n: 1, status: 'feita', prova: '' }, ferramenta: 'calcular', args: { conta: '1+1' } }));
  if (n === 3) return resp(JSON.stringify({ etapa: { n: 1, status: 'feita', prova: 'ler_planilha mostrou iPhone 15 por R$ 3.999' }, ferramenta: 'ler_pagina', args: { url: 'https://lojaz.com/ip15' } }));
  if (n === 4) return resp(JSON.stringify({ etapa: { n: 2, status: 'feita', prova: 'abri a página da Loja Z' } }));
  if (n === 5) { H.ctx.Utilities.sleep(250000); return resp(JSON.stringify({ etapa: { n: 2, status: 'falhou', motivo: 'site da Loja Z fora do ar' }, ferramenta: 'calcular', args: { conta: '4299 - 3999' } })); }
  if (n === 6) return resp(JSON.stringify({ etapa: { n: 2, status: 'feita', prova: 'calcular deu 300,00 de diferença' }, resposta: 'Pronto, tudo feito e anotado!' }));
  if (n === 7) return resp(JSON.stringify({ resposta: 'Pronto, tudo feito!' }));
  if (n === 8) return resp(JSON.stringify({ etapa: { n: 2, status: 'sem_prova', motivo: 'a conta usou preço chutado, a página não abriu' }, resposta: 'Li nosso preço (R$ 3.999). Não consegui abrir a Loja Z, então a diferença não está confirmada. Não anotei na base.' }));
  return resp('{"resposta":"fim"}');
});
const r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz em etapas: compara o iPhone 15 da Loja Z com o nosso e anota na base' }] });
ok(r.ok && r.cerebro === 'agente' && r.tarefaId && /em etapas e conferindo/.test(r.resposta), 'chat: pedido grande virou tarefa do agente sozinho');
const id = r.tarefaId;
H.ctx.rodarTarefas();
// rodada 1: plano + etapa 1 + pausa no meio da etapa 2 (limite de tempo do Google)
let t = st(id);
ok(chamadas[0] && chamadas[0].modelo === 'gemini-forte-teste', 'plano feito com o cérebro forte: ' + (chamadas[0] && chamadas[0].modelo));
ok(chamadas[1] && chamadas[1].modelo !== 'gemini-forte-teste', 'etapas com os cérebros normais');
ok(/ETAPA ATUAL: 1 de 3/.test(chamadas[1].ultimo), 'resultado da ferramenta vem com a etapa atual');
ok(/ETAPA 1 NÃO MARCADA: "feita" precisa de "prova"/.test(chamadas[2].ultimo), 'etapa sem prova não vira ✅ (cérebro é avisado)');
ok(/ETAPA 1 ✅ conferida/.test(chamadas[3].ultimo) && /ETAPA ATUAL: 2 de 3/.test(chamadas[3].ultimo), 'etapa com prova + ferramenta ok vira ✅ e passa pra 2');
ok(/ETAPA 2 NÃO MARCADA: nenhuma ferramenta deu certo/.test(chamadas[4].ultimo), 'prova sem ferramenta que deu certo (página não abriu) não vira ✅');
ok(t[4] === 'pendente' && /Pausou \(limite de tempo do Google\)/.test(t[5]), 'pedido grande passou do tempo: pausou e voltou pra fila');
const salvo = JSON.parse(FILES[id + '.json'] || '{}');
ok(salvo.plano && salvo.plano.etapas.length === 3 && salvo.plano.etapas[0].st === 'feita' && salvo.plano.etapas[1].st === 'tentando', 'plano gravado no estado (sobrevive entre rodadas): ' + JSON.stringify((salvo.plano || {}).etapas || []).slice(0, 120));
const p1 = t[5].split(' | ');
ok(/^📋 Plano: 1 de 3 etapas conferidas$/.test(p1[0]) && /^✅ 1\. Ler nosso preço do iPhone 15 — prova: ler_planilha mostrou/.test(p1[1]) && /^⚠️ 2\. Ver o preço da Loja Z — falhou: site da Loja Z fora do ar \(tentando outro caminho 1\/2\)$/.test(p1[2]) && /^☐ 3\. Anotar a diferença na base$/.test(p1[3]), 'passos começam com o checklist: ' + p1.slice(0, 4).join(' | '));
ok(/🚫 Etapa 1 sem prova: não marcou ✅/.test(t[5]), 'rastro mostra a etapa recusada sem prova');
ok(/Tente OUTRO caminho/.test(salvo.msgs[salvo.msgs.length - 1].content), 'falhou → cérebro manda tentar outro caminho');
// rodada 2: continua de onde parou
H.ctx.rodarTarefas();
t = st(id);
ok(chamadas[5] && /RESULTADO de calcular/.test(chamadas[5].ultimo) && /ETAPA ATUAL: 2 de 3/.test(chamadas[5].ultimo), 'rodada 2 continuou na etapa 2 (não recomeçou)');
ok(/Continuou de onde parou \(rodada 2, etapa 2 de 3\)/.test(t[5]), 'rastro diz em que etapa continuou');
ok(/ANTES DE TERMINAR: etapa\(s\) 3 ainda sem fechar/.test(chamadas[6].ultimo), 'quis terminar com etapa aberta: foi cobrada 1 vez');
ok(/CONFERÊNCIA FINAL/.test(chamadas[7].ultimo) && /✅ 2\. Ver o preço da Loja Z/.test(chamadas[7].ultimo), 'conferência final com o checklist');
ok(chamadas[7].modelo === 'gemini-forte-teste', 'conferência final com o cérebro forte');
ok(chamadas.filter(c => c.modelo === 'gemini-forte-teste').length === 2, 'cérebro forte usado só 2 vezes (plano + conferência)');
ok(t[4] === 'concluída', 'tarefa concluída');
const fim = t[6];
ok(/Não consegui abrir a Loja Z/.test(fim), 'resposta do cérebro no resultado');
ok(/📋 \*\*Conferência das etapas\*\* \(1 de 3 com prova\)/.test(fim) && /✅ 1\. Ler nosso preço do iPhone 15 — prova: ler_planilha mostrou iPhone 15 por R\$ 3\.999 \(ler_planilha(, calcular)?\)/.test(fim), 'resultado lista o que foi conferido, com a prova');
ok(/🔸 2\. Ver o preço da Loja Z — feita, mas NÃO conferida: a conta usou preço chutado/.test(fim) && /☐ 3\. Anotar a diferença na base — não chegou a fazer/.test(fim) && /\*\*Não conferido:\*\* etapas 2, 3/.test(fim), 'resultado honesto: o que NÃO foi conferido (rebaixada na conferência + não feita)');
const pf = t[5].split(' | ');
ok(/^📋 Plano: 1 de 3/.test(pf[0]) && /^🔸 2\./.test(pf[2]) && /Concluída com/.test(pf[pf.length - 1]), 'checklist final nos passos');
ok(!FILES[id + '.json'], 'progresso apagado no fim');
const msg = H.sheets.mensagens.rows.find(x => /🧠 \*\*Resultado da tarefa\*\*/.test(x[2] || '') || /🧠 \*\*Resultado da tarefa\*\*/.test(String(x)));
ok(msg && /Conferência das etapas/.test(String(msg)), 'mensagem "Resultado da tarefa" na conversa traz a conferência');
const lt = run('listarTarefas')().find(x => x.id === id);
ok(lt && /^📋 Plano/.test(lt.passos[0]) && /^✅ 1\./.test(lt.passos[1]), 'app recebe o checklist em passos (sem mexer no app)');

// 3) falha 3 vezes: 2 caminhos novos e depois "falhou de vez"; replanejar troca só o que falta
const est = { log: [], okDesde: [] };
const pg = run('planoGravar'), em = run('etapaMarcar');
pg(est, [{ fazer: 'Publicar o app', prova: 'link abre' }, { fazer: 'Avisar no Telegram', prova: 'telegram enviado' }]);
const a1 = em(est, { n: 1, status: 'falhou', motivo: 'GitHub 401' });
const a2 = em(est, { n: 1, status: 'falhou', motivo: 'GitHub 401 de novo' });
const a3 = em(est, { n: 1, status: 'falhou', motivo: 'sem token' });
ok(/caminho 1 de 2/.test(a1) && /caminho 2 de 2/.test(a2) && /FALHOU de vez/.test(a3) && est.plano.etapas[0].st === 'falhou', 'falha: tenta no máximo 2 caminhos novos e depois desiste da etapa');
ok(run('checklistPlano')(est.plano)[1] === '⚠️ 1. Publicar o app — falhou: sem token', 'checklist mostra a falha com o motivo');
em(est, { n: 2, status: 'feita', prova: 'mandei a mensagem' });
ok(est.plano.etapas[1].st === 'pendente', 'sem ferramenta ok desde a última etapa: "feita" é recusada');
pg(est, ['Salvar o HTML no Drive', 'Mandar o link no Telegram']);
ok(est.plano.etapas.length === 3 && est.plano.etapas[0].st === 'falhou' && est.plano.etapas[1].fazer === 'Salvar o HTML no Drive', 'replanejou: manteve a etapa fechada e trocou as que faltavam');

// 4) tarefa simples sem plano continua igual (sem checklist, sem conferência)
n = 100; chamadas = [];
H.setFetch((u, o) => { if (typeof o.payload !== 'string') return json({}); const b = JSON.parse(o.payload); if (!b.messages) return json({}); chamadas.push({ modelo: b.model }); return resp('{"resposta":"dois mais três dá cinco"}'); });
const s = H.ctx.criarTarefa('quanto é dois mais três, rapidinho', '', 'pc').id;
H.ctx.rodarTarefas();
ok(st(s)[4] === 'concluída' && st(s)[6] === 'dois mais três dá cinco' && !/📋/.test(st(s)[5]), 'tarefa simples sem plano: igual antes (sem checklist inventado)');
