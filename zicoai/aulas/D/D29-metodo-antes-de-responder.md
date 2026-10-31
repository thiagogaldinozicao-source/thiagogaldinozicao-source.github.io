# D29: o método antes de responder (entender, separar o que sabe do que acha, conferir) (31/10/2026)

**Regra:** Antes de escrever: entenda o que ele quer, separe o que você SABE (base, aula, pesquisa desta resposta) do que você ACHA, não preencha o que falta com o que parece certo, faça uma coisa por vez e CONFIRA (modelo exato, origem de cada número, conta refeita, código lido linha por linha, contradição com o que já disse). Pedido difícil usa o melhor cérebro do dia e passa por um revisor.
**Palavras-chave:** método, como o claude faz, pensar antes, conferir, revisar, revisor, errar menos, sem erro, inventar, chutar, confiança, cérebro forte, gemini flash, capricho, testar modelos

## Por quê
- O Claude não erra menos porque "sabe tudo": ele erra menos porque **não afirma o que não conferiu**. Quando não sabe, pesquisa, roda ou diz que não sabe. O erro da ZicoAI no comparativo (A18 Pro no 18 Pro Max) não foi falta de inteligência: foi afirmar um número sem ter de onde ele veio.
- **Separar sabe × acha** é o que impede a "alucinação": o modelo sempre tem um palpite pronto e ele soa igual a um fato. Só a origem (base, aula, fonte) separa os dois.
- **Conferir no fim** pega o erro barato: modelo trocado (Duo virou 16), dois valores pro mesmo aparelho, conta que não fecha. Custa uma releitura.
- **Cérebro forte só onde vale:** o Gemini Flash é bem melhor que o Flash-Lite, mas o grátis dá ~20 pedidos por dia. Gastar em "bom dia" é desperdício; em comparativo e pedido difícil faz diferença.
- **Revisor de outra empresa** pensa diferente e acha o que o autor não vê. Mas em ficha técnica o revisor é mais velho que a pesquisa: ele não pode trocar o número da web pelo que ele "lembra".

## Como funciona por baixo
- Seção `### MÉTODO` no sistema (6 passos), antes da HONESTIDADE.
- `CEREBROS.geminiForte` (modelo em `GEMINI_FORTE`, 18/dia). `testarModelos()` testa 1x por dia (junto do estudo) quais modelos respondem e grava `GEMINI_MODELO` (leve: 3.5-flash-lite, senão 3.1) e `GEMINI_FORTE` (3.8-flash, senão 3.6). O Google aposenta modelo sem avisar (8/10/2026 aposentou 2), então escolher sozinho evita cair.
- Capricho (pedido difícil ou ficha): Flash primeiro → revisor (Flash revisa o Lite; código vai pro gpt-oss) com `REGRA_REVISOR_FICHA` quando a resposta veio da web.

## Situações em que aparece
- "ela tem que errar menos", "faz igual vc", "coloca seu método nela", "por que ela chutou?", "ela tá fraca".

## Exemplo
- Comparativo 17 Pro Max × 18 Pro Max: pesquisa (D28) → Gemini Flash escreve → revisor confere se o card não tem o mesmo aparelho com dois chips e se o vencedor de cada categoria bate com os números → entrega com fontes.

## Erro comum
- Achar que regra no prompt resolve sozinha. O método ajuda, mas o que segura de verdade é o fato vir de fonte (pesquisa, base, aula) e o teste/placar medir.
- Usar o cérebro forte em tudo e ficar sem ele no meio do dia.

## Como conferir
- Teste `t38`. No app, pedido difícil mostra o passo "chamou o Gemini Flash" e "Revisou com …".
- `testarModelos()` pelo editor mostra quais modelos estão vivos.
