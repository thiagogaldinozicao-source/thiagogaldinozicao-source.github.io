// Auto-melhoria: ler, editar, testar, publicar, desfazer o próprio código
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
const fs = require('fs'); const path = require('path');
const CODIGO = fs.readFileSync(path.join(__dirname, '..', 'Codigo.gs'), 'utf8');
let projeto = CODIGO; const api = []; let testeOk = true; let backups = []; let gh = [];
H.PROPS.DEPLOY_ID = 'DEP1'; H.PROPS.URL_TESTE = 'https://script.google.com/macros/s/HEAD/exec'; H.PROPS.GITHUB_TOKEN = 'ghp';
H.ctx.DriveApp.getFoldersByName = () => ({ hasNext: () => false });
H.ctx.DriveApp.createFolder = () => ({ createFile: b => { backups.push(Buffer.from(b.getBytes()).toString()); return { getId: () => 'BK' + backups.length }; } });
H.ctx.DriveApp.getFileById = id => ({ getBlob: () => ({ getDataAsString: () => backups[parseInt(id.slice(2), 10) - 1] }), moveTo: () => {} });
H.setFetch((u, o) => {
  o = o || {};
  if (/script\.googleapis\.com\/v1\/projects\/SCRIPT1/.test(u)) {
    api.push({ m: o.method || 'get', u, b: o.payload ? JSON.parse(o.payload) : null, auth: o.headers && o.headers.Authorization });
    if (/\/content$/.test(u) && (o.method || 'get') === 'get') return json({ files: [{ name: 'Código', type: 'SERVER_JS', source: projeto }, { name: 'appsscript', type: 'JSON', source: '{}' }] });
    if (/\/content$/.test(u) && o.method === 'put') { projeto = JSON.parse(o.payload).files.find(f => f.type === 'SERVER_JS').source; return json({}); }
    if (/\/versions$/.test(u)) return json({ versionNumber: 42 });
    if (/\/deployments\/DEP1$/.test(u)) return json({});
  }
  if (/macros\/s\/HEAD\/exec/.test(u)) return testeOk ? json({ ok: true }) : json({ ok: false, erro: 'quebrou' });
  if (/api\.github\.com/.test(u)) { gh.push(o.method || 'get'); return (o.method || 'get') === 'get' ? { getResponseCode: () => 200, getContentText: () => '{"sha":"abc"}' } : { getResponseCode: () => 200, getContentText: () => '{}' }; }
  return json({});
});
// ler trechos
const tr = H.ctx.trechosDoCodigo('calculadora price parcela');
ok(/===== calculadora =====/.test(tr) && /function calculadora/.test(tr) && tr.length <= 15000, 'lê trechos do próprio código por termo');
ok(api[0] && api[0].auth === 'Bearer tok-oauth' && /\/content$/.test(api[0].u), 'usa a API do Apps Script com o token do script');
// edição inválida: procurar não único
let r = H.ctx.autoMelhorar([{ procurar: 'const lock = LockService.getScriptLock();', trocar: 'const lock = LockService.getScriptLock(); // x' }], 'teste');
ok(!r.ok && /aparece \d+ vez/.test(r.erro), 'procurar repetido é recusado: ' + r.erro.slice(0, 60));
// edição que quebra sintaxe: recusada antes de salvar
api.length = 0;
r = H.ctx.autoMelhorar([{ procurar: "function moeda(v) {", trocar: "function moeda(v) {{{" }], 'quebra');
ok(!r.ok && /sintaxe/.test(r.erro) && !api.some(a => a.m === 'put'), 'erro de sintaxe não chega a salvar');
// edição que apaga doPost: recusada
r = H.ctx.autoMelhorar([{ procurar: 'function doPost(e) {', trocar: 'function doPostX(e) {' }], 'apaga');
ok(!r.ok && /obrigatório sumiu/.test(r.erro), 'não deixa sumir o doPost');
// edição boa: backup, salva, testa, versão, deploy, github, histórico
api.length = 0; gh.length = 0; backups.length = 0;
r = H.ctx.autoMelhorar([{ procurar: "'9. Sempre \"vc\", nunca \"tu\".", trocar: "'9. Sempre \"vc\", nunca \"tu\" (regra editada pela própria ZicoAI)." }], 'teste de edição na regra 9', { id: 'tf1' });
ok(r.ok && r.versao === 42 && r.backup === 'BK1' && r.github === true, 'edição boa publicada: ' + JSON.stringify(r));
ok(backups.length === 1 && backups[0] === CODIGO, 'backup guardou o código original');
ok(/regra editada pela própria ZicoAI/.test(projeto), 'projeto recebeu o código novo');
const ordem = api.map(a => a.m + ' ' + a.u.split('/SCRIPT1')[1]);
ok(ordem.join(' > ') === 'get /content > put /content > post /versions > put /deployments/DEP1', 'ordem: lê, salva, versão, implanta: ' + ordem.join(' > '));
ok(api.find(a => /deployments/.test(a.u)).b.deploymentConfig.versionNumber === 42, 'implantação aponta pra versão nova');
ok(gh.includes('put') && H.sheets.historico.rows.some(l => l[1] === 'codigo' && /versão 42/.test(l[2])) && H.sheets.memoria.rows.some(l => /Mudei meu próprio código \(versão 42\)/.test(l[1])), 'GitHub + histórico + memória');
// teste da versão nova falha: volta o código antigo
testeOk = false; api.length = 0; const antesFalha = projeto;
r = H.ctx.autoMelhorar([{ procurar: "'9. Sempre \"vc\", nunca \"tu\" (regra editada pela própria ZicoAI).", trocar: "'9. Sempre \"vc\"." }], 'vai falhar');
ok(!r.ok && /falhou no teste/.test(r.erro) && projeto === antesFalha && api.filter(a => a.m === 'put' && /content/.test(a.u)).length === 2 && !api.some(a => /versions/.test(a.u)), 'teste falhou → voltou o código, sem versão nova');
ok(H.sheets.historico.rows.some(l => l[2] === 'tentativa desfeita'), 'tentativa desfeita registrada');
// desfazer: volta pro backup
testeOk = true; api.length = 0;
r = H.ctx.desfazerCodigo();
ok(r.ok && r.versao === 42 && projeto === CODIGO, 'desfazer restaura o backup e publica');
// ferramentas do agente existem
ok(/ler_meu_codigo: \{ desc/.test(CODIGO) && /editar_meu_codigo: \{ desc/.test(CODIGO) && /desfazer_meu_codigo: \{ desc/.test(CODIGO), 'ferramentas registradas no agente');
ok((CODIGO.match(/MELHORAR MEU CÓDIGO/g) || []).length >= 2, 'prompt ensina a usar a auto-melhoria');
