# D05: ZicoAI na nuvem com memória única no celular e no PC (30/10/2026)

**Regra:** Memória que o dono vê e corrige (planilha + Apps Script); segredos nas Propriedades; nuvem primeiro, PC de reserva; Nova versão na mesma implantação.
**Palavras-chave:** planilha, apps script, memória, nuvem, app, pwa, supabase, chave, propriedades, implantar

## Pedido
Usar a ZicoAI de qualquer lugar, com uma memória só pro celular e pro PC, que aprenda sem ele repetir. Ele não quis usar o Supabase dele pra isso.

## Entender e escolher
- Supabase grátis: só 2 projetos ativos, e ele já tinha 2 (cinemoteca e sleepplayer). Descartado.
- **Google Planilha + Apps Script:** usa a conta Google que ele já tem, esconde as chaves das APIs e a memória fica numa planilha que **ele mesmo abre e corrige** (aprendeu errado? apaga a linha).

## Arquitetura
```
App (PWA no GitHub Pages) ──POST──▶ Cérebro (Apps Script) ──▶ Gemini / Groq / … / PC de casa
                                          │
                                          ▼
                               Planilha "ZicoAI Memória"
```

## Execução
1. **Planilha** com abas `memoria`, `aprendizados`, `perfil`, `base`, `chats`, `mensagens` (depois vieram mais).
2. **Cérebro** (`zicoai/cerebro/Codigo.gs`): `doPost` com PIN, monta o sistema (personalidade + perfil + aprendizados + memória relevante + trechos da base), escolhe o cérebro e grava a conversa.
3. **Segredos fora do código:** chaves e PIN nas Propriedades do script (`GEMINI_KEY`, `GROQ_KEY`, `PIN`, …). O repositório é público: nunca chave, PIN, link do PC ou dado de cliente lá.
4. **App** (`zicoai/index.html`): um arquivo só, preto e dourado, instala na tela do iPhone. Envia assim:
   ```js
   fetch(url, { method: 'POST', body: JSON.stringify(dados) }) // SEM header Content-Type
   ```
   Sem o header, o navegador manda como texto simples e não faz a pergunta prévia de CORS, que o Apps Script não responde.
5. **Publicar no Google:** implantar como App da Web. Pra atualizar sem mudar o link: Implantar → Gerenciar implantações → Editar → **Nova versão**.
6. **PC na nuvem:** Tailscale Funnel expondo o Ollama num caminho secreto (`PC_URL`). PC desligado → marca "desligado" 3 min no CacheService e usa a nuvem.
7. Teste de verdade com `instalar()` pelo editor: PIN ok, Gemini ok, Groq ok, PC ok.

## Erros e correções
1. **Respostas ruins no "Auto":** quase tudo ia pro modelo 8B do PC, que é fraco. Correção: **nuvem primeiro**, PC só de reserva ou quando o Thiago escolhe "PC" no seletor. Depois o app ainda passou a tirar uma vez do "PC de casa" os aparelhos que tinham ficado presos nele.
2. **Pesquisa do Google pelo Gemini** dava 429 no plano grátis. Ficou o `browser_search` do Groq como pesquisa principal.

## Lições
1. Escolha a ferramenta que o dono consegue **ver e corrigir** sozinho.
2. Segredo sempre nas Propriedades, nunca no código público.
3. O cérebro mais barato não pode ser o primeiro da fila se ele erra: ordem é qualidade primeiro, reserva depois.
4. Publique sempre como Nova versão da mesma implantação (o link não muda).
