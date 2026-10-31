# B33: Google Planilha + Apps Script como banco de dados grátis

**Regra:** Guarde os dados numa Planilha Google e exponha as funções via Apps Script (`doPost`). A regra de negócio e a senha ficam no servidor; o app só chama `{fn, args}`. Toda escrita passa por `LockService`.
**Palavras-chave:** google planilha, apps script, banco de dados grátis, planilha como banco, doPost, backend grátis, codigo.gs, sheets, missões, pontos, app do joão, web app, gatilho, email
**Projeto(s):** missoes-do-joao

## Exemplo real
App de missões do João (filho): faz missão, ganha ponto, troca por prêmio ou guarda pra bike. O pai aprova no app e recebe e-mail a cada pedido. Dados nas abas `Historico`, `Missoes` e `Premios`. Pra mudar missões ou prêmios, o Thiago edita a planilha e o app atualiza sozinho.

## Como foi feito
1. `Codigo.gs` na própria planilha, publicado como Web App. Só funções listadas num objeto podem ser chamadas:
```js
const API = { getEstado: getEstado, pedirMissao: pedirMissao, /* ... */ };
function doPost(e) {
  let pedido = {};
  try { pedido = JSON.parse(e.postData.contents); } catch (err) { return responder_({ ok: false, error: 'Pedido inválido' }); }
  return executar_(pedido.fn, pedido.args);
}
```
`executar_` checa `API.hasOwnProperty(fn)` e responde sempre `{ok:true,data}` ou `{ok:false,error}`.
2. O app (GitHub Pages) fala com a planilha por um shim que imita `google.script.run`, então o resto da tela não sabe de `fetch`: `fetch(API, {method:"POST", body:JSON.stringify({fn, args}), redirect:"follow"})`, com timeout de 30 s. URL do Apps Script: `<segredo>`.
3. Só repete sozinho (1x, após 1,5 s) as leituras seguras: `SEGURO_REPETIR = {getEstado:1, checarSenha:1}`. Escrita nunca repete.
4. Escrita com trava (uma escrita por vez na planilha):
```js
function comLock_(fn) { const lock = LockService.getScriptLock(); lock.waitLock(10000); try { return fn(); } finally { lock.releaseLock(); } }
```
5. Regras no servidor: confere "já foi hoje", teto diário, e conquista só paga uma vez (`conq:<id>`). O app só pede; o servidor decide.
6. Abas viram configuração: `abaLista_` cria a aba com valores padrão na 1ª vez; depois vale o que está na planilha (coluna "Ativa" SIM/NÃO).
7. Datas em fuso fixo: `TZ = 'America/Sao_Paulo'` e `Utilities.formatDate`.
8. `configurar()` roda 1x pelo editor: cria abas, pede permissão de e-mail e cria gatilho semanal (apaga o antigo antes, pra não duplicar). `MailApp` avisa o pai; erro de e-mail é engolido (o pedido já está salvo).

## Erros que já aconteceram
- Servidor e tela atualizam em momentos diferentes: a tela nova funciona com o servidor velho (v10): se o estado não traz o passe (`if(!E.passe){ box.innerHTML = avisoServidor(); ... }`), mostra o aviso de que falta atualizar o servidor em vez de quebrar (b90d56b).
- Rede ruim: o app passou a mostrar "Internet fraca. Tenta de novo daqui a pouco." e o aviso de sem internet (fe82891).
- Link antigo do Apps Script: `doGet` mostra "O app mudou de casa" com link pro site novo.
- Senha do pai ficou escrita no `Codigo.gs` e o número do WhatsApp no `index.html` do repo. Não copie; use `<segredo>` e não reutilize a senha.

## Lições
1. Planilha serve bem para app pessoal ou de família; não para muitos usuários.
2. Valide tudo no servidor: o JS da tela é público.
3. `LockService` em toda escrita; retry só em leitura.
4. Versione o servidor e faça a tela tolerar versão antiga.
5. Deixe o dono mexer em missões/prêmios direto nas abas.

Fontes: missoes-do-joao README.md, planilha/Codigo.gs, index.html (shim), commits 9d1ba8a, fe82891, b90d56b, e369d0d.
