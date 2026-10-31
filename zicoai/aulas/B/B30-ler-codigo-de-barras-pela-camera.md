# B30: Ler código de barras pela câmera (iPhone e Android)

**Regra:** Use o leitor nativo (`BarcodeDetector`) quando existir; senão ZXing em WebAssembly lendo só a faixa do meio do vídeo, várias vezes por segundo. Sempre deixe digitar o número e ler por foto como plano B.
**Palavras-chave:** código de barras, escanear, câmera, ler ean, scanner, iphone, safari, zxing, barcodedetector, getusermedia, lanterna, leitor ao vivo, digitar código, mercado
**Projeto(s):** leva-ou-nao

## Exemplo real
O Thiago queria apontar o celular no produto do mercado e ver se vale levar. ZXing em JS puro travava no iPhone. Entregue: leitor ao vivo (Android nativo, iPhone ZXing wasm), bipe ao ler, lanterna onde a câmera tem, leitura por foto e campo para digitar o número.

## Como foi feito
1. Escolhe o leitor uma vez (trecho de `www/index.html`):
```js
const FORMATOS = ["EAN13", "EAN8", "UPCA", "UPCE"];
let nativo = null;
if ("BarcodeDetector" in window){ try { nativo = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] }); } catch (e) { nativo = null; } }
```
2. ZXing wasm (950 KB) só carrega se não houver nativo. Se o nativo lançar erro, cai pro ZXing.
3. Abre a câmera traseira: `getUserMedia({ audio:false, video:{ facingMode:{ ideal:"environment" }, width:{ideal:1920}, height:{ideal:1080} } })`, tenta `focusMode: "continuous"` e só mostra lanterna se `getCapabilities().torch` existir (no iPhone o Safari não deixa).
4. Laço de leitura (a cada 60 ms): desenha num canvas só a faixa do meio (90% da largura, 45% da altura) e a cada 4ª tentativa a imagem inteira; reduz pra no máximo 1280 px de largura.
5. Não analisa de novo o mesmo código (`ultimo = {code, t}`; ignora repetido por 4 s).
6. Valida o dígito verificador (resumido do `eanValido`): soma dos dígitos com pesos 3 e 1 alternados. Número errado ainda busca, mas avisa "Número não confere".
7. Dica após 5 s sem ler: "Afasta uns 15 cm e deixa o código deitado."
8. Desliga a câmera quando a página vai pro segundo plano (`visibilitychange`).

## Erros que já aconteceram
- ZXing em JS travava no iPhone. Correção (o ROADMAP e o commit só dizem que travava e que o wasm é mais rápido): ZXing em WebAssembly lendo a faixa central (ce24164).
- Tocar duas vezes enquanto `getUserMedia` esperava deixava a câmera aberta 2x. Correção: flag `abrindo` (5e11314).
- CSP bloqueou o wasm no iPhone com iOS menor que 16. Causa: ele não conhece `'wasm-unsafe-eval'`. Correção: acrescentar `'unsafe-eval'` na CSP (d3e7970).
- Vídeo pequeno no iPhone ao abrir. Correção: `position:absolute; inset:0; height:100%; object-fit:cover` (386b9c4).
- Tela "dançando" pro lado no iPhone: `html,body{overflow-x:hidden;overflow-x:clip}` e `minmax(0,1fr)` nas grades (2fd6352).

## Lições
1. iPhone: ZXing wasm, faixa central, vários quadros por segundo. Não use ZXing JS.
2. Carregue o wasm só se precisar.
3. Sempre ofereça fallback: foto e número digitado.
4. Desligue a câmera ao sair do app e nunca abra duas.
5. Confira o dígito verificador antes de dizer "não cadastrado".

Fontes: leva-ou-nao `www/index.html` (leitor, eanValido), ROADMAP.md (Aprendizados), commits ce24164, 5e11314, d3e7970, 386b9c4, 2fd6352.
