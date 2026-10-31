# Aula 16: treino, placar e estudo noturno (30/10/2026)

## Pedido
> "me ajuda fazer ela ir subindo até chegar nível mistral gpt gemini e claude, vai traçando o caminho pra mim"
> "trabalhar uma noite… pra ficar top em programar"

## Entender
Pra subir de nível precisa de 3 coisas: **medir** (saber onde está), **material bom** (exemplos aprovados) e, um dia, **treinar o modelo** com esse material. O caminho completo está no doc do projeto `claude/caminho-zicoai.md`.

## Execução (fase 1)
- **Prova** (aba `prova`, 20 perguntas com critério de nota 10): `rodarProva()` toda semana; corretor com temperatura 0; nota < 7,5 vira aprendizado.
- **Treino diário** (3h): 4 perguntas da prova, pesando as nunca feitas ou com nota baixa.
- **Revisão do dia** (23h): um revisor aponta quebras de forma e honestidade (oferta no fim, fingir ação, inventar número, longo demais); cada problema vira aprendizado com o cérebro culpado.
- **Placar** (2h, aba `placar`): um cérebro por dia em rodízio responde 5 perguntas da prova com o **mesmo contexto**, e a nota sai pelo mesmo corretor. Assim dá pra comparar cérebros de forma justa.
- **Estudo noturno** (1h): tema do dia, lê documentação aberta (MDN, docs do Google), um modelo **aberto** gera 3 exercícios; código com erro de sintaxe é reprovado (`new Function`); revisor < 7,5 reprovado; o resto vira exemplo "estudo (revisar)" pro Thiago aprovar no painel 📈 Treino.
- **Exportação** (domingo): exemplos aprovados + aprendizados viram JSONL na pasta "ZicoAI Treino" do Drive, pro dia de treinar o modelo do PC. **Não exporta resposta do Gemini** (conferir os termos antes de usar resposta dele pra treinar).

## PC desligado
Tudo isso roda no Google (nuvem), então funciona com o PC desligado. Só o placar do cérebro do PC, o `pc_testar` e a ponte precisam do PC (ou do Mac) ligado.

## Lições
1. Sem medir não dá pra dizer que melhorou: prova e placar com o mesmo contexto e o mesmo corretor.
2. Material de treino passa por filtro (sintaxe, revisor, aprovação do Thiago).
3. Confira as regras de uso antes de treinar com resposta de outra empresa.
4. Treinar o modelo de verdade vem depois que tiver material bom suficiente.
