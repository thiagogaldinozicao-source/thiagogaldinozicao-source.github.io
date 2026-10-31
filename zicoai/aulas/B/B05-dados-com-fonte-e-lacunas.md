# B05: montar tabelas sem inventar dados

**Regra:** Preencha cada campo técnico apenas com evidência identificada e deixe vazia a informação não comprovada. Diferencie valor padrão, valor carregado e hipótese. Preserve as linhas existentes e registre as lacunas e divergências em vez de resolvê-las por chute.
**Palavras-chave:** tabela, CSV, fonte, número, vazio, conferir, divergência, regra, fallback, cadastro, coluna, arquivo, modelo, animação, falta

## Como foi feito

1. Li os pedidos e resultados registrados de criação de tabelas técnicas e pesquisa de regras. O usuário exigia uma fonte por número e campos vazios quando não houvesse comprovação.

2. Separei a regra de negócio da tarefa de organizar a tabela: nesta revisão não reabri os arquivos técnicos originais e não publiquei suas tabelas privadas.

3. O histórico mostrou uma investigação em que um valor inicial de script podia ser substituído por uma tabela carregada depois. Extraí a regra de verificar a cadeia de leitura antes de tratar um valor padrão como resultado efetivo.

4. Outro caso mantinha uma associação de modelo como não confirmada, apesar de haver um nome candidato. Preservei a lição de que semelhança de nome não comprova identidade, compatibilidade nem animação.

5. Para repetir, compare o cabeçalho antes e depois, confira quantidade de colunas, preserve registros fora do escopo e associe cada alteração à evidência. Sem fonte, mantenha a lacuna explícita.

## Exemplo real

Trecho literal do pedido recuperado:

> Número só com fonte.

O mesmo pedido exigia célula vazia e registro de ausência quando faltasse confirmação. A aula ensina esse critério; não fornece números do jogo nem afirma revalidar o CSV final antigo.

## Erros que já aconteceram

- **Divergência registrada:** um valor inicial do script parecia indicar a regra efetiva, mas havia possibilidade de sobrescrita por tabela.
- **Correção na investigação registrada:** distinguir padrão e carregamento real e informar que faltava a tabela para fechar a conclusão.
- **Não confirmado:** o histórico registra tabela entregue, mas o arquivo final não foi reaberto nesta revisão; não trato esse relato como auditoria atual dos seus números.

## Lições

1. Uma célula vazia com motivo é melhor que um número inventado.
2. Verifique se o valor padrão é sobrescrito em outro lugar.
3. Nome parecido não confirma um arquivo nem sua compatibilidade.
4. Preserve registros antigos e documente o que mudou.

