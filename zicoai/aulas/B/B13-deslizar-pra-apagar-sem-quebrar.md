# B13: Gesto de deslizar pra apagar (swipe) sem quebrar o resto

**Regra:** Use `touchstart`/`touchmove`/`touchend` no `document` (passivos). Só conta como swipe se for horizontal e longo (`dx>55` e `dx>dy*1.8`). Enquanto estiver deslizando, os cliques das teclas são ignorados. Ignore o gesto dentro de painéis, modais e campos.
**Palavras-chave:** swipe, deslizar pra apagar, arrastar pra esquerda, apagar dígito, gesto, touchstart, touchend, clique sem querer, tecla apertou sem querer, tutorial primeira vez, calculadora, backspace
**Projeto(s):** Calculadora-do-zicao

## Exemplo real
Na calculadora, arrastar o dedo pra esquerda na tela apaga o último dígito (igual ao ⌫). Problema típico: ao soltar o dedo, o navegador também dispara um "clique" na tecla debaixo e digita um número sem querer. O app evita isso e ainda mostra um tutorial na 1ª vez ("arrastar pra esquerda apaga", commit bff0f87).

## Como foi feito
Trecho do `index.html` (copiado, resumido nos sons):
```js
document.addEventListener('touchstart',function(e){
  if(e.target.closest('.panel')||e.target.closest('.modal')||e.target.closest('#tut'))return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
  txStart=e.touches[0].clientX;tyStart=e.touches[0].clientY;swiping=false;
},{passive:true});
document.addEventListener('touchmove',function(e){
  if(txStart===null)return;
  var dx=Math.abs(e.touches[0].clientX-txStart), dy=Math.abs(e.touches[0].clientY-tyStart);
  if(!swiping&&dx>12&&dx>dy)swiping=true;
},{passive:true});
document.addEventListener('touchend',function(e){
  if(txStart===null)return;
  var dx=txStart-e.changedTouches[0].clientX;
  var dy=Math.abs(e.changedTouches[0].clientY-(tyStart||0));
  if(dx>55&&dx>dy*1.8){hap('lt');snd('del');bksp();render();}
  if(swiping)window._swipeT=Date.now();
  txStart=null;tyStart=null;
  setTimeout(function(){swiping=false;},0);
});
```
Nas teclas e no visor, o clique checa o gesto antes:
```js
numEl.addEventListener('click',function(){if(!swiping&&Date.now()-(window._swipeT||0)>400)copyCur();});
```
Também: o tutorial (`#tut`) tem o próprio swipe (`d>55`), e o teclado usa `pointerup` com `if(swiping)return;`.

## Erros que já aconteceram
Nenhum commit de correção dedicado ao swipe. O histórico mostra a evolução: a regra `dx>dy*1.8` está desde a primeira versão (cc2f893); a flag `swiping` apareceu em 45c564d/ae0b298; a janela de 400 ms (`_swipeT`) veio em 2b7742e; sons do gesto em 8fdcfe6; tutorial em bff0f87.

## Lições
1. Marque `swiping=true` só depois de 12 px na horizontal; antes disso é toque.
2. Depois do swipe, bloqueie cliques por ~400 ms.
3. Exija gesto bem horizontal (`dx>dy*1.8`) pra não confundir com rolagem.
4. Não ative o gesto dentro de painéis com rolagem, modais e `INPUT`/`SELECT`.
5. Listeners `{passive:true}` pra não travar a rolagem no iPhone.
6. Gesto escondido precisa de tutorial na 1ª vez.

Fontes: Calculadora-do-zicao/index.html (seção "DESLIZAR PRA APAGAR"); commits cc2f893, 45c564d, ae0b298, 2b7742e, 8fdcfe6, bff0f87.
