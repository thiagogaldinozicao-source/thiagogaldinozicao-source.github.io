// Navegador da ZicoAI (o "navegador dentro da IA", igual o do Claude): um Chrome PRÓPRIO dela no Mac,
// com perfil separado em ~/ZicoAI/navegador-perfil (o Thiago entra na conta Google uma vez nessa janela).
// Ela pesquisa, lê, clica (mouse de verdade), digita e depura. As MESMAS travas da extensão (seguranca.js):
// nunca senha/cartão/CPF/banco; botão de enviar/comprar/apagar/publicar/implantar só com o OK do Thiago.
// Depois de cada ação devolve um print pequeno ("tela") pra aparecer ao vivo no app.
// v2 (01/11): CADA CONVERSA TEM AS SUAS ABAS (d.sessao = id da conversa). Uma conversa nunca vê nem mexe
// na aba de outra; aba aberta por um link vai pra conversa que clicou. Conversa parada 30 min fecha as abas
// dela; o Chrome inteiro fecha com 15 min sem nenhuma conversa usando.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const EXT = path.join(__dirname, '..', 'repo', 'zicoai', 'extensao');
const SESSAO_MIN = Number(process.env.ZICO_SESSAO_MIN || 30), FECHAR_MIN = 15;
let S = null;
function seg() { if (!S) { delete require.cache[require.resolve(path.join(EXT, 'seguranca.js'))]; S = require(path.join(EXT, 'seguranca.js')); } return S; }
function carregarPlaywright() {
  for (const t of [process.env.ZICO_PLAYWRIGHT, path.join(__dirname, '..', 'oficina', 'node_modules', 'playwright'), '/opt/homebrew/lib/node_modules/playwright', 'playwright'].filter(Boolean)) { try { return require(t); } catch (e) { /* próximo */ } }
  throw new Error('Playwright não encontrado no Mac');
}
let ctx = null, ultimoUso = 0, criandoPara = '';
const sessoes = new Map();   // nome → { abas: [Page], ativa: Page, tamanho, ultimo }
const nomeSessao = s => String(s || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'geral';
const guarda = (l, t) => { t = String(t).slice(0, 220); if (l.indexOf(t) < 0) l.push(t); if (l.length > 40) l.shift(); };
function eventos(p) {
  p._erros = []; p._rede = [];
  p.on('pageerror', e => guarda(p._erros, 'JavaScript: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') guarda(p._erros, 'Console: ' + m.text()); });
  p.on('response', r => { if (r.status() >= 400) guarda(p._rede, r.status() + ' · ' + r.url().slice(0, 160)); });
  p.on('requestfailed', r => guarda(p._rede, 'falhou · ' + r.url().slice(0, 160) + ' (' + ((r.failure() || {}).errorText || '') + ')'));
}
function sessaoDe(nome) {
  let s = sessoes.get(nome);
  if (!s) { s = { abas: [], ativa: null, tamanho: null, ultimo: Date.now() }; sessoes.set(nome, s); }
  return s;
}
// toda aba nova passa por aqui: a que nós criamos (criandoPara) ou a que um link abriu (vai pra conversa de quem abriu)
function registrar(p, nome) {
  if (p._sessao) return;
  p._sessao = nome; eventos(p);
  const s = sessaoDe(nome);
  s.abas.push(p); s.ativa = p;
  if (s.tamanho) p.setViewportSize(s.tamanho).catch(() => {});
  p.on('close', () => {
    s.abas = s.abas.filter(x => x !== p);
    if (s.ativa === p) s.ativa = s.abas[s.abas.length - 1] || null;
  });
}
async function abrirNavegador() {
  if (ctx) return;
  const { chromium } = carregarPlaywright();
  ctx = await chromium.launchPersistentContext(process.env.ZICO_PERFIL || path.join(os.homedir(), 'ZicoAI', 'navegador-perfil'), {
    headless: process.env.ZICO_HEADLESS === '1', executablePath: process.env.ZICO_CHROME || undefined, viewport: { width: 1280, height: 800 }, args: ['--window-position=40,40', '--window-size=1300,900'], acceptDownloads: false
  });
  ctx.on('close', () => { ctx = null; sessoes.clear(); });
  ctx.on('page', p => {
    if (criandoPara) return registrar(p, criandoPara);
    p.opener().then(o => {
      if (o && o._sessao) registrar(p, o._sessao);
      else p.close().catch(() => {});   // aba sem dono (não veio de nenhuma conversa): fecha
    }).catch(() => {});
  });
  // a aba em branco que o Chrome abre sozinho fica de reserva pra 1ª conversa
  ctx._sobra = ctx.pages()[0] || null;
}
async function novaAba(nome) {
  if (ctx._sobra && !ctx._sobra.isClosed()) { const p = ctx._sobra; ctx._sobra = null; registrar(p, nome); return p; }
  criandoPara = nome;
  try { const p = await ctx.newPage(); registrar(p, nome); return p; } finally { criandoPara = ''; }
}
async function abaDaConversa(nome) {
  const s = sessaoDe(nome);
  if (!s.ativa || s.ativa.isClosed()) s.ativa = s.abas.filter(x => !x.isClosed()).pop() || await novaAba(nome);
  return s.ativa;
}
setInterval(() => {
  if (!ctx) return;
  for (const [nome, s] of sessoes) if (Date.now() - s.ultimo > SESSAO_MIN * 60000) { s.abas.slice().forEach(p => p.close().catch(() => {})); sessoes.delete(nome); }
  if (Date.now() - ultimoUso > FECHAR_MIN * 60000) { ctx.close().catch(() => {}); ctx = null; sessoes.clear(); }
}, 60000).unref();
async function injetar(pagina) {   // as mesmas funções de página da extensão (ler, achar botão, travas), sem depender de CSP do site
  for (const f of ['seguranca.js', 'pagina.js']) await pagina.evaluate(fs.readFileSync(path.join(EXT, f), 'utf8')).catch(() => {});
  await pagina.evaluate('window.chrome = window.chrome || {}; if (!window.chrome.runtime) window.chrome.runtime = { sendMessage() {} };').catch(() => {});
}
async function tela(pagina) {
  // print pequeno pro app mostrar ao vivo (cabe no cache do cérebro: até ~90 mil letras)
  try {
    for (const q of [32, 18, 10]) { const b = (await pagina.screenshot({ type: 'jpeg', quality: q })).toString('base64'); if (b.length <= 90000) return b; }
    return '';
  } catch (e) { return ''; }
}
const TECLAS = /^(Enter|Tab|Escape|Backspace|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|PageUp|PageDown|Home|End|Space)$/;
async function navegador(d) {
  d = d || {}; ultimoUso = Date.now();
  const op = String(d.op || ''), nome = nomeSessao(d.sessao);
  if (op === 'fechar') {   // fecha só as abas DESTA conversa
    const s = sessoes.get(nome); if (s) { s.abas.slice().forEach(p => p.close().catch(() => {})); sessoes.delete(nome); }
    return { ok: true, fechado: true };
  }
  await abrirNavegador();
  const sess = sessaoDe(nome); sess.ultimo = Date.now();
  let pagina = await abaDaConversa(nome);
  const S = seg();
  let r = { ok: true };
  const url = () => pagina.url(), titulo = async () => pagina.title().catch(() => '');
  const proibida = async () => S.paginaProibida(url(), await titulo());
  if (op === 'abrir') {
    let u = String(d.url || '').trim(); if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    const dec = S.decidirAbrir(u); if (!dec.ok) return dec;
    await pagina.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => { r = { ok: false, erro: 'não abriu: ' + e.message.split('\n')[0] }; });
    await pagina.waitForTimeout(1500);
  } else if (op === 'pesquisar') {
    await pagina.goto('https://www.google.com/search?hl=pt-BR&q=' + encodeURIComponent(String(d.texto || '')), { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => { r = { ok: false, erro: e.message.split('\n')[0] }; });
    await pagina.waitForTimeout(1200);
    if (r.ok) { await injetar(pagina); const l = await pagina.evaluate(() => self.ZicoPagina.ler({ max: 9000 })); r.texto = l.texto; r.links = (l.links || []).filter(x => /^https?:/.test(x.href) && !/google\./.test(x.href)).slice(0, 15); }
  } else if (op === 'ler') {
    const p = await proibida(); if (p) return { ok: false, erro: 'página de banco/pagamento: não leio (' + p + ')' };
    await injetar(pagina); const l = await pagina.evaluate(m => self.ZicoPagina.ler({ max: m }), Math.min(Number(d.max) || 20000, 30000));
    r = Object.assign(r, { texto: l.texto, links: (l.links || []).slice(0, 60), controles: (l.controles || []).slice(0, 80) });
  } else if (op === 'clicar') {
    await injetar(pagina);
    const alvo = await pagina.evaluate(x => self.ZicoPagina.clicar(x), { seletor: d.seletor, texto: d.texto, confirmado: d.confirmado === true, soOnde: true });
    if (!alvo || !alvo.ok) return Object.assign({ ok: false }, alvo || {}, { titulo: await titulo(), url: url() });
    await pagina.waitForTimeout(450);
    await pagina.mouse.move(alvo.x, alvo.y, { steps: 6 }); await pagina.mouse.click(alvo.x, alvo.y);   // mouse de verdade
    await pagina.waitForTimeout(1200);
    r.clicou = alvo.clicou;
  } else if (op === 'digitar') {
    await injetar(pagina);
    const x = await pagina.evaluate(a => self.ZicoPagina.preencher(a), { seletor: d.seletor, rotulo: d.rotulo, valor: String(d.valor || '') });
    if (!x || !x.ok) return Object.assign({ ok: false }, x || {});
    r.preencheu = true;
  } else if (op === 'teclas') {
    const k = String(d.tecla || ''); if (!TECLAS.test(k)) return { ok: false, erro: 'tecla fora da lista: Enter, Tab, Escape, setas, PageUp/Down, Backspace' };
    if (k === 'Enter' && d.confirmado !== true && /\b(form|submit)\b/i.test(String(d.motivo || ''))) return { ok: false, erro: 'Enter que envia formulário: precisa do OK do Thiago' };
    await pagina.keyboard.press(k); await pagina.waitForTimeout(800);
  } else if (op === 'rolar') {
    await injetar(pagina); await pagina.evaluate(x => self.ZicoPagina.rolar(x), { direcao: d.direcao, texto: d.texto, seletor: d.seletor });
  } else if (op === 'voltar') { await pagina.goBack({ timeout: 15000 }).catch(() => {}); await pagina.waitForTimeout(800);
  } else if (op === 'erros') { r.erros = pagina._erros.splice(0); r.rede = pagina._rede.splice(0);
  } else if (op === 'recarregar') { pagina._erros.length = 0; pagina._rede.length = 0; await pagina.reload({ waitUntil: 'load', timeout: 30000 }).catch(() => {}); await pagina.waitForTimeout(2500); r.erros = pagina._erros.splice(0); r.rede = pagina._rede.splice(0);
  } else if (op === 'tela') { /* só o print */
  // o THIAGO usando o navegador dela pelo app (toque na tela, digitar, rolar). Só vem da ação "navegar" do app, com PIN; o agente não tem essas.
  } else if (op === 'tocar') {
    const vp = pagina.viewportSize() || { width: 1280, height: 800 };
    const x = Math.max(0, Math.min(vp.width, Number(d.x) || 0)), y = Math.max(0, Math.min(vp.height, Number(d.y) || 0));
    await pagina.mouse.move(x, y, { steps: 2 }); await pagina.mouse.click(x, y); await pagina.waitForTimeout(700);
  } else if (op === 'escrever') {
    await pagina.keyboard.type(String(d.texto || '').slice(0, 2000), { delay: 15 }); await pagina.waitForTimeout(300);
    if (d.enter === true) { await pagina.keyboard.press('Enter'); await pagina.waitForTimeout(1200); }
  } else if (op === 'roda') {
    await pagina.mouse.wheel(0, Math.max(-3000, Math.min(3000, Number(d.dy) || 600))); await pagina.waitForTimeout(600);
  } else if (op === 'tamanho') {   // celular (430×860) ou computador (1280×800): o site se ajusta como num aparelho de verdade
    const w = Math.max(320, Math.min(1600, Number(d.w) || 1280)), h = Math.max(480, Math.min(1200, Number(d.h) || 800));
    await pagina.setViewportSize({ width: w, height: h }); await pagina.waitForTimeout(500);
    sess.tamanho = pagina.viewportSize();
  } else if (op === 'avancar') { await pagina.goForward({ timeout: 15000 }).catch(() => {}); await pagina.waitForTimeout(800); }
  else if (op === 'novaAba') {
    pagina = await novaAba(nome);
    let u = String(d.url || '').trim(); if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    if (u) { const dec = S.decidirAbrir(u); if (!dec.ok) return dec; await pagina.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}); await pagina.waitForTimeout(1000); }
  } else if (op === 'trocarAba' || op === 'fecharAba') {
    const abertas = sess.abas.filter(x => !x.isClosed()), alvo = abertas[Number(d.i)];
    if (!alvo) return { ok: false, erro: 'aba ' + d.i + ' não existe nesta conversa' };
    if (op === 'trocarAba') { sess.ativa = alvo; await alvo.bringToFront().catch(() => {}); }
    else if (abertas.length === 1) await alvo.goto('about:blank').catch(() => {});
    else await alvo.close().catch(() => {});
    pagina = await abaDaConversa(nome);
  }
  else return { ok: false, erro: 'operação desconhecida: ' + op };
  if (sess.ativa && !sess.ativa.isClosed()) pagina = sess.ativa;   // um clique abriu aba nova nesta conversa: ela vira a ativa
  sess.ativa = pagina;
  r.titulo = await titulo(); r.url = url();
  r.abas = await Promise.all(sess.abas.filter(x => !x.isClosed()).map(async x => ({ titulo: String(await x.title().catch(() => '') || x.url()).slice(0, 60), url: x.url().slice(0, 200), ativa: x === pagina })));
  // depois do toque: caiu num campo de digitar? (o app já abre o teclado do celular)
  r.foco = await pagina.evaluate(() => { const a = document.activeElement; return !!a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) && !/^(button|submit|checkbox|radio|range|file|color)$/i.test(a.type || ''); }).catch(() => false);
  r.tela = await tela(pagina);
  return r;
}
module.exports = { navegador, _sessoes: sessoes };
