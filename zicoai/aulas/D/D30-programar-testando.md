# D30: programar como o Claude: editar por trechos, rodar, ler o erro e consertar antes de entregar (31/10/2026)

**Regra:** Código só vai pro Thiago depois de RODAR. App que já existe se edita por trechos (ANTES/DEPOIS, cada ANTES aparecendo 1 vez no arquivo), nunca devolvendo o arquivo inteiro. Depois: conferir a sintaxe, abrir no navegador na largura do celular, clicar nos botões, ler os erros e consertar a causa (até 2 voltas). Na entrega, dizer o que foi testado.
**Palavras-chave:** programação, programar, código, app, html, editar app, mudar app, corrigir app, bug, erro, Script error, código cortado, arquivo cortado, testar, navegador, playwright, console, sintaxe, trecho, antes depois, edição

## Por quê
- **Arquivo inteiro de volta corta.** O cérebro grátis tem limite de saída (~8 mil tokens). App de 60 mil letras não cabe: vinha cortado no meio ("Script error", tela branca) e às vezes sumia uma parte que ninguém pediu pra mexer. Trecho pequeno sempre cabe, e o resto do arquivo fica exatamente igual.
- **ANTES tem que aparecer 1 vez:** se o trecho não existe ou aparece duas vezes, não dá pra saber onde trocar. Recusar e pedir de novo é melhor que adivinhar (é a mesma regra do Edit do Claude).
- **Rodar antes de entregar:** quem escreve código "de cabeça" erra coisa boba: variável sem declarar, `getElementById` de um id que não existe, vírgula sobrando. Isso só aparece rodando. O Claude roda os testes e o Playwright antes de dizer "pronto"; agora ela também.
- **Clicar nos botões:** o app abre bonito e quebra no clique. Erro de handler só aparece clicando.
- **Consertar a causa:** esconder erro com try/catch faz o teste passar e o app continuar quebrado.

## Como funciona por baixo
- Edição: `REGRA_EDICAO` no sistema quando vem `appSlug`; `aplicarTrechos(código, resposta)` aplica cada bloco; falhou → 1 pedido de refazer mostrando qual trecho não bateu; a resposta final tem a explicação + o arquivo COMPLETO (o botão Publicar continua igual).
- Teste: `checarHtmlEstatico` (arquivo cortado, `<script>` sem fechar, sintaxe de cada script com `new Function`) → se o Mac estiver ligado, `ponte('testar_html')`: o Mac abre no Chromium sem janela, 390 px, clica em até 6 botões, devolve erros de JavaScript, do console, de arquivo que não carregou, página em branco e rolagem pro lado. HTML grande vai em pedaços de 90 mil letras pelo cache.
- Conserto: `consertarCodigo` manda código + erros pro cérebro forte (Gemini Flash), pede trechos ANTES/DEPOIS, aplica e testa de novo. Até 2 voltas. Selo no fim: "✅ Testei… sem erro" ou "⚠️ Testei e ainda tem: …".
- O revisor de texto não mexe em app (reescrevia o arquivo e cortava); quem revisa app é o teste.

## Situações em que aparece
- "faz um app de…", "no app X muda…", "deu Script error", "a tela ficou branca", "o botão não funciona", "veio cortado", "quero ela programadora".

## Exemplo
- App novo com `alert(1 + )`: teste pega o erro de sintaxe → conserto troca o trecho → testa de novo → entrega com "✅ Testei e consertei 1x antes de te mandar".
- "No app calc muda o botão pra Calcular": um trecho `<button id="b">Somar</button>` → `Calcular`; o resto do arquivo idêntico.

## Erro comum
- Achar que "o código parece certo" é teste. Teste é rodar.
- Pedir o arquivo inteiro "pra garantir": é justamente o que corta.
- Teste que passa porque o erro foi escondido.

## Como conferir
- Teste `t39`. No app, os passos "Aplicou N trecho(s)", "Abriu o app no navegador do Mac… sem erro" e o selo ✅/⚠️ no fim.
- `ponte-log.txt` do Mac: "pedido: testar_html N letras de html".
