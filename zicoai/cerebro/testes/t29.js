// Busca de aulas nova (BM25): palavra rara pesa mais, lê o conteúdo, conversa à toa não puxa aula
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const a = H.ctx.aba('aulas');
const linhas = [
  ['A01', 'A', 'O método de trabalho', 'fazer, criar, tarefa, passo a passo', 'Entender, planejar, ler antes de mexer, testar.', 'Leia o código antes de mudar. Teste cada mudança.'],
  ['C09', 'C', 'TV Box e ativação (VU Player)', 'tv box, vu player, ativação, mac, key', 'Foto da tela de ativação: responder só o MAC e a key.', 'O cliente manda a foto do VU Player e vc devolve o MAC e a key em bloco de código.'],
  ['B15', 'B', 'Conta de parcelas com taxa da maquininha', 'parcelas, taxa, maquininha, 12x, juros', 'Parcela vezes número de vezes tem que fechar com o total.', 'Arredonde a parcela e ajuste o centavo na última.'],
  ['B30', 'B', 'Ler código de barras pela câmera', 'código de barras, câmera, scanner', 'Use o leitor nativo e, se não tiver, ZXing.', 'No iPhone o BarcodeDetector não existe; use ZXing pelo CDN.'],
  ['D19', 'D', 'teste que quebra à meia-noite', 'teste, relógio, meia-noite, data', 'Congele o relógio nos testes.', 'O harness usa um relógio fixo pra data não virar no meio do teste.']
];
for (let i = 0; i < 60; i++) linhas.push(['X' + i, 'B', 'Aula de enchimento ' + i, 'app, fazer, criar, tela, botão', 'Regra genérica ' + i + ' sobre app e tela.', 'Conteúdo genérico de app número ' + i + ' com botão e tela.']);
linhas.forEach(l => a.appendRow(l.concat(['GitHub'])));
const busca = q => { H.ctx.__q = q; return vm.runInContext('aulasPara(__q, 2).map(x => x[0])', H.ctx); };

ok(busca('a tv box do cliente pediu ativação no vu player, me passa o mac')[0] === 'C09', 'TV Box acha a C09');
ok(busca('quanto fica em 12x na maquininha com a taxa')[0] === 'B15', 'parcelas acha a B15');
ok(busca('o iphone não lê o código de barras com a câmera')[0] === 'B30', 'código de barras acha a B30');
ok(busca('ZXing pelo CDN não carregou')[0] === 'B30', 'palavra que só está no CONTEÚDO também acha (ZXing)');
ok(busca('harness relógio fixo')[0] === 'D19', 'acha pelo conteúdo e pelas palavras-chave juntos');
const casual = ['oi', 'oi tudo bem?', 'bom dia', 'e ai zica', 'valeu', 'kkkk', 'boa noite'];
ok(casual.every(q => busca(q).length === 0), 'conversa à toa não puxa aula');
ok(busca('cria um app com um botão na tela').length <= 2, 'palavra comum (app, tela, botão) não enche de aula: no máximo 2');
const t0 = Date.now(); for (let i = 0; i < 20; i++) busca('tv box ativação mac key ' + i);
ok(Date.now() - t0 < 2000, '20 buscas seguidas rápidas (' + (Date.now() - t0) + ' ms)');
