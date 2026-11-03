# Entrega só termina com o arquivo e sua prova

Aula de manutenção, 03/11/2026. Referência para quem mantém a ZicoAI; não inserir automaticamente em conversas comuns.

O agente da 103.7 podia receber do validador `falhou` e mesmo assim registrar a tarefa como concluída porque seu checklist estava fechado. Também podia perder um HTML quando a revisão posterior devolvia apenas uma confirmação.

Na candidata local 103.8, o arquivo candidato fica preservado antes da revisão. Em pedidos de criação/edição de código reconhecidos pelo sistema, concluir exige checklist completo, validação aprovada e teste confirmado. Se faltar prova, entregar o rascunho com a falha e preservar o estado. Falha ao salvar checkpoint deve aparecer no registro e não apagar a resposta em memória.

Abrir uma página sem erro não prova vitória, empate, contas ou estabilidade visual. As provas devem exercitar o comportamento pedido. Uma validação simulada testa a regra do agente; não comprova o modelo real, o Mac nem todos os aplicativos.

Treino recebe somente a versão final aprovada e identificada. Uma execução periódica não comprova LoRA. Uma configuração de avaliação que passou no CI não comprova a qualidade dos modelos. Uma mudança incorporada ao Git não comprova instalação na máquina.

Não copiar esta aula para respostas a clientes nem para pedidos comuns de aplicativos. Usar apenas na manutenção do mecanismo de entrega, revisão e avaliação.
