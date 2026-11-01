# D47: como o NOSSO cérebro aprende com os grandes: academia, destilação e pares boa × ruim (01/11/2026)

**Regra:** O nosso cérebro (Qwen no Mac/PC) aprende dos grandes por 3 caminhos, todos aprovados por PROVA, nunca por achismo: destilação (o jeito certo), academia (exercício com prova escondida) e pares boa × ruim (DPO: o que NÃO fazer). Só troca de cérebro se o treinado ganhar na prova. Nunca saída de GPT/Groq/Claude.
**Palavras-chave:** academia, treino, dpo, boa e ruim, preferencias, destilação, nosso cérebro, qwen, mac, pc, aprender com os grandes, lora, qlora, unsloth, treino 2, kaggle

## Por quê
- Treinar com a conversa do dia sem conferir estraga o modelo (o treino 1 saiu pior que o qwen3:8b puro).
- Só o "jeito certo" ensina metade. O par "isso sim × isso não" ensina a não repetir o erro: ruim = o que o NOSSO respondeu, boa = o que passou na prova.
- Treinar exige bem mais memória que rodar. O 35B roda no PC, mas não cabe pra treinar de graça (3080 = 10 GB; Kaggle = 2× 16 GB). Por isso treina o 8B/9B; o 35B melhora com aula, busca e academia, sem mexer nele.

## Como funciona por baixo
- `treinoCodigo` (23h–7h, 1 exercício × 1 cérebro por hora): metade das rodadas é do Mac/PC. Conserto de grande que passa vai pra `destilacao` (aprovada).
- v99 `parDaAcademia_`: nosso falhou → linha `sem par` na aba `preferencias`; um grande passa no mesmo exercício → o par fica `aprovada`.
- v99 `licaoDoErro_` → `guardarPar_`: reclamação do Thiago ou revisora: ruim = a resposta dela, boa = `resposta_certa`; `aprovada` só se virou aula (nota ≥ 8 de outro cérebro).
- Export pro treino 2: `ponteTrajetorias` (trajetórias), destilação e `pontePreferencias` (JSONL prompt/chosen/rejected), só pelo Mac.

## Exemplo
- Gorjeta: Mac mexeu na linha errada (reprovou) → Gemini Flash dividiu por pessoa (passou 2/2) → par aprovado.

## Erro comum
- "Treino automático toda madrugada": treina com erro junto e piora.
- Usar resposta do GPT/Claude como modelo (regra do Thiago: nunca).

## Como conferir
- Ação `preferencias` (placar por status) e `academia` (placar por cérebro). Treino 2 quando tiver ~150 exemplos aprovados.
