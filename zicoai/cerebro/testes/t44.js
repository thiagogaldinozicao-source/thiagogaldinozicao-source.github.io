// v58: destilação (resposta da nuvem vira aula do Mac), placar Mac × nuvem por tipo, Mac primeiro onde ganhou, diagnóstico
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k'; H.PROPS.GROQ_KEY = 'g';
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Garantia de seminovo é da loja.' } }] }) }));
let r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'qual a garantia do seminovo?' }] });
const d = H.sheets.destilacao;
ok(r.ok && d && d.rows.length === 2 && d.rows[1][1] === 'qual a garantia do seminovo?' && d.rows[1][6] === 'ok' && d.rows[1][5] === 'loja', 'resposta da nuvem entra na destilação (tipo loja, status ok)');
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'bom dia' }] });
ok(d.rows.length === 2, 'conversa à toa não entra');
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'o CPF dele é 123.456.789-09, anota' }] });
ok(!d.rows.some(l => /123\.456/.test(l.join('|'))), 'dado de cliente (CPF) nunca entra');
H.post({ pin: '1234', acao: 'feedback', nota: 'down', chatId: 'c', comentario: 'resposta errada demais', resposta: 'Garantia de seminovo é da loja.', cerebro: 'Gemini' });
ok(d.rows[1][6] === 'reclamada', '👎 marca como reclamada (não vai pro treino)');
// placar: Mac × nuvem, juiz às cegas
H.PROPS.PONTE_SEGREDO_MAC = 'sm';
run('CacheService.getScriptCache().put("ponte_visto_mac", String(Date.now()))');
for (let i = 0; i < 4; i++) d.rows.push(["'2026-10-30 10:00", 'quanto fica 1000 em 12x no cartão ' + i, '', 'Fica 12x de 100.', 'Gemini', 'preço', 'aprovada']);
run('ponteSemDetalhe = function(acao){ return {ok:true, texto:"Fica 12x de R$ 100."}; };');
H.setFetch((u, o) => { const b = JSON.parse(o.payload); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '{"melhor":"empate","motivo":"iguais"}' } }] }) }; });
let p;
const limpa = () => Object.keys(H.CACHE).forEach(k => { if (/^(tk|rq|off)_/.test(k)) delete H.CACHE[k]; });
for (let i = 0; i < 3; i++) { limpa(); p = run('placarMacRodada("preço")'); }
ok(p.ok && p.acumulado.e === 9 && p.decisao === 'MAC PRIMEIRO', 'empate em 9 provas de preço: Mac vira o primeiro em preço (' + JSON.stringify(p.acumulado) + ')');
ok(H.PROPS.MAC_PRIMARIO === 'preço' && H.sheets.placar_mac.rows.length === 4, 'decisão gravada (MAC_PRIMARIO e aba placar_mac)');
// rota: preço vai pro Mac primeiro
let usados = []; limpa();
run('ponteSemDetalhe = function(acao){ return {ok:true, texto:"Fica 10x de R$ 120."}; };');
H.setFetch((u) => { usados.push(u); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'nuvem' } }] }) }; });
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'quanto fica 1200 em 10x no cartão' }] });
ok(r.ok && /Mac/.test(r.cerebro) && r.passos.some(x => /cérebro do Mac já ganhou/.test(x)), 'pedido de preço: o Mac responde primeiro (' + r.cerebro + ')');
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'me conta uma curiosidade sobre o espaço' }] });
ok(!/Mac/.test(r.cerebro), 'assunto em que o Mac não provou: segue a nuvem');
// nuvem passa a ganhar → volta
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '{"melhor":"' + (Math.random() < 2 ? 'X' : '') + '"}' } }] }) }));
run('Math.random = function(){ return 0.9; };');   // Mac fica como B
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '{"melhor":"A","motivo":"nuvem melhor"}' } }] }) }));
for (let i = 0; i < 6; i++) { limpa(); p = run('placarMacRodada("preço")'); }
ok(H.sheets.placar_mac.rows.some(l => l[6] === 'voltou pra nuvem') && H.PROPS.MAC_PRIMARIO === '', 'Mac piorou no placar: preço volta pra nuvem sozinho');
ok(/diagnostico/.test(run('FERRAMENTAS.mac_comando.desc')) && /diagnostico/.test(run('FERRAMENTAS.pc_comando.desc')), 'ferramentas de diagnóstico do Mac e do PC');
ok(/versão 5[89]/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 58');
