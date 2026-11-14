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


## Ajuste editorial — 14/11/2026 (publicação autorizada pelo proprietário)

Implementação: \`shared-20261113/operacao-20261114.js\`, carregado depois de editorial.js e antes de isis.js. Mantém a estrutura do aplicativo e autenticação Firebase existentes. O plano original no JSON não é regravado. A rotina é adaptada somente em memória no navegador.

- Dias úteis: 8 Stories em 6 blocos (09h15, 10h, 12h, 14h30, 16h30, 17h30).
- Sábados: 8 Stories em 6 blocos entre 09h15 e 14h30.
- Domingos: loja fechada, folga para Isis/Karina/Thuane. Apenas 1 Story opcional do dono, gravado de casa. Nenhum checklist obrigatório da equipe na visão guiada.
- Natal (25/12): mensagem opcional do dono, pré-gravada; nenhuma tarefa para a equipe.
- 20/11: feriado, expediente sujeito a confirmação; conteúdo pode ficar preparado previamente, sem exigir gravação fora de escala.
- Reels: os oito previstos no editorial.js continuam; cinco têm participação do dono prevista (27/11 e 04, 18, 24, 31/12), sempre com alternativa de gravação pela equipe.
- Aberturas de Stories do dono: 16 e 27/11; 01, 24 e 31/12, somente se ele estiver disponível.
- Karina: demonstra o segundo modelo, acessórios e participa de enquetes; Isis cuida da abertura, publicação, directs e cobertura do atendimento. Thuane apoia arte/edição.
- Posts de feed: priorizados segunda e quinta quando já constavam do plano original, além das datas especiais preexistentes; posts antigos já marcados reaparecem somente como registro histórico.
- A quantidade inicial de 798 Stories pertence ao planejamento JSON original; a rotina ativa reduzida tem 339 Stories *possíveis*, incluindo sete domingos opcionais e um Natal opcional. Nada aqui comprova publicação ou engajamento.
- Horários são hipóteses a serem validadas pelo alcance, respostas e contatos reais; Metricool conectado ao ChatGPT NÃO significa coleta automática no GitHub Pages.
- Não mexe em dados de estoque, preços, Gestão, Sleep Player ou Central-IA; não publica no Instagram.

Rollback desta atualização: reverter somente a inclusão do script \`operacao-20261114.js\` em \`social-studio/index.html\` e a alteração pontual em \`isis.js\`, mantendo a versão do Firebase e os dados já sincronizados. Não limpar armazenamento nem excluir arquivos históricos. Os identificadores das tarefas existentes são preservados; rotinas retiradas da agenda continuam preservadas no banco, e posts antigos já marcados permanecem acessíveis como histórico.
