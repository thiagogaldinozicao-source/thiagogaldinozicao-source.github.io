const {chromium}=require(process.env.PW);const http=require('http'),fs=require('fs'),path=require('path');
const dir=process.argv[2], out=process.argv[3];
const srv=http.createServer((q,r)=>{const f=path.join(dir,q.url.split('?')[0]==='/'?'index.html':q.url.split('?')[0]);fs.readFile(f,(e,b)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'application/javascript':'application/octet-stream'});r.end(b);});}).listen(0,async()=>{
 const b=await chromium.launch(); const erros=[]; const chamadas=[];
 for (const w of [390,1440]) {
 const ctx=await b.newContext({viewport:{width:w,height:844}}); const p=await ctx.newPage();
 p.on('pageerror',e=>erros.push(w+': '+e.message));
 await p.addInitScript(()=>{localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'x',aparelho:'T',cerebro:'auto'}));});
 await p.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('marked')?'window.marked={parse:s=>s,Renderer:function(){},setOptions:()=>{}};':r.request().url().includes('purify')?'window.DOMPurify={sanitize:s=>s,addHook:()=>{}};':''}));
 await p.route('https://fonts.**',r=>r.abort());
 const img=fs.readFileSync(process.argv[4]).toString('base64');
 await p.route('https://example.invalid/brain',async route=>{const q=route.request().postDataJSON();chamadas.push(q.acao+(q.op?':'+q.op:'')+(q.x!==undefined?'@'+q.x+','+q.y:''));let d={ok:true};
   if(q.acao==='chats')d.chats=[];if(q.acao==='projetos')d.projetos=[];if(q.acao==='tarefas')d.tarefas=[];
   if(q.acao==='aparelhosRapido')d.aparelhos=[{id:'mac',nome:'Mac',ok:true},{id:'pc',nome:'PC',ok:false},{id:'nav',nome:'Chrome',ok:false}];
   if(q.acao==='navegar'){d.tela={img,titulo:'Example Domain',url:'https://example.com/',acao:'Thiago: '+q.op,quando:Date.now()};d.abas=[{titulo:'Example Domain',url:'https://example.com/',ativa:true},{titulo:'Google com um título bem comprido demais',url:'https://google.com',ativa:false}];d.foco=q.op==='tocar';}
   if(q.acao==='telaVivo')d.tela=null;
   await route.fulfill({json:d});});
 await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(2500);
 const pontos=await p.locator('#cdPontos i').count(), verdes=await p.locator('#cdPontos i.ok').count();
 const hdr=await p.evaluate(()=>{const h=document.querySelector('header');return {sw:h.scrollWidth,cw:h.clientWidth,tit:document.getElementById('tituloTopo').getBoundingClientRect().width};});
 await p.screenshot({path:out+'-'+w+'-topo.png',clip:{x:0,y:0,width:w,height:90}});
 await p.click('#bNav'); await p.waitForTimeout(600);
 await p.fill('#nvUrl','example.com'); await p.press('#nvUrl','Enter'); await p.waitForTimeout(700);
 const src=await p.getAttribute('#nvImg','src');
 const box=await p.locator('#nvImg').boundingBox(); await p.mouse.click(box.x+box.width/2, box.y+box.height/4); await p.waitForTimeout(500);
 await p.fill('#nvTexto','oi'); await p.press('#nvTexto','Enter'); await p.waitForTimeout(500);
 await p.click('#nvBaixo'); await p.waitForTimeout(400);
 const abas=await p.locator('.nv-aba').count(); const focado=await p.evaluate(()=>document.activeElement && document.activeElement.id); await p.click('.nv-aba:not(.ativa) span'); await p.waitForTimeout(400); await p.click('.nv-aba-nova'); await p.waitForTimeout(500); await p.click('#nvApagar'); await p.waitForTimeout(400); console.log('abas',abas,'focoDepoisDoToque',focado);
 const larg=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
 await p.screenshot({path:out+'-'+w+'-nav.png'});
 console.log(w,'chip',pontos,verdes,'header',JSON.stringify(hdr),'img',!!src,'semEstouro',larg);
 await ctx.close(); }
 console.log('chamadas',chamadas.filter(c=>/navegar|aparelhos/.test(c)).join(' '));console.log('erros',JSON.stringify(erros));
 await b.close();srv.close();});
