# D14: pesquisar igual o Claude, lendo várias fontes (30/10/2026)

**Regra:** Assunto que muda: várias buscas, leia as páginas, confira a data, fonte mais nova ganha, cite as fontes.
**Palavras-chave:** pesquisa, pesquisar, fontes, profunda, melhor, ranking, hoje, atual, comparar

## Pedido
> "ensina nossa ia fazer isso responder pesquisar igual vc fez em 27 fontes"

## O jeito do Claude
Várias buscas com palavras diferentes → abrir e **ler** as páginas (não só o resumo da busca) → conferir a **data** de cada fonte → comparar → responder citando de onde veio.

## Execução
- `pesquisaProfunda()`:
  1. um cérebro rápido monta **3 buscas** (português e inglês, com o ano);
  2. `buscarLinks`: DuckDuckGo/Bing em texto pelo `r.jina.ai`; tira anúncio e rede social; 1 link por site;
  3. `lerPaginas`: até **8 páginas ao mesmo tempo** (`UrlFetchApp.fetchAll`);
  4. `cerebroLeitor` (contexto grande: Gemini → Mistral → NVIDIA) compara, prefere a fonte mais nova e cita [1], [2]; fontes no fim.
- Dispara sozinha com "qual o melhor … hoje/grátis/2026", "pesquisa profunda", "ranking", "onde tá mais barato"…; se não achar link, cai na pesquisa normal.
- Ferramenta do agente: `pesquisa_profunda`.
- `contextoMeusCerebros()`: pergunta sobre IA recebe os dados do próprio sistema (modelos, limites, uso de hoje, placar).

## Erro e correção
O DuckDuckGo devolve links **sem o `https:`** (começando com `//`). O primeiro código não achava nenhum link. Correção na expressão: `(?:https?:)?//`. Teste novo (t23) com esse formato.

## Lições
1. Assunto que muda rápido (IA, preço, cotação, lançamento) sempre pesquisa e confere a data.
2. Abrir e ler a página, não confiar só no resumo da busca.
3. Fonte mais nova ganha quando há conflito.
4. Sempre citar as fontes.
5. Teste o formato real que o site devolve (o link sem `https:` passou despercebido até o teste).
