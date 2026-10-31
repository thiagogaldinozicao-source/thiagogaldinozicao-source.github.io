// Treino diário, revisão do dia, pergunta do dia, perguntas novas, exportação
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const prova = H.ctx.aba('prova');
for (let i = 1; i <= 6; i++) prova.appendRow([i, 'Preço', 'Pergunta ' + i + '?', 'c1 | c2 | c3 | c4', 'erro', i <= 2 ? 5 : '', i <= 2 ? '29/10/2026' : '', '']);
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (/corrige a prova/.test(b.messages[0].content)) return resp('{"nota": 6, "faltou": "prometeu entrega"}'); return resp('resposta de treino'); });
H.ctx.treinoDiario();
const tr = H.sheets.treino.rows;
ok(tr.length === 2 && tr[1][1] === 'prova rápida' && Number(tr[1][2]) === 6 && /: 6/.test(tr[1][3]), 'treino diário gravou média e detalhe: ' + tr[1][3].slice(0, 60));
ok(prova.rows.filter(l => l[6] === "'30/10/2026").length === 4, '4 perguntas sorteadas receberam nota hoje');
ok(H.sheets.aprendizados.rows.some(l => /^Treino \d+ \(Preço\): prometeu entrega/.test(l[1]) && l[3] === 'treino'), 'nota baixa virou aprendizado de treino');
// revisão do dia
H.ctx.aba('mensagens');
H.sheets.mensagens.rows.push(['r1', '2026-10-30 10:00:00', 'thiago', 'oi', '', 'iPhone']);
H.sheets.mensagens.rows.push(['r1', '2026-10-30 10:00:05', 'zicoai', 'Oi! Tô aqui. Quer que eu faça algo? Só pedir 🤝', 'PC (zicoai)', 'iPhone']);
H.sheets.mensagens.rows.push(['r1', '2026-10-30 10:01:00', 'thiago', 'quanto tá o 13?', '', 'iPhone']);
H.sheets.mensagens.rows.push(['r1', '2026-10-30 10:01:05', 'zicoai', 'Preciso confirmar o preço do 13 e te falo.', 'Gemini', 'iPhone']);
let pedido = null;
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (/revisa as respostas/.test(b.messages[0].content)) { pedido = b; return resp('{"problemas":[{"indice":0,"regra":"1","erro":"terminou com Só pedir e oferta","certo":"Terminar a resposta quando acabar, sem oferta"}],"nota":7}'); } return resp('x'); });
H.ctx.revisarDia();
ok(pedido && /#0 \[PC \(zicoai\)\]/.test(pedido.messages[1].content) && /#1 \[Gemini\]/.test(pedido.messages[1].content), 'revisor recebe os pares do dia com o cérebro');
ok(H.sheets.aprendizados.rows.some(l => /Revisão \[PC \(zicoai\)\]: terminou com Só pedir/.test(l[1]) && l[3] === 'revisão'), 'problema virou aprendizado com o cérebro culpado');
const rev = H.sheets.treino.rows.find(l => l[1] === 'revisão do dia');
ok(rev && Number(rev[2]) === 7 && /PC \(zicoai\) 1/.test(rev[3]), 'revisão gravou nota e contagem por cérebro: ' + rev[3]);
// pergunta do dia: precos vazia primeiro
let pd = H.ctx.perguntaDoDia();
ok(/aba precos/.test(pd), 'pergunta do dia 1: preços vazios');
H.sheets.base.rows.push(['Promessa da loja: Sinal reserva', 'NÃO CONFIRMADO se aceita sinal.']);
pd = H.ctx.perguntaDoDia();
ok(/sinal reserva, qual é a regra certa\?/.test(pd), 'pergunta do dia 2: item não confirmado: ' + pd);
pd = H.ctx.perguntaDoDia();
ok(pd === null, 'não repete perguntas já feitas');
// perguntas novas
H.setFetch(() => resp('{"perguntas":[{"grupo":"Cliente","pergunta":"Cliente quer trocar um 11 por um 15, como respondo?","criterios":"a | b | c | d","erro":"inventar valor"},{"grupo":"Preço","pergunta":"Pergunta 1?","criterios":"x | y | z | w","erro":"e"}]}'));
const novas = H.ctx.gerarPerguntasProva();
ok(novas === 1 && prova.rows.some(l => /trocar um 11 por um 15/.test(l[2]) && /gerada automaticamente/.test(l[7])), 'gera pergunta nova e ignora repetida: ' + novas);
// exportação
H.sheets.exemplos = null; const ex = H.ctx.aba('exemplos'); ex.appendRow(["'30/10/2026", 'p', 'r boa', 'Groq GPT-OSS 120B', 'geral']); ex.appendRow(["'30/10/2026", 'p2', 'r do gemini', 'Gemini', 'geral']); ex.appendRow(["'30/10/2026", 'p3', 'r pra revisar', 'Groq GPT-OSS 120B', 'código', 'código', 'estudo (revisar)']);
let arquivo = null;
H.ctx.DriveApp.getFoldersByName = () => ({ hasNext: () => false });
H.ctx.DriveApp.createFolder = () => ({ createFile: b => { arquivo = { nome: b.getName(), txt: Buffer.from(b.getBytes()).toString() }; return { getId: () => 'TREINOID' }; } });
const id = H.ctx.exportarTreino();
ok(id === 'TREINOID' && /zicoai-treino-2026-10-30\.jsonl/.test(arquivo.nome) && arquivo.txt.split('\n').length >= 2 && /"role":"assistant","content":"r boa"/.test(arquivo.txt), 'JSONL de treino exportado: ' + arquivo.nome);
ok(!/r do gemini|r pra revisar/.test(arquivo.txt), 'exportação deixa de fora Gemini e o que falta revisar');
H.ctx.ligarRotinas();
