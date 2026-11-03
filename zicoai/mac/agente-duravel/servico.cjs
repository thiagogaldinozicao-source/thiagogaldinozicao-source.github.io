'use strict';
// Transporte pela ponte existente, sem porta ou serviço residente. Worker finito por fila.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const LEVE='hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M';
const PESADO='hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M';
function criarServico({raiz=process.env.ZICO_OFICINA_DIR||path.join(os.homedir(),'ZicoAI','Oficina-Tarefas'),spawnImpl=cp.spawn,permitido=process.env.ZICO_OFICINA==='1'}={}){
  raiz=path.resolve(raiz);const lock=path.join(raiz,'worker.lock');
  const validar=id=>{if(!/^z[a-z0-9_-]{5,70}$/i.test(String(id)))throw Error('ID inválido');const p=path.join(raiz,id);if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Pasta de tarefa não pode ser um link');return p;};
  function guardar(p,estado){const prefixo='estado-'+Date.now()+'-';let n=0;for(const f of fs.readdirSync(p)){if(f.startsWith(prefixo))n=Math.max(n,Number(f.slice(prefixo.length,-5))+1);}for(;;n++){const nome=prefixo+String(n).padStart(6,'0')+'.json';try{fs.writeFileSync(path.join(p,nome),JSON.stringify({...estado,quando:Date.now()}),{flag:'wx',mode:0o600});return;}catch(e){if(e.code!=='EEXIST')throw e;}}}
  function lerEstado(p){for(const f of fs.readdirSync(p).filter(f=>/^estado-\d+-\d{6}\.json$/.test(f)).sort().reverse()){try{return JSON.parse(fs.readFileSync(path.join(p,f),'utf8'));}catch{}}return {estado:'incerto',erro:'Entrada reservada, resultado ainda não confirmado. Não reenviar como outra tarefa.'};}
  function iniciarWorker(){
    const token=crypto.randomUUID();let fd;
    try{fd=fs.openSync(lock,'wx',0o600);}catch(e){if(e.code==='EEXIST')return;throw e;}
    fs.writeFileSync(fd,token);fs.closeSync(fd);
    try{
      const child=spawnImpl(process.execPath,[__filename,'--worker',raiz,token],{detached:true,stdio:'ignore',windowsHide:true,env:process.env});
      child.on?.('error',()=>{for(const n of fs.readdirSync(raiz).filter(n=>/^z[a-z0-9_-]{5,70}$/i.test(n))){const p=validar(n);if(lerEstado(p).estado==='pendente')guardar(p,{estado:'erro',erro:'Não consegui iniciar o worker Node; origem preservada'});}if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===token)fs.unlinkSync(lock);});child.unref?.();
    }catch(e){if(fs.readFileSync(lock,'utf8')===token)fs.unlinkSync(lock);throw e;}
  }
  function estado(d){
    if(!permitido)throw Error('Oficina local não ativada na ponte; mantive o modo atual');
    const p=validar(d.id);if(!fs.existsSync(p))return {ok:true,id:d.id,estado:'nao_recebido'};
    const r=lerEstado(p);
    if(r.estado==='pendente')iniciarWorker();
    if(r.estado==='concluido'){
      const f=path.join(p,'entregas',d.id,r.nomeArquivo);
      if(path.basename(r.nomeArquivo)!==r.nomeArquivo||!fs.existsSync(f)||hash(fs.readFileSync(f,'utf8'))!==r.sha256)return {ok:true,id:d.id,estado:'erro',erro:'Artefato mudou após os testes; aprovação invalidada'};
      return {ok:true,id:d.id,...r,html:fs.readFileSync(f,'utf8')};
    }
    return {ok:true,id:d.id,...r};
  }
  function iniciar(d){
    if(!permitido)throw Error('Oficina local não ativada na ponte');
    const p=validar(d.id);
    if(typeof d.pedido!=='string'||d.pedido.length<8||d.pedido.length>4000||typeof d.html!=='string'||d.html.length>120000||!/<\/html\s*>\s*$/i.test(d.html))throw Error('Pedido ou HTML inválido');
    const entrada={id:d.id,pedido:d.pedido,html:d.html,provas:Array.isArray(d.provas)?d.provas:null};
    const assinatura=hash(JSON.stringify(entrada));
    fs.mkdirSync(raiz,{recursive:true});
    try{fs.mkdirSync(p);}catch(e){if(e.code!=='EEXIST')throw e;let antiga;try{antiga=JSON.parse(fs.readFileSync(path.join(p,'entrada.json'),'utf8'));}catch{throw Error('Reserva incompleta; conferir antes de tentar de novo');}if(antiga.assinatura!==assinatura)throw Error('ID já reservado por outro pedido');return estado(d);}
    fs.writeFileSync(path.join(p,'entrada.json'),JSON.stringify({...entrada,assinatura}),{flag:'wx',mode:0o600});
    fs.writeFileSync(path.join(p,'origem.html'),d.html,{flag:'wx',mode:0o600});
    guardar(p,{estado:'pendente'});iniciarWorker();return {ok:true,id:d.id,estado:'pendente'};
  }
  async function trabalhar(token){
    if(fs.readFileSync(lock,'utf8')!==token)throw Error('Worker sem reserva');
    try{for(;;){
      const dirs=fs.readdirSync(raiz).filter(n=>/^z[a-z0-9_-]{5,70}$/i.test(n)&&fs.statSync(path.join(raiz,n)).isDirectory());
      const id=dirs.find(n=>lerEstado(path.join(raiz,n)).estado==='pendente');if(!id)break;
      const p=validar(id),entrada=JSON.parse(fs.readFileSync(path.join(p,'entrada.json'),'utf8'));
      try{
        const {criarOficina}=require('./oficina.cjs'),{criarModelos}=require('./ollama.cjs'),{testarHtml}=require('./provas-html.cjs');
        const modelos=criarModelos({leve:process.env.ZICO_MODELO_LEVE||LEVE,pesado:process.env.ZICO_MODELO_CODIGO||PESADO});
        let provas=entrada.provas;
        if(!provas){guardar(p,{estado:'preparando_provas'});provas=await require('./contrato-provas.cjs').gerarProvas({pedido:entrada.pedido,html:entrada.html,modelo:process.env.ZICO_MODELO_CODIGO||PESADO,onReparo:erro=>guardar(p,{estado:'corrigindo_contrato',motivo:erro})});}
        if(!Array.isArray(provas)||!provas.length)throw Error('Sem provas para validar o pedido');
        fs.writeFileSync(path.join(p,'contrato.json'),JSON.stringify(provas),{flag:'wx',mode:0o600});
        const original=await testarHtml({arquivo:path.join(p,'origem.html'),provas});
        if(original.ok)throw Error('As provas já passam na origem; falta reproduzir a mudança solicitada');
        const agente=criarOficina({banco:path.join(p,'checkpoints.sqlite'),saidas:path.join(p,'entregas'),raizes:[p],
          planejar:async d=>{guardar(p,{estado:'planejando'});return modelos.planejar(d);},
          programar:async d=>{guardar(p,{estado:'programando'});return modelos.programar(d);},
          testar:async d=>{guardar(p,{estado:'testando'});return testarHtml(d);}});
        const r=await agente.rodar({id,pedido:entrada.pedido,arquivo:path.join(p,'origem.html'),provas});
        if(r.estado!=='concluido')throw Error(r.erro||'Provas reprovadas; rascunhos preservados');
        guardar(p,{estado:'concluido',sha256:r.entrega.sha256,nomeArquivo:path.basename(r.entrega.arquivo),provas:r.entrega.provas,metricas:r.metricas,publicado:false,provasOrigem:entrada.provas?'fornecidas':'geradas_antes_do_codigo'});
      }catch(e){guardar(p,{estado:'erro',erro:String(e.message).slice(0,500),publicado:false});}
    }}finally{if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===token)fs.unlinkSync(lock);}
  }
  return {iniciar,estado,trabalhar};
}
async function cli(){
  if(process.argv[2]==='--worker'){await criarServico({raiz:process.argv[3],permitido:true}).trabalhar(process.argv[4]);return;}
  const entrada=JSON.parse(fs.readFileSync(0,'utf8').replace(/^\uFEFF/,''));
  const s=criarServico();let r;if(entrada.acao==='oficina_iniciar')r=s.iniciar(entrada.dados);else if(entrada.acao==='oficina_estado')r=s.estado(entrada.dados);else throw Error('Ação não permitida');
  console.log(JSON.stringify(r));
}
if(require.main===module)cli().catch(e=>{console.log(JSON.stringify({ok:false,erro:e.message}));process.exitCode=1;});
module.exports={criarServico};
