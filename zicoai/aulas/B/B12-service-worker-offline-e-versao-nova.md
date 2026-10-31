# B12: Service worker: abrir sem internet e atualizar o cache

**Regra:** Cada app tem um `sw.js` com a versão do cache no topo: `VERSAO` (emprestimo/maquininha) ou `CACHE` (calculadora). Mexeu em qualquer arquivo do app, aumente esse valor (ex.: `calc-v15`, `emprestimo-v3`), senão o celular fica com a versão velha. Página: rede primeiro; resto: cache e atualiza por trás.
**Palavras-chave:** service worker, offline, sem internet, cache, atualizar app, versão nova, celular mostra versão antiga, não atualiza, limpar cache, sw.js, nova versão disponível, pwa
**Projeto(s):** Calculadora-do-zicao, maquininha, emprestimo

## Exemplo real
O Thiago atende cliente em lugar com sinal ruim: o app tem que abrir sem internet. Mas depois de cada mudança o iPhone insistia na versão antiga. Solução: versão do cache (`VERSAO`/`CACHE`) no `sw.js` (limpa o cache velho) e, na calculadora, um aviso "Nova versão disponível".

## Como foi feito
Padrão simples (emprestimo/maquininha), copiado:
```js
const VERSAO = 'emprestimo-v3';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './favicon.svg', ...];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
```
- `fetch`: se `req.mode === 'navigate'`, tenta `fetch(req)` e cai em `caches.match('./index.html')` se estiver offline.
- Outros arquivos: `caches.match(req, { ignoreSearch: true })` e atualiza em segundo plano. O `ignoreSearch` faz `icone.png?v=2` achar o cache.
- Registrar: `navigator.serviceWorker.register('sw.js')` dentro de `window.addEventListener('load', ...)`.
- Só aceite resposta `res.ok` ou `opaque` antes de guardar no cache.
- Calculadora (mais completa): compara `etag`/`last-modified` do `index.html` e manda `postMessage({t:'upd'})`; o app mostra o aviso `#upd`.
- Dentro do app Capacitor (`NATIVE`), o service worker nem é registrado.

## Erros que já aconteceram
- Maquininha 839795f: faltava o modo offline; foi adicionado o `sw.js`.
- Calculadora bc5a8e8: recarregar a página sozinho ao chegar versão nova bagunçava a altura da tela no app da tela inicial do iPhone. Agora, no iPhone o aviso diz "Nova versão pronta · feche e abra o app" e não dá `location.reload()`.
- Cada commit de ajuste da calculadora mexeu em `sw.js` (versão) junto com o `index.html`; esquecer isso deixa o celular no código antigo (aviso do README do emprestimo).

## Lições
1. `index.html` + `sw.js` (nova `VERSAO`/`CACHE`) sempre no mesmo commit.
2. Página com rede primeiro (pega atualização), assets com cache primeiro.
3. No iPhone instalado, não recarregue sozinho; avise e peça pra fechar e abrir.
4. Pra testar offline, sirva com `python3 -m http.server`, não abrindo o arquivo direto.

Fontes: emprestimo/sw.js, maquininha/sw.js, Calculadora-do-zicao/sw.js, emprestimo/README.md; commits 4d8ac46, 839795f, bc5a8e8, e8495f4.
