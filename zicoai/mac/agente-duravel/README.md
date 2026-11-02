# ZicoAI — LangGraph durável experimental (Mac)

## O que foi integrado

Este módulo chama as **ferramentas já existentes** da ponte `ponte-mac.js`, mas orquestradas com a biblioteca real `@langchain/langgraph` e checkpoints persistidos no **SQLite** via `@langchain/langgraph-checkpoint-sqlite`.

Por segurança, o primeiro passo libera **somente três operações de leitura**: `status`, `listar`, `ler`. Outras ações são recusadas. Reiniciar o processo pode repetir uma leitura, mas nunca executar cliques/escritas por esse novo caminho.

O módulo preserva os resultados no arquivo `~/ZicoAI/agente-duravel/checkpoints.sqlite`. Uma chamada com o mesmo `pedidoId`, ação e argumentos recebe o resultado salvo se já estiver finalizada, sem executar novamente. Não confundir checkpoint com garantia de exatamente-uma-vez para transações externas.

A ponte atual permanece funcionando como antes. O novo caminho `agente_duravel` foi incluído **atrás da variável `ZPONTE_LANGGRAPH=1`**, que começa desligada. O cérebro Apps Script v103.6 não chama automaticamente esse novo caminho.

## Preparar e testar num Mac real

O código deverá ser baixado para a pasta real de instalação da ponte. Faça backup da ponte antes de copiar, sem incluir `config.json`, PIN ou segredos em GitHub.

Requer Node.js 22 ou superior e internet na instalação das bibliotecas:

```bash
cd /CAMINHO/REAL/DA/PONTE/agente-duravel
npm install --no-audit --no-fund
npm test
node teste-real.cjs
```

O `teste-real.cjs` executa `status` com a ponte verdadeira e consulta a mesma execução novamente. Imprime somente um pequeno relatório do checkpoint, sem gravar segredos no repositório. Se a instalação usar arquivos de origem diferentes, primeiro confirme `node -v`, o caminho de `ponte-mac.js` e a configuração existente.

Para autorizar o Mac a receber pedidos `agente_duravel`, definir `ZPONTE_LANGGRAPH=1` no ambiente de execução do serviço `launchd` e reiniciar a ponte. **Não fazer isso até concluir os testes de integração reais**.

## Testes

- `npm test` valida checkpoint com banco real, reabertura, tentativas após falha temporária, negação de escrita/clique, confirmação explícita e proteção de ID.
- A GitHub Action `ZicoAI LangGraph agente duravel` instala os pacotes reais num Linux de teste e executa essa suíte.
- `node teste-real.cjs` exige o Mac do usuário e valida o adaptador com o status real.
- Testar integração `ponteBuscar/ponteResposta` e a recuperação do agente do Apps Script ainda são etapas **não concluídas**.

## Outras integrações planejadas

1. A caixa de saída da ponte do PR #5 protege respostas e efeitos incertos; não duplicar esse trabalho.
2. Para tarefas longas com cliques/escritas, introduzir **ID idempotente, aprovação e reconciliação**, antes de permiti-las no LangGraph. Sem isso não ativar ações destrutivas.
3. MCP v2 (`@modelcontextprotocol/client`) para conectores após limitar permissões e autenticação; nunca expor serviço sem autenticação.
4. LiteLLM como gateway local opcional somente após comparar a seleção atual de modelos. Não instalar um proxy público.
5. Promptfoo para benchmarks de conversa e ferramentas com casos reais. Nunca enviar dados privados da planilha para provedores externos durante testes sem autorização.

## Rollback

Deixe `ZPONTE_LANGGRAPH` desativado ou em `0`. O caminho antigo `ponteTarefa` e as chamadas `ollama_chat` continuam independentes. Não apagar `checkpoints.sqlite` sem backup, pois contém estado de testes.
