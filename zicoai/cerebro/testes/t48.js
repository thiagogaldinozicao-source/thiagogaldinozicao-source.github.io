// v69: testa antes de entregar — contas refeitas, links abertos, app testado antes de publicar
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k';
const cc = t => run('PASSOS = []; conferirContas(' + JSON.stringify(t) + ')');
ok(run('numeroBR("R$ 1.234,56")') === 1234.56 && run('numeroBR("1.800")') === 1800 && run('numeroBR("99.9")') === 99.9, 'lê número do jeito brasileiro');
let t = cc('Fica 12x de R$ 150,00 = R$ 1.700,00 no cartão');
ok(/12x de R\$ 150,00 = R\$ 1\.800,00/.test(t) && /corrigiu 1/.test(run('PASSOS.join("|")')), 'parcela errada corrigida: ' + t);
t = cc('Total: 1.200 + 350 = 1.500 e 10% de R$ 1.500 = R$ 150,00');
ok(/1\.200 \+ 350 = 1\.550/.test(t) && /R\$ 150,00/.test(t), 'soma errada corrigida, porcentagem certa mantida: ' + t);
t = cc('3.999 x 1,08 = 4.318,92');
ok(t === '3.999 x 1,08 = 4.318,92' && /todas certas/.test(run('PASSOS.join("|")')), 'conta certa não muda e o passo diz que conferiu');
t = cc('1200 / 7 = 171,43 por mês');
ok(/171,43/.test(t), 'arredondamento de centavo aceito');
t = cc('```js\nconst x = 2 + 2 = 5\n```\nfora: 2 + 2 = 5');
ok(/const x = 2 \+ 2 = 5/.test(t) && /fora: 2 \+ 2 = 4/.test(t), 'código fica de fora; texto pra cliente/explicação é conferido');
t = cc('```\nOi! Fica 10x de R$ 99,90 = R$ 990,00 kkk\n```');
ok(/R\$ 999,00/.test(t), 'conta dentro do texto pra cliente também é conferida: ' + t);
ok(cc('dia 31/10 = sábado') === 'dia 31/10 = sábado', 'data não vira conta');
// links
H.setFetch(u => ({ getResponseCode: () => /quebrado/.test(u) ? 404 : 200, getContentText: () => 'ok' }));
t = run('PASSOS = []; conferirLinks(' + JSON.stringify('Veja [Apple](https://apple.com/br) e https://site-quebrado.com/x. ![img](https://image.pollinations.ai/a)') + ')');
ok(/site-quebrado\.com\/x ⚠️/.test(t) && !/apple\.com\/br\) ⚠️/.test(t) && /Link que não abre/.test(run('PASSOS.join("|")')), 'link quebrado ganha ⚠️, bom fica, imagem não é testada: ' + t);
// chat: tudo junto na resposta gravada
H.setFetch((u, o) => { const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; if (b.messages) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '```\nFica 12x de R$ 150,00 = R$ 1.700,00\n```' } }] }) }; return { getResponseCode: () => 200, getContentText: () => '' }; });
const r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'quanto fica 12x de 150?' }] });
ok(r.ok && /R\$ 1\.800,00/.test(r.resposta) && r.passos.some(p => /Conferiu as contas/.test(p)), 'chat entrega a conta já conferida');
// publicar_app testa antes
let publicou = false;
run('publicarApp = function(){ globalThis.__pub = true; return {ok:true, url:"https://x/apps/calc/"}; }; testarApp = function(h){ return /quebra/.test(h) ? {erros:["No navegador: naoExiste is not defined"], rodou:true} : {erros:[], rodou:true}; };');
let o = run('FERRAMENTAS.publicar_app.run({nome:"calc", html:"<!doctype html><button onclick=quebra()>x</button>"})');
ok(/NÃO publiquei[\s\S]*naoExiste/.test(o) && !run('globalThis.__pub'), 'app com erro não é publicado');
o = run('FERRAMENTAS.publicar_app.run({nome:"calc", html:"<!doctype html><button>ok</button>"})');
ok(/publicado em https:\/\/x\/apps\/calc\/ \(testado antes no navegador do Mac: sem erro\)/.test(o), 'app bom: testa e publica');
ok(/versão (69|[7-9]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 69 ou mais nova');
ok(cc('1.990 + 100 = 2.089') === '1.990 + 100 = 2.089' && cc('3.999 x 1,08 = 4.319') === '3.999 x 1,08 = 4.319' && cc('1.000 x 1,2 = 1.199') === '1.000 x 1,2 = 1.199', 'arredondamento da loja (tira 1 real, final 9) não é "corrigido"');
ok(/= 1\.550/.test(cc('1.200 + 350 = 1.500')), 'mas erro de verdade em valor redondo é corrigido');
