# D49: entrega de código com prova do pedido (01/11/2026)

**Regra:** Ao manter a ZicoAI, separe sintaxe, execução e aprovação do pedido. Só o sistema pode aprovar o conteúdo exato que passou nas provas; o texto do modelo não comprova um teste.
**Palavras-chave:** manutenção da ZicoAI, contrato de entrega, validação do pedido, hash do rascunho

## Por quê
Código pode ter sintaxe correta e falhar no clique. Uma edição ANTES/DEPOIS idêntica pode anunciar um conserto sem mudar o arquivo. Um teste de outra versão também não valida a entrega atual.

## Como funciona por baixo
- `validacao.estado`: `nao_testado`, `sintaxe`, `executado`, `aprovado`, `falhou`. O antigo `testado` só vale no último estado de sucesso: `aprovado`.
- Aprovação exige navegador, provas previstas passando e prova nova do pedido. Em edição, a prova nova precisa falhar no original; passar nos dois não demonstra o conserto.
- SHA-256 identifica o conteúdo sem espaços finais do bloco Markdown. O teste e o rascunho se referem a esse conteúdo.
- Sem mudança, preserva o rascunho anterior. Com alteração ainda não validada, conserva o resultado como rascunho e informa o que falta.
- Um erro de JS não pode ficar escondido só nos passos. Uma alegação de teste não pode ser autorizada por um contador ou pelo nome de ferramenta no log.

## Exemplo
Mac indisponível: “Só a sintaxe foi conferida”. Navegador abriu sem prova do pedido: “Executado, ainda não comprovado”. Prova falha no velho e passa no novo: pedido aprovado para revisão.

## Erro comum
Confundir `ok` da resposta HTTP com funcionamento do app; aceitar um ✅ escrito pelo modelo; entregar o código anterior ao conserto que passou.

## Como conferir
`node cerebro/testes/t78.js`: casos com Mac offline, prova fraca/ausente/falhando, edição sem efeito, erro JS, hash de outra versão, rascunho recuperável e publicação automática. São testes em simulador; não comprovam a implantação no ar.
