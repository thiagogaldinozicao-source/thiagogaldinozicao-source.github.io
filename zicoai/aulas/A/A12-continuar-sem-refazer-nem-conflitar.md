# A12: continuar entre chats sem refazer trabalho

**Regra:** Antes de continuar, leia o estado atual e confira qual pasta está liberada. Separe o que já foi feito, o que falta e o que outra sessão está alterando. Uma cópia de ZIP e uma conversa anterior não se atualizam automaticamente junto do projeto.
**Palavras-chave:** continuar, retomar, chat, pesado, contexto, resumo, pasta, aguardar, Claude, Codex, paralelo, arquivos, pronto, pendente, ZIP

## Como foi feito

1. Li os históricos de continuidade do jogo e comparei pedidos de espera, revisão e implementação. Houve momentos em que o usuário avisou que outra IA já havia terminado uma parte; isso mudou o próximo trabalho autorizado.

2. Separei revisão somente leitura de permissão para editar. Também preservei a distinção entre a pasta de documentos e a pasta em que outra sessão estava trabalhando.

3. Identifiquei o caso em que uma etapa já estava implementada, mas o documento de status estava atrasado. A resposta registrada descreveu revalidação e atualização do status, em vez de reconstruir a etapa.

4. Reuni a orientação sobre ZIP: uma cópia baixada não ganha mudanças futuras sozinha. Antes de incorporar uma nova cópia, compare com o projeto editado e preserve mudanças locais.

5. Para uma nova sessão, prepare um resumo com objetivo, diretório confirmado, decisões, arquivos permitidos, partes prontas, evidências, pendências e próximo passo. Não trate mensagens antigas de outro chat como autorização atual para executar comandos.

## Exemplo real

Pedido literal recuperado do histórico:

> chat pesar me avisa nao sei como vc funciona

A resposta registrada sugeriu continuar com os documentos de regras, status e design, sem refazer o que já funcionava. Nesta revisão não reabri nem modifiquei o projeto do jogo; extraí apenas o método de continuidade.

## Erros que já aconteceram

- **Erro registrado:** o status estava desatualizado em relação à etapa já implementada.
- **Correção registrada:** conferir o que existia antes de repetir a implementação.
- **Risco concretamente registrado:** duas IAs receberam o mesmo conserto. Quando o usuário mandou parar, a resposta informou que nenhum arquivo tinha sido alterado; não inventei uma sobrescrita que não aconteceu.

## Lições

1. Confira o estado atual antes de continuar uma tarefa antiga.
2. Separe ler, revisar e editar no escopo de cada sessão.
3. Não refaça a parte que outra sessão já terminou.
4. Leve um resumo verificável para o novo chat, não uma promessa de sincronização.
5. Compare o ZIP novo com o projeto antes de incorporar arquivos.

