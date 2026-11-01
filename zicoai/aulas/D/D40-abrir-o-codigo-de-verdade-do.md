# D40: abrir o código de verdade do app e trabalhar no rascunho (01/11/2026)

**Regra:** Pra consertar um app, abra o arquivo REAL (repositório dele), mude por trechos ANTES/DEPOIS e guarde o resultado no rascunho da conversa. Nunca reescreva o arquivo inteiro de cabeça; arquivo cortado (sem </html>) não se publica.
**Palavras-chave:** código real, repositório, calculadora, arquivo grande, cortado, ANTES DEPOIS, rascunho, publicar, repo, Calculadora-do-zicao, 116 mil letras

## Por quê
- A calculadora tem ~116 mil letras. Cérebro grátis não devolve isso inteiro: o arquivo vinha cortado, e publicar cortado apaga metade do app.
- Antes da v85 ela "consertava" uma versão inventada, porque não abria o código real do repositório.
- O histórico da conversa corta célula em 50 mil letras. Conversa antiga com HTML cortado faz ela continuar do pedaço errado.

## Como funciona por baixo
- v85: `reposApps()` lista os repositórios do Thiago (menos site, catálogo e Gestão: `REPOS_FORA`). `appDoPedido_` acha "corrige a calculadora" → 'repo:Calculadora-do-zicao'. `codigoDoApp` busca o arquivo real.
- Edição: bloco `<<<<<<< ANTES / ======= / >>>>>>> DEPOIS` (`RX_BLOCO_EDICAO`), aplicado no código real.
- v88: `guardarRascunho_` salva o arquivo inteiro no Drive ("ZicoAI Rascunhos/<conversa>.html"). O chat mostra a explicação + diferença + cartão [[RASCUNHO]] (testar, publicar, baixar). O próximo pedido continua do rascunho.
- `publicarNoRepo_` recusa arquivo sem `</html>`. O agente não publica em repo sozinho.

## Situações em que aparece
- "corrige a calculadora", "muda o botão do app X", "arruma o bug Y no meu app".

## Erro comum
- Mandar o arquivo inteiro na resposta.
- Continuar na conversa velha com HTML cortado: abra conversa NOVA.

## Como conferir
- O passo diz de onde veio o código (repo e tamanho). O rascunho tem `</html>`. A diferença mostra só o trecho mudado.
