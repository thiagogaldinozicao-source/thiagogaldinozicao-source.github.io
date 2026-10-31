// Várias planilhas: mensagens com mais de 60 dias vão pra "ZicoAI Arquivo"; abrir e buscar continuam achando; aprender sozinha 30 min
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
H.setFetch(() => resp('ok'));
const run = c => vm.runInContext(c, H.ctx);

// sem arquivo ainda: nada muda
ok(run('linhasArquivo("mensagens")').length === 0 && !H.PROPS.PLANILHA_ZICOAI_ARQUIVO, 'sem arquivo: não cria planilha à toa');
let r = run('arquivarMensagens()');
ok(r.ok && r.movidas === 0 && !H.PROPS.PLANILHA_ZICOAI_ARQUIVO, 'nada antigo: não move nem cria planilha');

// conversa antiga (julho) + conversa nova
const chats = H.ctx.aba('chats');
chats.appendRow(['cVelha', 'Conversa de julho', "'2026-07-01 10:00:00", "'2026-07-02 10:00:00", 'iPhone']);
chats.appendRow(['cNova', 'Conversa de hoje', "'2026-10-30 11:00:00", "'2026-10-30 11:00:00", 'iPhone']);
const msg = H.ctx.aba('mensagens');
msg.rows.splice(1, 0,
  ['cVelha', "'2026-07-01 10:00:00", 'thiago', 'qual a garantia do xiaomi novo que eu vendo', '', 'iPhone', ''],
  ['cVelha', "'2026-07-01 10:00:05", 'zicoai', 'Xiaomi novo: 3 meses pela loja.', 'Gemini', 'iPhone', ''],
  ['cVelha', "'2026-07-02 09:00:00", 'thiago', 'e o realme novo tem quanto tempo de garantia', '', 'iPhone', '']);
msg.appendRow(['cNova', "'2026-10-30 11:00:00", 'thiago', 'bom dia', '', 'iPhone', '']);
const antes = msg.rows.length;

r = run('arquivarMensagens()');
ok(r.ok && r.movidas === 3, 'moveu as 3 mensagens de julho');
ok(H.PROPS.PLANILHA_ZICOAI_ARQUIVO && H.EXTRAS[H.PROPS.PLANILHA_ZICOAI_ARQUIVO], 'criou a planilha "ZicoAI Arquivo" e guardou o id');
const arq = H.EXTRAS[H.PROPS.PLANILHA_ZICOAI_ARQUIVO].sheets.mensagens;
ok(arq.rows[0][0] === 'Conversa' && arq.rows.length === 4, 'arquivo com cabeçalho + 3 mensagens');
ok(msg.rows.length === antes - 3 && !msg.rows.some(l => l[0] === 'cVelha') && msg.rows.some(l => l[0] === 'cNova'), 'principal ficou só com as novas');
ok(H.sheets.historico.rows.some(l => /3 mensagens de antes de 2026-08-31/.test(l[3])), 'histórico registra o arquivamento');

// abrir conversa antiga continua mostrando tudo; a nova não lê o arquivo
const velha = run('abrirChat("cVelha")');
ok(velha.length === 3 && /3 meses pela loja/.test(velha[1].content), 'abrir conversa antiga traz as mensagens do arquivo');
ok(!run('chatTemArquivo("cNova")') && run('abrirChat("cNova")').length === 1, 'conversa nova não abre o arquivo');

// memória episódica procura no arquivo também
const achou = run('buscarConversas("garantia do realme novo", 3)');
ok(/realme novo/.test(achou), 'buscar conversas antigas acha no arquivo');

// rodar de novo não duplica
r = run('arquivarMensagens()');
ok(r.movidas === 0 && arq.rows.length === 4, 'segunda rodada não duplica');

// aprender sozinha: troca de 10 pra 30 min uma vez só e cria o gatilho do arquivo
H.TRIGGERS.push('aprenderSozinha');
delete H.CACHE.rotinas_treino_ok;
run('garantirRotinasTreino()');
ok(H.PROPS.APRENDER_30 === '1', 'aprender sozinha passa pra 30 em 30 min');
ok(H.TRIGGERS.indexOf('aprenderSozinha') < 0, 'gatilho antigo de 10 min apagado (o novo é de 30)');
ok(String(arq.rows[1][1]).startsWith("'"), 'data vai pro arquivo como texto (não vira data do Sheets)');
