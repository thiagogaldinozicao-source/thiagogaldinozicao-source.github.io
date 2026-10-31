# Aula 19: teste que quebra à meia-noite (31/10/2026)

## O que aconteceu
Rodei todos os testes às 00:02 e 7 falharam em t5, t8 e t12 ("venda anotada e somada", "resumo traz vendas de ontem", "backup copia a planilha", "revisor recebe os pares do dia"). Eu não tinha mexido nessas partes.

## Como achei a causa
1. **Será que fui eu?** Guardei minha mudança (`git stash`), rodei de novo os mesmos testes: continuaram falhando. Então não era meu código. Devolvi a mudança (`git stash pop`).
2. **O que mudou?** O relógio: tinha acabado de virar 30/10 → 31/10.
3. Olhei o `harness.js`: o `formatDate` de mentira devolvia "30/10" fixo pros formatos `dd/MM/yyyy` e `yyyyMMdd`, mas pro formato `yyyy-MM-dd` calculava a partir da data recebida, que vinha do relógio de verdade (já 31/10). Uma parte do código achava que era dia 30, outra parte, dia 31. Por isso falharam, por exemplo, o backup (esperava `backup 2026-10-30`) e a revisão do dia (usa `yyyy-MM-dd`).

## Correção
Relógio fixo nos testes, em 30/10/2026 12h:
```js
const SHIFT = new Date(2026, 9, 30, 12, 0, 0).getTime() - Date.now();
class FakeDate extends Date {
  constructor(...a) { if (a.length) super(...a); else super(Date.now() + OFFSET + SHIFT); }
  static now() { return Date.now() + OFFSET + SHIFT; }
}
```
Um teste (t21, `pc_testar`) comparava com o `Date.now()` de fora (relógio real). Troquei pra perguntar a hora pro próprio cérebro de mentira: `vm2.runInContext('Date.now()', H.ctx)`.

## Lições
1. Teste falhou? Primeiro descubra **se foi vc**: guarde sua mudança e rode de novo.
2. Teste não pode depender do dia de hoje: fixe o relógio.
3. Tudo no teste usa o **mesmo** relógio.
