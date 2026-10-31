# D33: tarefa grande em etapas: plano, uma etapa por vez, conferir com prova e checklist honesto (31/10/2026)

**Regra:** Tarefa grande começa com um PLANO de 2 a 8 etapas, cada uma com "o que fazer" e "como confirmo que deu certo". Faz UMA etapa por vez. Só marca ✅ com PROVA vinda de uma ferramenta que deu certo (planilha lida de volta, teste passando, página aberta). Falhou: tenta outro caminho (no máximo 2) e segue ou replaneja. No fim, mostra o checklist e diz com honestidade o que foi conferido e o que NÃO foi.
**Palavras-chave:** agente, tarefa grande, várias etapas, em etapas, faz tudo, várias coisas, coloca agentes, plano, planejar, checklist, conferir, prova, testar, etapa, passo a passo, falhou, outro caminho, replanejar, segundo plano, continuar depois, não conferido

## Por quê
- **Sem plano, o agente se perde:** pedido com 5 coisas vira 5 coisas pela metade. Com plano, cada etapa tem começo, fim e um jeito de saber que acabou.
- **"Acho que deu certo" não é prova.** O cérebro grátis às vezes diz "pronto" sem ter feito, ou fala de um resultado que a ferramenta nunca mostrou. Por isso a regra está no CÓDIGO, não só no prompt: "feita" sem prova escrita, ou sem nenhuma ferramenta que deu certo desde a última etapa, é recusada e fica ☐.
- **Falha tem limite:** insistir no mesmo caminho gasta as 30 ferramentas. Depois de 2 caminhos diferentes, a etapa fica ⚠️ e o agente segue (ou refaz o plano do que falta).
- **O Thiago precisa saber o que conferir:** o fim da tarefa lista o que tem prova e o que não tem. É o mesmo que o Claude faz: "testei isso; isso aqui não deu pra testar".
- **Cérebro forte é pouco (~18 por dia):** vai só onde mais importa: 1 no plano e 1 na conferência final. O resto é com os normais.

## Como funciona por baixo
- O plano fica no estado da tarefa (`est.plano`, o JSON salvo no Drive em "ZicoAI Tarefas (progresso)"). Sem coluna nova na aba `tarefas`. Pausou no limite de 6 min do Google? A próxima rodada continua da mesma etapa ("Continuou de onde parou (rodada 2, etapa 2 de 3)").
- O cérebro manda junto do JSON: `"plano":[{"fazer","prova"}]` (1ª resposta) e `"etapa":{"n","status","prova"|"motivo"}` quando termina uma. Status: `feita` (com prova), `falhou` (com motivo) ou `sem_prova` (fez mas não deu pra conferir).
- `planoGravar` grava ou replaneja (troca só as etapas ainda abertas). `etapaMarcar` confere: `feita` precisa de prova com 8+ letras E de ferramenta que deu certo desde a última etapa (`est.okDesde`); `falhou` → "tente OUTRO caminho" (1/2, 2/2) e na 3ª vira ⚠️ de vez.
- Cada resultado de ferramenta volta com `ETAPA ATUAL: N de M — … (prova esperada: …)`.
- Quis terminar com etapa aberta? É cobrada 1 vez. Depois vem a CONFERÊNCIA FINAL (cérebro forte): compara cada ✅ com os resultados e pode rebaixar pra 🔸.
- `passosTarefa` põe o checklist no começo dos passos (o app já mostra): `📋 Plano: 1 de 3 etapas conferidas | ✅ 1. … — prova: … | ⚠️ 2. … — falhou: … | ☐ 3. …`. `conferenciaFinal` acrescenta no resultado a lista do que foi e do que NÃO foi conferido, montada pelo código.
- Rota automática (`ehPedidoGrande`): no chat, "faz tudo isso", "várias coisas", "coloca agentes", "em etapas" ou lista de 3+ pedidos começando com verbo vai direto pro agente.

## Situações em que aparece
- "faz tudo isso pra mim: atualiza os preços, monta a lista e posta", "coloca agentes pra pesquisar o 17 em 4 lojas", "faz em etapas", lista numerada de pedidos, "MELHORAR MEU CÓDIGO" com várias mudanças, app com várias telas.

## Exemplo
- Pedido: "faz em etapas: compara o iPhone 15 da Loja Z com o nosso e anota na base".
- Plano: 1) ler nosso preço (prova: ler_planilha mostra a linha); 2) ver o preço da Loja Z (prova: página lida); 3) anotar na base (prova: base lida de volta).
- Etapa 1: leu a planilha → ✅ "ler_planilha mostrou iPhone 15 por R$ 3.999". Etapa 2: a página não abriu → ⚠️ "tentando outro caminho 1/2". Na conferência, a conta com preço chutado não vale → 🔸. Etapa 3 não chegou a fazer → ☐.
- Fim: "**Não conferido:** etapas 2, 3. Não conte com isso como pronto sem olhar."

## Erro comum
- Marcar ✅ porque "mandou a mensagem" ou "fez a conta", sem ferramenta que mostrou o resultado de verdade.
- Repetir o mesmo caminho que falhou em vez de tentar outro.
- Relatório dizendo "tudo pronto" com etapa ☐ ou ⚠️ (o código acrescenta a conferência de qualquer jeito, então a mentira aparece).
- Gastar o cérebro forte em toda etapa: ele acaba no meio do dia.

## Como conferir
- Teste `t43` (plano gravado; sem prova não vira ✅; falhou → outro caminho; continua na rodada seguinte da mesma etapa; resultado honesto; cérebro forte só 2 vezes; rota automática).
- No app, na tarefa ao vivo: a primeira linha "📋 Plano: X de N etapas conferidas" e o checklist logo abaixo; no fim, a seção "📋 Conferência das etapas" na mensagem "🧠 Resultado da tarefa".
