// "Já existe parecido": pedido de app repetido → avisa o que já tem
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
let sys = ''; H.PROPS.GITHUB_TOKEN = 'ghp';
H.setFetch((u, o) => { if (/api\.github\.com.*\/contents\/apps$/.test(u)) return json([{ type: 'dir', name: 'jogo-da-velha' }, { type: 'dir', name: 'calculadora-gorjeta' }]); if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp('ok'); } } return json({}); });
H.ctx.aba('mensagens').appendRow(['c0', '2026-10-30 18:26:33', 'thiago', 'faz uma calculadora de gorjeta em 1 arquivo html, modo escuro', '', 'pc']);
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz uma calculadora de gorjeta em html' }] });
ok(/### JÁ EXISTE PARECIDO/.test(sys) && /App publicado: calculadora-gorjeta/.test(sys) && /Pedido antigo/.test(sys) && r.passos.some(p => /parecida\(s\) já feita/.test(p)), 'pedido repetido mostra app e pedido antigo: ' + (sys.match(/### JÁ EXISTE PARECIDO[\s\S]{0,160}/) || [''])[0].replace(/\n/g, ' | '));
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'faz um app de lista de compras em html' }] });
ok(!/### JÁ EXISTE PARECIDO/.test(sys), 'pedido novo não acusa parecido');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'quanto tá o dólar' }] });
ok(!/### JÁ EXISTE PARECIDO/.test(sys), 'pergunta sem código não consulta apps');
