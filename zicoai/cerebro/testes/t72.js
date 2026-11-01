// v94: extensão em 2 computadores (o Chrome do Mac de casa pegava o pedido do Chrome do outro Mac: "No tab with id");
// senha/usuário de cliente da conversa do WhatsApp não vai pra nuvem; WhatsApp colado com "app" não vira "programação".
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PONTE_SEGREDO_NAV = 'segnav';
const C = H.CACHE;
// fila com pedido de dois Chromes
C.ponte_visto_nav = String(run('Date.now()'));
run(`ponteFila(function(f){ f.push({ id: 'pA', acao: 'ler', dados: {}, ate: Date.now() + 60000, nav: 'casa1' }); f.push({ id: 'pB', acao: 'ler', dados: {}, ate: Date.now() + 60000, nav: 'loja2' }); f.push({ id: 'pC', acao: 'abas', dados: {}, ate: Date.now() + 60000 }); }, 'nav')`);
const b1 = H.post({ acao: 'ponteBuscar', segredo: 'segnav', versao: 'nav-2.7', navId: 'loja2' });
ok(b1.ok && b1.pedidos.map(p => p.id).join() === 'pB,pC', 'Chrome da loja pega só o dele (+ o sem dono): ' + b1.pedidos.map(p => p.id).join());
const b2 = H.post({ acao: 'ponteBuscar', segredo: 'segnav', versao: 'nav-2.7', navId: 'casa1' });
ok(b2.ok && b2.pedidos.map(p => p.id).join() === 'pA', 'Chrome de casa pega o pedido dele');
ok(C.ponte_visto_nav_loja2 && C.ponte_visto_nav_casa1, 'cada Chrome bate o próprio ponto');
// pedido com navId de um Chrome que sumiu há 2 min: avisa em vez de mandar pro outro
C.ponte_visto_nav_loja2 = String(run('Date.now()') - 120000); C.ponte_visto_nav = String(run('Date.now()'));
let erro = '';
try { run(`NAV_ATUAL = 'loja2'; ponteSemDetalhe('abas', {}, 1500, 'nav')`); } catch (e) { erro = String(e.message || e); }
run("NAV_ATUAL = ''");
ok(/extensão do Chrome deste computador não está conectada/.test(erro), 'Chrome que pediu está desligado: avisa (não manda pro outro)');
// tarefa carrega o Chrome que pediu
run("aba('tarefas')");
run(`NAV_ATUAL = 'loja2'; ABA_ATUAL = 922633781; criarTarefa('lê a imagem do whatsapp e manda o MAC', 'c1', 'app'); NAV_ATUAL = ''; ABA_ATUAL = 0;`);
ok(/\[nav:loja2\]/.test(H.sheets.tarefas.rows[H.sheets.tarefas.rows.length - 1][3]), 'tarefa guarda de qual Chrome veio');
// senha e usuário de cliente escondidos
const t = run(`esconderPessoal("Username: zdr88647\\nPassword: psf87971\\nConexões: 1\\nMAC 63:2a:00:0a:57:19")`);
ok(!/zdr88647|psf87971/.test(t) && /63:2a:00:0a:57:19/.test(t), 'usuário e senha da lista do cliente viram •••, o MAC fica');
ok(!/PIN errado/.test(run(`esconderPessoal("PIN errado")`)) === false, '"PIN errado" não é mexido');
// WhatsApp colado com "o app é ótimo" não é programação
ok(run(`ehProgramacao("oquer falo pra ele\\n\\n---\\nPÁGINA ABERTA NO CHROME: WhatsApp\\no app e otimo recomendo demais")`) === false, 'conversa do WhatsApp com "app" não vira pedido de programação');
ok(run(`ehProgramacao("arruma o bug do meu app")`) === true, 'pedido de programação de verdade continua');
ok(/versão (9[4-9])/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 94 ou mais nova');
// v98: sem a muleta "Vc tem razão:" no começo
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Vc tem razão: faltou dividir pelas pessoas.' } }] }), getHeaders: () => ({}) }));
const rr = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'quanto é 10% de 200?' }] });
ok(rr.ok && /^Faltou dividir pelas pessoas\./.test(rr.resposta), 'resposta sem "Vc tem razão:" no começo: ' + String(rr.resposta).slice(0, 40));
