#!/usr/bin/env node
'use strict';
// Sem serviço novo: uma execução explícita, modelos locais e nenhuma publicação.
const fs=require('node:fs'),path=require('node:path');
const {criarOficina}=require('./oficina.cjs');
const {criarModelos}=require('./ollama.cjs');
const {testarHtml}=require('./provas-html.cjs');
async function main(){
  const args=process.argv.slice(2),o={};
  for(let i=0;i<args.length;i+=2){if(!/^--(tarefa|banco|saidas|raiz|leve|pesado)$/.test(args[i])||!args[i+1])throw Error('Argumentos: --tarefa --banco --saidas --raiz --leve --pesado');o[args[i].slice(2)]=args[i+1];}
  for(const k of ['tarefa','banco','saidas','raiz','leve','pesado'])if(!o[k])throw Error('Falta --'+k);
  const tarefa=JSON.parse(fs.readFileSync(o.tarefa,'utf8'));
  const modelos=criarModelos({leve:o.leve,pesado:o.pesado});
  const agente=criarOficina({banco:path.resolve(o.banco),saidas:path.resolve(o.saidas),raizes:[path.resolve(o.raiz)],
    planejar:async d=>{console.error('Etapa: planejamento local');return modelos.planejar(d);},
    programar:async d=>{console.error('Etapa: código local'+(d.falhas?' — corrigindo falha de teste':''));return modelos.programar(d);},
    testar:async d=>{console.error('Etapa: provas reais em Chromium isolado');return testarHtml(d);},
    ...(process.env.ZICO_OFICINA_PARAR_APOS?{interruptAfter:[process.env.ZICO_OFICINA_PARAR_APOS]}:{})});
  const r=await agente.rodar(tarefa);
  console.log(JSON.stringify({id:r.id,estado:r.estado,plano:r.plano,tentativa:r.tentativa,entrega:r.entrega||null,provas:r.validacao||null,historico:r.historico||[],metricas:r.metricas||[],erro:r.erro||'',publicado:false},null,2));
  if(!['concluido','rascunho'].includes(r.estado))process.exitCode=2;
}
main().catch(e=>{console.error('NÃO CONCLUÍDO: '+e.message);if(e.metrica)console.error(JSON.stringify(e.metrica));process.exitCode=1;});
