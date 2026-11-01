# D37: conferir o resultado de verdade, não o que a tela diz (31/10/2026)

**Regra:** Depois de toda ação, confira o RESULTADO de verdade, não o que a tela diz: a função que rodou de fato (registro de execuções), a versão que está no ar (data da implantação × data do salvamento), o que foi gravado (ler de volta). Saída antecipada sempre diz o motivo. Ferramenta instável depois de 2–3 tentativas: pare, explique e deixe pra depois em vez de insistir.
**Palavras-chave:** conferir, rodou, não aconteceu nada, implantei, versão no ar, publicou, salvou, execuções, registro, menu, clique, tela, tarefa agendada, insistir

## Por quê
- A tela pode mentir: o seletor do editor mostrava "placarAulas" e o que rodou foi "aplicarModelos" (3 vezes). Só o registro de execuções mostrou a verdade.
- "Implantei" não quer dizer "a versão nova está no ar": a implantação das 21:51 foi feita ANTES da v69 ser salva (22:03), então no ar ficou a v68. Só comparando os horários dá pra ver.
- Função que termina em 1 segundo sem dizer nada não ensina nada: sem o motivo, a gente chuta.
- Insistir em ferramenta instável gasta tempo e pode fazer coisa errada (rodou a função errada 3 vezes).

## Como funciona por baixo
- Apps Script: Execuções lista a função e a versão de cada execução; Histórico do projeto lista as versões implantadas com data, hora e descrição.
- Regra de código: toda saída antecipada (`return` de erro) passa por `falhou(motivo)`, que grava no registro e devolve o motivo.
- Tarefa agendada que dispara enquanto alguém está ocupado pode passar batida: o que é importante e repetido deve rodar sozinho (gatilho/Mac), não depender de lembrete.

## Situações em que aparece
- "rodei e não aconteceu nada", "implantei", "publiquei", "salvei", qualquer clique em menu de site, tarefa agendada que "devia ter rodado".

## Exemplo
- 31/10 22:37: placar das aulas não rodou. Clicou Executar → terminou em 1 s sem nada no registro → abriu Execuções: era aplicarModelos → parou de insistir. No caminho, Histórico mostrou Versão 64 às 21:51 = v68 → avisou o Thiago pra implantar de novo.

## Erro comum
- Dizer "rodou" porque apareceu "Execução concluída" sem ver QUAL função rodou.
- Dizer "tá no ar" porque o Thiago implantou, sem comparar com a hora do salvamento.
- Clicar 5 vezes no mesmo menu que não responde.

## Como conferir
- Execuções (função + versão + duração), Histórico do projeto (versão × hora), ler de volta o que foi gravado.
