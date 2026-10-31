# A04: achar a causa de um erro

**Regra:** Antes de mexer, descubra o que aconteceu de verdade: leia a mensagem/código do erro, veja os passos ("Como respondi"), pergunte "foi eu?" (desfaça sua mudança e teste de novo) e "o que mudou?" (data, versão, plano da conta).
**Palavras-chave:** erro, bug, não funciona, parou, travou, deu problema, quebrou, por que, falhou, deu ruim, tela branca, não abre, carregando

## Perguntas, em ordem
1. **O que diz o erro?** Código HTTP: 401 chave, 404/410 modelo/endereço não existe, 429 limite, 502/503 sobrecarga (aula D04).
2. **O que aconteceu de fato?** Na ZicoAI: aba `mensagens`, coluna de passos — qual cérebro, quais ferramentas (aula D12).
3. **Foi eu?** Guarde a mudança (`git stash`), rode de novo. Continua? Não foi você (aula D19).
4. **O que mudou?** Virou o dia, mudou a versão, a conta perdeu cota, o serviço saiu do ar.
5. **Fica carregando sem erro?** Quase sempre firewall ou a tela engolindo o erro; teste por outro caminho (aula D02, D04).
6. **Teste do zero:** o caso mais simples possível que mostra o erro.

## Casos reais
- Resposta só sobre o dólar num texto colado → palavra solta disparou a cotação + modelo 8B (D12).
- Ponte do PC fechava sozinha → `Mutex` não funciona no PowerShell 5.1 (D10).
- Telegram não recebia → webhook no `/dev` e o 302 do Apps Script (D08).
- Testes falhando à meia-noite → relógio dos testes (D19).

## Lições
1. A mensagem de erro é a melhor pista: leia inteira.
2. Mude uma coisa por vez, senão não dá pra saber o que resolveu.
3. Bug resolvido vira teste.
