// v100: duelo preserva o participante e não segura a trava de que a ponte precisa.
const vm = require('vm'), hp = require.resolve('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
function fixture() {
  delete require.cache[hp]; const H = require(hp);
  const run = s => vm.runInContext(s, H.ctx);
  H.PROPS.PONTE_SEGREDO = 'pc-ficticio';
  H.CACHE.ponte_visto = String(run('Date.now()')); H.CACHE.ponte_versao = '2.4';
  H.CACHE.ponte_modelos = JSON.stringify(["hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M","hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M"]);
  return { H, run };
}
{
  const {run,H} = fixture();
  ok(run(`PC_MODELO_FORCADO='modelo-ausente';cerebroPCPonte()`) === null, 'modelo forçado ausente não vira o oficial nem o leve');
  run(`var __chamadas=0; chamarCompat=function(){__chamadas++;return 'reserva errada';};SO_ESTE_CEREBRO='pc';`);
  const r=run(`conversar([{role:'user',content:'conserta o código'}],'conserta o código',null,'pc','',false)`);
  ok(!r.ok && run('__chamadas')===0, 'duelo estrito não chama outro cérebro quando o participante sumiu');
  run(`PC_MODELO_FORCADO=null;SO_ESTE_CEREBRO=null;`);
  ok(run(`cerebroPCPonte().modelo`)==="hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M", 'sem modelo forçado a seleção normal continua funcionando');
}
{
  const {H,run}=fixture();
  const fila=[{cer:'pc',pcModelo:'modelo-ausente',ex:'exercicio-ficticio'}];
  H.PROPS.DUELO_FILA=JSON.stringify(fila);
  run('var __rodadas=0;treinoCodigo=function(){__rodadas++;return {ok:true,passou:"sim"};};');
  const r=run('dueloAcademia()');
  ok(r.faltam===1 && /Modelo do PC indisponível/.test(r.feitos.join(' ')), 'fila pausa esperando o modelo exato');
  ok(H.PROPS.DUELO_FILA===JSON.stringify(fila) && run('__rodadas')===0, 'tentativa indisponível não é consumida nem recebe nota');
}
{
  const {H,run}=fixture();
  run('var __novos=0;exerciciosAcademia_=function(){__novos++;throw new Error("não deveria reiniciar");};');
  const r=run('dueloAcademia({triggerUid:"gatilho-antigo"})');
  ok(r.faltam===0 && run('__novos')===0 && !H.PROPS.DUELO_FILA, 'gatilho atrasado não reinicia um duelo concluído');
}
{
  const {H,run}=fixture();
  H.PROPS.PARES_V99='feito';H.PROPS.MEM_REVISADA_V90='feito';
  run(`var __travada=false,__duelos=0,__agendouComTrava=false;
    LockService.getScriptLock=function(){return {tryLock:function(){__travada=true;return true;},releaseLock:function(){__travada=false;}};};
    garantirRotinasTreino=function(){};prepararVetoresAulas=function(){};
    dueloMac=function(){__duelos++;return {feitos:[]};};
    var __novoTrigger=ScriptApp.newTrigger;ScriptApp.newTrigger=function(fn){if(__travada)__agendouComTrava=true;return __novoTrigger(fn);};`);
  run('aprenderSozinha()');
  ok(run('__duelos')===0 && !run('__travada') && !run('__agendouComTrava'), 'memória solta a trava antes de agendar; não executa o duelo dentro dela');
  ok(H.TRIGGERS.filter(x=>x==='dueloMacAgendado').length===1, 'início do duelo automático fica numa execução separada');
  run('aprenderSozinha()');
  ok(H.TRIGGERS.filter(x=>x==='dueloMacAgendado').length===1, 'rodada seguinte de memória não duplica o agendamento');
  run('dueloMacAgendado()');
  ok(run('__duelos')===1 && !H.TRIGGERS.includes('dueloMacAgendado'), 'execução agendada inicia o duelo e remove seu gatilho de partida');
}
{
  const {H,run}=fixture();
  H.PROPS.DUELO_FILA='[{"cer":"pc","ex":"preservar"}]';
  run('var __duelos=0;dueloMac=function(){__duelos++;};');
  const r=run('dueloMacAgendado()');
  ok(run('__duelos')===0 && H.PROPS.DUELO_FILA.includes('preservar') && r.pulou, 'início automático não sobrescreve um duelo já iniciado');
}
{
  const {H,run}=fixture(); H.PROPS.PARES_V99='feito';H.PROPS.MEM_REVISADA_V90='feito';
  run('garantirRotinasTreino=function(){};prepararVetoresAulas=function(){};ScriptApp.newTrigger=function(){throw new Error("falha fictícia ao agendar");};');
  run('aprenderSozinha()');
  ok(!H.PROPS.DUELO_MAC_V100, 'falha de agendamento libera uma nova tentativa na próxima rodada');
}
