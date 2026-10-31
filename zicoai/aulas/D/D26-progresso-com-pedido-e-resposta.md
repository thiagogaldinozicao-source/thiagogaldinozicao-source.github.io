# D26: progresso com solicitação e resposta, sem expor segredo (31/10/2026)

**Regra:** Registre a chamada no ponto em que ela acontece, sem substituir os passos antigos. Mascare antes de cortar, gravar, transmitir, mostrar ou copiar. Mostre cada registro como linha expansível.
**Palavras-chave:** como respondi, progresso, solicitação, resposta, ferramenta, cérebro, máscara, segredo, ao vivo, copiar, compatibilidade, ponte, aula

## Por quê
Um resumo como “pesquisou” não diz qual consulta saiu nem o que voltou. Uma resposta da ferramenta cortada em 160 letras pode esconder justamente o erro. Por outro lado, registrar argumentos e resultados sem filtro pode copiar credenciais e dados pessoais para cache, planilha e tela. Cortar antes de mascarar pode separar o rótulo do segredo e dificultar sua detecção. Trocar os passos antigos por objetos também quebraria o app antigo que espera texto.

## Como funciona por baixo
- `passo(texto)` continua alimentando `PASSOS`. `passoDetalhe({tipo,titulo,pedido,resposta,ms})` alimenta `DETALHES`. São dois contratos separados.
- `observarDetalhe` cria uma entrada aguardando, executa a função e atualiza resposta/tempo no `finally`, inclusive em erro. O retorno real da ferramenta continua intacto: a máscara só altera o diagnóstico.
- `mascarar` trata campos sensíveis, valores de propriedades secretas, formatos de credenciais, query strings, CPF e telefone. Binário de print/áudio é omitido. Depois disso, cada pedido/resposta fica com até 2.000 caracteres, com “…” quando cortado; o total é até 60 registros.
- Acompanhamento ao vivo usa partes pequenas no cache. Mensagens e tarefas persistem o JSON na aba `detalhes`, em até 13 partes de 40 mil caracteres por linha. A mensagem guarda uma referência na coluna H, `DetalhesId`; tarefa usa o próprio ID. Isso evita colocar o JSON inteiro numa única célula.
- As aulas selecionadas mantêm ID e sinais de palavra/BM25 e significado/cosseno usados na seleção. O diagnóstico de contexto inclui perfil, aprendizados, memória e base utilizados.
- O app usa `details`/`summary`, `textContent`, blocos `pre/code` com rolagem interna e copiar. Não interpreta o diagnóstico como HTML. Uma segunda máscara protege a tela e a cópia. Sem detalhes, usa o resumo antigo.

## Situações em que aparece
- “quero ver oq ela mandou pro cerebro”
- “mostra o q voltou da ferramenta”
- “qual aula ela achou e pq?”
- “no progresso só aparece pesquisou, abre isso ai”
- “ela mandou pro pc ou pro mac?”
- “copiei e veio minha chave junto”

## Exemplo
Nesta tarefa, foram adicionados registros nas chamadas de cérebro, pesquisa, páginas, contexto, ferramentas do agente e ponte PC/Mac; as ferramentas mantiveram seu retorno original. O app passou a usar o mesmo componente de detalhes na resposta pronta, no chat ao vivo, no painel Progresso e nas tarefas. O cache do service worker passou de v22 para v23. `t33.js` exercita formato, máscara, limites, persistência, cache e contrato antigo. O roteiro Playwright usa API falsa em 390 e 1440 de largura.

## Erro comum
Erros que ocorreram de verdade nesta implementação:
1. Executei o primeiro comando fora da pasta do clone. O terminal respondeu `FileNotFoundError`; conferi o diretório e rodei na pasta correta. A tentativa não alterou o código.
2. A primeira máscara usava repetição sem limite para procurar rótulos dentro de texto binário grande. O teste antigo de print ficou preso. Achei o caminho pelo teste da ponte e pelo campo base64; omiti o binário e limitei a expressão de rótulos.
3. Os testes da ponte simulam outra requisição dentro da chamada atual. Essa requisição zerava o array global e o fechamento do detalhe tentava atualizar um índice inexistente. A pilha de erro mostrou `observarDetalhe`; preservei o contexto da chamada antes de atualizar o resultado. Os mesmos testes passaram depois.
4. O Chromium não estava instalado neste ambiente e o download retornou um arquivo inválido. Isso impede afirmar teste visual local. O workflow de PR executa o roteiro no runner do GitHub; o resultado final deve ser conferido lá.

## Como conferir
- Na pasta `zicoai/cerebro/testes`, executar `node t1.js` até `node t33.js` em processos separados.
- Instalar Playwright e Chromium num ambiente de testes e executar `node zicoai/cerebro/testes/progresso.playwright.cjs` na raiz; ou conferir o workflow “ZicoAI detalhes e progresso” no PR.
- O roteiro verifica abrir/fechar, cópia mascarada, mensagem antiga, atualização ao vivo, resposta pronta, tarefas, painel, blocos com rolagem e ausência de rolagem horizontal da página nas duas larguras.
- Confira no PR a execução final dos testes. APIs reais, publicação do Apps Script e ponte física não foram verificadas nesta tarefa. Nada foi publicado no cérebro por esta implementação.
