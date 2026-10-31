# D21: montar a oficina 24h no Mac Mini (31/10/2026)

**Regra:** Antes de instalar, diagnostique (sistema, disco, o que já existe). Instale em ordem (Homebrew → Node/uv → Playwright) e teste cada passo antes do próximo. Quando eu não consigo digitar no terminal da máquina, o Thiago cola o comando e o resultado vai pra um arquivo que eu leio.
**Palavras-chave:** mac, mac mini, oficina, homebrew, brew, node, uv, playwright, chromium, ollama, instalar, terminal, launchd, ligar sozinho, repouso, dormir, 24h, servidor em casa

## Por quê
- **Diagnóstico primeiro** porque instalar às cegas quebra: o `git` e o `python3` do macOS "existem", mas são atalhos que só pedem pra instalar as ferramentas da Apple. Quem só checa "tem o comando?" acha que tem e erra depois.
- **Um passo por vez** porque cada um depende do anterior (Node vem do Homebrew; Playwright vem do npm). Se dois falham juntos, ninguém sabe qual foi.
- **Resultado em arquivo** porque o shell que eu tenho roda numa máquina virtual Linux dentro do Mac, não no macOS, e a trava de segurança não deixa eu digitar no Terminal. O arquivo é a ponte que dá pra conferir, em vez de confiar em "acho que foi".

## Como funciona por baixo
- **Homebrew** instala programas no Mac em `/opt/homebrew` e pede a senha uma vez (a do Mac, digitada pelo Thiago, nunca por mim). Junto vêm as "ferramentas de linha de comando" da Apple (git de verdade, compilador).
- **launchd** é quem liga programas sozinho no macOS. Um arquivo `.plist` em `~/Library/LaunchAgents` diz: o que rodar, ligar no login (`RunAtLoad`) e religar se cair (`KeepAlive`). Só roda com o usuário logado.
- **Mac em repouso = oficina parada.** Tudo dorme junto. Ajustes › Energia › "Impedir repouso automático quando a tela estiver desligada".

## Situações em que aparece
- "monta o Mac pra ficar ligado trabalhando", "instala o que precisa", "liga sozinho quando ligar o Mac", "a ligação com o Mac caiu".

## Exemplo (o que aconteceu)
1. Diagnóstico: macOS 27, M4 16 GB, 127 GB livres, Ollama rodando sem modelo, sem Homebrew/Node/uv.
2. Homebrew → `brew install node uv` → `npm i playwright` + `npx playwright install chromium` → teste: abrir o app da ZicoAI num navegador invisível e ler o título ("ZicoAI").
3. Clonar o repositório e rodar t1 a t30: 30 de 30.

## Erro comum
- **Rodar o segundo comando antes do primeiro terminar.** Deu `command not found: brew`, porque o instalador do Homebrew ainda esperava a senha e o Enter. Conserto: rodar de novo com `| tee arquivo.txt` e só seguir quando aparecer "Installation successful!".
- **Achar que a pasta está liberada porque o app está aberto.** A ligação do app do Claude com a conversa caiu; voltou fechando e abrindo a conversa no app do Mac.

## Como conferir
- Cada passo grava `~/ZicoAI/oficina/passoN.txt`; leia o arquivo antes de dizer que foi.
- Prova final: os testes do cérebro passando no Mac e o log da ponte com "conectado na ZicoAI".
