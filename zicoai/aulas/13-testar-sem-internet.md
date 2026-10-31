# Aula 13: testar sem internet antes de publicar (30/10/2026 em diante)

## Por que
Cada publicação mexe na ZicoAI que o Thiago usa na loja. Testar direto em produção é testar no cliente.

## Como é feito
- `zicoai/cerebro/testes/harness.js` roda o `Codigo.gs` no Node, dentro de uma caixa (`vm`), com versões **de mentira** do Google: `SpreadsheetApp` (planilha em memória), `UrlFetchApp` (cada teste decide o que a "API" responde), `PropertiesService`, `CacheService`, `LockService`, `ScriptApp` (gatilhos), Drive, Gmail, Agenda.
- Cada arquivo `t1.js` … `t24.js` testa uma parte e imprime `PASS`/`FAIL`. Exemplo real (t24.js):
  ```js
  let chamadas = []; let revisor = 'OK'; let rascunho = 'Rascunho: o iPhone 13 tem tela de 6,1 polegadas e chip A15, bateria boa pra um dia inteiro de uso normal.';
  H.setFetch((u, o) => {
    if (typeof (o || {}).payload !== 'string') return json({});
    const b = JSON.parse(o.payload);
    if (!b.messages) return json({});
    const ehRev = /Você é o REVISOR da ZicoAI/.test(b.messages[0].content);
    chamadas.push({ u, rev: ehRev, effort: b.reasoning_effort, modelo: b.model });
    return resp(ehRev ? revisor : rascunho);
  });
  const chat = (txt, extra) => H.post(Object.assign({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: txt }] }, extra || {}));

  chamadas = []; revisor = 'OK';
  r = chat('me fala do iphone 13', { capricho: true });
  ok(chamadas.length === 2 && chamadas[1].rev, 'capricho chama um revisor depois do rascunho');
  ok(/^Rascunho:/.test(r.resposta) && !/revisão/.test(r.cerebro), 'revisor aprovou → entrega o rascunho');
  ```
  Repare: o rascunho de mentira tem mais de 40 letras de propósito. Com menos, `revisarResposta` nem chama o revisor, e o teste passaria sem testar nada. **Teste também tem que ser conferido.**
- Rodar tudo:
  ```bash
  cd zicoai/cerebro/testes && for f in t*.js; do node $f; done
  ```
- Sintaxe do arquivo inteiro antes de tudo:
  ```bash
  node -e "new Function(require('fs').readFileSync('Codigo.gs','utf8'))"
  ```
- App: Playwright abre o `index.html` num navegador sem tela, clica nos botões e confere que não aparece erro no console.
- A ZicoAI também consegue rodar os testes no PC (`pc_testar`, precisa de Git e Node lá).

## O que um bom teste tem
1. O caso normal **e** os casos de erro (API fora do ar, 429, resposta sem JSON, dado de cliente).
2. A **trava de segurança** testada (aba proibida, CPF barrado, nunca apagar).
3. Nada de dado real do Thiago nos testes.
4. Relógio fixo (aula 19).

## Lições
1. Teste antes, publique depois. Nunca o contrário.
2. Bug achado vira teste novo.
3. Rode **todos** os testes, não só o da mudança: uma mudança pode quebrar outra parte.
4. "Funciona" só depois de testar; se não deu pra testar algo (ex.: API real), diga isso.
