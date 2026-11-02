# Preparar o 9B destilado no Mac — sem interromper a ZicoAI

## O que já existe
- A ponte `zicoai/mac/ponte-mac.js` mac-2.1 já aceita nomes `hf.co/autor/modelo:quantizacao`; teste simulado `zicoai/cerebro/testes/t80.js`.
- O `Codigo.gs` permite selecionar o modelo do Mac via propriedade de script `MAC_MODELO`. O duelo `dueloMac()` compara `qwen3:8b` com o 9B exato.
- O estudo na ponte tenta `ponteEstudar` a cada 30 minutos quando conectada. Os professores gratuitos não foram removidos.

## Instalação manual e reversível
1. No Mac, abra Terminal e tenha Ollama funcionando. Confira com `ollama list`.
2. No clone do projeto atualizado, execute `bash ~/ZicoAI/repo/zicoai/mac/preparar-9b-destilado.sh`. O script só baixa após digitar `SIM`, não apaga o 8B nem altera a propriedade `MAC_MODELO`.
3. Verifique que a ponte real em `~/ZicoAI/ponte-mac/ponte-mac.js` é mac-2.1. A cópia no GitHub **não significa** que a instalação local foi atualizada. Preserve `config.json` e segredos; não publique esses arquivos.
4. Confirme no Mac `ollama list` e um teste real de resposta do 9B. Teste `qwen3:8b` também.
5. Execute o duelo do Mac na versão **efetivamente implantada** do Apps Script. Confira a aba `academia`: resultados `sem cérebro` não são notas de qualidade.
6. Só depois de uma vitória consistente do 9B, configure `MAC_MODELO` para `hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M` nas Propriedades do script. Para reverter, use `qwen3:8b`.

## Limites e cuidado
- Mac Mini M4 de 16 GB: evite colocar 35B nele; use o 35B destilado no PC.
- A Academia de código já tem gatilho noturno, e a ponte tem tentativa de estudo a cada 30 minutos. Isso não comprova fine-tuning LoRA dos pesos.
- O `Codigo.gs` versionado no GitHub ainda marca v102. Não substitua uma implantação v103.x com esse arquivo antigo sem primeiro reconciliar as versões.
- A instalação ainda **não aconteceu**; este PR prepara um procedimento com confirmação e não altera o serviço.
