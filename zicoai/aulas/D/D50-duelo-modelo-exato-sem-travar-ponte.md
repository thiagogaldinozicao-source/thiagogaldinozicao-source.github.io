# D50: duelo com modelo exato e ponte livre (01/11/2026)

**Regra:** Na manutenção da academia, modelo forçado ausente significa pausa, nunca substituição. Não execute o duelo segurando a trava necessária à ponte.
**Palavras-chave:** manutenção da academia ZicoAI, modelo forçado ausente, ScriptLock, dueloMacAgendado

## Por quê
Uma reserva muda quem está sendo avaliado. Se a memória segura o ScriptLock e espera resposta do Mac, a ponte pode precisar da mesma trava para entregar o pedido. O trabalho deve começar em execução separada, depois de soltar a trava.

## Como funciona por baixo
- `cerebroPCPonte` retorna null quando `PC_MODELO_FORCADO` não está na lista instalada. O modo estrito do duelo não tenta outro cérebro.
- `dueloAcademia` mantém a tentativa na fila enquanto o modelo exato estiver indisponível. Um gatilho atrasado sem fila não inicia nova avaliação.
- `aprenderSozinha` marca a necessidade de início; após liberar a trava, agenda `dueloMacAgendado`. Essa função preserva qualquer fila que já exista.
- Se criar o gatilho falhar, libera a marca para tentar de novo na próxima rodada.

## Exemplo
O modelo participante some: fila pausa, nenhuma nota é registrada e outro modelo não ocupa seu lugar.

## Erro comum
Tratar “o PC respondeu” como “o modelo escolhido respondeu”; iniciar o duelo dentro da trava da memória; reiniciar um duelo já concluído por um gatilho atrasado.

## Como conferir
`node cerebro/testes/t79.js` prova seleção estrita, fila preservada, agendamento após liberar trava e ausência de reinício por gatilho atrasado. `t77.js` conserva os testes da v100. Simulador não comprova o duelo real nem autoriza promover um modelo sem placar.
