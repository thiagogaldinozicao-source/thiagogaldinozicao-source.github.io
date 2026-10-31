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
        texto: (document.body && document.body.innerText || '').replace(/\n{3,}/g, '\n\n').slice(0, 30000)
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
