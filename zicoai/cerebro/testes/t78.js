// Entrega confiável: o estado pertence ao conteúdo entregue, não à narrativa do modelo.
const vm = require('vm'), crypto = require('crypto');
const hp = require.resolve('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const OLD = '<!doctype html><html><head><title>Antigo</title></head><body><h1>Antigo</h1></body></html>';
const NEW = OLD.replace(/Antigo/g, 'Novo');
const PROVA = { nome: 'Título solicitado', passos: [], conferir: [{ js: 'return document.title === "Novo";' }] };
const PATCH = 'Pronto, testei tudo e funciona!\n<<<<<<< ANTES\n' + OLD + '\n=======\n' + NEW + '\n>>>>>>> DEPOIS';
const code = (html, provas) => 'Pronto e funcionando!\n```html\n' + html + '\n```' + (provas ? '\n```provas\n' + JSON.stringify(provas) + '\n```' : '');
const withProof = p => p + '\n```provas\n' + JSON.stringify([PROVA]) + '\n```';
function fixture(mode = 'normal') {
  delete require.cache[hp]; const H = require(hp);
  const run = s => vm.runInContext(s, H.ctx);
  H.ctx.__mode = mode;
  run(`INICIO_REQ=Date.now(); CHAT_ATUAL='chat-teste';
    consertarCodigo=function(){return null;};
    var __salvos=[]; guardarRascunho_=function(c,s,h){__salvos.push({chat:c,slug:s,html:h});};
    ponte=function(a,d){
      if(__mode==='offline')throw new Error('Mac offline no simulador');
      if(__mode==='invalido')return {ok:false,erro:'teste recusado'};
      return {ok:true,erros:[],avisos:[],botoesTestados:1,provas:(d.provas||[]).map(function(p){return {nome:p.nome,ok:__mode==='fraca'||(__mode!=='falha'&&/Novo/.test(d.html)),detalhe:'resultado do título'};})};
    };`);
  const program = (text, old = null, slug = null) => run(`programadora(${JSON.stringify({ok:true,texto:text,cerebro:'Modelo fictício'})},${JSON.stringify(old)},'corrige o título do app',${JSON.stringify(slug)})`);
  return { H, run, program };
}
{
  const {program,run} = fixture('offline'), r = program(code(NEW));
  ok(r.validacao.estado === 'sintaxe' && r.testado === false, 'Mac offline: sintaxe não é funcionamento aprovado');
  ok(!/Pronto e funcionando|✅/.test(r.texto) && /não foi executado/.test(r.texto), 'narrativa de sucesso descartada; limite explícito');
  ok(run(`conferirAntesDeEntregar(${JSON.stringify(r.texto)})`) === r.texto, 'resumo real emitido pelo sistema permanece íntegro');
}
{
  const {program} = fixture(), r = program(code(NEW));
  ok(r.validacao.estado === 'executado' && !r.testado, 'abrir e clicar sem provas não aprova o pedido');
}
{
  const {program,run} = fixture(), r = program(withProof(PATCH), OLD, 'app-teste');
  ok(r.testado && r.validacao.estado === 'aprovado', 'prova falha no original e passa no novo: pedido aprovado');
  const salvo = run('__salvos[0]');
  ok(salvo.html === NEW && r.validacao.hash === crypto.createHash('sha256').update(salvo.html).digest('hex'), 'hash é do rascunho exato entregue');
  ok(/Pedido aprovado/.test(r.texto) && !/testei tudo/.test(r.texto), 'só aparece o resultado estruturado do teste');
}
{
  const {program,H} = fixture('fraca'), r = program(withProof(PATCH), OLD, 'app-teste');
  ok(!r.testado && r.validacao.estado === 'executado' && r.validacao.provasFracas.length === 1, 'prova que já passava no original não demonstra o conserto');
  ok(!H.sheets.provas_apps || H.sheets.provas_apps.rows.length === 1, 'prova fraca não vira regressão aprovada');
}
{
  const {program,run} = fixture();run('INICIO_REQ=Date.now()-200000;');
  const r = program(withProof(PATCH), OLD);
  ok(!r.testado && r.validacao.provasSemAntes.length === 1, 'sem tempo para o original: não inventa prova de correção');
}
{
  const {program,run} = fixture();
  const noop = 'Corrigi!\n<<<<<<< ANTES\n' + OLD + '\n=======\n' + OLD + '\n>>>>>>> DEPOIS';
  const r = program(noop, OLD, 'app-teste');
  ok(r.validacao.estado === 'falhou' && r.validacao.mudou === false && !r.testado, 'ANTES igual DEPOIS é recusado');
  ok(run('__salvos.length') === 0 && !/Corrigi!/.test(r.texto), 'edição sem efeito preserva o rascunho anterior e descarta a alegação');
  const r2 = program(code(OLD), OLD, 'app-teste');
  ok(!r2.testado && run('__salvos.length') === 0, 'arquivo inteiro idêntico também não vira sucesso');
}
{
  const {program,run} = fixture('falha'), r = program(withProof(PATCH), OLD, 'app-teste');
  ok(r.validacao.estado === 'falhou' && !r.testado && /Não ficou pronto/.test(r.texto), 'prova reprovada é falha mesmo quando o Mac não preenche erros');
  ok(run('__salvos.length') === 1 && run('__salvos[0].html') === NEW && /RASCUNHO:app-teste/.test(r.texto), 'resultado ainda não validado fica recuperável no rascunho');
}
{
  const {program} = fixture('offline');
  const r = program('Pronto!\n```javascript\nconst = ;\n```');
  ok(r.validacao.estado === 'falhou' && !r.testado && /erro de sintaxe/.test(r.texto), 'JS inválido bloqueia pronto e informa o erro na entrega');
  const r2 = program('Pronto!\n```js\nconst dobro = n => n*2;\n```');
  ok(r2.validacao.estado === 'sintaxe' && !r2.testado, 'JS válido só na sintaxe continua sem aprovação de funcionamento');
  const r3 = program('Pronto!\n```python\nprint(2)\n```');
  ok(r3.validacao.estado === 'nao_testado' && !r3.testado, 'linguagem sem executor não ganha aprovação');
}
{
  const {program,run} = fixture();
  run('testarApp=function(){return {rodou:true,erros:[],avisos:[],hash:"outra-versao",provas:[{nome:"Título solicitado",ok:true}]};};');
  const r = program(code(NEW, [PROVA]));
  ok(r.validacao.estado === 'falhou' && !r.testado && /outra versão/.test(r.texto), 'resultado de outro conteúdo não aprova a entrega');
}
{
  const {program} = fixture('invalido'), r = program(code(NEW, [PROVA]));
  ok(!r.testado && r.validacao.estado === 'falhou', 'resposta recusada pelo Mac não conta como execução aprovada');
}
{
  const {run} = fixture();
  const fake = '✅ Testei no navegador: sem erro.';
  ok(/Não testei de verdade/.test(run(`conferirAlegacaoTeste_(${JSON.stringify(fake)},false)`)), 'prefixo copiado do selo não é comprovante');
  ok(/Não testei de verdade/.test(run(`TESTOU_AGORA=99;conferirAntesDeEntregar(${JSON.stringify(fake)},true)`)), 'contador e booleano também não autorizam alegação de sucesso');
}
{
  const {program,run} = fixture();
  run(`var __antesTeste=testarApp;testarApp=function(h,p){if(/quebra/.test(h))return {rodou:false,erros:['erro de sintaxe'],avisos:[],provas:[],hash:hashEntrega_(h)};return __antesTeste(h,p);};
    consertarCodigo=function(){return {texto:${JSON.stringify(code(NEW, [PROVA]))}};};`);
  const r = program(code(NEW.replace('Novo','quebra'), [PROVA]));
  const html = run(`extrairHtml(${JSON.stringify(r.texto)})`).trimEnd(); // exclui a quebra que separa o HTML da cerca Markdown
  ok(r.testado && html === NEW && r.validacao.hash === crypto.createHash('sha256').update(html).digest('hex'), 'após conserto, entrega exatamente o HTML retestado e seu hash');
}
{
  const {run,H} = fixture('offline');
  H.ctx.__pubs=0;run('publicarApp=function(){__pubs++;return {ok:true,url:"https://exemplo.invalid/app"};};');
  const args={nome:'app-teste',html:NEW,provas:[PROVA]};
  ok(/NÃO publiquei/.test(run(`FERRAMENTAS.publicar_app.run(${JSON.stringify(args)})`)) && H.ctx.__pubs===0, 'publicação automática não passa com Mac offline');
}
{
  const {run,H} = fixture();
  H.ctx.__pubs=0;run('publicarApp=function(){__pubs++;return {ok:true,url:"https://exemplo.invalid/app"};};');
  ok(/NÃO publiquei/.test(run(`FERRAMENTAS.publicar_app.run(${JSON.stringify({nome:'app-teste',html:NEW})})`)) && H.ctx.__pubs===0, 'publicação automática não passa só por abrir sem erro');
  ok(/publicado em/.test(run(`FERRAMENTAS.publicar_app.run(${JSON.stringify({nome:'app-teste',html:NEW,provas:[PROVA]})})`)) && H.ctx.__pubs===1, 'publicador só é chamado após prova aprovada para o conteúdo exato');
}
