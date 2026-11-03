// Contratos atuais que justificam a migração dos fixtures antigos; sem APIs reais.
const H=require('./harness'),vm=require('vm');const run=s=>vm.runInContext(s,H.ctx);
const ok=(v,m)=>{console.log((v?'PASS ':'FAIL ')+m);if(!v)process.exitCode=1;};
ok(run('PC_MODELOS_PONTE.length===2 && PC_MODELOS_PONTE[0]===PC_MODELO_OPUS && PC_MODELOS_PONTE[1]===PC_MODELO_9B'),'lista pesada usa exatamente os dois destilados configurados');
ok(run('PC_MODELOS_LEVE.indexOf("qwen3.5:9b")>=0'),'9B oficial continua disponível no caminho leve');
H.ctx.aba('aulas').appendRow(['D09','D','Agente interno da ZicoAI','agente tarefa segundo plano','O agente usa ferramentas com provas','Como o agente interno salva o trabalho em etapas.','GitHub']);
run('BM25_AULAS=null; VETORES_AULAS=null;');
ok(run('aulasPara("manda o agente fazer essa tarefa em segundo plano",2).every(x=>x[0]!=="D09")'),'pedido comum de agente não injeta aula interna D');
ok(run('aulasPara("Na ZicoAI, como o agente faz uma tarefa em segundo plano?",2).some(x=>x[0]==="D09")'),'manutenção explícita da ZicoAI recupera a aula interna correta');
H.ctx.exRuim=['d','como responder cliente','resposta boa','Groq','geral','','estudo (revisar)'];
H.ctx.exBom=['d','como responder cliente','resposta boa','Groq','geral','','👍 Thiago'];
ok(!run('exemploElegivelExportacao_(exRuim)')&&run('exemploElegivelExportacao_(exBom)'),'treino distingue candidato de aprovação explícita');
H.fetchLog.length=0;H.setFetch(()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({choices:[{message:{content:'```js\nfunction soma(a,b){return a+b;}\n```'}}]})}));
H.post({pin:'1234',acao:'chat',cerebro:'groq',capricho:false,mensagens:[{role:'user',content:'corrige um bug no código javascript: function soma(a,b){return a-b}'}]});
const chamadas=H.fetchLog.filter(c=>c.body&&c.body.messages&&/groq/.test(c.u));
ok(chamadas.length>0&&chamadas.every(c=>/gpt-oss/.test(c.body.model)&&c.body.reasoning_effort==='high'),'seleção explícita Groq em código realmente envia reasoning_effort high');
