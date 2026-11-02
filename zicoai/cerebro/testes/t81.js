// v102: seleção manual fixa, Auto com reservas, agentes somente no Auto e privacidade do histórico.
const vm=require('vm'), hp=require.resolve('./harness');
const ok=(v,m)=>{console.log((v?'PASS ':'FAIL ')+m);if(!v)process.exitCode=1;};
const resp=(t,cod=200)=>({getResponseCode:()=>cod,getContentText:()=>cod===200?JSON.stringify({choices:[{message:{content:t}}]}):t,getHeaders:()=>({})});
function fixture(){delete require.cache[hp];const H=require(hp),run=s=>vm.runInContext(s,H.ctx);const calls=[];H.PROPS.MISTRAL_KEY='ficticio';H.PROPS.NVIDIA_KEY='ficticio';H.setFetch((u,o)=>{const b=o?.payload?JSON.parse(o.payload):{};if(b.messages)calls.push({u,b});return resp('Resposta suficientemente longa para conferir seleção e revisão, sem fato comercial nem ação externa.');});run("contextoConectores=function(){return '';};contextoMeusCerebros=function(){return '';};contextoAulas=function(){return '';};resumoDaConversa=function(){return '';};compactarSePrecisar=function(){};codigoDoApp=function(){return null;};listarApps=function(){return [];};");return {H,run,calls,chat:(p,extra={})=>H.post(Object.assign({pin:'1234',acao:'chat',cerebro:'auto',capricho:false,mensagens:[{role:'user',content:p}]},extra))};}
for(const cod of [429,404,503]){
 const {H,chat,calls}=fixture();H.setFetch((u,o)=>{const b=JSON.parse(o.payload);if(b.messages)calls.push({u,b});return resp('falha fictícia',cod);});
 const r=chat('me explica uma ideia',{cerebro:'mistral'});
 ok(!r.ok&&r.selecaoMantida&&/Não troquei/.test(r.erro),'manual '+cod+' explica falha sem escolher outro');
 ok(calls.length>=1&&calls.every(c=>/mistral/.test(c.u)&&c.b.model==='ministral-8b-2512'),'manual '+cod+' não troca nem para modelo reserva do provedor');
}
{
 const {H,chat,calls}=fixture();H.setFetch((u,o)=>{const b=JSON.parse(o.payload);if(b.messages)calls.push({u,b});return /googleapis/.test(u)?resp('falha',503):resp('Resposta da reserva sem executar ação.');});
 const r=chat('me explica uma ideia');ok(r.ok&&/Groq/.test(r.cerebro)&&calls.some(c=>/groq/.test(c.u)),'Auto tenta reserva depois de falha do principal');
}
{
 const {chat,calls}=fixture();const r=chat('explica um conceito simples com exemplo',{cerebro:'gemini',capricho:true});
 ok(r.ok&&calls.length===2&&calls.every(c=>/googleapis/.test(c.u)&&c.b.model==='gemini-3.1-flash-lite'),'manual mantém o mesmo modelo na revisão');
 ok(r.passos.some(p=>/cérebro escolhido|Autorrevisão/.test(p)),'revisão manual não se apresenta como juiz independente');
}
{
 const {chat,calls}=fixture();const r=chat('leia esta foto',{cerebro:'groq',imagem:'data:image/png;base64,TEST_ONLY'});
 ok(!r.ok&&r.selecaoMantida&&/imagens/.test(r.erro)&&calls.length===0,'modelo sem visão recusa foto sem mandar a outro modelo');
}
{
 const {chat,H}=fixture();const r=chat('faz em etapas uma pesquisa extensa',{cerebro:'gemini',modo:'agente'});
 ok(!r.ok&&/agente só entra/.test(r.erro)&&!H.sheets.tarefas?.rows.slice(1).length,'modo Agente rejeita seleção manual');
 const a=chat('faz em etapas uma pesquisa extensa',{modo:'agente'});ok(a.ok&&a.tarefaId,'modo Agente funciona no Auto');
}
{
 const {chat,H}=fixture();H.setFetch(()=>resp('[[TAREFA: arrumar algo em segundo plano]]'));
 const r=chat('me explica o que fazer',{cerebro:'gemini'});ok(r.ok&&/escolha Auto/.test(r.resposta)&&!H.sheets.tarefas?.rows.slice(1).length,'tag TAREFA não contorna a escolha manual');
}
{
 const {chat,H}=fixture();const r=chat('1. leia o código\n2. arrume o bug\n3. teste o app',{appSlug:'repo:teste'});ok(!r.tarefaId&&!H.sheets.tarefas?.rows.slice(1).length,'edição de app continua no chat, sem agente automático');
}
{
 const {H,run,chat,calls}=fixture();run("buscarLinks=function(){return [{titulo:'Fonte',url:'https://example.invalid/fonte'}];};lerPaginas=function(){return ['Fonte de teste sem dados pessoais. '.repeat(30)];};");
 const r=chat('pesquisa novidades de tecnologia',{cerebro:'mistral',modo:'web'});ok(r.ok&&calls.length&&calls.every(c=>/mistral/.test(c.u)),'pesquisa manual usa web e responde com o escolhido');
 ok(r.resposta.includes('https://example.invalid/fonte'),'pesquisa manual entrega a fonte lida');
}
{
 const {chat,calls}=fixture();chat('bom dia chefe',{capricho:true});ok(calls.length===1,'Capricho ligado não duplica chamada em cumprimento');
}
{
 const {chat,calls}=fixture();chat('oi',{mensagens:[{role:'user',content:'CPF fictício 123.456.789-09 e telefone 3599238354'},{role:'assistant',content:'Recebi 123.456.789-09.'},{role:'user',content:'oi'}]});
 ok(calls.length>0&&!JSON.stringify(calls).includes('123.456.789-09')&&!JSON.stringify(calls).includes('3599238354'),'histórico inteiro mascara dados pessoais antes da nuvem');
}
{
 const {H,run}=fixture();run("aba('aulas')");H.sheets.aulas.rows.push(['B999','B','Teste','teste certo','regra','texto','[IGNORAR]']);
 ok(run('indiceAulas().length')===0,'IGNORAR na coluna G sai do índice lexical');
 ok(run("ehProgramacao('cria jogo da cobrinha')&&ehProgramacao('arruma a calculadora')"),'jogo e calculadora reconhecidos como programação');
}
{
 const {H,run,chat}=fixture();H.PROPS.PONTE_SEGREDO='ficticio';H.CACHE.ponte_visto=String(run('Date.now()'));H.CACHE.ponte_versao='2.4';
 const m=run('PC_MODELO_OPUS');H.CACHE.ponte_modelos=JSON.stringify([m]);const nomes=[];
 run("ponteSemDetalhe=function(a,d){if(a==='ollama_chat'){__pcNomes.push(d.modelo);return {ok:true,texto:'Resposta longa do PC para revisar mantendo o mesmo modelo e sem executar ação.'};}return {};};var __pcNomes=[];");
 const r=chat('explica como melhorar um texto com cuidado',{cerebro:'pc',capricho:true});
 ok(r.ok&&run('__pcNomes.length')===2&&run('__pcNomes.every(x=>x===PC_MODELO_OPUS)'),'PC manual mantém modelo exato também na revisão');
 ok(run('SELECAO_CEREBRO')===null,'seleção do pedido não vaza para próxima execução');
}
{
 const {run,calls,H}=fixture();run("SELECAO_CEREBRO={id:'mistral',cerebro:Object.assign({},CEREBROS.mistral)};");
 const r=run("consertarCodigo('<html><body>x</body></html>',['erro fictício'],'arruma o app','')");
 run("continuarCortado('<html><body>', 'cria um app')");
 ok(r?.ok&&calls.length>=2&&calls.every(c=>/mistral/.test(c.u)),'reparo e continuação mantêm seleção manual mesmo chamando Auto internamente');
 const n=calls.length;let erro='';try{run("chamarCompat(CEREBROS.groq,[{role:'user',content:'teste'}],100)");}catch(e){erro=e.message;}
 ok(/Seleção manual/.test(erro)&&calls.length===n,'chamada indireta a outro modelo é bloqueada antes da rede');
}
{
 const {H,run}=fixture();const r=H.post({pin:'1234',acao:'tarefa',cerebro:'pc',pedido:'tarefa fictícia'});
 ok(!r.ok&&!H.sheets.tarefas?.rows.slice(1).length,'API de tarefa também respeita o modo manual');
 ok(/versão 102/.test(run('doGet().t')),'endpoint de saúde identifica a versão implantada sem chave');
}
