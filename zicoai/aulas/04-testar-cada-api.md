# Aula 04: ligar os cérebros grátis e testar cada um de verdade (30/10/2026)

## Pedido
> "Vamos usar apis grátis tbm todas que existem aí vc coloca esgotou muda pra próxima"

## Plano
Ligar uma por uma, mandar um "oi" de verdade em cada, anotar o que funcionou e o erro exato do que não funcionou. Só entra na fila quem respondeu.

## O que aconteceu (cérebro por cérebro)
| Cérebro | Resultado | Causa / o que fez |
|---|---|---|
| **Groq** gpt-oss-120b | ✅ código certo em 1,3 s | Virou o principal de código. Limite apertado: ~8 mil tokens/min |
| **Gemini** 2.5 | ❌ desativado pra contas novas | Trocou de modelo |
| **Gemini** 3.8 Flash | ❌ ficava "pensando" pra sempre | Sem cota no grátis; a tela não mostrava o erro |
| **Gemma** pelo endereço compatível | ❌ 404 | Modelo não aceito por aquele caminho |
| **Gemini 3.1 Flash-Lite** | ✅ | É o que tem cota grátis. Virou o principal geral |
| **OpenRouter** | ❌ 401 | A chave não salvou. 401 = chave errada/vazia |
| **Mistral** | ❌ pedia upgrade (no chat); depois, na nuvem, "Rate limit exceeded" até em 1 pedido | Problema da conta/plano, não do código. Na nuvem: `mistral-small-latest` principal e `mistral-medium-latest` de reserva |
| **NVIDIA** | o gpt-oss-120b saiu do ar lá em 03/09/2026 | Trocou pra `nvidia/nemotron-3.5-super-vl-120b-a12b`, reserva `google/gemma-4-31b-it` (`chamarCompat` tenta a reserva sozinho em 404/410) |
| **GitHub Models** | respondia "OK" em texto pra tudo | O serviço foi encerrado em 30/07/2026. Ficou `aposentado: true` no código |

## Como ler o erro
- **401**: chave errada, vazia ou cortada.
- **404 / 410**: o modelo não existe mais (ou não por esse caminho) → trocar o nome do modelo.
- **429**: limite. Se vem com "capacity"/"tier", é o plano da conta; se é por minuto, espera o minuto.
- **502 / 503 / "high demand"**: o serviço tá sobrecarregado agora → tirar ele da fila por 90 s (`ehSobrecarga`) e usar o próximo.
- **Fica carregando sem erro**: a tela engole o erro. Teste por outro caminho (o Playground do serviço, ou uma chamada direta) pra ver a mensagem real.

## Lições
1. Só conta como funcionando o que respondeu de verdade.
2. Anote o **código do erro**: ele diz o que fazer.
3. Se até 1 pedido dá limite, é a conta: peça pro Thiago olhar o painel do serviço, e enquanto isso a ZicoAI usa outro cérebro.
4. Todo cérebro com reserva e com motivo da falha visível no "Como respondi".
5. Modelos somem e mudam de nome: confira na fonte antes de afirmar que um modelo existe.
