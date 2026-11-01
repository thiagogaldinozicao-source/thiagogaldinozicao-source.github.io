# D45: um pedido por vez e nunca trocar o app por um menor (01/11/2026)

**Regra:** Em cada conversa roda UM pedido por vez: se chegar outro com o anterior rodando, avise pra esperar. App que já existe só muda por trechos; arquivo inteiro que encolhe (menos de 85% do original) é recusado e nada é salvo. Rascunho muito menor que o app de verdade está estragado: volte pro original.
**Palavras-chave:** dois pedidos, ao mesmo tempo, corrige, ainda trabalhando, rascunho, estragou, outro app, arquivo inteiro, menor, apagou, calculadora sumiu, testei sem erro

## Por quê
- 01/11 12:20: o Thiago mandou "corrige" com o pedido anterior rodando. Os 2 pedidos mexeram no mesmo rascunho. Um devolveu OUTRO app ("Orçamento", 29 mil letras) no lugar da calculadora (116 mil) e ainda saiu "✅ testei sem erro", porque o app falso abria sem erro.
- Teste que só vê "abre e clica" não percebe que o app virou outro. Tamanho e trechos são a trava mais simples.

## Como funciona por baixo
- `chat()` marca `chat_rodando_<conversa>` no cache (6 min); outro pedido na mesma conversa recebe "Ainda tô trabalhando no seu pedido anterior". Conversa nova não trava.
- `programadora`: arquivo inteiro < 85% do app → pede só os trechos 1×; não veio → "⛔ Não mexi no app".
- Carregar rascunho: < 60% do app do repositório → estragado → volta pro original.

## Situações em que aparece
- "corrige" mandado logo depois de outro pedido; "ela apagou meu app"; rascunho de 29 mil letras num app de 116 mil.

## Erro comum
- Confiar no "✅" só porque o teste não achou erro: um app vazio também não tem erro.

## Como conferir
- Passos: "⛔ Devolveu o arquivo inteiro e MENOR…", "O rascunho desta conversa estava estragado…". Tamanho do rascunho perto do tamanho do app.
