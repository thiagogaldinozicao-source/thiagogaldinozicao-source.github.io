const ORIGEM = 'https://thiagogaldinozicao-source.github.io';
const aviso = t => { document.getElementById('aviso').textContent = t; };

async function pegarPagina(soTrecho) {
  aviso('Lendo a página...');
  try {
    const [aba] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!aba || !/^https?:/.test(aba.url || '')) { aviso('Abre um site normal (http/https) pra eu ler.'); return; }
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: aba.id },
      func: () => ({
        titulo: document.title,
        url: location.href,
        selecao: String(window.getSelection() || ''),
        texto: (function () {   // WhatsApp Web: só a conversa aberta (sem a lista de outros clientes)
          const z = /(^|\.)web\.whatsapp\.com$/.test(location.hostname) && document.querySelector('#main');
          const t = z ? 'Conversa aberta no WhatsApp: ' + ((z.querySelector('header') || {}).innerText || '').split('\n')[0] + '\n\n' + (z.innerText || '').split('\n').slice(-120).join('\n') : (document.body && document.body.innerText || '');
          return t.replace(/\n{3,}/g, '\n\n').slice(-30000);
        })()
      })
    });
    const d = res && res.result;
    if (!d) { aviso('Não consegui ler esta página.'); return; }
    if (soTrecho && !d.selecao.trim()) { aviso('Seleciona um trecho na página primeiro.'); return; }
    if (soTrecho) d.texto = '';
    document.getElementById('app').contentWindow.postMessage(Object.assign({ tipo: 'zicoai-pagina' }, d), ORIGEM);
    aviso('Pronto: "' + d.titulo.slice(0, 60) + '" foi pra caixa da ZicoAI. Agora é só perguntar.');
  } catch (e) {
    aviso('Não deu pra ler esta página (' + e.message + ').');
  }
}
document.getElementById('usar').onclick = () => pegarPagina(false);
document.getElementById('trecho').onclick = () => pegarPagina(true);

/* ---------- Conectar a ZicoAI ao Chrome (v2.0): segredo e link guardados só neste Chrome ---------- */
const URL_PADRAO = 'https://script.google.com/macros/s/AKfycbzQXrIM8oV2Gygqm_4DA-_4li3mdicbmfnThdieLvNEvsNYoj6jyVPKWo-6CBSyP-aOow/exec';
const $ = id => document.getElementById(id);
function mostrarEstado(e, temSegredo) {
  const vivo = e && e.ok && Date.now() - e.quando < 90000;
  $('bola').className = 'bola' + (vivo ? ' ok' : '');
  $('estado').textContent = !temSegredo ? 'Conectar a ZicoAI ao Chrome' : vivo ? 'ZicoAI conectada ao Chrome' : (e && e.msg ? e.msg : 'Conectando...');
}
async function carregarConexao() {
  const c = await chrome.storage.local.get(['zicoUrl', 'zicoSegredo', 'zicoEstado']);
  $('url').value = c.zicoUrl || URL_PADRAO;
  $('segredo').value = c.zicoSegredo ? '••••••••' : '';
  $('con').open = !c.zicoSegredo;
  mostrarEstado(c.zicoEstado, !!c.zicoSegredo);
}
$('salvar').onclick = async () => {
  const seg = $('segredo').value.trim(), url = $('url').value.trim() || URL_PADRAO;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) { $('estado').textContent = 'Link do cérebro estranho: tem que terminar em /exec'; return; }
  const novo = { zicoUrl: url };
  if (seg && seg !== '••••••••') novo.zicoSegredo = seg;
  else if (!(await chrome.storage.local.get('zicoSegredo')).zicoSegredo) { $('estado').textContent = 'Cole o segredo primeiro.'; return; }
  await chrome.storage.local.set(novo);
  $('estado').textContent = 'Conectando...';
  chrome.runtime.sendMessage({ tipo: 'zicoai-ligar' }).catch(() => {});
  $('segredo').value = '••••••••';
};
$('desligar').onclick = async () => {
  await chrome.storage.local.remove(['zicoSegredo', 'zicoEstado']);
  $('segredo').value = '';
  mostrarEstado(null, false);
};
chrome.storage.onChanged.addListener((mud, area) => {
  if (area === 'local' && (mud.zicoEstado || mud.zicoSegredo)) chrome.storage.local.get(['zicoSegredo', 'zicoEstado']).then(c => mostrarEstado(c.zicoEstado, !!c.zicoSegredo));
});
setInterval(() => chrome.storage.local.get(['zicoSegredo', 'zicoEstado']).then(c => mostrarEstado(c.zicoEstado, !!c.zicoSegredo)), 15000);
carregarConexao();
