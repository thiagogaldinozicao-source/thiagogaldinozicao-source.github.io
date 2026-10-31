# D18: modo capricho (31/10/2026)

**Regra:** Pergunta difícil: cérebro forte, mais raciocínio e OUTRO cérebro revisa; o revisor nunca pode piorar a resposta; fácil continua rápido.
**Palavras-chave:** capricho, difícil, revisar, revisor, qualidade, resultado, pensar mais, demora

## Pedido
> "Não ligo pra demora ligo pra resultado… Já faz agora."

## Entender
O Thiago prefere uma resposta **certa** a uma resposta **rápida**. Ele não quer escolher isso toda hora. Então:
- pergunta fácil ("quanto tá o 13?", "bom dia") continua rápida;
- pergunta difícil (código pra corrigir, análise, texto longo colado, pesquisa profunda) ganha mais esforço **sozinha**;
- ele pode forçar "sempre" ou "nunca" no app.

## Plano
1. Uma função que diz se o pedido é difícil (`ehDificil`).
2. Pedido difícil: usar o cérebro mais forte e pedir mais raciocínio.
3. Depois do rascunho, **outro cérebro** revisa (de outra empresa, se der). Quem escreve não revisa o próprio texto.
4. O revisor responde `OK` ou manda a versão corrigida completa.
5. Botão no app: ✨ Capricho automático → sempre → desligado.
6. Testes antes de publicar.

## Execução

### 1. Separar fácil de difícil (`Codigo.gs`)
```js
function ehDificil(t, colado) {
  const s = normalizar(t);
  if (colado) return true;
  if (ehProgramacao(t) && /(faz|faca|cria|crie|monta|monte|gera|corrig|conserta|arruma|melhora|adiciona|muda|erro|bug|nao funciona)/.test(s)) return true;
  if (querPesquisaProfunda(t)) return true;
  if (/(planej|estrateg|analis|compar|calcul|vale a pena|o que vc acha|me ajuda a decidir|explica (bem|direito|passo)|relatorio|resum)/.test(s) && s.length > 60) return true;
  return s.length > 600;
}
```
Por que assim: é barato (só regex, sem gastar cérebro) e erra pro lado seguro. Pergunta comprida ou de código ganha revisão.

### 2. Cérebro forte e pensando mais
Em `conversar(..., forte)`:
- PC de casa: usa `cerebroPCcodigo()` (o modelo grande, qwen3.6:35b) em vez do 8B;
- Groq gpt-oss: manda `reasoning_effort: 'high'`.

### 3. Revisor
```js
// no chat():
const capricho = modo !== 'imagem' && (req.capricho === true || (req.capricho !== false && ehDificil(pergunta, colado)));
if (!resultado) resultado = conversar(historico, pergunta, req.imagem, preferido, extraSistema, capricho);
if (capricho && resultado && resultado.ok && !req.imagem) { try { resultado = revisarResposta(pergunta, resultado, extraSistema); } catch (e) { passo('Revisão falhou, entregou o rascunho'); } }
```
`revisarResposta` (pergunta com foto não passa pela revisão; se a revisão der erro, entrega o rascunho):
- monta a lista de cérebros e **joga pro fim** o mesmo que escreveu o rascunho;
- manda pro revisor: PEDIDO + RASCUNHO + as informações que a ZicoAI tinha (pra conferir se inventou preço, garantia etc.);
- `OK` → fica o rascunho; texto completo → vira a resposta e o rótulo fica "Gemini + revisão Groq GPT-OSS 120B";
- revisor fora do ar ou estourado → passa pro próximo; ninguém livre → entrega o rascunho (nunca trava a resposta).

### 4. App (`index.html`)
Item no fim do menu de cérebros: `✨ Capricho: automático / sempre / desligado`. Envia `capricho: true | false | (nada)`. Em "sempre" aparece ✨ ao lado do nome do cérebro.

## Erros e correções
1. **`SyntaxError: Identifier 'PROMPT_REVISOR' has already been declared`**
   Causa: já existia um `PROMPT_REVISOR` (o da revisão do dia, lá embaixo no arquivo). Criei outro com o mesmo nome.
   Como achei: `node -e "new Function(require('fs').readFileSync('Codigo.gs','utf8'))"` mostrou o erro; `grep -n PROMPT_REVISOR Codigo.gs` mostrou as duas linhas.
   Correção: renomeei o novo pra `PROMPT_REVISOR_RESPOSTA`.
   **Lição: antes de criar um nome, procure se ele já existe (`grep -n NOME arquivo`).**
2. **Revisor que responde "OK, está correto." era tratado como correção.** A primeira versão só aceitava `OK` puro. Agora aceita qualquer coisa que comece com OK e seja curta.
3. **Revisor que manda só um comentário** ("faltou falar do prazo") apagaria uma resposta grande. Agora, se o rascunho tem mais de 400 letras e a "correção" tem menos de 35% do tamanho, fica o rascunho.
   **Lição: pense no que o outro cérebro pode responder de errado e proteja a resposta.**

## Teste
`cerebro/testes/t24.js` (13 testes): pergunta simples sem capricho; revisor aprova; revisor corrige; "OK, …" conta como aprovação; comentário curto não apaga; código com bug liga sozinho; `reasoning_effort: high`; `capricho:false` desliga; revisor fora do ar; `ehDificil`.
App: Playwright abriu o `index.html`, clicou 3× no ✨ e conferiu automático → sempre → desligado → automático, sem erro no console.
Todos os outros testes rodados de novo (t1…t24) antes de subir.

## Lições
1. Resultado > velocidade quando o Thiago pede, mas **só gaste esforço onde vale** (pergunta fácil continua rápida).
2. Quem escreve não revisa o próprio texto: use outro cérebro.
3. O revisor nunca pode piorar: OK, comentário curto ou erro → fica o rascunho.
4. Procure o nome antes de criar (`grep`).
5. Rode **todos** os testes, não só o novo.
