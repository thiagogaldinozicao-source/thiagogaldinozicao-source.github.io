# B03: criar um artefato (página/app) do zero

**Regra:** Antes de escrever, decida o que é: texto lido uma vez fica na resposta; o que o Thiago vai guardar, mexer ou mandar pra alguém vira artefato. Se existir um tipo pronto (documento, slides, planilha, design, painel), use o tipo. Se não existir, faça uma página HTML num arquivo só, que funcione no celular e no tema claro e escuro, com os dados num banco (não no aparelho), e publique sempre no mesmo link.
**Palavras-chave:** artefato, artifact, página, criar página, criar app, publicar, link, html, site, ferramenta, calculadora, painel, dashboard, documento, slides, republicar, mesmo link, banco do artefato, tema escuro, celular

## 1. Escolher o formato (antes de tudo)
| O Thiago quer… | Vira |
|---|---|
| uma resposta, explicação, conta rápida | texto na conversa |
| texto pra cliente | bloco de código na conversa (A05) |
| documento, carta, relatório pra guardar | tipo **documento** |
| apresentação | tipo **slides** |
| tabela pra preencher e calcular | tipo **planilha** |
| tela de app, cartaz, arte | tipo **design** |
| números pra acompanhar | tipo **painel** |
| app, calculadora, ferramenta, site | **página HTML** feita à mão |
| pediu o arquivo (.html, .pptx, .xlsx) | entrega o arquivo |

Por quê: artefato tem link, fica salvo e o Thiago edita direto sem pedir tudo pra IA. Arquivo solto não tem link.

## 2. A página HTML: o que não pode faltar
1. **Um arquivo só** (HTML + CSS + JS juntos), igual ao padrão dos apps (B01).
2. **Nome curto de verdade** no `<title>` (2 a 4 palavras, ex.: "Acertos Zicão"). A explicação vai na descrição, não no título.
3. **Cores em variáveis** (`--bg`, `--fg`, `--accent`) definidas no `:root` e redefinidas pro tema escuro. O `body` sempre com fundo próprio. Se o visual for só escuro (preto e dourado da Zicão), defina todas as cores mesmo assim.
4. **Celular primeiro:** funciona com ~400 px, margem lateral de pelo menos 16 px e nunca rolar pro lado. Só tabela e código podem ter rolagem própria.
5. **Bibliotecas só de CDN permitida** (cdnjs, jsdelivr, unpkg) e com versão exata (ex.: `react/18.3.1`). Fonte só do Google Fonts. Qualquer outro site é bloqueado sem aviso.
6. **Coisas que não funcionam dentro do artefato:** `alert`/`confirm`/`prompt`, botão de imprimir, link de download, iframe de outro site (YouTube, mapa) e câmera sem permissão. Monte a confirmação dentro da própria página.
7. **Dados:** o `localStorage` fica só naquele aparelho e pode sumir. Serve pra lembrar filtro ou rascunho. Histórico, registros e o que a equipe vê junto vão pro **banco do artefato** (`db`), com o `localStorage` só como plano B avisando "salvo neste aparelho" (B502 privada).
8. **Abre com exemplo**, nunca tela vazia, e o exemplo é marcado como exemplo.

## 3. Publicar e atualizar
1. Publicar o arquivo e conferir uma vez como ficou no celular e no PC, claro e escuro (uma olhada só, sem ficar em loop).
2. **Mudou alguma coisa:** troca só o trecho (texto exato que aparece uma vez), checa a sintaxe (`node --check` no script) e republica **no mesmo caminho/link** (B506 privada).
3. Artefato de outra conversa: **ler a versão atual primeiro** e só depois republicar no link dele. Nunca criar um artefato novo pra mesma coisa (A401 privada).
4. Se o app também existe no GitHub, os dois ficam **iguais**, com a mesma versão (A801 privada).
5. Depois de publicar: uma frase dizendo o que a página faz, e avisar o que não deu pra testar.

## Na ZicoAI
A ZicoAI não publica artefato do Claude, porque essa ferramenta é só do Claude. O equivalente dela: fazer a página HTML no padrão B01 e publicar no **GitHub Pages**, subindo a versão do cache do service worker a cada mudança (B12). As regras de formato, celular, tema e dados acima valem igual.

## Erros que já aconteceram
- **Histórico sumia:** a primeira versão do app de acertos salvava só no `localStorage` do aparelho. Correção: banco do artefato (B501/B502, privadas).
- **Dado digitado num quadrinho da conversa não chega na IA:** o Thiago preencheu um widget mostrado no chat e achou que a IA tinha recebido. Correção: pedir a informação de novo, em texto.
- **Mudou o app, esqueceu as instruções:** o app passou de "margem" pra "frete", mas as instruções do projeto continuaram falando de margem. Correção: ao mudar uma regra, atualizar também as instruções (B506).
- **Prometer o que não foi testado:** salvar receita real e ler print não puderam ser testados no app de receitas. Correção: dizer exatamente o que não foi testado (B110).

## Exemplo real
O app de acertos é um artefato HTML único, publicado com banco (`db`) e anexos (`assets`). Usa o visual preto e dourado da Zicão e é atualizado sempre no mesmo link. O `.html` guardado é só cópia de segurança, a versão oficial é o link.

## Lições
1. Primeiro o formato, depois o código.
2. Tipo pronto quando existir; HTML feito à mão quando não existir.
3. Celular e tema escuro desde o começo, não no fim.
4. O que precisa durar vai pro banco, não pro aparelho.
5. Um link por coisa: ler, mudar o trecho e republicar no mesmo.
6. Dizer o que não foi testado.
