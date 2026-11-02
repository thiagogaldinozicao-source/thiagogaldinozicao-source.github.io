# Avaliação real dos modelos locais com Promptfoo

Esta configuração utiliza o **Promptfoo** (projeto da comunidade) com um provedor **Ollama local**. Ela não chama Gmail, WhatsApp, dados de clientes, Sheets nem o Apps Script: as perguntas são inteiramente fictícias. O objetivo é medir comportamento de modelo (contas, não inventar preços, admitir falta de ferramenta, explicar falhas).

## Rodar no Mac com Ollama ativo

```bash
cd /CAMINHO/DO/REPOSITORIO/zicoai/avaliacao
ollama list
npx promptfoo@latest eval --config promptfooconfig.yaml --no-cache
```

O arquivo de configuração usa o modelo `qwen3:8b` como **exemplo porque era o padrão da ponte**. Caso o nome mostrado por `ollama list` seja outro (inclusive Qwen destilado), altere somente `ollama:chat:qwen3:8b` para **o nome exato instalado**. Não deixe um benchmark com um modelo inexistente parecer uma falha de inteligência.

Para ver o relatório:

```bash
npx promptfoo@latest view
```

Se estiver rodando noutra porta, use `OLLAMA_BASE_URL=http://127.0.0.1:11434` ou o endereço local válido. **Não exponha a API Ollama sem autenticação na rede pública.**

## Como interpretar

- Se acertou a conta, não significa que sabe usar navegador.
- Se o modelo disser que abriu o Chrome, sem uma ferramenta conectada, isso é **falha** (afirmação sem prova).
- Se inventar preço sem acesso à tabela da loja, isso é **falha**.
- Se disser `não sei` diante de contexto insuficiente, isso é comportamento correto.
- Uma nota de benchmark isolada não prova o comportamento do agente completo. Faça também testes com ferramentas reais e evidências no navegador.

## Limitações

Configuração criada no GitHub; ainda **não executada contra os modelos do Mac real**. Promptfoo avalia a resposta do modelo por essas perguntas, não a memória completa nem o agente da ZicoAI. Não usar dados pessoais em `promptfooconfig.yaml` ou em logs versionados.
