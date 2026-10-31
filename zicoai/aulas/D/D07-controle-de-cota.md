# D07: usar API grátis sem estourar o limite (30/10/2026)

**Regra:** Confira o limite antes de chamar; minuto = esperar, dia = próximo cérebro, sobrecarga = sair 90 s; mostre o motivo no Como respondi.
**Palavras-chave:** limite, cota, 429, tokens, por minuto, por dia, groq, esgotou, rate limit

## Problema
Cérebro grátis tem limite **por minuto** (tokens e pedidos) e **por dia**. O Groq, por exemplo: ~8 mil tokens por minuto, e só o prompt da ZicoAI já tinha ~4,4 mil. Bater no limite = erro 429 e resposta falhando.

## Execução (v9 em diante)
- Cada cérebro tem `tpm` (tokens/min), `rpm` (pedidos/min) e `rpd` (pedidos/dia), com folga abaixo do plano.
- **Antes de chamar**, `motivoNaoCabe(nome, c, tokens)` vê se cabe. Não cabe → pula e o "Como respondi" mostra "X pulado: limite de tokens do minuto".
- Depois de chamar, `registrarUso` soma o gasto (minuto no CacheService, dia nas Propriedades).
- 429 que escapou → `castigo(nome, msg)`: tira o cérebro da fila pelo tempo que a API pediu.
- 502/503/"high demand" → `ehSobrecarga`: fora por 90 s.
- Cérebro pequeno recebe a conversa **enxuta** (`msgsEnxutas`: sistema curto, 6 últimas mensagens).
- Se nenhum cérebro respondeu e pelo menos um foi pulado só pelo limite do minuto, espera o minuto virar (até ~61 s) e tenta mais uma vez.
- Aviso no app quando um cérebro passa de 80% da cota do dia.

## Lições
1. Confira o limite **antes** de chamar, não depois do erro.
2. Cada erro tem remédio diferente: limite do minuto = esperar; limite do dia = próximo cérebro; sobrecarga = sair 90 s.
3. Mostre o motivo no "Como respondi": o Thiago precisa ver por que um cérebro não respondeu.
4. Prompt grande gasta cota: mande só o que a pergunta precisa.
