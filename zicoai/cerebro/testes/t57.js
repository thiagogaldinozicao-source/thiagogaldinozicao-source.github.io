// v76: Z.ai (GLM Flash grátis) como cérebro de texto e de foto; propriedade vazia não fica mais
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
ok(run('temCerebro("zai")') === false, 'sem ZAI_KEY: Z.ai fica de fora');
H.PROPS.ZAI_KEY = 'zk-segredo-123';
ok(run('temCerebro("zai") && temCerebro("zaiv")') === true, 'com ZAI_KEY: texto e foto ligados');
let corpo = null, url = '';
const resp = (cod, t) => ({ getResponseCode: () => cod, getContentText: () => t, getHeaders: () => ({}) });
H.setFetch((u, o) => { url = u; corpo = JSON.parse(o.payload); return resp(200, JSON.stringify({ choices: [{ message: { content: 'oi do glm' } }] })); });
ok(run('chamarCompatSemDetalhe(CEREBROS.zai, [{role:"user",content:"oi"}], 100)') === 'oi do glm', 'chama a Z.ai');
ok(/api\.z\.ai\/api\/paas\/v4\/chat\/completions/.test(url) && corpo.model === 'glm-4.7-flash' && corpo.thinking && corpo.thinking.type === 'disabled', 'modelo grátis glm-4.7-flash, sem "pensar"');
let n = 0; H.setFetch((u, o) => { n++; corpo = JSON.parse(o.payload); return n === 1 ? resp(404, '{"error":"model not found"}') : resp(200, JSON.stringify({ choices: [{ message: { content: 'reserva' } }] })); });
ok(run('chamarCompatSemDetalhe(CEREBROS.zai, [{role:"user",content:"oi"}], 100)') === 'reserva' && corpo.model === 'glm-4.5-flash', 'modelo saiu do ar: usa o glm-4.5-flash');
const fonte = require('fs').readFileSync(__dirname + '/../Codigo.gs', 'utf8');
ok(/if \(imagem\) ordem = \['gemini', 'mistral', 'zaiv'/.test(fonte), 'foto: Z.ai visão entra depois da Mistral');
ok(/else ordem = \['gemini', 'groq', 'mistral', 'zai'/.test(fonte), 'texto: Z.ai entra depois da Mistral');
H.setFetch(() => resp(200, JSON.stringify({ choices: [{ message: { content: 'ok' } }] })));
const t = run('testarZai()');
ok(t.ok && /^200/.test(t['glm-4.6v-flash']) && !/segredo/.test(JSON.stringify(t)), 'testarZai testa os 3 modelos sem mostrar a chave');
// propriedade vazia some (o Google não deixa salvar a tela de Propriedades com valor vazio)
H.PROPS.MAC_PRIMARIO = 'cliente';
run('PropertiesService.getScriptProperties().setProperty("PLACAR_MAC_CLIENTE", JSON.stringify({g:0,e:0,p:20}))');
run('temCerebro = function(){ return true; }; motivoNaoCabe = function(){ return ""; }; var _lin = linhas; linhas = function(n){ return n === "destilacao" ? [["d","p1","","r1","Gemini","cliente","ok"],["d","p2","","r2","Gemini","cliente","ok"],["d","p3","","r3","Gemini","cliente","ok"]] : _lin(n); }; chamarCompat = function(c, m){ return /juiz/.test(m[0].content) ? \'{"melhor":"empate","motivo":"x"}\' : "resposta do mac"; };');
const pr = run('placarMacRodada("cliente")'); console.log(JSON.stringify(pr));
ok(!('MAC_PRIMARIO' in H.PROPS) || H.PROPS.MAC_PRIMARIO === undefined, 'MAC_PRIMARIO sem nenhum assunto: apaga em vez de deixar vazio');
