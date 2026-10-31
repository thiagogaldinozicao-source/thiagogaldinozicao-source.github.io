# D28: fato do mundo vem da web, foto só pra quem enxerga, erro explicado com prova (31/10/2026)

**Regra:** Ficha técnica, lançamento e "existe ou não existe" se confere na web antes de responder: o cérebro não conhece o que saiu depois do treino dele. Foto vai só pra cérebro que enxerga, e a foto de antes é reenviada quando o Thiago fala dela. Quando perguntam "por que falhou", a explicação sai do erro que o app mostrou e dos detalhes, nunca de chute. E ela estuda sozinha: cada reclamação vira correção pesquisada + rascunho de aula.
**Palavras-chave:** comparativo, ficha técnica, especificação, iPhone novo, lançamento, existe, não existe, inventou, de onde vc tirou, foto, print, não chegou a foto, falhou, Load failed, por que falhou, estudar, aprender sozinha, 24h, estudo, erro

## Por quê
- **Ficha da web:** o Gemini e os outros cérebros grátis aprenderam com textos até uma data. iPhone 18 Pro Max e iPhone Duo saíram depois (set/out 2026). Sem pesquisar, o cérebro faz o que todo modelo faz quando não sabe: completa com o que parece certo (A18 Pro, bateria do 16 Pro Max). Ele não mente de propósito; ele não tem como saber. A web tem.
- **"Não existe" também é fato:** dizer que um modelo não existe sem pesquisar é inventar do mesmo jeito. Se o Thiago citou, existe até a pesquisa provar o contrário.
- **Base não é fonte de ficha:** a base e os aprendizados guardaram fichas erradas que ela mesma escreveu. Se a regra diz "a base é verdade", o erro vira lei e se repete. Para a loja e o Thiago a base vale; para ficha de aparelho, só fonte da web.
- **Foto:** a foto vai junto SÓ da mensagem em que foi mandada. Na mensagem seguinte ("te mandei uma foto") o cérebro não vê mais nada e responde "não chegou". E se a foto cai num cérebro que só lê texto, ele também diz que não chegou.
- **Erro com prova:** o "Load failed" aparece só no app; o cérebro nunca recebia. Sem o erro, ela refez o comparativo no lugar de explicar, e o agente inventou uma causa ("não achei os modelos na tabela").
- **Estudar sozinha:** aula ensina o jeito; quem ensina são os erros. Cada "de onde vc tirou isso?" é uma aula que já vem com o exemplo errado e o motivo.

## Como funciona por baixo
- `ehFichaTecnica(pergunta, histórico)`: aparelho (iphone, galaxy, "17 pro max", duo…) + pedido de ficha (vs, compara, bateria, chip…), ou continuação de um comparativo. Preço fica de fora (preço é da tabela). Liga a pesquisa e manda a `REGRA_FICHA` ("só número com fonte; o que a fonte não traz é 'não confirmado'"). Pesquisa falhou → ela diz que falhou, não chuta.
- Foto: `conversar` com imagem só tenta Gemini, Mistral e NVIDIA (VL); PC só com `PC_VISAO=sim`. O app guarda a última foto da conversa e reenvia com `fotoRepetida` quando a mensagem fala de foto/print/imagem.
- `erroAnterior`: o app manda o erro da mensagem anterior; o cérebro recebe junto o que ele significa ("Load failed" = conexão caiu/demorou).
- Aula "forte" (texto completo) só com palavra acima do corte ou cosseno ≥ 0,74. Cosseno de 0,6–0,7 aparecia até em aula de Unreal numa pergunta de iPhone.
- Estudo 24h: `estudar()` = uma rodada de `aprenderComErros()` (acha a próxima reclamação, pesquisa, escreve causa, regra, aula de professor e a resposta certa na aba `estudo_erros` + exemplo "erro corrigido (revisar)") ou, sem reclamação nova, `estudoNoturno` de um dos 17 temas (11 de programação). O Mac chama pela ponte a cada 30 min (`ponteEstudar`, não gasta cota de gatilho); um gatilho de 4 em 4 h é a reserva. Mínimo de 20 min entre rodadas.

## Situações em que aparece
- "compara o 17 pro max com o 18", "qual a bateria do X", "esse modelo existe?", "de onde vc tirou isso?", "te mandei um print", "porque falhou?", "ela ainda erra muito", "bota ela pra estudar".

## Exemplo (31/10)
- Pedido: "17 pro max vs 18 pro max". v50: 3 comparativos diferentes, um com 18 Pro Max de chip A18 Pro e bateria 4.685 mAh (do 16 Pro Max), nenhuma pesquisa. "iPhone duo" virou "iPhone 16 (Duo)"; depois "não existe"; depois o agente disse que existe.
- v51: o mesmo pedido liga "Ficha técnica de aparelho: vai conferir na web" e a resposta só traz número com fonte.

## Erro comum
- Achar que mais treino resolve fato novo. Treino ensina jeito (aula D25); fato novo vem da web.
- Gravar ficha pesquisada uma vez na base e confiar nela pra sempre: ficha muda (lançamento, revisão); pesquise de novo.
- Deixar o estudo sozinho escrever direto nas aulas do contexto. O que ela estuda entra como "revisar"; só vira aula depois de conferido.

## Como conferir
- Testes `t37` (ficha, foto, erro do app, aula forte, estudo pela ponte).
- No app: comparativo mostra o passo "Ficha técnica… vai conferir na web" e fontes.
- Aba `estudo_erros` enchendo com status "revisar"; `ponte-log.txt` do Mac com linhas "estudo: …".
