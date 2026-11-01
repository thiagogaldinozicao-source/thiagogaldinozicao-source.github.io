// v81: login por convite — cada pessoa com a própria chave, conversas e memória; sem acesso ao que é do Thiago
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
let n = 0; run('Utilities.getUuid = function(){ return "u" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2); }');
// Thiago cria os convites
let k = H.post({ pin: '1234', acao: 'convidar', nome: 'Karina', perfil: 'funcionaria' });
ok(k.ok && k.chave.length >= 40, 'Thiago gerou o convite da Karina (chave longa)');
ok(!JSON.stringify(H.sheets.pessoas.rows).includes(k.chave), 'na planilha fica só o hash, não a chave');
const amigo = H.post({ pin: '1234', acao: 'convidar', nome: 'Zé', perfil: 'convidado' });
ok(H.post({ convite: k.chave, acao: 'convidar', nome: 'X', perfil: 'socia' }).ok === false, 'Karina não consegue convidar ninguém');
ok(H.post({ pin: '1234', acao: 'convidar', nome: 'Y', perfil: 'dono' }).ok === false, 'não dá pra criar outro "dono"');
// quem sou
let q = H.post({ convite: k.chave, acao: 'quemSou' });
ok(q.ok && q.pessoa.nome === 'Karina' && q.pessoa.perfil === 'funcionaria', 'o app sabe que é a Karina');
ok(/Muitas|inválido/.test(H.post({ convite: 'x'.repeat(48), acao: 'quemSou' }).erro), 'chave errada não entra');
// coisas do Thiago bloqueadas
['memorias', 'dispositivos', 'navegar', 'publicar', 'tarefa', 'treinoResumo', 'salvar', 'projetos', 'apps'].forEach(a => ok(/não está liberado/.test(H.post({ convite: k.chave, acao: a }).erro), 'Karina sem acesso a "' + a + '"'));
// conversa da Karina: sistema sem o perfil/memória do Thiago
run("aba('perfil').appendRow(['familia', 'Thiago tem um bebê de 2 anos'])");
run("aba('memoria').appendRow(['30/10', 'Thiago gosta de café', 'pc'])");
run("aba('base').appendRow(['Horário', 'Loja abre 10h às 20h'])");
let sis = '';
H.setFetch((u, o) => { const b = JSON.parse(o.payload || '{}'); if (b.messages && b.messages[0]) sis = b.messages[0].content; return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Oi Karina! [[MEMORIA: Karina cuida do estoque]] [[BASE: Horário || abre 9h]] [[TAREFA: apagar tudo]]' } }] }), getHeaders: () => ({}) }; });
let r = H.post({ convite: k.chave, acao: 'chat', aparelho: 'iPhone Karina', mensagens: [{ role: 'user', content: 'que horas a loja abre?' }] });
ok(r.ok && r.chatId, 'Karina conversa');
ok(/QUEM ESTÁ FALANDO AGORA[\s\S]*Karina/.test(sis) && !/PERFIL DO THIAGO/.test(sis) && !/bebê/.test(sis) && !/gosta de café/.test(sis), 'ela sabe que é a Karina e NÃO recebe perfil/memória do Thiago');
ok(/10h às 20h/.test(sis), 'funcionária vê a base da loja');
ok(H.sheets.memoria.rows.some(l => l[1] === 'Karina cuida do estoque' && l[2] === 'pessoa:' + k.id), 'memória da Karina fica na conta dela');
ok(!H.sheets.base.rows.some(l => /9h/.test(l[1])) && H.sheets.historico.rows.some(l => /sugestão de Karina/.test(l[2])), 'correção da base vira sugestão pro Thiago (não muda a base)');
ok(!H.sheets.tarefas || !H.sheets.tarefas.rows.some(l => /apagar tudo/.test(l[3])), 'Karina não cria tarefa do agente');
// listas separadas
const daKarina = H.post({ convite: k.chave, acao: 'chats' }).chats.map(c => c.id);
const doThiago = H.post({ pin: '1234', acao: 'chats' }).chats.map(c => c.id);
ok(daKarina.indexOf(r.chatId) >= 0 && doThiago.indexOf(r.chatId) < 0, 'cada um vê só as próprias conversas');
ok(/não é sua/.test(H.post({ convite: amigo.chave, acao: 'abrir', chatId: r.chatId }).erro), 'o amigo não abre a conversa da Karina');
// convidado não vê a loja
H.post({ convite: amigo.chave, acao: 'chat', mensagens: [{ role: 'user', content: 'que horas a loja abre?' }] });
ok(/NÃO é da loja/.test(sis) && !/10h às 20h/.test(sis), 'amigo (convidado) não vê dado da loja');
// Thiago continua com tudo e com a memória dele só dele
H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(/PERFIL DO THIAGO/.test(sis) && /gosta de café/.test(sis) && !/Karina cuida do estoque/.test(sis), 'Thiago: perfil e memória dele, sem a memória da Karina');
// cancelar
H.post({ pin: '1234', acao: 'cancelarConvite', id: k.id });
ok(/inválido ou cancelado/.test(H.post({ convite: k.chave, acao: 'quemSou' }).erro), 'convite cancelado para de funcionar na hora');
ok(/versão (8[1-9]|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 81 ou mais nova');
