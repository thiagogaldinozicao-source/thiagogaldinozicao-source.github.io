// Fase 1: tabela de preços, busca por significado, modo cliente
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
let sys = '';
// embeddings: vetor fake por palavras-chave (pra testar o fluxo sem rede)
const vet = t => { t = String(t).toLowerCase(); return [/(quente|esquent|aquec)/.test(t) ? 1 : 0, /(bateria|carreg)/.test(t) ? 1 : 0, /(tela|vidro)/.test(t) ? 1 : 0, 0.1]; };
let embedChamadas = 0;
H.setFetch((u, o) => {
  const b = JSON.parse(o.payload);
  if (/batchEmbedContents/.test(u)) { embedChamadas++; return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ embeddings: b.requests.map(r => ({ values: vet(r.content.parts[0].text) })) }) }; }
  sys = b.messages[0].content; return resp('ok');
});
// 1) tabela vazia + pergunta de preço → aviso de vazia
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto tá o iphone 15?' }] });
ok(/TABELA DE PREÇOS\n\(VAZIA/.test(sys), 'tabela vazia avisa pra não dar preço');
// 2) com tabela: só as linhas do produto citado
const pr = H.ctx.aba('precos');
pr.appendRow(['iPhone 15', 'novo', '128GB', 'preto', '4.299', '5.159', 2, '']);
pr.appendRow(['iPhone 13', 'seminovo', '128GB', 'azul', '2.499', '', 1, 'bateria 89%']);
pr.appendRow(['TV Box Izy Play', 'novo', '', '', '249', '299', 5, '']);
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto tá o iphone 15?' }] });
ok(/### TABELA DE PREÇOS/.test(sys) && /iPhone 15 novo 128GB preto: Pix R\$ 4\.299 \| 12x R\$ 5\.159 \| estoque 2/.test(sys) && !/TV Box Izy Play/.test(sys), 'tabela traz só o produto perguntado');
ok(r.passos.some(p => /Consultou a tabela de preços \(1 itens\)/.test(p)), 'passo da tabela');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'me manda a tabela de preços' }] });
ok(/iPhone 15/.test(sys) && /iPhone 13/.test(sys) && /TV Box/.test(sys), 'pedido de tabela traz tudo');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um código html de calculadora' }] });
ok(!/### TABELA DE PREÇOS/.test(sys), 'pergunta sem preço não carrega a tabela');
// 3) modo cliente: perfil pessoal some, tabela entra, seção MODO CLIENTE
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'responde pro cliente que perguntou se tem iphone 13' }] });
ok(/### MODO CLIENTE/.test(sys) && /iPhone 13 seminovo/.test(sys), 'modo cliente ativo com tabela');
ok(!/\[Cálculo\]/.test(sys) && /\[Como responder\]/.test(sys) && /\[Loja\]/.test(sys), 'modo cliente esconde perfil pessoal (cálculo) e mantém "como responder" e "loja"');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'como tá o italo hoje?' }] });
ok(!/### MODO CLIENTE/.test(sys) && /\[Cálculo\]/.test(sys), 'pergunta pessoal mantém perfil inteiro');
// 4) busca por significado: base tem "superaquecimento", pergunta fala "esquentando"
H.sheets.base.rows.push(['Aquecimento do iPhone', 'Superaquecimento costuma ser capinha grossa ou bateria velha; testar sem capinha antes de trocar bateria']);
H.sheets.base.rows.push(['Película', 'Película 3D cobre a borda inteira do vidro']);
embedChamadas = 0; delete H.CACHE.embed_off;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'meu celular tá esquentando muito, o que pode ser?' }] });
ok(/Superaquecimento costuma ser capinha grossa/.test(sys), 'achou por significado o trecho que a palavra não acha');
ok(r.passos.some(p => /por significado/.test(p)) && r.passos.some(p => /Memorizou o significado/.test(p)), 'passos de embedding: ' + r.passos.filter(p => /signific/.test(p)).join(' | '));
ok(H.sheets.vetores && H.sheets.vetores.rows.length > 3, 'vetores guardados na aba vetores: ' + (H.sheets.vetores.rows.length - 1));
const antesEmbed = embedChamadas; embedChamadas = 0;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'tá esquentando de novo' }] });
ok(embedChamadas === 1, 'segunda vez só embute a pergunta (1 chamada), vetores vieram do cache: ' + embedChamadas);
ok(!/Película 3D cobre/.test(sys), 'trecho sem relação não entra');
// 5) embedding fora do ar → segue só por palavra, sem erro
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (/batchEmbedContents/.test(u)) return { getResponseCode: () => 500, getContentText: () => 'x' }; sys = b.messages[0].content; return resp('ok'); });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'qual a bateria do iPhone 17 Pro Max?' }] });
ok(r.ok && /17 Pro Max/.test(sys), 'sem embedding continua funcionando por palavra');
