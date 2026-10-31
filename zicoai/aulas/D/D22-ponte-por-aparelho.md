# D22: uma ponte por aparelho (PC e Mac) sem um roubar o pedido do outro (31/10/2026)

**Regra:** Cada aparelho tem segredo e fila próprios no cérebro. Antes de ligar um segundo aparelho num sistema que foi feito pra um só, leia como o pedido é entregue: fila única + dois buscando = pedido indo pro lugar errado. E o chat precisa saber que o aparelho novo existe, senão ela diz "não consigo".
**Palavras-chave:** ponte, ponte do mac, ponte do pc, fila, segredo, aparelho, dispositivo, oficina, mac_testar, mac_abrir, pc_testar, rodar testes, abrir no navegador, não consigo usar o mac

## Por quê
- A ponte do PC funciona assim: o cérebro põe o pedido numa **fila**, e o PC, de tempos em tempos, **busca e esvazia a fila inteira**. Se o Mac entrasse na mesma fila com o mesmo segredo, quem buscasse primeiro levava tudo: um "print da tela do PC" ia parar no Mac. Não dá erro nenhum, só resultado errado, que é o pior tipo de bug.
- **Segredo próprio** porque assim o cérebro sabe QUEM está buscando só pelo segredo, sem confiar no nome que o aparelho diz.
- **O chat é diferente do agente.** As ferramentas (`mac_*`) ficam com o agente. O chat só sabe mandar pro agente o que a regra dele manda. Sem a regra "pedido do Mac → [[TAREFA]]", ela respondeu "não consigo usar o Mac" mesmo com tudo funcionando.

## Como funciona por baixo
- `ponteDisp(segredo)` → `'pc'` (PONTE_SEGREDO) ou `'mac'` (PONTE_SEGREDO_MAC). As chaves do cache do Mac ganham `_mac` (`ponte_fila_mac`, `ponte_visto_mac`); as do PC ficaram iguais, então a ponte do PC não precisou mudar nada.
- A ponte do Mac (`ponte-mac.js`, Node) é a mesma da do PC: busca de 20 em 20 s, só pastas do `config.json`, grava com `wx` (cria, nunca sobrescreve), resolve o caminho real (atalho não escapa da pasta), sem nenhum comando de apagar, só comandos da lista segura.

## Situações em que aparece
- "liga o Mac também", "roda os testes no Mac", "abre o app no navegador do Mac", "ela disse que não consegue usar o Mac", "o PC tá desligado, usa a oficina".

## Exemplo
- v46: fila e segredo separados + `mac_status`, `mac_testar`, `mac_abrir`, `mac_comando`. Teste t31: cada ponte pega só o pedido dela.
- v47: uma linha na regra do chat. Conferido no log do Mac: `pedido: comando testes_zicoai` às 13:06, repositório no commit novo.

## Erro comum
- Achar que "funcionou" porque ela respondeu. Ela pode ter rodado no PC ou nem ter usado ferramenta. Prova é o **log da ponte do aparelho certo**, com a hora.
- Testar a ponte rodando de dentro da pasta: o teste usava caminho relativo (`./ponte-mac.js`) e quebrou quando rodou de outro lugar. Use o caminho do próprio arquivo (`__dirname`).

## Como conferir
- `tail ~/ZicoAI/ponte-mac/ponte-log.txt`: "conectado na ZicoAI" e o pedido com a hora.
- Painel de dispositivos do app: "Oficina (Mac)" verde.
