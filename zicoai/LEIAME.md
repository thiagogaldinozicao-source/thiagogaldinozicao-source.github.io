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
- Conversas na lateral (sincronizadas pela planilha), seletor de cérebro (Auto / Gemini / Groq / PC de casa), 🌐 Pesquisar, 🎨 Imagem, foto (reduzida pra 1600px), "Como respondi" (passos), Copiar, Refazer, Parar, painel 🧠 Memória.
- Configuração no próprio app (link do script + PIN + nome do aparelho), salva no localStorage.
- Link de instalação: `.../zicoai/#script=<URL do script>` já preenche o link, só falta o PIN.
- Envio: `fetch(url, {method:'POST', body: JSON.stringify(...)})` **sem** header Content-Type (vira text/plain e evita preflight de CORS do Apps Script).
- Ao mudar arquivos do app, suba o número do cache em `sw.js` (`zicoai-vN`).

### 2. Cérebro — `zicoai/cerebro/Codigo.gs`
Cópia do código que roda no projeto Apps Script "ZicoAI Cérebro". **A versão que vale é a do Apps Script**; mantenha os dois iguais.

- `doPost` com PIN. Ações: `teste`, `chat`, `chats`, `abrir`, `apagarChat`, `memorias`, `salvar`, `apagarMemoria`, `contexto`, `registrar`.
- `PERSONA` tem as regras 1–13 e um bloco HONESTIDADE (12 regras curtas: não fingir que fez, campo em branco em vez de inventar, NÃO CONFIRMADO = "deixa eu confirmar", não fechar com ofertas).
- `montarSistema()`: persona + regras + perfil inteiro + aprendizados + memória (25 recentes + 35 relevantes por palavra-chave) + até 10 trechos da base.
- Ordem dos cérebros em `conversar()`: normal = Gemini → Groq → PC → Groq Qwen; foto = Gemini → PC; programação = Groq → Gemini → PC → Groq Qwen. O PC de casa (modelo 8B) é reserva: só responde quando a nuvem falha/estoura o limite ou quando o Thiago escolhe "PC" no seletor. PC que falha fica "desligado" 3 min (CacheService).
- Pesquisa (`pesquisar()`): Groq `browser_search` (funciona no grátis). Google Search do Gemini dá 429 no plano grátis.
- Aprendizado:
  - tags que o modelo escreve: `[[MEMORIA: ...]]`, `[[APRENDIZADO: erro || certo]]`, `[[ESQUECER: trecho]]`, `[[IMAGEM: prompt em inglês]]`;
  - `aprenderSozinha()` roda a cada 10 min (gatilho criado por `ligarAprendizado()`), relê a aba `mensagens` desde a propriedade `APRENDIDO_ATE` e extrai fatos e correções com o Gemini, sem duplicar (`jaSabe()`).
- Bloqueia CPF e telefone na memória (`temDadoSensivel`).
- `instalar()` testa PIN, Gemini, Groq, PC e pesquisa (rodar pelo editor e ler o Registro de execução).

Propriedades do script (nunca no código): `GEMINI_KEY`, `GROQ_KEY`, `PIN`, `PC_URL` (link do Funnel com caminho secreto), `PC_MODELO` (opcional, padrão `zicoai`), `APRENDIDO_ATE` (controle interno).

### 3. Planilha "ZicoAI Memória"
Abas e colunas:
- `memoria`: Data | Lembrança | Origem
- `aprendizados`: Data | Erro | Certo | Assunto
- `perfil`: Tópico | Informação
- `base`: Assunto | Conteúdo
- `chats`: Conversa | Título | Criada | Atualizada | Aparelho
- `mensagens`: Conversa | Data | Quem | Mensagem | Cérebro | Aparelho
- `prova`: Nº | Grupo | Pergunta exata | Critérios nota 10 | Erro mais provável | Última nota | Última data | Observação (20 perguntas da prova semanal; gabarito feito em 30/10)

Datas com `'` na frente pra não virarem número. Texto começando com `= + - @` leva `'` (função `seguro`).

## Testar sem internet
```
cd zicoai/cerebro/testes
node t1.js   # chat, memória, pesquisa, imagem, conversas, foto
node t2.js   # PC de casa: ordem, queda, cache
node t3.js   # aprender sozinha
```
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
