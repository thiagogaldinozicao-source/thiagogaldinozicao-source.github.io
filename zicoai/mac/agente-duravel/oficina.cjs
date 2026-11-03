'use strict';
// Oficina opt-in: altera somente cópias novas. Nunca publica nem sobrescreve a origem.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {Annotation,StateGraph,START,END}=require('@langchain/langgraph');
const {SqliteSaver}=require('@langchain/langgraph-checkpoint-sqlite');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const Estado=Annotation.Root(Object.fromEntries(['id','assinatura','pedido','origem','fonte','hashOrigem','diagnostico','plano','candidato','arquivo','provas','historico','tentativa','validacao','estado','erro','entrega','metricas'].map(k=>[k,Annotation()])));
function json(texto){let t=String(texto||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');return JSON.parse(t);}
function criarOficina({banco,saidas,raizes,planejar,programar,testar,interruptAfter}={}){
  if(!banco||!saidas||!Array.isArray(raizes)||!raizes.length)throw Error('Configure banco, saídas e raízes autorizadas');
  if([planejar,programar,testar].some(f=>typeof f!=='function'))throw Error('Adaptadores de modelo e teste obrigatórios');
  const roots=raizes.map(r=>fs.realpathSync(r));
  const dentro=(p,r)=>p===r||p.startsWith(r+path.sep);
  const lerOrigem=arq=>{const p=fs.realpathSync(arq);if(!roots.some(r=>dentro(p,r))||path.extname(p).toLowerCase()!=='.html')throw Error('Arquivo HTML fora das raízes autorizadas');if(fs.statSync(p).size>120000)throw Error('HTML grande: selecione trechos antes desta oficina');return {origem:p,fonte:fs.readFileSync(p,'utf8')};};
  fs.mkdirSync(path.dirname(banco),{recursive:true});fs.mkdirSync(saidas,{recursive:true});
  const output=fs.realpathSync(saidas),checkpointer=SqliteSaver.fromConnString(banco);
  // Trava de um processo e reserva exclusiva em disco: uma segunda instância não repete efeitos.
  const ocupadas=new Set();
  function origemIgual(s){const atual=lerOrigem(s.origem);if(hash(atual.fonte)!==s.hashOrigem)throw Error('Origem mudou durante a tarefa; preservada, precisa de nova revisão');}
  function salvar(s){
    const pasta=path.join(output,s.id);fs.mkdirSync(pasta,{recursive:true});
    if(!dentro(fs.realpathSync(pasta),output))throw Error('Saída fora da oficina');
    const arquivo=path.join(pasta,'candidato-'+s.tentativa+'-'+hash(s.candidato).slice(0,12)+'.html');
    try{fs.writeFileSync(arquivo,s.candidato,{flag:'wx',mode:0o600});}
    catch(e){if(e.code!=='EEXIST'||fs.lstatSync(arquivo).isSymbolicLink()||fs.readFileSync(arquivo,'utf8')!==s.candidato)throw Error('Conflito no artefato; nada sobrescrito');}
    return arquivo;
  }
  const grafo=new StateGraph(Estado)
    .addNode('examinar',async s=>{origemIgual(s);return {diagnostico:await testar({arquivo:s.origem,provas:s.provas}),estado:'examinado'};})
    .addNode('planejar',async s=>{
      const plano=await planejar({pedido:s.pedido,arquivo:path.basename(s.origem),trecho:s.fonte.slice(0,24000),falhasComprovadas:s.diagnostico});
      if(!Array.isArray(plano.etapas)||!plano.etapas.length||plano.etapas.length>8||plano.etapas.some(x=>typeof x!=='string'||x.length>1000)){const e=Error('Plano inválido: '+JSON.stringify({quantidade:plano.etapas?.length,tipos:Array.isArray(plano.etapas)?plano.etapas.map(x=>typeof x):[],maiorEtapa:Array.isArray(plano.etapas)?Math.max(...plano.etapas.map(x=>String(x).length)):0}));e.metrica=plano.metrica;throw e;}
      return {plano:plano.etapas,estado:'planejado',metricas:[plano.metrica].filter(Boolean)};
    })
    .addNode('programar',async s=>{
      origemIgual(s);
      let candidato,erroEdicao='',metricas=[...(s.metricas||[])];
      for(let n=0;n<2;n++){
        const r=await programar({pedido:s.pedido,plano:s.plano,fonte:s.fonte,candidato:s.candidato||'',contratoProvas:s.provas,falhas:s.validacao||s.diagnostico||null,erroEdicaoAnterior:erroEdicao});
        if(r.metrica)metricas.push({...r.metrica,reparoFormato:n>0});
        try{
          candidato=s.fonte;
          if(!Array.isArray(r.edicoes)||!r.edicoes.length||r.edicoes.length>12)throw Error('Edições ausentes ou inválidas');
          for(const e of r.edicoes){
            if(typeof e.antes!=='string'||!e.antes||typeof e.depois!=='string'||e.antes===e.depois||candidato.split(e.antes).length!==2)throw Error('Trecho ANTES deve existir uma única vez na origem; copie aspas, espaços e quebras EXATOS. Trecho recebido: '+String(e.antes||'').slice(0,140));
            candidato=candidato.replace(e.antes,()=>e.depois);
          }
          if(!/<\/html\s*>\s*$/i.test(candidato)||candidato.length<s.fonte.length*.85||candidato.length>240000)throw Error('Arquivo incompleto ou mudança excessiva');
          return {candidato,tentativa:(s.tentativa||0)+1,estado:'candidato',metricas};
        }catch(e){erroEdicao=e.message;if(n===1)throw e;}
      }
    })
    .addNode('salvar',async s=>{origemIgual(s);return {arquivo:salvar(s),estado:'rascunho'};})
    .addNode('testar',async s=>{
      origemIgual(s);
      if(fs.readFileSync(s.arquivo,'utf8')!==s.candidato)throw Error('Artefato mudou antes do teste');
      const r=await testar({arquivo:s.arquivo,provas:s.provas});
      // Aceita somente resultados do adaptador real; o texto do modelo nunca aprova.
      const passou=r?.ok===true&&Array.isArray(r.provas)&&r.provas.length===s.provas.length&&r.provas.every((p,i)=>p.ok===true&&p.nome===s.provas[i].nome);
      return {validacao:{ok:passou,provas:r?.provas||[],erro:r?.erro||''},historico:[...(s.historico||[]),{tentativa:s.tentativa,hash:hash(s.candidato),arquivo:s.arquivo,ok:passou,provas:r?.provas||[]}],estado:passou?'testado':'teste_falhou'};
    })
    .addNode('entregar',async s=>{
      origemIgual(s);
      if(!s.validacao?.ok||fs.readFileSync(s.arquivo,'utf8')!==s.candidato)throw Error('Entrega sem prova ou arquivo alterado');
      return {estado:'concluido',entrega:{arquivo:s.arquivo,sha256:hash(s.candidato),origemPreservada:true,provas:s.validacao.provas,publicado:false}};
    })
    .addNode('incompleto',async()=>({estado:'nao_concluido',erro:'Duas candidatas testadas sem aprovação. Rascunhos e provas preservados.'}))
    .addEdge(START,'examinar').addEdge('examinar','planejar').addEdge('planejar','programar').addEdge('programar','salvar').addEdge('salvar','testar')
    .addConditionalEdges('testar',s=>s.validacao.ok?'entregar':s.tentativa<2?'programar':'incompleto')
    .addEdge('entregar',END).addEdge('incompleto',END)
    .compile({checkpointer,...(interruptAfter?{interruptAfter}:{})});
  const config=id=>({configurable:{thread_id:id},durability:'sync',recursionLimit:20});
  async function consultar(id){validarId(id);return (await grafo.getState(config(id))).values||{};}
  function validarId(id){if(!/^z[a-z0-9_-]{5,70}$/i.test(String(id)))throw Error('ID de oficina inválido');}
  async function rodar(req){
    validarId(req.id);
    if(ocupadas.has(req.id))throw Error('Tarefa já em execução');
    const trava=path.join(output,req.id+'.lock');let fd;
    try{fd=fs.openSync(trava,'wx',0o600);}catch(e){throw Error('Tarefa reservada por outra execução; se houve queda, revisar a trava antes de retomar');}
    ocupadas.add(req.id);
    try{
      const origem=lerOrigem(req.arquivo);
      if(typeof req.pedido!=='string'||req.pedido.length<5||req.pedido.length>4000)throw Error('Pedido inválido');
      if(!Array.isArray(req.provas)||!req.provas.length||req.provas.length>12||req.provas.some(p=>!p.nome||!Array.isArray(p.conferir)||!p.conferir.length)||new Set(req.provas.map(p=>p.nome)).size!==req.provas.length)throw Error('Defina provas observáveis, com nomes únicos');
      const assinatura=hash(JSON.stringify({pedido:req.pedido,origem:origem.origem,provas:req.provas}));
      const anterior=await consultar(req.id);
      if(anterior.id){
        if(anterior.assinatura!==assinatura)throw Error('ID já usado por outro pedido ou prova');
        origemIgual(anterior);
        if(anterior.estado==='concluido'&&(!fs.existsSync(anterior.arquivo)||fs.readFileSync(anterior.arquivo,'utf8')!==anterior.candidato))throw Error('Entrega anterior mudou ou não existe; aprovação antiga não vale para outro arquivo');
        if(['concluido','nao_concluido'].includes(anterior.estado))return anterior;
        return await grafo.invoke(null,config(req.id));
      }
      return await grafo.invoke({id:req.id,assinatura,pedido:req.pedido,...origem,hashOrigem:hash(origem.fonte),provas:req.provas,tentativa:0,historico:[],estado:'novo'},config(req.id));
    }finally{ocupadas.delete(req.id);if(fd!==undefined){fs.closeSync(fd);fs.unlinkSync(trava);}} // só a trava criada por esta chamada, nunca arquivos do usuário
  }
  return {rodar,consultar,grafo,checkpointer};
}
module.exports={criarOficina,json,hash};
