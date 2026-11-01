# D42: o limite de 6 minutos e o cérebro certo pro tamanho (01/11/2026)

**Regra:** O Google corta todo pedido em 6 min. Arquivo grande vai só pra cérebro rápido que aguenta arquivo grande, com o sistema ENXUTO (sem memória, base, preços). Perto do limite, entrega o que tem em vez de começar outra volta.
**Palavras-chave:** 6 minutos, Failed to fetch, conexão caiu, demorou, timeout, cérebro, arquivo grande, contexto, enxuto, Gemini, Mistral, NVIDIA, tokens

## Por quê
- 01/11: "corrige a calculadora" deu "Failed to fetch" duas vezes. O pedido levou ~40 mil tokens pra um cérebro lento, junto com memória de dólar e preço de iPhone, e passou dos 6 min. O app não recebe nada quando o Google mata o pedido.
- Contexto que não tem a ver piora a resposta e gasta o limite do cérebro.

## Como funciona por baixo
- v89: com código de app no pedido, `EDITANDO_APP = true`. `montarSistema` usa só o jeito de responder + 5 aprendizados. Sem conectores, sem pesquisa web, histórico antigo cortado em 1.200 letras.
- Ordem dos cérebros quando mexe em app: Gemini Flash → Gemini → Mistral → NVIDIA (`temCerebro`). Groq/Cerebras não cabem; PC/Mac com 40 mil tokens demoram minutos.
- `INICIO_REQ`: a volta de conserto só começa se passou menos de ~170 s.

## Situações em que aparece
- "a conexão caiu", "Failed to fetch", "ela não consegue arrumar um app simples", arquivo colado muito grande.

## Erro comum
- Achar que a IA é "fraca" quando o problema é tempo/contexto.
- Repetir o pedido na mesma conversa velha (traz o HTML cortado de novo).

## Como conferir
- Passos: "Mexendo num app: vai no cérebro que aguenta arquivo grande" e "Programando num app: usou só…". O tempo total fica abaixo de 6 min.
