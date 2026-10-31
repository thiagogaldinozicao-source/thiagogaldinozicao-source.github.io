# Aula 17: imagem melhor sem trocar o gerador (30/10/2026)

## Pedido
> "esse gerador de imagem tá fraco"
> "Não muda o gerador porque quero testar mandando prompt… igual mandamos pro Gemini"

## Entender
O Thiago **não** quer outro gerador: quer testar o mesmo (ComfyUI no PC) com pedidos melhores. O pedido curto em português ("banner da loja com iPhone") é o que deixava a imagem fraca. O serviço sem chave (Pollinations) também começou a mostrar "free limit" na imagem, então o PC ficou como gerador.

## Execução
`detalharPromptImagem(prompt)`:
- pedido com **menos de 45 palavras** → um cérebro rápido (Gemini → Groq → Groq Qwen → Mistral → NVIDIA) reescreve como prompt detalhado **em inglês** (assunto, cenário, luz, câmera, estilo), em até 400 tokens;
- pedido longo (o Thiago já detalhou) passa **igual**;
- só aceita a reescrita se tiver 15+ palavras e nenhuma tag `[[ ]]`;
- o passo "Detalhou o pedido da imagem" mostra o texto no "Como respondi", pra ele ver e copiar.

## Resultado
O Thiago testou: "Melhorou viu".

## Lições
1. Faça o que ele pediu (manter o gerador) e ataque a causa real (o pedido curto).
2. Pedido que ele mesmo detalhou não se mexe.
3. Mostre o prompt usado: ele quer aprender e testar.
