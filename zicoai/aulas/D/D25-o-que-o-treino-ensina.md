# D25: o que um treino LoRA de 8B ensina (e o que não ensina) (31/10/2026)

**Regra:** Treino leve num modelo pequeno ensina JEITO (tom, formato, raciocínio que se repete), não decora FATO. Fato vem da aula no contexto. Por isso o exemplo de treino bom traz a aula junto e a resposta explica o porquê; e a prova tem que ser igual ao uso real (com a aula). Salve o resultado do treino cedo: o Colab grátis cai.
**Palavras-chave:** treino, treinar, lora, fine-tuning, modelo treinado, prova, colab, caiu, desconectou, gguf, adapter, decorar, fatos, porquê, raciocinar, entender, chefe, rclone, drive

## Por quê
- Um modelo de 8B tem pouca "memória" sobrando. Com 1.284 exemplos e 2 passadas, ele pega o estilo dos exemplos, mas não guarda cada detalhe. Resultado na prova sem aula: ~1 de 8 certa, e errou com confiança (inventou Supabase onde era o banco do artifact; fez a lista de preços ao contrário da regra).
- O modelo grande (Claude, Gemini) também não sabe a regra da loja de cabeça; ele acerta porque **entende o porquê** e **lê a aula**. É isso que dá pra ensinar a um modelo pequeno: ler a aula e raciocinar sobre a situação, explicando o motivo. Quem entende o motivo acerta pergunta que nunca viu.
- Prova sem a aula mede uma coisa que nunca acontece no uso. Prova justa: mesma pergunta + a aula, treinado × modelo puro.

## Como funciona por baixo
- LoRA não muda o modelo inteiro: treina um "adaptador" pequeno (aqui 175 MB) que se encaixa no modelo base (qwen3:8b). No Ollama: `FROM qwen3:8b` + `ADAPTER ./zicoai-lora.gguf`.
- O Colab grátis desliga por inatividade ou tempo máximo. O notebook salva o LoRA no Drive logo depois de treinar; a conversão pro Ollama (GGUF) vem depois e foi justamente o que se perdeu quando caiu. O treino em si (o zip) ficou salvo.
- **rclone** com permissão só de leitura traz arquivos do Drive pro Mac sem navegador: `rclone copy "gdrive:ZicoAI Treino" ~/ZicoAI/modelo/`.

## Situações em que aparece
- "ela tá pronta pra ser chefe?", "o treino terminou?", "o Colab caiu", "por que ela errou se eu treinei?", "quero que ela pense igual o Claude".

## Exemplo
- 1º treino: Qwen3 8B, 4 bits, 2 épocas, 1.284 exemplos → prova sem aula ~1/8. Decisão: não vira chefe; nuvem continua. Próximo treino: exemplos com a aula no contexto e resposta com o porquê, mais exemplos sem aula em que ela pensa sozinha ou diz que não sabe; trocar os exemplos que contradizem a regra atual (A203/A302).

## Erro comum
- Ler o número da prova sem perguntar como ela foi feita.
- Deixar a etapa mais demorada (converter) depois do ponto em que o Colab costuma cair, sem salvar antes.
- Baixar pelo navegador do app do Claude: o download não chegou; rclone resolveu.

## Como conferir
- `~/ZicoAI/modelo/prova_resultado.json`: pergunta, esperado, resposta.
- Prova justa no Mac (treinada × qwen3:8b, as duas com a aula) antes de decidir qualquer coisa.
