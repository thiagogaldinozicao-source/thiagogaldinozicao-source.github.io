/* ZicoAI no Chrome v2.0: a "ponte do navegador" (aparelho "nav").
 * Igual a ponte do PC e do Mac: a extensão BUSCA os pedidos no cérebro (long-poll, nada aberto no PC),
 * faz no Chrome e devolve a resposta. Ações: status, abas, ler, erros, clicar, preencher, rolar, abrir, print, tabelas, rede.
 *
 * LIMITAÇÃO do Chrome (MV3): o service worker "dorme" quando fica parado. Por isso:
 *  - um alarme (chrome.alarms) acorda a extensão a cada ~30 s e religa o laço;
 *  - enquanto acordada, ela fica num laço de busca (cada busca espera até 20 s no cérebro);
 *  - Chrome FECHADO = ZicoAI sem acesso ao navegador ("Chrome fechado ou extensão desligada").
 */
importScripts('seguranca.js');
const S = self.ZicoSeguranca;
const VERSAO = 'nav-2.0';
const URL_PADRAO = 'https://script.google.com/macros/s/AKfycbzQXrIM8oV2Gygqm_4DA-_4li3mdicbmfnThdieLvNEvsNYoj6jyVPKWo-6CBSyP-aOow/exec';
const ALARME = 'zicoai-ponte';
const LIMITE_PRINT = 300000;   // ~300 KB de base64 no máximo

// clicar no ícone da extensão abre o painel lateral com a ZicoAI
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

/* ---------- acordar e ficar buscando ---------- */
function criarAlarme() {
  chrome.alarms.get(ALARME).then(a => { if (!a) chrome.alarms.create(ALARME, { periodInMinutes: 0.5 }); }).catch(() => {});
}
chrome.runtime.onInstalled.addListener(() => { criarAlarme(); laco(); });
chrome.runtime.onStartup.addListener(() => { criarAlarme(); laco(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === ALARME) laco(); });
chrome.runtime.onMessage.addListener((m, quem, responder) => {
  if (quem.id !== chrome.runtime.id || !m || m.tipo !== 'zicoai-ligar') return;
  criarAlarme(); laco(); responder({ ok: true });
});
criarAlarme(); laco();   // toda vez que o service worker acorda
// Painel aberto = ZicoAI ao vivo: o painel mantém uma porta aberta e manda um sinal a cada 20 s, aí o Chrome não põe
// a extensão pra dormir e o pedido começa na hora (sem esperar o alarme de 30 s).
chrome.runtime.onConnect.addListener(porta => {
  if (porta.name !== 'zicoai-vivo') return;
  laco();
  porta.onMessage.addListener(() => laco());
});

const esperar = ms => new Promise(r => setTimeout(r, ms));

async function config() {
  const c = await chrome.storage.local.get(['zicoUrl', 'zicoSegredo']);
  return { url: String(c.zicoUrl || URL_PADRAO).trim(), segredo: String(c.zicoSegredo || '').trim() };
}
async function estado(ok, msg) {
  try { await chrome.storage.local.set({ zicoEstado: { ok: ok, msg: String(msg).slice(0, 200), quando: Date.now(), versao: VERSAO } }); } catch (e) { /* ok */ }
}
async function chamar(cfg, corpo, ms) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 45000);
  try {
    const r = await fetch(cfg.url, { method: 'POST', body: JSON.stringify(Object.assign({ segredo: cfg.segredo }, corpo)), credentials: 'omit', redirect: 'follow', signal: ctl.signal });
    const txt = await r.text();
    try { return JSON.parse(txt); } catch (e) { throw new Error('resposta estranha do Google (confira o link do cérebro)'); }
  } finally { clearTimeout(t); }
}
function plataforma() {
  const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  return /mac/i.test(p) ? 'Mac' : /win/i.test(p) ? 'Windows' : p || '?';
}

let rodando = false;
async function laco() {
  if (rodando) return;
  rodando = true;
  let falhas = 0;
  try {
    while (true) {
      const cfg = await config();
      if (!cfg.segredo) { await estado(false, 'Não conectado: cole o segredo no painel.'); return; }
      let r;
      try { r = await chamar(cfg, { acao: 'ponteBuscar', dispositivo: 'nav', nome: 'Chrome (' + plataforma() + ')', versao: VERSAO }); }
      catch (e) {
        falhas++;
        await estado(false, 'Sem conexão com a ZicoAI: ' + (e.name === 'AbortError' ? 'demorou demais' : e.message));
        await esperar(Math.min(25000, 5000 * falhas));
        continue;
      }
      if (!r || !r.ok) { await estado(false, 'A ZicoAI recusou: ' + (r && r.erro || '?') + (r && r.erro === 'segredo errado' ? ' (confira o segredo colado)' : '')); return; }
      falhas = 0;
      await estado(true, 'Conectado');
      for (const p of (r.pedidos || [])) {
        let res;
        try { res = await executar(String(p.acao || ''), p.dados || {}); }
        catch (e) { res = { ok: false, erro: String(e && e.message || e).slice(0, 300) }; }
        try { await chamar(cfg, { acao: 'ponteResposta', id: p.id, resultado: JSON.stringify(res) }, 60000); }
        catch (e) { await estado(false, 'Não consegui mandar a resposta: ' + e.message); }
      }
    }
  } finally { rodando = false; }
}

/* ---------- as ações ---------- */
async function acTabelas(d) { const aba = await abaAlvo(d); return naPagina(aba, 'tabelas', { linhas: d.linhas }); }
async function acRede(d) { const aba = await abaAlvo(d); return naPagina(aba, 'rede', { max: d.max }); }
const ACOES = { status: acStatus, abas: acAbas, ler: acLer, erros: acErros, clicar: acClicar, preencher: acPreencher, rolar: acRolar, abrir: acAbrir, print: acPrint, tabelas: acTabelas, rede: acRede };
/* ---------- depurador do Chrome: o mesmo jeito do Claude ----------
 * Ligar o depurador numa aba mostra a barra do Chrome "ZicoAI começou a depurar este navegador [Cancelar]" e deixa
 * a ZicoAI clicar com o MOUSE DE VERDADE (sites que ignoram clique de script, tipo WhatsApp, aceitam). Solta sozinho
 * depois de 60 s parada. "Cancelar" na barra ou "Parar ZicoAI" na página = ela para (10 min sem mexer). */
const depurando = {};   // abaId -> timer de soltar
let paradoAte = 0;
async function ligarDepurador(abaId) {
  if (depurando[abaId]) { clearTimeout(depurando[abaId]); depurando[abaId] = setTimeout(() => soltarDepurador(abaId), 60000); return true; }
  try { await chrome.debugger.attach({ tabId: abaId }, '1.3'); } catch (e) { if (!/already attached/i.test(e.message || '')) return false; }
  depurando[abaId] = setTimeout(() => soltarDepurador(abaId), 60000);
  return true;
}
async function soltarDepurador(abaId) { clearTimeout(depurando[abaId]); delete depurando[abaId]; try { await chrome.debugger.detach({ tabId: abaId }); } catch (e) { /* já soltou */ } }
chrome.debugger.onDetach.addListener((alvo, motivo) => {
  if (!alvo || alvo.tabId == null) return;
  clearTimeout(depurando[alvo.tabId]); delete depurando[alvo.tabId];
  if (motivo === 'canceled_by_user') { paradoAte = Date.now() + 10 * 60000; estado(true, 'Parada pelo Thiago (10 min)'); }
});
chrome.runtime.onMessage.addListener((m, quem) => {
  if (quem.id !== chrome.runtime.id || !m || m.tipo !== 'zicoai-parar') return;
  paradoAte = Date.now() + 10 * 60000;
  Object.keys(depurando).forEach(id => soltarDepurador(Number(id)));
  estado(true, 'Parada pelo Thiago (10 min)');
});
async function cliqueDeVerdade(abaId, x, y) {
  const cmd = (m, p) => chrome.debugger.sendCommand({ tabId: abaId }, m, p);
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x, y: y });
  await esperar(120);
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: x, y: y, button: 'left', clickCount: 1 });
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x, y: y, button: 'left', clickCount: 1 });
}
async function executar(acao, d) {
  if (Date.now() < paradoAte && !/^(status|abas)$/.test(acao)) return { ok: false, erro: 'o Thiago apertou PARAR: não mexo no Chrome por ' + Math.ceil((paradoAte - Date.now()) / 60000) + ' min' };
  const f = ACOES[acao];
  if (!f) return { ok: false, erro: 'Ação desconhecida no Chrome: ' + acao };
  return f(d || {});
}

async function abaAlvo(d) {
  let aba;
  if (d.abaId != null && d.abaId !== '') aba = await chrome.tabs.get(Number(d.abaId));
  else {
    [aba] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!aba || !/^https?:/.test(aba.url || '')) [aba] = await chrome.tabs.query({ active: true, windowType: 'normal' });
  }
  if (!aba) throw new Error('nenhuma aba aberta no Chrome');
  if (!/^https?:/.test(aba.url || '')) throw new Error('essa aba não é um site normal (http/https): ' + String(aba.url || '').slice(0, 60));
  const p = S.paginaProibida(aba.url, aba.title);
  if (p) throw new Error('não mexo em ' + p);
  return aba;
}
async function naPagina(aba, acao, d) {
  await chrome.scripting.executeScript({ target: { tabId: aba.id }, files: ['seguranca.js', 'pagina.js'] });
  const [r] = await chrome.scripting.executeScript({ target: { tabId: aba.id }, func: (a, x) => self.ZicoPagina[a](x), args: [acao, d] });
  if (!r) throw new Error('a página não respondeu');
  return r.result;
}
async function esperarCarregar(abaId, ms) {
  const fim = Date.now() + (ms || 20000);
  await esperar(300);
  while (Date.now() < fim) {
    const a = await chrome.tabs.get(abaId).catch(() => null);
    if (!a) return null;
    if (a.status === 'complete' && a.url && a.url !== 'about:blank') { await esperar(400); return (await chrome.tabs.get(abaId).catch(() => null)) || a; }   // o título chega um pouco depois
    await esperar(500);
  }
  return chrome.tabs.get(abaId).catch(() => null);
}

async function acStatus() {
  const abas = await chrome.tabs.query({});
  return { ok: true, nome: 'Chrome (' + plataforma() + ')', versao: VERSAO, abas: abas.length };
}
async function acAbas() {
  const abas = await chrome.tabs.query({});
  return { ok: true, abas: abas.map(a => {
    const prot = S.paginaProibida(a.url, a.title);
    return { id: a.id, titulo: prot ? '(página protegida)' : String(a.title || '').slice(0, 120), url: prot ? S.host(a.url) : String(a.url || '').slice(0, 300), ativa: !!a.active, janela: a.windowId };
  }) };
}
async function acLer(d) {
  const aba = await abaAlvo(d);
  const r = await naPagina(aba, 'ler', d);
  r.abaId = aba.id;
  return r;
}
async function acClicar(d) {
  const aba = await abaAlvo(d);
  let r;
  if (await ligarDepurador(aba.id)) {
    r = await naPagina(aba, 'clicar', { seletor: d.seletor, texto: d.texto, confirmado: d.confirmado === true, soOnde: true });   // as travas rodam aqui
    if (r && r.ok && r.x != null) {
      await esperar(500);   // o cursor da ZicoAI chega no botão
      try { await cliqueDeVerdade(aba.id, r.x, r.y); r.comMouse = true; }
      catch (e) { r = await naPagina(aba, 'clicar', { seletor: r.seletor, confirmado: d.confirmado === true }); }
    }
  } else r = await naPagina(aba, 'clicar', { seletor: d.seletor, texto: d.texto, confirmado: d.confirmado === true });
  if (r && r.ok) {
    await esperar(800);
    const depois = await chrome.tabs.get(aba.id).catch(() => null);
    if (depois) { r.urlDepois = depois.url; r.tituloDepois = depois.title; }
  }
  return r;
}
async function acPreencher(d) {
  const aba = await abaAlvo(d);
  return naPagina(aba, 'preencher', { seletor: d.seletor, rotulo: d.rotulo, valor: d.valor });
}
async function acRolar(d) {
  const aba = await abaAlvo(d);
  return naPagina(aba, 'rolar', { seletor: d.seletor, texto: d.texto, direcao: d.direcao, pixels: d.pixels });
}
async function acAbrir(d) {
  const dec = S.decidirAbrir(d.url);
  if (!dec.ok) return dec;
  const aba = d.abaId != null && d.abaId !== '' ? await chrome.tabs.update(Number(d.abaId), { url: String(d.url), active: true }) : await chrome.tabs.create({ url: String(d.url), active: true });
  const pronta = await esperarCarregar(aba.id, 20000);
  return { ok: true, abaId: aba.id, titulo: pronta ? pronta.title : '', url: pronta ? pronta.url : d.url, carregou: !!(pronta && pronta.status === 'complete') };
}
async function acErros(d) {
  let aba = await abaAlvo(d);
  if (d.recarregar === true) {
    await chrome.tabs.reload(aba.id);
    aba = (await esperarCarregar(aba.id, 25000)) || aba;
    await esperar(2500);   // dá tempo dos scripts da página rodarem e errarem
  }
  const [r] = await chrome.scripting.executeScript({ target: { tabId: aba.id }, world: 'MAIN', func: () => {
    const lista = window.__zicoErros;
    const rede = [];
    try {
      performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource')).forEach(e => {
        if (e.responseStatus >= 400) rede.push({ tipo: 'rede', msg: 'HTTP ' + e.responseStatus, onde: e.name.slice(0, 300) });
      });
    } catch (e) { /* navegador antigo */ }
    return { vigiando: Array.isArray(lista), erros: Array.isArray(lista) ? lista.slice(-100) : [], rede: rede.slice(0, 50) };
  } });
  const x = (r && r.result) || { vigiando: false, erros: [], rede: [] };
  const todos = x.erros.concat(x.rede.filter(e => !x.erros.some(o => o.onde === e.onde)));   // falha de rede que o vigia já anotou não repete
  return { ok: true, abaId: aba.id, titulo: aba.title, url: aba.url, vigiando: x.vigiando, total: todos.length, erros: todos.slice(-120),
    aviso: x.vigiando ? '' : 'Esta aba foi aberta antes da extensão ligar: só vieram as falhas de rede. Peça de novo com recarregar:true pra pegar os erros de JavaScript desde o começo.' };
}
async function blobBase64(blob) {
  const b = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
async function acPrint(d) {
  const aba = await abaAlvo(d);
  if (!aba.active) { await chrome.tabs.update(aba.id, { active: true }); await esperar(500); }
  const dataUrl = await chrome.tabs.captureVisibleTab(aba.windowId, { format: 'jpeg', quality: 70 });
  const bmp = await createImageBitmap(await (await fetch(dataUrl)).blob());
  let larg = Math.min(1280, bmp.width), q = 0.6, b64 = '', alt = 0;
  for (let i = 0; i < 7; i++) {
    alt = Math.round(bmp.height * larg / bmp.width);
    const tela = new OffscreenCanvas(larg, alt);
    tela.getContext('2d').drawImage(bmp, 0, 0, larg, alt);
    b64 = await blobBase64(await tela.convertToBlob({ type: 'image/jpeg', quality: q }));
    if (b64.length <= LIMITE_PRINT) break;
    larg = Math.round(larg * 0.8); q = Math.max(0.35, q - 0.08);
  }
  if (b64.length > LIMITE_PRINT) return { ok: false, erro: 'print grande demais mesmo reduzido' };
  return { ok: true, abaId: aba.id, titulo: aba.title, url: aba.url, mime: 'image/jpeg', largura: larg, altura: alt, base64: b64 };
}
