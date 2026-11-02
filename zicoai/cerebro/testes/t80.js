// Regressão real da ponte: nomes Hugging Face dos destilados eram recusados antes do Ollama.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const fonte = fs.readFileSync(path.join(__dirname, '../../mac/ponte-mac.js'), 'utf8');
const inicio = fonte.indexOf('async function ollamaChat(d) {'), fim = fonte.indexOf('\nasync function executar(p)', inicio);
assert(inicio >= 0 && fim > inicio);
const pedidos = [];
const ctx = { AbortSignal, Date, fetch: async (url, op) => { pedidos.push({url, body:JSON.parse(op.body)});return {json:async()=>({message:{content:'ok'},eval_count:1})}; } };
vm.createContext(ctx);vm.runInContext(fonte.slice(inicio,fim),ctx);
let pass = 0;
const ok = (cond, nome) => { assert(cond,nome);pass++;console.log('PASS '+nome); };
(async()=>{
  const nomes = ['qwen3:8b','qwen3.5:9b','usuario/modelo:latest','hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M','hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M'];
  for(const modelo of nomes) { const r = await ctx.ollamaChat({modelo,mensagens:[{role:'user',content:'oi'}]});ok(r.ok && r.modelo === modelo && pedidos.at(-1).body.model === modelo,'encaminha nome exato '+modelo); }
  const n = pedidos.length;
  for(const modelo of ['../modelo','hf.co//modelo','https://example.com/modelo','foo/bar/baz/qux','foo;whoami','foo\nbar','foo bar','foo?token=x','foo\\bar','foo:tag:outra','a'.repeat(257)]) {
    let erro = '';try { await ctx.ollamaChat({modelo,mensagens:[{role:'user',content:'oi'}]}); }catch(e){erro=e.message;}ok(erro==='nome de modelo inválido','recusa nome malformado '+JSON.stringify(modelo).slice(0,50));
  }
  ok(pedidos.length===n,'nomes inválidos não fazem chamada');
  ok(pedidos.every(p=>p.url==='http://127.0.0.1:11434/api/chat'),'destino continua somente localhost');
  const r = await ctx.ollamaChat({mensagens:[{role:'user',content:'oi'}]});ok(r.modelo==='qwen3:8b','padrão 8B preservado');
  let erro='';try{await ctx.ollamaChat({modelo:nomes[3],mensagens:[]});}catch(e){erro=e.message;}ok(erro==='sem mensagens','mantém validação de mensagens');
  console.log(pass+' PASS / 0 FAIL; Ollama simulado, não é teste no Mac físico.');
})().catch(e=>{console.error('FAIL '+e.stack);process.exitCode=1;});
