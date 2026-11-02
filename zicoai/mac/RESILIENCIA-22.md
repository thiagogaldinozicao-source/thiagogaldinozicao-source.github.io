# Ponte Mac 2.2 — recuperação de respostas (proposta)

Esta revisão **não está publicada** no Mac do usuário nem no Apps Script. Ela atua no erro observado: uma ferramenta pode concluir e a ponte perder a conexão antes de devolver o resultado.

## Reaproveitamento

- Mantém a ponte Node.js e o navegador Playwright existentes; não instala outro navegador nem substitui o agente do Apps Script.
- Implementa padrão **transactional outbox** com arquivos JSON privados e gravação temporária + rename atômico. O estado é `iniciada` ou `pronta`.
- Quando a execução termina, guarda o resultado no disco antes de responder. Só remove após `ponteResposta` retornar `ok: true`.
- Quando reinicia, reenvia resultados `pronta`. Se uma operação ficou `iniciada`, NÃO executa novamente: devolve `EXECUCAO_INCERTA`. Isso evita duplicar cliques, gravações ou compras, mas exige investigar o efeito real.
- Não altera autenticação, modelo selecionado, academia nem armazenamento das mensagens.

## Limites e cuidados

**Não é garantia de exatamente uma execução:** se o processo caiu no intervalo entre realizar a ação e gravar seu resultado, não existe confirmação; a Zica deve exibir incerteza, não sucesso. A abordagem exige revisão do histórico quando o status for `EXECUCAO_INCERTA`.

A caixa de saída reside em `~/ZicoAI/ponte-pendentes` ou `ZICO_OUTBOX_DIR`. Seu conteúdo pode conter resultados sensíveis; não versionar, sincronizar nem publicar a pasta.

A implantação requer **ambos** os arquivos `ponte-mac.js` e `caixa-saida.js` no mesmo diretório, reiniciar a ponte e testar reconexão com o Apps Script real. Não implantar só o primeiro: `require('./caixa-saida')` falharia. Recomenda-se backup da ponte 2.1 e rollback conjunto.

## Testes de aceitação

1. `node --test zicoai/mac/caixa-saida.test.js` — intencionalmente sem Mac físico nem rede.
2. Rodar leitura normal na ponte em ambiente de teste; verificar confirmação e limpeza da caixa.
3. Bloquear `ponteResposta` por 30 segundos após a execução: resultado deve permanecer na caixa e ser reenviado quando conexão voltar.
4. Reiniciar processo depois do início da ação antes do resultado: deve informar `EXECUCAO_INCERTA`, sem executar a ação novamente.
5. Confirmar que requests de múltiplos dispositivos e ponte do PC permanecem intactos.
6. Reiniciar a ponte e verificar que não há repetição de ação com efeito externo.

Não criar claims de aprovação sem os testes de integração 2–6.

## Próximas etapas

- Incluir classificação `temporário / validação / autorização / incerteza` e tentativas com limites no agente.
- Tratar tarefas de Apps Script com diagnósticos por etapa, em vez de `erro` genérico.
- Aproveitar a suíte Playwright já existente para testar navegador e PWA.
- Integrar checkpoints no orquestrador, preferencialmente sem duplicar o armazenamento atual até validar recuperação sob reinício.
