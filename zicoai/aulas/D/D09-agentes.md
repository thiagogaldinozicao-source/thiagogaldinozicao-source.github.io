# D09: agentes que trabalham sozinhos em segundo plano (30/10/2026)

**Regra:** Agente = laço de ferramentas em JSON com travas no código; desenhe pelos limites (6 min, cota/min): salvar progresso e continuar; chefe divide e junta.
**Palavras-chave:** agente, tarefa, segundo plano, ferramenta, paralelo, dividir, chefe, demorado, longo

## Pedido
Tarefa grande (comparar preços em várias lojas, relatório, mexer em app) sem travar a conversa. Depois:
> "Os agentes funcionam como? … e quantos dá pra pôr ralando ao mesmo tempo"

## Como funciona
1. Pedido grande vira tarefa: tag `[[TAREFA: …]]`, chip 🧠 Agente ou ação `tarefa`. Vai pra aba `tarefas` como `pendente`, e um gatilho chama `rodarTarefas`.
2. **Laço de ferramentas** (`agente(...)`): o cérebro responde **só JSON**:
   ```json
   {"pensamento":"vendo nosso preço","ferramenta":"ler_planilha","args":{"aba":"precos"}}
   ```
   o código roda a ferramenta e devolve `RESULTADO de ler_planilha: …`. Repete até vir `{"resposta": "…"}`. Limites: 30 ferramentas, 45 chamadas.
3. **Segurança nas ferramentas:** só escreve nas abas de `ABAS_ESCRITA`; ferramenta que não existe é recusada; CPF/telefone é barrado no `acrescentar_planilha` (a `escrever_planilha` ainda não confere isso); resposta sem JSON é cobrada ("Responda só com o JSON").
4. **Rastro:** cada passo vira `💭 pensamento` ou `🔧 ferramenta {args} → resultado`, visível no app.

## Melhorias (v35) e os limites que mandaram no desenho
- O Apps Script corta qualquer execução em ~6 min, e os cérebros grátis têm limite por minuto.
- **3 agentes juntos** (`MAX_AGENTES_JUNTOS = 3`): cada trabalhador é um gatilho; um trabalhador termina e chama outro se ainda tem fila.
- **Tarefa longa:** o prazo da rodada é 4,5 min (`PRAZO_RODADA = 270000`); 1 min antes dele (~3,5 min) o agente salva o progresso no Drive (`ZicoAI Tarefas (progresso)/<id>.json`), volta pra fila e outra rodada **continua de onde parou**.
- **Agente chefe:** `dividir_em_agentes {partes:[…]}` cria 2–4 tarefas filhas; cada uma avisa o pai (`avisarPai`) ao terminar; quando todas acabam o chefe junta e responde.
- Teste de verdade: 3 lojas em paralelo, resultado em ~3 min.

## Erros e correções
- **Resposta dobrada (v23):** o cérebro respondia tudo E ainda criava a tarefa. Correção: quando manda pro agente, a resposta direta vira 1 linha ("Agente trabalhando…").
- **Agentes usam API ou cérebro?** Usam os mesmos cérebros (Gemini → Groq → Mistral → …); se a nuvem toda estiver sem cota, usam o PC (`zicoai-dev`).

## Lições
1. Ferramenta perigosa sempre com trava no **código**, não só no prompt.
2. Desenhe pelos limites: 6 min por execução e limite por minuto → salvar progresso e continuar depois.
3. Tarefa grande se divide em partes independentes e um chefe junta.
4. Sempre deixe o rastro dos passos: é por ele que se acha o erro.
