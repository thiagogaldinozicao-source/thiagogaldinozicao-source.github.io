# D10: a ponte pra ZicoAI mexer no PC (30/10/2026)

**Regra:** Mexer no PC: só pastas liberadas, nunca apagar nem sobrescrever; o PC busca os pedidos (sem porta aberta); antivírus libera só a pasta.
**Palavras-chave:** pc, computador, ponte, print, tela, arquivo, powershell, antivírus, defender, acesso remoto

## Pedido
> "E o que precisamos fazer para ela acessar meu computador remotamente?"

## Regras antes de qualquer código
Só pastas liberadas; **nunca apagar**; **nunca sobrescrever** (cria "nome (2)"); comando só de uma lista fixa; segredo pra ninguém mais usar; tudo anotado em `ponte-log.txt`.

## Execução
- `zicoai/pc/ponte.ps1`: PowerShell 5.1 (já vem no Windows, não precisa instalar nada). Ações: `status`, `listar`, `ler`, `escrever`, `print`, `abrir`, `comando` (espaco_disco, processos, gpu, ip, sistema, ollama_modelos, testes_zicoai).
- `zicoai/pc/instalar.ps1`: 1 comando no PowerShell baixa a ponte, cria o `config.json` com o segredo, liga com o Windows e espera "conectado na ZicoAI" no log; se não conectar, mostra o erro na tela.
  ```powershell
  irm "https://raw.githubusercontent.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io/main/zicoai/pc/instalar.ps1?v=2" | iex
  ```
- No cérebro: ferramentas do agente `pc_status`, `pc_listar`, `pc_ler`, `pc_escrever`, `pc_print` (salva no Drive e descreve a imagem), `pc_abrir`, `pc_comando`, `pc_testar`.

## Erros e correções (é a parte que mais ensina)
1. **A ponte abria e fechava na hora.** Causa: `New-Object System.Threading.Mutex(..., [ref]$ok)` não funciona no PowerShell 5.1. Correção: tirar o Mutex (se já tem outra ponte ligada, a porta ocupada já faz a segunda sair). E o instalador passou a esperar e **mostrar o erro**.
2. **502 pelo Tailscale Funnel.** A v1 era um servidor no PC (porta 8790) exposto pelo Funnel. Primeiro tentou aceitar o corpo "em pedaços" (chunked) que o Funnel manda; continuou 502. **Mudou o desenho (v2):** o PC é que **busca** os pedidos na ZicoAI:
   - o PC chama `ponteBuscar` no `/exec` em laço (o cérebro segura até 20 s esperando pedido = long-poll);
   - executa e devolve com `ponteResposta` (resposta grande vai em pedaços de 90 mil letras);
   - fila no CacheService, com trava. Nada fica aberto pra internet.
3. **Antivírus bloqueou** ("ScriptContainedMaliciousContent"): script que tira print e roda comando parece suspeito. Solução: o Thiago (como Administrador) liberou **só** as pastas da ZicoAI:
   ```powershell
   Add-MpPreference -ExclusionPath "$HOME\ZicoAI-Ponte","$HOME\ZicoAI"
   ```
4. **Pasta errada:** pedir "ZicoAI" ia pra `ZicoAI\ZicoAI`. Correção (2.1): nomes comuns ("ZicoAI", "Downloads", "Documentos") viram a pasta liberada certa.
5. **Arquivo apagado sem querer:** um script Python abriu o `ponte.ps1` pra regravar (abrir pra gravar já esvazia o arquivo) e só depois deu erro no nome da codificação: `utf8-sig` não existe, o certo é `utf-8-sig`. O arquivo ficou vazio. Recriei do zero com `utf-8-sig` (UTF-8 **com BOM**, que o PowerShell 5.1 precisa pra ler acento). Confere: `od -An -tx1 -N3 ponte.ps1` tem que mostrar `ef bb bf`.
6. **Teste de verdade:** o agente tirou um print da tela do PC e descreveu certo.

## Lições
1. Segurança primeiro, código depois.
2. Antes de pedir pro Thiago instalar, teste o máximo com PC de mentira.
3. Servidor caseiro exposto na internet dá problema: é melhor o PC **buscar** os pedidos.
4. Instalador sempre mostra o erro quando falha.
5. Antivírus: libera só a pasta necessária, nunca desliga tudo.
6. Depois de um script mexer num arquivo, **confira o arquivo** (tamanho, começo, codificação).
