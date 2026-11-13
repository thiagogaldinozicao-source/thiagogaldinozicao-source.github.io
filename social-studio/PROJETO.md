# Zicão Social Studio — atualização compartilhada

Endereço preservado: https://thiagogaldinozicao-source.github.io/social-studio/

Somente Social Studio. Não alterar Sleep Player, Central-IA, Gestão ou catálogo.

O index principal usa arquivos versionados em shared-20261113/. A versão anterior permanece em anterior/, com seus quatro arquivos originais. Ela lê o mesmo armazenamento original deste domínio.

A versão compartilhada usa Google/Firebase, restrita aos membros cadastrados no projeto zicao-social-studio. O login ainda não cadastrado não apaga marcações: a entrada oferece continuar na versão anterior e exportar uma cópia. As duas versões não sincronizam entre si. A migração precisa comparar o backup e os dados compartilhados. Nenhum CSV antigo deve ser considerado corrigido retroativamente; usar CSV real para distinguir ausência/zero.

Rollback do aplicativo: recolocar somente anterior/index.html em social-studio/index.html; os analytics.js e analytics.css originais da raiz permanecem intactos. Não substituir outros projetos nem limpar localStorage. Baixar backup compartilhado antes de voltar; novas alterações não retornam automaticamente à versão anterior.

O app lê o catálogo público sem gravar estoque ou preços. Não publica no Instagram. A hospedagem do frontend permanece GitHub Pages, Firebase serve autenticação e banco. Na tela inicial, usar Adicionar à Tela de Início; esse atalho requer internet para entrar e sincronizar.

## Migração automática do navegador antigo

Depois de entrar com conta autorizada e receber a primeira versão do servidor, o app lê somente as duas chaves antigas do Social Studio no próprio navegador. Antes de juntar dados, arquiva a cópia bruta no Firestore, por conta e hash da origem, em documentos imutáveis. A cópia só pode ser consultada por quem a criou ou pelo administrador.

As marcações, notas, preparação, substituições e indicadores preenchidos são adicionados por campo quando ainda não existem. Campos diferentes permanecem no compartilhado e a versão antiga vira rascunho para comparação. Campos vazios e desmarcados não apagam dados da equipe. Se já está marcado nos dois lados, a diferença no horário da marcação não cria duplicação.

Um recibo por conta/origem impede repetir a migração e trazer marcações antigas depois de alguém desmarcar no compartilhado. Em falha parcial não é emitido recibo; pode retomar sem duplicar. As chaves antigas nunca são removidas ou reescritas. Dados CSV antigos ficam arquivados em bruto, sem converter zeros que possam ter sido calculados pelo importador antigo. A migração automática não importa publicações CSV para a tabela nova.

Limites: até 8 milhões de caracteres na cópia; até 5 mil campos no backup. Dados inválidos ou além do limite continuam intactos na origem, com aviso para revisão. O JSON normal de backup v3 exporta o estado compartilhado atual; não inclui todos os arquivos brutos históricos de migração.

Somente este navegador pode detectar seus dados antigos: não funciona após limpar os dados, em janela anônima ou em outro navegador. O cadastro individual da Isis/Karina continua necessário.

## Reels e participação da Toani

Plano editorial ajustado: um Reel principal por semana, em 13, 18 e 27/11; 04, 11, 18, 24 e 31/12. Vídeos simples de 8–20 segundos, sem depender de edição da Toani. Isis e Karina gravam; Thiago participa quando disponível. Toani apoia artes de feed eventualmente. Stories e atendimentos continuam prioridades diárias. Não é uma promessa de desempenho: a captura do perfil não informa alcance ou conversões.

Reels antigos já marcados continuam como histórico com o mesmo identificador. Produtos, preços, Stories e arquivos brutos do plano são preservados; editorial.js aplica a nova frequência em memória. Login por usuário/senha está preparado localmente e aguarda aprovação específica para criar contas/permissões; não faz parte desta publicação editorial.

## Acessos da loja

Três contas internas foram explicitamente autorizadas: thiago administrador; isis/karina equipe. Identificadores técnicos no domínio do projeto não são caixas de correio. Senhas só passam pelo Firebase Authentication. O administrador Google continua ativo. A tela de primeiro acesso usa link privado de uso único para cada pessoa definir sua senha; nenhum link ou senha fica nos arquivos públicos. Ao esquecer a senha ou expirar o link, é necessário gerar outro pelo administrador.

A criação das três contas e a publicação no endereço atual foram autorizadas explicitamente pelo usuário. Senhas serão definidas individualmente nos links privados; esses links não fazem parte desta pasta pública.
