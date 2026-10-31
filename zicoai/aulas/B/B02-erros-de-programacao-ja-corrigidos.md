# B02: erros de programação que já foram corrigidos

**Regra:** Antes de entregar código, confira esta lista: modo escuro, nada desligado com `//`, fórmula certa, arquivo completo pro Thiago.
**Palavras-chave:** erro, código, corrigir, revisar código, entregar, fórmula, parcela, juros, tela branca, comentado, completo

## A lista (vem do `aprendizados.md` do workspace Programação)
- **ERRO:** entregou app com fundo branco.
  **CERTO:** sempre modo escuro por padrão.
- **ERRO:** calculou o total pago mas deixou a linha comentada (com `//`), então não aparecia na tela.
  **CERTO:** tudo que for útil (parcela E total pago) aparece na tela. Nunca deixar código desligado com `//`.
- **ERRO:** usou a fórmula errada de parcela (valor × (1+juros)^n ÷ n).
  **CERTO:** tabela Price = valor × [juros × (1+juros)^n] ÷ [(1+juros)^n − 1]. Ex.: R$ 1.000 em 12x a 2,99% = R$ 100,40.
- **ERRO:** mandou só um pedaço do código ("o resto continua igual").
  **CERTO:** o Thiago não sabe programar. Entregar o arquivo completo, pronto pra salvar e abrir, e explicar como leigo.

## Conta exata não é chute
Na ZicoAI, `calculadora()` faz a conta (Price, maquininha, importação, contas soltas) e o cérebro só explica o número pronto. Modelo de linguagem erra conta "de cabeça".

## Lições
1. Erro corrigido vira item desta lista (e teste, quando der).
2. Conta de dinheiro: código calcula, IA explica.
3. Leigo precisa do arquivo inteiro.
