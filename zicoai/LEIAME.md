# ZicoAI — guia do projeto (pra quem for mexer no código)

Assistente pessoal do Thiago (Zicão Store). O Thiago **não programa**: explique tudo em linguagem de leigo, entregue pronto, teste antes de dizer que funciona.

> Este repositório é PÚBLICO (GitHub Pages). Nunca coloque aqui chave de API, PIN, link do PC (Tailscale), link do script, perfil pessoal do Thiago ou dados de cliente. Esses dados ficam nas Propriedades do script e na planilha.

## Como funciona (3 partes)

```
 App (PWA)  ──POST JSON──▶  Cérebro (Google Apps Script)  ──▶  PC de casa (Ollama via Tailscale Funnel)
 zicoai/index.html          zicoai/cerebro/Codigo.gs       ──▶  Gemini 3.1 Flash-Lite (API grátis)
 iPhone e PC                     │                          ──▶  Groq gpt-oss-120b / qwen3.8-27b (grátis)
                                 ▼
                     Planilha Google "ZicoAI Memória"
                     (perfil, aprendizados, memoria, base, chats, mensagens)
```

### 1. App — `zicoai/index.html` (+ `manifest.json`, `sw.js`, ícones)
- HTML único, preto e dourado (#EBB533 / #F4CB63), fontes Bebas Neue + Barlow, mobile-first.
- Markdown com `marked@12.0.2` + `DOMPurify@3.1.6` (cdnjs). Bloco de código vira card com botão Copiar.
- Conversas na lateral (sincronizadas pela planilha), seletor de cérebro (Auto / Gemini / Groq / PC de casa), 🌐 Pesquisar, 🎨 Imagem, foto (reduzida pra 1600px), "Como respondi" (passos), Copiar, Refazer, Parar, painel 🧠 Memória (lembranças, aprendizados e histórico de correções).
- Em cada resposta: 👍/👎 (👎 abre campo de reclamação → vira aprendizado na planilha), 🔊 ouvir (speechSynthesis pt-BR), cérebro usado e tempo (`ms` que o script devolve).
- Bloco de código HTML ganha **▶ Testar**: abre o app num iframe sandbox (sem `allow-same-origin`) com `localStorage`/`sessionStorage` de mentira injetados, pra o app testado não mexer nos dados da ZicoAI. Botão **⬇ Baixar .html** salva o arquivo.
- 🎤 falar: `webkitSpeechRecognition` pt-BR. No iPhone com o app instalado na tela inicial o iOS bloqueia (`service-not-allowed`); o botão some e avisa pra usar o ditado do teclado.
- Configuração no próprio app (link do script + PIN + nome do aparelho), salva no localStorage.
- Link de instalação: `.../zicoai/#script=<URL do script>` já preenche o link, só falta o PIN.
- Envio: `fetch(url, {method:'POST', body: JSON.stringify(...)})` **sem** header Content-Type (vira text/plain e evita preflight de CORS do Apps Script).
- Ao mudar arquivos do app, suba o número do cache em `sw.js` (`zicoai-vN`).

### 2. Cérebro — `zicoai/cerebro/Codigo.gs`
Cópia do código que roda no projeto Apps Script "ZicoAI Cérebro". **A versão que vale é a do Apps Script**; mantenha os dois iguais.

- `doPost` com PIN. Ações: `teste`, `chat` (devolve `ms`), `chats`, `abrir`, `apagarChat`, `memorias`, `salvar`, `apagarMemoria`, `contexto`, `registrar`, `feedback` (nota up/down + comentário; 👎 com comentário ≥ 8 letras vira aprendizado com assunto `feedback`), `historico` (últimas 60 mudanças de base/perfil).
- `PERSONA` tem as regras 1–13 e um bloco HONESTIDADE (12 regras curtas: não fingir que fez, campo em branco em vez de inventar, NÃO CONFIRMADO = "deixa eu confirmar", não fechar com ofertas).
- `montarSistema()`: persona + regras + perfil inteiro + aprendizados + memória (25 recentes + 35 relevantes por palavra-chave) + até 10 trechos da base.
- Ordem dos cérebros em `conversar()`: normal = Gemini → Groq → Cerebras → PC → Groq Qwen; foto = Gemini → PC; programação = Groq → Cerebras → Gemini → PC → Groq Qwen (com `reasoning_effort: high` nos modelos gpt-oss; no PC usa `PC_MODELO_CODIGO`, ex. `zicoai-dev`). Cerebras é opcional: só entra se existir `CEREBRAS_KEY` (`temCerebro()`). O PC de casa (modelo 8B) é reserva: só responde quando a nuvem falha/estoura o limite ou quando o Thiago escolhe "PC" no seletor. PC que falha fica "desligado" 3 min (CacheService).
- Pesquisa (`pesquisar()`): Groq `browser_search` (funciona no grátis). Google Search do Gemini dá 429 no plano grátis.
- Aprendizado:
  - imagem: antes de gerar, `detalharPromptImagem` transforma pedido curto (< 45 palavras) num prompt detalhado em inglês (Gemini → Groq → Groq Qwen → Mistral → NVIDIA, 400 tokens); pedido longo passa igual; o passo "Detalhou o pedido da imagem" mostra o texto no "Como respondi".
  - tags que o modelo escreve: `[[MEMORIA: ...]]`, `[[APRENDIZADO: erro || certo]]`, `[[ESQUECER: trecho]]`, `[[IMAGEM: prompt em inglês]]`, `[[BASE: assunto || conteúdo]]` e `[[PERFIL: tópico || informação]]` (criam ou SUBSTITUEM a linha pelo assunto/tópico, ignorando maiúsculas e acentos; toda mudança vai pra aba `historico` com antes/depois; só com o que o Thiago disse);
  - Blindagem do aprendizado automático (v19): só entra o que tem apoio na fala do THIAGO (`apoiado()`: metade das palavras importantes e todos os números do fato precisam aparecer no que ele escreveu); linhas ZICOAI vão cortadas (400 chars) e o prompt avisa que nada só delas vira fato; regras sobre o próprio sistema (segundo plano, compactação, acesso) e "uso momentâneo" (tem interesse, perguntou) são descartadas. `gravarFato` nunca substitui linha do `perfil` nem de assuntos genéricos (Outros, Loja, Apps…): acrescenta, e só substitui assunto específico que exista UMA vez.
  - Linhas com `[IGNORAR]` em qualquer célula são puladas por `linhas()` (somem do contexto sem apagar) e removidas na arrumação de domingo (`apagarIgnoradas()`, com registro no histórico). Serve pra neutralizar lixo sem perder o rastro.
  - `aprenderSozinha()` roda a cada 10 min (gatilho criado por `ligarAprendizado()`), relê a aba `mensagens` desde a propriedade `APRENDIDO_ATE` e extrai fatos e correções com o Gemini, sem duplicar (`jaSabe()`). Também propõe `base` e `perfil` (passam por `gravarFato`, com histórico).
- Controle de cota (`motivoNaoCabe`, `registrarUso`, `castigo`): cada cérebro tem `tpm` (tokens/min), `rpm` (pedidos/min) e `rpd` (pedidos/dia) com folga abaixo do plano grátis. Uso do minuto fica no CacheService (`tk_*`, `rq_*`), uso do dia nas Propriedades (`rpd_<nome>_<yyyyMMdd>`). Antes de chamar, pula quem não cabe (aparece em "Como respondi": "X pulado: limite de tokens do minuto"). 429 que escapa → `off_<nome>` pelo tempo que a API pediu ("castigo"). Cérebro pequeno (limite < 50k) recebe `msgsEnxutas()` (sistema enxuto, 6 últimas mensagens, cortadas) quando a conversa cheia não cabe. Se todos estiverem no limite DO MINUTO, espera o minuto virar (≤ 61 s) e tenta de novo. Ação `cotas` (e o `teste`) devolve o uso do dia por cérebro; o app mostra em Configurar → Testar.
- Busca por significado (`semelhantes()`): além da busca por palavra (`relevantes()`), a BASE também é procurada por embedding (cosseno ≥ 0,62, até 4 trechos extras). Embedding fora do ar → `embed_off` 10 min e segue só por palavra.
- Modo cliente (`ehModoCliente()`): pergunta do tipo "responde pro cliente…" esconde o perfil pessoal (fica só "Como responder" e "Loja"), força a tabela de preços e acrescenta a seção MODO CLIENTE (só informação confirmada).
- Compactação: só as últimas 12 mensagens vão pro cérebro. Com 24+ mensagens na conversa, `compactarSePrecisar()` resume o que ficou pra trás (deixa as 10 últimas fora) e guarda em `chats` colunas Resumo/ResumidoAte; o resumo entra no sistema da próxima resposta. Refaz a cada +20 mensagens.
- Cérebros opcionais (entram só com a chave nas Propriedades; todos grátis, formato OpenAI): `GITHUB_TOKEN` com permissão "Models: read" → `GitHub GPT-4.1` (`models.github.ai`, primeiro da fila em código; 15 RPM/150 RPD); `MISTRAL_KEY` → `Mistral` (`mistral-medium-latest`, também lê imagem); `NVIDIA_KEY` → `NVIDIA Nemotron 120B` (`integrate.api.nvidia.com`, modelo `nvidia/nemotron-3.5-super-vl-120b-a12b`; o gpt-oss-120b saiu do ar lá em 03/09/2026). Cérebro com `reserva` (ex. NVIDIA → `google/gemma-4-31b-it`): se o modelo principal responder 404/410, `chamarCompat` tenta o reserva sozinho e registra o passo; `CF_TOKEN` + `CF_ACCOUNT_ID` → `Cloudflare Llama 70B` (URL montada com a conta). `reasoning_effort` só vai pros modelos gpt-oss.
- GitHub Models foi **encerrado pelo GitHub em 30/07/2026** (o host `models.github.ai` responde `OK` em texto pra tudo, de qualquer origem). O cérebro `github` fica no código com `aposentado: true` (nunca entra). O `GITHUB_TOKEN` continua servindo pra publicar apps. O Worker do Cloudflare (`proxy-worker.js`, `PROXY_URL` + `PROXY_SEGREDO`) fica como atalho genérico pra APIs que bloqueiem o Google.
- (histórico) GitHub Models bloqueia chamadas vindas do Google (responde `OK` em text/plain pra qualquer caminho; o token é válido em api.github.com). Solução: `zicoai/cerebro/proxy-worker.js` num Cloudflare Worker grátis (variável `SEGREDO`), e nas Propriedades `PROXY_URL` (https://…workers.dev) + `PROXY_SEGREDO`. `chamarCompat` manda a chamada do GitHub por `PROXY_URL/?alvo=<url>` com `X-Zico-Key`. Sem proxy, o passo diz "bloqueado pelo GitHub; configure PROXY_URL". `diagnosticoGitHub()` testa o token e 4 variações de cabeçalho pelo editor.
- Link colado na pergunta → `lerPagina()` busca o texto limpo em `r.jina.ai/<url>` (grátis, 20/min; cache 1 h) e entra como LEITURA DA PÁGINA. Também: Selic/CDI/IPCA (`brasilapi /taxas/v1`) e Bitcoin/Ethereum (AwesomeAPI BTC-BRL, ETH-BRL).
- Push sem Telegram: `NTFY_TOPICO` (nome longo e aleatório; app ntfy no iPhone inscrito no mesmo tópico) → `ntfy()` publica em JSON em `https://ntfy.sh/` (bom dia e avisos).
- Telegram: `sendChatAction typing` antes de responder, comandos `/nova`, `/cotas`, `/ajuda` (registrados por `setMyCommands` no `ligarTelegram`).
- APIs grátis sem chave (`contextoConectores`, com cache `pegarJSON`): dólar (AwesomeAPI, + regra "comercial + 10 pontos"), clima de Itaú de Minas (Open-Meteo, 3 dias), CEP (ViaCEP), CNPJ (BrasilAPI), feriados (BrasilAPI), notícias (RSS do Google News via XmlService). Entram só quando a pergunta fala do assunto; quando um dado ao vivo entra, a pesquisa web automática é dispensada.
- Áudio → texto: ação `transcrever` (base64 + tipo) usa Groq Whisper `whisper-large-v3-turbo` (mesma GROQ_KEY). O app grava com MediaRecorder (funciona no iPhone instalado) e manda; no Telegram, voice/audio é transcrito antes de responder.
- Telegram (`telegramEntrada`): o Telegram NÃO aceita o 302 que o Apps Script devolve em POST. Por isso o webhook aponta pro Worker do Cloudflare (`PROXY_URL/tg`, com `secret_token` = TELEGRAM_SEGREDO, só letras/números/_/-); o Worker confere `X-Telegram-Bot-Api-Secret-Token`, repassa o corpo pra `ZICO_EXEC?tg=<segredo>` seguindo o redirecionamento e responde 200 ao Telegram. Variáveis do Worker: `SEGREDO` e `ZICO_EXEC`. Sem PROXY_URL, `ligarTelegram` aponta direto pro `/exec` (funciona só se o Telegram voltar a aceitar 302). `diagnosticoTelegram()` mostra `getWebhookInfo` (último erro, pendências). Primeira pessoa que manda o PIN vira `TELEGRAM_CHAT_ID`; os outros são ignorados. Uma conversa contínua (`TELEGRAM_CONVERSA`, "/nova" começa outra), fotos viram imagem, áudio vira texto, resposta sai em texto simples (markdown limpo) e imagem gerada vai como foto. `update_id` repetido é ignorado (Telegram reenvia quando demora). `ligarTelegram()` registra o webhook. `bomDia()` também manda pro Telegram. Propriedades: `TELEGRAM_TOKEN`, `TELEGRAM_SEGREDO`, `TELEGRAM_CHAT_ID` (auto), `TELEGRAM_CONVERSA` (auto).
- Publicar app (`publicarApp`, ação `publicar`): grava o HTML em `apps/<slug>/index.html` deste repositório pela API do GitHub (propriedade `GITHUB_TOKEN`, fine-grained, Contents: write só neste repositório) e devolve `https://thiagogaldinozicao-source.github.io/apps/<slug>/`. No app: botão ⬆ Publicar nos blocos HTML e na prévia.
- Erros de digitação do Thiago: regra 9c na PERSONA (entender pelo contexto, nunca corrigir nem pedir pra repetir) + linha no perfil. Na busca por palavra, `relevantes()` usa `expandir()` (abreviações: oq, pq, tbm, msm, vc, hj, cel…) e `parecida()` (mesmo começo, tamanho parecido, 75% das letras em comum) pra "garnatia" achar "garantia".
- Calculadora exata (`calculadora()`, seção CÁLCULO EXATO): tabela Price ("1000 a 2,99% em 12x"), taxa de maquininha PagBank/PicPay (constante `TAXAS`, do perfil; atualizar lá se mudar), regra de repasse (+20% em 12x), importação em dólar (US$ → +20% frete → × (comercial + 0,10), e a versão com 15%), e contas soltas ("quanto é 1250*1,2", "2500 - 15%"). O modelo recebe o número pronto e só explica.
- Memória episódica (`buscarConversas()`, seção CONVERSAS ANTIGAS): com gatilho tipo "lembra o que a gente falou sobre…", procura por palavra nas mensagens antigas do Thiago e traz até 6 trechos com data e título da conversa.
- Trava de PIN: 10 PINs errados em 10 min → bloqueia tudo por 10 min (CacheService `pin_erros`/`pin_bloqueado`).
- Resposta vazia de um cérebro conta como falha e passa pro próximo.
- App: todo bloco HTML da última resposta é aberto escondido num iframe sandbox com `window.onerror`; se der erro aparece "⚠️ deu erro ao abrir: … [Pedir correção]", que manda o erro de volta pra ela corrigir. Sem erro: "✓ abriu sem erro".
- Aprender com todos os cérebros (destilação): 👍 numa resposta grava pergunta+resposta+cérebro na aba `exemplos` (com assunto: código, cliente, cálculo, produto, geral). `exemplosPara()` põe no sistema até 2 exemplos ligados à pergunta (1 no modo enxuto), então o PC e os cérebros pequenos aprendem o nível das respostas boas do Gemini/Groq.
- Roteador por feedback (`notaCerebros`/`reordenarPorNota`): últimos 40 👍/👎 por cérebro; cérebro com menos de 50% de aprovação (mínimo 3 votos) vai pro fim da fila no modo Auto. Cache 30 min, zerado a cada feedback. Escolha manual no seletor ignora isso.
- Ensinar com arquivo (ação `aprenderTexto`, botão 📎 no painel Memória): texto de .txt/.md/.csv/.json (até 60k caracteres) → Gemini separa em até 60 fatos "assunto || conteúdo" → `gravarFato('base')` com origem `arquivo:<nome>`; itens com CPF/telefone são barrados.
- `arrumarMemoria()` (domingo 4h): remove lembranças repetidas (`jaSabe`), mantendo a mais nova, e registra em `historico` (origem `arrumacao`).
- Identidade: a ZicoAI é parceira de criação (apps, jogos, IA, imagens) e assistente pessoal; a loja é um dos assuntos. Pedido de ajuste em app → arquivo COMPLETO.
- Meus apps (estilo artefatos): ações `apps` (lista as pastas de `/apps` pela API pública do GitHub, cache 5 min), `appCodigo` (HTML atual via raw.githubusercontent), `appVersoes` (commits do arquivo), `appRestaurar` (republica uma versão antiga via `publicarApp`). No chat, `appSlug` na requisição coloca o código atual do app no contexto (seção CÓDIGO ATUAL DO APP). App: painel 🧩 Meus apps (Abrir, ✎ Editar com a ZicoAI, ▶ Testar, ⏱ Versões/↩ voltar); em edição aparece a faixa "Editando o app X" e o ⬆ Publicar usa o mesmo nome sem perguntar.
- Agentes em segundo plano (aba `tarefas`: Id | Criada | Conversa | Pedido | Status | Passos | Resultado | Atualizada | Aparelho | Pai) — versão 35: pedido grande vira tarefa por `[[TAREFA: …]]`, pelo chip 🧠 Agente (`modo: 'agente'`) ou pela ação `tarefa`.
  - Fila em paralelo: `MAX_AGENTES_JUNTOS = 3`. `agendarRodada()` cria um gatilho `after(1000)` só se (gatilhos de `rodarTarefas` + tarefas `rodando`) < 3. `rodarTarefas(e)` apaga só o próprio gatilho (`e.triggerUid`), destrava tarefas `rodando` sem sinal há 8 min (`destravarTarefas`), pega uma por vez com trava (`pegarProxima`) e, se ainda tem fila, chama mais um trabalhador. Cada trabalhador roda até ~3,3 min pegando tarefas.
  - `agente(id, pedido, chatId, aparelho, prazo, pai)`: laço de ferramentas em JSON (`{"ferramenta"}` / `{"resposta"}`), até `MAX_FERRAMENTAS = 30` ferramentas e `MAX_PASSOS_AGENTE = 45` chamadas. Cérebros: Gemini → Groq → Mistral → Cerebras → NVIDIA → Groq Qwen; se a nuvem toda estiver fora por cota do dia/castigo (ou na última volta), usa o PC (`cerebroPCcodigo`, ex. zicoai-dev). Limite só do minuto: espera virar o minuto.
  - Tarefa longa: perto de 4,5 min (`PRAZO_RODADA`) ou se teria que esperar o minuto além do prazo, salva o progresso (mensagens, ferramentas usadas, passos) em `ZicoAI Tarefas (progresso)/<id>.json` no Drive, volta pra `pendente` e outra rodada continua de onde parou ("Continuou de onde parou (rodada N)"). O arquivo vai pra lixeira no fim.
  - Agente chefe: ferramenta `dividir_em_agentes {partes: [2 a 4]}` cria tarefas filhas (`[parte de <id>] …`, coluna Pai, sem conversa) e o chefe fica `esperando`. Cada parte, ao terminar (ou dar erro), chama `avisarPai`: quando todas acabam, junta os resultados como "RESULTADO de dividir_em_agentes", o chefe volta pra fila e monta a resposta final. Só o chefe posta na conversa/Telegram. Parte não pode dividir de novo. Cancelar o chefe cancela as partes.
  - Ações: `tarefas` (lista, com `pai`), `cancelarTarefa`. App: painel ⧉ (Em execução inclui `esperando`), passos ao vivo a cada 8 s, ■ parar, Ver resultado.
- Treino diário (aba `treino`: Data | Tipo | Nota | Detalhe), tudo na nuvem, PC pode estar desligado:
  - `treinoDiario()` 3h: sorteia 4 perguntas da prova (peso maior pras nunca feitas ou com nota baixa), responde, corrige (`corrigirResposta`, temperatura 0), grava nota/data na prova; nota < 7,5 vira aprendizado (assunto `treino`).
  - `revisarDia()` 23h: pega os pares pergunta/resposta do dia (até 25) e um revisor aponta só quebras de FORMA e HONESTIDADE (oferta no fim, fingir ação, inventar número, tom, bloco de código indevido, longo demais, não respondeu); cada problema vira aprendizado (assunto `revisão`, com o cérebro culpado no texto) e a contagem por cérebro vai pro detalhe.
  - `perguntaDoDia()`: entra no bom dia; pergunta ao Thiago um item NÃO CONFIRMADO da base (ou pede a tabela de preços se vazia), sem repetir.
  - `gerarPerguntasProva()` domingo 5h: até 3 perguntas novas a partir da base e das conversas (marcadas "gerada automaticamente"), pra prova não virar decoreba.
  - `exportarTreino()` domingo 5h: exemplos aprovados + aprendizados viram JSONL (formato chat) na pasta "ZicoAI Treino" do Drive, pro dia de fazer fine-tuning do modelo do PC.
- "Já existe parecido" (v26): pedido de criar app/código consulta os apps publicados (`listarApps`, só com GITHUB_TOKEN) e pedidos antigos de código do Thiago (palavras do pedido, mínimo 2 em comum); se achar, entra a seção JÁ EXISTE PARECIDO e a regra manda avisar e perguntar se é pra melhorar o existente ou fazer novo.
- Auto-melhoria (v24): a ZicoAI edita o PRÓPRIO código. Pedido tipo "muda em vc…" vira `[[TAREFA: MELHORAR MEU CÓDIGO: …]]`; o agente usa `ler_meu_codigo {termo}` (funções inteiras ligadas ao termo), `editar_meu_codigo {edicoes:[{procurar,trocar}], motivo}` e `desfazer_meu_codigo`. `autoMelhorar()`: lê o projeto pela API do Apps Script (`script.googleapis.com`, token do script, escopos `script.projects` + `script.deployments`), faz backup na pasta "ZicoAI Código" do Drive, aplica trocas exatas (cada `procurar` com ≥ 12 chars e única, máx. 10), `conferirCodigo` (sintaxe via `new Function`, não encolher > 40%, declarações obrigatórias: doPost, checagem do PIN, autoMelhorar, desfazerCodigo, apiScript, conferirCodigo), salva no HEAD, testa pela `URL_TESTE` (implantação @HEAD: ações `teste`, `contexto`, `cotas`), cria versão e aponta `DEPLOY_ID`; qualquer falha → volta o código anterior. Sucesso → `ULTIMO_BACKUP`, commit em `zicoai/cerebro/Codigo.gs` no GitHub (GITHUB_TOKEN), linha em `historico` (aba `codigo`) e memória. `DEPLOY_ID` e `URL_TESTE` ficam na aba `config`.
- Regra 9a (correção fina): quando o Thiago corrige, 1 linha "Vc tem razão: …" + a versão corrigida, sem desculpa.
- Rotinas (`ligarRotinas()` cria os gatilhos): `bomDia()` todo dia 7h monta o resumo (agenda de hoje, vendas de ontem e do mês, e-mails novos, últimos aprendizados, última prova), pede ao cérebro uma mensagem curta e grava como conversa `bomdiaAAAAMMDD` (aparece no app como "☀️ Bom dia dd/MM"; não duplica no mesmo dia). `backupPlanilha()` domingo 3h copia a planilha pra pasta "ZicoAI Backups" no Drive (se falhar, anota na memória). `avisoCota()` entra na resposta do chat (`aviso`) quando um cérebro passa de 80% da cota do dia; o app mostra em itálico no fim da mensagem.
- Prova semanal: `rodarProva()` responde cada linha da aba `prova` (questão com `MSG 1 … || MSG 2 (mesma conversa): …` vira 2 turnos), um corretor (Gemini/Groq/Cerebras, temperatura 0) dá nota de 0 a 10 pelos critérios, grava `Última nota`/`Última data`, nota < 7,5 vira aprendizado (assunto `prova`) e a média vai pra memória. `ligarProva()` cria gatilho segunda 4h.
- Bloqueia CPF e telefone na memória (`temDadoSensivel`).
- `instalar()` testa PIN, Gemini, Groq, PC e pesquisa (rodar pelo editor e ler o Registro de execução).

Aba `config` (Chave | Valor) serve de reserva pra `COMFY_URL`, `COMFY_WORKFLOW`, `PC_MODELO`, `PC_MODELO_CODIGO` quando a propriedade não existe (valores grandes e configuração sem abrir o editor).

Propriedades do script (nunca no código): `GEMINI_KEY`, `GROQ_KEY`, `PIN`, `PC_URL` (link do Funnel com caminho secreto), `PC_MODELO` (opcional, padrão `zicoai`), `PC_MODELO_CODIGO` (opcional, ex. `zicoai-dev`), `CEREBRAS_KEY`, `MISTRAL_KEY`, `NVIDIA_KEY`, `CF_TOKEN`+`CF_ACCOUNT_ID`, `NTFY_TOPICO` (opcionais), `TELEGRAM_TOKEN`/`TELEGRAM_SEGREDO` (opcional), `GITHUB_TOKEN` (opcional), `COMFY_URL`/`COMFY_WORKFLOW` (opcional), `APRENDIDO_ATE`, `TELEGRAM_CHAT_ID`, `TELEGRAM_CONVERSA`, `rpd_*` (controle interno).

### 3. Planilha "ZicoAI Memória"
Abas e colunas:
- `memoria`: Data | Lembrança | Origem
- `aprendizados`: Data | Erro | Certo | Assunto
- `perfil`: Tópico | Informação
- `base`: Assunto | Conteúdo
- `chats`: Conversa | Título | Criada | Atualizada | Aparelho
- `mensagens`: Conversa | Data | Quem | Mensagem | Cérebro | Aparelho | Passos (o "Como respondi", pra diagnóstico)
- `chats` ganhou Resumo | ResumidoAte (compactação)
- `historico`: Data | Aba | Assunto | Antes | Depois | Origem (toda mudança automática de base/perfil; pra desfazer, copie "Antes" de volta)
- `feedback`: Data | Conversa | Nota | Comentário | Cérebro | Resposta (início) | Aparelho
- `vendas`: Data | Valor | Descrição | Origem (anotadas pela tag `[[VENDA]]`)
- `precos`: Produto | Condição | Capacidade | Cor | Preço Pix | Preço 12x | Estoque | Obs. ÚNICA fonte de preço: entra no sistema quando a pergunta fala de preço/valor/estoque ou cita produto (filtra pelo número do modelo). Vazia → a IA é avisada pra não dar preço.
- `exemplos`: Data | Pergunta | Resposta | Cérebro | Assunto (respostas aprovadas com 👍)
- `treino`: Data | Tipo | Nota | Detalhe (prova rápida, revisão do dia, pergunta do dia, perguntas novas, exportação)
- `tarefas`: Id | Criada | Conversa | Pedido | Status (pendente/rodando/esperando/concluída/erro/cancelada) | Passos | Resultado | Atualizada | Aparelho | Pai (id do agente chefe, nas partes)
- `vetores`: Aba | Texto | Vetor (cache dos embeddings `gemini-embedding-001`, 256 dimensões, arredondados). Preenchida sozinha, até 20 trechos novos por resposta.
- `config`: Chave | Valor
- `prova`: Nº | Grupo | Pergunta exata | Critérios nota 10 | Erro mais provável | Última nota | Última data | Observação (20 perguntas da prova semanal; gabarito feito em 30/10)

Datas com `'` na frente pra não virarem número. Texto começando com `= + - @` leva `'` (função `seguro`).

## Testar sem internet
```
cd zicoai/cerebro/testes
node t1.js   # chat, memória, pesquisa, imagem, conversas, foto
node t2.js   # PC de casa: ordem, queda, cache
node t3.js   # aprender sozinha
node t4.js   # BASE/PERFIL+historico, feedback, compactação, Cerebras, PC de código, prova
node t5.js   # conectores Google (Agenda, Gmail, Drive, vendas) + imagem no PC (ComfyUI) + config pela planilha
node t6.js   # controle de cota: tokens/min, pedidos/dia, castigo 429, contexto enxuto, espera o minuto
node t7.js   # tabela de preços, busca por significado, modo cliente
node t8.js   # rotinas: bom dia, backup, aviso de cota
node t9.js   # APIs grátis, Whisper, Telegram, publicar no GitHub
node t10.js  # exemplos aprovados, roteador por feedback, ensinar com arquivo, arrumar memória
node t11.js  # calculadora exata, conversas antigas, trava de PIN, resposta vazia
node t12.js  # treino diário, revisão do dia, pergunta do dia, perguntas novas, exportação
node t13.js  # cérebros extras, leitura de link, taxas, cripto, ntfy, comandos do Telegram
node t14.js  # agentes em segundo plano
node t15.js  # meus apps: listar, código no contexto, versões, restaurar
node t16.js  # blindagem do aprender sozinha, perfil não sobrescrito, [IGNORAR]
node t17.js  # erros de digitação: busca tolerante, abreviações, regra
node t18.js  # auto-melhoria: ler, editar, testar, publicar, desfazer o próprio código
node t19.js  # já existe parecido (apps publicados e pedidos antigos)
node t20.js  # imagem com pedido detalhado, NVIDIA reserva, 3 agentes juntos, tarefa longa que continua, agente chefe, PC reserva
```
Teste do app no navegador (Playwright, simula o servidor): ver `scratchpad/ui.js` da sessão de 30/10 — confere tempo, 👍/👎, ▶ Testar e que o localStorage da ZicoAI fica intacto.
`harness.js` simula SpreadsheetApp, UrlFetchApp, PropertiesService, CacheService, LockService e ScriptApp. Os dados de exemplo não são do Thiago.

## Publicar o cérebro (Apps Script)
Opção A, com clasp (dá pra fazer tudo pelo terminal):
1. O Thiago liga a API do Apps Script uma vez: https://script.google.com/home/usersettings
2. `npm i -g @google/clasp` e depois `clasp login --no-localhost`. Isso gera um link: o Thiago abre, autoriza e cola o código de volta.
3. Numa pasta vazia, `clasp clone <SCRIPT_ID>`. Isso traz o `Código.js` e o `appsscript.json`. Copie o `Codigo.gs` daqui pra dentro do `Código.js` e rode `clasp push`.
4. `clasp deploy -i <DEPLOYMENT_ID> -d "descrição"` atualiza a implantação sem mudar o link.
(SCRIPT_ID e DEPLOYMENT_ID ficam com o Thiago, não aqui.)

Opção B, à mão: abrir o editor, colar, Ctrl+S, depois Implantar → Gerenciar implantações → lápis → Versão: Nova versão → Implantar.

Escopo novo (Gmail, Agenda, Drive, gatilhos) exige que o Thiago autorize de novo: rodar qualquer função pelo editor → Revisar permissões → Avançado → Acessar → Permitir.

## Regras do dono
- Respostas curtas e diretas. Texto pra cliente em bloco de código, estilo dele ("vc", "kkk"), com acento.
- Tudo grátis. Nada de WhatsApp com biblioteca não oficial (risco de ban do número da loja).
- Nada que mexa com dinheiro no sistema Zicão Gestão sem aprovação dele.
- Não apagar nada no PC dele.
- Nunca inventar endereço, horário, garantia ou preço: perguntar.
