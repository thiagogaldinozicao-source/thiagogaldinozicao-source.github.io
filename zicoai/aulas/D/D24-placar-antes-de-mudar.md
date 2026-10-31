# D24: medir com placar antes e depois de mudar (31/10/2026)

**Regra:** Antes de "melhorar" qualquer coisa que dá pra medir (busca, resposta, modelo), monte o placar, reproduza o número de hoje, mude UMA coisa e meça de novo. Só fica o que subir. Olhe os erros um por um: eles dizem o próximo passo.
**Palavras-chave:** placar, medir, prova, teste, avaliação, benchmark, comparar, melhorou, piorou, número, porcentagem, acerto, antes e depois, experimento

## Por quê
- Sem número, "melhorou" é opinião. Uma mudança pode parecer boa em 3 exemplos e piorar em 1.000.
- **Reproduzir o número de hoje primeiro** prova que o placar mede o que roda de verdade. O placar novo deu 72,3%, igual aos 72,6% medidos antes: aí dá pra confiar nele.
- **Uma mudança por vez** porque, se duas mudam juntas e o número cai, não dá pra saber qual estragou.
- **Ler os erros** porque a média esconde o padrão. Lendo 25 erros apareceu o motivo: a mensagem descreve situação, a aula ensina princípio (aula D23). Sem ler, o próximo passo seria chute.

## Como funciona por baixo
- O placar usa a MESMA função do cérebro (`aulasPara`) rodando no simulador (harness) com as aulas de verdade e as 1.284 perguntas do treino, cada uma sabendo qual aula é a certa.
- Mede 1º lugar, nas 2 (o que entrava na conversa) e nas 5, e quantas aulas nunca são achadas ("mortas").
- Cada rodada vai pro `historico.jsonl`: dá pra ver a evolução.

## Situações em que aparece
- "deixa ela melhor", "tá acertando pouco", "esse modelo é melhor que aquele?", "vale ligar o treinado como chefe?", "quanto subiu?".

## Exemplo (31/10)
| mudança | nas 2 | nas 5 |
|---|---|---|
| hoje | 72,3% | 79,3% |
| sem o corte alto | 76,9% | 88,9% |
| + significado | 79,1% | 92,1% |
| juiz qwen3:8b (50 perguntas) | 58% (piorou) | — |
O juiz pequeno foi descartado pelo número, não por opinião.

## Erro comum
- **Placar com dado de treino que vazou pra regra.** Se as perguntas do placar viram palavras-chave das aulas, o número sobe sem a busca melhorar. Quem escreve aula não vê as perguntas do placar.
- **Medir num lugar e rodar em outro** (vetores do Ollama no placar, do Gemini no ar). Diga qual foi e meça de novo no lugar de verdade.
- **Prova injusta.** O modelo treinado foi provado "de cabeça", sem a aula; no uso real ele recebe a aula. Prova boa imita o uso real.

## Como conferir
- Na oficina: `cd ~/ZicoAI/placar && node placar_busca.js aulas.json rotulo` (e `node placar_v48.js` pro v48).
- No cérebro: `placarAulas()` → aba `placar_aulas`.
