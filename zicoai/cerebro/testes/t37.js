// v51: ficha técnica só com web, foto só pra cérebro que enxerga, erro do app vai junto, aula forte de verdade, estudo 24h
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k'; H.PROPS.GROQ_KEY = 'g'; H.PROPS.NVIDIA_KEY = 'n'; H.PROPS.MISTRAL_KEY = 'm';
H.PROPS.PONTE_SEGREDO_MAC = 'seg-mac';

// 1) quem é ficha técnica
const ficha = t => run('ehFichaTecnica(' + JSON.stringify(t) + ', [])');
ok(ficha('Vê pra mim compara 17 pro max vs 18 pro max'), '"17 pro max vs 18 pro max" é ficha');
ok(ficha('iPhone duo vs 18 pro Max'), '"iPhone duo vs 18 pro Max" é ficha');
ok(ficha('qual a bateria do iphone 18 pro max?'), 'bateria de um modelo é ficha');
ok(!ficha('quanto tá o iphone 13 no pix?'), 'preço NÃO é ficha (preço vem da tabela, não da web)');
ok(!ficha('bom dia'), 'conversa não é ficha');
ok(run('ehFichaTecnica("Opção 2 (Técnico/Uso)", [{role:"assistant",content:"🏆 POR QUE LEVAR O IPHONE 17"},{role:"user",content:"Opção 2 (Técnico/Uso)"}])'), 'continuação de comparativo também pesquisa');

// 2) comparativo vai pra web e leva a regra da ficha
let pediu = [];
H.setFetch((u, o) => { const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; pediu.push({ u, b }); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'resposta com fonte' } }] }) }; });
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'compara 17 pro max vs 18 pro max' }] });
ok(r.ok && r.passos.some(p => /Ficha técnica de aparelho/.test(p)), 'comparativo avisa que vai conferir na web');
const comBusca = pediu.find(x => x.b && x.b.tools && JSON.stringify(x.b.tools).includes('browser_search'));
ok(comBusca && /FICHA TÉCNICA/.test(comBusca.b.messages[0].content), 'pesquisa na web leva a regra "só número com fonte"');

// 3) foto só vai pra cérebro que enxerga (nunca Groq/Cerebras/PC sem PC_VISAO)
H.PROPS.PC_URL = 'https://pc.exemplo';
pediu = [];
H.setFetch((u, o) => { const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; pediu.push({ u, b }); return { getResponseCode: () => 429, getContentText: () => 'rate limit 429' }; });
r = H.post({ pin: '1234', acao: 'chat', imagem: 'data:image/png;base64,AAAA', mensagens: [{ role: 'user', content: 'o que tem nessa foto?' }] });
const usados = pediu.map(x => x.u);
ok(usados.length && usados.every(u => /generativelanguage|mistral|nvidia/.test(u)), 'foto só tentou Gemini, Mistral e NVIDIA VL (' + usados.length + ' chamadas)');
ok(!usados.some(u => /groq|cerebras|pc\.exemplo/.test(u)), 'foto nunca vai pro Groq, Cerebras nem pro PC sem visão');
delete H.PROPS.PC_URL;

// 4) foto repetida e erro anterior
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok' } }] }) }));
r = H.post({ pin: '1234', acao: 'chat', imagem: 'data:image/png;base64,AAAA', fotoRepetida: true, mensagens: [{ role: 'user', content: 'nessa foto tá o erro' }] });
const msgsAba = H.sheets.mensagens.rows;
ok(msgsAba.some(l => /\[📷 mesma foto de antes\]/.test(String(l[3]))), 'foto reenviada grava "mesma foto de antes" (não conta como foto nova)');
ok(r.passos.some(p => /Olhou de novo a foto/.test(p)), 'passo diz que olhou a foto de antes');
pediu = [];
H.setFetch((u, o) => { const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; pediu.push({ u, b }); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'a conexão caiu' } }] }) }; });
r = H.post({ pin: '1234', acao: 'chat', erroAnterior: 'Load failed', mensagens: [{ role: 'user', content: 'Porque falhou?' }] });
ok(pediu.some(x => x.b && x.b.messages && /ERRO QUE O APP MOSTROU[\s\S]*Load failed[\s\S]*conexão/.test(x.b.messages[0].content)), '"Porque falhou?" recebe o erro do app e o que ele significa');
ok(/5b\. Erro e falha/.test(run('PERSONA')), 'regra: explicar falha só com prova, nunca inventar causa');

// 5) aula fraca (só cosseno médio) não entra completa
run('aulasPara = function(){ var a=["B55","Bugs de Unreal","x","x","regra unreal",2]; a.motivo={palavra:false,significado:true,bm25:0,cosseno:0.66}; var b=["C05","Listas de preço","x","x","regra lista",3]; b.motivo={palavra:true,significado:false,bm25:30,cosseno:0.5}; return [a,b]; }');
const ctxA = run('contextoAulas("faz a lista", 2)');
ok(/AULAS QUE SE APLICAM[\s\S]*\[C05\]/.test(ctxA) && !/AULAS QUE SE APLICAM[^#]*\[B55\]/.test(ctxA.split('### OUTRAS')[0]), 'aula só por cosseno 0,66 vira "talvez"; a que bate por palavra entra completa');
run('aulasPara = function(){ var a=["B55","Bugs de Unreal","x","x","regra unreal",2]; a.motivo={palavra:false,significado:true,bm25:0,cosseno:0.66}; return [a]; }');
ok(!/AULAS QUE SE APLICAM \(o jeito/.test(run('contextoAulas("de onde vc tirou o 16 duo", 2)')), 'sem aula forte, nenhuma entra como "se aplica"');

// 6) estudo 24h: aprende com a reclamação, com web, e grava pra revisar
const m = H.sheets.mensagens;
m.rows.push(['chatE', '2026-10-31 15:44:21', 'thiago', 'iPhone duo vs 18 pro Max', '', 'IPHONE'],
  ['chatE', '2026-10-31 15:44:35', 'zicoai', 'iPhone 16 (Duo): chip A18...', 'Gemini', 'IPHONE'],
  ['chatE', '2026-10-31 15:46:36', 'thiago', 'Mas de onde vc tirou o 16 duo que nem existe?', '', 'IPHONE']);
pediu = [];
H.setFetch((u, o) => {
  const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; pediu.push({ u, b });
  if (/duckduckgo|bing|jina/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'iPhone Duo: dobrável da Apple, chip A20 Pro (fonte)' };
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ causa: 'trocou Duo por 16 sem pesquisar', regra: 'modelo citado: pesquisar antes', porque: 'o modelo não conhece lançamentos', situacoes: ['x vs y'], erro_comum: 'chutar', resposta_certa: 'Duo × 18 Pro Max com fonte', tipo: 'comparativo' }) } }] }) };
});
Object.keys(H.CACHE).forEach(k => delete H.CACHE[k]);   // tira o castigo dos 429 do teste da foto
run("PropertiesService.getScriptProperties().setProperty('ERROS_ATE', '2026-10-31 15:00:00')");
const est = H.post({ acao: 'ponteEstudar', segredo: 'seg-mac' });
ok(est.ok && est.aprendeu && /pesquisar/.test(est.regra), 'Mac puxa uma rodada: aprendeu com a reclamação');
const ee = H.sheets.estudo_erros.rows;
ok(ee.length === 2 && /duo/i.test(ee[1][2]) && /16 \(Duo\)/.test(ee[1][3]) && ee[1][10] === 'revisar', 'aba estudo_erros: pedido, resposta errada, aula e status "revisar"');
ok(/Regra:[\s\S]*Por quê[\s\S]*Situações/.test(ee[1][7]), 'rascunho da aula no formato de professor');
ok(H.sheets.exemplos.rows.some(l => /duo/i.test(String(l[1])) && /erro corrigido \(revisar\)/.test(l.join('|'))), 'exemplo de treino entra como "revisar"');
ok(H.post({ acao: 'ponteEstudar', segredo: 'seg-mac' }).pulou, 'segunda rodada em menos de 20 min é pulada (cota grátis)');
ok(H.post({ acao: 'ponteEstudar', segredo: 'errado' }).erro === 'segredo errado', 'estudar pela ponte exige o segredo');
ok(run('TEMAS_ESTUDO.filter(t => t.tipo === "código").length') >= 10, 'estudo cobre 10+ temas de programação');
ok((+(run('VERSAO_CEREBRO')).match(/versão (\d+)/)[1] >= 51), 'cérebro na versão 51 ou mais nova');
