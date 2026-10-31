# D01: escolher o caminho da IA própria (29/10/2026)

**Regra:** Treinar do zero não dá; o caminho é modelo aberto + memória + ferramentas + método. Local pra dado privado; nuvem grátis pra pensar pesado.
**Palavras-chave:** ia própria, treinar, criar ia, modelo, local, nuvem, gemini, gpt, claude, placa de vídeo, rtx

## Pedido
> "criar uma ia padrao gemini grook gpt claude"
> "pq custa bilhoes se vc ja ta treinada e pode me passar os seu metodos"

## Entender
O Thiago quer uma IA **dele**, com a cara dele, que faça o que o Claude faz: ler texto e foto, calcular, pesquisar, programar, gerar imagem e mexer no PC. Ele não programa. Começou querendo "tudo local, sem API" e, no mesmo dia, liberou APIs grátis também.

## O que foi explicado (e por quê)
1. **Treinar do zero não dá.** O caro não é a receita, é rodar a receita: milhares de placas de vídeo por meses, muito texto e muita gente revisando. Os pesos do Claude não são públicos.
2. **O que dá:** pegar um **modelo aberto** já treinado (Qwen, Llama, Gemma, gpt-oss) e montar em volta dele a personalidade, a memória, as ferramentas e o jeito de trabalhar. É isso que a ZicoAI é.
3. **A placa manda no tamanho do cérebro.** RTX 3080 com 10 GB: modelo de ~8–9B roda inteiro na placa (rápido); 35B só dividindo com a RAM (lento, mas mais inteligente).
4. **Local x nuvem:** local é privado e sem limite, mas mais fraco. API grátis (Gemini, Groq) é muito mais forte, mas tem limite por minuto e por dia, e o que vai pra ela sai do PC.

## Decisão
- **Local** pra dado privado (cliente, CPF, telefone) e como reserva.
- **Nuvem grátis** pra pensar pesado (código, pesquisa, texto grande).
- Tudo que sai bom da nuvem vira **exemplo e memória**, e depois vira material pra treinar o modelo local.

## Lições
1. Explique o limite real antes de prometer ("não dá treinar igual GPT"), e logo em seguida mostre o caminho que dá.
2. Escolha o tamanho do modelo pela placa de vídeo, não pela vontade.
3. Separe por **privacidade**: dado de cliente fica local; o resto pode ir pra nuvem grátis.
4. Uma IA boa é modelo + memória + ferramentas + método. O modelo é só uma parte.
