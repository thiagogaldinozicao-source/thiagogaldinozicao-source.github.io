// v83: orquestra — Mac 24h + PC quando liga. O PC entra pela ponte (sem Funnel), faz a prova e só pega o trabalho do Mac se ganhar.
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PONTE_SEGREDO = 'segpc'; H.PROPS.PONTE_SEGREDO_MAC = 'segmac';
const C = H.CACHE;
const pcLiga = (versao, modelos) => { C.ponte_visto = String(run('Date.now()')); C.ponte_versao = versao; if (modelos) C.ponte_modelos = JSON.stringify(modelos); delete C.pc_off; };
const macLiga = () => { C.ponte_visto_mac = String(run('Date.now()')); delete C.mac_off; };
run('var _psdOrig = ponteSemDetalhe, _placarOrig = placarMacRodada;');
run(`var _peds = []; ponteSemDetalhe = function(acao, dados, espera, disp){ _peds.push({acao: acao, dados: dados, espera: espera, disp: disp}); if (acao === 'ollama_chat') return { ok: true, texto: disp === 'pc' ? '{"exercicios":[]} resposta do PC' : 'resposta do Mac' }; return { ok: true }; };`);

// 1) PC desligado: sem cérebro do PC; trabalho local vai pro Mac
macLiga();
ok(run('cerebroPCPonte()') === null, 'PC desligado: nada de PC');
ok(run('cerebroLocal().nome') === run('CEREBROS.mac.nome'), 'trabalho de fundo fica no Mac');

// 2) ponte antiga (2.3) não tem ollama_chat: não usa
pcLiga('2.3', ['hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M']);
ok(run('cerebroPCPonte()') === null, 'ponte 2.3 (sem ollama_chat): não usa o PC');

// 3) ponte 2.4 + modelo: escolhe o 35B; se só tiver o 9B, usa o 9B
pcLiga('2.4', ['zicoai:latest', 'hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M', 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M']);
ok(run('cerebroPCPonte().modelo') === 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M' && run('cerebroPCPonte().viaPonte') === true, 'PC ligado com ponte 2.4: usa o hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M pela ponte');
pcLiga('2.4', ['zicoai:latest', 'hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M']);
ok(run('cerebroPCPonte().modelo') === 'hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M', 'sem o 35B ainda: usa o 9B de reserva');
pcLiga('2.4', ['zicoai:latest']);
ok(run('cerebroPCPonte()') === null, 'sem nenhum dos dois: não usa (não inventa modelo)');
pcLiga('2.4', ['zicoai:latest', 'zicoai-dev:latest', 'qwen3-vl:8b-instruct', 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M', 'hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M']);
ok(run('cerebroPCPonte().modelo') === 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M', 'PC com o hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M (o que ele já tinha): usa ele');
ok(run('cerebroPC().modelo') === 'hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M' && run('cerebroPCcodigo().modelo') === 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M', 'conversa no 9B (rápido), código no 35B — igual zicoai × zicoai-dev de antes');
pcLiga('2.4', ['hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M']);
ok(run('cerebroPC().viaPonte') === true && run('cerebroPCcodigo().modelo') === 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M', 'cerebroPC/cerebroPCcodigo preferem a ponte (não precisa de Funnel)');

// 4) chamada pela ponte do PC: ollama_chat, disp pc, espera maior
run('_peds = []');
let t = run(`chamarCompat(cerebroPCPonte(), [{role:'system',content:'s'},{role:'user',content:[{type:'text',text:'oi'},{type:'image_url',image_url:{url:'data:x'}}]}], 4000, {temperature: 0.2})`);
const p = JSON.parse(run('JSON.stringify(_peds[0])'));
ok(/resposta do PC/.test(t) && p.acao === 'ollama_chat' && p.disp === 'pc' && p.espera === 200000 && p.dados.maxTokens === 2200 && p.dados.contexto === 8192 && p.dados.modelo === 'hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M', 'vai pela ponte do PC (200 s, até 2.500 tokens)');
ok(p.dados.mensagens[1].content === 'oi', 'foto não vai pela ponte (só o texto)');

// 5) ainda sem prova: o Mac continua com o trabalho de fundo
ok(run('pcNoLugarDoMac()') === false && run('cerebroLocal().nome') === run('CEREBROS.mac.nome'), 'PC sem prova: não pega o trabalho do Mac');

// 6) a prova roda no PC quando ele tá ligado (estudar)
run(`aprenderComErros = function(){ return { ok: true, aprendeu: false }; }; revisoraRodada = function(){ return null; };`);
run(`var _quem = []; placarMacRodada = (function(orig){ return function(tipo, quem){ _quem.push(quem || 'mac'); return { ok: true, quem: quem || 'mac', tipo: 'geral' }; }; })(placarMacRodada);`);
H.PROPS.ESTUDO_ULTIMA = '0'; H.PROPS.ESTUDO_TEMA = '0'; H.PROPS.MODELOS_TESTADOS = '20261030';
let r = run('estudar()');
ok(r.placarPC && run('_quem[0]') === 'pc' && /placar PC/.test(r.tema.tema), 'PC ligado e sem 8 provas: a rodada de estudo é a prova do PC');

// 7) placar de verdade do PC (contra a resposta aprovada da nuvem); juiz diz empate
run('placarMacRodada = _placarOrig');
for (let i = 0; i < 5; i++) run(`aba('destilacao').appendRow(["'30/10", 'pergunta geral ${i}', '', 'resposta aprovada ${i}', 'groq', 'geral', 'aprovada'])`);
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '{"melhor":"empate","motivo":"iguais"}' } }] }), getHeaders: () => ({}) }));
H.PROPS.PLACAR_MAC_APROVADAS_GERAL = JSON.stringify({ g: 2, e: 2, p: 6 });
run('_peds = []');
let pr = run('placarMacRodada("geral", "pc")');
ok(pr.ok && pr.quem === 'pc' && pr.acumulado.e === 2 && run('_peds.filter(function(x){ return x.disp === "pc"; }).length') === 2, 'prova do PC: 2 perguntas pela ponte do PC, juiz da nuvem');
ok(JSON.parse(H.PROPS.PLACAR_PC_APROVADAS_GERAL).e === 2 && JSON.parse(H.PROPS.PLACAR_MAC_APROVADAS_GERAL).p === 6, 'placar do PC fica separado do Mac');
ok(H.sheets.placar_mac.rows.some(l => l[1] === 'PC hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M · geral'), 'linha na aba placar_mac diz que foi o PC e qual modelo');
for (let i = 0; i < 3; i++) { pcLiga('2.4', ['hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M']); macLiga(); run('placarMacRodada("geral", "pc")'); }
ok(run('placarTotal("PC").n') >= 8, 'PC chegou a 8 provas: ' + run('placarTotal("PC").n'));
ok(run('pcNoLugarDoMac()') === true && run('cerebroLocal().disp') === 'pc', 'PC (50%) ganhou do Mac (30%): trabalho de fundo vai pro PC sozinho');

// 8) o trabalho de fundo usa o local: resumo da conversa e estudo vão pro PC
run('_peds = []');
run(`var _c = cerebroLocal(); chamarCompat(_c, [{role:'user',content:'resume'}], 900, {temperature:0.2});`);
ok(run('_peds[0].disp') === 'pc', 'cerebroLocal manda pro PC');

// 9) PC desligou: volta pro Mac sem ninguém mexer
C.ponte_visto = String(run('Date.now()') - 5 * 60000); delete C.ponte_ocupada;
ok(run('cerebroPCPonte()') === null && run('cerebroLocal().nome') === run('CEREBROS.mac.nome'), 'PC desligou: volta pro Mac sozinho');
// PC não respondeu (caiu no meio): fica 3 min fora
pcLiga('2.4', ['hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M']); run('marcarPCdesligado()');
ok(run('cerebroPCPonte()') === null && run('cerebroLocal().nome') === run('CEREBROS.mac.nome'), 'PC deu erro: 3 min fora, Mac assume');
delete C.pc_off;

// 10) ponte ocupada pensando (pedido longo) não é "desligada"
run('ponteSemDetalhe = _psdOrig');
C.ponte_visto = String(run('Date.now()'));
try { run('ponteSemDetalhe("ollama_chat", {modelo:"hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M", mensagens:[]}, 3000, "pc")'); } catch (e) { /* não respondeu a tempo (teste) */ }
ok(Number(C.ponte_ocupada) > 0, 'pedido pro Ollama marca a ponte do PC como ocupada');
C.ponte_ocupada = String(run('Date.now()') + 120000); C.ponte_visto = String(run('Date.now()') - 100000);
ok(run('ponteViva("pc")') === true, 'sem bater o ponto há 100 s mas ocupada respondendo: continua ligada');
delete C.ponte_ocupada;
ok(run('ponteViva("pc")') === false, 'sem bater o ponto e sem pedido: desligada');
C.ponte_ocupada_mac = String(run('Date.now()') + 120000); C.ponte_visto_mac = String(run('Date.now()') - 100000);
ok(run('temCerebro("mac")') === true, 'Mac ocupado respondendo também não é "fora do ar"');
delete C.ponte_ocupada_mac;

// 11) a ponte manda os modelos instalados quando busca pedidos
delete C.ponte_modelos;
const b = H.post({ acao: 'ponteBuscar', segredo: 'segpc', nome: 'DESKTOP-UL41KIJ', versao: '2.4', modelos: 'zicoai:latest,hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M,hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M' });
ok(b.ok && JSON.parse(C.ponte_modelos).indexOf('hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M') >= 0 && C.ponte_versao === '2.4', 'ponteBuscar guarda versão e modelos do PC');
H.post({ acao: 'ponteBuscar', segredo: 'segpc', versao: '2.4', modelos: 'ok,$(rm -rf),hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M' });
ok(JSON.parse(C.ponte_modelos).join() === 'ok,hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M', 'nome estranho de modelo é descartado');
C.ponte_modelos = JSON.stringify(['hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M']);

// 12) chat: onde o PC ganhou da nuvem, ele responde primeiro
run('ponteSemDetalhe = function(acao, dados, espera, disp){ return { ok: true, texto: "resposta do PC no chat" }; }');
pcLiga('2.4', ['hf.co/hesamation/Qwen3.6-35B-A3B-Claude-4.6-Opus-Reasoning-Distilled-GGUF:Q4_K_M']);
const tipo = run('tipoTarefa("me explica o que é uma garantia estendida")');
H.PROPS.PC_PRIMARIO_APROVADAS = tipo;
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'iPhone', mensagens: [{ role: 'user', content: 'me explica o que é uma garantia estendida' }] });
ok(r.ok && /35B Opus/.test(r.cerebro) && r.passos.some(x => /cérebro do PC já ganhou/.test(x)), 'assunto que o PC ganhou: PC responde primeiro (' + r.cerebro + ')');
delete H.PROPS.PC_PRIMARIO_APROVADAS;
ok(/versão (1\d\d|8[3-9]|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 83 ou mais nova');

// Os modelos removidos não são reserva pesada; o 9B oficial permanece opção leve.
pcLiga('2.4', ['qwen3.6:35b', 'qwen3.5:9b']);
ok(run('cerebroPCPonte()') === null, 'só modelos antigos: não inventa participante pesado');
ok(run('cerebroPCPonte("leve").modelo') === 'qwen3.5:9b', '9B oficial continua reserva de conversa leve');
