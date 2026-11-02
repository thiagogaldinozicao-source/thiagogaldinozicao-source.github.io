'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {criarAgente} = require('./agente.cjs');
function fixture(nome, executar, pausa) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'zico-langgraph-'));
  const agent = criarAgente({arquivo:path.join(dir,nome+'.sqlite'),executar,pausa:pausa||(()=>Promise.resolve())});
  return {agent,dir};
}
test('LangGraph guarda resultado validado no SQLite, também depois de recriar instância', async()=>{
  let chamadas=0;const fx=fixture('persist',async()=>{chamadas++;return {ok:true,msg:'Mac online'};});
  const p={pedidoId:'zpersist123',acao:'status',dados:{}};
  const fim=await fx.agent.rodar(p);
  assert.equal(fim.estado,'concluido');
  assert.equal(fim.resultado.msg,'Mac online');
  const restart=criarAgente({arquivo:path.join(fx.dir,'persist.sqlite'),executar:async()=>{chamadas++;return {ok:true};}});
  const salvo=await restart.consultar(p.pedidoId);
  assert.equal(salvo.estado,'concluido');
  await restart.rodar(p);
  assert.equal(chamadas,1,'não chama ferramenta novamente após conclusão');
});
test('erro de conexão temporário recupera em uma segunda tentativa',async()=>{
  let n=0;const {agent}=fixture('retry',async()=>{n++;if(n===1)throw new Error('connection reset');return {ok:true,quantidade:2};});
  const x=await agent.rodar({pedidoId:'zretry123',acao:'listar',dados:{pasta:'teste'}});
  assert.equal(x.estado,'concluido');assert.equal(x.tentativas,2);assert.equal(n,2);
});
test('erro de permissão registra falha sem repetir',async()=>{
  let n=0;const {agent}=fixture('deny',async()=>{n++;return {ok:false,erro:'permissão negada'};});
  const x=await agent.rodar({pedidoId:'zdenied123',acao:'ler',dados:{}});
  assert.equal(x.estado,'falha');assert.equal(n,1);
});
test('operação com efeito externo bloqueada antes de executar',async()=>{
  let n=0;const {agent}=fixture('write',async()=>{n++;return {ok:true};});
  const x=await agent.rodar({pedidoId:'zblock123',acao:'escrever',dados:{arquivo:'qualquer'}});
  assert.equal(x.estado,'bloqueado');assert.equal(n,0);
});
test('ID duplicado não pode trocar operação',async()=>{
  const {agent}=fixture('reuse',async()=>({ok:true}));
  await agent.rodar({pedidoId:'zreused123',acao:'status',dados:{}});
  await assert.rejects(()=>agent.rodar({pedidoId:'zreused123',acao:'ler',dados:{}}),/já usado/);
});
test('resultado sem ok=true nunca é concluído',async()=>{
  const {agent}=fixture('proof',async()=>({texto:'feito'}));
  const x=await agent.rodar({pedidoId:'zproof123',acao:'status',dados:{}});
  assert.equal(x.estado,'falha');
});
test('ID inválido não vira thread do banco',async()=>{
  const {agent}=fixture('badid',async()=>({ok:true}));
  await assert.rejects(()=>agent.rodar({pedidoId:'../perigo',acao:'ler',dados:{}}),/inválido/);
});
