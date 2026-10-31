# B15: Conta de parcelas com taxa da maquininha (centavos que fecham)

**Regra:** Taxa incide sobre o total cobrado, então `total = valor_à_vista / (1 - taxa)` (dividir, não somar). Arredonde a PARCELA no centavo e faça `total = parcela × vezes`, pra "Nx de R$ P" sempre fechar. Tabela, WhatsApp e imagem usam UMA função só (`simular`).
**Palavras-chave:** parcelas, taxa da maquininha, parcela no cartão, simulador, 12x, 18x, arredondar centavos, total não fecha, copiar pro whatsapp, vírgula no valor, valor à vista, quanto cobrar, empréstimo no cartão
**Projeto(s):** maquininha, emprestimo, Calculadora-do-zicao

## Exemplo real
O Thiago digita quanto quer receber e o app mostra a parcela de 1x a 18x e o texto pronto pro WhatsApp. Teve bug de a parcela vezes a quantidade não bater com o total, e de o campo não aceitar vírgula. Os valores de taxas e margens de cada loja ficam só em `maquinas`/`FATORES` nos `index.html`; esta aula não repete os números.

## Como foi feito
Fórmula do README da maquininha: `total = valor_à_vista / (1 - taxa)`. Exemplo do README: R$ 1.000 no 1x do PagBank cobra R$ 1.052,52.
Função única (maquininha, copiada):
```js
function simular(valor) {
  return taxas.map(([parc, taxa]) => {
    const bruto = valor / (1 - taxa / 100);
    const parcela = Math.ceil((bruto / parc) * 100 - 1e-9) / 100;
    const total = Math.round(parcela * parc * 100) / 100;
    return { parc, taxa, total, parcela, juros: total - valor };
  });
}
```
O `-1e-9` evita erro de float (5000.0000001 virar 5001). No emprestimo a parcela é `Math.round(... * 100) / 100` e `total = parcela * n`, também numa só `simular()`.
Campo de valor no padrão BR (emprestimo, copiado):
```js
txt = String(txt).replace(/[^0-9.,]/g, '');
if (txt.indexOf(',') >= 0) txt = txt.replace(/\./g, '').replace(',', '.');
else if (/^\d{1,3}(\.\d{3})+$/.test(txt)) txt = txt.replace(/\./g, '');
```
`<input type="text" inputmode="decimal">` (não `type="number"`). Texto do WhatsApp em bloco monoespaçado, com `padStart` pras colunas alinharem. Copiar: `navigator.clipboard`, e se falhar uma `<textarea>` + `execCommand('copy')`, com aviso de erro.
Calculadora: `parcCalc` trabalha em centavos; sem repassar, a sobra vai na 1ª parcela.

## Erros que já aconteceram
- 2586225 (maquininha): parcela "total/n" não fechava. Passou a arredondar pra cima e total = parcela × vezes.
- 1deddda (emprestimo) e 3b09a79 (calculadora): mesmo erro de parcela que não fechava com o total.
- 839795f: campo `type="number"` não aceitava vírgula; "2.000" era lido como 2. Criou `parseBR` (ponto + 3 dígitos = milhar).
- bfd15c0 / 839795f: a conta estava repetida em 3 lugares; unificada em `simular`.
- 4295a40: copiar falhava calado em alguns navegadores; ganhou fallback e aviso.
- 2586225: letra no campo; passou a borda vermelha e valor 0.

## Lições
1. Dinheiro: arredonde na parcela, nunca só no total.
2. Uma função de conta; telas e textos só formatam.
3. Campo de valor: texto + vírgula, nunca `type="number"`.
4. Não coloque taxa/margem da loja em aula, README ou chat; fica só no código do app.

Fontes: maquininha/README.md e index.html; emprestimo/index.html; Calculadora-do-zicao/index.html; commits 2586225, 839795f, 1deddda, bfd15c0, 3bd30e9, 4295a40, 104dba4, 3b09a79.
