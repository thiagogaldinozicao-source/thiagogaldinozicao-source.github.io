# D52 — Auto decide; escolha manual permanece

**Regra:** Auto pode escolher uma alternativa disponível. Na escolha manual, resposta, pesquisa, revisão e reparo mantêm o modelo exato. Se ele não responder ou não suportar o pedido, explique o motivo e recomende Auto; quem troca é o Thiago. Agente somente no Auto.

## Por quê
“Vai primeiro” não é “foi o escolhido”. Uma reserva silenciosa impede avaliar o modelo e faz o dono perder controle. Revisão pelo mesmo modelo é autorrevisão, não prova independente. Código continua precisando de teste executado e prova do comportamento.

## Aplicação
- Abertura/reload do app inicia Auto + Capricho ligado; a escolha manual dura até o próximo reload.
- Capricho não força segundo pedido em cumprimento simples. No manual, não chama outro modelo para revisar.
- Modelos sem visão não recebem uma foto como se fosse texto nem transferem a foto silenciosamente.
- Erro de cota, indisponibilidade e falta de capacidade são explicados. Escolher Auto é uma recomendação, não uma mudança automática.
- O histórico inteiro passa pela máscara de telefone/CPF. Isso não prova proteção de texto dentro de imagem: visão local e auditoria de anexos continuam uma etapa própria.
- O índice lexical lê também a coluna Onde: IGNORAR nela deve valer igualmente na palavra e nos vetores.

## Validação
`t81.js` cobre seleção, reservas no Auto, reparo/continuação, agentes, pesquisa, histórico e IGNORAR. `seletor.playwright.cjs` cobre celular/computador, reload e agente desativado no manual. Simuladores não comprovam disponibilidade de todas as APIs reais ou funcionamento do Mac físico.
