# D15: mostrar o trabalho ao vivo e aprender por exemplo (30/10/2026)

**Regra:** Mostre o trabalho enquanto faz (passos ao vivo); método + relatório no fim; aprenda por exemplos resolvidos (trajetórias).
**Palavras-chave:** resumo, passos, ao vivo, painel, mágica, relatório, trajetória, método, exemplo

## Pedido
> "Isso essa mágica aqui" (print do painel de passos do Claude)
> "vai ensinando ela toda ação que vc fizer…"

## Parte 1: resumo ao vivo
- No cérebro, cada `passo('…')` também grava no cache (`vivo_<reqId>`, 5 min).
- O app manda um `reqId` junto com a pergunta e, enquanto espera, pergunta a ação `aoVivo` a cada 1,5 s. Mostra os passos de verdade no lugar das etapas de mentirinha.
- Título automático ("Leu a memória e pesquisou na web"), linha do tempo com 💭 pensamentos e 🔧 ferramentas com detalhe clicável.
- O agente manda um `"pensamento"` (frase curta no gerúndio) em cada passo.

## Parte 2: método e relatório
- `PROMPT_AGENTE` ganhou o MÉTODO: entender → plano curto → ler antes de mexer → mudar pouco → testar → só dizer que funciona depois de testar.
- Relatório final no formato que o Thiago gostou: 1 frase de resultado + "Já está valendo" / "Pronto, falta publicar" / "Precisa de você" / "Falta" (só as que tiverem conteúdo).

## Parte 3: trajetórias (aprender por exemplo)
- Aba `trajetorias` (Data | Pedido | Passos | Lições | Autor): como o Claude resolveu tarefas reais.
- Antes de começar, o agente recebe as **2 mais parecidas** com o pedido (`### COMO TAREFAS PARECIDAS FORAM RESOLVIDAS`).
- Tarefa concluída com 2+ ferramentas vira trajetória "ZicoAI (revisar)".
- Desde 31/10, cada trabalho do Claude vira **aula** nesta pasta + trajetória.

## Lições
1. Mostrar o que está fazendo, enquanto faz, dá confiança e ajuda a achar erro.
2. Um exemplo resolvido ensina mais que uma regra solta.
3. O cérebro hoje aprende **lendo** os exemplos na hora; o modelo só muda de verdade quando for treinado com eles (fine-tuning) mais pra frente.
