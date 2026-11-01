# D48: busca de aula e memória sem ruído: 2 palavras ou nada (01/11/2026)

**Regra:** Conversa à toa (bom dia, chefe, amigo) não puxa aula nenhuma. Aula, base, exemplo e memória só entram com 2+ palavras de verdade da pergunta (ou nota muito alta), e por significado só acima de 0,72. Melhor nenhuma aula do que aula errada.
**Palavras-chave:** busca, aula errada, pesquisa nada a ver, bm25, relevantes, semelhantes, embeddings, paradas, ruído, contexto

## Por quê
- Medido com 160 perguntas reais: "bom dia chefe" puxava aula de agentes; "era pra arrumar a calculadora, amigo" puxava "mandar app pro amigo". Aula errada no prompt faz o cérebro seguir regra que não tem nada a ver.

## Como funciona por baixo
- `PARADAS_AULAS` com palavras de conversa (dia, hoje, bom, chefe, amigo, bora…). `aulasPara`: ≥ 2 termos ou nota ≥ 4× o corte; no máximo 1 "talvez".
- `relevantes(..., minimo 4)` pra base, memória antiga e exemplos; `semelhantes` com corte 0,72 (Gemini dá 0,6–0,7 até pra coisa sem relação).

## Exemplo
- "temas pastéis" → B211/B305; "git pull" → B205/B09; "bom dia chefe" → nenhuma.

## Erro comum
- Achar que mais contexto é sempre melhor. Contexto errado é pior que nenhum.

## Como conferir
- Placar das aulas (aba `placar_aulas`) e o passo "Aulas usadas" na conversa.
