// v85: ela abre o código DE VERDADE do app (repositório próprio) antes de mexer; app com erro/cortado não sobe
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.GITHUB_TOKEN = 'ghp_x';
const CALC = '<!doctype html><html><head><title>Calculadora</title></head><body><table id="pTab"></table><script>function parcCalc(v,n){return n}</script></body></html>';
const puts = [];
H.setFetch((u, o) => {
  o = o || {};
  const r = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) });
  if (/api\.github\.com\/users\/thiagogaldinozicao-source\/repos/.test(u)) return r(200, JSON.stringify([
    { name: 'Calculadora-do-zicao', default_branch: 'main', fork: false, archived: false, private: false },
    { name: 'emprestimo', default_branch: 'main', fork: false, archived: false, private: false },
    { name: 'catalogo', default_branch: 'main', fork: false, archived: false, private: false },
    { name: 'ZICAOSTOREGESTAO', default_branch: 'main', fork: false, archived: false, private: true },
    { name: 'thiagogaldinozicao-source.github.io', default_branch: 'main', fork: false, archived: false, private: false }]));
  if (/contents\/apps$/.test(u)) return r(200, JSON.stringify([{ type: 'dir', name: 'lista-compras' }]));
  if (/raw\.githubusercontent\.com\/thiagogaldinozicao-source\/Calculadora-do-zicao\/main\/index\.html/.test(u)) return r(200, CALC);
  if (/api\.github\.com\/repos\/thiagogaldinozicao-source\/Calculadora-do-zicao\/contents\/index\.html/.test(u)) {
    if ((o.method || 'get') === 'put') { puts.push(JSON.parse(o.payload)); return r(200, '{"content":{"sha":"n"}}'); }
    return r(200, '{"sha":"abc"}');
  }
  if (/api\.github\.com/.test(u)) return r(404, '{}');
  return r(200, JSON.stringify({ choices: [{ message: { content: 'Achei o problema: a tabela mostra só a parcela.' } }] }));
});
const apps = JSON.parse(run('JSON.stringify(listarApps())')).map(a => a.slug);
ok(apps.indexOf('repo:Calculadora-do-zicao') >= 0 && apps.indexOf('lista-compras') >= 0, 'lista os apps do site e os repositórios próprios');
ok(!apps.some(a => /catalogo|ZICAOSTOREGESTAO|github\.io/i.test(a)), 'catálogo, Gestão e o próprio site ficam de fora');
ok(run('appDoPedido_("Corrige um bug na minha calculadora: a tabela de parcelas tá errada")') === 'repo:Calculadora-do-zicao', '"corrige um bug na minha calculadora" acha o repo Calculadora-do-zicao');
ok(run('appDoPedido_("qual a melhor calculadora pra comprar?")') === null, 'pergunta sem pedido de mudança não abre app');
ok(run('appDoPedido_("arruma o Gestão")') === null, 'Gestão nunca é aberto');
ok(run('codigoDoApp("repo:Calculadora-do-zicao")') === CALC && run('codigoDoApp("repo:ZICAOSTOREGESTAO")') === null, 'baixa o index.html de verdade; repo de fora não');
let sis = '';
H.setFetch((function (antes) { return (u, o) => { if (o && o.payload && /messages/.test(o.payload)) { const b = JSON.parse(o.payload); if (b.messages && b.messages[0] && /CÓDIGO ATUAL/.test(b.messages[0].content)) sis = b.messages[0].content; } return antes(u, o); }; })(require('./harness').ctx.UrlFetchApp ? (u, o) => {
  const r = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) });
  if (/raw\.githubusercontent\.com\/thiagogaldinozicao-source\/Calculadora-do-zicao/.test(u)) return r(200, CALC);
  if (/api\.github\.com\/users/.test(u)) return r(200, JSON.stringify([{ name: 'Calculadora-do-zicao', default_branch: 'main', fork: false, archived: false, private: false }]));
  if (/api\.github\.com/.test(u)) return r(404, '{}');
  return r(200, JSON.stringify({ choices: [{ message: { content: 'Achei o problema: a tabela mostra só a parcela.' } }] }));
} : null));
run("CacheService.getScriptCache().remove('repos_apps')");
const res = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'Corrige um bug na minha calculadora: a tabela de parcelas mostra 12x 83,33' }] });
ok(res.ok && res.appAuto === 'repo:Calculadora-do-zicao', 'chat devolve appAuto (o app entra em modo edição)');
ok(/CÓDIGO ATUAL DO APP "Calculadora-do-zicao" \(arquivo DE VERDADE/.test(sis) && sis.indexOf('function parcCalc') >= 0, 'o cérebro recebe o arquivo de verdade no sistema');
ok(res.passos.some(p => /Abriu o código de verdade do app Calculadora-do-zicao/.test(p)), 'passo mostra que abriu o código de verdade');
// publicar no repo
let pub = run('JSON.stringify(publicarApp("repo:Calculadora-do-zicao", "<!doctype html><html><head><title>Calc</title></head><body>oi parcela"))');
ok(/cortado/.test(pub), 'arquivo cortado (sem </html>) não sobe');
H.setFetch((u, o) => { const r = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) }); o = o || {};
  if (/api\.github\.com\/users/.test(u)) return r(200, JSON.stringify([{ name: 'Calculadora-do-zicao', default_branch: 'main', fork: false, archived: false, private: false }]));
  if (/repos\/thiagogaldinozicao-source\/Calculadora-do-zicao\/contents\/index\.html/.test(u)) { if (o.method === 'put') { puts.push(JSON.parse(o.payload)); return r(200, '{"content":{"sha":"n"}}'); } return r(200, '{"sha":"abc"}'); }
  return r(404, '{}'); });
pub = JSON.parse(run('JSON.stringify(publicarApp("repo:Calculadora-do-zicao", ' + JSON.stringify(CALC) + '))'));
ok(pub.ok && puts.length === 1 && puts[0].sha === 'abc' && puts[0].branch === 'main' && /publicado pelo Thiago/.test(puts[0].message), 'Publicar grava o index.html no repositório dele');
ok(/NÃO publiquei: app de repositório/.test(run('FERRAMENTAS.publicar_app.run({ nome: "repo:Calculadora-do-zicao", html: ' + JSON.stringify(CALC) + ' })')), 'agente sozinho não publica em repositório (só o botão do Thiago)');
// programadora: com erro não entrega como pronto
run('testarApp = function(){ return { erros: ["O arquivo terminou no meio (falta o fim </html>): veio cortado."], avisos: [], rodou: true }; }; consertarCodigo = function(){ return null; }; continuarCortado = function(){ return null; };');
const pg = run('programadora({ ok: true, texto: "```html\\n<!doctype html><html><body>oi\\n```" }, null, "faz um app")');
ok(/❌ \*\*Não ficou pronto\*\*: o arquivo veio cortado/.test(pg.texto) && pg.testado === false, 'teste achou erro: resposta diz "Não ficou pronto" e não publica');
ok(/versão (1\d\d|8[5-9]|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 85 ou mais nova');
