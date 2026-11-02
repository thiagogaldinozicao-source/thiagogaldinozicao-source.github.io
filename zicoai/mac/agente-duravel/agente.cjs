'use strict';
// Agente experimental (leitura apenas). O checkpointer é o LangGraph de verdade.
// Política: ações externas que alteram estado NÃO podem ser reexecutadas em replay.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Annotation, StateGraph, START, END } = require('@langchain/langgraph');
const { SqliteSaver } = require('@langchain/langgraph-checkpoint-sqlite');

const PERMITIDAS = new Set(['status', 'listar', 'ler']);
const Estado = Annotation.Root({
  pedidoId: Annotation(),
  acao: Annotation(),
  dados: Annotation(),
  estado: Annotation(),
  resultado: Annotation(),
  erro: Annotation(),
  tentativas: Annotation(),
  trilha: Annotation({reducer:(anterior,novo)=>[...(anterior||[]),...(novo||[])],default:()=>[]}),
});

function criarAgente({ arquivo, executar, pausa = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (typeof executar !== 'function') throw new TypeError('executar deve ser uma função da ponte');
  const destino = arquivo || path.join(os.homedir(), 'ZicoAI', 'agente-duravel', 'checkpoints.sqlite');
  fs.mkdirSync(path.dirname(destino), { recursive: true, mode: 0o700 });
  const checkpointer = SqliteSaver.fromConnString(destino);
  const grafo = new StateGraph(Estado)
    .addNode('preparar', async s => {
      if (!PERMITIDAS.has(s.acao)) {
        return { estado:'bloqueado', erro:'Ação não liberada no agente durável de leitura.', trilha:['bloqueada: '+String(s.acao)] };
      }
      return { estado:'preparado', trilha:['preparada: '+s.acao] };
    })
    .addNode('executar', async s => {
      if (s.estado === 'bloqueado') return {};
      let erro = '', feitas=0;
      for (let n=1;n<=2;n++) {
        feitas=n;
        try {
          const resposta = await executar({ acao:s.acao, dados:s.dados || {} });
          if (resposta && resposta.ok === true) {
            return { resultado:resposta, estado:'executado', tentativas:n, trilha:['resposta recebida na tentativa '+n] };
          }
          erro = String(resposta?.erro || 'Ferramenta não confirmou sucesso');
          // Não repetir automaticamente erros lógicos/permissão. Ação é somente leitura.
          if (!/timeout|tempor|connection|econnreset|429|503|offline/i.test(erro)) break;
        } catch (e) {
          erro = String(e?.message || e);
          if (!/timeout|tempor|connection|econnreset|429|503|offline/i.test(erro)) break;
        }
        if (n < 2) await pausa(150);
      }
      return { estado:'falha', erro:erro.slice(0,500), tentativas:feitas, trilha:['falha ao executar: '+erro.slice(0,120)] };
    })
    .addNode('verificar', async s => {
      if (s.estado==='bloqueado' || s.estado==='falha') return {};
      if (s.resultado?.ok === true) return {estado:'concluido',trilha:['resultado validado: ok=true']};
      return {estado:'falha',erro:'Não recebi confirmação ok=true',trilha:['verificação falhou']};
    })
    .addEdge(START,'preparar')
    .addEdge('preparar','executar')
    .addEdge('executar','verificar')
    .addEdge('verificar',END)
    .compile({checkpointer});
  const config = id => ({configurable:{thread_id:id}});
  async function consultar(id) {
    const x = await grafo.getState(config(id));
    return x?.values?.pedidoId===id ? x.values : null;
  }
  async function rodar({pedidoId,acao,dados={}}) {
    if (!/^z[a-z0-9_-]{4,80}$/i.test(String(pedidoId))) throw new Error('pedidoId inválido');
    const anterior = await consultar(pedidoId);
    if (anterior) {
      if (anterior.acao !== acao || JSON.stringify(anterior.dados||{}) !== JSON.stringify(dados||{}))
        throw new Error('pedidoId já usado por outra ação');
      if (['concluido','falha','bloqueado'].includes(anterior.estado)) return anterior;
      // Sem ação com efeito externo liberada. Um replay após interrupção pode repetir
      // uma leitura, mas não gravar, clicar, comprar, enviar nem apagar.
    }
    return grafo.invoke({pedidoId,acao,dados,estado:'novo',tentativas:0,trilha:[]},config(pedidoId));
  }
  return { rodar, consultar, grafo, checkpointer };
}
module.exports = {criarAgente,PERMITIDAS};
