# Aula 11: publicar uma versão nova do cérebro (30/10/2026)

## Por que é delicado
O código do repositório e o código que roda no Google são cópias separadas. Publicar errado derruba a ZicoAI no celular do Thiago.

## Passo a passo (sem clasp, pelo navegador do PC)
1. Rodar **todos** os testes: `cd zicoai/cerebro/testes && for f in t*.js; do node $f; done`. Nenhum FAIL.
2. Commit e push pro GitHub.
3. Abrir o editor do Apps Script "ZicoAI Cérebro".
4. Colar o código do GitHub (raw) no editor.
5. **Conferir que o código no editor é igual ao do GitHub** (sha256 dos dois). Só segue se bater.
6. Salvar ("Salvar projeto no Drive").
7. Implantar → **Gerenciar implantações** → botão Editar → Versão: **Nova versão** → Implantar.
8. Testar no app: uma pergunta simples e a função nova.

## Erros que já aconteceram
1. **Clique por posição na tela caiu no "Cancelar"** do diálogo de implantação. Correção: achar o botão pelo nome (aria-label) e clicar por código.
2. **Texto digitado foi parar dentro do código**: um clique no campo de descrição com o menu aberto mandou o texto pro editor. Por isso o passo 5 (conferir o sha256) vem **antes** de implantar, sempre.
3. **Escopo novo** (Drive, Gmail, Agenda, gatilhos): o Google pede autorização de novo. Isso é com o Thiago: rodar uma função no editor → Revisar permissões → Avançado → Acessar → Permitir.
4. **Implantação nova muda o link** e o app perde a conexão. Sempre "Nova versão" na **mesma** implantação.

## Lições
1. Nunca publicar sem os testes passando.
2. Conferir o código colado antes de implantar.
3. Clique por nome do botão, não por posição na tela.
4. Testar no app depois de publicar.
