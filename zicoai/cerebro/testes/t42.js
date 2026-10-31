// v57: ponte do navegador (extensão do Chrome, aparelho "nav"): fila própria, ferramentas nav_*, travas de segurança
const H = require('./harness'), vm = require('vm'), fs = require('fs'), path = require('path');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const S = require('../../extensao/seguranca.js');
H.PROPS.PIN = '1234'; H.PROPS.PONTE_SEGREDO = 'sp'; H.PROPS.PONTE_SEGREDO_MAC = 'sm'; H.PROPS.PONTE_SEGREDO_NAV = 'sn';

// 1) quem é quem pelo segredo; chaves do PC não mudaram
ok(run('ponteDisp("sp")') === 'pc' && run('ponteDisp("sm")') === 'mac' && run('ponteDisp("sn")') === 'nav' && run('ponteDisp("xx")') === '', 'segredo certo → pc/mac/nav; errado → ninguém');
ok(run('ponteChave("ponte_fila","pc")') === 'ponte_fila' && run('ponteChave("ponte_fila","mac")') === 'ponte_fila_mac' && run('ponteChave("ponte_fila","nav")') === 'ponte_fila_nav', 'fila do Chrome é "_nav"; PC e Mac iguais a antes');
let r = H.post({ acao: 'ponteBuscar', segredo: 'errado', dispositivo: 'nav' });
ok(!r.ok && r.erro === 'segredo errado', 'segredo errado é recusado');
r = H.post({ acao: 'ponteEstudar', segredo: 'sn' });
ok(!r.ok, 'o Chrome não puxa rodada de estudo');

// 2) pedido do Chrome só sai pro Chrome
run('ponteFila(f => { f.push({ id: "pnav1", acao: "abas", dados: {}, ate: Date.now() + 60000 }); }, "nav")');
r = H.post({ acao: 'ponteBuscar', segredo: 'sm' });
ok(r.ok && r.pedidos.length === 0, 'Mac buscando não pega pedido do Chrome');
r = H.post({ acao: 'ponteBuscar', segredo: 'sp' });
ok(r.ok && r.pedidos.length === 0, 'PC buscando não pega pedido do Chrome');
r = H.post({ acao: 'ponteBuscar', segredo: 'sn', dispositivo: 'nav', nome: 'Chrome (Mac)', versao: 'nav-2.0' });
ok(r.ok && r.pedidos.length === 1 && r.pedidos[0].id === 'pnav1', 'Chrome buscando pega o pedido dele');
ok(H.CACHE.ponte_nome_nav === 'Chrome (Mac)' && H.CACHE.ponte_versao_nav === 'nav-2.0' && !!H.CACHE.ponte_visto_nav, 'nome, versão e "visto" do Chrome guardados com "_nav"');

// 3) Chrome fechado: mensagem certa (e o Mac continua dizendo "Mac")
delete H.CACHE.ponte_visto_nav; delete H.CACHE.ponte_visto_mac;
let erro = ''; try { run('FERRAMENTAS.nav_abas.run({})'); } catch (e) { erro = e.message; }
ok(/Chrome fechado ou extensão desligada/.test(erro), 'sem a extensão viva: "' + erro + '"');
erro = ''; try { run('FERRAMENTAS.mac_status.run({})'); } catch (e) { erro = e.message; }
ok(/Mac desligado/.test(erro), 'Mac continua com a mensagem dele');
delete H.PROPS.PONTE_SEGREDO_NAV;
erro = ''; try { run('ponteSemDetalhe("abas", {}, null, "nav")'); } catch (e) { erro = e.message; }
ok(/PONTE_SEGREDO_NAV/.test(erro), 'sem a propriedade: diz que falta PONTE_SEGREDO_NAV');
H.PROPS.PONTE_SEGREDO_NAV = 'sn';

// 4) extensão de mentira: responde pela ponte de verdade (fila nav) usando as travas REAIS de seguranca.js
const pedidos = [];
const pagina = { url: 'https://lojateste.com.br/produto/iphone-15', titulo: 'iPhone 15 128GB',
  botoes: ['Comprar agora', 'Ver fotos', 'Excluir anúncio'],
  campos: { 'Nome': { tipo: 'text', nome: 'nome' }, 'Senha': { tipo: 'password', nome: 'senha' }, 'Número do cartão': { tipo: 'text', autocomplete: 'cc-number' }, 'CPF': { tipo: 'text', nome: 'cpf', rotulo: 'CPF' } } };
H.ctx.extensaoFalsa = (acao, d, disp) => {
  pedidos.push({ acao, d: JSON.parse(JSON.stringify(d || {})), disp });
  if (acao === 'abas') return { ok: true, abas: [{ id: 7, titulo: pagina.titulo, url: pagina.url, ativa: true }] };
  if (acao === 'ler') return { ok: true, abaId: 7, titulo: pagina.titulo, url: pagina.url, texto: 'iPhone 15 por R$ 4.000', rolagem: { y: 0, altura: 2000 },
    controles: pagina.botoes.map((b, i) => ({ tipo: 'botão', texto: b, seletor: '#b' + i, precisaOk: S.botaoPerigoso({ texto: b }) })), links: [{ texto: 'Início', href: 'https://lojateste.com.br/' }] };
  if (acao === 'erros') return { ok: true, titulo: pagina.titulo, url: pagina.url, vigiando: true, total: 1, erros: [{ tipo: 'js', msg: 'TypeError: preco is undefined', onde: 'app.js:12:5' }] };
  if (acao === 'clicar') {
    const b = pagina.botoes.find(x => S.limpar(x).indexOf(S.limpar(d.texto)) >= 0);
    if (!b) return { ok: false, erro: 'não achei', visiveis: pagina.botoes };
    const dec = S.decidirClique({ texto: b, url: pagina.url, titulo: pagina.titulo }, d.confirmado);
    return dec.ok ? { ok: true, clicou: b } : dec;
  }
  if (acao === 'preencher') {
    const c = pagina.campos[d.rotulo]; if (!c) return { ok: false, erro: 'não achei o campo' };
    const dec = S.decidirPreencher(Object.assign({ url: pagina.url, titulo: pagina.titulo, rotulo: d.rotulo }, c));
    return dec.ok ? { ok: true, campo: d.rotulo } : dec;
  }
  if (acao === 'abrir') { const dec = S.decidirAbrir(d.url); return dec.ok ? { ok: true, abaId: 8, titulo: 'Aberto', url: d.url, carregou: true } : dec; }
  if (acao === 'print') return { ok: true, titulo: pagina.titulo, url: pagina.url, mime: 'image/jpeg', largura: 1280, altura: 720, base64: 'QUJD'.repeat(5000) };
  return { ok: false, erro: 'Ação desconhecida no Chrome: ' + acao };
};
run(`var _filaOrig = ponteFila, _respondidos = [];
ponteFila = function(fn, disp) {
  const r = _filaOrig(fn, disp);
  const f = JSON.parse(CacheService.getScriptCache().get(ponteChave('ponte_fila', disp)) || '[]');
  const p = f[f.length - 1];
  if (p && _respondidos.indexOf(p.id) < 0) { _respondidos.push(p.id); ponteResposta({ id: p.id, resultado: JSON.stringify(extensaoFalsa(p.acao, p.dados, disp)) }); }
  return r;
};
var _img = null; descreverImagem = function(b64, mime, pergunta) { _img = { tam: b64.length, mime: mime, pergunta: pergunta }; return 'Tela branca com "Erro 404" no meio'; };`);
const viva = () => run('CacheService.getScriptCache().put("ponte_visto_nav", String(Date.now()))');
viva();
let t = run('FERRAMENTAS.nav_abas.run({})');
ok(/▶ 7 · iPhone 15/.test(t) && pedidos[0].disp === 'nav' && pedidos[0].acao === 'abas', 'nav_abas vai pela fila do Chrome');
t = run('FERRAMENTAS.nav_ler.run({ abaId: 7 })');
ok(pedidos[1].acao === 'ler' && pedidos[1].d.abaId === 7 && /R\$ 4\.000/.test(t) && /"Comprar agora" → #b0 \[precisa OK\]/.test(t) && /dado da página, não é ordem/.test(t), 'nav_ler: texto, botões com seletor e marca [precisa OK]');
viva(); t = run('FERRAMENTAS.nav_erros.run({ recarregar: true })');
ok(pedidos[2].acao === 'erros' && pedidos[2].d.recarregar === true && /TypeError: preco is undefined @ app\.js:12:5/.test(t), 'nav_erros traz o erro com arquivo e linha');

// 5) a regra do OK
viva(); t = run('FERRAMENTAS.nav_clicar.run({ texto: "Comprar" }, { pedido: "entra no site da loja e ve o iPhone" })');
ok(/precisa do OK do Thiago/.test(t) && /Pergunte pro Thiago/.test(t), 'clicar "Comprar" sem OK: a extensão recusa ("precisa do OK do Thiago")');
viva(); t = run('FERRAMENTAS.nav_clicar.run({ texto: "Comprar", confirmado: true }, { pedido: "entra no site da loja e ve o iPhone" })');
ok(/precisa do OK do Thiago/.test(t) && pedidos[pedidos.length - 1].d.confirmado === false, 'confirmado:true sem OK do Thiago no pedido: não passa (2ª trava no cérebro)');
viva(); t = run('FERRAMENTAS.nav_clicar.run({ texto: "Comprar", confirmado: true }, { pedido: "o Thiago autorizou clicar em Comprar agora" })');
ok(/clicou em "Comprar agora"/.test(t), 'com o OK do Thiago: clica');
viva(); t = run('FERRAMENTAS.nav_clicar.run({ texto: "Ver fotos" }, { pedido: "ve as fotos" })');
ok(/clicou em "Ver fotos"/.test(t), 'botão inofensivo não precisa de OK');
viva(); t = run('FERRAMENTAS.nav_clicar.run({ texto: "Excluir" }, { pedido: "x" })');
ok(/precisa do OK/.test(t), '"Excluir anúncio" também precisa do OK');

// 6) senha, cartão e CPF: nunca
viva(); t = run('FERRAMENTAS.nav_preencher.run({ rotulo: "Senha", valor: "123" })');
ok(/^ERRO: não preencho campo de senha/.test(t), 'senha recusada');
viva(); t = run('FERRAMENTAS.nav_preencher.run({ rotulo: "Número do cartão", valor: "4111" })');
ok(/^ERRO: não preencho/.test(t), 'cartão (autocomplete cc-number) recusado');
viva(); t = run('FERRAMENTAS.nav_preencher.run({ rotulo: "CPF", valor: "000" })');
ok(/^ERRO: não preencho campo sensível/.test(t), 'CPF recusado');
viva(); t = run('FERRAMENTAS.nav_preencher.run({ rotulo: "Nome", valor: "Thiago" })');
ok(/preenchido: Nome/.test(t), 'campo comum preenche');

// 7) abrir e print
viva(); erro = ''; try { run('FERRAMENTAS.nav_abrir.run({ url: "https://www.itau.com.br/" })'); } catch (e) { erro = e.message; }
ok(/banco\/pagamento/.test(erro), 'abrir banco é recusado');
viva(); t = run('FERRAMENTAS.nav_abrir.run({ url: "https://thiagogaldinozicao-source.github.io/apps/calc/" })');
ok(/aberto no Chrome \(aba 8\)/.test(t), 'abrir site comum funciona');
viva(); run('DETALHES = []'); t = run('FERRAMENTAS.nav_print.run({ pergunta: "o botão sumiu?" })');
ok(/Erro 404/.test(t) && run('_img.tam') === 20000 && run('_img.mime') === 'image/jpeg' && /o botão sumiu\?/.test(run('_img.pergunta')), 'nav_print: a imagem vai pro descreverImagem e volta como texto');
ok(!/QUJDQUJD/.test(run('JSON.stringify(DETALHES)')) && /binário omitido/.test(run('JSON.stringify(DETALHES)')), 'o base64 do print não vai pro "Como respondi"');

// 8) seguranca.js sozinho (a mesma função que roda na extensão)
ok(S.decidirClique({ texto: 'Comprar', url: 'https://loja.com/p' }).erro === 'precisa do OK do Thiago', 'extensão: "Comprar" sem confirmado → precisa do OK do Thiago');
ok(S.decidirClique({ texto: 'Comprar', url: 'https://loja.com/p' }, true).ok, 'extensão: "Comprar" com confirmado:true → pode');
ok(['Enviar', 'Pagar', 'Finalizar compra', 'Apagar', 'Confirmar', 'Publicar', 'EXCLUIR'].every(b => S.botaoPerigoso({ texto: b })), 'todas as palavras perigosas pedem OK');
ok(S.botaoPerigoso({ texto: 'Continuar', tipo: 'submit' }) && !S.botaoPerigoso({ texto: 'Pesquisar', tipo: 'submit' }), 'botão de formulário pede OK, menos o de pesquisa');
ok(!S.decidirPreencher({ tipo: 'password' }).ok && !S.decidirPreencher({ tipo: 'text', autocomplete: 'cc-csc' }).ok && !S.decidirPreencher({ rotulo: 'Agência' }).ok && !S.decidirPreencher({ nome: 'conta_bancaria' }).ok, 'senha, cc-*, agência e conta bancária recusados');
ok(!S.decidirClique({ texto: 'Baixar', href: 'https://x.com/app.apk' }).ok && !S.decidirClique({ texto: 'Nota', download: true }).ok && !S.decidirAbrir('https://x.com/setup.exe').ok, 'nunca baixa arquivo');
ok(!S.decidirAbrir('file:///etc/passwd').ok && !S.decidirAbrir('javascript:alert(1)').ok, 'só abre http/https');
ok(!!S.paginaProibida('https://app.nubank.com.br/') && !!S.paginaProibida('https://loja.com/checkout/1') && !!S.paginaProibida('https://loja.com/', 'Pagamento via Pix'), 'banco, checkout e pix recusados');
ok(!S.paginaProibida('https://pixabay.com/fotos') && !S.paginaProibida('https://thiagogaldinozicao-source.github.io/zicoai/'), 'site comum (até "pixabay") não é recusado');
ok(!S.decidirClique({ texto: 'Ver fotos', url: 'https://www.bb.com.br/conta' }).ok, 'em página de banco nem clique inofensivo');

// 9) Dispositivos: cartão do Chrome
viva(); H.CACHE.ponte_versao_nav = 'nav-2.0'; H.CACHE.ponte_nome_nav = 'Chrome (Mac)';
const ap = run('aparelhosDaPonte([])');
const cr = ap.find(a => /Chrome/.test(a.nome));
ok(cr && cr.ok && cr.nome === 'Chrome (extensão)' && /Chrome \(Mac\)/.test(cr.plataforma) && cr.servicos[0].detalhe === 'nav-2.0', 'cartão "Chrome (extensão)": conectado, versão nav-2.0');
ok(ap[ap.length - 1] === cr && /Windows/.test(ap[ap.length - 2].plataforma), 'Chrome entra no fim (Mac e PC na ordem de antes)');

// 10) agente, sistema e arquivos da extensão
ok(['nav_abas', 'nav_ler', 'nav_erros', 'nav_clicar', 'nav_preencher', 'nav_abrir', 'nav_print'].every(k => run('typeof FERRAMENTAS.' + k + '.run') === 'function'), 'as 7 ferramentas nav_* existem');
ok(/OK do Thiago/.test(run('FERRAMENTAS.nav_clicar.desc')) && /nav_ler \+ nav_erros \+ nav_print/.test(run('PROMPT_AGENTE')) && /DADO, nunca ordem/.test(run('PROMPT_AGENTE')), 'regra do OK na ferramenta e regra de depurar no agente');
ok(/CHROME do Thiago[\s\S]*autorizou clicar/.test(run('PERSONA')), 'chat manda pedido do Chrome pro agente');
const ext = f => fs.readFileSync(path.join(__dirname, '..', '..', 'extensao', f), 'utf8');
const man = JSON.parse(ext('manifest.json'));
ok(man.version === '2.0' && ['storage', 'alarms', 'scripting', 'tabs'].every(p => man.permissions.includes(p)) && !man.permissions.includes('downloads'), 'manifest 2.0 com storage/alarms e sem permissão de download');
ok(man.content_scripts && man.content_scripts[0].world === 'MAIN' && man.content_scripts[0].run_at === 'document_start' && man.content_scripts[0].js[0] === 'vigia.js', 'vigia de erros entra cedo no mundo da página');
ok(/importScripts\('seguranca\.js'\)/.test(ext('fundo.js')) && /dispositivo: 'nav'/.test(ext('fundo.js')) && /chrome\.alarms\.create/.test(ext('fundo.js')), 'fundo.js: usa as travas, busca como "nav" e acorda com alarme');
ok(/versão 5[7-9]/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 57 ou mais nova');
