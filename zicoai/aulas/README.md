# Aulas da ZicoAI

Cada trabalho que o Claude faz na ZicoAI vira uma **aula** aqui: o pedido do Thiago, como pensou, os comandos de verdade, os erros e como corrigiu, e as lições. A ideia é a ZicoAI (e qualquer cérebro que entrar no lugar) aprender **fazendo igual**, não só ler o resultado.

A versão curta de cada aula também vai pra aba `trajetorias` da planilha "ZicoAI Memória". É dali que o agente puxa as 2 tarefas mais parecidas antes de começar uma nova.

## Como ler uma aula
1. **Pedido**: o que o Thiago pediu, com as palavras dele.
2. **Entender**: o que ele quer de verdade (o pedido nem sempre diz tudo).
3. **Plano**: passos curtos antes de mexer.
4. **Execução**: o que foi feito, com os comandos e trechos de código reais.
5. **Erros e correções**: o que deu errado e como achou a causa. Essa é a parte que mais ensina.
6. **Teste**: como provou que funciona.
7. **Lições**: regras pra repetir da próxima vez.

## O método (vale pra toda aula)
1. Entenda o pedido. 2. Faça um plano curto. 3. **Leia antes de mexer** (código, planilha, página). 4. Mude pouco por vez. 5. **Teste cada mudança**. 6. Só diga que funciona depois de testar; se não deu pra testar, diga isso. 7. Termine dizendo o que ficou pronto, o que falta e o que precisa do Thiago, em poucas linhas.

## Curso ABC
| Módulo | Assunto | Onde |
|---|---|---|
| **A** | Fundamentos: método, honestidade, pesquisa, achar erro, falar com o Thiago, orquestrar IAs, ferramentas, modelo, segurança | aqui (A/) |
| **B** | Programação: padrão dos apps, PWA, Supabase, câmera, Capacitor, Unreal… | aqui (B/) |
| **C** | Loja: preço, importação, impostos, maquininha, listas, comparativo, garantia, catálogo | **só na planilha (privado)** |
| **D** | A própria ZicoAI: como ela foi construída | aqui (D/) |
| **E** | Pessoal: projetos, obra, NAS, gostos | **só na planilha (privado)** |

Cada aula começa pela **Regra** (o que fazer, em 1–3 linhas) e pelas **Palavras-chave**. O cérebro procura na aba `aulas` da planilha as 2 aulas que mais combinam com o pedido e coloca a Regra no sistema (`contextoAulas`).

### A — Fundamentos
| ID | Aula | Regra |
|---|---|---|
| A01 | [o método de trabalho](A/A01-metodo.md) | Entenda o pedido → plano curto → LEIA antes de mexer → mude pouco por vez → TESTE cada mudança → só diga que f… |
| A02 | [honestidade](A/A02-honestidade.md) | Nunca invente preço, garantia, endereço, horário, especificação, nome de função ou modelo. Não sabe → diga e p… |
| A03 | [pesquisar com fontes](A/A03-pesquisar.md) | Assunto que muda (preço, cotação, modelo de IA, lançamento, regra, quem ocupa um cargo) → pesquise antes de re… |
| A04 | [achar a causa de um erro](A/A04-achar-a-causa.md) | Antes de mexer, descubra o que aconteceu de verdade: leia a mensagem/código do erro, veja os passos ("Como res… |
| A05 | [como falar com o Thiago](A/A05-falar-com-o-thiago.md) | Curto e direto, começando pela resposta. Sem preâmbulo, sem resumo no fim, sem oferecer extra. Texto pra clien… |
| A06 | [orquestrar várias IAs](A/A06-orquestrar-varias-ias.md) | Cada IA faz o que faz melhor; o maestro divide o trabalho, escreve o pedido certo pra cada uma, CONFERE tudo q… |
| A07 | [ferramentas de programar](A/A07-ferramentas-de-programar.md) | Pra construir e consertar: Claude Code (nuvem ou PC). Pra editar e testar no PC: VS Code + Live Server. Extens… |
| A08 | [escolher o modelo](A/A08-escolher-o-modelo.md) | Use o modelo mais barato que resolve. Fácil (texto curto, conta, mensagem pra cliente) → rápido/barato. Médio … |
| A09 | [segurança e privacidade](A/A09-seguranca-e-privacidade.md) | Segredo (chave, token, PIN, link do PC) nunca em código público. Dado de cliente (CPF, telefone) não vai pra n… |

### B — Programação
| ID | Aula | Regra |
|---|---|---|
| B01 | [o padrão dos apps do Thiago](B/B01-app-em-um-arquivo.md) | App em um arquivo `.html` só (HTML + CSS + JavaScript, sem framework), mobile-first, modo escuro por padrão (p… |
| B02 | [erros de programação que já foram corrigidos](B/B02-erros-de-programacao-ja-corrigidos.md) | Antes de entregar código, confira esta lista: modo escuro, nada desligado com `//`, fórmula certa, arquivo com… |

### D — A própria ZicoAI
| ID | Aula | Regra |
|---|---|---|
| D01 | [escolher o caminho da IA própria](D/D01-escolher-o-caminho.md) | Treinar do zero não dá; o caminho é modelo aberto + memória + ferramentas + método. Local pra dado privado; nu… |
| D02 | [montar a IA local no PC](D/D02-ia-local-no-pc.md) | IA local: Ollama + modelos que cabem na placa (8–9B rápido, 35B lento); instalador é com o Thiago; link carreg… |
| D03 | [base de conhecimento sem inventar nada](D/D03-base-sem-inventar.md) | Material de outra IA é rascunho: confira cada número; valor que muda vira marcador [PREÇO]; promessa da loja s… |
| D04 | [ligar os cérebros grátis e testar cada um de verdade](D/D04-testar-cada-api.md) | Só conta como funcionando o cérebro que respondeu de verdade. Leia o código do erro: 401 chave, 404/410 modelo… |
| D05 | [ZicoAI na nuvem com memória única no celular e no PC](D/D05-memoria-na-nuvem.md) | Memória que o dono vê e corrige (planilha + Apps Script); segredos nas Propriedades; nuvem primeiro, PC de res… |
| D06 | [aprender sozinha sem aprender lixo](D/D06-aprender-sem-lixo.md) | O que a IA disse não é fato; só vira memória o que o Thiago disse (números inclusive). Toda mudança automática… |
| D07 | [usar API grátis sem estourar o limite](D/D07-controle-de-cota.md) | Confira o limite antes de chamar; minuto = esperar, dia = próximo cérebro, sobrecarga = sair 90 s; mostre o mo… |
| D08 | [bot do Telegram e o atalho no Cloudflare](D/D08-telegram-e-worker.md) | Webhook no /exec (nunca /dev); serviço que não aceita 302 → atalho no meio (Worker); diagnóstico que mostra o … |
| D09 | [agentes que trabalham sozinhos em segundo plano](D/D09-agentes.md) | Agente = laço de ferramentas em JSON com travas no código; desenhe pelos limites (6 min, cota/min): salvar pro… |
| D10 | [a ponte pra ZicoAI mexer no PC](D/D10-ponte-do-pc.md) | Mexer no PC: só pastas liberadas, nunca apagar nem sobrescrever; o PC busca os pedidos (sem porta aberta); ant… |
| D11 | [publicar uma versão nova do cérebro](D/D11-publicar-o-cerebro.md) | Publicar: testes → commit → colar → conferir sha256 → salvar → Nova versão na mesma implantação → testar no ap… |
| D12 | [achar a causa pelo "Como respondi"](D/D12-ler-o-como-respondi.md) | Antes de mexer no código, veja qual cérebro respondeu e quais passos rodou; palavra solta em texto colado não … |
| D13 | [testar sem internet antes de publicar](D/D13-testar-sem-internet.md) | Teste antes de publicar: simulador do Google no Node, caso normal e de erro, rode todos; teste também precisa … |
| D14 | [pesquisar igual o Claude, lendo várias fontes](D/D14-pesquisa-profunda.md) | Assunto que muda: várias buscas, leia as páginas, confira a data, fonte mais nova ganha, cite as fontes. |
| D15 | [mostrar o trabalho ao vivo e aprender por exemplo](D/D15-resumo-ao-vivo.md) | Mostre o trabalho enquanto faz (passos ao vivo); método + relatório no fim; aprenda por exemplos resolvidos (t… |
| D16 | [treino, placar e estudo noturno](D/D16-treino-placar-estudo.md) | Pra subir de nível: medir (prova/placar com mesmo contexto), filtrar material (sintaxe, revisor, Thiago) e só … |
| D17 | [imagem melhor sem trocar o gerador](D/D17-imagem-prompt-detalhado.md) | Pedido de imagem curto vira prompt detalhado em inglês; pedido longo do Thiago passa igual; mostre o prompt us… |
| D18 | [modo capricho](D/D18-modo-capricho.md) | Pergunta difícil: cérebro forte, mais raciocínio e OUTRO cérebro revisa; o revisor nunca pode piorar a respost… |
| D19 | [teste que quebra à meia-noite](D/D19-relogio-dos-testes.md) | Teste falhou? Primeiro "foi eu?" (guarda a mudança e roda de novo); teste não pode depender do dia de hoje. |
