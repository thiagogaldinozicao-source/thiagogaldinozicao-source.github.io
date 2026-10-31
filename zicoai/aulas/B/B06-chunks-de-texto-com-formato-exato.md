# B06: conferir mapas montados com texto

**Regra:** Trate cada caractere do mapa como dado de entrada: preserve a legenda e confira linhas e larguras antes de entregar. Se o usuário mudar o símbolo de vazio, aplique a mudança em todos os blocos envolvidos. Conferir o formato não prova que a fase está jogável.
**Palavras-chave:** chunk, mapa, fase, texto, hífen, ponto, linha, largura, coluna, legenda, plataforma, bloco, formato, arquivo, validar

## Como foi feito

1. Li o pedido de mapas em texto e a correção posterior que trocava o símbolo de vazio. O histórico contém tanto a versão com pontos quanto a resposta posterior com hífens.

2. Separei a exigência estrutural da avaliação de jogabilidade. Linhas e colunas podem ser verificadas diretamente; alcançar plataformas e atravessar buracos depende do jogo e da física utilizada.

3. Extraí apenas o primeiro bloco da resposta corrigida para um exemplo local. Conferi a quantidade de linhas, a largura uniforme e a ausência do símbolo de vazio antigo nesse bloco.

4. Não declarei que todos os blocos antigos passaram: a revisão atual verificou o exemplo extraído. Também não executei o jogo nem testei o percurso do personagem.

5. Para repetir no conjunto inteiro, valide cada bloco, confira a legenda aceita pelo leitor do mapa, registre os inválidos e só depois faça o teste de percurso.

## Exemplo real

Trecho literal do pedido recuperado:

> usando o caractere "-" (hífen) no lugar de "." pra bloco vazio

O exemplo de dados abaixo é copiado do primeiro bloco da resposta corrigida e conferido nesta revisão. Não é uma implementação nova do leitor de mapas.

```javascript
    [
      "------------",
      "------------",
      "------------",
      "------------",
      "------------",
      "------------",
      "---?-!-?----",
      "------------",
      "------------",
      "---------g--",
      "############",
      "############"
    ]
```

## Erros que já aconteceram

- **Ajuste solicitado no histórico:** substituir o símbolo de vazio por hífen. A versão anterior usava ponto conforme a legenda do pedido anterior; a mudança posterior é uma correção do requisito, não prova de erro da primeira legenda.
- **Limite de validação:** o histórico não demonstra teste de percurso desses mapas no jogo. A conferência atual do exemplo é estrutural.

## Lições

1. Preserve literalmente os símbolos que o usuário definiu.
2. Valide cada linha e cada bloco, sem confiar só na aparência.
3. Separe formato válido de fase jogável.
4. Não declare todo o conjunto validado depois de conferir apenas um exemplo.

