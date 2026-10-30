// Novidades: BASE/PERFIL com histórico, feedback, compactação, prova, Cerebras opcional, PC de código
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const cai = (cod, txt) => ({ getResponseCode: () => cod, getContentText: () => txt });

// 1) BASE cria linha nova + histórico
H.setFetch(() => resp('Anotado. [[BASE: Garantia seminovo || Seminovo tem 6 meses de garantia da loja]]'));
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'seminovo tem 6 meses de garantia' }] });
ok(r.ok && r.salvou.includes('base nova') && !/BASE:/.test(r.resposta), 'BASE nova: ' + r.salvou.join(','));
ok(H.sheets.base.rows.some(l => l[0] === 'Garantia seminovo' && /6 meses/.test(l[1])), 'linha criada na base');
ok(H.sheets.historico && H.sheets.historico.rows.length === 2 && H.sheets.historico.rows[1][1] === 'base' && H.sheets.historico.rows[1][3] === '', 'histórico registrou criação');
ok(typeof r.ms === 'number', 'tempo de resposta (ms) vem na resposta');
// 2) BASE mesmo assunto substitui (case/acento ignorados) e guarda o "antes"
H.setFetch(() => resp('Corrigido. [[BASE: garantia SEMINOVO || Seminovo tem 1 ano de garantia da loja]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'na verdade é 1 ano' }] });
const linhasGar = H.sheets.base.rows.filter(l => /garantia seminovo/i.test(l[0]));
ok(r.salvou.includes('base atualizada') && linhasGar.length === 1 && /1 ano/.test(linhasGar[0][1]), 'BASE substitui sem duplicar');
const h = H.sheets.historico.rows[H.sheets.historico.rows.length - 1];
ok(/6 meses/.test(h[3]) && /1 ano/.test(h[4]), 'histórico guarda antes e depois');
// 3) mesmo conteúdo de novo: não grava nada
const hAntes = H.sheets.historico.rows.length;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'repete' }] });
ok(!r.salvou.length && H.sheets.historico.rows.length === hAntes, 'conteúdo igual não gera histórico');
// 4) PERFIL
H.setFetch(() => resp('Beleza. [[PERFIL: Como responder || Nunca terminar com oferta]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'não termina com oferta' }] });
ok(r.salvou.some(x => /perfil/.test(x)) && H.sheets.perfil.rows.some(l => /Nunca terminar com oferta/.test(l[1])), 'PERFIL gravado: ' + r.salvou.join(','));
// 5) BASE com CPF não entra
H.setFetch(() => resp('[[BASE: Cliente João || CPF 123.456.789-00]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'x' }] });
ok(!H.sheets.base.rows.some(l => /123\.456/.test(l[1])), 'BASE bloqueia dado sensível');

// 6) feedback 👍 só registra; 👎 com reclamação vira aprendizado
r = H.post({ pin: '1234', acao: 'feedback', nota: 'up', chatId: 'abc', resposta: 'oi', cerebro: 'Gemini' });
ok(r.ok && H.sheets.feedback.rows.length === 2 && H.sheets.feedback.rows[1][2] === '👍' && !r.salvou.includes('aprendizado'), 'feedback 👍 registra sem aprendizado');
const aprAntes = H.sheets.aprendizados.rows.length;
r = H.post({ pin: '1234', acao: 'feedback', nota: 'down', chatId: 'abc', comentario: 'não era pra sugerir extras no final', resposta: 'Resposta longa... Quer que eu faça mais?', cerebro: 'PC (zicoai)' });
ok(r.ok && r.salvou.includes('aprendizado') && H.sheets.aprendizados.rows.length === aprAntes + 1 && H.sheets.aprendizados.rows[aprAntes][3] === 'feedback', 'feedback 👎 vira aprendizado');
r = H.post({ pin: '1234', acao: 'feedback', nota: 'down', chatId: 'abc', comentario: 'ruim', resposta: 'x' });
ok(r.ok && !r.salvou.includes('aprendizado'), 'reclamação curta demais não vira aprendizado');

// 7) compactação: conversa com 24+ mensagens gera resumo; resumo entra no sistema
H.fetchLog.length = 0;
let chamadas = [];
H.setFetch((u, o) => { const b = JSON.parse(o.payload); chamadas.push(b); return resp(/Resuma a conversa/.test(b.messages[0].content) ? 'RESUMO: Thiago pediu app de tarefas, decidiu modo escuro.' : 'ok'); });
let cid = null;
for (let i = 0; i < 12; i++) {
  r = H.post({ pin: '1234', acao: 'chat', chatId: cid || undefined, mensagens: [{ role: 'user', content: 'mensagem ' + i }] });
  cid = r.chatId;
}
const chatRow = H.sheets.chats.rows.find(l => l[0] === cid);
ok(chatRow && /RESUMO: Thiago pediu/.test(chatRow[5] || '') && Number(chatRow[6]) === 14, 'resumo gravado na aba chats após 24 msgs: resumidoAte=' + (chatRow && chatRow[6]));
ok(chamadas.some(b => /Resuma a conversa/.test(b.messages[0].content)), 'chamou o resumidor');
chamadas = [];
r = H.post({ pin: '1234', acao: 'chat', chatId: cid, mensagens: [{ role: 'user', content: 'e aí?' }] });
ok(/RESUMO DO COMEÇO DESTA CONVERSA/.test(chamadas[0].messages[0].content) && /Thiago pediu app/.test(chamadas[0].messages[0].content), 'resumo vai no sistema da próxima resposta');
ok(r.passos.some(p => /resumo da conversa/.test(p)), 'passo "Leu o resumo"');
chamadas = [];
r = H.post({ pin: '1234', acao: 'chat', chatId: cid, mensagens: [{ role: 'user', content: 'outra' }] });
ok(!chamadas.some(b => /Resuma a conversa/.test(b.messages[0].content)), 'não resume de novo antes de +20 mensagens');

// 8) Cerebras só entra com chave; código usa reasoning high no gpt-oss
H.fetchLog.length = 0; H.setFetch(() => resp('código'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(!H.fetchLog.some(f => f.u.includes('cerebras')) && H.fetchLog[0].body.reasoning_effort === 'high', 'sem CEREBRAS_KEY não chama Cerebras; groq gpt-oss com reasoning high');
H.PROPS.CEREBRAS_KEY = 'c'; H.fetchLog.length = 0;
H.setFetch(u => u.includes('groq') ? cai(429, '{"error":{"message":"limite"}}') : resp('código cerebras'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(r.cerebro === 'Cerebras GPT-OSS 120B' && H.fetchLog[1].u.includes('cerebras') && H.fetchLog[1].h.Authorization === 'Bearer c', 'groq estourou → Cerebras responde: ' + r.cerebro);
H.fetchLog.length = 0; H.setFetch(() => resp('texto'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem' }] });
ok(!('reasoning_effort' in H.fetchLog[0].body), 'texto normal sem reasoning_effort');
// 9) PC de código: PC_MODELO_CODIGO só em programação
H.PROPS.PC_URL = 'https://desk.ts.net/zz/'; H.PROPS.PC_MODELO_CODIGO = 'zicoai-dev'; delete H.CACHE.pc_off;
H.fetchLog.length = 0; H.setFetch(u => resp(u.includes('ts.net') ? 'pc' : 'nuvem'));
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'pc', mensagens: [{ role: 'user', content: 'faz um código html' }] });
ok(H.fetchLog[0].body.model === 'zicoai-dev' && r.cerebro === 'PC (zicoai-dev)', 'código no PC usa zicoai-dev');
H.fetchLog.length = 0;
r = H.post({ pin: '1234', acao: 'chat', cerebro: 'pc', mensagens: [{ role: 'user', content: 'oi' }] });
ok(H.fetchLog[0].body.model === 'zicoai', 'texto no PC usa zicoai');

// 10) prova: responde, corrige, grava nota e aprendizado quando < 7,5
H.sheets.prova = null;
const prova = H.ctx.aba('prova');
prova.appendRow([1, 'Preço', 'Quanto tá o iPhone 13?', 'Não inventa preço | Diz que confirma | Curto | Sem oferta', 'Inventar preço', '', '', '']);
prova.appendRow([16, 'Código', "MSG 1: faz um app com id='nome' || MSG 2 (mesma conversa): corrige o id", 'Usa nome | HTML completo | Salva | Explica', 'Repetir id errado', '', '', '']);
let vezes = 0;
H.setFetch((u, o) => {
  const b = JSON.parse(o.payload);
  if (/corrige a prova/.test(b.messages[0].content)) { vezes++; return resp(vezes === 1 ? '{"nota": 5, "faltou": "inventou preço"}' : '```json\n{"nota": 10, "faltou": ""}\n```'); }
  return resp('resposta da zicoai');
});
const aprAntes2 = H.sheets.aprendizados.rows.length;
H.ctx.rodarProva();
ok(Number(prova.rows[1][5]) === 5 && Number(prova.rows[2][5]) === 10 && prova.rows[1][6], 'notas gravadas na aba prova: ' + prova.rows[1][5] + ', ' + prova.rows[2][5]);
ok(H.sheets.aprendizados.rows.length === aprAntes2 + 1 && /Prova 1/.test(H.sheets.aprendizados.rows[aprAntes2][1]), 'nota baixa virou aprendizado');
ok(H.sheets.memoria.rows.some(l => /Prova semanal/.test(l[1]) && /média 7\.5/.test(l[1])), 'média gravada na memória');
H.ctx.ligarProva();
// 11) histórico via API
r = H.post({ pin: '1234', acao: 'historico' });
ok(r.ok && r.historico.length >= 3, 'ação historico lista mudanças');
