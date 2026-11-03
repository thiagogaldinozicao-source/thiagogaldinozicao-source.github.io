// Ativação não pode anunciar oficina disponível sem ponte compatível e progresso persistido.
const vm=require('vm'),hp=require.resolve('./harness');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
function fixture(){delete require.cache[hp];const H=require(hp),run=s=>vm.runInContext(s,H.ctx);run(`ponteViva=function(){return true;};CacheService.getScriptCache().put('ponte_versao','2.5-candidata',60);ponte=function(){return {ok:true,estado:'nao_recebido'};};var __entrada=null;estadoSalvar=function(id,p){__entrada=p;};estadoLer=function(){return __entrada;};`);return {H,run};}
function recusou(run){try{run('ativarOficina104()');return false;}catch{return true;}}
{const {H,run}=fixture();run("CacheService.getScriptCache().put('ponte_versao','2.4',60)");ok(recusou(run)&&!H.PROPS.OFICINA_PC_ATIVA,'ponte antiga não ativa oficina');}
{const {H,run}=fixture();run("ponte=function(){return {ok:false,erro:'Módulo ausente'};}");ok(recusou(run)&&!H.PROPS.OFICINA_PC_ATIVA,'módulo indisponível preserva flag');}
{const {H,run}=fixture();run('estadoLer=function(){return null;}');ok(recusou(run)&&!H.PROPS.OFICINA_PC_ATIVA,'Drive sem confirmação impede ativação');}
{const {H,run}=fixture();const r=run('ativarOficina104()');ok(r.ok&&r.driveConfirmado&&H.PROPS.OFICINA_PC_ATIVA==='1','só ativa após ponte e leitura do progresso confirmadas');}
