/* ZicoAI no Chrome: o que ela faz DENTRO da página (ler, clicar, preencher, rolar).
 * A extensão injeta seguranca.js e este arquivo no mundo isolado da extensão (a página não mexe neles)
 * e depois chama ZicoPagina.<ação>(dados). Toda ação perigosa passa por ZicoSeguranca antes.
 */
(function () {
  'use strict';
  const S = self.ZicoSeguranca;
  const limpo = t => S.limpar(t);
  const curto = (t, n) => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, n || 80);

  function visivel(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0;
  }

  // seletor simples e único: #id, tag[name=".."] ou caminho com nth-of-type a partir do body
  function seletor(el) {
    try {
      if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
      const tag = el.tagName.toLowerCase(), nome = el.getAttribute('name');
      if (nome) { const s = tag + '[name="' + nome.replace(/"/g, '\\"') + '"]'; if (document.querySelectorAll(s).length === 1) return s; }
      const partes = []; let e = el;
      while (e && e.nodeType === 1 && e !== document.body && e !== document.documentElement && partes.length < 14) {
        if (e.id && document.querySelectorAll('#' + CSS.escape(e.id)).length === 1) { partes.unshift('#' + CSS.escape(e.id)); return partes.join(' > '); }
        let i = 1, irmao = e; while ((irmao = irmao.previousElementSibling)) if (irmao.tagName === e.tagName) i++;
        partes.unshift(e.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
        e = e.parentElement;
      }
      return 'body > ' + partes.join(' > ');
    } catch (err) { return ''; }
  }

  function textoDe(el) {
    return curto(el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt') || '', 120);
  }
  function rotuloDe(el) {
    let r = '';
    try { if (el.labels && el.labels.length) r = el.labels[0].innerText; } catch (e) { /* ok */ }
    if (!r) { const id = el.getAttribute('aria-labelledby'); const l = id && document.getElementById(id); if (l) r = l.innerText; }
    return curto(r || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('name') || '', 100);
  }
  function infoCampo(el) {
    return { tipo: (el.getAttribute('type') || el.type || el.tagName).toLowerCase(), nome: el.getAttribute('name') || '', id: el.id || '',
      autocomplete: el.getAttribute('autocomplete') || '', rotulo: rotuloDe(el), placeholder: el.getAttribute('placeholder') || '',
      aria: el.getAttribute('aria-label') || '', url: location.href, titulo: document.title };
  }
  function tipoClique(el) {
    const t = (el.getAttribute('type') || '').toLowerCase();
    if ((el.tagName === 'BUTTON' || el.tagName === 'INPUT') && el.form && (el.type === 'submit' || el.type === 'image')) return 'submit';
    return t;
  }

  const CLICAVEIS = 'a[href], button, input[type=button], input[type=submit], input[type=reset], input[type=image], input[type=checkbox], input[type=radio], [role=button], [role=link], [role=menuitem], [role=tab], [role=checkbox], [role=switch], summary, label, [onclick]';
  const CAMPOS = 'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image]), textarea, select, [contenteditable=""], [contenteditable=true]';

  // acha pelo seletor ou pelo texto visível (igual primeiro, depois começa com, depois contém o mais curto)
  function achar(lista, alvo, deQuem) {
    const t = limpo(alvo);
    if (!t) return null;
    const itens = lista.map(el => ({ el: el, t: limpo(deQuem(el)) })).filter(x => x.t);
    return (itens.find(x => x.t === t) || itens.find(x => x.t.startsWith(t)) ||
      itens.filter(x => x.t.indexOf(t) >= 0).sort((a, b) => a.t.length - b.t.length)[0] || {}).el || null;
  }
  function porSeletor(sel) {
    try { return document.querySelector(String(sel)); } catch (e) { throw new Error('seletor inválido: ' + curto(sel, 60)); }
  }
  function parecidos(lista, deQuem) { return lista.slice(0, 15).map(el => curto(deQuem(el), 40)).filter(Boolean); }

  function ler(d) {
    const max = Math.min(30000, Number(d && d.max) || 30000);
    // WhatsApp Web: só a conversa ABERTA (a lista de conversas tem nome e número de outros clientes e não ajuda)
    const zap = /(^|\.)web\.whatsapp\.com$/.test(location.hostname) && document.querySelector('#main');
    const base = zap ? ('Conversa aberta no WhatsApp: ' + ((zap.querySelector('header') || {}).innerText || '').split('\n')[0] + '\n\n' + (zap.innerText || '').split('\n').slice(-120).join('\n')) : ((document.body && document.body.innerText) || '');
    const texto = base.replace(/\n{3,}/g, '\n\n').slice(-max);
    const links = Array.from(document.querySelectorAll('a[href]')).filter(visivel)
      .filter(a => !/^\s*javascript:/i.test(a.getAttribute('href')))
      .slice(0, 150).map(a => ({ texto: textoDe(a), href: a.href }));
    const controles = [];
    Array.from(document.querySelectorAll(CLICAVEIS + ', ' + CAMPOS)).filter(visivel).forEach(el => {
      if (controles.length >= 150 || el.tagName === 'A' || el.tagName === 'LABEL') return;   // rótulo já vai junto do campo
      const ehCampo = el.matches(CAMPOS) && !/^(checkbox|radio)$/.test(el.type || '');
      const c = { tipo: ehCampo ? (el.tagName === 'SELECT' ? 'lista' : el.tagName === 'TEXTAREA' ? 'texto longo' : 'campo ' + (el.type || 'texto')) : 'botão', texto: ehCampo ? rotuloDe(el) : textoDe(el), seletor: seletor(el) };
      if (ehCampo && S.campoProibido(infoCampo(el))) c.protegido = true;   // a ZicoAI não preenche esse
      if (!ehCampo && S.botaoPerigoso({ texto: c.texto, tipo: tipoClique(el) })) c.precisaOk = true;
      controles.push(c);
    });
    return { ok: true, titulo: document.title, url: location.href, selecao: curto(String(getSelection() || ''), 3000), texto: texto,
      links: links, controles: controles, rolagem: { y: Math.round(scrollY), altura: document.documentElement.scrollHeight, janela: innerHeight } };
  }

  function clicar(d) {
    d = d || {};
    const lista = Array.from(document.querySelectorAll(CLICAVEIS)).filter(visivel);
    const el = d.seletor ? porSeletor(d.seletor) : achar(lista, d.texto, textoDe);
    if (!el) return { ok: false, erro: 'não achei "' + curto(d.seletor || d.texto, 60) + '" na página', visiveis: parecidos(lista, textoDe) };
    const info = { texto: textoDe(el), tipo: tipoClique(el), tag: el.tagName.toLowerCase(), href: el.getAttribute('href') || '',
      download: el.hasAttribute('download'), url: location.href, titulo: document.title };
    const dec = S.decidirClique(info, d.confirmado);
    if (!dec.ok) return Object.assign({ alvo: info.texto }, dec);
    if (el.matches(CAMPOS) && S.campoProibido(infoCampo(el))) return { ok: false, erro: 'não mexo em campo sensível' };
    el.scrollIntoView({ block: 'center' });
    el.click();
    return { ok: true, clicou: info.texto || info.tag, seletor: seletor(el) };
  }

  function preencher(d) {
    d = d || {};
    const lista = Array.from(document.querySelectorAll(CAMPOS)).filter(visivel);
    const el = d.seletor ? porSeletor(d.seletor) : achar(lista, d.rotulo, el => rotuloDe(el) + ' ' + (el.getAttribute('placeholder') || '') + ' ' + (el.getAttribute('name') || ''));
    if (!el) return { ok: false, erro: 'não achei o campo "' + curto(d.seletor || d.rotulo, 60) + '"', campos: parecidos(lista, rotuloDe) };
    if (!el.matches(CAMPOS)) return { ok: false, erro: 'isso não é um campo de digitar' };
    if (/^(checkbox|radio)$/.test(el.type || '')) return { ok: false, erro: 'caixinha de marcar: use clicar' };
    const info = infoCampo(el);
    const dec = S.decidirPreencher(info);
    if (!dec.ok) return dec;
    if (el.disabled || el.readOnly) return { ok: false, erro: 'campo travado (desabilitado ou só leitura)' };
    const valor = String(d.valor == null ? '' : d.valor).slice(0, 5000);
    el.focus();
    if (el.isContentEditable) { el.textContent = valor; }
    else {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;   // jeito que funciona até em site feito com React
      set.call(el, valor);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, campo: info.rotulo || info.nome || info.id, seletor: seletor(el) };
  }

  function rolar(d) {
    d = d || {};
    if (d.seletor || d.texto) {
      const el = d.seletor ? porSeletor(d.seletor) : achar(Array.from(document.querySelectorAll('body *')).filter(e => e.children.length === 0 && visivel(e)), d.texto, e => e.innerText || '');
      if (!el) return { ok: false, erro: 'não achei "' + curto(d.seletor || d.texto, 60) + '" pra rolar até lá' };
      el.scrollIntoView({ block: 'center' });
    } else {
      const dir = limpo(d.direcao || 'baixo');
      if (dir === 'topo') scrollTo(0, 0);
      else if (dir === 'fim') scrollTo(0, document.documentElement.scrollHeight);
      else scrollBy(0, (dir === 'cima' ? -1 : 1) * (Number(d.pixels) || Math.round(innerHeight * 0.8)));
    }
    return { ok: true, y: Math.round(scrollY), altura: document.documentElement.scrollHeight, janela: innerHeight };
  }

  // Tabelas da página (lista de preço de fornecedor, pedido, relatório): linhas e colunas prontas pra planilha
  function tabelas(d) {
    const max = Math.min(Number(d && d.linhas) || 200, 500);
    const ts = Array.from(document.querySelectorAll('table')).filter(visivel).slice(0, 5).map((t, i) => {
      const linhas = Array.from(t.rows).slice(0, max).map(r => Array.from(r.cells).map(c => curto(c.innerText, 200)));
      return { n: i + 1, linhas: linhas.length, colunas: Math.max(0, ...linhas.map(l => l.length)), dados: linhas };
    }).filter(t => t.linhas);
    return { ok: true, titulo: document.title, url: location.href, tabelas: ts };
  }
  // Chamadas de rede da página (o que carregou, o que deu erro, o que demorou): pra depurar app/site
  function rede(d) {
    const lista = performance.getEntriesByType('resource').slice(-Math.min(Number(d && d.max) || 60, 200)).map(e => ({
      url: curto(e.name, 160), tipo: e.initiatorType, status: e.responseStatus || 0, ms: Math.round(e.duration), kb: Math.round((e.transferSize || 0) / 1024)
    }));
    const ruins = lista.filter(x => x.status >= 400 || (x.status === 0 && x.kb === 0 && x.ms > 0 && /fetch|xmlhttprequest|script|link/.test(x.tipo)));
    const lentas = lista.filter(x => x.ms > 2000);
    return { ok: true, url: location.href, total: lista.length, comErro: ruins, lentas: lentas, ultimas: lista.slice(-25) };
  }

  // "ao vivo": selo dourado no canto + contorno no que ela está mexendo (igual o Claude no Chrome), some sozinho
  function aoVivo(texto, el) {
    try {
      let b = document.getElementById('__zicoaiSelo');
      if (!b) { b = document.createElement('div'); b.id = '__zicoaiSelo'; b.style.cssText = 'position:fixed;z-index:2147483647;right:12px;bottom:12px;background:#1c1706;color:#F4CB63;border:1px solid #EBB533;border-radius:999px;padding:7px 12px;font:600 12px system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.4);pointer-events:none;transition:opacity .3s'; document.documentElement.appendChild(b); }
      b.textContent = '⚡ ZicoAI: ' + texto; b.style.opacity = '1';
      clearTimeout(self.__zicoSeloT); self.__zicoSeloT = setTimeout(() => { b.style.opacity = '0'; }, 2500);
      if (el && el.style) { const o = el.style.outline; el.style.outline = '3px solid #EBB533'; el.style.outlineOffset = '2px'; setTimeout(() => { el.style.outline = o; }, 1500); }
    } catch (e) { /* visual só */ }
  }
  const _ler = ler, _clicar = clicar, _preencher = preencher, _rolar = rolar;
  ler = d => { aoVivo('lendo a página'); return _ler(d); };
  rolar = d => { aoVivo('rolando'); return _rolar(d); };
  tabelas = (f => d => { aoVivo('lendo as tabelas'); return f(d); })(tabelas);
  rede = (f => d => { aoVivo('olhando a rede'); return f(d); })(rede);
  clicar = d => { const r = _clicar(d); aoVivo(r && r.ok ? 'clicou em "' + r.clicou + '"' : 'não achou onde clicar', r && r.seletor ? document.querySelector(r.seletor) : null); return r; };
  preencher = d => { const r = _preencher(d); aoVivo(r && r.ok ? 'preencheu' : 'não preencheu'); return r; };

  self.ZicoPagina = { ler: ler, clicar: clicar, preencher: preencher, rolar: rolar, tabelas: tabelas, rede: rede };
})();
