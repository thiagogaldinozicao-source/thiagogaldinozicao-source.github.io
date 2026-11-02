// v68: consertos das conversas de 31/10 20:37–20:47 (resultado do agente em JSON cru, "não achei o seu app", agente dentro de ```)
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k';
// 1) JSON com quebra de linha crua dentro do texto (era o que saiu cru no "Resultado da tarefa")
const cru = '{"resposta":"# Relatório de Varredura\n\n**Já está valendo:**\n- Testes\tok"}';
const j = run('lerJSON(' + JSON.stringify(cru) + ')');
ok(j && /^# Relatório[\s\S]*Já está valendo[\s\S]*Testes\tok$/.test(j.resposta), 'lerJSON entende {"resposta":"…"} com quebra de linha crua');
ok(run('lerJSON(' + JSON.stringify('{"ferramenta":"mac_status","args":{},}') + ')').ferramenta === 'mac_status', 'vírgula sobrando no fim também passa');
ok(run('lerJSON(' + JSON.stringify('{"a":"tem \\"aspas\\" e \\\\n escapado"}') + ')').a === 'tem "aspas" e \\n escapado', 'texto já escapado continua igual');
ok(run('lerJSON("sem json nenhum")') === null, 'sem JSON continua null');
// 2) o próprio código
const app = ['<!doctype html>', '<style>', '/* ---------- menu ---------- */', '.menu{}', '</style>', '<div id="mArquivos">', '<script>', 'function linhaViva(corpo){', '  return 1;', '}', 'function mostraTela(onde){}', '</script>'].join('\n');
let pedidos = [];
H.setFetch((u) => { pedidos.push(u); if (/zicoai\/index\.html$/.test(u)) return { getResponseCode: () => 200, getContentText: () => app }; return { getResponseCode: () => 404, getContentText: () => '' }; });
let t = run('FERRAMENTAS.ler_meu_codigo.run({arquivo:"app"})');
ok(/zicoai\/index\.html \(12 linhas/.test(t) && /MAPA:[\s\S]*3: \/\* -+ menu[\s\S]*6: <div id="mArquivos">[\s\S]*8: function linhaViva/.test(t), 'mapa do app com seções, telas e funções + nº da linha');
ok(pedidos.some(u => /raw\.githubusercontent\.com\/thiagogaldinozicao-source\/thiagogaldinozicao-source\.github\.io\/main\/zicoai\/index\.html/.test(u)), 'baixa do GitHub certo (não de apps/<slug>)');
t = run('FERRAMENTAS.ler_meu_codigo.run({arquivo:"app", termo:"linhaviva"})');
ok(/--- linha 8[\s\S]*8: function linhaViva/.test(t), 'procurar acha o trecho');
t = run('FERRAMENTAS.ler_meu_codigo.run({arquivo:"app", linhas:"8-10"})');
ok(/^8: function linhaViva[\s\S]*10: \}$/m.test(t) && !/11:/.test(t), 'linhas 8-10');
ok(/^ERRO: arquivo/.test(run('FERRAMENTAS.ler_meu_codigo.run({arquivo:"../../senhas"})')), 'arquivo fora da lista é recusado');
ok(/zicoai\/extensao\/painel\.html/.test(pedidos.length && run('lerMeuCodigo("extensao/painel.html")') + pedidos.join(' ')), 'arquivos da extensão também');
ok(/VOCÊ MESMA[\s\S]*ler_meu_codigo[\s\S]*NUNCA diga que não achou o próprio app/.test(run('PROMPT_AGENTE')), 'agente sabe que o app é ela mesma');
// 3) chat pela extensão: "vc/nossa IA" = ela, e [[TAREFA]] dentro de ``` sai sem moldura
let sist = '';
H.setFetch((u, o) => { const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; if (b.messages) sist = b.messages[0].content; return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '```\n[[TAREFA: avaliar o app da ZicoAI com ler_meu_codigo]]\n```' } }] }) }; });
run('criarTarefa = function(){ return {ok:true, id:"t1"}; }');
const r = H.post({ pin: '1234', acao: 'chat', capricho: false, naExtensao: true, mensagens: [{ role: 'user', content: 'mas e pra vc ver pela extensao aqui onde vc esta aberto' }] });
ok(/aqui onde vc está aberta[\s\S]*VOCÊ \(o app da ZicoAI/.test(sist), 'pela extensão, "aqui onde vc está aberta" = ela mesma');
ok(r.ok && /🧠 Agente trabalhando/.test(r.resposta) && !/```/.test(r.resposta), 'linha do agente sem bloco de código: ' + JSON.stringify(r.resposta));
ok(/versão (1\d\d|6[89]|[7-9]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 68 ou mais nova');
ok(typeof run('testarNavegadorZico') === 'function', 'tem testarNavegadorZico pra rodar pelo editor');
// cérebro com termo: API do Apps Script desligada (era o "habilitar a API" inventado) → cai pro GitHub
H.setFetch((u) => /script\.googleapis/.test(u) ? { getResponseCode: () => 403, getContentText: () => 'API desligada' } : /Codigo\.gs$/.test(u) ? { getResponseCode: () => 200, getContentText: () => 'const X = 1;\nfunction webNav(d) {\n  return 1;\n}' } : { getResponseCode: () => 404, getContentText: () => '' });
const tc = run('FERRAMENTAS.ler_meu_codigo.run({termo:"webNav"})');
ok(/zicoai\/cerebro\/Codigo\.gs[\s\S]*2: function webNav/.test(tc), 'cérebro com termo sem a API: lê pelo GitHub');
