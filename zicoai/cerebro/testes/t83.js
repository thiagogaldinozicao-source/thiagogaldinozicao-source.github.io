// v103.8: a aprovação pertence à entrega validada, não ao checklist do modelo.
const fs=require('fs'),vm=require('vm'),hp=require.resolve('./harness');
const ok=(v,m)=>{console.log((v?'PASS ':'FAIL ')+m);if(!v)process.exitCode=1;};
const HTML='<!doctype html><html><head><title>Jogo fictício</title></head><body><button id="jogar">Jogar</button></body></html>';
function fixture(estado,testado,seq){
 delete require.cache[hp];const H=require(hp),run=s=>vm.runInContext(s,H.ctx);H.ctx.__html=HTML;H.ctx.__estado=estado;H.ctx.__testado=testado;H.ctx.__respostas=seq||[{ferramenta:'calcular',args:{conta:'2+3'}},{resposta:'```html\n'+HTML+'\n```'}];
 run(`var __updates=[],__salvos=[],__validado='',__i=0,__apagados=0;
 estadoLer=function(){return null;};estadoSalvar=function(id,e){__salvos.push(JSON.parse(JSON.stringify(e)));};estadoApagar=function(){__apagados++;};tarefaCancelada=function(){return false;};
 atualizarTarefa=function(id,t){__updates.push(t);};avisarPai=function(){};
 contextoAulas=function(){return '';};montarSistema=function(){return 'Sistema fictício';};
 temCerebro=function(n){return n==='groq';};motivoNaoCabe=function(){return '';};estimarTokens=function(){return 100;};prefereModelosLocais_=function(){return false;};
 chamarCompat=function(){var x=__respostas[Math.min(__i++,__respostas.length-1)];return typeof x==='string'?x:JSON.stringify(x);};
 programadora=function(r){__validado=r.texto;return Object.assign({},r,{texto:r.texto+'\\nEstado de teste: '+__estado,testado:__testado,validacao:{estado:__estado}});};
 `);
 return {H,run,rodar:p=>{run('agente("tf-prova1038",'+JSON.stringify(p||'Cria um jogo em HTML com botão jogar')+',null,"simulador")');return run('__updates.filter(x=>x.status).at(-1)');}};
}
for(const estado of ['falhou','nao_testado','sintaxe','executado']){
 const {run,rodar}=fixture(estado,false),r=rodar();
 ok(r?.status==='erro'&&!/Concluída com/.test(r.passos||''),estado+': tarefa não é concluída sem prova aprovada');
 ok(r?.resultado?.includes(HTML),estado+': artefato permanece na resposta para revisão');
 ok(run('__apagados===0 && __salvos.some(s=>s.entregaPendente && s.entregaPendente.validacao.estado===__estado)'),estado+': entrega e estado ficam recuperáveis');
}
{
 const {run,rodar}=fixture('aprovado',true),r=rodar();ok(r?.status==='concluída','prova aprovada permite conclusão');ok(r?.resultado?.includes(HTML)&&run('__apagados')===1,'entrega aprovada conserva o código e encerra o estado temporário');
}
{
 const {rodar}=fixture('aprovado',false),r=rodar();ok(r?.status==='erro','estado aprovado sem confirmação do teste não basta');
}
{
 const {rodar}=fixture('falhou',false,[{resposta:'Entendido, chefe. Tmj!'}]),r=rodar();ok(r?.status==='erro'&&/não entregou código/.test(r.resultado),'confirmação vazia continua bloqueada');
}
{
 const raw='```html\n'+HTML+'\n```';const {run,rodar}=fixture('falhou',false,[raw,{resposta:'Entendido, chefe. Tmj!'}]);const r=rodar();
 ok(run('__validado')===raw,'HTML anterior ao reparo de formato é recuperado e validado');
 ok(r?.status==='erro'&&r?.resultado?.includes(HTML),'revisão vazia não apaga arquivo nem declara sucesso');
}
{
 const raw='```html\n'+HTML+'\n```';const {run,rodar}=fixture('aprovado',true,[{resposta:raw},{resposta:'Entendido, chefe. Tmj!'}]);
 run("estadoLer=function(){return {msgs:[{role:'system',content:'Simulador'},{role:'user',content:'Cria um jogo HTML'}],usadas:1,erroJson:0,log:[],cerebro:'',passos:0,rodadas:0,plano:{etapas:[{fazer:'Entregar jogo',prova:'Prova fictícia',st:'feita'}],conferido:false,conferindo:false}};};");
 const r=rodar();
 ok(run('__validado')===raw,'conferência final sem código recupera o HTML da resposta anterior');
 ok(r?.status==='concluída'&&r?.resultado?.includes(HTML),'só conclui o HTML recuperado depois da validação aprovada');
}
{
 const {run,rodar}=fixture('falhou',false);run("estadoSalvar=function(){throw Error('Drive indisponível no simulador');};");const r=rodar();
 ok(r?.status==='erro'&&r?.resultado?.includes(HTML),'falha do checkpoint não apaga o rascunho da resposta');
}
{
 const {rodar}=fixture('nao_testado',false,[{ferramenta:'calcular',args:{conta:'2+3'}},{resposta:'A conta solicitada resulta em cinco.'}]);const r=rodar('Calcule dois mais três');
 ok(r?.status==='concluída','tarefa sem código pode concluir pelo fluxo existente');
}
