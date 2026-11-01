// v91: (1) um pedido por vez em cada conversa; (2) rascunho estragado (outro app no lugar) volta pro original;
// (3) programadora nunca troca o app por um arquivo inteiro menor — o caso real de 01/11 12:22 (calculadora 116 mil → "Orçamento" 29 mil).
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const ORIG = '<!doctype html>\n<html><head><title>Calculadora</title></head><body>\n' + '<div class="k">tecla</div>\n'.repeat(400) + '<table id="pTab"><tr data-n="12"><td>12×</td><td>R$ 83,33</td></tr></table>\n</body></html>';
const FALSO = '<!doctype html>\n<html><body><div id="orcItems"></div><button>Orçamento</button></body></html>';
run(`var _rasc = {}; guardarRascunho_ = function(c, s, h){ _rasc[c] = { slug: s, html: h }; }; lerRascunho_ = function(c){ return _rasc[c] || null; };
codigoDoApp = function(s){ return s === 'repo:Calculadora-do-zicao' ? ${JSON.stringify(ORIG)} : null; };
ponte = function(acao, d){ return acao === 'testar_html' ? { erros: [], avisos: [], botoesTestados: 3, provas: [] } : {}; };`);
let resposta = 'ok';
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: resposta } }] }), getHeaders: () => ({}) }));

// 1) trava: pedido rodando nesta conversa → o 2º espera
let r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'oi' }] });
const cid = r.chatId;
H.CACHE['chat_rodando_' + cid] = String(run('Date.now()') - 30000);
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', chatId: cid, mensagens: [{ role: 'user', content: 'corrige' }] });
ok(!r.ok && r.ocupada && /Ainda tô trabalhando no seu pedido anterior/.test(r.erro), 'pedido rodando na conversa: o 2º não começa junto');
H.CACHE['chat_rodando_' + cid] = String(run('Date.now()') - 500000);
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', chatId: cid, mensagens: [{ role: 'user', content: 'e agora?' }] });
ok(r.ok && !H.CACHE['chat_rodando_' + cid], 'trava velha (Google já matou o pedido) não prende; e solta no fim');
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'outra conversa' }] });
ok(r.ok, 'conversa nova não trava');

// 2) rascunho estragado volta pro original
run(`_rasc[${JSON.stringify(cid)}] = { slug: 'repo:Calculadora-do-zicao', html: ${JSON.stringify(FALSO)} };`);
resposta = 'Mudei a tabela.\n<<<<<<< ANTES\n<td>R$ 83,33</td>\n=======\n<td>1ª R$ 83,37</td>\n>>>>>>> DEPOIS';
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', chatId: cid, mensagens: [{ role: 'user', content: 'corrige a tabela nela' }] });
ok(r.passos.some(p => /rascunho desta conversa estava estragado/.test(p)), 'percebe o rascunho estragado');
ok(/1ª R\$ 83,37/.test(run(`_rasc[${JSON.stringify(cid)}].html`)) && run(`_rasc[${JSON.stringify(cid)}].html`).length > ORIG.length * 0.9, 'a mudança foi feita no app de verdade (116 mil), não no falso');

// 3) arquivo inteiro menor no lugar do app: recusado, rascunho intacto
const antes = run(`_rasc[${JSON.stringify(cid)}].html`);
resposta = '```html\n' + FALSO + '\n```';
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', chatId: cid, mensagens: [{ role: 'user', content: 'corrige' }] });
ok(/⛔ Não mexi no app/.test(r.resposta) && !/✅ Testei/.test(r.resposta), 'outro app no lugar: recusado, sem "✅ testei"');
ok(run(`_rasc[${JSON.stringify(cid)}].html`) === antes, 'rascunho continua o mesmo');
ok(/ACHE A CAUSA/.test(run('REGRA_EDICAO')), 'regra: achar onde a tela é montada antes de mudar');
ok(/versão (9[1-9])/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 91 ou mais nova');
