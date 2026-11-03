# ZicoAI — LangGraph durável experimental (Mac)

## Oficina 0.3 — integrada na publicação v104

**0.3.1:** conferência de texto vazio gerada no primeiro uso real agora recebe um único reparo completo do contrato. Nenhuma prova vazia é aceita ou descartada para aprovar o app. Persistência do erro após o reparo continua bloqueando a tarefa. A reprodução com o modelo real gerou contrato válido, e a suíte passou em 40/40 testes, sem pulos. A primeira tentativa foi preservada.

Esta seção atualiza o estado da oficina; o registro 0.2 abaixo é histórico. O agente de leitura do Mac e sua flag `ZPONTE_LANGGRAPH` continuam independentes. A oficina conectada usa o **PC**, com seus dois modelos destilados, e não presume que localhost no Mac seja o PC.

Fluxo implementado: PWA 53 → Apps Script 104 → `oficina_iniciar`/`oficina_estado` na ponte PC 2.5 candidata → `servico.cjs` → worker finito serial → contrato de provas → grafo com SQLite → candidato testado → rascunho novo na conversa. Nenhum serviço web é exposto. Apenas código fixo instalado é executado; o modelo não recebe terminal arbitrário.

### Instalação pendente e flags

Publicação autorizada em 03/11/2026: instalada no PC com ponte2.5, runtime Node/Playwright próprios, 39/39 testes aprovados no destino. Mac físico continua pendente. Ponte e atalho anteriores preservados; config.json não foi alterado. Transporte Google→ponte→serviço e gravação/leitura Drive confirmados antes da ativação. Para revisão posterior, o diretório `agente-duravel` deve ficar ao lado do `ponte.ps1` instalado, preservando a ponte anterior e sua configuração. Requer Node >=22 no PATH do processo da ponte, dependências desta pasta instaladas no próprio sistema e Chrome/Playwright. `ZICO_PLAYWRIGHT` aponta para o módulo Playwright e `ZICO_CHROME` para o executável do navegador; usa perfil isolado. Não copiar dependências nativas entre sistemas.

`ZICO_OFICINA=1` libera o adaptador PC; `OFICINA_PC_ATIVA=1` nas Propriedades do Apps Script libera o roteamento Auto. Ambas foram ativadas na publicação v104 após a confirmação do serviço instalado e do Drive real. Não iniciar pela interface antes de validar instalação/transporte reais. Não modificar PIN/segredos nem expor portas para viabilizar testes. A flag antiga do Mac não ativa esta oficina.

Modelos padrão exatos: leve Jackrong Qwen3.5-9B destilada Q4_K_M e especialista Hesamation Qwen3.6-35B-A3B destilada Q4_K_M (IDs em `servico.cjs`). `ZICO_MODELO_LEVE`/`ZICO_MODELO_CODIGO` podem definir modelos locais instalados para avaliações controladas. Não há troca silenciosa se o modelo pedido falhar.

### Contrato e recuperação

- `servico.cjs` recebe JSON no stdin e devolve JSON no stdout. Ações permitidas: `oficina_iniciar` e `oficina_estado`. Resultados ficam em `ZICO_OFICINA_DIR` ou `~/ZicoAI/Oficina-Tarefas`, separados por ID. Entrada, origem, contrato, candidatos e estados são preservados; sem sobrescrever origem.
- Mesmo ID/conteúdo retorna a mesma tarefa; conteúdo diferente é recusado. Estado `nao_recebido` permite ao Google repetir somente a entrada original preservada e conferida por hash, com o mesmo ID. Não recriar o pedido com contexto diferente. Falta de confirmação não autoriza outra tarefa.
- Provas fornecidas são fixas. Sem provas fornecidas, `contrato-provas.cjs` pede ao especialista um contrato declarativo antes de criar o app, limita ações/assertivas e exige resultado funcional após interação. O modelo não executa JavaScript de teste arbitrário. A origem deve reprovar; caso já aprove, o fluxo para e pede um defeito reproduzível.
- Reset mede que houve alteração antes do último clique; tema escuro mede as cores. Esses controles reduzem provas vazias, mas não substituem casos inéditos independentes. As cinco provas do contador cobrem somente esse exemplo.
- `worker.lock` reserva um único worker finito por diretório. Crash com trava não é recuperado à força: operador precisa conferir processo, último checkpoint e artefatos antes de reconciliar. Não apagar trava, SQLite ou arquivos do usuário automaticamente.
- HTML conectado limitado a 12 mil caracteres; o Auto mantém o caminho antigo por trechos em apps maiores. A geração local também tem limite de contexto. Não cortar a calculadora para fazê-la caber.

### Validação desta candidata

`node --test agente.test.cjs oficina.test.cjs ollama.test.cjs servico.test.cjs contrato-provas.test.cjs`: **39 PASS, zero FAIL, zero pulos**, dependências reais, adaptadores de modelo simulados e testes de Chromium reais. Separadamente, PWA/GS simulando somente Google/ponte entregou contador com modelos Ollama reais, recarga sem duplicar, cinco provas e hash exato. Função PowerShell → Node testada separadamente com serviço fictício (JSON/UTF-8 e flag desligada). Isso ainda não valida o poller Google nem o serviço instalado do usuário.

A entrega do contador consumiu 8,662 s na classificação 9B (8,144 s de carga) e 40,360 s na geração 35B (25,295 s de carga). Não são tempo total: contrato de provas e testes ficam fora desses dois números. Não é duelo nem prova de qualidade geral.

Autorização de publicação recebida; acompanhar um HTML descartável na interface real para avaliar geração, recarga e entrega com o transporte Google completo. Crescimento de registros, competição por memória do Ollama, conversa comum, multi-arquivos e LoRA permanecem fora desta entrega. O treino usa somente candidatos aprovados após curadoria; provas reservadas ficam fora.

## O que foi integrado

Este módulo chama as **ferramentas já existentes** da ponte `ponte-mac.js`, mas orquestradas com a biblioteca real `@langchain/langgraph` e checkpoints persistidos no **SQLite** via `@langchain/langgraph-checkpoint-sqlite`.

Por segurança, o primeiro passo libera **somente três operações de leitura**: `status`, `listar`, `ler`. Outras ações são recusadas. Reiniciar o processo pode repetir uma leitura, mas nunca executar cliques/escritas por esse novo caminho.

O módulo preserva os resultados no arquivo `~/ZicoAI/agente-duravel/checkpoints.sqlite`. Uma chamada com o mesmo `pedidoId`, ação e argumentos recebe o resultado salvo se já estiver finalizada, sem executar novamente. Não confundir checkpoint com garantia de exatamente-uma-vez para transações externas.

A ponte atual permanece funcionando como antes. O novo caminho `agente_duravel` foi incluído **atrás da variável `ZPONTE_LANGGRAPH=1`**, que começa desligada. O cérebro Apps Script v103.6 não chama automaticamente esse novo caminho.

## Preparar e testar num Mac real

O código deverá ser baixado para a pasta real de instalação da ponte. Faça backup da ponte antes de copiar, sem incluir `config.json`, PIN ou segredos em GitHub.

Requer Node.js 22 ou superior e internet na instalação das bibliotecas:

```bash
cd /CAMINHO/REAL/DA/PONTE/agente-duravel
npm install --no-audit --no-fund
npm test
node teste-real.cjs
```

O `teste-real.cjs` executa `status` com a ponte verdadeira e consulta a mesma execução novamente. Imprime somente um pequeno relatório do checkpoint, sem gravar segredos no repositório. Se a instalação usar arquivos de origem diferentes, primeiro confirme `node -v`, o caminho de `ponte-mac.js` e a configuração existente.

Para autorizar o Mac a receber pedidos `agente_duravel`, definir `ZPONTE_LANGGRAPH=1` no ambiente de execução do serviço `launchd` e reiniciar a ponte. **Não fazer isso até concluir os testes de integração reais**.

## Testes

- `npm test` valida checkpoint com banco real, reabertura, tentativas após falha temporária, negação de escrita/clique, confirmação explícita e proteção de ID.
- A GitHub Action `ZicoAI LangGraph agente duravel` instala os pacotes reais num Linux de teste e executa essa suíte.
- `node teste-real.cjs` exige o Mac do usuário e valida o adaptador com o status real.
- Testar integração `ponteBuscar/ponteResposta` e a recuperação do agente do Apps Script ainda são etapas **não concluídas**.

## Histórico: oficina de código 0.2 — ainda fora da PWA naquela etapa

Os arquivos `oficina.cjs`, `ollama.cjs`, `provas-html.cjs` e `oficina-cli.cjs` acrescentam um fluxo funcional separado, sem substituir o agente de leitura:

1. Ler um HTML em uma raiz autorizada e registrar seu hash.
2. Executar as provas na origem para obter o defeito observável.
3. O modelo leve classifica criar/corrigir e interface/lógica/ambos. O grafo define as etapas obrigatórias; a 9B não determina a solução técnica.
4. O especialista recebe código e evidência medida, sem opiniões técnicas do plano. Devolve apenas trechos ANTES/DEPOIS exatos.
5. Gravar uma cópia nova, nunca o arquivo de origem. Exigir ocorrência única de cada trecho, HTML completo e proteção contra perda de conteúdo.
6. Executar as provas em Chromium isolado, 390 px, sem rede nem perfil do usuário. Se falhar, permitir uma segunda candidata; sem aprovação, terminar como não concluído com os rascunhos preservados.
7. Entregar caminho, hash e provas. Nenhuma etapa publica, faz push ou inicia LoRA.

Cada nó salva checkpoint SQLite. Uma parada controlada após `salvar` foi retomada por outro processo, que executou somente os testes e a entrega; não repetiu a chamada de código. Acesso concorrente ao mesmo ID é recusado. Se o processo for morto à força enquanto segura a trava, ela **fica preservada para reconciliação pelo operador**; não existe retomada automática universal após crash. Não apagar travas à cegas nem confundir isso com proteção transacional de serviços externos.

**Validação real em 03/11/2026:** PC Windows com 9B Jackrong e 35B Hesamation locais. No jogo da velha entregue anteriormente pela Zica, a prova de estabilidade falhou antes e passou na candidata gerada pela 35B, juntamente com vitória, empate e reinício. Origem preservada. Houve tentativas anteriores reprovadas: o coordenador sugeria uma solução errada e induzia o especialista. A separação de responsabilidades e a medição anterior à geração resolveram esse caso. Isso não comprova qualidade geral ou equivalência a modelos de fronteira.

Na execução aprovada: planejamento 9,824 s (7,975 s de carga); código 34,144 s (23,763 s de carga), 256 tokens, cerca de 53,3 tokens/s durante a geração. Valores de uma execução, não média/duelo; não incluem todos os testes e inicialização.

O planejamento livre também chegou a atingir o limite de saída ao criar um app. Foi substituído por classificação curta em JSON com valores permitidos, seguida de etapas obrigatórias definidas no grafo. No teste de criação de contador a partir de HTML mínimo, a coordenação levou 0,621 s com o modelo já carregado; o especialista levou 32,746 s, incluindo 23,732 s de carga. As quatro provas funcionais passaram. A conversa normal da PWA não recebeu essa mudança; o teste anterior de “17 + 26, só o resultado” continua um defeito pendente naquele caminho.

### Executar e testar

Reutilize o Playwright da oficina, por `ZICO_PLAYWRIGHT` ou `~/ZicoAI/oficina/node_modules/playwright`. No Windows, `ZICO_CHROME` pode indicar o Chrome instalado; nunca usa o perfil real. O módulo não instala navegador automaticamente.

```bash
node --test agente.test.cjs oficina.test.cjs ollama.test.cjs
node oficina-cli.cjs --tarefa pedido.json --banco /pasta/checkpoints.sqlite --saidas /pasta/entregas --raiz /pasta/projeto --leve NOME_EXATO_9B --pesado NOME_EXATO_ESPECIALISTA
```

O pedido JSON tem `id` iniciado por `z`, `arquivo`, `pedido` e `provas`. Cada prova contém `nome`, `passos` e `conferir`. Passos permitidos: `clicar`, `preencher`/`valor`, `teclas`, `medir`. Conferências: `texto` com `igual`/`contem`, `quantidade` com `igual`, `semRolagemHorizontal`, `geometriaEstavel`. As provas são fornecidas pelo operador; o modelo não as pode reescrever. Elas provam somente o comportamento coberto, não todos os requisitos de um projeto.

`ZICO_OFICINA_PARAR_APOS=salvar` é um recurso de teste de retomada controlada. Removê-lo e repetir exatamente o mesmo pedido retoma o checkpoint. Trocar pedido/provas com o mesmo ID é recusado. Um arquivo entregue que foi modificado depois do teste perde a aprovação na consulta de execução seguinte.

Limites desta etapa: um HTML pequeno, saída em cópia, modelos Ollama em **localhost**, contexto 8192. Pedidos grandes são recusados antes de cortar código; a calculadora real de 116 mil letras ainda usa o caminho por trechos do cérebro existente. Não há terminal arbitrário, MCP, multi-arquivos, PRs, instalação física no Mac ou ligação desta oficina à PWA. O Mac não possui o mesmo especialista 35B do PC; a execução distribuída precisa de adaptador testado, sem presumir que localhost do Mac seja o PC. Não ativar flags/serviços existentes para tentar usar essa oficina antes dessa integração.

As dependências efetivamente testadas foram fixadas no `package.json` e no `pnpm-lock.yaml`. O módulo SQLite possui uma dependência nativa: instalar no Mac requer o binário para macOS/arm64, não copiar `node_modules` do Windows. Testes de Chromium exigem o Playwright presente; sem ele o caso correspondente aparece como pulado, e isso deve ser relatado.

### Integrações futuras

1. A caixa de saída da ponte do PR #5 protege respostas e efeitos incertos; não duplicar esse trabalho.
2. Para tarefas longas com cliques/escritas, introduzir **ID idempotente, aprovação e reconciliação**, antes de permiti-las no LangGraph. Sem isso não ativar ações destrutivas.
3. MCP v2 (`@modelcontextprotocol/client`) para conectores após limitar permissões e autenticação; nunca expor serviço sem autenticação.
4. LiteLLM como gateway local opcional somente após comparar a seleção atual de modelos. Não instalar um proxy público.
5. Promptfoo para benchmarks de conversa e ferramentas com casos reais. Nunca enviar dados privados da planilha para provedores externos durante testes sem autorização.

## Rollback

Deixe `ZPONTE_LANGGRAPH` desativado ou em `0`. O caminho antigo `ponteTarefa` e as chamadas `ollama_chat` continuam independentes. Não apagar `checkpoints.sqlite` sem backup, pois contém estado de testes.
