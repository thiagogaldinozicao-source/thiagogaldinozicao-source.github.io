# B11: PWA instalável no iPhone (manifest, ícones, tela inicial)

**Regra:** Pra instalar na tela inicial: `manifest.webmanifest` com ícones 192, 512 e maskable, `apple-touch-icon` (180x180) e as metas da Apple. Todo link de ícone leva `?v=N`; mudou o ícone, aumente o N.
**Palavras-chave:** pwa, instalar no iphone, adicionar à tela de início, manifest, ícone do app, apple touch icon, ícone não atualiza, favicon, standalone, app na tela inicial, gerar ícones, maskable
**Projeto(s):** Calculadora-do-zicao, maquininha, emprestimo

## Exemplo real
Os três apps (calculadora, simulador de parcelas, simulação de empréstimo) são instalados pelo Safari: Compartilhar, Adicionar à Tela de Início. Cada um tem ícone próprio (cartões amarelo/verde com Z; saquinho 💰 no fundo preto/dourado; visor + teclas) e abre sem barra do navegador.

## Como foi feito
Manifest da maquininha (copiado):
```json
{ "name": "Zicão Store · Simulador de Compras", "short_name": "Zicão Store",
  "start_url": "./", "scope": "./", "display": "standalone",
  "background_color": "#0a0a0a", "theme_color": "#111111",
  "icons": [
    { "src": "icons/icon-192.png?v=2", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png?v=2", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-maskable-512.png?v=2", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "favicon.svg?v=2", "sizes": "any", "type": "image/svg+xml" } ] }
```
No `<head>` da maquininha (trecho de `maquininha/index.html`, linhas 6-8 e 11-13, copiado):
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Zicão Store">
<link rel="icon" type="image/svg+xml" href="favicon.svg?v=2">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png?v=2">
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png?v=2">
<link rel="manifest" href="manifest.webmanifest?v=2">
```
O `emprestimo/index.html` (linhas 13-14) também tem `<meta name="mobile-web-app-capable" content="yes">` junto da meta da Apple, e lá o ícone é `apple-touch-icon.png?v=2` (sem pasta `icons/`).
- Use `./` em `start_url` e `scope` (o site fica em subpasta do GitHub Pages).
- Ícones gerados por script a partir de um SVG (`icons/gen.py` na maquininha; precisa de Python com Playwright). O desenho-fonte fica no repo.
- Trocar o ícone (passo a passo do README da maquininha, "Trocar o ícone"): edita o desenho em `icons/gen.py`, roda `python3 icons/gen.py`, aumenta o `?v=N` no `index.html` e no manifest, e no iPhone apaga o atalho e adiciona de novo pelo Safari.
- Publicar: push na `main`, GitHub Pages atualiza em 1 a 2 minutos.

## Erros que já aconteceram
- 8b839ff (emprestimo): só tinha `apple-mobile-web-app-capable`. Foi adicionada a `mobile-web-app-capable` (a atual), mantendo a da Apple pro iOS antigo.
- 610607f / 47c3bbe (Android): o ícone padrão do Capacitor apareceu no lugar do da loja. Foi trocado por ícone adaptativo (frente + fundo) e depois o `icon-foreground.png` foi refeito "no tamanho certo".

## Lições
1. Trocar ícone = subir `?v=N` + o iPhone precisa reinstalar o atalho. Avise o Thiago disso.
2. Sempre inclua o ícone `maskable` (Android corta em círculo/quadrado).
3. Guarde o SVG-fonte do ícone no repo e gere os PNGs por script; não desenhe PNG na mão.
4. `display: standalone` + metas da Apple = abre sem barra do Safari.

Fontes: maquininha/manifest.webmanifest, maquininha/README.md, emprestimo/manifest.webmanifest; commits 073a631, 8b839ff, 18ed605, 47c3bbe.
