'use strict';const test=require('node:test'),assert=require('node:assert/strict'),{gerarProvas}=require('./contrato-provas.cjs');
const fetchCom=provas=>async()=>({ok:true,json:async()=>({message:{content:JSON.stringify({provas})}})});
test('contrato converte interação e resultado específico sem executar JS',async()=>{
 const p=await gerarProvas({pedido:'Criar contador',html:'<html></html>',modelo:'pesado',fetchImpl:fetchCom([{nome:'Soma',passos:[{acao:'clicar',seletor:'#somar',valor:''}],conferir:[{tipo:'texto',seletor:'#valor',operador:'igual',valor:'1'}]}])});
 assert.deepEqual(p,[{nome:'Soma',passos:[{clicar:'#somar'}],conferir:[{texto:'#valor',igual:'1'}]}]);
});
test('contrato vazio, genérico ou com JS arbitrário é recusado',async()=>{
 for(const provas of [[],[{nome:'Vago',passos:[],conferir:[{tipo:'semRolagemHorizontal'}]}],[{nome:'JS',passos:[{acao:'js',valor:'return true'}],conferir:[{tipo:'texto',seletor:'body',valor:'x',operador:'contem'}]}]])await assert.rejects(()=>gerarProvas({pedido:'Criar app',html:'<html></html>',modelo:'pesado',fetchImpl:fetchCom(provas)}));
});
test('prova fraca de zerar exige reparar o contrato antes de gerar código',async()=>{
 let n=0,reparos=0;const make=passos=>({nome:'Zerar',passos,conferir:[{tipo:'texto',seletor:'#valor',operador:'igual',valor:'0'}]});
 const p=await gerarProvas({pedido:'Crie contador com somar e zerar',html:'<html></html>',modelo:'pesado',onReparo:()=>reparos++,fetchImpl:async()=>{n++;return (fetchCom([make(n===1?[{acao:'clicar',seletor:'#zerar',valor:''}]:[{acao:'clicar',seletor:'#somar',valor:''},{acao:'clicar',seletor:'#zerar',valor:''}])]))();}});
 assert.equal(n,2);assert.equal(reparos,1);assert.deepEqual(p[0].conferir,[{reinicio:'#valor',igual:'0'}]);
});
test('pedido explícito de tema escuro ganha prova real mesmo se o modelo esquecer',async()=>{
 const provas=[{nome:'Soma',passos:[{acao:'clicar',seletor:'#somar',valor:''}],conferir:[{tipo:'texto',seletor:'#valor',operador:'igual',valor:'1'}]}];
 const base={html:'<html></html>',modelo:'pesado',fetchImpl:fetchCom(provas)};
 const sim=await gerarProvas({...base,pedido:'Crie contador com tema escuro'}),nao=await gerarProvas({...base,pedido:'Crie contador sem tema escuro'});
 assert(sim.some(p=>p.conferir.some(c=>c.temaEscuro)));assert(!nao.some(p=>p.conferir.some(c=>c.temaEscuro)));
});
test('conferência vazia permite um reparo limitado, sem aceitar nem apagar a prova inválida',async()=>{
 let chamadas=0,reparos=0;const base={pedido:'Criar contador',html:'<html></html>',modelo:'pesado'};
 const invalida=[{nome:'Layout',passos:[],conferir:[{tipo:'texto',seletor:'body',operador:'igual',valor:''}]}];
 const valida=[{nome:'Soma',passos:[{acao:'clicar',seletor:'#somar',valor:''}],conferir:[{tipo:'texto',seletor:'#valor',operador:'igual',valor:'1'}]}];
 const p=await gerarProvas({...base,onReparo:()=>reparos++,fetchImpl:async()=>fetchCom(++chamadas===1?invalida:valida)()});
 assert.equal(chamadas,2);assert.equal(reparos,1);assert.deepEqual(p[0].conferir,[{texto:'#valor',igual:'1'}]);
 chamadas=0;await assert.rejects(()=>gerarProvas({...base,fetchImpl:async()=>{chamadas++;return fetchCom(invalida)();}}),/Conferência vazia/);assert.equal(chamadas,2);
});
