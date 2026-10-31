# B10: App de 1 arquivo HTML, escuro, mobile-first (e a tela do iPhone)

**Regra:** Faça o app inteiro em um `index.html` (HTML + CSS + JS, sem framework e sem build), pensado primeiro pro celular. Use `viewport-fit=cover`, `env(safe-area-inset-*)` e fontes locais. No iPhone, nunca force a altura do app maior que a área visível.
**Palavras-chave:** app de um arquivo só, html único, mobile first, tema escuro, tela do iphone, faixa preta embaixo, última fileira cortada, safe area, notch, barra de status, fonte local, ios 26, tela inicial, calculadora
**Projeto(s):** Calculadora-do-zicao, maquininha, emprestimo

## Exemplo real
O Thiago queria uma calculadora com ferramentas de loja, que ele usa no iPhone e no Mac. Ela virou um único `index.html` (README da maquininha: "Não tem build, framework nem `npm install`: é um arquivo HTML estático"). No iOS 26, o app instalado na tela inicial ficou com faixa preta embaixo e a última fileira de teclas cortada. Foram 7 commits de ajuste até acertar.

## Como foi feito
Cabeçalho do `index.html` da calculadora (trecho, linhas 5-13 sem as linhas 6, 9, 11 e 12; copiado):
```html
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black"/>
<meta name="theme-color" content="#0e0e0e"/>
```
- Cor de fundo escura em `html,body` (`background:var(--bg,#0e0e0e)`) pra não piscar branco.
- Respiro do notch com `max(env(safe-area-inset-top,0px),14px)` (e igual pro bottom/left/right).
- Fontes em `fonts/*.woff2` com `@font-face` (local, funciona offline), não do Google.
- Preferências (tema, som, vibração) em `localStorage`, sempre dentro de `try/catch`.
- Altura: `fitHeight()` usa só `window.innerHeight` (versão final):
```js
var h=window.innerHeight;
outerEl.style.bottom='auto';outerEl.style.height=h+'px';
```

## Erros que já aconteceram
- f73573f: faixa vazia embaixo no app da tela inicial. Correção tentada: forçar altura da tela (`screen.height`).
- 311d755: tela de abertura (splash), `overflow:clip` e `id` no manifest fizeram a última fileira ser cortada de novo. Foram desfeitos.
- bc5a8e8: depois de recarregar dentro do app da tela inicial o iOS encolhe a área visível. Forçar altura cortava a última fileira.
- dba960c: forçar altura maior que a área visível era a causa do corte no iOS 26. Passou a nunca passar de `innerHeight`.
- 01406d0: com `status-bar-style` = `black-translucent` o iOS 26 encolhe o app (faixa preta) e borra o topo. Troca por `black` (opaca) resolveu os dois.
- ffe4de1: sem respiro embaixo das teclas. Voltou `padding-bottom:max(safe-area-bottom,24px)` só em toque (`hover:none` e `pointer:coarse`).
- b4c7bf6: costura visível entre moldura e fundo. A moldura (borda/cantos) agora só aparece em tela grande.

## Lições
1. Mexeu em layout do iPhone: teste no app instalado na tela inicial, não só no Safari. Os bugs só aparecem lá.
2. Mudar uma coisa por vez. Três "correções" seguidas desfizeram umas às outras.
3. Barra de status opaca (`black`) é mais estável no iOS 26 que `black-translucent`.
4. Não use `overflow:clip`, splash e `id` no manifest sem testar o corte da última fileira.
5. Sempre mexeu no app? Suba a versão do `sw.js` (ver B12), senão o iPhone mostra a cópia velha.

Fontes: Calculadora-do-zicao/index.html, maquininha/README.md; commits f73573f, 311d755, bc5a8e8, dba960c, 01406d0, ffe4de1, b4c7bf6.
