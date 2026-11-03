'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {criarModelos}=require('./ollama.cjs');
const retorno=(content,extra={})=>({ok:true,json:async()=>({message:{content},...extra})});
test('9B coordena sem receber o arquivo inteiro; não executa diagnóstico por conta própria',async()=>{
  let body;const m=criarModelos({leve:'leve',pesado:'pesado',fetchImpl:async(u,o)=>{body=JSON.parse(o.body);return retorno('{"acao":"corrigir","alvo":"interface"}');}});
  await m.planejar({pedido:'Corrigir jogo',arquivo:'index.html',trecho:'ARQUIVO_INTEIRO_NAO_VAI',falhasComprovadas:{provas:[{nome:'Layout',ok:false}]}});
  assert.equal(body.model,'leve');assert.equal(body.think,false);assert.equal(JSON.stringify(body).includes('ARQUIVO_INTEIRO_NAO_VAI'),false);
});
test('especialista não recebe opinião técnica não validada do plano',async()=>{
  let body;const m=criarModelos({leve:'leve',pesado:'pesado',fetchImpl:async(u,o)=>{body=JSON.parse(o.body);return retorno('{"edicoes":[{"antes":"a","depois":"b"}]}');}});
  await m.programar({pedido:'Corrigir',plano:['PLANO_NAO_E_FONTE'],fonte:'html',falhas:{ok:false}});assert.equal(body.model,'pesado');assert.equal(JSON.stringify(body).includes('PLANO_NAO_E_FONTE'),false);
});
test('modelo ausente não vira outro modelo',async()=>{
  let chamadas=0;const m=criarModelos({leve:'faltante',pesado:'pesado',fetchImpl:async()=>{chamadas++;return {ok:false,status:404};}});await assert.rejects(()=>m.planejar({}),/não substituído/);assert.equal(chamadas,1);
});
test('JSON cortado ou inválido nunca vira edição aprovada',async()=>{
  for(const j of [{message:{content:'{"edicoes":['},done_reason:'length'},{message:{content:'Entendido, chefe.'}}]){
    const m=criarModelos({leve:'leve',pesado:'pesado',fetchImpl:async()=>({ok:true,json:async()=>j})});await assert.rejects(()=>m.programar({fonte:'x'}),/limite|JSON inválido/);
  }
});
test('contexto excessivo é recusado antes da chamada, sem cortar código',async()=>{
  let n=0;const m=criarModelos({leve:'leve',pesado:'pesado',fetchImpl:async()=>{n++;return retorno('{}');}});await assert.rejects(()=>m.programar({fonte:'x'.repeat(19000)}),/não enviado nem cortado/);assert.equal(n,0);
});
test('contagem de entrada próxima do limite invalida a saída e preserva a métrica',async()=>{
  const m=criarModelos({leve:'leve',pesado:'pesado',fetchImpl:async()=>retorno('{"etapas":["Ler"]}',{prompt_eval_count:7000})});await assert.rejects(()=>m.planejar({}),e=>/Contexto próximo/.test(e.message)&&e.metrica.tokensEntrada===7000);
});
test('app novo em semente vazia não precisa copiar um trecho ANTES inventado',async()=>{
  const fonte='<!doctype html><html><head></head><body></body></html>',html='<!doctype html><html><body><button>Novo</button></body></html>';
  const m=criarModelos({leve:'leve',pesado:'pesado',fetchImpl:async()=>retorno(JSON.stringify({html}))});
  const r=await m.programar({fonte,pedido:'Crie um app'});assert.equal(r.edicoes[0].antes,fonte);assert.equal(r.edicoes[0].depois,html);assert.equal(r.metrica.criacaoCompleta,true);
});
