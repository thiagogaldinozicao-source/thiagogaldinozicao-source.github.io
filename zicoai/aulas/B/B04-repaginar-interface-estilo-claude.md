# B04: repaginar a interface sem quebrar o app

**Regra:** Leia a interface atual antes de mudar o visual e reaproveite seus controles, funções e dados salvos. Preserve o contrato com o cérebro e teste o comportamento no celular e no PC com respostas simuladas. Só diga que uma função foi testada quando houver resultado registrado, e entregue as mudanças em um Pull Request sem fazer merge quando esse for o pedido.
**Palavras-chave:** repaginar, interface, visual, Claude, preto, dourado, lateral, gaveta, projetos, conversas, painel, progresso, saídas, opções, celular, computador, capricho, memória

## Como foi feito

1. **Li o pedido e o código existente antes de editar.** Usei Git para obter o repositório e li o HTML, o CSS, o JavaScript e o service worker. Conferi os identificadores dos controles, o fluxo de envio e o armazenamento local para mudar a apresentação sem refazer recursos que já funcionavam. Nesta tarefa, a leitura da aula B03 aconteceu depois da implementação, ao preparar esta aula; ela serviu como referência de escrita, não como instrução usada antes do redesign.

2. **Criei a branch `redesign-claude`.** A implementação ficou em `zicoai/index.html`, com a versão do cache atualizada em `zicoai/sw.js`. Não acrescentei framework nem biblioteca. Preservei o manifesto e as pastas do cérebro, treino e PC. A autorização posterior para ensinar permitiu criar apenas esta aula dentro da pasta de aulas; o índice e o README das aulas ficaram sem alteração.

3. **Reorganizei os controles existentes.** Mantive os botões de projetos, apps, tarefas, memória, treino, dispositivos e configuração. `desenhaLista()` passou a filtrar os títulos e separar fixados, projetos e conversas recentes. Cada projeto mostra até quatro conversas e oferece “Ver todos”. O botão de título usa o menu da conversa que já existia, em vez de criar ações diferentes para renomear, fixar ou excluir.

4. **Adaptei a estrutura para telas diferentes.** Preservei as cores do `:root`, incluindo `--ouro` e `--ouro2`. A lateral fica fixa a partir de `1000px`; abaixo disso vira gaveta. O painel direito fica fixo a partir de `1200px`; nas telas menores abre como folha de baixo. Mantive o espaço seguro do iPhone com `env(safe-area-inset-bottom)` e conferi que a página não rola horizontalmente.

5. **Montei o painel com evidências da conversa.** `mostraProgresso()` usa `listaResumo()` para exibir os passos recebidos pela ação `aoVivo`. Enquanto esses passos não chegam, o painel informa que está aguardando, sem apresentar uma etapa simulada como confirmação. `desenhaPainel()` percorre as mensagens, usa `lerPasso()` na classificação e reúne cérebros, web, aulas, memória, conectores, anexos, PC e capricho. Também reúne saídas HTML, imagens e links de apps, reaproveitando Testar e Publicar. Isso mostra os registros recebidos; não comprova por si só que uma integração externa executou tudo corretamente.

6. **Acrescentei opções sem mudar o envio ao cérebro.** `normalizaOpcoes()` valida a estrutura recebida. `cartaoOpcoes()` monta os botões com texto seguro, destaca a primeira opção e guarda a seleção em `opcaoEscolhida`. `rotuloLimpo()` retira o sufixo de recomendação antes do envio. O clique preenche `txt` e chama `envia()`, assim como o envio normal. “Outra…” apenas foca a caixa de texto.

7. **Preservei os dados antigos.** As opções entram no objeto da mensagem e são salvas por `guarda()`, usando as chaves locais que já existiam. Ao reabrir, `abrir()` aproveita os metadados locais quando a mensagem do servidor tem o mesmo conteúdo na mesma posição. Uma conversa antiga recebida apenas do servidor, sem opções estruturadas nem cópia local delas, continua mostrando o texto normal. Essa seleção fica neste aparelho; não foi criada sincronização de opções entre dispositivos.

8. **Testei com Playwright e Chrome usando um servidor local com API simulada.** Os testes cobriram projetos, fixada, pesquisa por título, “Ver todos”, opções, escolha enviada sem o sufixo, bloqueio da escolha, recarga, conversa antiga, ferramentas, modelo, capricho, progresso, saídas, prévia e publicação simulada. Também testei larguras dos dois lados dos pontos de mudança de layout, conferi o console e salvei capturas. A função `api()` foi comparada com a base e permaneceu igual. Extraí o script para validar com `node --check` e executei `git diff --check`.

9. **Corrigi o próprio ambiente de teste antes de aceitar o resultado.** O carregamento dos dados simulados também estava sendo executado nos iframes de prévia, que têm acesso restrito ao armazenamento. A configuração de bloqueio de service worker no Playwright também provocava erros nesses iframes. Limitei a preparação dos dados à janela principal e servi um service worker neutro somente no servidor de teste. Depois disso, os testes passaram sem erros de console. O service worker do app manteve sua lógica, com o cache `zicoai-v22`.

10. **Fiz commit, enviei a branch e abri o Pull Request.** Registrei as mudanças, os testes e os limites: não testei o Apps Script real, publicação real de apps, captura real de microfone ou câmera, conectores reais nem instalação e atualização no iPhone físico. O upload das capturas foi inicialmente bloqueado pela extensão do Chrome. Depois que Thiago habilitou o acesso a arquivos locais, anexei os prints e confirmei que apareciam na descrição do PR. Não fiz merge nem publiquei na main.

11. **Para escrever esta aula, reli o código final e o registro de validação.** Li a B03 como referência e segui a estrutura específica pedida para a B04. Copiei os exemplos abaixo do arquivo final para ensinar a implementação real, sem transformar uma intenção em código supostamente executado.

## Exemplo real

O caso foi a repaginação da ZicoAI em um único HTML, mantendo a identidade preta e dourada e o Google Apps Script existente. Os trechos abaixo foram copiados de `zicoai/index.html`.

Este trecho valida o cartão antes de renderizar. Se a estrutura não for válida, a mensagem pode continuar aparecendo como texto, sem cartão:

```javascript
function rotuloLimpo(rotulo){ return String(rotulo || '').replace(/\s*\(recomendado\)\s*$/i, '').trim(); }
function normalizaOpcoes(valor){
  if(!valor || typeof valor.pergunta !== 'string' || !Array.isArray(valor.opcoes) || valor.opcoes.length < 2 || valor.opcoes.length > 4) return null;
  if(!valor.opcoes.every(o => o && typeof o.rotulo === 'string' && rotuloLimpo(o.rotulo) && typeof o.descricao === 'string')) return null;
  return { pergunta: valor.pergunta, opcoes: valor.opcoes.map(o => ({rotulo:o.rotulo, descricao:o.descricao})) };
}
```

Dentro de `cartaoOpcoes()`, o clique usa o mesmo envio da caixa de mensagem. Antes de enviar, registra qual opção foi escolhida e evita uma segunda escolha quando já existe seleção ou envio em andamento:

```javascript
    b.onclick = () => {
      if(controle || Number.isInteger(m.opcaoEscolhida)) return;
      // Usa o mesmo envio, incluindo anexos, modo e modelo selecionados pelo usuário.
      m.opcaoEscolhida = i; guarda(); $('txt').value = rotuloLimpo(o.rotulo); envia();
    };
```

Dentro de `abrir()`, a combinação com os dados locais já existentes preserva metadados da mensagem quando conteúdo e posição coincidem. Isso não recupera opções em outro aparelho onde elas nunca foram salvas:

```javascript
    // mantém fotos, passos, opções e saídas que só existem neste aparelho
    const locais = mensagens;
    mensagens = j.mensagens.map((m, i) => Object.assign({}, locais[i] && locais[i].content === m.content ? locais[i] : {}, m));
    LS.set('msgs_' + id, mensagens);
```

## Erros que já aconteceram

- **A edição automática não encontrou um trecho do HTML.** Causa: a busca esperava quebras de linha simples, mas a leitura tinha quebras de linha do Windows. Correção: normalizei as quebras na leitura do script de edição antes das substituições e depois validei a sintaxe do resultado. A tentativa que falhou parou antes de gravar o HTML.
- **O primeiro teste mostrou erros de armazenamento e service worker dentro das prévias.** Causa: a preparação dos dados de teste também rodava nos iframes isolados, e o bloqueio de service worker do Playwright interferia neles. Correção: preparei os dados só na janela principal e neutralizei o service worker apenas no servidor de teste. Reexecutei os testes e conferi o console vazio. Não removi o isolamento das prévias para esconder o erro.
- **Chamadas ao conector do GitHub foram recusadas por campos incorretos.** Causa: usei nomes de parâmetros que não correspondiam ao esquema das ações de criação e atualização de PR. Correção: ajustei os parâmetros conforme a validação retornada e confirmei o sucesso na resposta do conector. Ao repetir, leia o esquema da ferramenta antes de montar a chamada.
- **O envio dos prints ao GitHub foi bloqueado.** Causa: a extensão do Chrome não tinha acesso a URLs de arquivo. Correção: informei a limitação; Thiago habilitou a opção, o upload foi repetido e as imagens foram confirmadas na descrição do PR. Não afirmei que os prints já estavam anexados enquanto o envio estava bloqueado.

## Lições

1. Leia o código atual e preserve o contrato com o cérebro antes de mudar o visual.
2. Reaproveite o envio e os controles existentes para evitar comportamentos diferentes para a mesma ação.
3. Teste dados antigos, recarga e telas diferentes; guardar no aparelho não é sincronizar entre aparelhos.
4. Separe falha do app de falha da simulação e mantenha o isolamento das prévias.
5. Confira o esquema das ferramentas e só confirme ações depois do resultado real.
6. Registre testes, limitações e correções na aula e no PR; respeite o escopo e a decisão de não fazer merge.
