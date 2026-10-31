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

// 4) ponte do PC: segredo no cabeçalho, ferramentas, print descrito
H.PROPS.PONTE_URL = 'https://pc.ts.net/ponte-abc/'; H.PROPS.PONTE_SEGREDO = 'seg123';
const chamadasPonte = [];
H.setFetch((u, o) => {
  if (/pc\.ts\.net\/ponte-abc\/$/.test(u)) {
    const b = JSON.parse(o.payload); chamadasPonte.push({ b, h: o.headers });
    if (o.headers['X-Zico-Ponte'] !== 'seg123') return { getResponseCode: () => 401, getContentText: () => '{"ok":false}' };
    if (b.acao === 'status') return json({ ok: true, nome: 'DESKTOP-UL41KIJ', hora: '30/10/2026 21:40', disco: 'C: 120 GB livres', pastas: [{ caminho: 'C:\\Users\\thiag\\ZicoAI', escrever: true }, { caminho: 'C:\\Users\\thiag\\Downloads', escrever: false }] });
    if (b.acao === 'listar') return json({ ok: true, pasta: 'C:\\Users\\thiag\\Downloads', itens: [{ nome: 'nota.pdf', tipo: 'arquivo', tamanho: 20480, modificado: '30/10/2026 10:00' }, { nome: 'fotos', tipo: 'pasta' }] });
    if (b.acao === 'escrever') return json({ ok: true, arquivo: 'C:\\Users\\thiag\\ZicoAI\\lista (2).txt' });
    if (b.acao === 'print') return json({ ok: true, mime: 'image/jpeg', base64: Buffer.from('jpg').toString('base64') });
    if (b.acao === 'comando') return json({ ok: false, erro: 'Comando fora da lista segura' });
    return json({ ok: false, erro: 'x' });
  }
  if (/pc\.ts\.net\/ollama\/api\/tags/.test(u)) return json({ models: [{ name: 'zicoai:latest' }, { name: 'qwen3.5:9b' }] });
  if (/comfy\.ts\.net\/system_stats/.test(u)) return { getResponseCode: () => 502, getContentText: () => 'bad gateway' };
  if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.messages && Array.isArray(b.messages[0].content)) return resp('Na tela tem o Chrome aberto no WhatsApp Web e o ComfyUI.'); }
  return json({});
});
const run = n => require('vm').runInContext('FERRAMENTAS', H.ctx)[n].run;
ok(/PC DESKTOP-UL41KIJ/.test(run('pc_status')({})) && chamadasPonte[0].h['X-Zico-Ponte'] === 'seg123', 'pc_status manda o segredo e lê o PC');
ok(/📄 nota\.pdf \(20 KB/.test(run('pc_listar')({ pasta: 'Downloads' })) && /📁 fotos/.test(run('pc_listar')({ pasta: 'Downloads' })), 'pc_listar mostra arquivos e pastas');
ok(/lista \(2\)\.txt/.test(run('pc_escrever')({ arquivo: 'lista.txt', conteudo: 'oi' })), 'pc_escrever nunca sobrescreve (ponte cria nome (2))');
const pr = run('pc_print')({});
ok(/Print salvo: https:\/\/drive\.google\.com\/thumbnail\?id=IMGID/.test(pr) && /WhatsApp Web/.test(pr), 'pc_print salva no Drive e descreve a tela');
let erro = ''; try { run('pc_comando')({ nome: 'formatar' }); } catch (e) { erro = e.message; }
ok(/fora da lista segura/.test(erro), 'comando fora da lista é recusado pela ponte');
H.PROPS.PONTE_SEGREDO = 'errado';
erro = ''; try { run('pc_status')({}); } catch (e) { erro = e.message; }
ok(/recusou o segredo/.test(erro), 'segredo errado → erro claro');
H.PROPS.PONTE_SEGREDO = 'seg123';
ok(/pc_print/.test(require('vm').runInContext('PROMPT_AGENTE', H.ctx)), 'agente conhece as ferramentas do PC');

// 5) dispositivos
H.PROPS.PC_URL = 'https://pc.ts.net/ollama'; H.PROPS.COMFY_URL = 'https://comfy.ts.net';
const d = H.post({ pin: '1234', acao: 'dispositivos' });
const nome = n => d.dispositivos.find(x => x.nome.indexOf(n) === 0);
ok(nome('Ollama').ok && /zicoai:latest/.test(nome('Ollama').detalhe), 'Ollama conectado com modelos');
ok(!nome('ComfyUI').ok && nome('ComfyUI').detalhe === 'fechado', 'ComfyUI fechado aparece desconectado');
ok(nome('Ponte').ok && /ZicoAI ✎/.test(nome('Ponte').detalhe), 'ponte conectada com pastas');
delete H.PROPS.PC_URL; delete H.PROPS.COMFY_URL;

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
