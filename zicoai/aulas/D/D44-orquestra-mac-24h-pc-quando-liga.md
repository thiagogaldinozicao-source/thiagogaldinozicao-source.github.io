# D44: orquestra: Mac 24h + PC quando liga (01/11/2026)

**Regra:** O Mac faz o trabalho de fundo 24h. O PC entra sozinho quando liga, mas só pega o trabalho do Mac depois de ganhar no placar (8+ provas e nota ≥ Mac). PC desligou ou falhou → volta pro Mac sem ninguém mexer. Ponte ocupada respondendo não é ponte desligada.
**Palavras-chave:** Mac, PC, orquestra, ponte, placar, prova, qwen3.6, 35b, 9b, ligado, desligado, ocupado, trabalho de fundo, cérebro local

## Por quê
- O Thiago não deixa o PC ligado todo dia. Depender do PC = sistema parado.
- O PC (RTX 3080) é mais forte, mas "mais forte" só vale com prova: o placar compara às cegas com a resposta aprovada da nuvem.

## Como funciona por baixo
- `cerebroPCPonte(tipo)`: ponte 2.4 + modelo instalado (`ponte_modelos`). Preferência: qwen3.6:35b → qwen3.5:35b-a3b → qwen3.5:9b. Conversa no 9B (rápido), código no 35B (igual zicoai × zicoai-dev de antes).
- `placarMacRodada(tipo, 'pc')`: com o PC ligado e menos de 8 provas, a rodada de estudo vira prova do PC (`PLACAR_PC_*`). `pcNoLugarDoMac()` → `cerebroLocal()` manda o resumo e o estudo pro PC.
- `ponteViva`: ponte sem bater o ponto há pouco, mas com pedido em andamento (`ponte_ocupada`), continua viva. `marcarPCdesligado`: 3 min fora depois de erro.
- `PC_PRIMARIO`: assunto em que o PC ganhou da nuvem → PC responde primeiro no chat.

## Situações em que aparece
- "liguei o PC", "o PC tá ligado?", "por que respondeu com o Mac?", trabalho de fundo lento.

## Erro comum
- Pôr o PC como principal sem placar.
- Tratar "ponte demorando" como "ponte caiu" e trocar de cérebro no meio.

## Como conferir
- Aba placar_mac: linhas "PC qwen3.6:35b · geral". Passos do chat: "cérebro do PC já ganhou". `placarTotal("PC")`.
