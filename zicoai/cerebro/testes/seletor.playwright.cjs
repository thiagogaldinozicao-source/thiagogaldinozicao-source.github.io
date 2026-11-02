// Teste local isolado, Chrome com perfil temporário e API falsa; nenhum segredo ou serviço real.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(process.env.ZICO_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..'), out=process.env.ZICO_TEST_OUT||__dirname;
const server=http.createServer((q,r)=>{try {const nome=new URL(q.url,'http://localhost').pathname;const f=path.join(root,nome==='/'?'index.html':nome);r.setHeader('Content-Type',f.endsWith('.html')?'text/html':f.endsWith('.js')?'application/javascript':'text/plain');r.end(fs.readFileSync(f));}catch(e){r.statusCode=404;r.end('não encontrado');}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.ZICO_CHROME});let checks=0;
 const check=(v,m)=>{assert(v,m);checks++;console.log('PASS '+m);};
 try{for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await ctx.newPage(),erros=[],calls=[];
  // O contexto bloqueia SW de propósito; iframe sandbox gera este aviso do próprio isolamento.
  p.on('pageerror',e=>{if(!/Service worker is disabled because the context is sandboxed/.test(e.message))erros.push(e.message);});
  await p.addInitScript(()=>{if(window.top!==window)return;if(!localStorage.getItem('zicoai_cfg'))localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'FAKE_ONLY',aparelho:'Teste',cerebro:'pc',capricho:'nunca',pcModelo:'preservar-config'}));});
  await p.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('marked')?'window.marked={parse:s=>s,Renderer:function(){},setOptions:()=>{}};':'window.DOMPurify={sanitize:s=>s,addHook:()=>{}};'}));
  await p.route('https://fonts.**',r=>r.abort());
  await p.route('https://example.invalid/brain',async r=>{const q=r.request().postDataJSON();calls.push(q);let d={ok:true};if(q.acao==='chats')d.chats=[];if(q.acao==='projetos')d.projetos=[];if(q.acao==='tarefas')d.tarefas=[];if(q.acao==='aparelhosRapido')d.aparelhos=[];if(q.acao==='chat')d={ok:true,chatId:'teste',resposta:'Resposta fictícia para verificar o seletor.',cerebro:q.cerebro==='auto'?'Gemini':q.cerebro,passos:[]};await r.fulfill({json:d});});
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  check(await p.locator('#nomeModelo').innerText()==='🧠 Auto',width+': inicia no Auto apesar de preferência antiga PC');
  check(await p.locator('#txtCapricho').innerText()==='ligado',width+': Capricho inicia ligado');
  const conf=await p.evaluate(()=>JSON.parse(localStorage.getItem('zicoai_cfg')));check(conf.pcModelo==='preservar-config'&&conf.pin==='FAKE_ONLY',width+': configuração de conexão preservada');
  await p.locator('#bModelo').click();await p.locator('[data-c="pc"]').click();
  check(await p.locator('#nomeModelo').innerText()==='🧠 PC de casa'&&await p.locator('#cAgente').isDisabled(),width+': escolha PC fica visível e desabilita agente');
  await p.locator('#txt').fill('me explica uma ideia');await p.locator('#bEnviar').click();await p.locator('#bEnviar.parar').waitFor({state:'hidden'});
  const enviados=calls.filter(x=>x.acao==='chat');check(enviados.length===1&&enviados[0].cerebro==='pc'&&enviados[0].capricho===true,width+': pedido leva escolha manual e Capricho');
  check(await p.locator('#nomeModelo').innerText()==='🧠 PC de casa',width+': resposta não altera escolha');
  await p.reload({waitUntil:'domcontentloaded'});check(await p.locator('#nomeModelo').innerText()==='🧠 Auto'&&await p.locator('#txtCapricho').innerText()==='ligado',width+': reload volta para Auto + Capricho');
  await p.locator('#bAnexar').click();await p.locator('#cAgente').click();
  check(await p.locator('#cAgente').getAttribute('class').then(x=>x.includes('on')),width+': agente selecionável em Auto');
  await p.locator('#bModelo').click();await p.locator('[data-c="mac"]').click();
  check(!await p.locator('#cAgente').getAttribute('class').then(x=>x.includes('on'))&&await p.locator('#cAgente').isDisabled(),width+': escolher Mac sai do modo agente');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+': tela sem rolagem horizontal');
  await p.locator('#bModelo').click();await p.screenshot({path:path.join(out,'ZICOAI-V102-SELETOR-'+width+'.png')});
  check(erros.length===0,width+': sem erro JavaScript: '+erros.join(';'));
  await ctx.close();
 }}finally{await browser.close();server.close();}
 console.log(JSON.stringify({checks,fail:0,nota:'UI local; API simulada; não comprova APIs reais'}));
})().catch(e=>{console.error(e.stack);server.close();process.exitCode=1;});
