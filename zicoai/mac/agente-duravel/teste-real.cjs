'use strict';
// Teste manual no próprio Mac: não recebe comandos externos, apenas status de leitura.
const { executar } = require('../ponte-mac.js');
const { executarPedido } = require('./integracao.cjs');
(async()=>{
  const pedidoId = 'zstatus'+Date.now().toString(36);
  const primeira = await executarPedido({pedidoId,acao:'status',dados:{}},executar);
  const novamente = await executarPedido({pedidoId,acao:'status',dados:{}},executar);
  if (!primeira.ok || !novamente.ok) throw new Error('Status da ponte não confirmou sucesso: '+(primeira.erro||novamente.erro));
  if (JSON.stringify(primeira.resultado)!==JSON.stringify(novamente.resultado)) throw new Error('Checkpoint não conservou o resultado');
  console.log(JSON.stringify({ok:true,pedidoId,estado:primeira.estado,retomada:novamente.estado,prova:'mesmo resultado preservado no SQLite'},null,2));
})().catch(e=>{console.error('FALHA: '+e.message);process.exitCode=1;});
