# D43: memória limpa: o que vira lembrança e o que não vira (01/11/2026)

**Regra:** Memória é só o que o THIAGO disse (com as palavras dele) ou mandou anotar. Preço, garantia, endereço e ficha moram na base/tabela conferida, não na memória. Detalhe do sistema, informação de fora e dedução não viram memória. Lembrança só entra na resposta se tiver a ver com a pergunta.
**Palavras-chave:** memória, lembrança, lixo, revisar, aprender sozinha, dólar, Átila, preço, garantia, endereço, base conferida, colado, anota, lembra

## Por quê
- 01/11: a memória tinha "Átila significa paizinho", "dólar é referência externa", preço do iPhone 15, "todo parcelamento tem juros", ID da planilha, ficha do iPhone Duo e "calculadora criada com sucesso". As 25 últimas iam em TODA resposta, até no conserto da calculadora.
- Memória errada é pior que nenhuma: ela repete o erro com confiança.

## Como funciona por baixo
- `motivoMemoriaRuim(t, origem)`: grande demais (>300); detalhe do sistema; e, quando foi ela que tirou sozinha (auto): preço/garantia/endereço/juros/ficha, informação de fora (dólar, "significa") e dedução ("todos os", "devido a").
- `pareceColado`: código, JSON e listas coladas não contam como "o Thiago disse". `apoiado`: 60% das palavras e pelo menos 2 têm que estar na fala dele.
- `[[MEMORIA:]]` na resposta só grava se ele pediu ("lembra", "anota") ou se passou no filtro com apoio.
- `revisarMemoria`: marca Origem = revisar, sem apagar. Volta trocando pra "thiago".
- `montarSistema`: revisar nunca entra. Sempre entram as 10 últimas curtas que ele mandou guardar; o resto só por relevância.

## Erro comum
- Guardar o que ELA escreveu.
- Guardar preço solto (muda toda semana).
- Mandar toda a memória em todo pedido.

## Como conferir
- Detalhes → "Memória usada": só o que tem a ver. Aba memoria: Origem "revisar" com motivo na aba historico.
