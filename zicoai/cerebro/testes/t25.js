// Aulas (curso ABC): o cérebro acha a aula certa pelas palavras do pedido e põe a REGRA no sistema
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
const a = H.ctx.aba('aulas');
a.appendRow(['C06', 'C', 'Comparativo de celular pro cliente', 'comparativo, comparar, qual melhor, diferença, vs, cliente indeciso, specs', 'Specs conferidas; bloco de código; ✅ no vencedor de cada categoria.', 'Fecha com "Bora fechar? 🤝".', 'planilha (privado)']);
a.appendRow(['B01', 'B', 'O padrão dos apps do Thiago', 'app, criar app, html, aplicativo, pwa, modo escuro, preto e dourado, layout', 'App em um arquivo .html, mobile-first, modo escuro preto e dourado.', '', 'GitHub']);
a.appendRow(['A04', 'A', 'Achar a causa de um erro', 'erro, bug, não funciona, travou, quebrou, deu ruim, tela branca', 'Leia o erro, veja os passos, pergunte "foi eu?".', '', 'GitHub']);
a.appendRow(['', '', '', '', '', '', '']);

let sys = '';
H.setFetch((u, o) => { if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp('ok, resposta de teste com texto suficiente.'); } } return json({}); });
const chat = (t, extra) => H.post(Object.assign({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: t }] }, extra || {}));

let r = chat('faz um comparativo do iphone 15 com o 16 pro cliente indeciso');
ok(/### AULAS QUE SE APLICAM/.test(sys) && /\[C06\] Comparativo/.test(sys) && /REGRA: Specs conferidas/.test(sys), 'comparativo puxa a aula C06 com a regra');
ok(!/\[B01\]/.test(sys), 'aula que não tem a ver fica de fora');
ok(r.passos.some(p => /📚 Aula\(s\) que se aplicam: C06/.test(p)), 'passo mostra a aula usada');

chat('cria um app html de lista de compras em modo escuro');
ok(/\[B01\] O padrão dos apps/.test(sys), 'pedido de app puxa a B01');

chat('oi tudo bem?');
ok(!/### AULAS QUE SE APLICAM/.test(sys), 'conversa à toa não puxa aula');

chat('meu app deu erro e travou, tela branca');
ok(/\[A04\]/.test(sys), 'erro puxa a A04');

// texto colado (documento) e imagem não puxam aula
chat('comparativo '.repeat(200));
ok(!/### AULAS QUE SE APLICAM/.test(sys), 'texto longo colado não puxa aula');

// máximo 2 aulas
const vm = require('vm');
const lista = vm.runInContext('aulasPara("comparativo de app com erro e bug, cliente indeciso, criar app html", 2)', H.ctx);
ok(lista.length === 2, 'no máximo 2 aulas por pedido');

// agente também lê as aulas
let passoAg = 0, sysAg = '';
H.setFetch((u, o) => {
  if (typeof (o || {}).payload !== 'string') return json({});
  const b = JSON.parse(o.payload); if (!b.messages) return json({});
  if (/AGENTE em segundo plano/.test(b.messages[0].content)) { sysAg = b.messages[0].content; passoAg++; return resp('{"resposta":"Feito: comparativo pronto."}'); }
  return resp('ok');
});
r = H.post({ pin: '1234', acao: 'tarefa', pedido: 'monta um comparativo do iphone 15 com o 16 pro cliente indeciso' });
H.ctx.rodarTarefas();
ok(/\[C06\] Comparativo/.test(sysAg), 'agente recebe a aula no sistema');
const t = H.sheets.tarefas.rows.find(x => x[0] === r.id);
ok(/📚 Leu 1 aula\(s\) do curso/.test(t[5]), 'rastro do agente mostra a aula lida');

// muitas aulas: índice em pedaços no cache, busca rápida e o Conteúdo só das escolhidas
for (const k of Object.keys(H.CACHE)) if (/^aulas_idx/.test(k)) delete H.CACHE[k];
for (let i = 0; i < 3000; i++) a.appendRow(['X' + i, 'B', 'Aula de enchimento número ' + i, 'enchimento, teste, volume' + i, 'Regra de enchimento ' + i + ' com um texto razoavelmente comprido pra ocupar espaço no índice.', 'conteudo '.repeat(200), 'GitHub']);
a.appendRow(['B99', 'B', 'Ler código de barras pela câmera', 'código de barras, câmera, scanner, ler etiqueta, imei', 'Use o leitor nativo e, se não tiver, ZXing.', 'Conteúdo da B99 completo.', 'GitHub']);
const t0 = Date.now();
const achou = vm.runInContext('aulasPara("como ler código de barras pela câmera do iphone", 2)', H.ctx);
const ms = Date.now() - t0;
ok(achou.length && achou[0][0] === 'B99', 'com 3 mil aulas acha a certa (' + ms + ' ms)');
ok(Number(H.CACHE.aulas_idx_n) > 1, 'índice grande vai pro cache em ' + H.CACHE.aulas_idx_n + ' pedaços');
const ctx2 = vm.runInContext('contextoAulas("como ler código de barras pela câmera do iphone", 1)', H.ctx);
ok(/\[B99\]/.test(ctx2) && /Conteúdo da B99 completo/.test(ctx2) && !/conteudo conteudo/.test(ctx2), 'Conteúdo lido só da aula escolhida');
const t1 = Date.now(); vm.runInContext('aulasPara("scanner de imei pela câmera", 2)', H.ctx);
ok(Date.now() - t1 <= ms + 50, 'segunda busca usa o índice do cache');

// sincronizar aulas públicas do GitHub: atualiza pelo ID, acrescenta novas, não mexe nas privadas
H.setFetch(u => /aulas\.json/.test(u) ? { getResponseCode: () => 200, getContentText: () => JSON.stringify([
  ['B01', 'B', 'O padrão dos apps do Thiago', 'app, html', 'Regra NOVA do B01.', 'conteúdo novo', 'GitHub zicoai/aulas/B/B01-app-em-um-arquivo.md'],
  ['A01', 'A', 'O método de trabalho', 'método, passo a passo', 'Entender, planejar, ler, mudar pouco, testar.', '', 'GitHub zicoai/aulas/A/A01-metodo.md'],
  ['C06', 'C', 'TENTATIVA DE SOBRESCREVER PRIVADA', 'x', 'x', 'x', 'GitHub falso'],
  ['=CMD', 'A', 'injeção', 'x', 'x', 'x', 'GitHub']
]) } : json({}));
const sync = vm.runInContext('sincronizarAulas()', H.ctx);
ok(sync.ok && sync.atualizadas === 1 && sync.novas === 1, 'sincronizou: 1 atualizada, 1 nova (' + JSON.stringify(sync) + ')');
ok(a.rows.find(l => l[0] === 'B01')[4] === 'Regra NOVA do B01.' && a.rows.some(l => l[0] === 'A01'), 'B01 atualizada e A01 acrescentada');
ok(a.rows.find(l => l[0] === 'C06')[2] === 'Comparativo de celular pro cliente' && !a.rows.some(l => l[0] === '=CMD'), 'aula privada C06 intocada e ID estranho recusado');
const sync2 = vm.runInContext('sincronizarAulas()', H.ctx);
ok(sync2.atualizadas === 0 && sync2.novas === 0, 'rodar de novo não muda nada');
