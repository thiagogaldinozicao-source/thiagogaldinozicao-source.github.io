const {chromium}=require(process.env.PW);const http=require('http'),fs=require('fs'),path=require('path');
const dir=process.argv[2], out=process.argv[3];
const srv=http.createServer((q,r)=>{const f=path.join(dir,q.url.split('?')[0]==='/'?'index.html':q.url.split('?')[0]);fs.readFile(f,(e,b)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.png')?'image/png':'application/javascript'});r.end(b);});}).listen(0,async()=>{
 const b=await chromium.launch(); const erros=[];
 for (const w of [390,1440]) { const p=await b.newPage({viewport:{width:w,height:844}}); p.on('pageerror',e=>erros.push(e.message));
 await p.addInitScript(()=>{ if(window.top!==window) return; localStorage.setItem('zicoai_cfg',JSON.stringify({url:'https://example.invalid/brain',pin:'x',aparelho:'T',cerebro:'auto'}));});
 await p.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:r.request().url().includes('marked')?'window.marked={parse:s=>s,Renderer:function(){},setOptions:()=>{}};':r.request().url().includes('purify')?'window.DOMPurify={sanitize:s=>s,addHook:()=>{}};':''}));
 await p.route('https://fonts.**',r=>r.abort());
 await p.route('https://example.invalid/brain',r=>{const q=r.request().postDataJSON();let d={ok:true};if(q.acao==='chats')d.chats=[];if(q.acao==='projetos')d.projetos=[];if(q.acao==='tarefas')d.tarefas=[];if(q.acao==='aparelhosRapido')d.aparelhos=[{nome:'Mac',ok:true}];if(q.acao==='navegar')d.tela=null;r.fulfill({json:d});});
 await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500);
 const n=await p.locator('.atalho').count(); await p.screenshot({path:out+'-'+w+'.png'});
 await p.locator('.atalho').first().click(); await p.waitForTimeout(300); const navAberto=await p.evaluate(()=>!document.getElementById('mNav').hidden);
 console.log(w,'atalhos',n,'navegadorAbriu',navAberto,'semEstouro',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); await p.close(); }
 console.log('erros',JSON.stringify(erros)); await b.close(); srv.close(); });
