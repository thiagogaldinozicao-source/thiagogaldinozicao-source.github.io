# D38: olhar o real antes de decidir (01/11/2026)

**Regra:** Antes de escolher, baixar ou apagar qualquer coisa, olhe o que existe DE VERDADE no aparelho (lista de modelos, espaço livre, versão instalada). Script que mexe no sistema só toca o que recria sozinho, mede antes, pergunta antes de cada passo e nunca entra em C:\Windows.
**Palavras-chave:** real, conferir antes, instalado, ollama list, espaço, disco, tela azul, script, limpar, apagar, C:\Windows, PowerShell, modelo, versão

## Por quê
- 01/11: o Claude escolheu baixar o qwen3.5:35b-a3b (24 GB) sem olhar o PC. O PC já tinha o qwen3.6:35b, mais novo e do mesmo tamanho. Resultado: falta de espaço, script de limpeza, perda de tempo.
- No mesmo dia, o script de limpeza parou serviço e esvaziou pasta dentro de C:\Windows. No minuto seguinte veio tela azul (CRITICAL_PROCESS_DIED). Mesmo que não tenha sido a causa única, mexer no sistema sem precisar só traz risco.
- Decidir "de cabeça" parece mais rápido, mas o retrabalho custa muito mais que um `ollama list`.

## Como funciona por baixo
- PC: `ollama list` (modelos), `Get-PSDrive C` (espaço), `nvidia-smi` (placa e driver). Mac: `ollama list`, `df -h`. A ponte 2.4 já manda a lista de modelos a cada 5 min (`ponte_modelos`), e o cérebro escolhe a partir dela (`cerebroPCPonte`).
- O `liberar-espaco.ps1` atual: MEDE cada item, mostra o total e PERGUNTA (S/N). Só esvazia cache que o Windows e os drivers recriam sozinhos (Temp do usuário, cache de shader, relatórios de erro). Windows Update só pelo DISM (jeito oficial). Compactados grandes ele só MOSTRA.
- O `otimizar-pc.ps1`: 8 passos, cada um explica, pergunta e guarda o comando de desfazer.

## Situações em que aparece
- "baixa o modelo X", "libera espaço", "faz um script pra limpar o PC", "instala tal coisa", "qual modelo usar no PC".

## Exemplo
- Certo: `ollama list` → viu qwen3.6:35b → v86 passou a preferir ele, e o instalador pula o download repetido.

## Erro comum
- Recomendar download sem conferir o que já tem.
- Script que apaga sem medir e sem perguntar.
- Mexer em C:\Windows, serviço do sistema ou pasta de projeto (ZOMBIES, Unreal, Ollama).

## Como conferir
- Antes: a lista real (modelos, espaço). Depois: rodar de novo e comparar. Script novo: lido linha por linha procurando Remove-Item/Stop-Service fora das pastas de cache.
