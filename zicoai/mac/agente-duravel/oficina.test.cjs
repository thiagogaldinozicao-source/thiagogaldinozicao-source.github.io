'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {criarOficina}=require('./oficina.cjs');
const HTML='<!doctype html><html><body><button id="b" onclick="this.textContent=\'erro\'">Jogar</button></body></html>';
const FIX={edicoes:[{antes:"this.textContent='erro'",depois:"this.textContent='certo'"}]};
function fixture(extra={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zico-oficina-')),origem=path.join(dir,'projeto');fs.mkdirSync(origem);const arquivo=path.join(origem,'index.html');fs.writeFileSync(arquivo,HTML);
  const req={id:'zoficina123',arquivo,pedido:'Corrigir o botão para mostrar certo',provas:[{nome:'clique',passos:[{clicar:'#b'}],conferir:[{texto:'#b',igual:'certo'}]}]};
  const config={banco:path.join(dir,'checkpoint.sqlite'),saidas:path.join(dir,'saidas'),raizes:[origem],planejar:async()=>({etapas:['Ler','Corrigir','Testar']}),programar:async()=>FIX,testar:async()=>({ok:true,provas:[{nome:'clique',ok:true}]}),...extra};
  return {dir,arquivo,req,config,agent:criarOficina(config)};
}
test('fluxo completo preserva origem, grava cópia e só entrega com provas',async()=>{
  const f=fixture(),r=await f.agent.rodar(f.req);assert.equal(r.estado,'concluido');assert.equal(fs.readFileSync(f.arquivo,'utf8'),HTML);assert.match(fs.readFileSync(r.entrega.arquivo,'utf8'),/certo/);assert.equal(r.entrega.publicado,false);
});
test('duas candidatas reprovadas não concluem nem perdem rascunho',async()=>{
  const f=fixture({testar:async()=>({ok:false,provas:[{nome:'clique',ok:false}]})});const r=await f.agent.rodar(f.req);assert.equal(r.estado,'nao_concluido');assert.equal(r.historico.length,2);assert.ok(fs.existsSync(r.arquivo));assert.equal(r.entrega,undefined);
});
test('teste incompleto ou nome de prova diferente não aprova',async()=>{
  const f=fixture({testar:async()=>({ok:true,provas:[{nome:'outra prova',ok:true}]})});assert.equal((await f.agent.rodar(f.req)).estado,'nao_concluido');
});
test('retoma checkpoint após recriar instância sem repetir modelos nem gravar outra cópia',async()=>{
  let calls=0;const f=fixture({interruptAfter:['salvar'],programar:async()=>{calls++;return FIX;}});const parada=await f.agent.rodar(f.req);assert.equal(parada.estado,'rascunho');
  const reinicio=criarOficina({...f.config,interruptAfter:undefined,programar:async()=>{calls++;throw Error('não deveria chamar');}});const fim=await reinicio.rodar(f.req);assert.equal(fim.estado,'concluido');assert.equal(calls,1);assert.equal(fim.arquivo,parada.arquivo);
  await reinicio.rodar(f.req);assert.equal(calls,1);
});
test('falha temporária no adaptador de teste retoma sem repetir código',async()=>{
  let n=0,calls=0;const f=fixture({programar:async()=>{calls++;return FIX;},testar:async()=>{if(++n===1)throw Error('navegador temporariamente indisponível');return {ok:true,provas:[{nome:'clique',ok:true}]};}});
  await assert.rejects(()=>f.agent.rodar(f.req),/temporariamente/);assert.equal((await f.agent.rodar(f.req)).estado,'concluido');assert.equal(calls,1);
});
test('modificação externa da origem durante a execução não é sobrescrita',async()=>{
  const f=fixture();f.config.programar=async()=>{fs.appendFileSync(f.arquivo,'<!-- trabalho de outra sessão -->');return FIX;};const agente=criarOficina(f.config);await assert.rejects(()=>agente.rodar(f.req),/Origem mudou/);assert.match(fs.readFileSync(f.arquivo,'utf8'),/outra sessão/);
});
test('ANTES ambíguo ou inexistente é recusado antes de gravar',async()=>{
  const f=fixture({programar:async()=>({edicoes:[{antes:'não existe',depois:'x'}]})});await assert.rejects(()=>f.agent.rodar(f.req),/única vez/);assert.equal(fs.readFileSync(f.arquivo,'utf8'),HTML);
});
test('ID não pode trocar pedido e nem provas',async()=>{
  const f=fixture();await f.agent.rodar(f.req);await assert.rejects(()=>f.agent.rodar({...f.req,pedido:'Outra coisa'}),/ID já usado/);await assert.rejects(()=>f.agent.rodar({...f.req,provas:[{nome:'falsa',conferir:[{texto:'body',contem:''}]}]}),/ID já usado/);
});
test('arquivo fora da raiz e ausência de prova são recusados',async()=>{
  const f=fixture();const fora=path.join(f.dir,'fora.html');fs.writeFileSync(fora,HTML);await assert.rejects(()=>f.agent.rodar({...f.req,arquivo:fora}),/fora das raízes/);await assert.rejects(()=>f.agent.rodar({...f.req,provas:[]}),/provas observáveis/);
});
test('concorrência do mesmo ID é bloqueada sem duplicar modelos',async()=>{
  let soltar;const gate=new Promise(r=>{soltar=r;});const f=fixture({planejar:async()=>{await gate;return {etapas:['Corrigir']};}});const rodando=f.agent.rodar(f.req);await assert.rejects(()=>f.agent.rodar(f.req),/execução/);soltar();assert.equal((await rodando).estado,'concluido');
});
test('conflito em arquivo candidato nunca é sobrescrito',async()=>{
  const f=fixture({interruptAfter:['salvar']});const r=await f.agent.rodar(f.req);fs.writeFileSync(r.arquivo,'TRABALHO EXISTENTE');const reinicio=criarOficina({...f.config,interruptAfter:undefined});await assert.rejects(()=>reinicio.rodar(f.req),/Artefato mudou/);assert.equal(fs.readFileSync(r.arquivo,'utf8'),'TRABALHO EXISTENTE');
});
test('aprovação concluída não vale depois de alterar o arquivo entregue',async()=>{
  const f=fixture();const r=await f.agent.rodar(f.req);fs.writeFileSync(r.arquivo,'Alterado depois do teste');await assert.rejects(()=>f.agent.rodar(f.req),/Entrega anterior mudou/);
});
test('provas executam cliques reais e detectam resultado errado em Chromium', {skip:!process.env.ZICO_PLAYWRIGHT},async()=>{
  const {testarHtml}=require('./provas-html.cjs');const f=fixture({testar:testarHtml});const antes=await testarHtml({arquivo:f.arquivo,provas:f.req.provas});assert.equal(antes.ok,false);const r=await f.agent.rodar(f.req);assert.equal(r.estado,'concluido');assert.equal(r.validacao.provas[0].ok,true);
});
test('tema escuro mede cores e reset exige estado alterado antes do clique', {skip:!process.env.ZICO_PLAYWRIGHT},async()=>{
 const {testarHtml}=require('./provas-html.cjs'),f=fixture();
 fs.writeFileSync(f.arquivo,'<!doctype html><html><body style="background:#111;color:#fff"><div id="valor">0</div><button id="mais" onclick="valor.textContent=1">Somar</button><button id="reset" onclick="valor.textContent=0">Zerar</button></body></html>');
 const tema={nome:'Tema',passos:[],conferir:[{temaEscuro:true}]};assert.equal((await testarHtml({arquivo:f.arquivo,provas:[tema]})).ok,true);
 const fraca={nome:'Reset',passos:[{clicar:'#reset'}],conferir:[{reinicio:'#valor',igual:'0'}]};assert.equal((await testarHtml({arquivo:f.arquivo,provas:[fraca]})).ok,false);
 const forte={...fraca,passos:[{clicar:'#mais'},{clicar:'#reset'}]};assert.equal((await testarHtml({arquivo:f.arquivo,provas:[forte]})).ok,true);
 fs.writeFileSync(f.arquivo,'<!doctype html><html><body style="background:white;color:black">dark</body></html>');assert.equal((await testarHtml({arquivo:f.arquivo,provas:[tema]})).ok,false);
});
test('trecho mal copiado pode ser reparado uma vez sem tocar na origem',async()=>{
 let n=0,recebeuMotivo=false;const f=fixture({programar:async r=>{n++;if(n===1)return {edicoes:[{antes:'inventado',depois:'x'}]};recebeuMotivo=/única vez/.test(r.erroEdicaoAnterior);return FIX;}});
 assert.equal((await f.agent.rodar(f.req)).estado,'concluido');assert.equal(n,2);assert.equal(recebeuMotivo,true);assert.equal(fs.readFileSync(f.arquivo,'utf8'),HTML);
});
