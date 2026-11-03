'use strict';
// Contrato gerado ANTES do código. Nenhum JavaScript arbitrário é aceito como prova.
async function gerarProvasUmaVez({pedido,html,modelo,fetchImpl=fetch}){
  if(pedido.length+html.length>14000)throw Error('App grande: selecione trechos antes de preparar as provas');
  const campo={type:'string'};
  const passo={type:'object',properties:{acao:{type:'string',enum:['clicar','preencher','teclas','medir']},seletor:campo,valor:campo},required:['acao','seletor','valor'],additionalProperties:false};
  const conferir={type:'object',properties:{tipo:{type:'string',enum:['texto','quantidade','semRolagemHorizontal','geometriaEstavel','temaEscuro']},seletor:campo,operador:{type:'string',enum:['igual','contem']},valor:campo},required:['tipo','seletor','operador','valor'],additionalProperties:false};
  const format={type:'object',properties:{provas:{type:'array',minItems:1,maxItems:4,items:{type:'object',properties:{nome:campo,passos:{type:'array',maxItems:12,items:passo},conferir:{type:'array',minItems:1,maxItems:4,items:conferir}},required:['nome','passos','conferir'],additionalProperties:false}}},required:['provas'],additionalProperties:false};
  const r=await fetchImpl('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(180000),body:JSON.stringify({model:modelo,stream:false,think:false,format,keep_alive:'5m',options:{temperature:0,num_ctx:8192,num_predict:1600},messages:[{role:'system',content:'Prepare até 4 provas OBJETIVAS para o pedido, antes de editar o HTML. Use seletores CSS existentes quando houver; para app novo defina IDs estáveis que o programador deverá criar. Ao menos uma prova deve ter interação e conferir resultado específico do pedido. Preserve regressões importantes existentes. tipo texto confere TEXTO VISÍVEL, nunca atributo CSS/classe/data-theme. Para tema escuro use tipo temaEscuro (mede as cores reais), sem tentar conferir texto html igual dark. Para zerar, some primeiro e depois zere. Sem JS, sem rede, sem texto vago. Campo valor vazio quando não se aplica. Não aprove nem altere o pedido. A prova de um bug deve falhar na origem. Somente JSON.'},{role:'user',content:JSON.stringify({pedido,html})}]})});
  if(!r.ok)throw Error('Preparação das provas: Ollama HTTP '+r.status);
  const j=await r.json();if(j.error||j.done_reason==='length'||j.prompt_eval_count>=6500)throw Error('Contrato de provas incompleto ou contexto excedido');
  let d;try{d=JSON.parse(j.message.content);}catch{throw Error('Contrato de provas não é JSON válido');}
  if(!Array.isArray(d.provas)||!d.provas.length||d.provas.length>4)throw Error('Contrato sem provas');
  const provas=d.provas.map(p=>({nome:String(p.nome).slice(0,100),passos:(p.passos||[]).map(s=>{
    if(!['clicar','preencher','teclas','medir'].includes(s.acao))throw Error('Passo de prova não permitido');
    return s.acao==='preencher'?{preencher:s.seletor,valor:s.valor}:{[s.acao]:s.acao==='teclas'?s.valor:s.seletor};
  }),conferir:(p.conferir||[]).map(c=>{
    if(c.tipo==='semRolagemHorizontal')return {semRolagemHorizontal:true};
    if(c.tipo==='temaEscuro')return {temaEscuro:true};
    if(c.tipo==='geometriaEstavel')return {geometriaEstavel:c.seletor};
    if(c.tipo==='quantidade'&&/^\d+$/.test(c.valor))return {quantidade:c.seletor,igual:Number(c.valor)};
    if(c.tipo==='texto'&&/^(html|body)$/i.test(c.seletor)&&/^(dark|light|escuro|claro)$/i.test(c.valor))throw Error('Tema não é texto visível: use prova temaEscuro');
    if(c.tipo==='texto'&&c.seletor&&['igual','contem'].includes(c.operador)&&String(c.valor).length)return {texto:c.seletor,[c.operador]:c.valor};
    throw Error('Conferência vazia ou não permitida');
  })}));
  for(const p of provas){
    if(p.conferir.length===1&&p.conferir[0].temaEscuro)p.nome='Tema escuro medido pelas cores reais';
    if(/zerar|reset|limpar|reiniciar/i.test(p.nome)||p.passos.some(s=>/zerar|reset|limpar|reiniciar/i.test(s.clicar||''))){
      if(p.passos.length<2)throw Error('Prova de reinício fraca: altere o estado primeiro, depois clique em zerar/reset e confira o resultado');
      p.conferir=p.conferir.map(c=>c.texto&&c.igual!==undefined?{reinicio:c.texto,igual:c.igual}:c);
    }
  }
  if(!provas.some(p=>p.passos.some(s=>s.clicar||s.preencher||s.teclas)&&p.conferir.some(c=>c.texto||c.reinicio||c.geometriaEstavel)))throw Error('Faltou prova funcional com interação e resultado');
  return provas;
}
async function gerarProvas(o){
  let provas;
  try{provas=await gerarProvasUmaVez(o);}catch(e){
    if(!/reinício fraca|Tema não é texto|Conferência vazia ou não permitida/.test(e.message))throw e;
    if(o.onReparo)o.onReparo(e.message);
    provas=await gerarProvasUmaVez({...o,pedido:o.pedido+'\nCorreção obrigatória do contrato anterior: '+e.message+'. Revise TODO o contrato: texto exige valor visível esperado não vazio; para ausência de rolagem use tipo semRolagemHorizontal, para cores use temaEscuro. Para zerar/reset, altere o estado primeiro e só depois clique em zerar e confira o resultado. Não mude o pedido original.'});
  }
  if(/\b(tema|modo|fundo) escuro\b/i.test(o.pedido)&&!/(não|nao|sem)\s+(tema|modo|fundo) escuro/i.test(o.pedido)&&!provas.some(p=>p.conferir.some(c=>c.temaEscuro)))provas.push({nome:'Tema escuro medido pelas cores reais',passos:[],conferir:[{temaEscuro:true}]});
  return provas;
}
module.exports={gerarProvas};
