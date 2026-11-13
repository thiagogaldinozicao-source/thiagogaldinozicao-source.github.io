# Zicão Social Studio — Instagram 2026

**Projeto independente do Sleep Player, Gestão e catálogo da loja.**

- URL publicada: https://thiagogaldinozicao-source.github.io/social-studio/
- Diretório: `social-studio/` deste repositório, isolado de outros aplicativos
- Agenda: 12 de novembro até 31 de dezembro de 2026
- Editoras: Isis (execução e conteúdos), Karina (apoio e confirmação do estoque), Thuane (design/edição), Thiago (vídeos e aprovação)
- `index.html`: calendário, checklist, planos Stories/posts/Reels e recomendações comerciais baseadas no catálogo público
- `analytics.js` / `analytics.css`: métricas de Instagram importadas localmente de CSV, sem credenciais no cliente

## Conexão com Instagram

**Estado atual:** análises por importação CSV. Não há autenticação Meta/Metricool dentro deste site e a conexão do Metricool ao ChatGPT não transmite acesso ao HTML.

1. Vincular perfil profissional do Instagram a uma Página do Facebook e conectar no Metricool.
2. No Metricool: Analíticas → Instagram → selecionar Posts, Reels ou Stories → Baixar CSV.
3. Neste site: Resultados → Importar métricas CSV.
4. Revisar resultados por tipo de conteúdo, desempenho e horário e cruzar com directs/vendas anotados manualmente.

**Dados e privacidade:** arquivos CSV lidos localmente por File API; informações de métricas permanecem em localStorage do navegador. Nada é enviado ao GitHub ou ao catálogo. Os dados NÃO sincronizam entre dispositivos. Não informar senhas, tokens, dados de clientes, custos ou lucros.

**Limitação:** análise local não significa conexão em tempo real. Para sincronizar automaticamente será necessário backend protegido (ex.: função serverless e banco com controle de acesso), consentimento/credenciais oficiais e API contratada. A API do Metricool é restrita a planos Advanced/Custom; o acesso pelo plugin do ChatGPT é independente.

## Separação definitiva de repositório

O site funciona hoje numa pasta independente para preservar a URL. Para ter também um *repositório GitHub próprio*, crie o repositório `zicao-social-studio` e migre `social-studio/` para lá; o conector GitHub deste chat consegue editar arquivos em repositórios existentes, mas não oferece criar um repositório novo.

Antes de mudar o domínio, garanta GitHub Pages ativo no novo repositório, revise caminhos relativos para CSS/JS e links, valide carregamento do catálogo e depois decida se mantém redirecionamento da URL antiga.

## Testes mínimos para cada mudança

- 50 dias continuam de 12/11 a 31/12
- Black 16–30/11; Natal 01–25/12; voltar tema original em 26/12
- Checklists e backups de progresso preservados
- Catálogo permanece fonte pública somente leitura; jamais gravar preços/estoque
- Análise CSV sem comunicação de rede; sem dados privados em commits
- CSV válido por vírgula, ponto e vírgula e tab
- Arquivos malformados são recusados de forma amigável
- Mobile 320/375/390 px e Safari precisam ser verificados após futuras alterações
