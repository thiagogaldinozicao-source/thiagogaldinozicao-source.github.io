// APIs grátis, Whisper, Telegram, GitHub
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
let sys = '', chamadas = [];
function mockBase(u, o) {
  chamadas.push(u);
  if (/awesomeapi/.test(u)) return json({ USDBRL: { bid: '5.4012', ask: '5.4080', pctChange: '-0.35', create_date: '2026-10-30 15:50:00' } });
  if (/open-meteo/.test(u)) return json({ current: { temperature_2m: 27.4, weather_code: 2 }, daily: { time: ['2026-10-30', '2026-10-31', '2026-11-01'], temperature_2m_max: [31, 29, 25], temperature_2m_min: [18, 17, 16], precipitation_probability_max: [10, 60, 80], weather_code: [2, 61, 95] } });
  if (/viacep/.test(u)) return json({ logradouro: 'Rua Zeferino Paiva', bairro: 'Centro', localidade: 'Itaú de Minas', uf: 'MG' });
  if (/brasilapi.*cnpj/.test(u)) return json({ razao_social: 'DEVIA COMERCIO LTDA', nome_fantasia: 'Devia', descricao_situacao_cadastral: 'ATIVA', logradouro: 'Rua X', numero: '1', bairro: 'Centro', municipio: 'São Paulo', uf: 'SP', cnae_fiscal_descricao: 'Comércio de eletrônicos' });
  if (/brasilapi.*feriados/.test(u)) return json([{ date: '2026-01-01', name: 'Confraternização' }, { date: '2026-11-02', name: 'Finados' }, { date: '2026-11-15', name: 'Proclamação da República' }, { date: '2026-12-25', name: 'Natal' }]);
  if (/news\.google/.test(u)) return { getResponseCode: () => 200, getContentText: () => '<rss><channel><item><title>Apple lança iPhone 18 em março</title><pubDate>Thu, 30 Oct 2026 10:00:00 GMT</pubDate></item><item><title>iOS 27 beta sai hoje</title><pubDate>Thu, 30 Oct 2026 09:00:00 GMT</pubDate></item></channel></rss>' };
  if (/audio\/transcriptions/.test(u)) return json({ text: ' quanto tá o iphone 15 hoje ' });
  if (/api\.telegram\.org\/bot.*\/(sendMessage|sendPhoto|setWebhook|getFile)/.test(u)) { const b = JSON.parse(o.payload); TG.push({ m: u.split('/').pop(), b }); return json({ ok: true, result: /getFile/.test(u) ? { file_path: 'voice/1.ogg' } : { message_id: 1 } }); }
  if (/api\.telegram\.org\/file/.test(u)) return { getResponseCode: () => 200, getBlob: () => ({ getBytes: () => Buffer.from('ogg'), getContentType: () => 'audio/ogg' }) };
  if (/api\.github\.com/.test(u)) { GH.push({ m: (o.method || 'get'), u, b: o.payload ? JSON.parse(o.payload) : null }); return (o.method || 'get') === 'get' ? { getResponseCode: () => 404, getContentText: () => '{}' } : { getResponseCode: () => 201, getContentText: () => '{"content":{}}' }; }
  if (o && typeof o.payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp('resposta da zicoai'); } }
  return json({});
}
const TG = [], GH = [];
H.setFetch(mockBase);
// dólar
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'como tá o dólar hoje?' }] });
ok(/### DÓLAR AGORA/.test(sys) && /R\$ 5,41 \(venda\)/.test(sys) && /R\$ 5,51/.test(sys), 'dólar ao vivo + regra dos 10 pontos: ' + (sys.match(/Regra do Thiago[^\n]*/) || [''])[0]);
chamadas = [];
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'e o dólar agora?' }] });
ok(!chamadas.some(u => /awesomeapi/.test(u)), 'dólar vem do cache na segunda vez');
// clima
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'vai chover amanhã?' }] });
ok(/### CLIMA EM ITAÚ/.test(sys) && /amanhã \(31\/10\): 17°C a 29°C, chuva, chance de chuva 60%/.test(sys), 'clima 3 dias');
// CEP / CNPJ / feriados / notícias
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'qual o endereço do cep 37975-000 pra entrega?' }] });
ok(/### CEP 37975-000/.test(sys) && /Rua Zeferino Paiva, Centro, Itaú de Minas\/MG/.test(sys), 'CEP');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'esse fornecedor 12.345.678/0001-90 é confiável?' }] });
ok(/### CNPJ/.test(sys) && /DEVIA COMERCIO LTDA \(Devia\) \| ATIVA/.test(sys), 'CNPJ');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'tem feriado esse mês?' }] });
ok(/### FERIADOS/.test(sys) && /02\/11: Finados/.test(sys) && !/Confraternização/.test(sys), 'feriados só futuros');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quais as notícias do iphone 18?' }] });
ok(/### NOTÍCIAS/.test(sys) && /Apple lança iPhone 18/.test(sys), 'notícias do Google News');
// transcrever
r = H.post({ pin: '1234', acao: 'transcrever', audio: 'data:audio/webm;base64,' + Buffer.from('audio').toString('base64') });
ok(r.ok && r.texto === 'quanto tá o iphone 15 hoje', 'whisper transcreve: ' + r.texto);
// publicar sem token
r = H.post({ pin: '1234', acao: 'publicar', nome: 'Lista', html: '<!DOCTYPE html><html><body>x</body></html>' });
ok(!r.ok && /GITHUB_TOKEN/.test(r.erro), 'publicar sem token avisa');
H.PROPS.GITHUB_TOKEN = 'ghp_x';
r = H.post({ pin: '1234', acao: 'publicar', nome: 'Lista de Compras!', html: '<!DOCTYPE html><html><body>x</body></html>' });
ok(r.ok && r.url === 'https://thiagogaldinozicao-source.github.io/apps/lista-de-compras/' && GH.some(g => g.m === 'put' && /apps\/lista-de-compras\/index\.html/.test(g.u) && g.b.content), 'publicar no GitHub: ' + r.url);
ok(H.sheets.memoria.rows.some(l => /App "lista-de-compras" publicado/.test(l[1])), 'publicação anotada na memória');
// telegram: webhook com segredo errado é ignorado
H.PROPS.TELEGRAM_TOKEN = 'tok'; H.PROPS.TELEGRAM_SEGREDO = 'seg';
const tg = (update, segredo) => JSON.parse(H.ctx.doPost({ parameter: { tg: segredo || 'seg' }, postData: { contents: JSON.stringify(update) } }).t);
let x = tg({ update_id: 1, message: { chat: { id: 555 }, text: 'oi' } }, 'errado');
ok(x.ok === false && TG.length === 0, 'segredo errado: ignora');
// desconhecido → pede PIN; PIN certo → registra
x = tg({ update_id: 2, message: { chat: { id: 555 }, text: 'oi' } });
ok(TG.length === 1 && /Me manda o PIN/.test(TG[0].b.text), 'desconhecido recebe pedido de PIN');
tg({ update_id: 3, message: { chat: { id: 555 }, text: '1234' } });
ok(H.PROPS.TELEGRAM_CHAT_ID === '555' && /Pronto, Thiago/.test(TG[1].b.text), 'PIN certo registra o chat');
// mensagem normal → responde e grava conversa Telegram
TG.length = 0;
tg({ update_id: 4, message: { chat: { id: 555 }, text: 'quanto tá o dólar?' } });
ok(TG.length === 1 && TG[0].m === 'sendMessage' && TG[0].b.text === 'resposta da zicoai' && TG[0].b.chat_id === '555', 'responde no Telegram');
ok(H.sheets.chats.rows.some(l => /Telegram/.test(l[1])) && H.sheets.mensagens.rows.some(l => l[5] === 'telegram' && l[2] === 'thiago'), 'conversa do Telegram gravada');
// mesmo update de novo (reenvio) → não responde 2x
tg({ update_id: 4, message: { chat: { id: 555 }, text: 'quanto tá o dólar?' } });
ok(TG.length === 1, 'update repetido ignorado');
// outro chat id → ignorado em silêncio
tg({ update_id: 5, message: { chat: { id: 999 }, text: 'oi' } });
ok(TG.length === 1, 'estranho é ignorado');
// áudio → transcreve e responde
TG.length = 0;
tg({ update_id: 6, message: { chat: { id: 555 }, voice: { file_id: 'v1', mime_type: 'audio/ogg' } } });
ok(TG.some(t => t.m === 'getFile') && TG.some(t => t.m === 'sendMessage' && t.b.text === 'resposta da zicoai'), 'áudio do Telegram vira pergunta');
ok(H.sheets.mensagens.rows.some(l => l[5] === 'telegram' && /quanto tá o iphone 15 hoje/.test(l[3])), 'texto transcrito gravado');
// resposta com imagem → sendPhoto; markdown limpo
TG.length = 0;
H.setFetch((u, o) => { if (o && typeof o.payload === 'string' && JSON.parse(o.payload).messages) return resp('**Pronto!**\n\n```\nmensagem pro cliente\n```\n\n![imagem gerada](https://image.pollinations.ai/prompt/x)'); return mockBase(u, o); });
tg({ update_id: 7, message: { chat: { id: 555 }, text: 'gera uma imagem de um iphone' } });
ok(TG.some(t => t.m === 'sendPhoto' && /pollinations/.test(t.b.photo)) && TG.some(t => t.m === 'sendMessage' && /^Pronto!\n\nmensagem pro cliente/.test(t.b.text)), 'imagem vai como foto, markdown limpo: ' + JSON.stringify(TG.map(t => t.m)));
// /nova
TG.length = 0; const convAntes = H.PROPS.TELEGRAM_CONVERSA;
tg({ update_id: 8, message: { chat: { id: 555 }, text: '/nova' } });
ok(H.PROPS.TELEGRAM_CONVERSA !== convAntes && /Conversa nova/.test(TG[0].b.text), '/nova começa conversa nova');
// ligarTelegram
TG.length = 0; H.ctx.ligarTelegram();
ok(TG[0].m === 'setWebhook' && TG[0].b.url === 'https://script.google.com/macros/s/X/exec?tg=seg', 'webhook apontado com segredo');
// bom dia vai pro telegram
TG.length = 0; H.setFetch(mockBase); H.ctx.bomDia();
ok(TG.some(t => t.m === 'sendMessage'), 'bom dia chega no Telegram');
// com PROXY_URL o webhook vai pro /tg do Worker com secret_token; segredo com @ é recusado
H.PROPS.PROXY_URL = 'https://zicoai.x.workers.dev'; H.PROPS.PROXY_SEGREDO = '@ruim'; H.PROPS.TELEGRAM_SEGREDO = 'seg';
let deuErro = ''; try { H.ctx.ligarTelegram(); } catch (e) { deuErro = e.message; }
ok(/só pode ter letras/.test(deuErro), 'segredo com @ é recusado quando usa o Worker');
H.PROPS.PROXY_SEGREDO = 'seg_bom-1'; H.PROPS.DEPLOY_ID = 'DEPX'; TG.length = 0; H.ctx.ligarTelegram();
const hook = TG.find(t => t.m === 'setWebhook');
ok(hook && hook.b.url === 'https://zicoai.x.workers.dev/tg' && hook.b.secret_token === 'seg_bom-1', 'webhook aponta pro Worker com secret_token: ' + JSON.stringify(hook && hook.b.url));

// o Worker repassa com o segredo DELE (PROXY_SEGREDO): o doPost aceita
TG.length = 0; H.PROPS.TELEGRAM_CHAT_ID = '555';
let xx = JSON.parse(H.ctx.doPost({ parameter: { tg: 'seg_bom-1' }, postData: { contents: JSON.stringify({ update_id: 500, message: { chat: { id: 555 }, text: '/ajuda' } }) } }).t);
ok(xx.ok && TG.some(t => t.m === 'sendMessage'), 'webhook com o segredo do Worker é aceito');
xx = JSON.parse(H.ctx.doPost({ parameter: { tg: 'errado' }, postData: { contents: '{}' } }).t);
ok(xx.ok === false, 'segredo desconhecido continua recusado');
