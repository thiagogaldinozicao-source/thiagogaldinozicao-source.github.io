// v100: DUELO NA ACADEMIA — cérebro novo do PC (Opus destilada) × 3.6 oficial × nuvem, mesmos exercícios, cada um SOZINHO.
const H = require('./harness'), vm = require('vm'), fs = require('fs'), path = require('path');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const EX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'academia', 'exercicios.json'), 'utf8')).slice(0, 2);
H.PROPS.PONTE_SEGREDO = 'segpc';
const C = H.CACHE, OPUS = 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M';
const pcLiga = () => { C.ponte_visto = String(run('Date.now()')); C.ponte_versao = '2.4'; C.ponte_modelos = JSON.stringify(['qwen3.5:9b', 'qwen3.6:35b', OPUS]); delete C.pc_off; };
pcLiga();
ok(run('cerebroPCPonte().modelo') === OPUS, 'no dia a dia o PC usa a destilada (pedido do Thiago)');
ok(run(`PC_MODELO_FORCADO = 'qwen3.6:35b'; var _m = cerebroPCPonte().modelo; PC_MODELO_FORCADO = null; _m`) === 'qwen3.6:35b', 'no duelo dá pra forçar o oficial');
ok(run(`PC_MODELO_FORCADO = ${JSON.stringify(OPUS)}; var _n = cerebroPCPonte().nome; PC_MODELO_FORCADO = null; _n`) === 'PC (Qwen3.6 35B Opus destilada)', 'nome curto da destilada');
// quem respondeu de verdade
let pedidos = [];
run(`ponteSemDetalhe = function(acao, dados, espera, disp){ if (acao === 'ollama_chat') { pcLiga_(); _pedidosPC.push(dados.modelo || (dados.corpo||{}).model || JSON.stringify(dados).slice(0,200)); return { ok: true, texto: 'Conserto.\\n<<<<<<< ANTES\\nx\\n=======\\ny\\n>>>>>>> DEPOIS' }; } return { ok: true }; };
var _pedidosPC = []; function pcLiga_(){}`);
run(`ponte = function(acao, d){ if (acao !== 'testar_html') return {}; return { erros: [], avisos: [], botoesTestados: 1, provas: (d.provas||[]).map(function(p){ return { nome: p.nome, ok: false, detalhe: 'x' }; }) }; };`);
const nuvem = [];
H.setFetch((u, o) => {
  const r = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) });
  if (/academia\/exercicios\.json/.test(u)) return r(200, JSON.stringify(EX));
  try { const b = JSON.parse(o.payload); if (b.model) nuvem.push(b.model); } catch (e) {}
  return r(200, JSON.stringify({ choices: [{ message: { content: 'Conserto.\n<<<<<<< ANTES\nx\n=======\ny\n>>>>>>> DEPOIS' } }] }));
});
H.sheets.academia && (H.sheets.academia.rows.length = 1);
let d = run('dueloAcademia(true)');
// harness: cada rodada pode levar 0 s, então faz tudo de uma vez ou em várias chamadas
for (let i = 0; i < 20 && d.faltam; i++) d = run('dueloAcademia()');
const quem = H.sheets.academia.rows.slice(1).map(l => l[2]);
ok(d.faltam === 0 && quem.length === EX.length * (2 + run('DUELO_NUVEM.filter(function(n){return temCerebro(n)}).length')), 'cada exercício × cada participante (' + quem.length + ' rodadas)');
ok(quem.filter(q => q === 'PC (Qwen3.6 35B Opus destilada)').length === EX.length && quem.filter(q => q === 'PC (qwen3.6:35b)').length === EX.length, 'destilada e oficial rodaram os mesmos exercícios');
ok(!quem.some(q => /qwen3-coder/.test(q)), 'modelo que não tá no PC fica de fora');
ok(run('PC_MODELO_FORCADO === null && SO_ESTE_CEREBRO === null'), 'depois do duelo volta tudo ao normal');
ok(Object.keys(d.placar).length >= 3 && Object.values(d.placar).every(p => p.n === EX.length), 'placar do duelo por cérebro: ' + JSON.stringify(d.placar));
// PC desligado no meio: pausa, não manda pra outro
delete C.ponte_visto; C.pc_off = '1';
d = run('dueloAcademia(true)');
ok(d.faltam > 0 && /PC desligado/.test(d.feitos.join()), 'PC desligado: pausa e espera (não troca de cérebro)');
ok(/versão (1\d\d|1\d\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 100');
