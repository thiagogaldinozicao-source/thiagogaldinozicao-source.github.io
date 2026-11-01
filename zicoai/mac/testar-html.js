// Testa um app HTML de verdade, como o Claude faz: abre no Chromium (sem janela), na largura do celular,
// clica nos primeiros botões e devolve os erros que apareceram. Só escreve um arquivo temporário; não apaga nada.
// v2 (01/11): PROVAS do app — cada prova abre o app do zero, faz os passos (clicar, preencher, escolher, teclas, js)
// e confere o resultado na tela (texto contém / js que devolve true ou o motivo). Prova que falha vira erro.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
function carregarPlaywright() {
  const tentativas = [process.env.ZICO_PLAYWRIGHT, path.join(__dirname, '..', 'oficina', 'node_modules', 'playwright'), path.join(os.homedir(), 'ZicoAI', 'oficina', 'node_modules', 'playwright'), '/opt/homebrew/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright', 'playwright'].filter(Boolean);
  for (const t of tentativas) { try { return require(t); } catch (e) { /* próximo */ } }
  throw new Error('Playwright não encontrado no Mac');
}
const curto = (t, n) => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, n || 160);
/** Uma prova: contexto novo (nada salvo de antes), passos, conferências. Devolve { nome, ok, detalhe }. */
async function rodarProva(nav, arq, largura, p) {
  const nome = curto(p && p.nome, 80) || 'prova sem nome';
  const ctx = await nav.newContext({ viewport: { width: largura, height: 844 } });
  const erroJs = [];
  try {
    const pag = await ctx.newPage();
    pag.on('pageerror', e => erroJs.push(e.message));
    pag.on('dialog', dl => dl.accept().catch(() => {}));
    await pag.goto('file://' + arq, { waitUntil: 'load', timeout: 20000 });
    await pag.waitForTimeout(1200);
    const passos = Array.isArray(p.passos) ? p.passos.slice(0, 30) : [];
    for (let i = 0; i < passos.length; i++) {
      const s = passos[i] || {}, onde = 'passo ' + (i + 1);
      try {
        if (s.clicar) await pag.click(String(s.clicar), { timeout: 3000 });
        else if (s.preencher) await pag.fill(String(s.preencher), String(s.valor == null ? '' : s.valor), { timeout: 3000 });
        else if (s.escolher) await pag.selectOption(String(s.escolher), String(s.valor == null ? '' : s.valor), { timeout: 3000 });
        else if (s.teclas) await pag.keyboard.press(String(s.teclas));
        else if (s.esperar) await pag.waitForTimeout(Math.min(Number(s.esperar) || 0, 5000));
        else if (s.js) await pag.evaluate(c => new Function(c)(), String(s.js));
        await pag.waitForTimeout(150);
      } catch (e) { return { nome, ok: false, detalhe: onde + ' (' + curto(JSON.stringify(s), 80) + ') não deu: ' + curto(String(e.message).split('\n')[0], 120) }; }
    }
    const confs = Array.isArray(p.conferir) ? p.conferir.slice(0, 20) : [];
    if (!confs.length) return { nome, ok: false, detalhe: 'prova sem nada pra conferir' };
    for (let i = 0; i < confs.length; i++) {
      const c = confs[i] || {};
      try {
        if (c.texto) {
          const t = await pag.$eval(String(c.texto), el => el.innerText || el.value || el.textContent || '').catch(() => null);
          if (t === null) return { nome, ok: false, detalhe: 'não achei ' + curto(c.texto, 60) + ' na tela' };
          if (c.contem != null && t.indexOf(String(c.contem)) < 0) return { nome, ok: false, detalhe: curto(c.texto, 50) + ' devia ter "' + curto(c.contem, 40) + '" e mostra "' + curto(t, 90) + '"' };
          if (c.igual != null && t.trim() !== String(c.igual).trim()) return { nome, ok: false, detalhe: curto(c.texto, 50) + ' devia ser "' + curto(c.igual, 40) + '" e é "' + curto(t, 90) + '"' };
          if (c.naoContem != null && t.indexOf(String(c.naoContem)) >= 0) return { nome, ok: false, detalhe: curto(c.texto, 50) + ' não devia ter "' + curto(c.naoContem, 40) + '"' };
        } else if (c.js) {
          const r = await pag.evaluate(code => { try { return new Function(code)(); } catch (e) { return 'erro no js da prova: ' + e.message; } }, String(c.js));
          if (r !== true) return { nome, ok: false, detalhe: r === false || r == null ? 'conferência ' + (i + 1) + ' deu falso' : curto(r, 200) };
        }
      } catch (e) { return { nome, ok: false, detalhe: 'conferência ' + (i + 1) + ': ' + curto(e.message, 120) }; }
    }
    if (erroJs.length) return { nome, ok: false, detalhe: 'deu erro no JavaScript durante a prova: ' + curto(erroJs[0], 140) };
    return { nome, ok: true, detalhe: '' };
  } catch (e) { return { nome, ok: false, detalhe: curto(e.message, 160) }; }
  finally { await ctx.close().catch(() => {}); }
}
async function testarHtml(d) {
  const html = String(d.html || '');
  if (!html) throw new Error('sem html pra testar');
  if (html.length > 2000000) throw new Error('html grande demais');
  const largura = Math.min(Math.max(Number(d.largura) || 390, 320), 1600);
  const arq = path.join(os.tmpdir(), 'zicoai-teste-' + Date.now().toString(36) + '.html');
  fs.writeFileSync(arq, html);
  const { chromium } = carregarPlaywright();
  const nav = await chromium.launch({ headless: true });
  const erros = [], avisos = [], provas = [];
  const anota = (lista, t) => { t = String(t).slice(0, 220); if (lista.length < 12 && lista.indexOf(t) < 0) lista.push(t); };
  let titulo = '', botoes = 0;
  try {
    // provas primeiro (app limpo); até 20 e no máximo ~60 s no total
    const t0 = Date.now();
    for (const p of (Array.isArray(d.provas) ? d.provas : []).slice(0, 20)) {
      if (Date.now() - t0 > 60000) { provas.push({ nome: curto(p && p.nome, 80), ok: false, detalhe: 'não deu tempo de rodar (provas demais)' }); continue; }
      const r = await rodarProva(nav, arq, largura, p || {});
      provas.push(r);
      if (!r.ok) anota(erros, 'Prova falhou: ' + r.nome + ' — ' + r.detalhe);
    }
    const pag = await nav.newPage({ viewport: { width: largura, height: 844 } });
    pag.on('pageerror', e => anota(erros, 'Erro no JavaScript: ' + e.message));
    pag.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) anota(erros, 'Console: ' + m.text()); });
    pag.on('requestfailed', r => { if (!/favicon/i.test(r.url())) anota(avisos, 'Não carregou: ' + r.url().slice(0, 120) + ' (' + ((r.failure() || {}).errorText || '') + ')'); });
    pag.on('dialog', dl => dl.dismiss().catch(() => {}));
    await pag.goto('file://' + arq, { waitUntil: 'load', timeout: 20000 }).catch(e => anota(erros, 'Não abriu: ' + e.message));
    await pag.waitForTimeout(2000);
    titulo = await pag.title().catch(() => '');
    // clica nos primeiros botões visíveis (handler quebrado só aparece clicando)
    const lista = await pag.$$('button:visible, [role=button]:visible, input[type=button]:visible, input[type=submit]:visible');
    // até 12 botões; botão que não aceita o toque (tem algo por cima ou está travado) é erro: foi o "ela não clica" de 31/10
    let semToque = 0, motivo = '';
    for (const b of lista.slice(0, 12)) {
      try { await b.click({ timeout: 1500, noWaitAfter: true }); botoes++; await pag.waitForTimeout(200); }
      catch (e) { semToque++; if (!motivo) motivo = String(e.message).split('\n').find(l => /intercepts pointer|not enabled|outside of the viewport|not visible/.test(l)) || ''; }
    }
    if (semToque) anota(erros, semToque + ' de ' + Math.min(lista.length, 12) + ' botões não aceitam o toque' + (motivo ? ' (' + motivo.replace(/\u001b\[\d+m/g, '').trim().slice(0, 140) + ')' : '') + ': tem algo cobrindo ou estão travados.');
    const larga = await pag.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1).catch(() => false);
    if (larga) anota(avisos, 'A página fica mais larga que a tela do celular (' + largura + ' px): aparece rolagem pro lado.');
    const vazio = await pag.evaluate(() => (document.body && document.body.innerText || '').trim().length < 2).catch(() => false);
    if (vazio) anota(erros, 'A página abriu em branco (nada de texto na tela).');
  } finally { await nav.close(); }
  return { ok: true, erros, avisos, titulo, botoesTestados: botoes, largura, provas };
}
module.exports = { testarHtml, rodarProva };
