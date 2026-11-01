// v88: app grande vira RASCUNHO (igual artefato do Claude): versão completa no Drive, chat só com os trechos
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
run('Utilities.getUuid = function(){ return "u" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2); }');
// Drive de mentira (pasta de rascunhos)
run(`var _arqs = {}; pastaRascunhos = function(){ return {
  getFilesByName: function(n){ var f = _arqs[n]; var dado = false; return { hasNext: function(){ return !!f && !dado; }, next: function(){ dado = true; return { setContent: function(t){ _arqs[n] = t; }, getBlob: function(){ return { getDataAsString: function(){ return _arqs[n]; } }; } }; } }; },
  createFile: function(n, t){ _arqs[n] = t; return {}; } }; };`);
const linhas = []; for (let i = 0; i < 4000; i++) linhas.push('<p class="l' + i + '">linha ' + i + ' da calculadora</p>');
const GRANDE = '<!doctype html><html><head><title>Calculadora</title><style>:root{--bg:#0e0e0e}</style></head><body>' + linhas.join('\n') + '<table id="pTab"></table><script>var cor="velha";</script></body></html>';
H.PROPS.GITHUB_TOKEN = 'ghp_x';
let resposta = 'Troquei a cor.\n<<<<<<< ANTES\n<script>var cor="velha";</script>\n=======\n<script>var cor="nova";</script>\n>>>>>>> DEPOIS';
H.setFetch((u, o) => {
  const r = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) });
  if (/api\.github\.com\/users\//.test(u)) return r(200, JSON.stringify([{ name: 'Calculadora-do-zicao', default_branch: 'main', fork: false, archived: false, private: false }]));
  if (/raw\.githubusercontent\.com\/thiagogaldinozicao-source\/Calculadora-do-zicao/.test(u)) return r(200, GRANDE);
  if (/api\.github\.com/.test(u)) return r(404, '{}');
  return r(200, JSON.stringify({ choices: [{ message: { content: resposta } }] }));
});
run('testarApp = function(h){ TESTOU_AGORA++; return { erros: [], avisos: [], rodou: true }; }');
let r0 = null; let r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'Corrige um bug na minha calculadora: muda a cor' }] });
ok(r.ok && /\[\[RASCUNHO:repo:Calculadora-do-zicao\]\]/.test(r.resposta), 'resposta traz o cartão do rascunho');
ok(r.resposta.length < 3000 && !/<\/html>/.test(r.resposta), 'chat NÃO leva o arquivo inteiro (só ' + r.resposta.length + ' letras)');
ok(/```diff\n- <script>var cor="velha";<\/script>\n\+ <script>var cor="nova";<\/script>/.test(r.resposta), 'mostra o que mudou (diff legível)');
const chatId = r.chatId;
let g = H.post({ pin: '1234', acao: 'rascunho', chatId });
ok(g.ok && g.slug === 'repo:Calculadora-do-zicao' && /var cor="nova"/.test(g.html) && /<\/html>$/.test(g.html) && g.html.length > 100000, 'rascunho guarda o arquivo COMPLETO com a mudança (' + (g.html || '').length + ' letras)');
// próximo pedido na mesma conversa continua do rascunho
resposta = 'Clareei o fundo.\n<<<<<<< ANTES\n:root{--bg:#0e0e0e}\n=======\n:root{--bg:#1a1a1a}\n>>>>>>> DEPOIS';
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', chatId, mensagens: [{ role: 'user', content: 'corrige um bug que vi nela, escura não deu pra enxergar nada' }] });
g = H.post({ pin: '1234', acao: 'rascunho', chatId });
ok(/--bg:#1a1a1a/.test(g.html) && /var cor="nova"/.test(g.html), 'segunda mudança soma com a primeira (não volta pro arquivo velho)');
ok(r.passos.some(p => /Continuou do rascunho desta conversa/.test(p)), 'passo diz que continuou do rascunho');
// outra pessoa não pega rascunho
const k = H.post({ pin: '1234', acao: 'convidar', nome: 'Karina', perfil: 'funcionaria' });
ok(/não está liberado/.test(H.post({ convite: k.chave, acao: 'rascunho', chatId }).erro || ''), 'convidada não pega o rascunho');
// app novo (sem slug) continua mandando o html no chat
resposta = '```html\n<!doctype html><html><head><title>Gorjeta</title></head><body>oi</body></html>\n```';
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'faz um app de gorjeta em html' }] });
ok(/```html/.test(r.resposta) && !/RASCUNHO/.test(r.resposta), 'app novo continua vindo no chat (sem rascunho)');
ok(/versão (8[8-9]|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 88 ou mais nova');
