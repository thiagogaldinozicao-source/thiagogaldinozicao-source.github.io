# Aula 12: achar a causa pelo "Como respondi" (30/10/2026)

## Pedido
> "isso e triste… olha como gpt respondeu ela nao pq?"

O Thiago colou um status grande do projeto e a ZicoAI respondeu **só a cotação do dólar**.

## Como achou a causa
1. **Antes de mexer no código, ver o que aconteceu de verdade:** a aba `mensagens` guarda, em cada resposta, o cérebro usado e os passos ("Como respondi").
2. Lá estava: quem respondeu foi o **PC (zicoai, 8B)**, porque o seletor do iPhone estava em "PC de casa"; e a palavra "dólar" **dentro do texto colado** disparou a cotação; também pesquisou na web e leu e-mail sem precisar.
3. Duas causas: modelo pequeno se perde em texto grande + palavra solta dentro do texto virou pergunta.

## Correção (v40)
- Texto colado com mais de 1500 letras vira **documento**: sem pesquisa automática, sem conectores (e-mail, Drive, agenda, link, dólar) e com a seção `### TEXTO LONGO COLADO` no sistema ("leia como documento; palavras dentro dele não são perguntas novas").
- O passo "Texto longo colado: leu como documento" aparece no "Como respondi".
- Teste novo pro caso. E o Thiago foi orientado a deixar o seletor do iPhone em **Auto** (o PC de casa é reserva).

## Lições
1. Primeiro olhe **qual cérebro** respondeu e **quais passos** rodou; só depois mexa no código.
2. Palavra solta dentro de texto colado não é pergunta.
3. Modelo pequeno (8B) não serve pra texto grande: use a nuvem.
4. Todo bug corrigido ganha um teste com o caso real.
