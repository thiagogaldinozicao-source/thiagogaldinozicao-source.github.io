// v52: método do Claude no sistema, Gemini Flash (forte) pra pedido difícil e ficha, modelos testados sozinhos
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k'; H.PROPS.GROQ_KEY = 'g';
ok(/### MÉTODO[\s\S]*SEPARE o que você SABE[\s\S]*CONFIRA antes de mandar/.test(run('PERSONA')), 'método (entender, separar sabe/acha, conferir) no sistema');
ok(!/Modelo que não está na base: diga que não tem a ficha/.test(run('PERSONA')) && /Nunca peça pro Thiago te passar a ficha/.test(run('PERSONA')), 'não pede mais a ficha pro Thiago');
// sem modelo forte testado: desligado
ok(!run('temCerebro("geminiForte")'), 'Gemini Flash desligado até testarModelos achar um que responde');
// testarModelos: 3.8 não existe, 3.6 responde; 3.5-lite responde
H.setFetch((u, o) => { const b = JSON.parse(o.payload); const vivo = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'].indexOf(b.model) >= 0; return { getResponseCode: () => (vivo ? 200 : 404), getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok' } }] }) }; });
const t = run('testarModelos()');
ok(t.forte === 'gemini-3.6-flash' && t.leve === 'gemini-3.5-flash-lite', 'testarModelos escolhe o que responde: ' + JSON.stringify(t));
ok(H.PROPS.GEMINI_MODELO === 'gemini-3.5-flash-lite' && run('CEREBROS.gemini.modelo') === 'gemini-3.5-flash-lite', 'dia a dia passa pro Flash-Lite mais novo');
ok(run('temCerebro("geminiForte")') && run('CEREBROS.geminiForte.modelo') === 'gemini-3.6-flash', 'Gemini Flash ligado');
// pedido difícil vai primeiro pro forte; pedido simples não
let modelos = [];
H.setFetch((u, o) => { const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; modelos.push(b.model || u); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'OK' } }] }) }; });
let r = H.post({ pin: '1234', acao: 'chat', capricho: true, mensagens: [{ role: 'user', content: 'me ajuda a decidir se vale a pena parcelar em 12x com juros ou pagar no pix com desconto, analisa' }] });
ok(modelos.filter(m => /^gemini-3/.test(m))[0] === 'gemini-3.6-flash' && r.passos.some(p => /Gemini Flash/.test(p)), 'pedido difícil chama o Gemini Flash primeiro (' + modelos.filter(m => /^gemini-3/.test(m)).join() + ')');
modelos = [];
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'bom dia, tudo certo?' }] });
ok(modelos.indexOf('gemini-3.6-flash') < 0, 'conversa simples não gasta a cota do Flash');
// cota do dia do forte respeitada (18)
ok(run('CEREBROS.geminiForte.rpd') <= 20, 'Flash limitado a 18/dia (grátis dá 20)');
// revisor de ficha não troca número da pesquisa
ok(/NÃO troque número, chip nem modelo/.test(run('REGRA_REVISOR_FICHA')), 'revisor de ficha não troca número da web pelo que ele acha');
ok((+(run('VERSAO_CEREBRO')).match(/versão (\d+)/)[1] >= 52), 'cérebro na versão 52 ou mais nova');
