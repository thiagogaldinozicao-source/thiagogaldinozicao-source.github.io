# D23: achar a aula certa por palavra + significado (31/10/2026)

**Regra:** A mensagem muitas vezes descreve uma SITUAÇÃO e a aula ensina o PRINCÍPIO; busca só por palavra não liga as duas. Some a busca por palavra (BM25) com a busca por significado (vetores), mande 2 aulas completas + 3 "talvez" e deixe o cérebro grande escolher. Respeite o limite grátis: prepare os vetores aos poucos.
**Palavras-chave:** aula, aulas, busca, achar aula, aula certa, bm25, vetor, vetores, embedding, significado, semântica, placar, conversa à toa, corte, limite grátis, 429, gemini embedding

## Por quê
- **Palavra:** "pode dizer pra ela que tá testado" não tem nenhuma palavra da aula "só dizer que funciona depois de testar"… além de "testado". Já "o upload tá ok, pode falar pra ela" não tem nenhuma. Palavra acha assunto; não acha intenção.
- **Significado:** um modelo de vetores transforma cada texto numa lista de números em que textos com o mesmo sentido ficam perto, mesmo com palavras diferentes. É assim que "quanto tá o 13" fica perto de "preço do iPhone 13".
- **Os dois juntos** porque cada um erra onde o outro acerta: vetor sozinho confunde temas parecidos (deu 56% sozinho); palavra sozinha não entende situação. Somados: melhor que qualquer um.
- **2 + 3 "talvez"** porque a aula certa está entre as 5 primeiras bem mais vezes do que em 1º lugar. Escolher entre 5 é trabalho de quem entende a situação: o cérebro grande, que já está respondendo, faz isso de graça. Um juiz de 8B testado no Mac piorou (58% contra 68%).

## Como funciona por baixo
- BM25: palavra rara pesa mais que palavra comum; título e palavras-chave pesam 2, conteúdo 1,5, regra 1.
- Nota final = palavra ÷ maior palavra + 2 × cosseno do vetor.
- O corte antigo (18) existia só pra "oi" não puxar aula, e jogava fora ~5 pontos. Trocado por `ehConversaAToa`: mensagem curta só com cumprimento/agradecimento/concordância.
- Vetores das aulas guardados na aba `vetores`, com chave `ID#hash` do texto: mudou a aula, o hash muda e o vetor é refeito.

## Situações em que aparece
- "ela pegou a aula errada", "ela não seguiu a regra que eu ensinei", "a aula existe mas ela não usa", "quero que ela ache sempre a aula certa".

## Exemplo (placar, 1.234 perguntas)
- Antes: 72,3% nas 2. Sem o corte alto: 76,4%. + significado: 78,1% nas 2 e **90,6% nas 5**. Conversa à toa puxando aula: 0 de 18.

## Erro comum
- **Embutir tudo de uma vez no plano grátis.** As 274 aulas (~500 tokens cada) estouraram o limite do Gemini (erro 429; o plano grátis do `gemini-embedding-001` é 100 pedidos/min, 30 mil tokens/min e 1.000 pedidos/dia, segundo o fórum do Google em dez/2025). Conserto: a conversa só LÊ vetores; 20 aulas por vez junto da rotina de 30 min; placar com amostra de 150.
- **Medir com uma coisa e rodar com outra.** O placar da oficina usou vetores do Ollama (qwen3-embedding); no ar são os do Gemini. O número só vale depois do `placarAulas()` no próprio cérebro.

## Como conferir
- `placarAulas()` no editor → aba `placar_aulas`. Na oficina: `node placar_v48.js`.
