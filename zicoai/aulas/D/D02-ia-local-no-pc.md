# D02: montar a IA local no PC (29–30/10/2026)

**Regra:** IA local: Ollama + modelos que cabem na placa (8–9B rápido, 35B lento); instalador é com o Thiago; link carregando sem erro = firewall.
**Palavras-chave:** ollama, modelo local, pc, anythingllm, comfyui, tailscale, firewall, instalar, qwen, celular

## Pedido
Rodar a IA no PC do Thiago (Windows, i9, 32 GB, RTX 3080 10 GB), de graça, com chat, pesquisa e base de conhecimento.

## Plano
1. Ollama (roda os modelos).
2. Modelos: um rápido que lê foto, um que pensa, um grande pra programar.
3. Tela de chat com base de conhecimento e pesquisa (AnythingLLM).
4. Gerar imagem no PC (ComfyUI).
5. Usar no celular (Tailscale).

## Execução
- **Instalar o Ollama:** o instalador foi baixado pra pasta Downloads (`OllamaSetup.exe`) e **o Thiago instalou**. Daqui não dá pra abrir instalador no PC dele; isso é sempre com ele (1 clique).
- **Modelos** (`ollama list` mostra):
  - `zicoai` = qwen3-vl:8b-instruct (rápido, lê foto e print), com a personalidade dentro;
  - `qwen3.5:9b` (raciocínio e código);
  - `zicoai-dev` = qwen3.6:35b (programação pesada; 22 GB, parte na placa, parte na RAM; usar com Unreal e Chrome fechados).
- **Criar um modelo "seu"** (personalidade e contexto maior) pela API do Ollama, sem terminal:
  ```js
  fetch('/api/create', { method: 'POST', body: JSON.stringify({
    model: 'zicoai-dev', from: 'qwen3.6:35b',
    system: '…regras de programação…', parameters: { num_ctx: 16384 }, stream: false }) })
  ```
  (equivale a um `Modelfile` com `FROM`, `PARAMETER num_ctx` e `SYSTEM`).
- **Ajustes indicados no Ollama** (variáveis de ambiente do Windows, depois reiniciar o Ollama): `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0`, `OLLAMA_KEEP_ALIVE=30m`. Cabe mais contexto na mesma placa e o modelo não descarrega toda hora.
- **AnythingLLM:** workspaces "Zicão Store" (com roteador de cérebros), "Programação", "comparativos"; base `base-zicoai.md` embutida; agente com pesquisa web.
- **ComfyUI** com o modelo Krea-2 Turbo: ~40 s por imagem 1024×1024.
- **Celular:** Tailscale no PC e no iPhone (rede privada entre os dois) + Ollama com "Expose Ollama to the network".

## Erros e correções
1. **AnythingLLM não instalava:** o download ficava preso como `.tmp` na pasta Downloads (3 tentativas). Solução: o Thiago apagou os `.tmp` e baixou direto do link oficial.
2. **A personalidade sumia no AnythingLLM:** ele manda o prompt dele pro Ollama e isso passa por cima do `SYSTEM` do modelo. Solução: colar o prompt da ZicoAI também no System Prompt do workspace.
3. **Ollama parou de responder** enquanto o modelo de 35B era criado. Solução: fechar e abrir o Ollama de novo; depois testar os dois modelos.
4. **Celular não conectava** (o link `http://<ip do tailscale>:11434` ficava carregando). Causa: firewall do Windows. Solução (Terminal como Administrador):
   ```powershell
   New-NetFirewallRule -DisplayName "Ollama Tailscale" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow -Profile Any
   ```
   Teste: abrir o link no navegador e ver "Ollama is running".

## Lições
1. Instalador e Terminal como Administrador são com o Thiago: diga exatamente o que clicar e o que deve aparecer.
2. Link que "fica carregando" sem erro quase sempre é firewall.
3. Programa travado: reinicia e testa de novo antes de mexer em configuração.
4. Quando uma tela de chat tem prompt próprio, o prompt do modelo pode ser ignorado: confira onde o prompt de verdade está.
5. Modelo grande demais pra placa funciona, mas lento: deixe ele pra tarefa que precisa.
