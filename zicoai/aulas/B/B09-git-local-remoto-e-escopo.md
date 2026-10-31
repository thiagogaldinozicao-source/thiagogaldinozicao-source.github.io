# B09: merge no GitHub não é atualizar a pasta do PC

**Regra:** GitHub (remoto) e a pasta do PC (local) são duas cópias. Merge feito no site não muda a pasta do PC; push feito do PC não muda o que outra pessoa baixou. Relate cada passo separado (commit, push, merge, pull) e, se der conflito ou trava, pare e mostre em vez de forçar.
**Palavras-chave:** git, github, merge, pull, push, commit, branch, pr, pull request, conflito, sincronizar, atualizar, pasta, local, remoto, lock, forçar

## Como fazer
1. **Antes:** veja em que branch está e se tem mudança não salva na pasta (`git status`).
2. **Mexa só nos arquivos do pedido.** Commit com mensagem clara do que mudou.
3. **Envie e confira no GitHub** que o commit chegou (push ≠ merge).
4. **Merge pelo PR** só com OK do dono. Depois, pra pasta do PC ficar igual: `git pull`.
5. **Deu conflito, "históricos diferentes" ou arquivo travado (lock)?** Pare, mostre a mensagem exata e o que está em jogo. Nunca `--force` nem apagar lock sem o dono mandar.
6. **No relatório:** "commit feito", "push feito", "merge feito", "pasta do PC atualizada": cada um só se aconteceu.

## Exemplo real
O Thiago pediu: "Se der conflito no merge, para e me mostra". Numa vez o merge no GitHub deu certo mas o pull no PC travou (históricos sem ancestral comum); a resposta certa foi dizer que o GitHub estava atualizado e a pasta do PC ainda não. Na ZicoAI, o GPT fez o PR #1 (app novo) sem merge, o Claude revisou e o Thiago fez o merge.

## Erros que já aconteceram
- Achar que o merge no site atualizou o PC. Correção: relatar separado e rodar o pull.

## Lições
1. Remoto e local são cópias diferentes.
2. Relate commit, push, merge e pull separados.
3. Conflito ou trava: pare e mostre.
4. Merge só com OK do dono.
