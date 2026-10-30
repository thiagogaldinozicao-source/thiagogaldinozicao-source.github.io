// Conectores Google + imagem no PC (ComfyUI)
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
let sys = '';
H.setFetch((u, o) => { sys = JSON.parse(o.payload).messages[0].content; return resp('ok'); });
// contexto só entra quando a pergunta fala do assunto
H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi tudo bem' }] });
ok(!/### AGENDA/.test(sys) && !/### E-MAILS/.test(sys), 'pergunta comum não carrega agenda nem e-mail');
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'o que tem na agenda amanhã?' }] });
ok(/### AGENDA/.test(sys) && /Entregar iPhone do João/.test(sys) && r.passos.some(p => /Olhou a Agenda/.test(p)), 'agenda entra no sistema');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'chegou email do fornecedor?' }] });
ok(/### E-MAILS/.test(sys) && /Lista de preços/.test(sys) && /Will/.test(sys), 'e-mails recentes entram no sistema');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'acha a nota fiscal da devia no drive' }] });
ok(/### ARQUIVOS/.test(sys) && /Nota fiscal Devia/.test(sys), 'arquivos do Drive entram no sistema');
// ações
H.setFetch(() => resp('Marquei. [[AGENDA: Entregar iPhone pro Carlos || 2026-11-05 15:30 || 45]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'me lembra de entregar o iphone pro carlos dia 5 às 15:30' }] });
ok(H.EVENTOS.length === 1 && H.EVENTOS[0].t === 'Entregar iPhone pro Carlos' && H.EVENTOS[0].i.getHours() === 15 && (H.EVENTOS[0].f - H.EVENTOS[0].i) === 45 * 60000, 'evento criado com hora e duração certas');
ok(/📅 Agendado/.test(r.resposta) && r.salvou.includes('agenda') && !/\[\[AGENDA/.test(r.resposta), 'resposta confirma o agendamento: ' + r.resposta.slice(0, 80));
H.setFetch(() => resp('[[AGENDA: Sem data || amanhã || 30]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'x' }] });
ok(H.EVENTOS.length === 1 && /Não consegui agendar/.test(r.resposta), 'data inválida não cria evento e avisa');
H.setFetch(() => resp('Escrevi. [[EMAIL_RASCUNHO: will@x.com || Pedido iPhone 17 || Oi Will, manda 3 do 17 Pro Max 256.]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'escreve um email pro will pedindo 3 do 17' }] });
ok(H.RASCUNHOS.length === 1 && H.RASCUNHOS[0].a === 'Pedido iPhone 17' && /Rascunho salvo/.test(r.resposta) && /Nada foi enviado/.test(r.resposta), 'rascunho criado, nada enviado');
H.setFetch(() => resp('Anotado! [[VENDA: 2.500,00 || iPhone 13 128 seminovo]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'vendi um 13 por 2500' }] });
ok(H.sheets.vendas.rows.length === 2 && H.sheets.vendas.rows[1][1] === 2500 && /Hoje: R\$ 2\.500,00/.test(r.resposta), 'venda anotada e somada: ' + r.resposta.slice(0, 90));
H.setFetch(() => resp('[[VENDA: 1890 || capinha]]'));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'vendi capinha 1890' }] });
ok(/Hoje: R\$ 4\.390,00/.test(r.resposta), 'soma do dia acumula');
H.setFetch((u, o) => { sys = JSON.parse(o.payload).messages[0].content; return resp('ok'); });
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto vendi hoje?' }] });
ok(/### VENDAS ANOTADAS/.test(sys) && /Hoje: R\$ 4\.390,00 \(2\)/.test(sys), 'resumo de vendas entra no sistema');
// imagem: sem COMFY → pollinations
H.setFetch(() => resp('Bora [[IMAGEM: golden iphone]]'));
r = H.post({ pin: '1234', acao: 'chat', modo: 'imagem', mensagens: [{ role: 'user', content: 'gera' }] });
ok(/pollinations\.ai/.test(r.resposta) && r.passos.some(p => /nuvem/.test(p)), 'sem ComfyUI usa Pollinations');
// imagem: com COMFY → PC gera e salva no Drive
H.PROPS.COMFY_URL = 'https://pc.ts.net:8443'; 
H.PROPS.COMFY_WORKFLOW = JSON.stringify({ "6": { inputs: { text: "{{PROMPT}}", seed: "{{SEED}}" }, class_type: "CLIPTextEncode" } });
const chamadas = [];
H.setFetch((u, o) => {
  chamadas.push(u);
  if (/groq|generativelanguage|cerebras/.test(u)) return resp('Feito [[IMAGEM: golden "iphone" on black]]');
  if (/\/prompt$/.test(u)) { const b = JSON.parse(o.payload); chamadas.push('PROMPT=' + b.prompt['6'].inputs.text + ' SEED=' + b.prompt['6'].inputs.seed); return { getResponseCode: () => 200, getContentText: () => '{"prompt_id":"p1"}' }; }
  if (/\/history\/p1/.test(u)) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ p1: { outputs: { "9": { images: [{ filename: 'ZicoAI_0001.png', subfolder: '', type: 'output' }] } }, status: { status_str: 'success' } } }) };
  if (/\/view\?/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'png', getBlob: () => ({ setName: () => ({}) }) };
  return resp('?');
});
r = H.post({ pin: '1234', acao: 'chat', modo: 'imagem', mensagens: [{ role: 'user', content: 'gera um iphone dourado' }] });
ok(/drive\.google\.com\/thumbnail\?id=IMGID/.test(r.resposta), 'imagem do PC vira link do Drive: ' + r.resposta.slice(0, 100));
ok(chamadas.some(c => /PROMPT=golden "iphone" on black SEED=\d+/.test(c)), 'prompt (com aspas) e seed entraram no workflow: ' + chamadas.find(c => /PROMPT=/.test(c)));
ok(chamadas.some(c => /\/view\?filename=ZicoAI_0001\.png/.test(c)) && r.passos.some(p => /ComfyUI/.test(p)), 'baixou pelo /view e registrou o passo');
// ComfyUI fora → marca e cai pro pollinations
H.setFetch((u) => { if (/groq|generativelanguage/.test(u)) return resp('[[IMAGEM: x]]'); if (/\/prompt$/.test(u)) return { getResponseCode: () => 502, getContentText: () => 'bad' }; return resp('?'); });
r = H.post({ pin: '1234', acao: 'chat', modo: 'imagem', mensagens: [{ role: 'user', content: 'gera' }] });
ok(/pollinations/.test(r.resposta) && H.CACHE.comfy_off, 'ComfyUI 502 → Pollinations e marca comfy_off');
H.ctx.instalar();
// config pela planilha: COMFY_URL/WORKFLOW na aba config valem quando a propriedade não existe
delete H.PROPS.COMFY_URL; delete H.PROPS.COMFY_WORKFLOW; delete H.CACHE.comfy_off;
const cfg = H.ctx.aba('config'); cfg.appendRow(['COMFY_URL', 'https://cfg.ts.net:8443']); cfg.appendRow(['COMFY_WORKFLOW', JSON.stringify({ "6": { inputs: { text: "{{PROMPT}}" }, class_type: "X" } })]);
let urlUsada = '';
H.setFetch((u) => { if (/groq|generativelanguage/.test(u)) return resp('[[IMAGEM: y]]'); if (/\/prompt$/.test(u)) { urlUsada = u; return { getResponseCode: () => 200, getContentText: () => '{"prompt_id":"p2"}' }; } if (/\/history/.test(u)) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ p2: { outputs: { "9": { images: [{ filename: 'b.png', subfolder: '', type: 'output' }] } } } }) }; if (/\/view/.test(u)) return { getResponseCode: () => 200, getContentText: () => 'png', getBlob: () => ({ setName: () => ({}) }) }; return resp('?'); });
r = H.post({ pin: '1234', acao: 'chat', modo: 'imagem', mensagens: [{ role: 'user', content: 'gera' }] });
ok(urlUsada === 'https://cfg.ts.net:8443/prompt' && /drive\.google\.com/.test(r.resposta), 'config da planilha vale pro ComfyUI');
