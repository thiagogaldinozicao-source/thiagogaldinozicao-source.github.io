// v67: navegador PRÓPRIO da ZicoAI (Chrome dela no Mac): web_* pela ponte, print ao vivo no app, mesmas travas
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k'; H.PROPS.PONTE_SEGREDO_MAC = 'smac';
run(`ponteSemDetalhe = function(acao, d, espera, disp){
  globalThis.__ult = { acao: acao, d: d, disp: disp };
  if (acao !== 'navegador' || disp !== 'mac') throw new Error('ponte errada');
  var base = { ok: true, titulo: 'Calculadora 3D', url: 'https://thiago.github.io/calc/', tela: 'QUJD' };
  if (d.op === 'pesquisar') return Object.assign(base, { titulo: 'iphone 17 preço - Google', texto: 'iPhone 17 a partir de...', links: [{ texto: 'Apple', href: 'https://apple.com/br' }] });
  if (d.op === 'ler') return Object.assign(base, { texto: 'Calculadora', controles: [{ tipo: 'botão', texto: 'Comprar', seletor: '#c', precisaOk: true }, { tipo: 'campo senha', texto: 'Senha', seletor: '#s', protegido: true }] });
  if (d.op === 'recarregar') return Object.assign(base, { erros: ['JavaScript: calc is not defined'], rede: ['404 · https://thiago.github.io/calc/app.js'] });
  if (d.op === 'clicar') return d.confirmado ? Object.assign(base, { clicou: d.texto }) : { ok: false, erro: 'precisa do OK do Thiago', motivo: 'botão "Comprar" envia/compra/apaga/confirma' };
  return base;
};`);
// v74: ela só usa o navegador quando o Thiago pede → os pedidos daqui falam do navegador
const F = n => (a, ctx) => run('FERRAMENTAS.' + n + '.run(' + JSON.stringify(a || {}) + ', ' + JSON.stringify(Object.assign({}, ctx || {}, { pedido: 'no navegador: ' + ((ctx && ctx.pedido) || '') })) + ')');
let t = F('web_pesquisar')({ texto: 'iphone 17 preço' });
ok(/RESULTADOS[\s\S]*iPhone 17[\s\S]*apple\.com\/br/.test(t) && run('__ult.disp') === 'mac', 'web_pesquisar vai pro navegador do Mac e devolve resultados + links');
ok(!/QUJD/.test(t), 'o print não vai pro texto do agente (só pro app)');
const tela = JSON.parse(run('CacheService.getScriptCache().get("tela_vivo_geral")'));
ok(tela && tela.img === 'QUJD' && tela.acao === 'pesquisar', 'print guardado pro app mostrar ao vivo');
t = F('web_ler')({});
ok(/\[precisa OK\]/.test(t) && /\[protegido\]/.test(t), 'web_ler marca botão perigoso e campo protegido');
t = F('web_erros')({ recarregar: true });
ok(/calc is not defined/.test(t) && /404/.test(t) && run('__ult.d.op') === 'recarregar', 'web_erros recarregar:true traz erro de JS e rede (depurar app)');
t = F('web_clicar')({ texto: 'Comprar', confirmado: true }, { pedido: 'vê a calculadora' });
ok(/ERRO: precisa do OK do Thiago/.test(t) && /Pergunte pro Thiago/.test(t), 'clicar Comprar sem OK escrito do Thiago: recusa e manda perguntar');
ok(run('__ult.d.confirmado') === false, 'confirmado:true do agente sozinho não vale');
// detalhe técnico não guarda o base64
const det = JSON.stringify(run('DETALHES'));
ok(!/QUJD/.test(det) && /print da tela/.test(det), '"Solicitação/Resposta" mostra "(print da tela)" no lugar da imagem');
const tela2 = JSON.parse(run('CacheService.getScriptCache().get("tela_vivo_geral")'));
// ao vivo: aoVivo e telaVivo só mandam o print quando é novo
let r = H.post({ pin: '1234', acao: 'aoVivo', reqId: 'abc', desde: 0 });
ok(r.ok && r.tela && r.tela.img === 'QUJD', 'aoVivo leva o print do navegador');
r = H.post({ pin: '1234', acao: 'aoVivo', reqId: 'abc', desde: tela2.quando + 1 });
ok(r.ok && r.tela === null, 'print que o app já viu não é mandado de novo (economiza dados)');
r = H.post({ pin: '1234', acao: 'telaVivo', desde: 0 });
ok(r.ok && r.tela && /Calculadora/.test(r.tela.titulo), 'telaVivo (agente rodando) devolve o print com título');
ok(H.post({ acao: 'telaVivo' }).ok === false, 'telaVivo exige PIN');
// travas compartilhadas: implantar/deploy precisa de OK
const S = require('../../extensao/seguranca.js');
ok(S.botaoPerigoso({ texto: 'Implantar' }) && S.botaoPerigoso({ texto: 'Deploy' }), 'botão Implantar/Deploy precisa do OK do Thiago');
ok(!S.botaoPerigoso({ texto: 'Ver fotos' }), 'botão comum continua livre');
// regras
ok(/NAVEGADOR PRÓPRIO \(web_\*\)[\s\S]*Chrome do Thiago \(nav_\*\)/.test(run('PROMPT_AGENTE')), 'agente sabe quando usar o navegador dela e quando o Chrome do Thiago');
ok(/SEU navegador[\s\S]{0,400}web_\*/.test(run('PERSONA')), 'chat manda "pesquisa no seu navegador" pro agente com web_*');
ok(/versão (6[7-9]|[7-9]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 67 ou mais nova');
// extensão 2.6: cada aba do Chrome tem a sua ZicoAI: o chat lê a aba DO PAINEL, não a que estiver na frente
run('CacheService.getScriptCache().put("ponte_visto_nav", String(Date.now()))');
run('ponteSemDetalhe = function(acao, d, espera, disp){ if (disp === "nav" && acao === "ler") { globalThis.__lido = d; return {ok:true, abaId: d.abaId, titulo:"Loja", url:"https://loja.exemplo/", texto:"produto"}; } throw new Error("x"); };');
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', capricho: false, naExtensao: true, abaId: 77, mensagens: [{ role: 'user', content: 'o que tem nessa página?' }] });
ok(r.ok && run('__lido && __lido.abaId') === 77, 'painel da aba 77 lê a aba 77');
r = H.post({ pin: '1234', acao: 'chat', capricho: false, naExtensao: true, mensagens: [{ role: 'user', content: 'o que tem nessa página?' }] });
ok(r.ok && run('__lido.abaId') === undefined, 'sem aba (app normal): lê a aba que está na frente');
const fs = require('fs'), dirE = __dirname + '/../../extensao/';
const fundo = fs.readFileSync(dirE + 'fundo.js', 'utf8'), painel = fs.readFileSync(dirE + 'painel.js', 'utf8'), app = fs.readFileSync(__dirname + '/../../index.html', 'utf8');
ok(/sidePanel\.setOptions\(\{ tabId: aba\.id, path: 'painel\.html\?aba=' \+ aba\.id/.test(fundo) && /setOptions\(\{ enabled: false \}\)/.test(fundo), 'ícone abre um painel SÓ daquela aba (painel global desligado)');
ok(/&aba=/.test(painel) && /'atual_aba_' \+ ABA_EXT/.test(app) && /abaId: ABA_EXT/.test(app), 'cada aba guarda a sua conversa e manda o abaId pro cérebro');
