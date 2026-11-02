'use strict';
// Adaptação para a ponte atual. Não ativa por padrão e não substitui ponteTarefa.
const { criarAgente } = require('./agente.cjs');
let instancia = null;
function executarPedido(d, executar) {
  if (!instancia) instancia = criarAgente({executar});
  return instancia.rodar({
    pedidoId: String(d?.pedidoId || ''),
    acao: String(d?.acao || ''),
    dados: d?.dados && typeof d.dados === 'object' && !Array.isArray(d.dados) ? d.dados : {}
  }).then(r=>({
    ok:r.estado==='concluido',
    estado:r.estado,
    pedidoId:r.pedidoId,
    tentativas:r.tentativas||0,
    resultado:r.resultado||null,
    erro:r.erro||'',
    trilha:r.trilha||[]
  }));
}
module.exports = {executarPedido};
