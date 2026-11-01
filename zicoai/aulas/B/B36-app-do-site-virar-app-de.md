# B36: app do site virar app de celular e de computador (01/11/2026)

**Regra:** App que já é site (PWA) vira app sem reescrever: Android = TWA (Bubblewrap: Chrome em tela cheia, prova de dono em /.well-known/assetlinks.json); computador = Electron (janela própria que abre o site). Os dois atualizam sozinhos quando o site muda. Build no GitHub Actions; sem assinatura paga o sistema avisa na 1ª vez.
**Palavras-chave:** apk, android, play store, instalar, app no pc, windows, exe, mac, dmg, electron, twa, bubblewrap, pwa, janela própria, igual app do claude

## Por quê
- Reescrever o app pra cada sistema = 3 apps pra manter. Embrulhar o site = 1 app só, e cada mudança no site já chega em todos.
- TWA usa o Chrome de verdade (microfone, foto, login guardado). Electron dá janela, ícone na barra e atalho igual app instalado.

## Como funciona por baixo
- Android: `@bubblewrap/core` lê o manifest, gera o projeto, `gradlew assembleRelease`, assina com `apksigner`, e a digital SHA-256 vai pro `assetlinks.json` do domínio. Sem a digital certa, aparece a barra de endereço.
- Computador: `electron` + `electron-builder` (Windows nsis → .exe; Mac dmg). Microfone liberado só pro próprio app; link de fora abre no navegador; sem internet → tela que volta sozinha.
- Actions: Windows e Mac em máquinas separadas; um job junta e cria o Release (link fixo `releases/latest/download/…`).

## Situações em que aparece
- "cria um apk", "quero no PC igual o Claude", "app no Mac".

## Erro comum
- `themeColor` em texto no Bubblewrap: ele espera objeto de cor. Deixe vir do manifest.
- Dois-pontos no nome de passo do YAML (`name: Publica (link fixo: …)`) quebra o arquivo inteiro.
- Chave do APK nova a cada build: pra atualizar tem que desinstalar.

## Como conferir
- Run verde no Actions, arquivo no Release/no repo, instalar e abrir no aparelho de verdade.
