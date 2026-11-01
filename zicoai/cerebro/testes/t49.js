// v70: placar das aulas não perde perguntas no limite por minuto e roda sozinho todo domingo
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.GEMINI_KEY = 'k';
const linhas = []; for (let i = 0; i < 150; i++) linhas.push(JSON.stringify({ aula: 'A' + (i % 5), messages: [{ role: 'user', content: 'pergunta ' + i }] }));
run('globalThis.__jsonl = ' + JSON.stringify(linhas.join('\n')));
run(`DriveApp.getFoldersByName = function(){ var u=false; return { hasNext: function(){ return !u; }, next: function(){ u=true; return { getFilesByName: function(){ var v=false; return { hasNext: function(){ return !v; }, next: function(){ v=true; return { getBlob: function(){ return { getDataAsString: function(){ return globalThis.__jsonl; } }; } }; } }; } }; } }; };
indiceAulas = function(){ return [['A0'],['A1'],['A2'],['A3'],['A4']]; };
vetoresAulas = function(){ return {A0:1,A1:1,A2:1,A3:1,A4:1}; };
aulasPara = function(q, n){ return [['A' + (+q.split(' ')[1] % 5)]]; };`);
globalThis.__lote = 0;
H.setFetch((u, o) => {
  if (!/batchEmbedContents/.test(u)) return { getResponseCode: () => 200, getContentText: () => '{}' };
  globalThis.__lote++;
  const n = JSON.parse(o.payload).requests.length;
  if (globalThis.__lote === 3) return { getResponseCode: () => 429, getContentText: () => 'RESOURCE_EXHAUSTED' };   // 3º pedido bate no limite
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ embeddings: Array.from({ length: n }, () => ({ values: [1, 0] })) }) };
});
const r = run('placarAulas()');
ok(r.ok && r.perguntas === 150 && r.comVetor === 150, 'limite por minuto no meio: espera e tenta de novo, as 150 ganham vetor (' + r.comVetor + ')');
ok(r.nas2 === 100, 'placar calculado: ' + r.nas2);
ok(H.sheets.placar_aulas && H.sheets.placar_aulas.rows.length >= 1, 'grava na aba placar_aulas');
ok(run('typeof placarSemanal') === 'function' && /placarSemanal'\)\.timeBased\(\)\.onWeekDay\(ScriptApp\.WeekDay\.SUNDAY\)/.test(require('fs').readFileSync(__dirname + '/../Codigo.gs', 'utf8')), 'gatilho de domingo roda o placar sozinho');
ok(/versão ([7-9]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 70 ou mais nova');
