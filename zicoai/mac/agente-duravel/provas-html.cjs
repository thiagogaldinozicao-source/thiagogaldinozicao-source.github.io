'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
function playwright(){
  for(const p of [process.env.ZICO_PLAYWRIGHT,path.join(os.homedir(),'ZicoAI/oficina/node_modules/playwright'),'playwright'].filter(Boolean)){try{return require(p);}catch{}}
  throw Error('Playwright não instalado; teste não executado');
}
async function testarHtml({arquivo,provas}){
  const {chromium}=playwright();
  const browser=await chromium.launch({headless:true,...(process.env.ZICO_CHROME?{executablePath:process.env.ZICO_CHROME}:{})});
  const resultados=[];
  try{
    for(const prova of provas){
      const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
      // A cópia recebe somente seu HTML: sem rede, sem perfil real e sem acesso a arquivos locais.
      await ctx.route('**/*',r=>r.abort());
      const page=await ctx.newPage(),erros=[];page.on('pageerror',e=>erros.push(e.message));
      page.setDefaultTimeout(2500);
      const medidas=new Map(),antesUltimaInteracao=new Map();let observacoes=null;
      try{
        await page.setContent(fs.readFileSync(arquivo,'utf8'),{waitUntil:'load',timeout:10000});
        for(const s of prova.passos||[]){
          if(s.clicar||s.preencher||s.teclas)for(const c of prova.conferir||[]){if(c.reinicio)antesUltimaInteracao.set(c.reinicio,await page.locator(c.reinicio).innerText());}
          if(s.clicar)await page.locator(s.clicar).click();
          else if(s.preencher)await page.locator(s.preencher).fill(String(s.valor??''));
          else if(s.teclas)await page.keyboard.press(s.teclas);
          else if(s.medir)medidas.set(s.medir,await page.locator(s.medir).evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})));
          else throw Error('Passo não permitido; somente clicar/preencher/teclas/medir');
        }
        if(!Array.isArray(prova.conferir)||!prova.conferir.length)throw Error('Sem conferência');
        for(const c of prova.conferir){
          if(c.texto){const t=await page.locator(c.texto).innerText();if(c.igual!==undefined?t!==String(c.igual):c.contem!==undefined?!t.includes(String(c.contem)):true)throw Error('Texto diferente do esperado em '+c.texto);}
          else if(c.reinicio){const t=await page.locator(c.reinicio).innerText(),antes=antesUltimaInteracao.get(c.reinicio);if(antes===undefined||antes===String(c.igual))throw Error('Prova de reinício não alterou o estado antes de testar');if(t!==String(c.igual))throw Error('Reinício não voltou ao resultado esperado');}
          else if(c.quantidade){if(await page.locator(c.quantidade).count()!==c.igual)throw Error('Quantidade diferente em '+c.quantidade);}
          else if(c.semRolagemHorizontal){if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Rolagem horizontal');}
          else if(c.temaEscuro){
            const cores=await page.evaluate(()=>{
              const rgb=s=>{const n=s.match(/[\d.]+/g);return n?n.map(Number):[];};let bg=[];
              for(let e=document.body;e;e=e.parentElement){const c=rgb(getComputedStyle(e).backgroundColor);if(c.length===3||c[3]>0.9){bg=c;break;}}
              if(!bg.length)bg=[255,255,255];const fg=rgb(getComputedStyle(document.body).color);
              const luz=c=>(c[0]*.2126+c[1]*.7152+c[2]*.0722)/255;return {fundo:luz(bg),texto:luz(fg)};
            });
            if(!(cores.fundo<.3 && cores.texto>cores.fundo+.2))throw Error('Tema escuro não comprovado pelas cores reais');
          }
          else if(c.geometriaEstavel){
            const antes=medidas.get(c.geometriaEstavel),depois=await page.locator(c.geometriaEstavel).evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
            if(!antes?.length||antes.length!==depois.length||antes.some((r,i)=>Object.keys(r).some(k=>Math.abs(r[k]-depois[i][k])>1))){const container=await page.locator(c.geometriaEstavel).first().evaluate(e=>{const s=getComputedStyle(e.parentElement);return {display:s.display,gridTemplateRows:s.gridTemplateRows,gridAutoRows:s.gridAutoRows,gridTemplateColumns:s.gridTemplateColumns};});observacoes={seletor:c.geometriaEstavel,antes,depois,container};throw Error('Layout mudou após a interação');}
          }else throw Error('Conferência não permitida');
        }
        if(erros.length)throw Error('Erro JavaScript: '+erros[0]);
        if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Rolagem horizontal na tela de 390 px');
        resultados.push({nome:prova.nome,ok:true});
      }catch(e){resultados.push({nome:prova.nome,ok:false,detalhe:e.message.slice(0,350),...(observacoes?{observacoes}:{})});}
      finally{await ctx.close();}
    }
  }finally{await browser.close();}
  return {ok:resultados.length===provas.length&&resultados.every(p=>p.ok),provas:resultados};
}
module.exports={testarHtml};
