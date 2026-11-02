// Testa recarga no meio de uma resposta sem tocar em Apps Script ou modelos reais.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.ZICO_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname,'../..');
const serv = http.createServer((req,res)=>{
  const u = new URL(req.url,'http://localhost');
  const file = path.join(root,u.pathname === '/' ? 'index.html' : u.pathname);
  try {res.setHeader('Content-Type',/\.html$/.test(file)?'text/html':/\.js$/.test(file)?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}
  catch(e){res.statusCode=404;res.end();}
});
const aguarde = n=>new Promise(r=>setTimeout(r,n));
async function preparar(page,servidor,simulador){
  page.on('pageerror',e=>simulador.errors.push(e.message));
  await page.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('marked')?'window.marked={parse:s=>s,Renderer:function(){},setOptions:()=>{}};':r.request().url().includes('purify')?'window.DOMPurify={sanitize:s=>s,addHook:()=>{}};':''}));
  await page.route('https://fonts.**',r=>r.abort());
  await page.route('https://example.invalid/brain',async route=>{
    const j=route.request().postDataJSON();let data={ok:true};
    if(j.acao==='chats')data.chats=simulador.sent?[{id:'fake-reload',titulo:'Teste'}]:[];
    if(j.acao==='projetos')data.projetos=[];
    if(j.acao==='tarefas')data.tarefas=[];
    if(j.acao==='abrir')data.mensagens=simulador.sent && Date.now()-simulador.at>1700?[{role:'user',content:simulador.pergunta},{role:'assistant',content:'Resposta recuperada com provas',cerebro:'Teste'}]:[];
    if(j.acao==='estadoChat'){
      data.estado=simulador.sent && j.reqId===simulador.id ? Date.now()-simulador.at>1700?'concluido':'rodando':'desconhecido';
      data.chatId=simulador.sent&&data.estado==='concluido'?'fake-reload':j.chatId||'';
    }
    if(j.acao==='chat'){
      simulador.sent++;
      simulador.id=j.reqId;
      simulador.at=Date.now();
      simulador.pergunta=j.mensagens.at(-1).content;
      await aguarde(3700);
      data={ok:true,chatId:'fake-reload',titulo:'Teste',resposta:'Resposta recuperada com provas',passos:['Feito'],cerebro:'Teste'};
    }
    try{await route.fulfill({json:data});}catch(e){ /* requisição abortada pelo reload */ }
  });
  await page.goto('http://127.0.0.1:'+servidor.address().port+'/',{waitUntil:'domcontentloaded'});
}
(async()=>{
  await new Promise(r=>serv.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true});
  try{
    for(const novo of [false,true]){
      const sim={sent:0,at:0,id:'',pergunta:'',errors:[]};
      const ctx=await browser.newContext({viewport:{width:novo?390:1440,height:850},serviceWorkers:'block'});
      const page=await ctx.newPage();
      await page.addInitScript(novo?()=>{
        localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'fake-only',aparelho:'Teste',cerebro:'auto'}));
        localStorage.setItem('zicoai_atual',JSON.stringify(null));
        localStorage.setItem('zicoai_chats',JSON.stringify([]));
      }:()=>{
        localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'fake-only',aparelho:'Teste',cerebro:'auto'}));
        // Simula conversa existente sem persistir o conteúdo da requisição no cérebro.
        if(!localStorage.getItem('zicoai_atual'))localStorage.setItem('zicoai_atual',JSON.stringify('fake-reload'));
        if(!localStorage.getItem('zicoai_chats'))localStorage.setItem('zicoai_chats',JSON.stringify([{id:'fake-reload',titulo:'Teste'}]));
      });
      await preparar(page,serv,sim);
      await page.locator('#txt').fill(novo?'Teste nova conversa após recarga':'Teste conversa existente após recarga');
      await page.locator('#bEnviar').click();
      await page.locator('.trab').waitFor();
      await page.waitForFunction(()=>{const p=JSON.parse(localStorage.getItem('zicoai_pedido_pendente_app')||'null');return p&&p.reqId&&p.pergunta;});
      assert.equal(sim.sent,1,'servidor recebe apenas um envio inicial');
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#recuperacaoEnvio').waitFor({state:'visible'});
      await page.getByText('Resposta recuperada com provas',{exact:true}).waitFor({timeout:24000});
      assert.equal(sim.sent,1,'recarregar jamais reenvia chat');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('zicoai_pedido_pendente_app')||'null')),null,'limpa após confirmação');
      assert.deepEqual(sim.errors.filter(s=>!/Service worker is disabled/.test(s)),[],'sem erros JS');
      console.log('PASS reload '+(novo?'nova conversa':'conversa existente')+': resposta recuperada, uma chamada, sem duplicação');
      await ctx.close();
    }
    const sim={sent:0,at:0,id:'',pergunta:'',errors:[]};
    const ctx=await browser.newContext({viewport:{width:390,height:850},serviceWorkers:'block'});
    const page=await ctx.newPage();
    await page.addInitScript(()=>{
      localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'fake-only',aparelho:'Teste',cerebro:'auto'}));
      localStorage.setItem('zicoai_atual',JSON.stringify(null));
      localStorage.setItem('zicoai_pedido_pendente_app',JSON.stringify({reqId:'rpendente12345',chatId:'',novo:true,pergunta:'Solicitação não confirmada',criado:Date.now()-70000}));
    });
    page.on('dialog',d=>d.accept());
    await preparar(page,serv,sim);
    await page.locator('#recuperacaoRestaurar').waitFor({state:'visible',timeout:15000});
    await page.locator('#recuperacaoRestaurar').click();
    assert.equal(await page.locator('#txt').inputValue(),'Solicitação não confirmada');
    assert.equal(sim.sent,0,'não reenvia quando estado desconhecido');
    console.log('PASS pedido incerto: preserva texto e exige decisão humana');
    await ctx.close();
  }finally{await browser.close();serv.close();}
})().catch(e=>{console.error(e);serv.close();process.exitCode=1});
