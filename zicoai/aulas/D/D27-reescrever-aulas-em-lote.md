# D27: reescrever muitas aulas de uma vez sem estragar nenhuma (31/10/2026)

**Regra:** Separe as perguntas em FONTE (pode usar pra escrever) e PROVA (ninguém vê, só mede). Divida em lotes pra ajudantes em paralelo com um guia escrito, passe TUDO por um revisor separado e por um script que confere os números, meça na prova e grave por arquivo + função que confere letra por letra. Nunca redigite texto grande à mão.
**Palavras-chave:** reescrever aulas, lote, ajudantes, agentes em paralelo, subagentes, revisor, revisar, conferir números, fato inventado, gravar na planilha, importar, importarAulas, fonte e prova, vazamento, placar honesto

## Por quê
- **Fonte × prova:** se quem escreve a aula vê as perguntas do placar, ele escreve a aula "pra passar na prova" e o número sobe sem ela ficar melhor. Separando, o número continua dizendo a verdade.
- **Revisor separado:** quem escreveu acha que está certo. O revisor que não escreveu achou erro em 1 de cada 4 aulas, mesmo com ajudante bom: valores inventados em exemplo ("vendi por 3200"), uma regra invertida (venda soma em vez de subtrai), nome de pessoa trocado.
- **Script dos números:** revisor também deixa passar. O script compara cada número da aula nova com a fonte e lista os que não existem lá. Pegou mais 27 aulas.
- **Gravar por arquivo:** a ferramenta de escrever na planilha obriga a redigitar o texto. Em 20 linhas já trocou uma palavra ("e lista" virou "e lê lista"). Em 600 KB isso vira dezenas de erros invisíveis.

## Como funciona por baixo
1. `entrada/<ID>.json` = aula atual + respostas certas da metade fonte. Guia `COMO_ESCREVER.md` (formato de professor, fato só da entrada, o que faltar vai pra `nao_conferido`).
2. 8 ajudantes, ~27 aulas cada, gravando `saida/<ID>.json` por script.
3. 4 revisores com `COMO_REVISAR.md` corrigem e gravam `revisao/<ID>.json`.
4. Script de números → ajudante limpa só os números sem fonte (conta feita com valores da aula pode ficar, com a conta anotada).
5. Placar na metade de prova, antes × depois.
6. Arquivo único → Drive (rclone com permissão `drive.file`, que só vê o que ele mesmo cria) → `importarAulas()` no cérebro: grava por ID, só privadas, antigo no `historico`, lê de volta e compara.

## Situações em que aparece
- "reescreve todas as aulas", "melhora a base inteira", "corrige todas de uma vez", "joga isso na planilha", "faz com vários agentes que vai mais rápido", "ela tá decorando, ensina o porquê".

## Exemplo (31/10)
212 aulas privadas (156 estavam cortadas no meio). Revisor corrigiu 52; script, mais 22 números. Placar na prova: 75,0% → 79,9% nas 2; 88,9% → 90,8% nas 5; 1º lugar 62,9% → 68,5%. `importarAulas`: 212 gravadas, 212 conferidas, 0 diferentes.

## Erro comum
- Confiar no "terminei, conferi" do ajudante sem script.
- Escrever "situação de exemplo" com número inventado: parece inofensivo, mas a ZicoAI pode repetir o número como se fosse regra.
- Aula que "cai" no placar nem sempre piorou: às vezes outra aula ficou melhor e passou na frente. Olhe o total, não só cada uma.

## Como conferir
- `revisao/*.json` (ok=false = corrigida), script de números vazio, placar na prova subindo, `importarAulas` com `diferentes: []`.
