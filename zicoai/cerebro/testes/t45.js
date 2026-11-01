// v62: chat lê o Chrome sozinho (WhatsApp aberto), telefone/CPF de cliente escondidos antes da nuvem
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.GEMINI_KEY = 'k'; H.PROPS.PONTE_SEGREDO_NAV = 'snav';
const e = run('esconderPessoal("Liga +55 35 9923-8354 ou (35) 99113-9180, CPF 123.456.789-09. Loja: 35991580070")');
ok(!/9923-8354|99113-9180|123\.456/.test(e) && /35991580070/.test(e), 'telefone e CPF de cliente viram •••, o número da loja fica: ' + e);
let enviado = '';
H.setFetch((u, o) => { const b = o && typeof o.payload === 'string' ? JSON.parse(o.payload) : {}; if (b.messages) enviado += JSON.stringify(b.messages); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: '```\nOi Marques, ...\n```' } }] }) }; });
// página colada pelo botão "Usar esta página": número some antes da nuvem e da planilha
let r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'e agora\n\n---\nPÁGINA ABERTA NO CHROME: WhatsApp (https://web.whatsapp.com/)\n+55 35 9923-8354\nMarques: me ajuda com 50 reais' }] });
ok(r.ok && !/9923-8354/.test(enviado) && !H.sheets.mensagens.rows.some(l => /9923-8354/.test(l.join('|'))), 'número do cliente não vai pra nuvem nem pra planilha');
// sem página: com a extensão ligada, lê a aba sozinha
run('CacheService.getScriptCache().put("ponte_visto_nav", String(Date.now()))');
let pedido = null;
run('ponteSemDetalhe = function(acao, dados, espera, disp){ if (disp === "nav" && acao === "ler") { globalThis.__p = {acao: acao, disp: disp}; return {ok:true, titulo:"WhatsApp", url:"https://web.whatsapp.com/", texto:"Conversa aberta no WhatsApp: Marques\\nHomem de Deus peço 50 reais (35) 99113-9180"}; } throw new Error("x"); };');
enviado = '';
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'oque responder pra esse cliente?' }] });
ok(r.ok && r.passos.some(p => /Leu a aba aberta no Chrome: WhatsApp/.test(p)), 'pedido sobre "esse cliente" lê a aba do Chrome sozinho');
ok(/Homem de Deus peço 50 reais/.test(enviado) && !/99113-9180/.test(enviado), 'a conversa aberta vai pro cérebro, sem o telefone');
ok(/NUNCA diga que não consegue ver o Chrome/.test(run('PERSONA')), 'regra: nunca dizer que não vê o Chrome');
run('CacheService.getScriptCache().remove("ponte_visto_nav")');
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'oque responder pra esse cliente?' }] });
ok(!r.passos.some(p => /Leu a aba/.test(p)), 'extensão desligada: não tenta ler');
ok((+(run('VERSAO_CEREBRO')).match(/versão (1\d\d|\d+)/)[1] >= 62), 'cérebro na versão 62');
// v63: "este cliente", "o que respondo" também leem o Chrome
run('CacheService.getScriptCache().put("ponte_visto_nav", String(Date.now()))');
for (const frase of ['oque responder pra este cliente?', 'o que eu respondo pra ela?', 'responde pro cara aí']) {
  const rr = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: frase }] });
  ok(rr.passos.some(p => /Leu a aba aberta no Chrome/.test(p)), '"' + frase + '" lê o Chrome');
}
// v64: tabelas e rede do Chrome
run('ponteSemDetalhe = function(acao, dados, espera, disp){ if (acao === "tabelas") return {ok:true, titulo:"Fornecedor", tabelas:[{n:1, linhas:2, colunas:2, dados:[["Modelo","Preço"],["iPhone 15","3.999"]]}]}; if (acao === "rede") return {ok:true, total:3, comErro:[{status:404, ms:20, tipo:"script", url:"https://x/app.js"}], lentas:[], ultimas:[]}; throw new Error("x"); };');
ok(/iPhone 15 \| 3\.999/.test(run('FERRAMENTAS.nav_tabelas.run({}, {pedido:"x"})')), 'nav_tabelas traz a tabela em linhas/colunas');
ok(/404 · 20 ms · script · https:\/\/x\/app\.js/.test(run('FERRAMENTAS.nav_rede.run({}, {pedido:"x"})')), 'nav_rede mostra a chamada que deu 404');
// v65: "vê se esse site tem erro" depura na hora (sem agente)
run('ponteSemDetalhe = function(acao, dados, espera, disp){ if (acao === "ler") return {ok:true, abaId: 7, titulo:"Calculadora", url:"https://x/calc/", texto:"Calc"}; if (acao === "erros") return {ok:true, titulo:"Calculadora", url:"https://x/calc/", erros:[{tipo:"js", msg:"naoExiste is not defined", onde:"calc.js:12"}]}; if (acao === "rede") return {ok:true, total:2, comErro:[{status:404, ms:9, tipo:"script", url:"https://x/calc/app.js"}], lentas:[], ultimas:[]}; throw new Error("x"); };');
enviado = '';
r = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: 'vê se esse site tem erro' }] });
ok(r.passos.some(p => /Olhou os erros e a rede da aba/.test(p)) && /404/.test(enviado) && /DEPURAR AGORA/.test(enviado), 'depura na hora: erros + rede da aba vão pro cérebro');
// v66: pela extensão, sempre lê a aba (o site do lado é o assunto)
run('ponteSemDetalhe = function(acao, dados, espera, disp){ if (acao === "ler") return {ok:true, abaId: 3, titulo:"Fornecedor X", url:"https://x/", texto:"iPhone 15 3.999"}; throw new Error("x"); };');
enviado = '';
r = H.post({ pin: '1234', acao: 'chat', capricho: false, naExtensao: true, mensagens: [{ role: 'user', content: 'quanto tá o 15 aqui?' }] });
ok(r.passos.some(p => /Leu a aba aberta no Chrome: Fornecedor X/.test(p)) && /PAINEL DA EXTENSÃO/.test(enviado), 'pela extensão: lê a aba mesmo sem falar "chrome"');
r = H.post({ pin: '1234', acao: 'chat', capricho: false, naExtensao: true, mensagens: [{ role: 'user', content: 'valeu' }] });
ok(!r.passos.some(p => /Leu a aba/.test(p)), 'conversa à toa pela extensão não lê a aba');
