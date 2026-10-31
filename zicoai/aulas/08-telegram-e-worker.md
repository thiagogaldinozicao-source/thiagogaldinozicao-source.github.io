# Aula 08: bot do Telegram e o atalho no Cloudflare (30/10/2026)

## Pedido
Conversar com a ZicoAI pelo Telegram (WhatsApp não oficial está proibido pelo Thiago: risco de ban).

## Como deveria funcionar
O Telegram manda cada mensagem (webhook) pro link do cérebro; o cérebro responde pela API do Telegram.

## Erros e correções (v29 a v32)
1. **Webhook apontando pro link `/dev`.** O `/dev` exige login no Google e o Telegram não consegue abrir. Correção (v29): `ligarTelegram` usa sempre o link **`/exec`** da implantação (`DEPLOY_ID`).
2. **O Telegram não aceita o redirecionamento 302** que o Apps Script devolve em todo POST. Correção (v30): um **Worker grátis no Cloudflare** (`zicoai/cerebro/proxy-worker.js`) recebe o webhook em `/tg`, confere o segredo, repassa pro `/exec` seguindo o redirecionamento e responde 200 pro Telegram:
   ```js
   if (url.pathname === '/tg') {
     if (!env.SEGREDO || req.headers.get('x-telegram-bot-api-secret-token') !== env.SEGREDO) return new Response('nope', { status: 403 });
     if (!env.ZICO_EXEC) return new Response('falta ZICO_EXEC', { status: 500 });
     const corpo = await req.text();
     try {
       await fetch(env.ZICO_EXEC + '?tg=' + encodeURIComponent(env.SEGREDO), { method: 'POST', headers: { 'content-type': 'application/json' }, body: corpo, redirect: 'follow' });
     } catch (e) { /* o Telegram reenvia se a gente não responder 200; aqui respondemos sempre */ }
     return new Response('ok', { status: 200 });
   }
   ```
3. **Segredo com caractere proibido.** O `secret_token` do Telegram só aceita letras, números, `_` e `-`. Correção (v30/v31): `ligarTelegram` **se recusa a ligar** (dá erro e para) se o segredo do Worker tiver outro caractere. Na v31 o `secret_token` passou a ser o `PROXY_SEGREDO` (o mesmo `SEGREDO` do Worker), e o cérebro também aceita `?tg=PROXY_SEGREDO`.
4. Pra achar esses problemas: `diagnosticoTelegram()` mostra o `getWebhookInfo` (último erro do Telegram e mensagens pendentes) e, desde a v32, o rastro da última chamada que chegou.

## Lições
1. Webhook sempre no link oficial (`/exec`), nunca no de teste (`/dev`).
2. Quando um serviço não aceita o jeito que o outro responde (302), coloque um **atalho no meio** que adapta.
3. Toda integração precisa de um **diagnóstico** que mostre o erro do outro lado (`getWebhookInfo`).
4. Leia as regras de formato do serviço (quais caracteres o segredo aceita) antes de configurar.
