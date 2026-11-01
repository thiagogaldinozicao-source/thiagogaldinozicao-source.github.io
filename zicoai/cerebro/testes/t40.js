// v54: cérebro do Mac (Ollama pela ponte), app da conversa editado por trechos, erro gravado na conversa
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k'; H.PROPS.PONTE_SEGREDO_MAC = 'sm';
ok(!run('temCerebro("mac")'), 'Mac fora do ar (ponte não vista) = cérebro do Mac desligado');
run('CacheService.getScriptCache().put("ponte_visto_mac", String(Date.now()))');
ok(run('temCerebro("mac")'), 'ponte do Mac viva = cérebro do Mac ligado');
H.PROPS.MAC_CEREBRO = 'nao'; ok(!run('temCerebro("mac")'), 'MAC_CEREBRO=nao desliga'); delete H.PROPS.MAC_CEREBRO;
// chamada vai pela ponte com ollama_chat, sem foto
run(`var _ped = null; ponteSemDetalhe = function(acao, dados, espera, disp){ _ped = {acao: acao, dados: dados, espera: espera, disp: disp}; return {ok: true, texto: 'resposta do Mac'}; };`);
const t = run('chamarCompat(CEREBROS.mac, [{role:"system",content:"s"},{role:"user",content:[{type:"text",text:"oi"},{type:"image_url",image_url:{url:"data:x"}}]}], 500, {temperature: 0.2})');
ok(t === 'resposta do Mac' && run('_ped.acao') === 'ollama_chat' && run('_ped.disp') === 'mac' && run('_ped.dados.modelo') === 'qwen3:8b', 'vai pela ponte até o Ollama do Mac (qwen3:8b)');
ok(run('_ped.dados.mensagens[1].content') === 'oi' && run('_ped.dados.temperatura') === 0.2, 'foto tirada (o 8B não enxerga), temperatura passada');
// nuvem toda no limite → responde com o Mac em vez de dar erro
H.setFetch(() => ({ getResponseCode: () => 429, getContentText: () => 'rate limit 429' }));
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'me explica o que é margem de lucro' }] });
ok(r.ok && /Mac/.test(r.cerebro) && r.passos.some(p => /Nuvem indisponível \(limite\), respondeu com o Mac/.test(p)), 'nuvem no limite: respondeu com o Mac (' + r.cerebro + ')');
// estudo: Mac gera primeiro
ok(/\['local', 'groq', 'nvidia', 'groq2'\]/.test(run('estudoNoturno.toString()')) && run('cerebroLocal().nome') === run('CEREBROS.mac.nome'), 'estudo: o cérebro local (Mac, ou PC quando ganhar a prova) gera os exercícios, a nuvem só corrige');
// erro gravado na conversa
run('ponteSemDetalhe = function(){ throw new Error("Mac fora"); }; CacheService.getScriptCache().put("mac_off","1",180);');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'teste de erro' }] });
ok(!r.ok && H.sheets.mensagens.rows.some(l => /⚠️ Não consegui responder/.test(String(l[3]))), 'resposta que falhou fica gravada na conversa (dá pra explicar depois)');
// app mandado antes NESTA conversa: muda por trechos
Object.keys(H.CACHE).forEach(k => { if (/^(off_|tk_|rq_)/.test(k)) delete H.CACHE[k]; });   // tira o castigo dos 429 de cima
const appAnt = '<!doctype html>\n<html><body>\n<input id="display" value="0">\n<button>1</button>\n</body></html>';
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Coloquei o botão Copiar.\n<<<<<<< ANTES\n<button>1</button>\n=======\n<button>1</button>\n<button id="copiar">Copiar</button>\n>>>>>>> DEPOIS' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz uma calculadora' }, { role: 'assistant', content: 'Aqui:\n```html\n' + appAnt + '\n```' }, { role: 'user', content: 'coloca um botão de copiar nela' }] });
ok(r.ok && r.passos.some(p => /mudar o app que mandou antes/.test(p)) && /id="copiar"[\s\S]*<\/html>\n```/.test(r.resposta) && /id="display"/.test(r.resposta), 'muda o app da conversa por trechos e devolve inteiro');
ok(/✅ Testei/.test(r.resposta), 'e testou antes de mandar');
ok(/NUNCA diga que não dá pra testar/.test(run('PERSONA')), 'não diz mais "não dá pra testar"');
ok((+(run('VERSAO_CEREBRO')).match(/versão (1\d\d|\d+)/)[1] >= 54), 'cérebro na versão 54 ou mais nova');
// v55: "faz uma calculadora... com botão" é app NOVO; resposta sem trechos não duplica o html
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Aqui:\n```html\n<!doctype html>\n<html><body><button>2</button></body></html>\n```\nComo usar: salva e abre.' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz uma calculadora' }, { role: 'assistant', content: 'Aqui:\n```html\n' + appAnt + '\n```' }, { role: 'user', content: 'faz uma calculadora estilo iPhone com botão de copiar e histórico' }] });
ok(!r.passos.some(p => /mudar o app que mandou antes/.test(p)), '"faz uma calculadora…" é app novo, não edição da anterior');
ok((r.resposta.match(/```html/g) || []).length === 1, 'html não sai duplicado');
// v91: arquivo inteiro só vale se não encolher (o do mock de cima é menor: seria recusado); aqui volta inteiro e maior
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Aqui:\n```html\n' + appAnt.replace('<button>1</button>', '<button>1</button>\n<select id="tema"><option>escuro</option><option>claro</option></select>') + '\n```\nComo usar: salva e abre.' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz uma calculadora' }, { role: 'assistant', content: 'Aqui:\n```html\n' + appAnt + '\n```' }, { role: 'user', content: 'coloca temas nessa calculadora' }] });
ok(r.passos.some(p => /mudar o app que mandou antes/.test(p)) && (r.resposta.match(/```html/g) || []).length === 1, 'mudança devolvendo o arquivo inteiro (sem trechos) também não duplica');
// v91: arquivo inteiro MENOR que o app (outro app no lugar): recusado, nada muda
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Aqui:\n```html\n<!doctype html>\n<html><body><p>outro</p></body></html>\n```' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz uma calculadora' }, { role: 'assistant', content: 'Aqui:\n```html\n' + appAnt + '\n```' }, { role: 'user', content: 'coloca temas nessa calculadora' }] });
ok(/⛔ Não mexi no app/.test(r.resposta) && !/<p>outro<\/p>/.test(r.resposta) && r.passos.some(p => /recusado, pediu só os trechos/.test(p)), 'v91: arquivo inteiro menor (outro app no lugar) é recusado');
