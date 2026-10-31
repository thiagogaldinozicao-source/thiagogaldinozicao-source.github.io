// Conversa (fixar/renomear/projeto), projetos, dispositivos, ponte do PC, pesquisa reserva e Gemini sobrecarregado
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
let sys = '';
H.setFetch((u, o) => { if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp('oi'); } } return json({}); });

// 1) conversa: fixar, renomear, projeto
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'primeira conversa' }] });
const c1 = r.chatId;
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'segunda conversa' }] });
ok(H.post({ pin: '1234', acao: 'chatMeta', chatId: c1, fixada: true, titulo: 'Conversa importante' }).ok, 'fixou e renomeou');
let l = H.post({ pin: '1234', acao: 'chats' }).chats;
ok(l[0].id === c1 && l[0].fixada && l[0].titulo === 'Conversa importante', 'fixada vem primeiro com o nome novo');
ok(H.sheets.chats.rows[0][5] === 'Fixada' && H.sheets.chats.rows[0][6] === 'Projeto', 'cabeçalho novo na aba chats');
ok(!H.post({ pin: '1234', acao: 'chatMeta', chatId: 'naoexiste', fixada: true }).ok, 'conversa que não existe dá erro');

// 2) projetos: criar, instruções, arquivo, entra no sistema
const pj = H.post({ pin: '1234', acao: 'projetoSalvar', nome: 'Loja' });
ok(pj.ok && /^pj/.test(pj.id), 'criou projeto');
H.post({ pin: '1234', acao: 'projetoSalvar', id: pj.id, instrucoes: 'Sempre mostre o preço no Pix e em 12x.' });
ok(H.post({ pin: '1234', acao: 'projetoArquivo', projeto: pj.id, nome: 'tabela.md', conteudo: 'iPhone 13 128GB: R$ 2.300 no Pix' }).ok, 'arquivo no projeto');
ok(H.post({ pin: '1234', acao: 'projetoArquivo', projeto: pj.id, nome: 'tabela.md', conteudo: 'iPhone 13 128GB: R$ 2.250 no Pix' }).trocou, 'mesmo nome troca o conteúdo');
ok(!H.post({ pin: '1234', acao: 'projetoArquivo', projeto: pj.id, nome: 'clientes.txt', conteudo: 'Maria CPF 123.456.789-00' }).ok, 'arquivo com CPF é barrado');
r = H.post({ pin: '1234', acao: 'chat', projeto: pj.id, mensagens: [{ role: 'user', content: 'quanto tá o 13?' }] });
ok(/### PROJETO "Loja"/.test(sys) && /Sempre mostre o preço no Pix/.test(sys) && /R\$ 2\.250 no Pix/.test(sys) && !/R\$ 2\.300/.test(sys), 'conversa do projeto lê instruções e arquivo');
ok(r.passos.some(p => /Usou o projeto "Loja" \(instruções \+ 1 arquivo\)/.test(p)), 'passo mostra o projeto');
const c3 = r.chatId;
r = H.post({ pin: '1234', acao: 'chat', chatId: c3, mensagens: [{ role: 'user', content: 'quanto tá o 13?' }, { role: 'assistant', content: 'oi' }, { role: 'user', content: 'e no cartão?' }] });
ok(/### PROJETO "Loja"/.test(sys), 'segunda mensagem da conversa continua no projeto (sem o app mandar)');
H.post({ pin: '1234', acao: 'chatMeta', chatId: c1, projeto: pj.id });
const ps = H.post({ pin: '1234', acao: 'projetos' }).projetos;
ok(ps.length === 1 && ps[0].conversas === 2 && ps[0].arquivos.length === 1 && ps[0].arquivos[0].nome === 'tabela.md', 'lista de projetos com conversas e arquivos');
ok(H.post({ pin: '1234', acao: 'projetoTirarArquivo', projeto: pj.id, nome: 'tabela.md' }).ok && H.post({ pin: '1234', acao: 'projetos' }).projetos[0].arquivos.length === 0, 'tirou o arquivo');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'conversa fora de projeto' }] });
ok(!/### PROJETO/.test(sys), 'conversa sem projeto não recebe projeto');

// 3) trabalhando: conversa com tarefa rodando
H.ctx.criarTarefa('tarefa longa da conversa', c1, 'pc');
ok(H.post({ pin: '1234', acao: 'chats' }).chats.find(c => c.id === c1).trabalhando, 'conversa com tarefa aparece "trabalhando"');

// 4) ponte do PC (v2): o PC busca os pedidos; aqui um "PC de mentira" responde
H.PROPS.PONTE_SEGREDO = 'seg123';
const vm = require('vm');
let pcLigado = true; const vistos = [];
const respostaPC = p => {
  if (p.acao === 'status') return { ok: true, nome: 'DESKTOP-UL41KIJ', hora: '30/10/2026 21:40', disco: 'C: 120 GB livres', pastas: [{ caminho: 'C:\\Users\\thiag\\ZicoAI', escrever: true }, { caminho: 'C:\\Users\\thiag\\Downloads', escrever: false }] };
  if (p.acao === 'listar') return { ok: true, pasta: 'C:\\Users\\thiag\\Downloads', itens: [{ nome: 'nota.pdf', tipo: 'arquivo', tamanho: 20480, modificado: '30/10/2026 10:00' }, { nome: 'fotos', tipo: 'pasta' }] };
  if (p.acao === 'escrever') return { ok: true, arquivo: 'C:\\Users\\thiag\\ZicoAI\\lista (2).txt' };
  if (p.acao === 'print') return { ok: true, mime: 'image/jpeg', base64: Buffer.from('j'.repeat(250000)).toString('base64') };
  if (p.acao === 'comando') return { ok: false, erro: 'Comando fora da lista segura' };
  return { ok: false, erro: 'x' };
};
const sleepOrig = H.ctx.Utilities.sleep;
H.ctx.Utilities.sleep = ms => {
  sleepOrig(ms);
  if (!pcLigado) return;
  // o PC faz uma busca (sem esperar) e responde tudo pelo doPost, como o ponte.ps1
  const peds = vm.runInContext('ponteFila(f => f.splice(0, f.length))', H.ctx);
  peds.forEach(p => { vistos.push(p); const r = H.post({ acao: 'ponteResposta', segredo: 'seg123', id: p.id, resultado: JSON.stringify(respostaPC(p)) }); if (!r.ok) throw new Error('resposta recusada'); });
};
// sem o PC ter aparecido ainda: erro na hora (sem esperar 45 s)
let erro = ''; try { vm.runInContext('ponte("status")', H.ctx); } catch (e) { erro = e.message; }
ok(/PC desligado ou ponte fechada/.test(erro), 'PC que nunca apareceu: erro na hora');
ok(!H.post({ acao: 'ponteBuscar', segredo: 'errado' }).ok, 'busca com segredo errado é recusada');
ok(!H.post({ acao: 'ponteBuscar' }).ok, 'busca sem segredo é recusada');
pcLigado = false;
const b = H.post({ acao: 'ponteBuscar', segredo: 'seg123', nome: 'DESKTOP-UL41KIJ', versao: '2.0' });
ok(b.ok && Array.isArray(b.pedidos) && b.pedidos.length === 0, 'busca sem pedido volta vazia depois da espera');
pcLigado = true;
const run = n => vm.runInContext('FERRAMENTAS', H.ctx)[n].run;
ok(/PC DESKTOP-UL41KIJ/.test(run('pc_status')({})), 'pc_status: pedido foi pela fila e a resposta voltou');
ok(/📄 nota\.pdf \(20 KB/.test(run('pc_listar')({ pasta: 'Downloads' })) && vistos.some(p => p.acao === 'listar' && p.dados.pasta === 'Downloads'), 'pc_listar manda a pasta pro PC');
ok(/lista \(2\)\.txt/.test(run('pc_escrever')({ arquivo: 'lista.txt', conteudo: 'oi' })), 'pc_escrever nunca sobrescreve (ponte cria nome (2))');
H.setFetch((u, o) => { if (typeof (o || {}).payload === 'string') { const bb = JSON.parse(o.payload); if (bb.messages && Array.isArray(bb.messages[0].content)) return resp('Na tela tem o Chrome aberto no WhatsApp Web e o ComfyUI.'); } return json({}); });
const pr = run('pc_print')({});
ok(/Print salvo: https:\/\/drive\.google\.com\/thumbnail\?id=IMGID/.test(pr) && /WhatsApp Web/.test(pr), 'pc_print grande (vários pedaços) salva no Drive e descreve a tela');
erro = ''; try { run('pc_comando')({ nome: 'formatar' }); } catch (e) { erro = e.message; }
ok(/fora da lista segura/.test(erro), 'comando fora da lista é recusado pela ponte');
ok(/pc_print/.test(vm.runInContext('PROMPT_AGENTE', H.ctx)), 'agente conhece as ferramentas do PC');
// PC sumiu no meio: espera e dá erro claro, e o pedido sai da fila
pcLigado = false;
erro = ''; try { vm.runInContext('ponte("status")', H.ctx); } catch (e) { erro = e.message; }
ok(/não respondeu a tempo/.test(erro) && vm.runInContext('JSON.parse(CacheService.getScriptCache().get("ponte_fila") || "[]").length', H.ctx) === 0, 'PC não respondeu: erro claro e fila limpa');
// pedido velho (já desistido) não é entregue depois
vm.runInContext('ponteFila(f => f.push({ id: "pvelho", acao: "print", dados: {}, ate: Date.now() - 1000 }))', H.ctx);
ok(H.post({ acao: 'ponteBuscar', segredo: 'seg123' }).pedidos.length === 0, 'pedido vencido não vai pro PC');
pcLigado = true;
erro = ''; try { vm.runInContext('ponte("status")', H.ctx); } catch (e) { erro = e.message; }
ok(erro === '', 'PC voltou: funciona de novo');

// 5) dispositivos
H.PROPS.PC_URL = 'https://pc.ts.net/ollama'; H.PROPS.COMFY_URL = 'https://comfy.ts.net';
H.setFetch((u, o) => {
  if (/pc\.ts\.net\/ollama\/api\/tags/.test(u)) return json({ models: [{ name: 'zicoai:latest' }, { name: 'qwen3.5:9b' }] });
  if (/comfy\.ts\.net\/system_stats/.test(u)) return { getResponseCode: () => 502, getContentText: () => 'bad gateway' };
  return json({});
});
const d = H.post({ pin: '1234', acao: 'dispositivos' });
const nome = n => d.dispositivos.find(x => x.nome.indexOf(n) === 0);
ok(nome('Ollama').ok && /zicoai:latest/.test(nome('Ollama').detalhe), 'Ollama conectado com modelos');
ok(!nome('ComfyUI').ok && nome('ComfyUI').detalhe === 'fechado', 'ComfyUI fechado aparece desconectado');
ok(nome('Ponte').ok && /ZicoAI ✎/.test(nome('Ponte').detalhe), 'ponte conectada com pastas');
delete H.PROPS.PC_URL; delete H.PROPS.COMFY_URL;
H.ctx.Utilities.sleep = sleepOrig;

// 6) pesquisa reserva quando o Groq falha
let usouBusca = '';
H.setFetch((u, o) => {
  if (/r\.jina\.ai\/https:\/\/html\.duckduckgo\.com/.test(u)) { usouBusca = u; return { getResponseCode: () => 200, getContentText: () => 'Resultados: iPhone 16 128GB Mercado Livre R$ 4.499 à vista. '.repeat(20) }; }
  if (typeof (o || {}).payload !== 'string') return json({});
  const b = JSON.parse(o.payload);
  if (b.tools) return { getResponseCode: () => 500, getContentText: () => 'browser_search fora' };
  if (/RESULTADOS DA BUSCA NA WEB \(DuckDuckGo/.test(b.messages[0].content)) return resp('No Mercado Livre tá R$ 4.499 à vista.');
  return resp('não sei');
});
r = H.post({ pin: '1234', acao: 'chat', modo: 'web', mensagens: [{ role: 'user', content: 'preço iphone 16 mercado livre' }] });
ok(/R\$ 4\.499/.test(r.resposta) && usouBusca && r.passos.some(p => /pela reserva \(DuckDuckGo\)/.test(p)) && !/não consegui pesquisar/.test(r.resposta), 'Groq caiu → pesquisa reserva respondeu com dado da busca');

// 7) Gemini sobrecarregado: fica fora 90 s e a próxima pergunta nem tenta
let tentouGemini = 0;
H.setFetch((u, o) => { if (typeof (o || {}).payload !== 'string') return json({}); const b = JSON.parse(o.payload); if (/gemini/.test(b.model)) { tentouGemini++; return { getResponseCode: () => 503, getContentText: () => '{"error":{"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary."}}' }; } return resp('respondi pelo reserva'); });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem' }] });
ok(/reserva/.test(r.resposta) && r.passos.some(p => /sobrecarregado \(alta demanda\), fica 90s fora/.test(p)), 'Gemini lotado → troca e fica fora 90 s');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'e agora?' }] });
ok(tentouGemini === 1 && r.passos.some(p => /Gemini pulado: de castigo/.test(p)), 'próxima pergunta pula o Gemini direto (sem perder tempo)');

// 8) Mistral: small lotado (429 capacity) → tenta o medium
H.PROPS.MISTRAL_KEY = 'mk'; const mods = [];
H.setFetch((u, o) => { const b = JSON.parse(o.payload); mods.push(b.model); if (b.model === 'mistral-small-latest') return { getResponseCode: () => 429, getContentText: () => '{"message":"Service tier capacity exceeded for this model.","type":"service_tier_capacity_exceeded"}' }; return resp('oi do medium'); });
ok(require('vm').runInContext('chamarCompat(CEREBROS.mistral, [{ role: "user", content: "oi" }], 50)', H.ctx) === 'oi do medium' && mods.join() === 'mistral-small-latest,mistral-medium-latest', 'Mistral lotado → reserva: ' + mods.join(' → '));
delete H.PROPS.MISTRAL_KEY;

// 9) texto longo colado vira documento: sem pesquisa, sem e-mail, sem abrir link de dentro
{
  let sys9 = ''; const urls9 = [];
  H.setFetch((u, o) => { urls9.push(u); if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.tools) return resp('pesquisou'); if (b.messages) { sys9 = b.messages[0].content; return resp('Entendi o status.'); } } return json({}); });
  const status = '# ZicoAI — status\nGuia: https://github.com/x/y/LEIAME.md\n' + 'Pendência: ver o dólar, o e-mail do fornecedor e o preço atualizado. '.repeat(40);
  const r9 = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: status }] });
  ok(/### TEXTO LONGO COLADO/.test(sys9) && r9.passos.some(p => /leu como documento/.test(p)), 'texto longo colado é tratado como documento');
  ok(!r9.passos.some(p => /Pesquis|Leu a caixa de entrada|Leu a página do link/.test(p)) && !urls9.some(u => /r\.jina\.ai|gmail/i.test(u)), 'não pesquisou, não leu e-mail nem abriu link de dentro do texto');
  const r10 = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto tá o dólar hoje?' }] });
  ok(!/### TEXTO LONGO COLADO/.test(sys9), 'pergunta curta continua normal');
}

// 10) editar mensagem: corta a conversa a partir da mensagem editada
{
  H.setFetch((u, o) => resp('resposta'));
  const a = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'pergunta um' }] });
  H.post({ pin: '1234', acao: 'chat', chatId: a.chatId, mensagens: [{ role: 'user', content: 'pergunta um' }, { role: 'assistant', content: 'resposta' }, { role: 'user', content: 'pergunta dois' }] });
  const antes = H.sheets.mensagens.rows.filter(x => x[0] === a.chatId).length;
  const c = H.post({ pin: '1234', acao: 'cortarConversa', chatId: a.chatId, manter: 2 });
  const depois = H.sheets.mensagens.rows.filter(x => x[0] === a.chatId).map(x => x[3]);
  ok(antes === 4 && c.ok && c.apagadas === 2 && depois.length === 2 && depois[0] === 'pergunta um', 'cortar conversa mantém as 2 primeiras e apaga o resto');
  ok(H.post({ pin: '1234', acao: 'cortarConversa', chatId: '', manter: 0 }).ok === false, 'sem conversa: erro');
}

// 11) pc_testar: pede pra ponte rodar os testes e espera mais (até ~3 min)
{
  H.PROPS.PONTE_SEGREDO = 'seg123';
  const vm2 = require('vm');
  vm2.runInContext('CacheService.getScriptCache().put("ponte_visto", String(Date.now()), 600)', H.ctx);
  const so = H.ctx.Utilities.sleep; let pedido = null;
  H.ctx.Utilities.sleep = ms => { so(ms); const ps = vm2.runInContext('ponteFila(f => f.splice(0, f.length))', H.ctx); ps.forEach(p => { pedido = p; H.post({ acao: 'ponteResposta', segredo: 'seg123', id: p.id, resultado: JSON.stringify({ ok: true, saida: 'TOTAL: 335 testes ok, 0 arquivo(s) com falha' }) }); }); };
  const out = vm2.runInContext('FERRAMENTAS', H.ctx).pc_testar.run({});
  ok(/TOTAL: 335 testes ok/.test(out) && pedido.dados.nome === 'testes_zicoai' && pedido.ate - Date.now() > 100000, 'pc_testar roda os testes no PC com espera longa');
  ok(/MÉTODO \(o mesmo do Claude\)/.test(vm2.runInContext('PROMPT_AGENTE', H.ctx)), 'agente recebeu o método de trabalho');
  H.ctx.Utilities.sleep = so;
}
