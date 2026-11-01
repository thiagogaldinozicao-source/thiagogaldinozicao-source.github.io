# D41: provas do app: o teste que pega o defeito (01/11/2026)

**Regra:** Todo conserto vem com PROVA: passos + o que conferir. A prova tem que FALHAR no código velho (pega o defeito) e PASSAR no novo. Provas que passaram ficam guardadas e rodam em toda mudança futura.
**Palavras-chave:** prova, provas, teste, Playwright, Mac, falha no velho, passa no novo, regressão, provas_apps, testar-html, centavo, tabela

## Por quê
- O teste do Mac só via se o app abria e se os botões respondiam. O erro dos centavos passava, porque o app "funcionava".
- Prova que passa no código velho não prova nada: ela não olha o defeito.
- Guardar as provas evita o mesmo bug voltar depois de outro conserto.

## Como funciona por baixo
- `REGRA_PROVAS`: ela escreve um bloco ```provas com JSON. Campos: nome; passos (clicar, preencher, escolher, teclas, esperar, js); conferir (texto contem/igual/naoContem, ou js que devolve true ou o motivo).
- `programadora`: roda as provas novas no código VELHO (têm que falhar). Depois roda antigas + novas no NOVO (`testarApp(html, provas)` → ponte → `mac/testar-html.js` v2, cada prova num navegador limpo, até 20 em 60 s). Falhou → conserto (máx. 2). Passou → `guardarProvas_` (aba `provas_apps`).
- Selo: "Passou nas N prova(s): nomes".

## Exemplo
```
[{"nome":"12x fecha no centavo","passos":[{"preencher":"#valor","valor":"1000"},{"escolher":"#vezes","valor":"12"}],
  "conferir":[{"js":"const t=[...document.querySelectorAll('#pTab td')].map(e=>e.textContent).join(' '); return /83,37/.test(t) || 'tabela sem a 1ª de 83,37'"}]}]
```

## Erro comum
- Prova que só confere se a página abriu.
- Seletor inventado (o id não existe): leia o código antes de escrever a prova.

## Como conferir
- Os passos mostram "falharam no código antigo (pegam o defeito)" e depois "passou nas N prova(s)".
