# B09: distinguir merge remoto de sincronização local

**Regra:** Confira o estado local e remoto separadamente e altere apenas os arquivos autorizados. Merge feito no GitHub não prova que o pull local funcionou. Se houver conflito, bloqueio ou históricos incompatíveis, relate o ponto exato e preserve o trabalho existente.
**Palavras-chave:** Git, GitHub, branch, PR, merge, pull, push, conflito, histórico, local, remoto, arquivo, commit, lock, sincronizar

## Como foi feito

1. Li o histórico em que o merge remoto terminou, mas o pull local foi bloqueado por históricos sem ancestral comum. A resposta distinguiu esses resultados em vez de declarar a sincronização concluída.

2. Separei também o envio de documentos do estado dos arquivos locais. O relato registra um commit baseado no histórico remoto, enquanto a sincronização local continuou pendente.

3. Outro pedido mandava esperar diante de um lock, sem apagá-lo nem forçar a operação. Tratei isso como orientação daquele caso, sem afirmar que houve corrupção ou que o lock foi removido.

4. Nesta revisão só acrescentei aulas à branch da ZicoAI. Não voltei ao repositório privado do jogo para repetir merge, pull ou testes antigos.

5. Para repetir, confira diferenças, histórico e lista de arquivos antes de cada ação. Respeite a decisão atual do usuário sobre conflitos, merge e publicação.

## Exemplo real

Pedido literal recuperado:

> Se der conflito no merge, para e me mostra

O resultado registrado distinguiu merge remoto concluído de pull local bloqueado. Não havia base para dizer que os arquivos novos já estavam disponíveis na pasta local. Nenhum hash antigo foi usado aqui como prova de revalidação atual.

## Erros que já aconteceram

- **Bloqueio registrado:** pull impedido por históricos sem ancestral comum.
- **Tratamento registrado:** não forçar a sincronização e informar que a pasta local continuava pendente.
- **Causa raiz não demonstrada:** o histórico consultado não comprova como os dois históricos divergiram; não inventei essa explicação.

## Lições

1. Relate merge, pull, commit e push como resultados separados.
2. Confira o estado dos arquivos locais depois da sincronização.
3. Não force o histórico nem remova lock para esconder um bloqueio.
4. Envie somente os arquivos autorizados e registre pendências.

