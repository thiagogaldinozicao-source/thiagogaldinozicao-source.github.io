// Aprender com todos os cérebros: exemplos (👍), roteador por nota, ensinar com arquivo, arrumar memória
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
let sys = '';
H.setFetch((u, o) => { if (typeof o.payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) sys = b.messages[0].content; } return resp('ok'); });
// 1) 👍 com pergunta vira exemplo
let r = H.post({ pin: '1234', acao: 'feedback', nota: 'up', chatId: 'c', pergunta: 'faz uma mensagem pro cliente que pediu desconto', resposta: 'Cara, esse valor já tá no limite do Pix! Bora fechar? 🔥', cerebro: 'Gemini' });
ok(r.ok && r.salvou.includes('exemplo') && H.sheets.exemplos.rows.length === 2 && H.sheets.exemplos.rows[1][4] === 'cliente', '👍 virou exemplo com assunto: ' + H.sheets.exemplos.rows[1][4]);
r = H.post({ pin: '1234', acao: 'feedback', nota: 'up', chatId: 'c', pergunta: 'faz uma mensagem pro cliente que pediu desconto', resposta: 'outra', cerebro: 'Gemini' });
ok(!r.salvou.includes('exemplo') && H.sheets.exemplos.rows.length === 2, 'mesma pergunta não duplica exemplo');
r = H.post({ pin: '1234', acao: 'feedback', nota: 'up', chatId: 'c', pergunta: 'cliente joão cpf 123.456.789-00', resposta: 'resposta longa o suficiente aqui', cerebro: 'Gemini' });
ok(!r.salvou.includes('exemplo'), 'exemplo com CPF é barrado');
// 2) exemplo entra no sistema da pergunta parecida
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'responde pro cliente que quer desconto no pix' }] });
ok(/### EXEMPLOS DE RESPOSTAS QUE O THIAGO APROVOU/.test(sys) && /Bora fechar/.test(sys) && r.passos.some(p => /exemplo\(s\) de resposta aprovada/.test(p)), 'exemplo aprovado entra no sistema');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'qual a bateria do iphone 17?' }] });
ok(!/### EXEMPLOS/.test(sys), 'pergunta sem relação não puxa exemplo');
// 3) roteador: Gemini com muitos 👎 vai pro fim
for (let i = 0; i < 4; i++) H.post({ pin: '1234', acao: 'feedback', nota: 'down', chatId: 'c', comentario: 'resposta ruim demais ' + i, resposta: 'x', cerebro: 'Gemini' });
H.fetchLog.length = 0;
Object.keys(H.CACHE).forEach(k => { if (/^(tk|rq)_/.test(k)) delete H.CACHE[k]; });   // v51: a pesquisa da ficha gastou o minuto do Groq
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.cerebro === 'Groq GPT-OSS 120B' && r.passos.some(p => /Roteador: Gemini com muita reprovação/.test(p)), 'Gemini reprovado vai pro fim: ' + r.cerebro);
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'gemini', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.cerebro === 'Gemini', 'escolha manual ignora a nota');
for (let i = 0; i < 6; i++) H.post({ pin: '1234', acao: 'feedback', nota: 'up', chatId: 'c', pergunta: 'p' + i, resposta: 'resposta boa o suficiente ' + i, cerebro: 'Gemini' });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(r.cerebro === 'Gemini', 'com mais 👍 o Gemini volta pra frente');
// 4) ensinar com arquivo
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (/organiza conhecimento/.test(b.messages[0].content)) return resp('```json\n{"itens":[{"assunto":"Garantia TV Box","conteudo":"TV Box tem 3 meses de garantia da loja."},{"assunto":"Cliente Maria","conteudo":"Maria, telefone (35) 99999-1234, comprou iPhone 13."},{"assunto":"Horário sábado","conteudo":"Sábado abre das 9h às 13h."}]}\n```'); return resp('ok'); });
r = H.post({ pin: '1234', acao: 'aprenderTexto', nome: 'regras.txt', texto: 'Regras da loja: TV Box garantia 3 meses. Sábado 9h às 13h. Cliente Maria (35) 99999-1234 comprou iPhone 13.' });
ok(r.ok && r.novos === 2 && r.barrados === 1, 'arquivo virou 2 fatos, 1 barrado (telefone): ' + JSON.stringify(r));
ok(H.sheets.base.rows.some(l => l[0] === 'Garantia TV Box') && !H.sheets.base.rows.some(l => /Maria/.test(l[0])), 'base recebeu os fatos certos');
ok(H.sheets.historico.rows.some(l => /arquivo:regras.txt/.test(l[5])), 'histórico marca a origem');
r = H.post({ pin: '1234', acao: 'aprenderTexto', texto: 'curto' });
ok(!r.ok, 'texto curto recusado');
// 5) arrumar memória: repetidas somem, fica a mais nova
H.sheets.memoria.rows.push(["'10/10/2026", 'O frete da Will agora é 20 por cento', 'a']);
H.sheets.memoria.rows.push(["'20/10/2026", 'Frete da Will agora é 20 por cento sobre o valor', 'b']);
const antes = H.sheets.memoria.rows.length;
const n = H.ctx.arrumarMemoria();
ok(n >= 1 && H.sheets.memoria.rows.length === antes - n && H.sheets.memoria.rows.some(l => /20 por cento sobre o valor/.test(l[1])), 'repetida antiga removida, nova fica: ' + n);
ok(H.sheets.historico.rows.some(l => l[1] === 'memoria' && l[5] === 'arrumacao'), 'remoção registrada no histórico');
H.ctx.ligarRotinas();
