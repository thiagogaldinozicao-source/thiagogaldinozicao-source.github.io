# B08: escrever testes que não escondem o defeito

**Regra:** Escreva cada teste com ação, resultado observável e origem da regra. Use atalhos de depuração apenas quando não esconderem o comportamento examinado. Separe teste automático, teste visual e avaliação com o controle físico.
**Palavras-chave:** teste, roteiro, jogar, conferir, resultado, esperado, vídeo, controle, teclado, debug, dano, compra, checklist, manual, prioridade

## Como foi feito

1. Li o histórico de criação de um roteiro manual por blocos, com prioridades, resultado esperado, referência e orientação de vídeo.

2. O registro distingue testes de dano de testes de observação: invulnerabilidade pode esconder o problema de dano. Atalhos que concedem vantagens também podem invalidar testes de compra, limite ou progressão.

3. Reuni outros relatos que separavam controle sintetizado de controle físico e compilação de teste dentro da partida. Preservei essa diferença nas lições, sem repetir medições antigas como resultado atual.

4. Para repetir, prepare o estado inicial, execute uma ação e observe uma consequência. Só adicione uma tecla de apoio quando sua função estiver documentada; não invente um atalho para facilitar o roteiro.

5. Não executei testes do jogo nesta revisão. O resultado desta tarefa é a aula sobre o método, baseada no histórico consultado.

## Exemplo real

Trecho literal do pedido recuperado:

> Máximo 10 testes por bloco, os mais importantes primeiro.

O relato de execução separou os testes que exigiam dano ativo daqueles que podiam usar atalhos de observação. O roteiro final antigo não foi relido nesta revisão; por isso não reproduzo uma checklist inteira como se tivesse acabado de validá-la.

## Erros que já aconteceram

- **Risco identificado no trabalho registrado:** testar dano com invulnerabilidade ou testar compra com vantagens já concedidas mascara o comportamento.
- **Tratamento registrado:** o roteiro avisou quando desligar esses atalhos.
- **Nenhum defeito adicional foi comprovado nesta revisão:** não inventei uma falha de jogabilidade a partir das instruções de teste.

## Lições

1. Toda linha de teste precisa dizer o que observar.
2. Não use um atalho que elimine o comportamento testado.
3. Compilar não equivale a jogar.
4. Controle sintetizado não substitui a avaliação do controle físico.
5. Registre a origem da regra e o que ficou pendente.

