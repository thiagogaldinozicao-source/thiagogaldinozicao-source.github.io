# D20: treinar a ZicoAI com LoRA a partir das aulas (31/10/2026)

**Regra:** Pra ela seguir as regras sem precisar ler a aula: cada aula vira exemplos de pergunta e resposta, um revisor separado confere todos contra a aula, e o treino leve (LoRA) roda onde tiver placa e disco livres (PC ou Colab grátis). Fato que muda (preço, taxa, versão) não é decorado: o exemplo manda conferir na fonte.
**Palavras-chave:** treino, treinar, lora, fine-tuning, ajuste fino, colab, unsloth, gguf, ollama, exemplos, dataset, aprender de verdade, não depender das aulas, modelo próprio

## O que o treino dá e o que não dá
- **Dá:** o jeito e as regras do Thiago (curto, direto, pedir OK pra dinheiro, não inventar, como escrever pro cliente, erros que não pode repetir).
- **Não dá:** inteligência nova. Um modelo de 8B treinado continua menor que os grandes; trabalho pesado vai pros cérebros fortes (ela vira maestra).
- **Não decora fato que muda:** se decorasse um preço, repetiria o preço velho com confiança. Por isso as aulas continuam sendo lidas pros fatos.

## Como foi feito
1. **Formato obrigatório** (FORMATO_TREINO.md): 4 exemplos por aula (pergunta, pedido, situação, correção do jeito errado), mensagem do Thiago no jeito dele, resposta começando pela resposta, só fatos da aula, sem nome de terceiro, sem CPF/telefone, sem valor que muda, system sempre "Você é a ZicoAI, assistente do Thiago (Zicão Store)."
2. **6 ajudantes baratos em paralelo** (Sonnet), um lote de ~45 aulas cada → 1.062 exemplos, gravados por script (json.dumps), nunca à mão.
3. **Conferência por código**: estrutura, system, todos os IDs, padrões de CPF/telefone/e-mail, nomes de terceiros, "aula"/ID citado, MAC falso → 2 exemplos tirados.
4. **Revisor separado em TODOS os exemplos** (4 rodadas): achou erro em ~8% (detalhe inventado, oferta extra no fim, afirmar que testou sem testar, texto pro cliente fora do bloco) → 87 consertos e 4 retirados.
5. **Aulas cortadas**: os ajudantes avisaram que o Conteúdo terminava no meio da frase. 167 aulas foram completadas a partir das fontes originais (o texto antigo ficou como começo exato, conferido por código) e ganharam 230 exemplos novos, revisados (11 consertos).
6. **Total: 1.284 exemplos de 267 aulas.** 5% ficam de fora do treino pra prova.
7. **Onde treinar**: o diagnóstico do PC (DIAGNOSTICO.cmd) mostrou só 15,5 GB livres no C: e precisaria de ~20 GB. Foi pro **Google Colab grátis** (GPU T4): notebook `zicoai/treino/treino_zicoai.ipynb`, base **Qwen3 8B** em 4 bits com Unsloth, 2 épocas, aprende só as respostas, salva no Drive o LoRA e o modelo pronto pro Ollama (GGUF q4_k_m, ~5 GB).
8. **No PC**: baixar o GGUF do Drive e rodar `CRIAR_MODELO.cmd` (cria `zicoai-treinada` no Ollama e compara 8 perguntas com a ZicoAI atual).

## Por que Qwen3 8B
O Qwen 3.5 9B (mais novo) precisa de ~22 GB de placa pra treinar e não aceita bem 4 bits; o Qwen3 8B treina em 4 bits com ~6 GB.

## Erros que já aconteceram
1. **Terminal do PC caiu no meio** (a conexão oscilou e não voltou). Correção: plano B com arquivos .cmd que o Thiago abre com dois cliques e que gravam o resultado num .txt que o Claude lê.
2. **Disco cheio**: 15,5 GB livres não davam. Correção: treinar na nuvem grátis e baixar só o modelo pronto.
3. **Aulas cortadas viraram exemplos pobres**: quem escreve exemplo precisa da aula inteira. Correção: completar as aulas e fazer exemplos extras da parte que faltava.
4. **Ajudante "completou" texto cortado com palpite** (B137): o revisor pega; regra é nunca completar com chute.

## Lições
1. Aula conferida ≠ exemplo conferido: exemplo é texto novo e precisa de revisor.
2. Diagnóstico antes de instalar (disco, placa, Python, Ollama).
3. Sem terminal, use .cmd + arquivo de resultado.
4. Treino pro jeito, aula pros fatos.
