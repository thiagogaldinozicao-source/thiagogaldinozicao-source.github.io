# A12: mexer no computador do dono sem quebrar nada (01/11/2026)

**Regra:** Script pro computador do Thiago: explica cada passo, MEDE antes, PERGUNTA (S/N), não apaga nada dele, não para serviço do Windows, guarda o comando de desfazer e mostra no fim. Na dúvida, só MOSTRA e deixa ele decidir.
**Palavras-chave:** PowerShell, script, PC, Windows, apagar, limpar, otimizar, desfazer, perguntar, administrador, registro, serviço, Defender

## Por quê
- Regra da casa: "Não apagar nada do PC nem do Mac". O Thiago apaga ele mesmo.
- 01/11: tela azul logo depois de um script que mexia em C:\Windows. Num computador que é ferramenta de trabalho (Unreal, IA, loja), o prejuízo de quebrar é muito maior que o ganho de uns GB.

## Como funciona por baixo
- Abrir como administrador só quando precisa e avisar quando não está.
- `Read-Host '... (S/N)'` antes de cada mudança. `$desfazer += 'comando'` e no fim imprime a lista.
- Lista do que NUNCA mexe, escrita no topo do script: ZOMBIES, Unreal, Ollama/modelos, ZicoAI, Documentos, Downloads, Área de Trabalho, jogos.
- Arquivo grande do usuário (.7z/.zip/.iso): só lista os 10 maiores pra ele olhar no WizTree.

## Erro comum
- `Remove-Item -Recurse` em pasta que não é cache.
- `Stop-Service` em serviço do Windows.
- Mudar registro sem guardar como voltar.

## Como conferir
- Ler o script procurando Remove-Item, Stop-Service, Set-ItemProperty e conferir que cada um tem pergunta antes e desfazer depois.
