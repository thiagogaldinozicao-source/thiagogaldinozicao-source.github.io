// API local falsa: nunca chama Apps Script, ponte nem modelos reais.
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const { chromium } = require(process.env.ZICO_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '../..');
const server = http.createServer((req,res) => {
  const file = path.join(root, new URL(req.url,'http://localhost').pathname === '/' ? 'index.html' : new URL(req.url,'http://localhost').pathname);
  try { res.setHeader('Content-Type', /\.html$/.test(file)?'text/html':/\.js$/.test(file)?'application/javascript':'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.statusCode=404; res.end(); }
});
const details = [{tipo:'ferramenta',titulo:'Ferramenta fictícia',pedido:{api_key:'fake-api-only',pin:'fake-pin-only',args:{consulta:'teste'}},resposta:'token=fake-token-only CPF 000.000.000-00 telefone +55 (00) 90000-0000 https://example.invalid/?key=fake-query-only '+ 'x'.repeat(2300),ms:20}];
const old={role:'assistant',content:'Resposta antiga',passos:['Leu a memória','Respondeu com cérebro de teste'],cerebro:'teste'};
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true});
  try {
    for(const width of [390,1440]) {
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
      const page=await context.newPage(), errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{
        if(window.top !== window) return; // a configuração pertence ao app, não aos iframes sandbox
        localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'fake-pin-only',aparelho:'Teste',cerebro:'auto'}));
        localStorage.setItem('zicoai_atual',JSON.stringify('fake-chat'));
        localStorage.setItem('zicoai_chats',JSON.stringify([{id:'fake-chat',titulo:'Teste'}]));
        window.__copiado=''; Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__copiado=t}}});
      });
      // Bibliotecas externas não são necessárias para diagnosticar o progresso.
      await page.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('marked')?'window.marked={parse:s=>s,Renderer:function(){},setOptions:()=>{}};':r.request().url().includes('purify')?'window.DOMPurify={sanitize:s=>s,addHook:()=>{}};':''}));
      await page.route('https://fonts.**',r=>r.abort());
      await page.route('https://example.invalid/brain',async route=>{
        const req=route.request().postDataJSON(); let data={ok:true};
        if(req.acao==='chats')data.chats=[{id:'fake-chat',titulo:'Teste'}];
        if(req.acao==='abrir')data.mensagens=[old];
        if(req.acao==='projetos')data.projetos=[];
        if(req.acao==='tarefas')data.tarefas=[];
        if(req.acao==='aoVivo')Object.assign(data,{passos:['Ferramenta em execução'],detalhes:details});
        if(req.acao==='chat'){await new Promise(r=>setTimeout(r,5500));Object.assign(data,{chatId:'fake-chat',titulo:'Teste',resposta:'Resposta nova fictícia',cerebro:'teste',passos:['Feito'],detalhes:details,ms:20});}
        await route.fulfill({json:data});
      });
      await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
      await page.getByText('Resposta antiga',{exact:true}).waitFor();
      const legacy=page.locator('.msg-ia .passos').first(); await legacy.locator('summary').first().click();
      assert((await legacy.innerText()).includes('Leu a memória'));
      await page.locator('#txt').fill('pedido fictício');await page.locator('#bEnviar').click();
      const live=page.locator('.trab .passo-detalhe').first();await live.waitFor();await live.locator('summary').click();
      assert(await live.evaluate(e=>e.open));
      await page.waitForTimeout(1700);assert(await page.locator('.trab .passo-detalhe').first().evaluate(e=>e.open));
      await page.getByText('Resposta nova fictícia',{exact:true}).waitFor();
      const outer=page.locator('.msg-ia .passos').last();await outer.locator('summary').first().click();
      const step=outer.locator('.passo-detalhe').first();if(!await step.evaluate(e=>e.open))await step.locator('summary').click();
      assert((await step.innerText()).includes('Solicitação'));assert((await step.innerText()).includes('Resposta'));
      await step.getByRole('button',{name:'Copiar solicitação',exact:true}).click();assert((await page.evaluate(()=>window.__copiado)).includes('•••'));
      await step.getByRole('button',{name:'Copiar resposta',exact:true}).click();
      const copied=await page.evaluate(()=>window.__copiado),dom=await page.locator('body').innerText();
      for(const secret of ['fake-api-only','fake-pin-only','fake-token-only','fake-query-only','000.000.000-00','90000-0000']) {assert(!dom.includes(secret));assert(!copied.includes(secret));}
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'overflow '+width);
      assert(await step.locator('pre').last().evaluate(e=>e.scrollWidth>e.clientWidth));
      await step.locator('summary').click();assert(!await step.evaluate(e=>e.open));
      // Mesmo componente no painel e em tarefa ao vivo, via estado falso.
      await page.evaluate(ds=>{tarefas=[{id:'fake-task',chatId:atual,pedido:'Tarefa fictícia',status:'rodando',passos:['Executando'],detalhes:ds}];vivoTarefaNaConversa();mostraProgresso(['Executando'],true,ds);},details);
      assert.equal(await page.locator('#vivoTarefa .passo-detalhe').count(),1);
      assert.equal(await page.locator('#progressoPainel .passo-detalhe').count(),1);
      assert.deepEqual(errors,[]);console.log('PASS Playwright '+width+': antigo, ao vivo, final, tarefa, painel, abrir/fechar, copiar, máscara e largura');
      await context.close();
    }
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
