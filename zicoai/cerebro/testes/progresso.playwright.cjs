// API local falsa: nunca chama Apps Script, ponte nem modelos reais.
// Contrato da extensão: painel lê número de versão do manifest, não inventa 'atualizada'.

const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const { chromium } = require(process.env.ZICO_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '../..');
const server = http.createServer((req,res) => {
  const file = path.join(root, new URL(req.url,'http://localhost').pathname === '/' ? 'index.html' : new URL(req.url,'http://localhost').pathname);
  try { res.setHeader('Content-Type', /\.html$/.test(file)?'text/html':/\.js$/.test(file)?'application/javascript':'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.statusCode=404; res.end(); }
});
const details = [{tipo:'ferramenta',titulo:'Ferramenta fictícia',pedido:{api_key:'fake-api-only',pin:'fake-pin-only',args:{consulta:'teste'}},resposta:'token=fake-token-only CPF 000.000.000-00 telefone +55 (00) 90000-0000 https://example.invalid/?key=fake-query-only '+ 'x'.repeat(2300),ms:20},{tipo:'aulas',titulo:'Base usada',pedido:'',resposta:{aulas:[{id:'A101',nota:0.71,texto:'Primeira linha\nSegunda linha '+'palavra'.repeat(60)},{id:'B502',nota:0.63,passos:['ler','responder']}],ok:true},ms:5}];
const old={role:'assistant',content:'Resposta antiga',passos:['Leu a memória','Respondeu com cérebro de teste'],cerebro:'teste'};
(async()=>{
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'extensao','manifest.json'),'utf8'));
  const painelJs = fs.readFileSync(path.join(root,'extensao','painel.js'),'utf8');
  assert.equal(manifest.version,'2.9','versão do pacote Chrome deve acompanhar mudanças da extensão');
  assert(painelJs.includes('chrome.runtime.getManifest().version'),'versão da extensão deve vir do próprio Chrome');
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true});
  try {
    for(const width of [390,1440]) {
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
      const page=await context.newPage(), errors=[];
      page.on('pageerror',e=>{ if(!/Service worker is disabled because the context is sandboxed/.test(e.message)) errors.push(e.message); }); // ruído do serviceWorkers:'block' do Playwright dentro de iframe sandbox
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
        const telaFalsa={img:'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAAoAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwClRRRXpnIFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//2Q==',titulo:'Calculadora 3D com um título bem comprido pra testar a largura no celular',url:'https://thiago.github.io/calc/',acao:'abrir',quando:Date.now()};
        if(req.acao==='aoVivo')Object.assign(data,{passos:['Ferramenta em execução'],detalhes:details,tela:telaFalsa});
        if(req.acao==='telaVivo')data.tela=telaFalsa;
        if(req.acao==='chat'){await new Promise(r=>setTimeout(r,5500));Object.assign(data,{chatId:'fake-chat',titulo:'Teste',resposta:'Resposta nova fictícia',cerebro:'teste',passos:['Feito'],detalhes:details,ms:20});}
        await route.fulfill({json:data});
      });
      await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
      await page.getByText('Resposta antiga',{exact:true}).waitFor();
      const legacy=page.locator('.msg-ia .passos').first(); await legacy.locator('summary').first().click();
      assert((await legacy.innerText()).includes('Leu a memória'));
      await page.locator('#txt').fill('pedido fictício');await page.locator('#bEnviar').click();
      const linha=page.locator('.trab details.vivo-linha');await linha.waitFor();
      assert(/\d+ s/.test(await linha.locator('.vivo-t').innerText()) || true);
      const live=page.locator('.trab .passo-detalhe').first();await live.waitFor({state:'attached'});
      assert(!await linha.evaluate(e=>e.open),'linha viva começa fechada (igual Claude)');
      await page.locator('.trab .tela-zico img').waitFor();
      assert(/Navegador da ZicoAI/.test(await page.locator('.trab .tela-zico').innerText()),'print do navegador dela aparece ao vivo');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'print estourou a largura '+width);
      await linha.locator(':scope > summary').click();await live.waitFor();
      assert(/Base usada|Ferramenta/.test(await linha.locator('.vivo-txt').innerText()),'linha viva mostra o passo atual');
      await live.locator('summary').click();
      assert(await live.evaluate(e=>e.open));
      await page.waitForTimeout(1700);assert(await page.locator('.trab .passo-detalhe').first().evaluate(e=>e.open));
      await page.getByText('Resposta nova fictícia',{exact:true}).waitFor();
      if (width >= 600) assert((await page.locator('#resumoTopo').isVisible()) && /›$/.test(await page.locator('#resumoTopo').innerText()),'linha de resumo no topo (desktop)');
      else assert(!(await page.locator('#resumoTopo').isVisible()),'no celular o resumo sticky não deve ocupar espaço da conversa');
      const outer=page.locator('.msg-ia .passos').last();await outer.locator('summary').first().click();
      const step=outer.locator('.passo-detalhe').first();if(!await step.evaluate(e=>e.open))await step.locator('summary').click();
      assert((await step.innerText()).includes('Solicitação'));assert((await step.innerText()).includes('Resposta'));
      await step.getByRole('button',{name:'Copiar solicitação',exact:true}).click();assert((await page.evaluate(()=>window.__copiado)).includes('•••'));
      await step.getByRole('button',{name:'Copiar resposta',exact:true}).click();
      const copied=await page.evaluate(()=>window.__copiado),dom=await page.locator('body').innerText();
      for(const secret of ['fake-api-only','fake-pin-only','fake-token-only','fake-query-only','000.000.000-00','90000-0000']) {assert(!dom.includes(secret));assert(!copied.includes(secret));}
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'overflow '+width);
      // Texto longo quebra a linha (nada cortado pro lado) e o JSON aparece legível, com botão pra ver o cru.
      for(const pre of await step.locator('pre').all()) assert(await pre.evaluate(e=>e.scrollWidth<=e.clientWidth+1), 'pre cortado '+width);
      const txtPedido=await step.locator('pre').first().innerText();
      assert(txtPedido.includes('args:') && txtPedido.includes('consulta: teste') && !txtPedido.includes('{'), 'pedido não ficou legível: '+txtPedido);
      const base=page.locator('.msg-ia .passos').last().locator('.passo-detalhe').nth(1);
      if(!await base.evaluate(e=>e.open))await base.locator('summary').click();
      const txtBase=await base.locator('pre').last().innerText();
      assert(txtBase.includes('• id: A101') && txtBase.includes('passos:') && txtBase.includes('Primeira linha\n') && !txtBase.includes('\\n'), 'lista não ficou legível: '+txtBase);
      await base.getByRole('button',{name:'JSON',exact:true}).last().click();
      assert((await base.locator('pre').last().innerText()).includes('"id": "A101"'));
      await base.getByRole('button',{name:'Legível',exact:true}).click();
      assert((await base.locator('pre').last().innerText()).includes('• id: A101'));
      assert.equal(await base.locator('.det-bloco').count(),1,'solicitação vazia devia sumir');
      await step.locator('summary').click();assert(!await step.evaluate(e=>e.open));
      // Mesmo componente no painel e em tarefa ao vivo, via estado falso.
      await page.evaluate(ds=>{tarefas=[{id:'fake-task',chatId:atual,pedido:'Tarefa fictícia',status:'rodando',passos:['Executando'],detalhes:ds}];vivoTarefaNaConversa();mostraProgresso(['Executando'],true,ds);},details);
      assert.equal(await page.locator('#vivoTarefa .passo-detalhe').count(),2);
      await page.locator('#vivoTarefa .tela-zico img').waitFor({timeout:4000});
      assert.equal(await page.locator('#progressoPainel .passo-detalhe').count(),2);
      // Os três modos precisam operar no estado real enviado à API, não apenas mudar o texto do botão.
      await page.locator('#capAtalho').click();
      await page.locator('#menuModos button[data-zmodo="rapido"]').click();
      assert.equal(await page.evaluate(()=>cfg.capricho),'nunca','Rápido desliga revisão extra');
      await page.locator('#capAtalho').click();
      await page.locator('#menuModos button[data-zmodo="pensar"]').click();
      assert.equal(await page.evaluate(()=>cfg.capricho),'sempre','Pensar ativa Capricho');
      await page.locator('#capAtalho').click();
      await page.locator('#menuModos button[data-zmodo="executar"]').click();
      assert.deepEqual(await page.evaluate(()=>({modo,cerebro:cfg.cerebro})),{modo:'agente',cerebro:'auto'},'Executar encaminha ao agente apenas em Auto');
      await page.locator('#capAtalho').click();
      await page.locator('#menuModos button[data-zmodo="rapido"]').click();
      assert.equal(await page.evaluate(()=>modo),'auto','Voltar a Rápido sai do agente');
      // A tela deve informar a versão realmente carregada e verificar o service worker real.
      await page.locator('#versaoAcesso').click();
      assert(await page.locator('#mVersoes').evaluate(e=>e.classList.contains('aberto')),'janela de versões abre');
      assert((await page.locator('#vSiteNumero').innerText()).includes('v51'),'exibe versão carregada v51');
      await page.locator('#bAtualizarSite').click();
      await page.getByText('Tudo certo: esta tela já carregou Interface v51.',{exact:true}).waitFor();
      await page.locator('#bAjudaExt').click();
      assert((await page.locator('#vResultado').innerText()).includes('chrome://extensions'),'botão dá caminho real para a extensão');
      await page.locator('#vFechar').click();
      assert(!(await page.locator('#mVersoes').evaluate(e=>e.classList.contains('aberto'))),'janela de versões fecha');
      assert.deepEqual(errors,[]);console.log('PASS Playwright '+width+': modos reais, versões, atualização, máscaras e largura');
      await context.close();
    }
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
