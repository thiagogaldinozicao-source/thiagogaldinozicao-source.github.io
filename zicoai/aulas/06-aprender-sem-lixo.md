# Aula 06: aprender sozinha sem aprender lixo (30/10/2026)

## Pedido
> "memória única… que aprenda tudo sozinha, sem eu precisar repetir nada"

## Execução
1. **Tags que o cérebro escreve na resposta** e o código processa (e tira do texto antes de mostrar):
   `[[MEMORIA: …]]`, `[[APRENDIZADO: erro || certo]]`, `[[ESQUECER: trecho]]`, `[[BASE: assunto || conteúdo]]`, `[[PERFIL: tópico || informação]]`, `[[IMAGEM: …]]`, `[[TAREFA: …]]`.
2. **`aprenderSozinha()`** a cada 10 min: relê as mensagens novas (desde `APRENDIDO_ATE`), tira fatos e correções, não duplica (`jaSabe`).
3. **Histórico:** toda mudança em `base`/`perfil` vai pra aba `historico` com **antes e depois**. Pra desfazer, copia o "Antes" de volta.
4. **CPF e telefone barrados** (`temDadoSensivel`) na memória, na base, no perfil, nos exemplos e no `acrescentar_planilha` do agente. Ainda **não** passam por essa trava: a tag `[[APRENDIZADO]]`, os aprendizados que o `aprenderSozinha` grava e a ferramenta `escrever_planilha` (pendência no código).

## Erros e correções (v19)
Ela começou a guardar coisa errada: frases que **ela mesma** tinha dito viravam "fato", e o perfil do Thiago era sobrescrito. Correções:
- `apoiado(texto, falaThiago)`: só vira fato o que tem apoio na fala **do Thiago** (metade das palavras importantes e **todos os números** do fato precisam aparecer no que ele escreveu).
- Regras sobre o próprio sistema e interesse do momento ("perguntou sobre X") são descartadas.
- `gravarFato` **nunca substitui** linha do `perfil` nem de assunto genérico; só acrescenta. Substitui só assunto específico que exista uma vez.
- Linha com `[IGNORAR]` some do contexto sem ser apagada; a arrumação de domingo remove e registra no histórico.

## Lições
1. Memória automática precisa de **filtro**: o que a IA disse não é fato; o que o Thiago disse é.
2. Número em fato só entra se o Thiago escreveu esse número.
3. Toda mudança automática deixa rastro (antes/depois) pra poder desfazer.
4. Neutralizar (`[IGNORAR]`) é mais seguro que apagar.
