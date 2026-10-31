/* ZicoAI no Chrome: vigia de erros (roda DENTRO da página, no mundo da própria página, antes de tudo).
 * Só ANOTA: erros de JavaScript, console.error, promessa sem tratamento e falha de rede/arquivo.
 * Não manda nada pra lugar nenhum; a extensão lê a lista quando a ZicoAI pede (ação "erros").
 */
(function () {
  if (window.__zicoErros) return;
  const lista = [];
  const MAX = 200;
  Object.defineProperty(window, '__zicoErros', { value: lista, enumerable: false });
  const anota = (tipo, msg, onde) => {
    try {
      if (lista.length >= MAX) lista.shift();
      lista.push({ tipo: tipo, msg: String(msg == null ? '' : msg).slice(0, 600), onde: String(onde || '').slice(0, 300), quando: Date.now() });
    } catch (e) { /* nunca quebra a página */ }
  };
  const texto = a => { try { return a instanceof Error ? (a.stack || a.message) : typeof a === 'object' ? JSON.stringify(a) : String(a); } catch (e) { return String(a); } };

  // erro de JavaScript e arquivo que não carregou (img, script, css): fase de captura pega os dois
  window.addEventListener('error', ev => {
    const alvo = ev.target;
    if (alvo && alvo !== window && alvo.tagName) {
      anota('arquivo', 'não carregou: <' + alvo.tagName.toLowerCase() + '>', alvo.src || alvo.href || '');
    } else {
      anota('js', ev.message || texto(ev.error), (ev.filename || '') + (ev.lineno ? ':' + ev.lineno + ':' + ev.colno : ''));
    }
  }, true);
  window.addEventListener('unhandledrejection', ev => anota('promessa', texto(ev.reason), ''));

  // console.error continua aparecendo no console normal
  const erroOriginal = console.error;
  console.error = function () {
    try { anota('console', Array.prototype.map.call(arguments, texto).join(' '), ''); } catch (e) { /* ok */ }
    return erroOriginal.apply(this, arguments);
  };

  // fetch e XHR: anota resposta 400+ e falha de rede (a resposta continua igual pra página)
  const fetchOriginal = window.fetch;
  if (typeof fetchOriginal === 'function') {
    window.fetch = function (entrada) {
      const url = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || String(entrada);
      const p = fetchOriginal.apply(this, arguments);
      p.then(r => { if (r && r.status >= 400) anota('rede', 'fetch ' + r.status + ' ' + (r.statusText || ''), url); },
             e => anota('rede', 'fetch falhou: ' + texto(e && e.message || e), url));
      return p;
    };
  }
  const XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype) {
    const abrir = XHR.prototype.open, enviar = XHR.prototype.send;
    XHR.prototype.open = function (metodo, url) { try { this.__zicoUrl = String(url); } catch (e) { /* ok */ } return abrir.apply(this, arguments); };
    XHR.prototype.send = function () {
      try {
        this.addEventListener('loadend', () => {
          if (this.status >= 400) anota('rede', 'XHR ' + this.status, this.__zicoUrl);
          else if (this.status === 0) anota('rede', 'XHR falhou (sem resposta / CORS / offline)', this.__zicoUrl);
        });
      } catch (e) { /* ok */ }
      return enviar.apply(this, arguments);
    };
  }
})();
