// v53: programadora — edita por trechos, testa (sintaxe + navegador do Mac) e conserta antes de entregar
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k'; H.PROPS.GROQ_KEY = 'g';
const app = '<!doctype html>\n<html><body>\n<h1>Calculadora</h1>\n<button id="b">Somar</button>\n<script>\ndocument.getElementById("b").onclick = () => alert(1 + 1);\n</script>\n</body></html>';
H.ctx.__app = app;
// 1) aplicar edição
let e = run('aplicarTrechos(__app, "Troquei o título.\\n<<<<<<< ANTES\\n<h1>Calculadora</h1>\\n=======\\n<h1>Calculadora do Zicão</h1>\\n>>>>>>> DEPOIS")');
ok(e.ok && e.qtd === 1 && /Calculadora do Zicão/.test(e.codigo) && /getElementById/.test(e.codigo), 'aplica o trecho e mantém o resto do arquivo');
e = run('aplicarTrechos(__app, "<<<<<<< ANTES\\n<h1>Outro</h1>\\n=======\\nx\\n>>>>>>> DEPOIS")');
ok(!e.ok && /aparece 0 vez/.test(e.falhas[0]), 'trecho que não existe no arquivo é recusado (não inventa onde pôr)');
// 2) checagem sem rodar
ok(run('checarHtmlEstatico(__app).length') === 0, 'app bom passa na sintaxe');
ok(/cortado/.test(run('checarHtmlEstatico(__app.slice(0, 80)).join()')), 'arquivo cortado no meio é pego');
ok(/sintaxe/.test(run('checarHtmlEstatico(__app.replace("1 + 1", "1 + "))').join()), 'erro de sintaxe no <script> é pego');
ok(run('checarHtmlEstatico("<!doctype html><html><script type=\\"module\\">import x from \\"./a.js\\"</script></html>").length') === 0, 'script module não é testado com new Function (não dá falso erro)');
// 3) app novo com erro → conserta sozinho antes de entregar
let chamada = 0;
H.setFetch((u, o) => {
  const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {};
  const ultimo = b.messages ? JSON.stringify(b.messages[b.messages.length - 1]) : '';
  let txt;
  if (/O teste achou estes erros/.test(ultimo)) txt = 'Faltava o 1 depois do +.\n<<<<<<< ANTES\nalert(1 + );\n=======\nalert(1 + 1);\n>>>>>>> DEPOIS';
  else { chamada++; txt = 'Aqui o app:\n```html\n' + app.replace('1 + 1', '1 + ') + '\n```'; }
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: txt } }] }) };
});
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um app html de calculadora' }] });
ok(r.ok && /alert\(1 \+ 1\)/.test(r.resposta) && !/alert\(1 \+ \)/.test(r.resposta), 'erro de sintaxe consertado antes de entregar');
ok(/✅ Testei a sintaxe e consertei 1x/.test(r.resposta), 'avisa que testou e consertou');
ok(r.passos.some(p => /Teste achou 1 erro/.test(p)) && r.passos.some(p => /Navegador do Mac indisponível/.test(p)), 'passos mostram o teste e que o Mac tava fora');
// 4) editar app existente: só trechos, resposta traz o arquivo inteiro aplicado
run('codigoDoApp = function(){ return __app; }');
H.setFetch((u, o) => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Mudei o nome do botão.\n<<<<<<< ANTES\n<button id="b">Somar</button>\n=======\n<button id="b">Calcular</button>\n>>>>>>> DEPOIS' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', appSlug: 'calc', mensagens: [{ role: 'user', content: 'no app calc muda o botão pra Calcular' }] });
ok(r.ok && /Mudei o nome do botão/.test(r.resposta) && /```html\n<!doctype html>[\s\S]*Calcular[\s\S]*getElementById[\s\S]*<\/html>\n```/.test(r.resposta), 'edição devolve o arquivo COMPLETO com a mudança aplicada');
ok(!/<<<<<<< ANTES/.test(r.resposta), 'os blocos ANTES/DEPOIS não aparecem pro Thiago');
ok(r.passos.some(p => /Aplicou 1 trecho/.test(p)), 'passo: aplicou 1 trecho, resto igual');
// 5) Mac ligado: html grande vai em pedaços e volta inteiro
H.PROPS.PONTE_SEGREDO_MAC = 'sm';
run('CacheService.getScriptCache().put("ponte_visto_mac", String(Date.now()))');
const grande = '<!doctype html><html><body>' + 'x'.repeat(200000) + '</body></html>';
H.ctx.__grande = grande;
run(`var _filaOrig = ponteFila, _primeiro = null; ponteFila = function(fn, disp){ return _filaOrig(function(f){ var r = fn(f); if (!_primeiro && f.length) _primeiro = JSON.parse(JSON.stringify(f[f.length - 1])); return r; }, disp); };`);
run('(function(){ try { ponteSemDetalhe("testar_html", {html: __grande}, 300, "mac"); return ""; } catch (e) { return e.message; } })()');
ok(run('_primeiro && _primeiro.dados.html === null && _primeiro.dados._htmlPedacos === 3'), 'na fila vai só "3 pedaços", não o html (cabe no cache)');
run('_primeiro.ate = Date.now() + 60000; _filaOrig(function(f){ f.push(_primeiro); }, "mac");');
const buscado = H.post({ acao: 'ponteBuscar', segredo: 'sm' });
const ped = (buscado.pedidos || [])[0];
ok(ped && ped.acao === 'testar_html' && ped.dados.html.length === grande.length, 'html de ' + grande.length + ' letras vai em pedaços e o Mac recebe inteiro');
ok(/versão 5[3-9]/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 53 ou mais nova');
