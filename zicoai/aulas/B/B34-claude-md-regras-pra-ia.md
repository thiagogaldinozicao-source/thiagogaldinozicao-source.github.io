# B34: CLAUDE.md do projeto: regras escritas pra IA

**Regra:** Todo projeto leva um `CLAUDE.md` curto (carregado em toda sessão) com: o que é, regras de git, mapa de arquivos, economia de tokens, regras de produto e invariantes que não podem quebrar. Detalhe vai para ROADMAP e `docs/`.
**Palavras-chave:** claude.md, regras pra ia, mapa do projeto, economizar token, token diet, git branch, invariantes, não quebrar, instruções do projeto, contexto, sessão nova, roadmap
**Projeto(s):** leva-ou-nao

## Exemplo real
No "Leva ou não?" várias sessões e agentes mexeram no mesmo `index.html` grande. O `CLAUDE.md` existe para a IA não ler o arquivo inteiro, não mexer na `main` por engano e não quebrar regras do produto. Abre dizendo: "Carregado toda sessão. Curto e só o que decide."

## Como foi feito
Seções do `CLAUDE.md` real (resumido):
1. **O que é** (3 linhas) e o fluxo: código de barras → Open Food Facts → regras → veredito.
2. **Git (vale acima de qualquer regra global):** `main` publica sozinha (push = site no ar + APK novo), então o trabalho vai em branch + PR. "Commit + push da BRANCH sem perguntar. `git fetch origin` antes de criar branch. Commit em pt-BR, curto, dizendo o porquê."
3. **Token diet:** "Localiza antes de ler: `grep -n` / `rg -n` → Read só a FAIXA. ! Read do `www/index.html` inteiro." Um `.ignore` tira da busca binário, minificado e gerado. "Resposta = resultado. Sem preâmbulo."
4. **Mapa:** cada arquivo com 1 linha (o que faz, qual `globalThis.X` exporta, quem usa). O `index.html` ganhou faixas de linha, com o aviso `grep -n '/\* ----------'` antes de confiar nelas.
5. **Produto:** "Uma tela só... Feature nova que pede tela, aba ou parágrafo novo => cabe num ícone, num toque ou num padrão sensato? não => fica de fora."
6. **Invariantes:** nenhuma foto é salva; chave de API nunca no app nem no repo; dado do OFF é ODbL.
7. **Teste:** "TESTE NUNCA LOCAL: roda na VM" com `scripts/vm-run.sh test|check|api|e2e|android|quick`. Regras ficam em arquivos puros (`regras.js`, `troca.js`) testáveis com `node --test`.

## Erros que já aconteceram
- Faixas de linha do mapa atualizadas depois da tela nova, para evitar leitura errada (dfe62a1: "senão o próximo lê a faixa errada"). Foi prevenção: o commit não registra que o erro tenha acontecido, e o aviso de conferir com `grep -n '/\* ----------'` antes de confiar nas faixas já existia no CLAUDE.md.
- Motor de regras dentro do `index.html` era difícil de testar. Correção: foi para `www/regras.js` com testes e CI (809de0f).
- `privacidade.html`/`criterios.html` copiam texto de `docs/` e dos pesos de `regras.js`: o CLAUDE.md avisa "mudou lá? muda aqui".

## Lições
1. Escreva curto: só o que muda decisão. O resto vai em docs.
2. Diga qual regra vale acima das globais (git) e o que é proibido (`!`).
3. Mapa por arquivo, com onde ficam as regras; atualize junto com o código.
4. Invariantes (privacidade, segredo, licença) ficam num bloco próprio.
5. Separe lógica pura em arquivos pequenos: a IA lê só o que precisa e o teste roda sem navegador.

Fontes: leva-ou-nao CLAUDE.md, ROADMAP.md, .ignore, commits dbb38a2, fa8ec8b, dfe62a1, 809de0f, 04c0fdb.
