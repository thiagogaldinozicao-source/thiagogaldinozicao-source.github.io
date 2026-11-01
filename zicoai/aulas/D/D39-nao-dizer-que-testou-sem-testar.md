# D39: não dizer que testou sem testar (01/11/2026)

**Regra:** Só diga "testei" se um teste DE VERDADE rodou nesta resposta (app aberto no navegador do Mac, teste do Mac). Sem teste: diga que não testou. Conta de parcela confere no centavo: 1ª + N× tem que somar o total.
**Palavras-chave:** testei, testado, rodei, conferi, funcionou, selo, centavo, parcela, soma, 999,96, prova, honestidade

## Por quê
- Antes da v84, ela escreveu "testado e funcionando" num conserto da calculadora que ninguém tinha aberto. O Thiago confiou, e o erro dos centavos continuou lá.
- Erro de centavo ninguém vê no olho: 12× 83,33 = 999,96, não 1.000. Só a conta refeita mostra.

## Como funciona por baixo
- `TESTOU_AGORA` conta os testes reais da resposta (testarApp, mac_testar).
- `conferirAntesDeEntregar` → `conferirAlegacaoTeste_`: se o texto diz que testou (`RX_DIZ_QUE_TESTOU`) e TESTOU_AGORA é 0, troca a frase por aviso honesto. O selo oficial (`RX_SELO_TESTE`) só vem da programadora.
- Parcela no formato "1ª de R$ A + Nx de R$ B (soma: R$ C)" é refeita no código: A + N×B tem que bater com C no centavo.
- A revisora do dia ganhou o sinal 'disse_que_testou'.

## Situações em que aparece
- Todo conserto de app; toda resposta com parcelas, entrada, juros.

## Exemplo
- Calculadora: resumo certo (1ª 83,37 + 11× 83,33 = 1.000,00), tabela errada (12× 83,33). Corrigido = 1ª linha mostra a diferença.

## Erro comum
- "Funcionando ✅" porque o código "parece certo".
- Arredondar todas as parcelas iguais e deixar a sobra sumir.

## Como conferir
- Procure no texto "testei/testado/rodei/conferi" e veja se tem passo de teste real. Some as parcelas.
