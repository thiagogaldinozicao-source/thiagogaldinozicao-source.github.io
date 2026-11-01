# D36: testar antes de entregar (contas, links, app) (31/10/2026)

**Regra:** Antes de entregar, TESTA: conta refeita por código (soma, parcela, porcentagem; erro é corrigido no texto, arredondamento da loja é aceito), link aberto (o que não abre ganha ⚠️), app testado no navegador do Mac antes de publicar (com erro não publica), fato com fonte da web, etapa do agente só ✅ com prova. Dizer "pronto" é depois de conferir, não antes.
**Palavras-chave:** testar antes de entregar, conferir conta, parcela, porcentagem, soma, link quebrado, publicar app, testado, pronto, não falhar

## Por quê
- O Claude também erra; ele parece que "não falha" porque confere antes de entregar e vê o erro primeiro. O cérebro grátis erra conta e inventa link com cara de certo.
- Conta errada em preço ou parcela é prejuízo ou cliente bravo; link quebrado é vergonha. Os dois dá pra conferir por código, de graça, em milissegundos.
- App publicado com erro: o Thiago descobre no celular do cliente. Testar antes no navegador do Mac pega o erro antes.

## Como funciona por baixo
- `conferirAntesDeEntregar(texto)` roda em toda resposta do chat e no resultado do agente: `conferirContas` + `conferirLinks`.
- `conferirContas`: acha "A op B = C" (x × * + - / ÷), "N% de A = B" e "12x de R$ V = R$ T"; lê número brasileiro (`numeroBR`), refaz e troca o resultado errado mantendo o formato (`formatarComo`). Fica de fora bloco de código (```js/html/...); texto pra cliente em ``` é conferido. Valor sem centavos com diferença de até R$ 1, ou terminando em 9 até R$ 10, é arredondamento da loja ("põe 100 de lucro" = 2.089). Números com tamanho limitado e sem começar no meio de outro: texto com base64 não trava.
- `conferirLinks`: abre até 5 links (fetchAll); 404/410/5xx ou site que não existe → "⚠️ _(esse link não abriu agora)_". Imagem gerada, WhatsApp e Apps Script ficam de fora; 403 de site que bloqueia robô não conta como quebrado.
- `publicar_app` chama `testarApp` antes: com erro devolve a lista e NÃO publica.

## Situações em que aparece
- "quanto fica 12x de 150?", "faz a lista com 10% de desconto", "me manda o link", "publica o app".

## Exemplo
- Cérebro escreveu "12x de R$ 150,00 = R$ 1.700,00" → entregue "R$ 1.800,00" e passo "Conferiu as contas: corrigiu 1".

## Erro comum
- Corrigir arredondamento de propósito da loja (2.090 → 2.089 é regra, não erro).
- Conferir conta dentro de código (2 + 2 num exemplo de JS) e estragar o código.
- Achar que 403 é link quebrado (Amazon, Mercado Livre bloqueiam robô).

## Como conferir
- Teste `t48`. No app, os passos "Conferiu N conta(s)…", "Abriu N link(s)…".
