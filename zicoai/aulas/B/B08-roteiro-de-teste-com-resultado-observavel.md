# B08: roteiro de teste que não esconde o defeito

**Regra:** Cada teste diz o que fazer e o que tem que aparecer (resultado que dá pra ver). Atalho de teste (vida infinita, dinheiro grátis, pular fase) só onde ele não esconde justamente o que está sendo testado. Compilar não é testar: alguém tem que usar.
**Palavras-chave:** teste, testar, roteiro, checklist, conferir, jogar, resultado esperado, bug, defeito, atalho, debug, vida infinita, prioridade, vídeo, manual

## Como fazer
1. **Um teste = 3 partes:** como começa (estado inicial), o que fazer (1 ação), o que tem que acontecer (algo visível: número muda, tela abre, mensagem aparece).
2. **Mais importantes primeiro:** no máximo uns 10 por bloco (dinheiro, salvar, login e o que o usuário mais usa vêm antes).
3. **Atalho certo no teste certo:** testando dano? desliga a vida infinita. Testando loja ou limite? começa sem dinheiro grátis. Anote no roteiro quando ligar e desligar.
4. **Separe os tipos:** teste automático (código), teste visual (print), teste de uso de verdade (jogar, tocar no celular, controle de verdade).
5. **Resultado:** passou, falhou (com o que apareceu) ou não deu pra testar (e por quê). Nunca "testado" sem dizer o que viu.

## Exemplo real
No roteiro de testes do jogo do Thiago o pedido foi: "Máximo 10 testes por bloco, os mais importantes primeiro." Os testes de dano avisavam pra desligar a invulnerabilidade, senão o defeito ficava escondido.

## Erros que já aconteceram
- Atalho de depuração ligado durante o teste do próprio comportamento (dano com invulnerável): o teste passa e o defeito continua. Correção: o roteiro diz quando desligar.

## Lições
1. Todo teste diz o que tem que aparecer.
2. Atalho não pode apagar o que está sendo testado.
3. Compilar não é jogar.
4. Diga o que não deu pra testar.
