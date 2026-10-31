// importarAulas: grava aulas de um JSON do Drive na aba aulas, só nas privadas, guarda o antigo e confere de volta
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => '{}' }));
const a = H.ctx.aba('aulas');
[['C01', 'C', 'Preço velho', 'preco', 'Regra velha C01', 'Conteúdo cortado no meio da fr', 'planilha (privado)'],
 ['B20', 'B', 'Supabase', 'supabase', 'Regra velha B20', 'Conteúdo velho', 'planilha (privado)'],
 ['A01', 'A', 'Método', 'metodo', 'Regra pública', 'Conteúdo público', 'GitHub zicoai/aulas/A/A01-metodo.md'],
 ['C09', 'C', 'TV Box', 'tv box', 'Regra', 'Conteúdo', '[IGNORAR] repetida']].forEach(l => a.appendRow(l));
let arquivo = null;
H.ctx.DriveApp.getFilesByName = nome => { let usado = false; return { hasNext: () => !usado && arquivo !== null && nome === 'aulas_professor.json', next: () => { usado = true; return { getBlob: () => ({ getDataAsString: () => arquivo }) }; } }; };
if (!H.ctx.SpreadsheetApp.flush) H.ctx.SpreadsheetApp.flush = () => {};
const imp = () => vm.runInContext('importarAulas()', H.ctx);

ok(!imp().ok && /não achado/.test(imp().erro), 'sem arquivo no Drive: erro claro');
arquivo = '{quebrado';
ok(/JSON inválido/.test(imp().erro), 'JSON quebrado: erro claro, nada gravado');
arquivo = JSON.stringify({ versao: 'professor-teste', aulas: {
  C01: { titulo: 'Preço novo', palavras: 'preco, preço, valor', regra: 'Regra nova C01', conteudo: '## Por quê\n=conta que começa com igual\n## Situações em que aparece\n- "quanto tá?"' },
  B20: { titulo: 'Supabase grátis', palavras: 'supabase, rls', regra: '+Regra que começa com mais', conteudo: '## Por quê\nRLS.' },
  A01: { titulo: 'NÃO PODE', palavras: 'x', regra: 'NÃO PODE', conteudo: 'NÃO PODE' },
  C09: { titulo: 'NÃO PODE', palavras: 'x', regra: 'NÃO PODE', conteudo: 'NÃO PODE' },
  Z99: { titulo: 't', palavras: 'p', regra: 'r', conteudo: 'c' } } });
const r = imp();
ok(r.ok && r.gravadas === 2 && r.conferidas === 2 && !r.diferentes.length, 'grava as 2 privadas e confere letra por letra');
ok(r.puladas.join(',') === 'A01,C09' && r.naoAchadas.join(',') === 'Z99', 'pula pública (GitHub) e [IGNORAR]; avisa ID que não existe');
const linha = id => a.rows.find(l => String(l[0]) === id);
ok(linha('C01')[2] === 'Preço novo' && linha('C01')[4] === 'Regra nova C01' && /=conta que começa/.test(linha('C01')[5]), 'C01 trocada (título, regra, conteúdo)');
ok(String(linha('B20')[4]) === "'+Regra que começa com mais", 'texto que começa com + vira texto (apóstrofo), não fórmula');
ok(linha('A01')[4] === 'Regra pública' && linha('C09')[4] === 'Regra', 'pública e [IGNORAR] continuam iguais');
ok(linha('C01')[0] === 'C01' && linha('C01')[1] === 'C' && linha('C01')[6] === 'planilha (privado)', 'ID, módulo e "Onde" não mudam');
const h = H.sheets.historico.rows.filter(l => l[5] === 'importarAulas');
ok(h.length === 2 && /Conteúdo cortado no meio/.test(h.find(l => /C01/.test(l[2]))[3]), 'texto antigo guardado no histórico (dá pra desfazer)');
