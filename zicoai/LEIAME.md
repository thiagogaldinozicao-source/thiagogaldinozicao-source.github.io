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
  - tags que o modelo escreve: `[[MEMORIA: ...]]`, `[[APRENDIZADO: erro || certo]]`, `[[ESQUECER: trecho]]`, `[[IMAGEM: prompt em inglês]]`, `[[BASE: assunto || conteúdo]]` e `[[PERFIL: tópico || informação]]` (criam ou SUBSTITUEM a linha pelo assunto/tópico, ignorando maiúsculas e acentos; toda mudança vai pra aba `historico` com antes/depois; só com o que o Thiago disse);
  - `aprenderSozinha()` roda a cada 10 min (gatilho criado por `ligarAprendizado()`), relê a aba `mensagens` desde a propriedade `APRENDIDO_ATE` e extrai fatos e correções com o Gemini, sem duplicar (`jaSabe()`). Também propõe `base` e `perfil` (passam por `gravarFato`, com histórico).
- Controle de cota (`motivoNaoCabe`, `registrarUso`, `castigo`): cada cérebro tem `tpm` (tokens/min), `rpm` (pedidos/min) e `rpd` (pedidos/dia) com folga abaixo do plano grátis. Uso do minuto fica no CacheService (`tk_*`, `rq_*`), uso do dia nas Propriedades (`rpd_<nome>_<yyyyMMdd>`). Antes de chamar, pula quem não cabe (aparece em "Como respondi": "X pulado: limite de tokens do minuto"). 429 que escapa → `off_<nome>` pelo tempo que a API pediu ("castigo"). Cérebro pequeno (limite < 50k) recebe `msgsEnxutas()` (sistema enxuto, 6 últimas mensagens, cortadas) quando a conversa cheia não cabe. Se todos estiverem no limite DO MINUTO, espera o minuto virar (≤ 61 s) e tenta de novo. Ação `cotas` (e o `teste`) devolve o uso do dia por cérebro; o app mostra em Configurar → Testar.
- Busca por significado (`semelhantes()`): além da busca por palavra (`relevantes()`), a BASE também é procurada por embedding (cosseno ≥ 0,62, até 4 trechos extras). Embedding fora do ar → `embed_off` 10 min e segue só por palavra.
- Modo cliente (`ehModoCliente()`): pergunta do tipo "responde pro cliente…" esconde o perfil pessoal (fica só "Como responder" e "Loja"), força a tabela de preços e acrescenta a seção MODO CLIENTE (só informação confirmada).
- Compactação: só as últimas 12 mensagens vão pro cérebro. Com 24+ mensagens na conversa, `compactarSePrecisar()` resume o que ficou pra trás (deixa as 10 últimas fora) e guarda em `chats` colunas Resumo/ResumidoAte; o resumo entra no sistema da próxima resposta. Refaz a cada +20 mensagens.
- Prova semanal: `rodarProva()` responde cada linha da aba `prova` (questão com `MSG 1 … || MSG 2 (mesma conversa): …` vira 2 turnos), um corretor (Gemini/Groq/Cerebras, temperatura 0) dá nota de 0 a 10 pelos critérios, grava `Última nota`/`Última data`, nota < 7,5 vira aprendizado (assunto `prova`) e a média vai pra memória. `ligarProva()` cria gatilho segunda 4h.
- Bloqueia CPF e telefone na memória (`temDadoSensivel`).
- `instalar()` testa PIN, Gemini, Groq, PC e pesquisa (rodar pelo editor e ler o Registro de execução).

Aba `config` (Chave | Valor) serve de reserva pra `COMFY_URL`, `COMFY_WORKFLOW`, `PC_MODELO`, `PC_MODELO_CODIGO` quando a propriedade não existe (valores grandes e configuração sem abrir o editor).

Propriedades do script (nunca no código): `GEMINI_KEY`, `GROQ_KEY`, `PIN`, `PC_URL` (link do Funnel com caminho secreto), `PC_MODELO` (opcional, padrão `zicoai`), `PC_MODELO_CODIGO` (opcional, ex. `zicoai-dev`), `CEREBRAS_KEY` (opcional), `APRENDIDO_ATE` (controle interno).

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
