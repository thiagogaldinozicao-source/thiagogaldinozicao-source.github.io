# D31: cérebro do Mac (sem limite) × nuvem grátis (com limite): cada um no seu trabalho (31/10/2026)

**Regra:** O Ollama do Mac (qwen3:8b) não tem limite de token, mas é pequeno; a nuvem grátis é grande, mas tem cota. Trabalho de fundo que dá pra conferir (gerar exercício que a nuvem corrige, resumir conversa) e reserva quando a nuvem toda bate limite vão pro Mac. Resposta final difícil fica na nuvem. Nada muda de lugar sem medir.
**Palavras-chave:** mac, ollama, cérebro local, sem limite, tokens grátis, cota, limite, pobreza de tokens, depender da nuvem, qwen3, reserva, offline, Load failed, conexão caiu

## Por quê
- **Limite:** o Gemini Flash grátis dá ~20 pedidos por dia; os outros, algumas centenas. Estudo 24h e resumo gastariam isso tudo.
- **Tamanho:** o 8B do Mac piorou quando foi juiz das aulas (68% → 58%) e acertou 1 de 8 sem aula depois do treino. Ele não pode ser quem decide nem quem dá a resposta final de coisa difícil.
- **Conferido por outro:** quando o 8B só gera e a nuvem corrige (estudo), o erro dele não passa; ele economiza a parte cara (escrever) e a nuvem faz a parte barata (dar nota).
- **Reserva:** "Nenhum cérebro respondeu" é pior que uma resposta do 8B. Quando a nuvem toda bate limite, o Mac responde e o passo avisa.
- **Pela ponte:** o Mac busca os pedidos na ZicoAI (nada aberto na internet), então o Ollama dele fica só no localhost.

## Como funciona por baixo
- `CEREBROS.mac` (`viaPonte`): `chamarCompat` manda `ollama_chat` pela ponte (até 115 s); a ponte (mac-1.3) chama `127.0.0.1:11434/api/chat` (think desligado, modelo da lista). Foto não vai (o 8B não enxerga). Ligado só se a ponte do Mac foi vista há menos de 90 s; `MAC_CEREBRO=nao` desliga; `MAC_MODELO` troca o modelo. Falhou → fica 3 min fora.
- Ordem: estudo gera no Mac primeiro (nuvem corrige); resumo da conversa no Mac primeiro; conversa normal com o Mac por último (reserva).
- Resposta que falhou agora fica gravada na conversa ("⚠️ Não consegui responder: …"). O app, quando a conexão cai ("Load failed"), confere por ~4 min se a resposta chegou e troca o aviso pela resposta.

## Situações em que aparece
- "vou depender pra sempre dessa pobreza de tokens?", "liga o Ollama do Mac", "por que respondeu com o Mac?", "deu Load failed".

## Exemplo
- 31/10, 17:18: pedido com foto + "3 agentes" levou 146 s no cérebro; o iPhone derrubou a conexão antes e mostrou "Load failed"; nada foi gravado. Agora o erro fica na conversa e o app busca a resposta depois.

## Erro comum
- Colocar o 8B pra decidir ou dar a resposta final porque "é de graça": sai mais caro em erro.
- Achar que o Mac ligado é o mesmo que o cérebro do Mac pronto: precisa da ponte rodando (mac-1.3) e do Ollama aberto.

## Como conferir
- Teste `t40`. No app, passo "Nuvem indisponível (limite), respondeu com o Mac (qwen3:8b)". No Mac, `ponte-log.txt` com "pedido: ollama_chat".
