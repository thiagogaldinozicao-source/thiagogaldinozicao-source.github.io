# D35: o navegador da ZicoAI (o dela no Mac × o Chrome do Thiago) (31/10/2026)

**Regra:** A ZicoAI tem DOIS navegadores. O dela (Chrome próprio no Mac, ferramentas web_*) é pra pesquisar em site de verdade e depurar app sem mexer no Chrome do Thiago; o do Thiago (extensão, nav_*) é pra aba que ele tem aberta e o login dele. Cada ação devolve um print que o Thiago vê ao vivo no app. As travas são as mesmas: compra/envio/apagar/publicar/implantar só com OK escrito, senha/cartão/CPF nunca, banco fora. No painel da extensão, cada aba tem a sua ZicoAI e lê só a aba dela.
**Palavras-chave:** navegador dela, navegador próprio, web_*, pesquisar no navegador, abrir site, depurar app, testar no navegador, print ao vivo, tela ao vivo, extensão, aba, cada aba, conversa por aba, implantar, deploy

## Por quê
- **Pesquisa de verdade:** busca por API devolve resumo; site de loja, ficha e documentação muitas vezes só aparecem abrindo a página (com JavaScript). O navegador dela abre igual uma pessoa.
- **Depurar sem atrapalhar:** testar o app do Thiago (abrir, recarregar, clicar, ver erro de JS e de rede) no Chrome dela não mexe nas abas dele nem no WhatsApp aberto.
- **Ver pra confiar:** o Thiago vê o print a cada ação, igual quando o Claude implanta pelo navegador. Se ela abriu o site errado, ele vê na hora.
- **Mesmas travas nos dois:** `seguranca.js` é o mesmo arquivo na extensão e no navegador dela. Botão perigoso precisa do OK escrito; Implantar/Deploy entrou na lista (v67).
- **Uma ZicoAI por aba (extensão 2.6):** conversa de uma loja não se mistura com a do WhatsApp; o painel lê a aba DELE, não a que estiver na frente.

## Como funciona por baixo
- Mac: `~/ZicoAI/ponte-mac/navegador-zico.js` (Playwright, perfil próprio em `~/ZicoAI/navegador-perfil`, janela visível). Injeta `seguranca.js` + `pagina.js` do repo; clique com o mouse de verdade no ponto que a trava liberou. Fecha sozinho com 15 min parado. Print JPEG ≤ 90 mil letras (qualidade 32 → 18 → 10).
- Cérebro: `webNav(d)` → `ponteSemDetalhe('navegador', d, 90 s, 'mac')`. O print vai pro cache `tela_vivo` (10 min) e sai do texto do agente; o detalhe mostra "(print da tela)".
- App: `aoVivo` leva `tela` só quando é nova (`desde`); tarefa rodando busca `telaVivo` a cada 3 s. Card "Navegador da ZicoAI" com título/link; toque amplia.
- Extensão 2.6: ícone abre `painel.html?aba=ID` só naquela aba (painel global desligado); o app guarda a conversa em `atual_aba_ID` (12 h) e manda `abaId`; o cérebro lê essa aba e passa o `abaId` pras ferramentas nav_*.

## Situações em que aparece
- "pesquisa no seu navegador", "abre o site da loja X e vê o preço", "testa minha calculadora no navegador e conserta", "vê se o app tem erro", "por que a conversa da outra aba apareceu aqui?".

## Exemplo
- "testa minha calculadora no seu navegador": web_abrir (link) → web_erros recarregar:true ("JavaScript: calc is not defined", "404 app.js") → web_ler → acha a causa no código → conserta → web_erros de novo = 0 erros. O Thiago vê os prints no app enquanto isso.

## Erro comum
- Usar o Chrome do Thiago (nav_*) pra pesquisa à toa: troca a aba que ele tá usando.
- Achar que "confirmado:true" basta: sem o OK escrito do Thiago no pedido, o código recusa.
- Mandar o print pro cérebro como texto (gasta token e não ajuda): o print é pro Thiago, o texto da página é pro cérebro.
- Comparativo comum de celular ir pro navegador: continua na regra da FICHA (pesquisa web com fonte); navegador só quando ele pede.

## Como conferir
- Teste `t46` e `progresso.playwright.cjs` (card do print ao vivo, 390 e 1440 de largura). No app, o card "Navegador da ZicoAI" durante a tarefa. No Mac, a janela do Chrome dela abre na primeira vez.

## Atualização v71: o Thiago usa também
- Painel **Navegador** no app (🌐 no topo): barra de endereço (endereço abre, texto pesquisa no Google), voltar/avançar/recarregar, toque na tela = clique no mesmo ponto, rolar, digitar no campo tocado, Enter. O que o agente faz aparece ali também (busca `telaVivo` a cada 2,5 s).
- No celular a tela dela vira de celular (430×860) pra o site ficar legível; no computador, 1280×800. O clique usa o tamanho real do print (`naturalWidth`).
- Ação `navegar` (com PIN): só ela tem tocar/escrever/roda/tamanho; o agente continua só com as `web_*`, que passam pelas travas. Banco continua recusado.
- Chip de aparelhos no topo (`aparelhosRapido`): uma bolinha por aparelho (verde = ligado agora), sem chamar os aparelhos, então abre na hora.
