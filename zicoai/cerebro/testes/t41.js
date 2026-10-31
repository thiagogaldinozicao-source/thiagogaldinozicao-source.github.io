// v56: arquivo cortado é continuado, "✅ Testado" do próprio cérebro não vale, Dispositivos em cartões
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k';
let n = 0;
H.setFetch((u, o) => {
  const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {};
  const ult = b.messages ? JSON.stringify(b.messages[b.messages.length - 1]) : '';
  let txt;
  if (/foi CORTADA no limite/.test(ult)) txt = '  <button>2</button>\n</body>\n</html>';
  else { n++; txt = 'Aqui a calculadora 3D:\n```html\n<!doctype html>\n<html><body>\n<h1>Calc</h1>\n<button>1</button>\n'; }
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: txt } }] }) };
});
let r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'faz uma calculadora html 3d' }] });
ok(r.ok && /<button>1<\/button>\s*<button>2<\/button>\s*<\/body>\s*<\/html>\n```/.test(r.resposta), 'arquivo cortado no limite: pediu a continuação e colou até </html>');
ok(r.passos.some(p => /veio cortado no meio/.test(p)) && /✅ Testei/.test(r.resposta), 'passo avisa e o app inteiro passou no teste');
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Pronto:\n```html\n<!doctype html>\n<html><body><button>1</button></body></html>\n```\n✅ Testado: Todos os botões clicáveis e responsivos.' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'faz um app html simples' }] });
ok(!/Todos os botões clicáveis/.test(r.resposta) && /✅ Testei a sintaxe/.test(r.resposta), '"✅ Testado" inventado pelo cérebro some; fica só o selo do teste de verdade');
// Dispositivos: um cartão por aparelho
H.PROPS.PONTE_SEGREDO_MAC = 'sm';
run('CacheService.getScriptCache().put("ponte_visto_mac", String(Date.now())); CacheService.getScriptCache().put("ponte_nome_mac", "Mac-mini-de-Thiago"); CacheService.getScriptCache().put("ponte_versao_mac", "mac-1.4");');
run('ponteSemDetalhe = function(acao){ if (acao === "comando") return {ok:true, saida:"NAME ID SIZE\\nqwen3:8b abc 5GB\\nqwen3-embedding:0.6b d 600MB"}; if (acao === "status") return {ok:true, nome:"Mac", disco:"117 GB livres"}; throw new Error("x"); };');
const d = H.post({ pin: '1234', acao: 'dispositivos' });
const mac = (d.aparelhos || [])[0], pc = (d.aparelhos || [])[1];
ok(mac && mac.ok && mac.nome === 'Mac-mini-de-Thiago' && /macOS/.test(mac.plataforma), 'cartão do Mac: conectado, nome e plataforma');
ok(mac && mac.servicos.some(s => /Ollama/.test(s.nome) && /qwen3:8b/.test(s.detalhe)) && mac.servicos.some(s => /Ponte/.test(s.nome) && s.detalhe === 'mac-1.4'), 'serviços do Mac: ponte (versão) e cérebro (modelos do Ollama)');
ok(pc && !pc.ok && /Windows/.test(pc.plataforma) && pc.vistoMs === -1, 'cartão do PC: desligado (nunca visto nesta sessão)');
ok(Array.isArray(d.dispositivos), 'lista antiga continua (app antigo não quebra)');
ok(/versão 5[6-9]/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 56 ou mais nova');
