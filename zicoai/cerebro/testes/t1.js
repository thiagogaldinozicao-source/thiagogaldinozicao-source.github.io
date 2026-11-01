const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
let r = H.post({ pin: 'x', acao: 'teste' }); ok(!r.ok && r.erro === 'PIN errado', 'pin errado');
r = H.post({ pin: '1234', acao: 'teste' }); ok(r.ok, 'teste');
// chat normal
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'iPhone', mensagens: [{ role: 'user', content: 'qual a bateria do iPhone 17 Pro Max?' }] });
ok(r.ok && r.chatId && r.titulo, 'chat cria conversa');
ok(!/MEMORIA/.test(r.resposta) && r.salvou.includes('memória'), 'tag de memória processada: ' + r.resposta);
ok(H.sheets.memoria.rows.some(x => x[1] === 'Thiago gosta de café'), 'memória gravada');
const principal = H.fetchLog.find(f => f.body && f.body.tools) || H.fetchLog[0];   // v80: antes vem a busca dos modelos (ficha por aparelho)
const sys = principal.body.messages[0].content;
ok(/17 Pro Max/.test(sys), 'base relevante incluiu 17 Pro Max');
ok(JSON.stringify(principal.body.tools || '').includes('browser_search'), 'ficha técnica (bateria do 17 Pro Max) vai pra pesquisa na web primeiro (v51)');
console.log('passos:', r.passos);
console.log('tokens sys aprox', Math.round(sys.length/3.2));
// programação → groq primeiro; groq dá 429 e cai pro gemini
H.fetchLog.length = 0;
H.setFetch((u, o) => u.includes('groq') ? { getResponseCode: () => 429, getContentText: () => '{"error":{"message":"rate limit"}}' } : { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok código' } }] }) });
r = H.post({ pin: '1234', acao: 'chat', chatId: r.chatId, mensagens: [{ role: 'user', content: 'faz um código html de calculadora' }] });
ok(r.ok && r.cerebro === 'Gemini', 'fallback groq->gemini; ordem: ' + H.fetchLog.map(f => f.body.model).join(','));
console.log('passos:', r.passos);
// abrir conversa
const ab = H.post({ pin: '1234', acao: 'abrir', chatId: r.chatId });
ok(ab.mensagens.length === 4, 'abrir traz 4 mensagens');
// refazer
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'nova versão' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', chatId: r.chatId, refazer: true, mensagens: [{ role: 'user', content: 'faz um código html de calculadora' }] });
const ab2 = H.post({ pin: '1234', acao: 'abrir', chatId: r.chatId });
ok(ab2.mensagens.length === 4 && ab2.mensagens[3].content === 'nova versão', 'refazer substitui última resposta');
// pesquisa → gemini nativo com google
H.fetchLog.length = 0;
H.setFetch((u) => u.includes(':generateContent') ? { getResponseCode: () => 200, getContentText: () => JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Dólar 5,40' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://x.com', title: 'X' } }] } }] }) } : { getResponseCode: () => 500, getContentText: () => 'x' });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'pesquisa a cotação do dólar' }] });
ok(r.ok && /Fontes/.test(r.resposta) && r.cerebro === 'Gemini + Google', 'pesquisa google: ' + r.resposta);
// pesquisa falha total → conversa normal com aviso
H.setFetch((u) => u.includes(':generateContent') || (o => false)() ? { getResponseCode: () => 403, getContentText: () => 'no' } : (u.includes('groq') ? { getResponseCode: () => 400, getContentText: () => '{"error":{"message":"tools not allowed"}}' } : { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'sei lá' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'pesquisa a cotação do dólar' }] });
ok(r.ok && /não consegui pesquisar/.test(r.resposta), 'pesquisa indisponível avisa');
// imagem
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Bora! [[IMAGEM: gold iphone on black background]]' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', modo: 'imagem', mensagens: [{ role: 'user', content: 'cria um iphone dourado' }] });
ok(/!\[imagem gerada\]\(https:\/\/image\.pollinations\.ai\/prompt\/gold%20iphone/.test(r.resposta), 'imagem vira markdown');
// esquecer + aprendizado
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Beleza [[ESQUECER: frete da Will]] [[MEMORIA: O frete da Will agora é 20%]] [[APRENDIZADO: usei 15% || é 20%]]' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'o frete da will mudou pra 20%' }] });
ok(!H.sheets.memoria.rows.some(x => x[1] === 'O frete da Will agora é 15%') && H.sheets.memoria.rows.some(x => x[1] === 'O frete da Will agora é 20%'), 'esqueceu antigo e salvou novo');
ok(H.sheets.aprendizados.rows.some(x => x[2] === 'é 20%'), 'aprendizado salvo');
// dado sensível não salva
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok [[MEMORIA: cliente CPF 123.456.789-00]]' } }] }) }));
const antes = H.sheets.memoria.rows.length;
H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'x' }] });
ok(H.sheets.memoria.rows.length === antes, 'CPF não vai pra memória');
r = H.post({ pin: '1234', acao: 'salvar', texto: 'liga pro (35) 99999-1234' }); ok(!r.ok, 'salvar bloqueia telefone');
// contexto + registrar (modo PC)
r = H.post({ pin: '1234', acao: 'contexto', pergunta: 'iPhone 15' }); ok(r.ok && /PERFIL/.test(r.sistema), 'contexto');
r = H.post({ pin: '1234', acao: 'registrar', pergunta: 'oi', resposta: '<think>hm</think>Oi! [[MEMORIA: teste pc]]', cerebro: 'PC · zicoai' });
ok(r.ok && r.resposta === 'Oi!' && r.chatId, 'registrar PC');
// lista + apagar
let l = H.post({ pin: '1234', acao: 'chats' }); console.log('chats:', l.chats.length);
const alvo = l.chats[0].id;
H.post({ pin: '1234', acao: 'apagarChat', chatId: alvo });
ok(!H.post({ pin: '1234', acao: 'abrir', chatId: alvo }).mensagens.length && H.post({ pin: '1234', acao: 'chats' }).chats.length === l.chats.length - 1, 'apagar conversa');
r = H.post({ pin: '1234', acao: 'apagarMemoria', texto: 'teste pc' }); ok(r.apagadas === 1, 'apagar memória');
r = H.post({ pin: '1234', acao: 'memorias' }); ok(r.ok && r.memorias.length, 'listar memórias');
// foto vai pro gemini com image_url
H.fetchLog.length = 0;
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'MAC 00:11' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', imagem: 'data:image/jpeg;base64,AAA', mensagens: [{ role: 'user', content: 'ativa' }] });
const last = H.fetchLog[0].body.messages.slice(-1)[0];
ok(Array.isArray(last.content) && last.content[1].image_url.url.startsWith('data:'), 'foto mandada como image_url');
ctx = H.ctx; H.ctx.instalar();
