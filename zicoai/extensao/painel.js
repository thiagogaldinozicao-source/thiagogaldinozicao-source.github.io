const ORIGEM = 'https://thiagogaldinozicao-source.github.io';
// v2.6: este painel é DESTA aba (cada aba tem a sua ZicoAI e a sua conversa)
const ABA = Number(new URLSearchParams(location.search).get('aba')) || 0;
document.getElementById('app').src = ORIGEM + '/zicoai/?ext=1' + (ABA ? '&aba=' + ABA : '');
async function minhaAba() {
  if (ABA) { const a = await chrome.tabs.get(ABA).catch(() => null); if (a) return a; }
  const [aba] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return aba;
}
let avisoTmr = null;
const aviso = t => { const a = document.getElementById('aviso'); a.textContent = t; a.classList.add('on'); clearTimeout(avisoTmr); avisoTmr = setTimeout(() => a.classList.remove("on"), 9000); };

async function pegarPagina(soTrecho) {
  aviso('Lendo a página...');
  try {
    const aba = await minhaAba();
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
    if (soTrecho && !d.selecao.trim()) { aviso('Nada selecionado: no site, segura o clique e passa o mouse por cima do texto (igual pra copiar) e toque em "Seleção" de novo.'); return; }
    if (soTrecho) d.texto = '';
    document.getElementById('app').contentWindow.postMessage(Object.assign({ tipo: 'zicoai-pagina' }, d), ORIGEM);
    aviso(soTrecho ? 'Pronto: o trecho selecionado foi pra caixa da ZicoAI. Agora é só perguntar.' : 'Pronto: o texto de "' + d.titulo.slice(0, 60) + '" foi pra caixa da ZicoAI (texto, não print). Agora é só perguntar.');
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
  $('estado').textContent = !temSegredo ? 'Conectar ao Chrome' : vivo ? 'Conectada' : (e && e.msg ? String(e.msg).slice(0, 40) : 'Conectando...');
  $('bEstado').title = !temSegredo ? 'Conectar a ZicoAI ao Chrome' : vivo ? 'ZicoAI conectada ao Chrome (toque pra ver a conexão)' : (e && e.msg) || 'Conectando...';
  if (vivo && fecharQuandoLigar) { $('con').classList.remove('on'); fecharQuandoLigar = false; }
}
let fecharQuandoLigar = false;
$('bEstado').onclick = () => $('con').classList.toggle('on');
async function carregarConexao() {
  const c = await chrome.storage.local.get(['zicoUrl', 'zicoSegredo', 'zicoEstado']);
  $('url').value = c.zicoUrl || URL_PADRAO;
  $('segredo').value = c.zicoSegredo ? '••••••••' : '';
  $('con').classList.toggle('on', !c.zicoSegredo);   // segredo já salvo: a caixa fica escondida
  mostrarEstado(c.zicoEstado, !!c.zicoSegredo);
}
$('salvar').onclick = async () => {
  const seg = $('segredo').value.trim(), url = $('url').value.trim() || URL_PADRAO;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) { $('estado').textContent = 'Link do cérebro estranho: tem que terminar em /exec'; return; }
  const novo = { zicoUrl: url };
  if (seg && seg !== '••••••••') novo.zicoSegredo = seg;
  else if (!(await chrome.storage.local.get('zicoSegredo')).zicoSegredo) { $('estado').textContent = 'Cole o segredo primeiro.'; return; }
  await chrome.storage.local.set(novo);
  $('estado').textContent = 'Conectando...'; fecharQuandoLigar = true;
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
// mantém a extensão acordada enquanto o painel estiver aberto (ação começa na hora)
(function vivo() {
  let porta = null;
  const ligar = () => { try { porta = chrome.runtime.connect({ name: 'zicoai-vivo' }); porta.onDisconnect.addListener(() => setTimeout(ligar, 1000)); } catch (e) { setTimeout(ligar, 5000); } };
  ligar();
  setInterval(() => { try { porta && porta.postMessage({ t: Date.now() }); } catch (e) { /* religa no onDisconnect */ } }, 20000);
})();
