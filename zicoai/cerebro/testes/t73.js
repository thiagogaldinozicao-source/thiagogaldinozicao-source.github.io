// v95: pelo painel da extensão, "lê a imagem manda o mac" pega a IMAGEM de verdade da página (ou o print da aba) e lê,
// sem pedir pro Thiago mandar print; o agente ganhou nav_imagens.
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const FOTO = 'data:image/jpeg;base64,' + 'B'.repeat(4000);
run(`var _pedidos = []; ponte = function(acao, d){ _pedidos.push(acao);
  if (acao === 'ler') return { ok: true, abaId: 77, titulo: 'WhatsApp', url: 'https://web.whatsapp.com/', texto: 'Fran Melo: Username: zdr88647 Password: psf87971 ... 63:2a:00:0a:57:19' };
  if (acao === 'imagens') return { ok: true, abaId: 77, titulo: 'WhatsApp', total: 3, imagens: _imgs };
  if (acao === 'print') return { ok: true, abaId: 77, mime: 'image/jpeg', base64: 'Q'.repeat(3000), largura: 1280, altura: 800 };
  return { ok: true }; }; var _imgs = [{ largura: 900, altura: 1600, dataUrl: ${JSON.stringify(FOTO)} }];`);
H.PROPS.PONTE_SEGREDO_NAV = 'segnav';
const vivo = () => { H.CACHE.ponte_visto_nav = String(run('Date.now()')); };
let corpo = null;
H.setFetch((u, o) => { try { corpo = JSON.parse(o.payload); } catch (e) {} return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '```\nMAC: 63:2A:00:0A:57:19\n```' } }] }), getHeaders: () => ({}) }; });
vivo(); let r = H.post({ pin: '1234', acao: 'chat', aparelho: 'app', naExtensao: true, abaId: 77, navId: 'loja2', mensagens: [{ role: 'user', content: 'le a imagem manda o mac' }] });
const temImg = JSON.stringify(corpo).indexOf('BBBB') >= 0;
ok(r.ok && run('_pedidos.join()').indexOf('imagens') >= 0 && r.passos.some(p => /Pegou a imagem que está na página \(900x1600\)/.test(p)), 'pegou a imagem da página sozinha');
ok(temImg, 'a imagem foi junto pro cérebro que enxerga');
ok(!/zdr88647|psf87971/.test(JSON.stringify(corpo)), 'senha/usuário do cliente da página não foram pra nuvem');
ok(/NUNCA peça pro Thiago tocar em .{0,3}Usar esta página/.test(JSON.stringify(corpo)), 'regra: não pede print nem "Usar esta página"');
// sem imagem legível na página: tira o print da aba
run('_imgs = [{ erro: "imagem protegida" }]; _pedidos = [];'); vivo();
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'app', naExtensao: true, abaId: 77, mensagens: [{ role: 'user', content: 'o que tem nessa foto?' }] });
ok(run('_pedidos.join()').indexOf('print') >= 0 && r.passos.some(p => /Tirou print da aba do Chrome/.test(p)) && JSON.stringify(corpo).indexOf('QQQQ') >= 0, 'sem imagem legível: tira print da aba e manda');
// pergunta normal na extensão não pega imagem
run('_pedidos = [];'); vivo();
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'app', naExtensao: true, abaId: 77, mensagens: [{ role: 'user', content: 'quanto custa o frete pra BH?' }] });
ok(run('_pedidos.join()').indexOf('imagens') < 0, 'pergunta sem imagem não tira print à toa');
ok(run('typeof FERRAMENTAS.nav_imagens.run') === 'function', 'agente tem nav_imagens');
ok(/versão (1\d\d|9[5-9])/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 95 ou mais nova');
