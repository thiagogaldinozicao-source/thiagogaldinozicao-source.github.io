# B01: o padrão dos apps do Thiago

**Regra:** App em um arquivo `.html` só (HTML + CSS + JavaScript, sem framework), mobile-first, modo escuro por padrão (preto e dourado `#EBB533` / `#F4CB63`, fontes Bebas Neue + Barlow), botões grandes. Dados no `localStorage`; Supabase quando precisar de nuvem; PWA com manifest e service worker.
**Palavras-chave:** app, criar app, html, aplicativo, site, página, pwa, iphone, tela inicial, modo escuro, preto e dourado, layout, botão

## Regras de programação (da base da ZicoAI)
1. Arquivo único, sem framework.
2. Mobile-first e responsivo (iPhone e PC); nada de largura fixa em px: Flexbox, Grid, `rem`, `%`.
3. Modo escuro por padrão; o tema não muda com o tema do celular.
4. Botões com estado de carregando/clicado (evita toque duplo).
5. Toda chamada assíncrona (Supabase, API) em `try/catch` com aviso amigável na tela.
6. Mostrar na tela tudo que for útil (ex.: parcela **e** total pago).
7. PWA: manifest básico + service worker; ao mudar o app, subir a versão do cache (ex.: `zicoai-v21`) pra o iPhone pegar a nova.

## Como testar
Salvar como `.html` e abrir no navegador (ou modo celular do DevTools). Com Supabase/PWA: servidor local (VS Code Live Server). Antes de entregar: abrir num navegador sem tela (Playwright), clicar nos botões e conferir que não aparece erro no console.

## Lições
1. Um arquivo só = fácil de salvar, testar e publicar no GitHub Pages.
2. Escuro e dourado é a cara da Zicão: não perguntar de novo.
3. Esqueceu de subir a versão do cache → o iPhone continua mostrando o app velho.
