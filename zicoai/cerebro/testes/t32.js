// v48: busca de aulas por palavra + significado, conversa à toa, 2 aulas completas + 3 "talvez", 1 vetor por mensagem
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
H.PROPS.GEMINI_KEY = 'k';
const a = H.ctx.aba('aulas');
const linhas = [
  ['A502', 'A', 'Só dizer que funciona depois de testar', 'testar, conferir, funciona, prova', 'Nunca diga que está testado sem ter testado de verdade.', 'Por quê: quem lê confia e para de conferir; um "tá testado" falso vira bug na mão do cliente.'],
  ['B506', 'B', 'Mudar só o trecho, não o arquivo inteiro', 'editar, trecho, arquivo, mudança pequena', 'Troque só o pedaço que muda.', 'Por quê: reescrever tudo apaga o que já funcionava sem ninguém perceber.'],
  ['C09', 'C', 'TV Box e ativação (VU Player)', 'tv box, vu player, ativação, mac, key', 'Foto da tela de ativação: responder só o MAC e a key.', 'O cliente manda a foto e vc devolve o MAC e a key.'],
  ['B15', 'B', 'Conta de parcelas com taxa da maquininha', 'parcelas, taxa, maquininha, 12x, juros', 'Parcela vezes número de vezes tem que fechar com o total.', 'Arredonde a parcela e ajuste o centavo na última.']
];
for (let i = 0; i < 60; i++) linhas.push(['X' + i, 'B', 'Aula de enchimento ' + i, 'app, fazer, criar, tela, botão', 'Regra genérica ' + i + ' sobre app e tela.', 'Conteúdo genérico ' + i + '.']);
linhas.forEach(l => a.appendRow(l.concat(['GitHub'])));

// "Gemini de mentira": vetor por tema. A situação "pode dizer que tá testado" tem o mesmo significado da A502,
// mesmo sem palavra em comum com ela.
const tema = t => /testad|testar|pode falar/i.test(t) ? 0 : /reescrev|arquivo todo|inteiro|trecho/i.test(t) ? 1 : /tv box|vu player|ativa/i.test(t) ? 2 : /parcela|maquininha|12x/i.test(t) ? 3 : 4 + (t.length % 5);
const vetor = t => { const v = new Array(12).fill(0.01); v[tema(t)] = 1; return v; };
let chamadasEmbed = 0, textosEmbed = 0;
H.setFetch((u, o) => {
  if (/batchEmbedContents/.test(u)) { chamadasEmbed++; const b = JSON.parse(o.payload); textosEmbed += b.requests.length; return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ embeddings: b.requests.map(r => ({ values: vetor(r.content.parts[0].text) })) }) }; }
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok' } }] }) };
});
const run = (code, q) => { H.ctx.__q = q; vm.runInContext('BM25_AULAS = null; VETORES_AULAS = null; for (const k in VETOR_PERGUNTA) delete VETOR_PERGUNTA[k];', H.ctx); return vm.runInContext(code, H.ctx); };
const busca = (q, n) => run('aulasPara(__q, ' + (n || 2) + ').map(x => x[0])', q);

// 1) conversa à toa
['oi', 'bom dia', 'boa noite zica', 'valeu', 'kkkk', 'tá bom', 'obrigado', 'show', 'tudo certo?', 'entendi', 'e ai zica'].forEach(q => {
  if (busca(q).length) ok(false, 'conversa à toa puxou aula: ' + q);
});
ok(vm.runInContext('ehConversaAToa("bom dia")', H.ctx) && !vm.runInContext('ehConversaAToa("bom dia, faz a lista de preço")', H.ctx), 'detector: "bom dia" é à toa, "bom dia, faz a lista" não');
ok(busca('bom dia, quanto fica em 12x na maquininha?')[0] === 'B15', 'cumprimento junto com pedido de verdade ainda acha a aula');

// 2) significado acha a aula da SITUAÇÃO, que palavra sozinha não acha
const semVetor = run('aulasPara(__q, 2, null).map(x => x[0])', 'o upload da nota tá ok, pode falar pra ela');
const comVetor = busca('o upload da nota tá ok, pode falar pra ela');
ok(semVetor[0] !== 'A502' && comVetor[0] === 'A502', 'situação "tá ok, pode falar pra ela" → A502 só com significado (sem: ' + semVetor.join(',') + ')');
ok(busca('reescreve o arquivo todo do app, é mais rápido')[0] === 'B506', 'reescrever tudo → B506');
ok(busca('a tv box do cliente pediu ativação no vu player')[0] === 'C09', 'palavra continua funcionando (C09)');

// 3) vetores das aulas ficam guardados (aba vetores) e a mensagem embute 1 vez só
chamadasEmbed = 0; textosEmbed = 0;
run('aulasPara(__q, 2).length', 'quanto fica em 12x na maquininha?');
ok(textosEmbed === 1, 'aulas já embutidas: só a mensagem vai pro Gemini (' + textosEmbed + ' texto)');
const guardadas = H.sheets.vetores.rows.filter(r => r[0] === 'aulas').length;
ok(guardadas === linhas.length, 'vetor de cada aula guardado na aba vetores (' + guardadas + ')');
a.rows.find(r => r[0] === 'C09')[5] = 'Conteúdo novo da C09: devolve MAC e key em bloco de código.';
run('aulasPara(__q, 2).length', 'tv box');
ok(H.sheets.vetores.rows.filter(r => r[0] === 'aulas' && /^C09#/.test(r[1])).length === 2, 'aula mudou → vetor refeito (chave com hash do texto)');
chamadasEmbed = 0;
run('vetorDaPergunta(__q); vetorDaPergunta(__q); aulasPara(__q, 2).length', 'quanto fica em 12x?');
ok(chamadasEmbed === 1, 'mesma mensagem: 1 chamada de vetor só (memória e aulas dividem)');

// 4) Gemini fora do ar: segue só por palavra, sem erro
H.setFetch(() => ({ getResponseCode: () => 503, getContentText: () => '{}' }));
vm.runInContext('CacheService.getScriptCache().remove("embed_off")', H.ctx);
let r = []; try { r = busca('a tv box pediu ativação no vu player'); } catch (e) { r = ['ERRO ' + e.message]; }
ok(r[0] === 'C09', 'sem Gemini: busca por palavra segue normal');

// 5) contexto: 2 completas + até 3 "talvez" só com a regra
H.setFetch((u, o) => { if (/batchEmbedContents/.test(u)) { const b = JSON.parse(o.payload); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ embeddings: b.requests.map(r => ({ values: vetor(r.content.parts[0].text) })) }) }; } return { getResponseCode: () => 200, getContentText: () => '{}' }; });
vm.runInContext('CacheService.getScriptCache().remove("embed_off")', H.ctx);
const ctx = run('contextoAulas(__q, 2)', 'cria um app com um botão na tela e testa');
const fortes = (ctx.split('### OUTRAS')[0].match(/^\[[A-Z]\d+\]/gm) || []).length;
const talvez = ((ctx.split('### OUTRAS')[1] || '').match(/^\[[A-Z]\d+\]/gm) || []).length;
ok(fortes === 2 && talvez >= 1 && talvez <= 3, 'contexto com 2 aulas completas + ' + talvez + ' "talvez"');
ok(/entenda o PORQUÊ/.test(ctx) && /use só se a situação for essa/.test(ctx), 'contexto pede pra entender o porquê e usar o "talvez" só se servir');
ok(/versão 48/.test(vm.runInContext('VERSAO_CEREBRO', H.ctx)), 'cérebro na versão 48');
