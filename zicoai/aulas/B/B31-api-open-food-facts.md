# B31: Buscar produto numa API pública grátis (Open Food Facts)

**Regra:** Consulte a base aberta direto do app, pedindo só os campos que usa (`fields=`), com prazo (AbortController) e cache. Trate 404 como "não achou", 503/rede como "tentar de novo". Dê crédito (licença ODbL).
**Palavras-chave:** open food facts, api grátis, base de produtos, código de barras, ean, ingredientes, nutri-score, nova, fetch, timeout, 503, cors, cadastro de produto, off
**Projeto(s):** leva-ou-nao

## Exemplo real
Depois de ler o código, o app precisava de nome, ingredientes, aditivos e NOVA do produto, sem pagar nada. Entregue: busca no Open Food Facts (OFF) e nas bases irmãs (cosméticos, pet, limpeza), com prazo e cache. Se a base não tem o produto, o usuário lê o rótulo.

## Como foi feito
1. Lista de bases, na ordem (a primeira que achar ganha) e só os campos necessários (de `www/index.html`, trecho):
```js
const BASES = [
  ["world.openfoodfacts.org", "alimento", "off"],
  ["world.openbeautyfacts.org", "cosmetico", "obf"], /* pet, limpeza... */
];
fetch(`https://${site}/api/v2/product/${code}.json?fields=${FIELDS}`, { signal })
```
2. `comPrazo(ms, fn)` aborta a chamada (cabeçalho e corpo) depois de 8 s: rede ruim no mercado não pode deixar o "Buscando…" para sempre.
3. `404` vira `null`; resposta `status === 1 && product` vira produto; outro erro lança.
4. Se OFF falha por rede, lança (sem internet). Se só as irmãs falham, conta como "não achou".
5. Cache em `Map` por código; se der erro, apaga a entrada do cache.
6. A busca de categoria ("Tem melhor?") tenta de novo até 3 vezes com espera crescente em 503/429:
```js
if (i >= 3 || (res && res.status !== 503 && res.status !== 429)) throw falha();
await new Promise((ok, erro) => {   // prazo estourou no meio da espera = para aqui, sem mais um fetch
  const t = setTimeout(ok, 700 * (i + 1));
  signal.addEventListener("abort", () => { clearTimeout(t); erro(falha()); }, { once: true });
});
```
7. A CSP precisa liberar cada domínio em `connect-src` e `img-src`.
8. Se um dia precisar de base própria: Cloudflare Worker + D1 (`api/`), mesmo formato de resposta do OFF, e o app cai pro caminho direto se a API cair (`API_URL` vazio = como antes).

## Erros que já aconteceram
- A busca por categoria do OFF devolve 503 em boa parte das chamadas e o 503 vem SEM CORS: no navegador parece "erro de rede". Correção: retry automático e mensagem "Busca ocupada, toca de novo" (a8ba693).
- "Nescau" sugeria café e Pepsi como troca: o último tag de categoria do OFF mistura ramos. Correção: escolher a categoria pela taxonomia do OFF (7cfcd1e, 8fc1e17).
- Perfil "açúcar" cortava a lista de ingredientes em 700 caracteres (b78a968): leia a lista inteira.
- OFF pede `User-Agent` no formato `NomeDoApp/versão (contato)` (no Worker).

## Lições
1. Peça só os campos que usa e sempre ponha prazo na chamada.
2. Separe "não existe" (404) de "deu erro" (rede/503).
3. Dado do OFF é ODbL: mostre a fonte; o que misturar herda a licença.
4. Chave de API nunca no app nem no repo.

Fontes: leva-ou-nao `www/index.html` (faixa busca), `www/troca.js`, `api/README.md`, CLAUDE.md (Invariantes), commits a8ba693, 7cfcd1e, 8fc1e17, b78a968.
