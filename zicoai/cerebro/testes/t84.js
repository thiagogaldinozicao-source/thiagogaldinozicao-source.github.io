// v104: app -> Apps Script -> ponte PC -> oficina -> rascunho com hash/provas.
const fs=require('fs'),vm=require('vm'),hp=require.resolve('./harness');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const HTML='<!doctype html><html><body><button id="b">Jogar</button></body></html>';
function fixture(){delete require.cache[hp];const H=require(hp),run=s=>vm.runInContext(s,H.ctx);H.PROPS.OFICINA_PC_ATIVA='1';H.ctx.htmlFake=HTML;run(`var __p=[],__drafts=[],__resultado={ok:true,estado:'programando'};
ponte=function(a,d,t,disp){__p.push({a:a,d:d,disp:disp});return a==='oficina_iniciar'?{ok:true,estado:'pendente'}:__resultado;};
var __entradas={};estadoSalvar=function(id,d){__entradas[id]=JSON.parse(JSON.stringify(d));};estadoLer=function(id){return __entradas[id]||null;};
guardarRascunho_=function(c,s,h){__drafts.push({chat:c,slug:s,html:h});};lerRascunho_=function(){return null;};codigoDoApp=function(){return htmlFake;};`);
const req={pin:'1234',acao:'chat',reqId:'rof10412345',modo:'oficina',cerebro:'auto',mensagens:[{role:'user',content:'Crie um jogo HTML com botão jogar'}]};return {H,run,req};}
{
 const {H,run,req}=fixture();const r=H.post(req);ok(r.ok&&r.oficinaId&&r.chatId,'inicia oficina e devolve IDs de acompanhamento');ok(run('__p.length===1 && __p[0].a==="oficina_iniciar" && __p[0].disp==="pc"'),'usa ponte existente do PC sem chamar provedor nuvem');
 const st=H.post({pin:'1234',acao:'oficinaEstado',id:r.oficinaId});ok(st.estado==='programando'&&!st.finalizada,'não conclui durante geração');
 const replay=H.post({...req,chatId:r.chatId});ok(replay.ok&&replay.oficinaId===r.oficinaId&&run('__p.filter(p=>p.a==="oficina_iniciar").length===1'),'retry do mesmo envio acompanha a tarefa sem gerar outra');
 const ocupado=H.post({...req,reqId:'routro123',chatId:r.chatId});ok(!ocupado.ok&&ocupado.naoIniciado&&ocupado.oficinaId===r.oficinaId,'outro pedido na conversa não disputa o rascunho');
 run('__resultado={ok:true,estado:"concluido",html:htmlFake,sha256:hashEntrega_(htmlFake),provas:[{nome:"Clique",ok:true}]};');
 const fim=H.post({pin:'1234',acao:'oficinaEstado',id:r.oficinaId});ok(fim.finalizada&&fim.estado==='concluido'&&fim.appAuto,'só finaliza depois do arquivo com hash e provas');ok(run('__drafts.length===1 && __drafts[0].html===htmlFake'),'salva exatamente o HTML testado como rascunho');
 H.post({pin:'1234',acao:'oficinaEstado',id:r.oficinaId});ok(run('__drafts.length===1'),'poll repetido não grava outra entrega');ok(!H.PROPS['OFICINA_CHAT_'+r.chatId],'libera conversa após salvar a entrega');
}
{
 const {H,run,req}=fixture();const r=H.post({...req,cerebro:'gemini'});ok(!r.ok&&r.selecaoMantida&&run('__p.length===0'),'seleção manual não é trocada por oficina');
 delete H.PROPS.OFICINA_PC_ATIVA;const off=H.post({...req,reqId:'roff12345'});ok(!off.ok&&run('__p.length===0'),'flag desligada não inicia worker');
}
{
 const {H,run,req}=fixture();const r=H.post(req);run('__resultado={ok:true,estado:"nao_recebido"};');const j=H.post({pin:'1234',acao:'oficinaEstado',id:r.oficinaId});
 ok(j.recuperado&&run('__p.filter(p=>p.a==="oficina_iniciar").length===2')&&run('__p.filter(p=>p.a==="oficina_iniciar").every(p=>p.d.id===__p[0].d.id && p.d.html===__p[0].d.html)'),'ponte sem registro recebe novamente somente o mesmo ID e a entrada preservada');
}
{
 const {H,run,req}=fixture();const r=H.post(req);run('for(const k in __entradas)__entradas[k].html+="alterado";__resultado={ok:true,estado:"nao_recebido"};');
 const j=H.post({pin:'1234',acao:'oficinaEstado',id:r.oficinaId});ok(j.finalizada&&j.estado==='erro'&&run('__p.filter(p=>p.a==="oficina_iniciar").length===1'),'entrada alterada não é reenviada sob o ID anterior');
}
{
 const {H,run,req}=fixture();const r=H.post(req);run('__resultado={ok:true,estado:"concluido",html:htmlFake,sha256:"hash-errado",provas:[{nome:"Falsa",ok:true}]};');const j=H.post({pin:'1234',acao:'oficinaEstado',id:r.oficinaId});ok(j.estado==='erro'&&run('__drafts.length===0'),'hash errado não chega ao rascunho');
}
{
 const {H,run,req}=fixture();const r=H.post({...req,appSlug:'repo:calc',mensagens:[{role:'user',content:'Arrume o botão jogar desse HTML'}]});ok(r.ok&&run('__p[0].d.html===htmlFake'),'edição usa código real selecionado');
 run('ponte=function(){throw Error("PC offline");};');const j=H.post({pin:'1234',acao:'oficinaEstado',id:r.oficinaId});ok(j.estado==='incerto'&&!j.finalizada,'queda do PC preserva ID sem afirmar conclusão');
}
{
 const {H,run,req}=fixture();run('lerRascunho_=function(){return {slug:"repo:calc",html:htmlFake};};');
 const r=H.post({...req,chatId:'outrocliente',mensagens:[{role:'user',content:'Arrume o botão jogar desse app'}]});ok(r.ok&&run('__p[0].d.html===htmlFake'),'outro aparelho recupera rascunho da conversa sem depender do seletor local');
}
{
 const {H,run,req}=fixture();run('codigoDoApp=function(){return "<!doctype html><html><body>"+"<p>Exemplo</p>".repeat(1200)+"</body></html>";};');
 const r=H.post({...req,modo:'auto',appSlug:'repo:calc',mensagens:[{role:'user',content:'Corrija um botão nesta calculadora HTML'}]});
 ok(run('__p.every(p=>p.a!=="oficina_iniciar")')&&(r.passos||[]).some(p=>/edição por trechos existente/.test(p)),'Auto mantém app grande no caminho por trechos sem cortar código nem iniciar worker');
}
{
 const {H,run,req}=fixture();run('lerRascunho_=function(){return {slug:"repo:calc",html:htmlFake};};');
 const r=H.post({...req,appSlug:'repo:calc'});ok(r.ok&&r.limparApp&&run('__p[0].d.html!==htmlFake'),'pedido explícito de app novo deixa o anterior preservado e fora da origem');
}
