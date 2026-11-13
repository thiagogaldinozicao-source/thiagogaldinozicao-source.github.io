# Zicão Social Studio — atualização compartilhada

Endereço preservado: https://thiagogaldinozicao-source.github.io/social-studio/

Somente Social Studio. Não alterar Sleep Player, Central-IA, Gestão ou catálogo.

O index principal usa arquivos versionados em shared-20261113/. A versão anterior permanece em anterior/, com seus quatro arquivos originais. Ela lê o mesmo armazenamento original deste domínio.

A versão compartilhada usa Google/Firebase, restrita aos membros cadastrados no projeto zicao-social-studio. O login ainda não cadastrado não apaga marcações: a entrada oferece continuar na versão anterior e exportar uma cópia. As duas versões não sincronizam entre si. A migração precisa comparar o backup e os dados compartilhados. Nenhum CSV antigo deve ser considerado corrigido retroativamente; usar CSV real para distinguir ausência/zero.

Rollback do aplicativo: recolocar somente anterior/index.html em social-studio/index.html; os analytics.js e analytics.css originais da raiz permanecem intactos. Não substituir outros projetos nem limpar localStorage. Baixar backup compartilhado antes de voltar; novas alterações não retornam automaticamente à versão anterior.

O app lê o catálogo público sem gravar estoque ou preços. Não publica no Instagram. A hospedagem do frontend permanece GitHub Pages, Firebase serve autenticação e banco. Na tela inicial, usar Adicionar à Tela de Início; esse atalho requer internet para entrar e sincronizar.
