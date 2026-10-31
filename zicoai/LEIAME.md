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
- Cérebros opcionais (entram só com a chave nas Propriedades; todos grátis, formato OpenAI): `GITHUB_TOKEN` com permissão "Models: read" → `GitHub GPT-4.1` (`models.github.ai`, primeiro da fila em código; 15 RPM/150 RPD); `MISTRAL_KEY` → `Mistral` (`mistral-small-latest`, também lê imagem; 429 "capacity exceeded" → reserva `mistral-medium-latest`); `NVIDIA_KEY` → `NVIDIA Nemotron 120B` (`integrate.api.nvidia.com`, modelo `nvidia/nemotron-3.5-super-vl-120b-a12b`; o gpt-oss-120b saiu do ar lá em 03/09/2026). Cérebro com `reserva` (ex. NVIDIA → `google/gemma-4-31b-it`): se o modelo principal responder 404/410, `chamarCompat` tenta o reserva sozinho e registra o passo; `CF_TOKEN` + `CF_ACCOUNT_ID` → `Cloudflare Llama 70B` (URL montada com a conta). `reasoning_effort` só vai pros modelos gpt-oss.
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
- `chats`: Conversa | Título | Criada | Atualizada | Aparelho | Fixada ("sim") | Projeto (id)
- `projetos`: Id | Nome | Instruções | Criado | Atualizado
- `projeto_arquivos`: Projeto | Nome | Conteúdo (texto, até 45 mil letras) | Data
- `tarefas`: Id | Criada | Conversa | Pedido | Status (pendente/rodando/esperando/concluída/erro/cancelada) | Passos | Resultado | Atualizada | Aparelho | Pai (id do agente chefe, nas partes)
- `vetores`: Aba | Texto | Vetor (cache dos embeddings `gemini-embedding-001`, 256 dimensões, arredondados). Preenchida sozinha, até 20 trechos novos por resposta.
- `config`: Chave | Valor
- `prova`: Nº | Grupo | Pergunta exata | Critérios nota 10 | Erro mais provável | Última nota | Última data | Observação (20 perguntas da prova semanal; gabarito feito em 30/10)

Datas com `'` na frente pra não virarem número. Texto começando com `= + - @` leva `'` (função `seguro`).

## Versão 36 (30/10 noite): igual o app do Claude + acesso ao PC
- **Conversa (⋯ no topo)**: Fixar/Desafixar, Compartilhar (navigator.share ou copia), Renomear, Mudar projeto, Excluir. Ação `chatMeta {chatId, titulo?, fixada?, projeto?}`. `listarChats` devolve `fixada`, `projeto` e `trabalhando` (tem tarefa pendente/rodando/esperando) e põe as fixadas primeiro. Lateral: 📌, nome do projeto e bolinha girando.
- **Projetos (📁 na lateral)**: instruções + arquivos de texto por projeto. `contextoProjeto(id)` entra no sistema de toda conversa do projeto (o app manda `projeto` na conversa nova; depois vale a coluna Projeto da aba chats) e também no agente. Ações: `projetos`, `projetoSalvar {id?, nome, instrucoes}`, `projetoArquivo {projeto, nome, conteudo}` (mesmo nome troca; CPF/telefone barrado), `projetoTirarArquivo`, `projetoArquivoLer`.
- **Dispositivos (💻 na lateral)**: ação `dispositivos` testa Ollama (`PC_URL/api/tags`), ComfyUI (`COMFY_URL/system_stats`) e a ponte (`status`).
- **Ponte do PC v2** (`zicoai/pc/ponte.ps1`, Windows PowerShell 5.1, sem instalar nada): é o PC que BUSCA os pedidos (nada aberto pra internet, sem Funnel). A v1 (servidor TCP + Tailscale Funnel) dava 502 pelo Funnel e foi trocada em 30/10.
  - PC: laço `Chamar {acao:'ponteBuscar', segredo, nome, versao}` no `/exec` (Invoke-WebRequest com corpo em bytes UTF-8, segue o 302 do Apps Script, lê `RawContentStream` como UTF-8). Pra cada pedido executa a ação e manda `{acao:'ponteResposta', segredo, id, resultado: JSON}`. Sem conexão: espera 5–60 s e tenta de novo. Log em `ponte-log.txt` (reserva em `%TEMP%`). `config.json`: `exec`, `segredo`, `pastas[{caminho, escrever}]`.
  - Ações no PC: `status`, `listar`, `ler` (texto ou imagem até 1 MB), `escrever` (só pasta com `escrever: true`; nunca sobrescreve, cria "nome (2)"), `print` (tela inteira, JPEG 1600 px), `abrir` (site https, programas da lista, arquivo de pasta liberada sem .exe/.bat), `comando` (lista fixa: espaco_disco, processos, gpu, ip, sistema, ollama_modelos). Nunca apaga.
  - Cérebro: `doPost` atende `ponteBuscar`/`ponteResposta` ANTES do PIN, com `PONTE_SEGREDO`. Fila em `CacheService` (`ponte_fila`, com trava); `ponteBuscar` espera até 20 s (long-poll) e marca `ponte_visto`; `ponteResposta` grava em pedaços de 90 mil letras (`pres_<id>_<i>`). `ponte(acao, dados)` falha na hora se o PC não buscou nos últimos 90 s, senão espera até 45 s; pedido vencido não é entregue depois.
  - Instalar/atualizar (PowerShell do PC): `irm "https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai/pc/instalar.ps1?v=2" | iex`. Baixa a ponte, mantém/cria o config (acrescenta `exec`), cria o atalho na Inicialização, liga, espera "conectado na ZicoAI" no log (se não, roda visível pra mostrar o erro) e baixa a extensão do Chrome.
  - Ferramentas do agente: `pc_status`, `pc_listar`, `pc_ler`, `pc_escrever`, `pc_print` (salva no Drive e descreve com `descreverImagem`: Gemini → Mistral → PC), `pc_abrir`, `pc_comando`. Pedido de PC no chat vira `[[TAREFA]]`.
  - Sobra da v1: o caminho `/ponte-…` no Funnel aponta pra porta 8790, que não tem mais nada escutando. Pode tirar com `tailscale funnel status` / `--set-path=… off` quando quiser.
- **Extensão do Chrome** (`zicoai/extensao/`, Manifest V3, painel lateral): o painel abre o app num iframe (`?ext=1`, precisa configurar link e PIN uma vez lá dentro) e tem "📄 Usar esta página" / "✂️ Usar trecho selecionado" (`chrome.scripting`), que mandam `{tipo:'zicoai-pagina', titulo, url, texto, selecao}` por postMessage. O app mostra um chip "📄 Página" e junta o texto à próxima pergunta. Instalar: chrome://extensions → Modo do desenvolvedor → Carregar sem compactação → pasta `extensao-chrome`.
- **Texto longo colado** (v40, > 1500 letras): vira documento — sem pesquisa automática, sem conectores (e-mail, Drive, agenda, link, dólar) e com a seção `### TEXTO LONGO COLADO` no sistema (não mudar de assunto por causa da conversa anterior).
- **Ajustes**: Gemini (ou outro) com 502/503/"high demand" fica 90 s fora (`ehSobrecarga`), no chat e no agente; pesquisa reserva quando o `browser_search` do Groq falha (`pesquisaReserva`: DuckDuckGo → Bing lidos pelo r.jina.ai, um cérebro responde só com os resultados); "Como respondi" com ícone por tipo de passo (`iconePasso`); efeito de digitação na resposta nova (`digita`, só texto fora de blocos de código; o servidor continua mandando tudo de uma vez).

## Fase 1 do treino (v41, 30/10 noite) — caminho em `claude/caminho-zicoai.md` no projeto
- **Exemplos por tipo**: `tipoTarefa()` (cliente, comparativo, preço, código, loja, geral). Aba `exemplos` ganhou Tipo e Origem (`👍 Thiago`, `estudo (revisar)`, `estudo ✅ Thiago`). `guardarExemplo()` não duplica e barra CPF/telefone.
- **Placar** (aba `placar`: Data | Cérebro | Tipo | Nota | Pergunta nº | O que faltou): `placarDiario()` às 2h — um cérebro por dia em rodízio (gemini, groq, mistral, nvidia, groq2, pc) responde 5 perguntas da prova (só as de 1 mensagem) com o MESMO contexto (sistema enxuto cortado em 14 mil letras) e `corrigirResposta` dá a nota. Não coube no limite/sem corretor não conta. `placar()` = média por cérebro e por tipo (60 dias).
- **Estudo noturno** `estudoNoturno()` à 1h: tema do dia (`TEMAS_ESTUDO`, rodízio), lê fontes abertas (MDN, docs do Google) pelo r.jina.ai ou a busca reserva, gera 3 exercícios com modelo ABERTO (Groq/NVIDIA), reprova código com erro de sintaxe (`new Function` nos blocos js) e o que o revisor (`corrigirResposta`) der < 7,5; o resto vira exemplo "estudo (revisar)".
- `garantirRotinasTreino()` cria os gatilhos `estudoNoturno` (1h) e `placarDiario` (2h) sozinha (chamada no `aprenderSozinha`, cache 6 h).
- `exportarTreino()` só exporta exemplos aprovados e que não vieram do Gemini (conferir os termos antes de usar respostas dele pra treinar).
- Ações: `treinoResumo` (por tipo, placar, até 20 pra revisar), `revisarExemplo {pergunta, aprovado}` (👎 marca [IGNORAR]). App: 📈 Treino na lateral.
- App também ganhou (v41): cores no código (highlight.js 11.9.0), ✎ Editar e ⧉ Copiar nas mensagens do Thiago (`cortarConversa {chatId, manter}` apaga as mensagens depois da editada), 📎 anexar arquivo de texto (vai junto como documento, com marca `[📄 arquivo: nome]`), botão ↓ pra ir pro fim.

## Método de trabalho do agente (30/10 noite)
- `PROMPT_AGENTE` ganhou o MÉTODO (igual o Claude): entender → plano curto → ler antes de mexer → mudar pouco → testar → só dizer que funciona depois de testar. Relatório final no formato que o Thiago gostou: 1 frase de resultado + "Já está valendo" / "Pronto, falta publicar" / "Precisa de você" / "Falta" (só as que tiverem conteúdo). Também na base: "Manual de trabalho: relatório no fim da tarefa".
- Aba `base` ganhou 5 linhas "Manual de trabalho: …" (tarefa grande, mexer em código, publicar o cérebro, erros que o Claude já cometeu, escolher o cérebro certo).
- Ferramenta `pc_testar`: pede pra ponte (comando `testes_zicoai`, ponte 2.2) baixar/atualizar a cópia do GitHub em `%USERPROFILE%\ZicoAI\repo` e rodar `node t*.js`; devolve "TOTAL: N testes ok, M arquivo(s) com falha". `ponte(acao, dados, esperaMs)` aceita espera maior (170 s aqui). Precisa de Git e Node no PC.

## Resumo ao vivo e trajetórias (30/10 noite)
- **Resumo igual o painel do Claude**: `passo()` também grava os passos no cache (`vivo_<reqId>`, 5 min); o app manda `reqId` no chat e consulta a ação `aoVivo` a cada 1,5 s enquanto espera, trocando as etapas de mentirinha pelos passos de verdade. Título automático ("Leu a memória e pesquisou na web", `tituloResumo`), linha do tempo com 💭 pensamentos, ferramentas com ícone e detalhe clicável (pedido + resultado) — `lerPasso`/`listaResumo` no app. Tarefa rodando na conversa aberta aparece como card ao vivo (`vivoTarefaNaConversa`).
- Agente: cada JSON traz `"pensamento"` (frase curta no gerúndio) → passo `💭 …`; ferramenta → `🔧 nome {args} → resultado (160 letras)`. `compacto()` mantém os passos em 4 mil letras (3 primeiros + mais recentes).
- **Trajetórias** (aba `trajetorias`: Data | Pedido | Passos | Lições | Autor): como o Claude resolveu tarefas reais. O agente recebe as 2 mais parecidas com o pedido (`### COMO TAREFAS PARECIDAS FORAM RESOLVIDAS`) e o passo "📚 Lembrou de N tarefa(s)…". Tarefa concluída com 2+ ferramentas vira trajetória "ZicoAI (revisar)". O Claude acrescenta uma trajetória a cada trabalho grande.

## Pesquisa profunda e conhecer a si mesma (30/10 noite)
- `pesquisaProfunda()`: um cérebro rápido monta 3 buscas (pt/en, com ano) → `buscarLinks` (DuckDuckGo/Bing em markdown pelo r.jina.ai; decodifica `uddg`, tira anúncio/rede social, 1 link por site) → até 8 páginas lidas AO MESMO TEMPO (`lerPaginas` com `UrlFetchApp.fetchAll`) → cérebro de contexto grande (`cerebroLeitor`: Gemini → Mistral → NVIDIA) compara, confere a data, prefere a fonte mais nova e cita [1], [2]; fontes vão no fim. Dispara com `querPesquisaProfunda` ("qual o melhor … hoje/grátis/2026", "pesquisa profunda", "ranking", "onde tá mais barato"…); se não achar links, cai na pesquisa normal. Ferramenta do agente: `pesquisa_profunda`.
- `contextoMeusCerebros()`: pergunta sobre IA/modelos/cérebros recebe `### MEUS CÉREBROS` (modelo, limites, uso de hoje, castigo, PC ligado ou não, placar).
- Trajetória "Qual é o melhor cérebro de IA grátis…" gravada na aba `trajetorias`.

## v54 (31/10): cérebro do Mac + app da conversa por trechos
- `CEREBROS.mac` (`viaPonte`): Ollama do Mac pela ponte (`ollama_chat`, mac-1.3; `MAC_MODELO`, `MAC_CEREBRO=nao`). Ligado se a ponte do Mac foi vista há < 90 s. Estudo gera no Mac primeiro (nuvem corrige), resumo da conversa no Mac primeiro, conversa com o Mac por último (reserva quando a nuvem toda bate limite). Foto não vai pro Mac.
- App que ela mandou antes NA CONVERSA (sem publicar): pedido de mudança edita o último html por trechos (igual app publicado). `programadora` roda em toda resposta com html (antes só se o pedido falava de programação) e também com foto.
- Resposta que falhou fica gravada ("⚠️ Não consegui responder: …"). Regra 12: nunca dizer que não dá pra testar; "testado" só com o selo ✅.
- App: depois de "Load failed", confere a conversa por ~4 min e troca o aviso pela resposta (`recuperarResposta`). Cache `zicoai-v26`.
- Testes t1–t40 (554 ok). Aula D31.

## v53 (31/10): programadora (edita por trechos, testa e conserta)
- App existente (`appSlug`): `REGRA_EDICAO` pede trechos `<<<<<<< ANTES / ======= / >>>>>>> DEPOIS`; `aplicarTrechos` aplica (cada ANTES tem que aparecer 1 vez; falhou → 1 refazer); resposta = explicação + arquivo COMPLETO. Código do app no contexto até 150 mil letras (era 60 mil e cortava).
- `programadora()` depois de toda resposta de código: `checarHtmlEstatico` (cortado, script sem fechar, sintaxe) + `ponte('testar_html')` no Mac (Chromium sem janela, 390 px, clica em até 6 botões; erros de JS/console/arquivo/página branca/rolagem lateral) → `consertarCodigo` (Gemini Flash, trechos) até `MAX_CONSERTOS` (2). Selo ✅/⚠️ no fim. Revisor de texto não roda em resposta com app.
- Ponte: `dados.html` maior que `PONTE_PEDACO` vai em pedaços `pdat_<id>_<i>` no cache e o `ponteBuscar` remonta. Mac: `ponte-mac.js` mac-1.2 + `testar-html.js`.
- Regra 12 do sistema: app novo = arquivo completo; app existente = só trechos.
- Testes t1–t39 (542 ok). Aula D30.

## v52 (31/10): o método do Claude
- Seção `### MÉTODO` no sistema: entender → separar o que sabe (base/aula/pesquisa) do que acha → não preencher o que falta → fazer → conferir (modelo exato, origem de cada número, conta, código, contradição). Regra antiga "modelo fora da base: diga que não tem a ficha" trocada por "a ficha vem da pesquisa; nunca peça pro Thiago".
- `geminiForte` (Gemini Flash, ~20/dia no grátis, limite 18): primeiro no capricho (pedido difícil e, agora, ficha técnica) e primeiro revisor. `testarModelos()` (1x por dia no `estudar`, ou pelo editor) grava `GEMINI_MODELO` (3.5-flash-lite, senão 3.1) e `GEMINI_FORTE` (3.8-flash, senão 3.6; vazio = desligado). `REGRA_REVISOR_FICHA`: revisor não troca número que veio da web.
- Testes t1–t38. Aula D29.

## v51 (31/10): fato da web, foto, erro do app e estudo 24h
- **Ficha técnica:** `ehFichaTecnica()` (aparelho + vs/compara/bateria/chip…, ou continuação de comparativo; preço fica de fora) liga a pesquisa e manda `REGRA_FICHA` (só número com fonte, "não confirmado" no resto, nunca dizer que não existe sem pesquisar). Pesquisa falhou → avisa, não chuta. Regra 3 do sistema: base vale pra loja e Thiago, não pra ficha de aparelho. Regra 5: modelo citado existe até a pesquisa provar o contrário. Regra 5b: falha só se explica com prova.
- **Foto:** com imagem, `conversar` só tenta Gemini, Mistral e NVIDIA (VL); PC só com `PC_VISAO=sim`. App reenvia a última foto da conversa (`fotoRepetida`) quando a mensagem fala de foto/print/imagem; grava "[📷 mesma foto de antes]". Falou de foto sem foto → o sistema explica que ela só vê a foto da mensagem em que veio.
- **Erro do app:** o app manda `erroAnterior` (ex.: "Load failed"); o cérebro recebe o que ele significa.
- **Aulas:** completa só com palavra acima do corte ou cosseno ≥ `AULAS_COS_FORTE` (0,74); o resto vira "talvez". (`aulasPara` e o placar não mudaram.)
- **Estudo 24h:** `estudar()` = `aprenderComErros()` (próxima reclamação do Thiago → pesquisa → aba `estudo_erros` com causa, regra, aula de professor e resposta certa, status "revisar"; exemplo "erro corrigido (revisar)") ou um tema de `TEMAS_ESTUDO` (17, sendo 11 de programação). Mac chama `ponteEstudar` (segredo do Mac) a cada 30 min; gatilho `estudar` de 4 em 4 h de reserva; mínimo 20 min entre rodadas. `escrever_planilha` aceita o nome da aba em maiúscula.
- **App:** detalhes com quebra de linha e JSON legível (botão JSON pro cru; JSON cortado também fica legível), bloco vazio some, resumo "Como respondi" em caixinha com tempo e nº de passos. Cache `zicoai-v25`.
- Mac: `ponte-mac.js` mac-1.1 (estudo a cada 30 min), `oficina/acordado.sh` (caffeinate pelo launchd: tela apaga, Mac não dorme), `modelo/prova_llama.sh` (Ollama não aceita mais LoRA → treinada no llama-server com o qwen3:8b do Ollama + adaptador).
- Testes `t1`–`t37` (516 ok). Aula D28.

## v48 (31/10): aula certa por palavra + significado
- `aulasPara(pergunta, limite, vetor?)`: nota = BM25/maior + `PESO_SIGNIFICADO` (2) × cosseno (vetores do Gemini, `gemini-embedding-001`, 256). Entra a aula com BM25 ≥ corte (`AULAS_MIN` 18 → 10) ou cosseno ≥ `AULAS_COS_MIN` (0,55). `ehConversaAToa()` (mensagem curta só de cumprimento/agradecimento) não puxa aula, no lugar do corte alto que jogava fora ~5 pontos.
- Vetores das aulas na aba `vetores` (tipo `aulas`, chave `ID#hash` do texto; aula mudou → vetor novo). A conversa só LÊ os vetores guardados; `prepararVetoresAulas()` embute 20 por vez junto do `aprenderSozinha` (30 em 30 min), porque o Gemini grátis aceita ~30 mil tokens/min e ~1.000 pedidos/dia (embutir as 274 de uma vez deu 429). Todas prontas em ~7 h. `vetorDaPergunta()`: 1 chamada por mensagem, memória e aulas dividem. BM25 calculado uma vez por execução (`bm25Aulas`).
- `contextoAulas`: 2 aulas completas + até 3 "talvez" só com título e regra; o cérebro grande escolhe a que serve.
- `importarAulas(nome='aulas_professor.json')` (rodar pelo editor): lê o JSON do Drive `{versao, aulas: {ID: {titulo, palavras, regra, conteudo}}}` e grava C:F da aba `aulas` por ID, só nas privadas (pula GitHub e [IGNORAR]); texto antigo vai pra aba `historico`; lê de volta e compara (`diferentes: []`). Usado em 31/10 pras 212 aulas de professor (212/212). O arquivo sobe do Mac com `rclone copy ... gdrive_envio:` (permissão `drive.file`). t33.
- `placarAulas(amostra=150)` (rodar pelo editor): amostra fixa de 150 perguntas (150 pedidos de vetor, cabe no limite do dia), lê `treino.jsonl` da pasta "ZicoAI Treino" do Drive, mede 1º/nas 2/nas 5 com os vetores do Gemini e grava na aba `placar_aulas`.
- Placar na oficina do Mac (1.234 perguntas, vetores do `qwen3-embedding:0.6b` no lugar do Gemini): antes 72,3% nas 2 / 79,3% nas 5; v48 78,1% nas 2 / **90,6% nas 5** (aula certa chega à conversa), conversa à toa 0/18. Scripts em `~/ZicoAI/placar` no Mac.

## v46 (31/10): oficina 24h no Mac Mini (ponte do Mac)
- O Mac Mini M4 (16 GB, macOS) virou a oficina que fica ligada: Homebrew, Node, git, uv, Playwright + Chromium, Ollama com `qwen3:8b` (base do LoRA). Tudo em `~/ZicoAI` no Mac: `repo/` (cópia do GitHub), `ponte-mac/`, `modelo/` (Modelfile + `criar_modelo.sh` pra montar a `zicoai-treinada` quando o `zicoai-lora.gguf` chegar).
- Ponte do Mac (`~/ZicoAI/ponte-mac/ponte-mac.js`, Node sem dependência): mesmo protocolo e mesma lista segura da ponte do PC, manda `dispositivo:'mac'`. Só pastas do `config.json` (começa só com `~/ZicoAI`), nunca apaga, nunca sobrescreve (grava com `wx`), não escapa por `../` nem por atalho (resolve o caminho real). Liga no login pelo launchd (`~/Library/LaunchAgents/com.zicoai.ponte-mac.plist`, `KeepAlive` se cair). Teste próprio: `node ~/ZicoAI/ponte-mac/teste-ponte.js` (17 verificações).
- Cérebro: cada ponte tem segredo e fila próprios. `ponteDisp(segredo)` → 'pc' (`PONTE_SEGREDO`) ou 'mac' (`PONTE_SEGREDO_MAC`); as chaves do cache do Mac ganham `_mac` (`ponte_fila_mac`, `ponte_visto_mac`…), as do PC não mudaram. `ponte(acao, dados, esperaMs, disp)`. Ferramentas novas: `mac_status`, `mac_testar`, `mac_abrir`, `mac_comando`. Painel de dispositivos mostra "Oficina (Mac)".
- Propriedade nova no Apps Script: `PONTE_SEGREDO_MAC` (o segredo do `config.json` do Mac). Sem ela o Mac é recusado e nada muda pro PC.

## v45 (31/10): corrigir e reescrever com um clique
- Ação `texto` {modo: 'corrigir'|'reescrever', estilo: 'cliente'|'curto'|'formal'|'claro', texto} → {ok, texto, modo, estilo, cerebro}. Cérebro rápido (Groq → Gemini → …), devolve só o texto.
- Corrigir: só ortografia/acento/pontuação, mantém "vc", "kkk", emojis e números, temperatura 0; se o resultado mudar demais de tamanho (virou outro texto), recusa e tenta o próximo cérebro.
- Reescrever "cliente": estilo do Thiago pro WhatsApp, proibido inventar preço, prazo ou garantia. Máx. 6000 letras.
- App: botões "✓ Corrigir" e "✎ Reescrever ▾" em cima da caixa de mensagem (quando tem texto) e no menu de cada resposta; troca o texto com "Desfazer".

## v44 (31/10): busca de aulas nova (BM25)
- Medição: as 1.284 perguntas do treino (cada uma sabe de qual aula veio) passaram pela busca. A antiga (palavra no título/palavras-chave) achava a aula certa entre as 2 lidas em **52,6%**; 21 aulas nunca apareciam.
- `aulasPara` agora é BM25: palavra rara pesa mais que comum, lê título+palavras-chave (peso 2), conteúdo (1,5) e regra (1); raiz de 6 letras; corte de pontuação 18 (calibrado com 20 frases de conversa à toa, que ficam abaixo) que acompanha o tamanho do curso. Resultado: **72,4%** (1º lugar 61%), 11 aulas mortas.
- `indiceAulas` lê também a coluna F (Conteúdo) e guarda compacto (cada raiz uma vez com a contagem). Com 3 mil aulas: 9 pedaços de cache, ~0,5 s.

## v43 (31/10): pergunta com opções
- Tag `[[OPCOES: pergunta || rótulo (recomendado) :: descrição || rótulo :: descrição]]` (2 a 4). `processarTags` tira a tag, devolve `opcoes: {pergunta, opcoes:[{rotulo, descricao}]}` no `chat` e deixa na conversa uma lista simples (Telegram e conversa antiga continuam legíveis). Regra no sistema: só quando a decisão é do Thiago e errar sai caro, ou o pedido tem 2 leituras; senão decide e diz o que escolheu.
- App: mostrar `opcoes` como cartão com botões (a recomendada destacada) + "Outra"; tocar manda o rótulo como mensagem.
- Testes com relógio fixo (t4, t13) zeram a cota do minuto antes de chamar o Groq de novo (o sistema cresceu e somava no mesmo minuto).

## v42 (31/10): consertos do primeiro teste da v41
- `VERSAO_CEREBRO` entra no sistema ("Seu cérebro está na versão N"). Regra: texto colado com data/versão antiga → avisar em 1 linha que pode estar desatualizado.
- Regra de honestidade nova: nunca prometer ação sem ferramenta ("vou remover", "criarei", "o que farei agora"); ou faz agora (resposta ou [[TAREFA]]), ou diz o passo do Thiago.
- `processarTags`: linha `[[...]]` que não é tag conhecida no começo da resposta é tirada (o modelo imitou o formato).
- Seletor de cérebro fora do Auto: o "Como respondi" diz que o seletor escolheu, e no capricho lembra que o melhor é Auto.
- Aulas no chat: até 3000 caracteres do Conteúdo (as aulas agora estão completas).

## Modo capricho (31/10)
- `ehDificil(pergunta, colado)` (só regex): texto colado, código pra corrigir/criar, pesquisa profunda, análise/planejamento/comparação longa ou pedido > 600 letras.
- Capricho = `conversar(..., forte=true)` (PC usa `cerebroPCcodigo()`, gpt-oss com `reasoning_effort: high`) + `revisarResposta()`: outro cérebro (o autor vai pro fim da fila) recebe PEDIDO + RASCUNHO + contexto e devolve `OK` ou a versão completa corrigida (`PROMPT_REVISOR_RESPOSTA`; não confundir com `PROMPT_REVISOR` da revisão do dia). "OK…" curto ou comentário < 35% de um rascunho > 400 letras → fica o rascunho. Nenhum revisor livre → entrega o rascunho. Rótulo: "Autor + revisão X".
- App: menu de cérebros → `✨ Capricho: automático / sempre / desligado` (`cfg.capricho`), manda `capricho: true/false/undefined`.
- Placar do PC usa o modelo grande (`cerebroPCcodigo()`).

## Aulas (`zicoai/aulas/`)
Curso ABC: A fundamentos, B programação, D a própria ZicoAI (no GitHub, `aulas/A|B|D`); C loja e E pessoal só na planilha (privado). Todo trabalho do Claude vira aula + linha na aba `trajetorias`. Aba `aulas` (ID | Módulo | Título | Palavras-chave | Regra | Conteúdo | Onde): `indiceAulas()` lê só as colunas A–E (sem o Conteúdo) e guarda 30 min no cache em pedaços de 90 mil letras; `aulasPara()` pontua palavra-chave/título 3 e regra 1, precisa de 4; o Conteúdo é lido só das escolhidas; `contextoAulas()` põe as 2 melhores (`### AULAS QUE SE APLICAM`) no chat (fora texto colado e imagem) e no agente. Teste: t25.js. Ver `aulas/README.md`.

## Várias planilhas (31/10)
- Um script abre quantas planilhas quiser; os limites do Google são por CONTA (6 min por execução, 90 min/dia somando as rotinas, 20 mil UrlFetch/dia, 30 execuções juntas), então vários scripts não ajudam.
- `planilhaExtra(nome, criar)` cria/abre a planilha e guarda o id em `PLANILHA_<NOME>` (Propriedades); `abaExtra`, `linhasArquivo`.
- "ZicoAI Arquivo": `arquivarMensagens()` (domingo 5h) MOVE as mensagens com mais de 60 dias (`DIAS_NO_ATIVO`) — copia com `'` na frente, confere a contagem e só então tira da principal; até 3 mil por vez; registra no `historico`. `abrirChat` lê o arquivo só pra conversa criada antes do corte (`chatTemArquivo`); `buscarConversas` procura nos dois.
- Aprender sozinha passou de 10 pra 30 min (`garantirRotinasTreino` troca o gatilho uma vez; propriedade `APRENDER_30`) pra sobrar tempo de rotina pros agentes e o estudo.
- `sincronizarAulas()` (a cada 12 h e ação `sincronizarAulas`): baixa `aulas/aulas.json` do GitHub e atualiza/acrescenta só as aulas A/B/D marcadas "GitHub"; as privadas (C, E, B20–B55 e as 1xx das conversas antigas) só existem na planilha.
- Teste: t26.js (arquivo) e t25.js (aulas).

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
node t23.js  # pesquisa profunda (buscas, páginas, fontes) e MEUS CÉREBROS
node t22.js  # fase 1 do treino: tipos, placar, estudo noturno, revisão
node t26.js  # várias planilhas: arquivo das mensagens antigas, abrir/buscar no arquivo, aprender 30 min
node t27.js  # v42: não prometer ação sem ferramenta, versão no sistema (status antigo), [[...]] perdido, aviso do seletor
node t28.js  # v43: pergunta com opções ([[OPCOES]] → campo opcoes no chat)
node t29.js  # v44: busca de aulas BM25 (palavra rara pesa mais, lê o conteúdo, conversa à toa fica de fora)
node t30.js  # v45: corrigir/reescrever com um clique (acao 'texto')
node t32.js  # v48: aulas por palavra + significado, conversa à toa, 2+3 aulas, 1 vetor por mensagem
node t31.js  # v46: ponte do Mac (segredo e fila próprios, mac_status/mac_testar/mac_abrir/mac_comando)
node t25.js  # aulas: acha a aula certa, ignora conversa à toa, máx. 2, agente também lê
node t24.js  # modo capricho: ehDificil, revisor aprova/corrige/comenta/cai, capricho on/off
node t21.js  # fixar/renomear/projeto da conversa, projetos, dispositivos, ponte do PC, pesquisa reserva, Gemini sobrecarregado
```
Teste do app no navegador (Playwright, simula o servidor): ver `scratchpad/ui.js` da sessão de 30/10 — confere tempo, 👍/👎, ▶ Testar e que o localStorage da ZicoAI fica intacto.
`harness.js` tem relógio fixo em 30/10/2026 12h (teste não quebra à meia-noite) e simula SpreadsheetApp, UrlFetchApp, PropertiesService, CacheService, LockService e ScriptApp. Os dados de exemplo não são do Thiago.

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

## v49 (PR, sem publicação): solicitação e resposta em cada passo
- `passo(texto)` permanece compatível. `passoDetalhe({tipo,titulo,pedido,resposta,ms})` acrescenta `detalhes` ao chat, ao `aoVivo`, às mensagens reabertas e às tarefas. Até 60 registros; pedido/resposta até 2.000 caracteres com “…” no corte.
- Chamadas de cérebro (inclusive reserva/erro e embeddings), ferramentas do agente, aulas (IDs + sinais BM25/cosseno), memória/base/contexto, pesquisa e páginas e ponte PC/Mac têm diagnóstico. A entrada começa “aguardando resposta” e é atualizada ao concluir.
- `mascarar()` é aplicada antes de truncar, persistir ou enviar diagnóstico: propriedades secretas conhecidas, campos sensíveis, tokens, links com key/token, CPF e telefone. Binário é omitido. Não altera a entrada nem a saída funcional das ferramentas. A máscara não é autorização para guardar dados de cliente na nuvem.
- Nova aba `detalhes` criada automaticamente: Id + Parte0…Parte12 (JSON em células de até 40 mil caracteres). Mensagens ganham referência em H (`DetalhesId`); tarefas usam seu ID, preservando as colunas anteriores. A retomada mantém os detalhes; o histórico reaberto e arquivado preserva a referência. Cache ao vivo é dividido em partes de 16 mil caracteres para respeitar o limite por entrada.
- App: linha expansível com ícone/título/seta, Solicitação e Resposta em blocos monoespaçados com rolagem e copiar; mesma renderização em progresso/tarefas/resposta. Segunda máscara no app; conteúdo inserido como texto. Mensagens antigas continuam usando `passos`. Cache PWA: `zicoai-v23`.
- v50: aba `detalhes` legível, UMA LINHA POR PASSO (Data | Id | Nº | Tipo | Título | Solicitação | Resposta | ms); a aba antiga (JSON picotado em 13 colunas) é renomeada pra `detalhes_v49`, nada apagado. `lerDetalhes` lê a aba 1 vez por execução; tarefa regravada troca as linhas dela. Vetor de significado guardado como "N vetor(es) de 256 números". Limpeza semanal mantém as 3.000 linhas mais novas. t36.
- v49 (revisão do Claude): segredos da máscara lidos 1 vez por execução (`segredosParaMascarar`), cada detalhe mascarado 1 vez, até 60 mil letras por resposta (`encolherDetalhes`), `limparDetalhes()` na rotina semanal (fica as 300 mais novas), agente grava detalhes no máximo a cada 10 s e sempre no fim. `t35` conta as leituras (1 por mensagem; eram 13.219).
- Testes: `t1.js` a `t35.js`; `t34` verifica máscara, limites, cache, persistência e compatibilidade. `progresso.playwright.cjs` usa API falsa, 390/1440 de largura, sem acessar conta/ponte reais. Workflow do PR: “ZicoAI detalhes e progresso” (não publica).
- Publicação do Apps Script fica com o Claude após revisão. Requisições ao Apps Script real e PC/Mac físicos não foram testadas nesta alteração. Aula: D26.
