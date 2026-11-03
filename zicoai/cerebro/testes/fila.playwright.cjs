// Navegador real, API simulada e dados fictícios; nenhum acesso à conta do usuário.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(process.env.ZICO_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..'),out=process.env.ZICO_TEST_OUT||__dirname;
const server=http.createServer((q,r)=>{try{const f=path.join(root,new URL(q.url,'http://localhost').pathname==='/'?'index.html':new URL(q.url,'http://localhost').pathname);r.setHeader('Content-Type',f.endsWith('.html')?'text/html':'application/javascript');r.end(fs.readFileSync(f));}catch(e){r.statusCode=404;r.end('não encontrado');}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.ZICO_CHROME});let checks=0;
 const check=(v,m)=>{assert(v,m);checks++;console.log('PASS '+m);};
 try{for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await ctx.newPage(),calls=[],pendentes=[],errors=[],history=[];let estado='rodando';
  p.on('pageerror',e=>{if(!/Service worker is disabled because the context is sandboxed/.test(e.message))errors.push(e.message);});
  await p.addInitScript(()=>{if(window.top===window&&!localStorage.getItem('zicoai_cfg'))localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'FAKE_ONLY',cerebro:'pc',capricho:'sempre'}));});
  await p.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('marked')?'window.marked={parse:s=>s,Renderer:function(){},setOptions:()=>{}};':'window.DOMPurify={sanitize:s=>s,addHook:()=>{}};'}));
  await p.route('https://fonts.**',r=>r.abort());
  await p.route('https://example.invalid/brain',async r=>{
   const q=r.request().postDataJSON();calls.push(q);
   if(q.acao==='chat'){pendentes.push({r,q});return;}
   const d={ok:true,chats:[],projetos:[],tarefas:[],aparelhos:[],mensagens:history,passos:[],detalhes:[]};
   if(q.acao==='estadoChat')Object.assign(d,{estado,chatId:'teste'});
   await r.fulfill({json:d});
  });
  const chatCalls=()=>calls.filter(c=>c.acao==='chat');
  const responder=async(text,extra={})=>{const a=pendentes.shift();assert(a,'pedido pendente');history.push(a.q.mensagens.at(-1),{role:'assistant',content:text});await a.r.fulfill({json:{ok:true,chatId:'teste',resposta:text,cerebro:a.q.cerebro,passos:[],...extra}}).catch(()=>{});};
  const enviar=async text=>{await p.locator('#txt').fill(text);await p.locator('#bEnviar').click();};
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(500);
  check(!await p.locator('#mCfg').evaluate(e=>e.classList.contains('aberto')),width+': app configurado não abre Configurar sem pedido');
  await p.locator('#bModelo').click();await p.locator('[data-c="pc"]').click();
  await enviar('cria um app de tarefas');await p.waitForFunction(()=>document.querySelector('#bParar').hidden===false);
  await p.locator('#txt').fill('usa fundo azul');await p.locator('#txt').press('Enter');
  // Celular sem teclado físico: Enter mantém quebra, botão também enfileira.
  if(await p.locator('#txt').inputValue())await p.locator('#bEnviar').click();
  await p.locator('#bModelo').click();await p.locator('[data-c="gemini"]').click();await enviar('coloca salvar local');await enviar('mensagem para remover');
  check(chatCalls().length===1,width+': novos envios não criam chamadas concorrentes');
  check(await p.locator('.fila-item').count()===3,width+': Enter/botão guardam mensagens visíveis na fila');
  p.once('dialog',d=>d.accept('usa fundo verde'));await p.locator('.fila-item').first().getByText('Editar').click();
  await p.locator('.fila-item').last().getByRole('button',{name:'Remover',exact:true}).click();
  check(await p.locator('.fila-item').count()===2&&await p.locator('.fila-item').first().innerText().then(x=>x.includes('verde')),width+': fila permite editar e remover');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+': fila cabe na tela');
  await p.screenshot({path:path.join(out,'ZICOAI-V103-FILA-'+width+'.png')});
  await responder('Primeira entrega fictícia',{appAuto:'repo:calc'});await p.waitForTimeout(150);await p.waitForFunction(()=>document.querySelector('#bParar').hidden===false);
  check(chatCalls().length===2&&chatCalls()[1].mensagens.at(-1).content==='usa fundo verde',width+': primeiro complemento sai na ordem correta');
  check(chatCalls()[1].cerebro==='pc'&&chatCalls()[1].mensagens.some(m=>m.content==='Primeira entrega fictícia'),width+': mantém escolha do envio e usa resposta anterior no histórico');
  await responder('Segunda entrega fictícia');await p.waitForTimeout(150);
  check(chatCalls().length===3&&chatCalls()[2].cerebro==='gemini',width+': terceiro envio mantém sua própria seleção');
  await responder('Terceira entrega fictícia');await p.locator('#bParar').waitFor({state:'hidden'});
  if(width<900)await p.locator('#bMenu').click();
  await p.locator('#bNovo').click();check(!await p.locator('#editando').getAttribute('class').then(x=>(x||'').includes('on')),width+': nova conversa limpa o app antigo');
  await enviar('preciso criar um app novo');await p.waitForTimeout(100);
  check(!chatCalls().at(-1).appSlug,width+': nova conversa não envia calculadora selecionada antes');
  await responder('Novo assunto',{limparApp:true});await p.locator('#bParar').waitFor({state:'hidden'});
  await enviar('pedido demorado');await p.waitForTimeout(100);await enviar('complemento depois do reload');const antes=chatCalls().length;
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(150);
  check(chatCalls().length===antes&&await p.locator('#filaMensagens').innerText().then(t=>t.includes('pendente de conferência')),width+': reload preserva fila e não repete pedido em andamento');
  await p.getByText('Conferir e continuar',{exact:true}).click();await p.waitForTimeout(80);
  check(chatCalls().length===antes,width+': enquanto servidor está rodando não libera o próximo envio');
  // Pedido original terminou no servidor mesmo depois do reload.
  estado='concluido';await responder('Resposta recuperada do servidor');
  await p.getByText('Conferir e continuar',{exact:true}).click();await p.waitForTimeout(150);
  check(chatCalls().length===antes+1&&chatCalls().at(-1).mensagens.some(m=>m.content==='Resposta recuperada do servidor'),width+': confere servidor e continua com resposta recuperada');
  await enviar('complemento após parar');await p.locator('#bParar').click();await p.locator('#bParar').waitFor({state:'hidden'});await p.waitForTimeout(80);
  check(chatCalls().length===antes+1&&await p.locator('#filaMensagens').isVisible(),width+': parar pausa a fila sem descartar o complemento');
  check(errors.length===0,width+': sem erros JavaScript: '+errors.join(';'));
  await ctx.close();
 }}finally{await browser.close();server.close();}
 console.log(JSON.stringify({checks,fail:0,ambiente:'Chrome isolado, API simulada; não comprova aparelhos ou APIs reais'}));
})().catch(e=>{console.error(e.stack);server.close();process.exitCode=1;});
