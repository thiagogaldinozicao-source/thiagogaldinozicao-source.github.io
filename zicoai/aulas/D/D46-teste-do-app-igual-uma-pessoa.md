# D46: teste do app igual uma pessoa: fechar o tutorial e achar a causa na tela (01/11/2026)

**Regra:** Antes de clicar, o teste fecha a tela de boas-vindas como uma pessoa faria (botão Entendi/OK/Pular da camada de cima). Arquivo ao lado do app (fonte, ícone) que não vai junto no teste é aviso, não erro. Pra consertar o que aparece errado na tela, ache quem MONTA aquele pedaço: se o resumo mostra certo, a conta está certa.
**Palavras-chave:** tutorial, boas-vindas, Entendi, não clica, intercepts pointer events, botões não aceitam o toque, prova parada, fonte, ERR_FILE_NOT_FOUND, src vazio, causa, tabela, resumo certo

## Por quê
- O teste abre o app num navegador limpo (como a 1ª vez de alguém). A calculadora mostra "Bem-vindo! … Entendi" por cima de tudo: nenhum clique pegava, e a prova parava no passo 1 ("12 de 12 botões não aceitam o toque").
- Fontes em `fonts/` não vão pro teste (só o HTML vai): o erro "ERR_FILE_NOT_FOUND" mandava ela "consertar" o que não estava quebrado. Na prévia do app, `<img src="">` também virava erro.
- Ela mexeu em `parcCalc` (a conta, que estava certa, porque o resumo mostra 83,37) em vez da tabela que mostra só `x.par`.

## Como funciona por baixo
- `mac/testar-html.js` v3, `fecharBoasVindas`: pega a camada de CIMA que cobre ≥ 50% da tela e tem ≤ 8 botões, e clica no botão Entendi/OK/Pular/Fechar/Começar/Continuar/✕. O × sozinho não, porque é o botão de multiplicar.
- Botão que abre um painel cobre os outros: o teste recarrega o app e tenta de novo; só conta erro se continuar sem pegar.
- `REGRA_EDICAO_BASE`: "ACHE A CAUSA", dizendo em 1 linha qual função ou linha é a causa.

## Exemplo
- Prova "12x fecha no centavo": no original falha ("linha 12x: 12× R$ 83,33"), na corrigida passa. 12 de 12 botões testados.

## Erro comum
- Achar que o app quebrou quando é o tutorial por cima.
- Consertar a conta que já está certa.

## Como conferir
- Avisos: "Fechei a tela de boas-vindas (Entendi)…". A prova falha no velho e passa no novo.
