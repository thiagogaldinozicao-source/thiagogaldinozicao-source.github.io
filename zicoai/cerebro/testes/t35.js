// Custo e tamanho dos detalhes do "Como respondi": medir chamadas, porque o simulador não mede tempo de rede
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'chave-gemini-falsa-123'; H.PROPS.GROQ_KEY = 'chave-groq-falsa-456';
let leiturasProps = 0;
const g = H.ctx.PropertiesService.getScriptProperties;
H.ctx.PropertiesService.getScriptProperties = () => { const ps = g(); return Object.assign({}, ps, { getProperties: () => { leiturasProps++; return Object.assign({}, H.PROPS); }, getProperty: k => ps.getProperty(k) }); };
let leiturasConfig = 0;
const cfg = H.ctx.aba('config'); const gr = cfg.getRange.bind(cfg);
cfg.getRange = (...a) => { leiturasConfig++; return gr(...a); };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
H.setFetch((u, o) => { if (/batchEmbedContents/.test(u)) { const b = JSON.parse(o.payload); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ embeddings: b.requests.map(() => ({ values: [1, 0, 0] })) }) }; } return resp('Resposta com a chave chave-groq-falsa-456 que não pode vazar. ' + 'texto '.repeat(400)); });
for (let i = 0; i < 40; i++) H.ctx.aba('memoria').appendRow(["'2026-10-01", 'Lembrança ' + i + ' sobre iPhone 13 e preço ' + 'x'.repeat(200)]);

// 1) uma mensagem: segredos lidos 1 vez, nada de reler a aba config a cada máscara
leiturasProps = 0;
const antesConfig = leiturasConfig;
const r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto tá o iphone 13 no pix?' }] });
ok(r.ok && r.detalhes.length > 0, 'chat responde com detalhes (' + r.detalhes.length + ')');
ok(leiturasProps <= 2, 'propriedades lidas no máximo 2 vezes por mensagem pra máscara (' + leiturasProps + ', antes eram 13 mil)');
ok(leiturasConfig - antesConfig <= 3, 'aba config lida poucas vezes (' + (leiturasConfig - antesConfig) + ')');
ok(!/chave-groq-falsa-456|chave-gemini-falsa-123/.test(JSON.stringify({ d: r.detalhes, p: r.passos })), 'segredo continua mascarado nos detalhes e passos (mesmo quando o cérebro devolve a chave)');

// 2) tamanho por mensagem: no máximo 60 mil letras gravadas
const grande = Array.from({ length: 60 }, (_, i) => ({ tipo: 'cerebro', titulo: 'Passo ' + i, pedido: 'p'.repeat(1990), resposta: 'r'.repeat(1990), ms: 1 }));
const enc = vm.runInContext('encolherDetalhes', H.ctx)(grande);
ok(JSON.stringify(enc).length <= 60000 && enc.length === 60, 'detalhes encolhem pra caber em 60 mil letras sem perder passo (' + JSON.stringify(enc).length + ')');

// 3) limpeza: aba detalhes fica com as últimas 300
const d = H.ctx.aba('detalhes'); d.rows.splice(1);
for (let i = 0; i < 3050; i++) d.appendRow(["'2026-10-31", 'msg_' + i, 1, 'memoria', 'Passo', 'pedido', 'resposta', 0]);
const tirou = vm.runInContext('limparDetalhes()', H.ctx);
ok(tirou === 50 && d.rows.length === 3001 && d.rows[1][1] === 'msg_50', 'limpeza deixa só as 3.000 linhas mais novas (tirou ' + tirou + ')');
ok(/limparDetalhes\(\)/.test(vm.runInContext('arquivarMensagens.toString()', H.ctx)), 'limpeza roda na rotina semanal (arquivarMensagens)');

// 4) agente: grava os detalhes no máximo a cada 10 s, e sempre no fim
let gravacoes = 0; const gd = H.ctx.guardarDetalhes;
vm.runInContext('var __g = guardarDetalhes; guardarDetalhes = function(id, ds){ __contaG(); return __g(id, ds); };', Object.assign(H.ctx, { __contaG: () => { gravacoes++; } }));
vm.runInContext('DETALHES = []; TAREFA_DETALHE = "tarefa_x"; GRAVOU_DETALHE_EM = 0; for (let i = 0; i < 20; i++) passoDetalhe({tipo:"ferramenta", titulo:"f"+i, pedido:"a", resposta:"b"});', H.ctx);
ok(gravacoes === 1, '20 passos seguidos do agente = 1 gravação na planilha (' + gravacoes + ')');
vm.runInContext('publicarDetalhes(true)', H.ctx);
ok(gravacoes === 2, 'no fim grava de novo (forçado)');
ok(/publicarDetalhes\(true\)/.test(vm.runInContext('agente.toString()', H.ctx)), 'agente força a gravação final (finally)');
