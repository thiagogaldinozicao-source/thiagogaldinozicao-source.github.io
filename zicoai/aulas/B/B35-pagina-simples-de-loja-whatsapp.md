# B35: Página simples de loja (catálogo, link bonito no WhatsApp, redirecionar site antigo)

**Regra:** Página estática de um arquivo só (`index.html`) no GitHub Pages: lista de produtos em array JS, botão `wa.me` com mensagem pronta e meta tags `og:` para o link aparecer com foto no WhatsApp. Imagem nova de preview = mude a URL (`?v=2`).
**Palavras-chave:** site da loja, catálogo, página simples, github pages, link whatsapp, preview do link, og:image, wa.me, lista de produtos, xiaomi, realme, redirecionar site, simulador, copiar tabela, cache
**Projeto(s):** android, zicaostore, melo-imports

## Exemplo real
Páginas da Zicão Store: catálogo de Xiaomi/Realme lacrados (`android`), o site `zicaostore` que virou atalho para o catálogo novo, e o simulador de parcelas da Melo Imports (`melo-imports`, "Simulador" que copia a tabela de parcelas para colar no WhatsApp).

## Como foi feito
1. Produtos num array no próprio HTML; para adicionar um modelo, acrescente uma linha:
```js
const XIAOMI = [
{marca:"POCO", modelo:"POCO C71", cap:"4/128GB", cor:"Preto", preco:"1.119", foto:""},
```
O JS monta os cards; sem `foto`, usa um quadradinho com a cor do aparelho.
2. WhatsApp: constante `WHATS` (DDI+DDD+número, só dígitos) e links `https://wa.me/${WHATS}?text=${msg}` por produto ("Tenho interesse").
3. Preview do link: `og:title`, `og:description`, `og:image` (1200x630), `og:url`, `twitter:card`, mais `theme-color`.
4. Site antigo vira atalho (`zicaostore/index.html`): script que lê o `#hash` antigo, traduz por um mapa e manda para a seção certa do catálogo, com `<meta http-equiv="refresh">` e link manual como reserva:
```js
var mapa = {'iphone-usado':'iphone-semi', 'android-xiaomi':'android', /* ... */};
location.replace('https://.../catalogo/' + (h ? '#' + (mapa[h] || h) : ''));
```
5. Simulador: cálculo `total = valor/(1-taxa/100)`, parcela = total/parcelas, e `copiarTexto()` monta linhas alinhadas com `padStart` para colar no zap.

## Erros que já aconteceram
- Troca da imagem do link: o commit só muda a URL para `preview.png?v=2` (28d010c). Causa não registrada; o motivo provável é cache de preview.
- O array do catálogo tinha fotos em base64 em cada linha. O commit 77e422b tirou as fotos (`foto:""`) e passou a usar o cartão com a cor do aparelho. Causa não registrada; base64 incha o HTML.
- No simulador, foram acrescentadas metas `Cache-Control: no-cache` (f01721d). Motivo não registrado.
- No texto copiado para o zap, "Déb" virou "Deb" (077d9f6). Motivo não registrado.
- Commits "Update print statement from 'Hello' to 'Goodbye'" são ruído de teste, não funcionalidade.

## Lições
1. Para loja pequena, um HTML só com dados em array já resolve; separe dados e layout.
2. Preview de link: sempre `og:image`; ao trocar a imagem, mude a URL (`?v=2`).
3. Ao mudar de site, mantenha os links antigos funcionando (mapa de `#hash`).
4. Não ponha foto em base64 no HTML; use arquivo ou uma cor.
5. Preço e número de WhatsApp ficam em constantes no topo do arquivo.

Fontes: android/index.html, zicaostore/index.html, melo-imports/index.html, commits android 77e422b; zicaostore 28d010c, f0cd8f1, 6f2e031; melo-imports 077d9f6, f01721d.
