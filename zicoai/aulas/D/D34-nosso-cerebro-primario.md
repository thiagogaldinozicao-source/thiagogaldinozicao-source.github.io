# D34: como o nosso cérebro vira o primário (destilação + placar por assunto) (31/10/2026)

**Regra:** O cérebro grande grátis responde hoje; cada resposta dele que deu certo vira exemplo pro cérebro do Mac aprender (destilação). Toda semana o Mac responde as mesmas perguntas e um juiz compara às cegas. Assunto em que o Mac empata ou ganha de verdade passa a ser respondido pelo Mac primeiro; se piorar, volta pra nuvem sozinho. Nunca troca no chute.
**Palavras-chave:** cérebro próprio, cérebro primário, destilação, aprender com o Gemini, não depender da nuvem, cérebro emprestado, treino, MLX, placar Mac, juiz, assunto, primário, secundário

## Por quê
- **Destilação** é como modelo pequeno fica bom: ele aprende copiando as respostas boas de um modelo grande, na situação real (com a aula junto). A ZicoAI já usa os grandes todo dia; jogar essas respostas fora é desperdício.
- **Só o que deu certo:** resposta com 👎 ou reclamação ("tá errado", "de onde vc tirou") é marcada e não entra; com 👍 vale mais.
- **Por assunto, não tudo de uma vez:** o Mac pode ficar bom em "preço" e "loja" (regras fixas) muito antes de "comparativo" (precisa da web) ou "código grande". Trocar tudo junto pioraria o que ele ainda não sabe.
- **Juiz às cegas:** o juiz não sabe qual resposta é do Mac (ordem sorteada), senão ele puxa pro lado de um.
- **Volta sozinho:** modelo muda, assunto muda. Se o Mac começar a perder, o assunto volta pra nuvem.

## Como funciona por baixo
- `guardarDestilacao` (depois de cada resposta da nuvem): aba `destilacao` (Data, Pergunta, Aulas, Resposta, Cérebro, Tipo, Status). Sem conversa à toa, sem CPF/telefone, sem resposta do próprio Mac. 👍 → aprovada; 👎 e `aprenderComErros` → reclamada.
- `placarMacRodada` (dentro do `estudar`, uma rodada sim outra não, com o Mac ligado): 3 perguntas boas de um tipo → Mac responde com a mesma aula → juiz (Groq/NVIDIA/Mistral/Gemini) às cegas → acumula por tipo (últimas ~24). ≥ 8 provas, Mac+empate ≥ 60% e nuvem ganhou ≤ 30% → tipo entra em `MAC_PRIMARIO`; nuvem ganhando > 40% → sai. Tudo na aba `placar_mac`.
- `conversar`: pedido de um tipo em `MAC_PRIMARIO` (sem foto, sem capricho) → Mac primeiro, nuvem de reserva.
- Treino 2 no Mac (`~/ZicoAI/modelo/treino2/treino2.sh`, MLX no chip do Mac): junta destilação + aprovadas + correções, treina o adaptador e faz a prova justa contra o qwen3:8b puro. Só vira cérebro se ganhar.

## Situações em que aparece
- "quero que o nosso cérebro seja o primário", "não quero depender da nuvem pra sempre", "ela aprende com tudo?", "por que respondeu com o Mac?".

## Exemplo
- 9 provas de "preço" empatadas → `MAC_PRIMARIO = preço` → "quanto fica 1200 em 10x" responde o Mac. Depois 18 provas com a nuvem ganhando → preço volta pra nuvem.

## Erro comum
- Treinar com tudo que a nuvem respondeu, inclusive o que estava errado.
- Medir com o mesmo cérebro que gerou a resposta (ele se dá nota alta). O juiz é outro.
- Trocar o cérebro principal porque "parece bom" em 3 perguntas.

## Como conferir
- Teste `t44`. Abas `destilacao` (crescendo, com status) e `placar_mac` (decisões). Propriedade `MAC_PRIMARIO`.
