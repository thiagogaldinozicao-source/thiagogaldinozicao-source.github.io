// v80: comparativo pesquisa a ficha de CADA aparelho (pedido real de 01/11)
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const pedido = 'Faz um comparativo pra mim \n\nPreciso de comparar:\n\nRealme 14 5g vs Realme c85 nfc vs note 15 pro 5g pra eu mandar pra um cliente aqui bora la';
ok(run('ehFichaTecnica(' + JSON.stringify(pedido) + ', [])') === true, 'o pedido real é reconhecido como comparativo de aparelho');
run(`var _buscas = [], _sistema = '';
buscarLinks = function(q){ _buscas.push(q); var m = q.replace(' especificações ficha técnica',''); return [{titulo:'blog', url:'https://blogqualquer.com/' + encodeURIComponent(m)}, {titulo:'gsm', url:'https://www.gsmarena.com/' + encodeURIComponent(m) + '.php'}]; };
lerPaginas = function(urls){ return urls.map(function(u){ return /c85/i.test(u) ? 'Página do Realme C75 (outro modelo) ' + 'x'.repeat(400) : 'Ficha completa ' + decodeURIComponent(u) + ' bateria 6000 mAh tela AMOLED 6.67 120Hz ' + 'x'.repeat(400); }); };
temCerebro = function(n){ return n === 'groq' || n === 'gemini'; }; motivoNaoCabe = function(){ return ''; };
chamarCompat = function(c, msgs){
  var sys = msgs[0].content, u = msgs[msgs.length-1].content;
  if (/Liste os modelos/.test(sys)) return '{"modelos":["Realme 14 5G","Realme C85 NFC","Redmi Note 15 Pro 5G"]}';
  if (/Extraia do MATERIAL/.test(sys)) { if (/C85/.test(sys)) return '{"modelo_da_pagina":"Realme C75","mesmo_modelo":false}'; var url = (u.match(/\\[FONTE (\\S+)\\]/)||[])[1]; return JSON.stringify({ modelo_da_pagina: 'x', mesmo_modelo: true, tela: 'AMOLED 6,67" 120 Hz', chip: 'Snapdragon 6 Gen 4', ram_armazenamento: '8/256 GB', bateria: '6000 mAh', carregamento: '45 W', resistencia: 'IP69', nfc: 'sim', fonte: url }); }
  _sistema += sys + ' ===== '; return 'COMPARATIVO ok';
};`);
const r = run('fichasConferidas(' + JSON.stringify(pedido) + ')');
ok(r.total === 3 && run('_buscas.length') === 3, 'pesquisou a ficha de cada um dos 3 separado');
ok(/gsmarena/.test(r.texto) && /6000 mAh/.test(r.texto) && /Snapdragon 6 Gen 4/.test(r.texto), 'prefere site de ficha técnica e traz os números com a fonte');
ok(r.achou === 2 && /Realme C85 NFC\*\*\n- NÃO ACHEI/.test(r.texto), 'página de OUTRO modelo (C75 no lugar do C85) não vale: fica "não achei"');
ok(/resistencia: IP69/.test(r.texto) && /peso: não confirmado/.test(r.texto), 'campo sem dado vira "não confirmado"');
// no fluxo da conversa: fichas entram no sistema e a resposta não diz que a pesquisa falhou
run('pesquisar = function(){ return null; }; pesquisaProfunda = function(){ return null; };');
const resp = H.post({ pin: '1234', acao: 'chat', aparelho: 'iPhone', mensagens: [{ role: 'user', content: pedido }] });
const sis = run('_sistema');
ok(/FICHAS CONFERIDAS/.test(sis) && /6000 mAh/.test(sis), 'o comparativo é montado em cima das fichas');
ok(!/A PESQUISA FALHOU/.test(sis), 'com as fichas na mão não fala que a pesquisa falhou');
ok(/versão (8\d|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 80 ou mais nova');
