// Diagnóstico estruturado: dados exclusivamente fictícios, sem APIs reais.
const H = require('./harness'), vm = require('vm'), assert = require('assert');
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = 'fake-pin-only'; H.PROPS.PONTE_SEGREDO = 'fake-bridge-secret';
let raw = {api_key:'fake-api-value', nested:{PIN:'fake-private-pin', authorization:'Bearer fake-bearer-value'}, texto:'fake-bridge-secret CPF 000.000.000-00 telefone +55 (00) 90000-0000 https://example.invalid/?key=fake-query-value&ok=sim sk-fakeabcdefghijklmnop'};
H.ctx.fixture = raw;
let mask = run('mascarar(fixture)');
for (const value of ['fake-api-value','fake-private-pin','fake-bearer-value','fake-bridge-secret','000.000.000-00','90000-0000','fake-query-value','sk-fakeabcdefghijklmnop']) assert(!mask.includes(value), value);
assert(mask.includes('•••')); assert(mask.includes('ok=sim'));
assert(!H.ctx.mascarar('token: "fake with spaces"').includes('fake with spaces'));
assert(!H.ctx.mascarar(JSON.stringify({senha:'fake word pair'})).includes('fake word pair'));
run('PASSOS=[]; DETALHES=[]; REQ_VIVO="fake33";');
H.ctx.passo('Compatível com app antigo');
H.ctx.passoDetalhe({tipo:'teste',titulo:'Formato',pedido:raw,resposta:'x'.repeat(3000),ms:12});
let ds = run('DETALHES'); assert.equal(ds.length,1); assert.equal(ds[0].resposta.length,2000); assert(ds[0].resposta.endsWith('…'));
assert.deepEqual(Object.keys(ds[0]),['tipo','titulo','pedido','resposta','ms']);
assert.equal(run('PASSOS[0]'),'Compatível com app antigo');
assert.equal(H.ctx.detalhesAoVivo('fake33').length,1);
for(let i=0;i<70;i++) H.ctx.passoDetalhe({titulo:'Mais '+i,pedido:'p',resposta:'r',ms:0});
assert.equal(run('DETALHES.length'),60);
// Máximo real de 60 detalhes x 2 blocos; sem estourar célula/cache, inclusive emoji.
run('DETALHES=[]');
for(let i=0;i<60;i++) H.ctx.passoDetalhe({titulo:'Passo '+i,pedido:'😀'.repeat(1500),resposta:'y'.repeat(2500),ms:1});
H.ctx.guardarDetalhes('fake-task',run('DETALHES'));
assert.equal(H.ctx.lerDetalhes('fake-task').length,60);
assert.equal(H.ctx.detalhesAoVivo('fake33').length,60);
assert(H.sheets.detalhes.rows.every(r=>r.every(c=>String(c).length<=40000)));
run('DETALHES=[]; REQ_VIVO=""');
assert.throws(()=>H.ctx.observarDetalhe('ferramenta','Erro',raw,()=>{throw Error('token=fake-error-secret')}),/token/);
assert(!run('JSON.stringify(DETALHES)').includes('fake-error-secret'));
H.setFetch(()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({choices:[{message:{content:'resposta fictícia'}}]})}));
H.ctx.chamarCompat(run('CEREBROS.groq'),[{role:'user',content:'pedido fictício'}],100);
assert(run('DETALHES.some(d=>d.tipo==="cerebro" && /modelo/.test(d.pedido) && /resposta fictícia/.test(d.resposta))'));
// Conversa reaberta conserva detalhes, conversa anterior sem coluna continua válida.
H.ctx.gravarMensagem('fake-chat','zicoai','Texto fictício','fake-model','teste');
assert(H.ctx.abrirChat('fake-chat')[0].detalhes.length>0);
H.sheets.mensagens.appendRow(['old-chat','2020-01-01','zicoai','Mensagem antiga','antigo','teste','Leu a memória']);
const old=H.ctx.abrirChat('old-chat')[0];assert.equal(old.detalhes.length,0);assert.equal(old.passos[0],'Leu a memória');
assert(H.ctx.listarTarefas().every(t=>Array.isArray(t.detalhes)));
const r=H.post({pin:'fake-pin-only',acao:'chat',reqId:'chat33',mensagens:[{role:'user',content:'oi'}],cerebro:'groq'});
assert(r.ok);assert(Array.isArray(r.passos));assert(Array.isArray(r.detalhes));assert(r.detalhes.some(d=>d.tipo==='cerebro'));
const live=H.post({pin:'fake-pin-only',acao:'aoVivo',reqId:'chat33'});assert(live.detalhes.length>0);assert(live.passos.length>0);
// O motivo da seleção é o resultado real do ranking, não uma justificativa inventada.
H.ctx.aba('aulas').appendRow(['D999','D','Diagnóstico seguro','diagnóstico progresso ferramenta','Mascarar diagnóstico antes de mostrar','Regra fictícia para teste','GitHub teste']);
run('BM25_AULAS=null; VETORES_AULAS=null; CacheService.getScriptCache().remove("aulas_idx_n"); DETALHES=[]');
H.ctx.contextoAulas('diagnóstico progresso ferramenta',2);
assert(run('DETALHES.some(d=>d.tipo==="aulas" && d.resposta.includes("D999") && d.resposta.includes("palavra"))'));
// O laço real do agente registra ferramenta e cérebro, inclusive erro.
let seq=0;
H.setFetch((url)=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({choices:[{message:{content:JSON.stringify(!/batchEmbedContents/.test(url) && ++seq===1?{ferramenta:'calcular',args:{conta:'2+3'}}:{resposta:'Resultado fictício 5'})}}]})}));
for (const k in H.CACHE) delete H.CACHE[k];
const task=H.ctx.criarTarefa('calcula dois mais tres para teste',null,'teste');
H.ctx.agente(task.id,'calcula dois mais tres para teste',null,'teste');
const td=H.ctx.listarTarefas().find(t=>t.id===task.id).detalhes;
assert(td.some(d=>d.tipo==='ferramenta' && d.titulo==='calcular' && d.pedido.includes('2+3') && d.resposta.includes('5')));
assert(td.some(d=>d.tipo==='cerebro'));
console.log('PASS t33: formato, limites, máscara, persistência, cache, cérebro, chat e compatibilidade');
