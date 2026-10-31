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
ok(/versão (6\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 62');
// v63: "este cliente", "o que respondo" também leem o Chrome
run('CacheService.getScriptCache().put("ponte_visto_nav", String(Date.now()))');
for (const frase of ['oque responder pra este cliente?', 'o que eu respondo pra ela?', 'responde pro cara aí']) {
  const rr = H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: frase }] });
  ok(rr.passos.some(p => /Leu a aba aberta no Chrome/.test(p)), '"' + frase + '" lê o Chrome');
}
