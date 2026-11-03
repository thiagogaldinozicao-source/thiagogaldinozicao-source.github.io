// Interface real, transporte simulado; não acessa Apps Script/contas nem modelos reais.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.ZICO_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..'),server=http.createServer((q,r)=>{try{r.setHeader('Content-Type','text/html');r.end(fs.readFileSync(path.join(root,'index.html')));}catch{r.writeHead(404);r.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.ZICO_CHROME});let checks=0;
 const check=(c,m)=>{assert(c,m);checks++;console.log('PASS '+m);};
 try{for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await ctx.newPage(),calls=[],errors=[],hist=[];
  const id='zof'+'a'.repeat(36);let done=false,finalGravado=false;
  p.on('pageerror',e=>{if(!/Service worker is disabled/.test(e.message))errors.push(e.message);});
  await p.addInitScript(()=>{if(window.top!==window)return;if(!localStorage.getItem('zicoai_cfg'))localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'FAKE_ONLY',cerebro:'auto'}));});
  await p.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('marked')?'window.marked={parse:s=>s,Renderer:function(){},setOptions:()=>{}};':'window.DOMPurify={sanitize:s=>s,addHook:()=>{}};'}));
  await p.route('https://fonts.**',r=>r.abort());
  await p.route('https://example.invalid/brain',async r=>{
    const q=r.request().postDataJSON();calls.push(q);let d={ok:true,chats:hist.length?[{id:'officechat',titulo:'Oficina'}]:[],projetos:[],tarefas:[],mensagens:hist,passos:[],detalhes:[]};
    if(q.acao==='chat'){
      const texto=q.mensagens.at(-1).content;hist.push({role:'user',content:texto});
      if(q.modo==='oficina'){d={ok:true,chatId:'officechat',oficinaId:id,resposta:'Oficina iniciada',cerebro:'Oficina local'};hist.push({role:'assistant',content:d.resposta});}
      else {d={ok:true,chatId:'officechat',resposta:'Complemento recebido com arquivo anterior',cerebro:q.cerebro};hist.push({role:'assistant',content:d.resposta});}
    }
    if(q.acao==='abrir')d.oficinaId=done?'':id;
    if(q.acao==='oficinaEstado'){
      if(done&&!finalGravado){hist.push({role:'assistant',content:'Rascunho pronto: 4 provas passaram. [[RASCUNHO:chat-officechat]]'});finalGravado=true;}
      d={ok:true,id,chatId:'officechat',estado:done?'concluido':'programando',finalizada:done,appAuto:done?'chat-officechat':undefined};
    }
    if(q.acao==='rascunho')d={ok:true,slug:'chat-officechat',html:'<!doctype html><html><body>Exemplo aprovado</body></html>'};
    await r.fulfill({json:d});
  });
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await p.locator('#bAnexar').click();await p.locator('#cOficina').click();
  await p.locator('#txt').fill('Crie um contador HTML com somar e zerar');await p.locator('#bEnviar').click();
  await p.getByText('Oficina iniciada',{exact:true}).waitFor();
  await p.locator('#txt').fill('Depois deixe o botão maior');await p.locator('#bEnviar').click();
  check(calls.filter(c=>c.acao==='chat').length===1,width+': complemento aguarda a oficina, não cria outra tarefa');
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.querySelector('#filaMensagens').textContent.includes('Depois deixe'));
  check(calls.filter(c=>c.acao==='chat').length===1,width+': recarga conserva oficina e fila sem reenviar');
  done=true;await p.getByText(/Rascunho pronto: 4 provas passaram/).first().waitFor({timeout:20000});
  await p.getByRole('button',{name:'Conferir e continuar',exact:true}).click();
  await p.getByText('Complemento recebido com arquivo anterior',{exact:true}).waitFor();
  const complemento=calls.filter(c=>c.acao==='chat')[1];
  check(complemento.appSlug==='chat-officechat',width+': complemento continua o artefato entregue');
  check(complemento.mensagens.some(m=>m.content.includes('4 provas passaram')),width+': fila usa histórico com resultado verificado');
  check((await p.evaluate(()=>JSON.parse(localStorage.getItem('zicoai_oficinas_pc')||'{}'))).officechat===undefined,width+': acompanhamento finalizado é retirado sem perder conversa');
  check(errors.length===0,width+': integração sem erro JS: '+errors.join(';'));
  await ctx.close();
 }}finally{await browser.close();server.close();}
 console.log(JSON.stringify({checks,fail:0,ambiente:'Chrome isolado; Apps Script/ponte simulados'}));
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
