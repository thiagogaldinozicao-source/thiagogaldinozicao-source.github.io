# A06: orquestrar várias IAs (o maestro)

**Regra:** Cada IA faz o que faz melhor; o maestro divide o trabalho, escreve o pedido certo pra cada uma, CONFERE tudo que volta e junta. Quem escreve não revisa o próprio trabalho. Trabalho braçal → modelo barato; decisão e conferência → modelo forte.
**Palavras-chave:** orquestrar, maestro, várias ias, gemini, gpt, groq, claude, prompt, pedir pra outra ia, dividir, agentes, ajudantes, revisar, conferir, economizar

## Quem faz o quê (como foi usado nos projetos)
| Quem | Bom pra | Cuidado |
|---|---|---|
| **Claude / Claude Code** | construir e consertar (apps, a própria ZicoAI), tarefas grandes de várias etapas | é quem orquestra |
| **Gemini** (app ou API) | gerar material em volume (fichas, conversas de exemplo, FAQ), ler foto, texto grande | inventa números e promessas: conferir sempre (D03) |
| **Groq gpt-oss** | código e conta rápidos, grátis | limite por minuto apertado (D07) |
| **Modelo local (PC)** | dado privado de cliente, reserva sem limite | fraco em texto grande e tarefa longa (D12) |
| **Ajudantes (agentes)** | ler muitos arquivos em paralelo | entregam rascunho: o maestro confere |

## Como escrever o pedido pra outra IA
Sempre 2 blocos:
1. **Contexto** (cola primeiro): quem é, o que já existe, o que falta, o estilo.
2. **Tarefa**, uma por bloco: o que fazer, quantos, formato de saída, o que NÃO fazer.

Exemplo real (pedido mandado pro Gemini pra montar a base):
```
Crie 8 conversas completas de WhatsApp entre cliente e a Zicão Store, cada uma com 4 a 6 trocas de mensagem: cliente pedindo preço e negociando, cliente com usado na troca, cliente reclamando de defeito no pós-venda, cliente querendo TV Box, cliente indeciso entre 2 iPhones, cliente que some e volta. Use [PREÇO], [MODELO], [GARANTIA] onde tiver valor. Estilo informal mineiro, acentuação correta, máximo 2 emojis por mensagem.
```
Repare: quantidade exata, casos listados, marcadores no lugar de número, estilo e limite.

## Como o Claude orquestrou o curso ABC (31/10/2026)
1. Levantou as fontes (repositórios, memória, conversa do projeto).
2. Escreveu **um arquivo de formato obrigatório** (FORMATO.md) com a estrutura da aula e regras duras (só fatos das fontes, nada de segredo).
3. Mandou **5 ajudantes no modelo mais barato** (Sonnet), um por grupo de repositórios, ao mesmo tempo.
4. Enquanto isso escreveu ele mesmo a parte que exige mais julgamento (este módulo A).
5. **Conferiu** os rascunhos e mandou **um revisor separado** comparar tudo com o código (na rodada anterior, o revisor achou 8 erros).
6. Publicou e ligou as aulas no cérebro da ZicoAI.

## Conferir com código, não com a palavra do ajudante
Erro que já aconteceu: os ajudantes gravaram as aulas na planilha e disseram que estava tudo "conferido". Mas eles tinham conferido lendo e digitando à mão, então não dava pra confiar.
Correção: o maestro lê a planilha inteira de volta para um arquivo e compara, com um script, célula por célula contra o arquivo de origem.
Exemplo real (31/10/2026): nas 35 aulas dos projetos ZOMBIES e Zicão Gestão, o script achou **4 campos "Onde" incompletos** que a leitura a olho tinha deixado passar. Eles foram corrigidos e a segunda conferência deu zero diferenças.

## O mesmo dentro da ZicoAI
- Roteador: pergunta fácil → cérebro rápido; difícil → modo capricho (D18).
- `dividir_em_agentes`: o agente chefe divide e junta (D09).
- Revisor de outro cérebro no capricho: quem escreve não revisa (D18).
- Placar: compara os cérebros com a mesma prova (D16).

## Lições
1. Divida pelo que cada um faz melhor, não por costume.
2. Pedido bom = contexto + tarefa + formato + o que não fazer.
3. Tudo que volta de outra IA é rascunho até conferir.
4. Barato pra volume, forte pra decisão e conferência.
5. "Conferido" só vale quando um código comparou com a fonte; a palavra do ajudante não basta.
