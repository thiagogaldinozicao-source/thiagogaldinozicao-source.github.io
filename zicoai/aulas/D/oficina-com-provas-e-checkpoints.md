# Oficina local: evidência antes do plano, prova antes da entrega

Referência de manutenção, 03/11/2026. Não indexar automaticamente em perguntas comuns nem usar os casos reservados de avaliação como material de treino.

**Regra:** o coordenador organiza; o especialista diagnostica; a ferramenta mede; o código decide se a prova passou. Concluir exige o artefato exato testado, com origem e hash.

**Por quê:** no teste real, a 9B sugeriu ignorar um defeito visual. A 35B seguiu uma correção errada e repetiu a candidata que já havia falhado. Uma resposta estruturada em JSON não torna o diagnóstico correto.

**Como funciona:** medir o HTML original → registrar o defeito → plano curto da 9B sem diagnóstico de código → especialista recebe fonte e medidas → trechos únicos ANTES/DEPOIS → cópia nova → provas reais → aprovação ou rascunho reprovado. O plano não é fonte de verdade técnica e não pode substituir as medidas.

**Quando usar:** correções em apps HTML pequenos, como um tabuleiro que muda de tamanho ao jogar. Tarefa grande exige seleção de arquivos/trechos antes de chamar o modelo; não cortar silenciosamente o pedido.

**Erro comum:** chamar uma confirmação vazia de entrega, considerar uma página aberta uma prova funcional, repetir o mesmo conserto, ou dizer que houve LoRA porque um processo periódico executou.

**Como conferir:** testar cliques e resultado, estabilidade visual, falha antes e aprovação depois. Conferir que o hash da origem não mudou; preservar o hash e o arquivo da candidata aprovada. Reabrir o checkpoint por outro processo e verificar que as etapas concluídas não foram repetidas. Crash enquanto segura uma trava exige reconciliação; checkpoint sozinho não garante exatamente-uma-vez.

**Resultado desta etapa:** oficina validada localmente no PC com os modelos instalados, LangGraph, SQLite e Chromium reais. Não foi instalada/ativada no Mac nem publicada na PWA. O estudo e o LoRA continuam separados da promoção de código em uso.
