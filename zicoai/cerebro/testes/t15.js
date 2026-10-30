// Meus apps: listar, abrir código no contexto, versões, restaurar
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
const json = o => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(o) });
let sys = ''; const GH = [];
H.setFetch((u, o) => {
  if (/api\.github\.com\/repos\/.*\/contents\/apps$/.test(u)) return json([{ type: 'dir', name: 'lista-de-compras' }, { type: 'dir', name: 'jogo-cobrinha' }, { type: 'file', name: 'x.txt' }]);
  if (/raw\.githubusercontent\.com\/.*\/main\/apps\/jogo-cobrinha\/index\.html/.test(u)) return { getResponseCode: () => 200, getContentText: () => '<!DOCTYPE html><html><head><title>Cobrinha</title></head><body>v2</body></html>' };
  if (/raw\.githubusercontent\.com\/.*\/abc1234abc1234\/apps\/jogo-cobrinha/.test(u)) return { getResponseCode: () => 200, getContentText: () => '<!DOCTYPE html><html><head><title>Cobrinha</title></head><body>v1</body></html>' };
  if (/api\.github\.com\/repos\/.*\/commits\?path=apps\/jogo-cobrinha/.test(u)) return json([{ sha: 'def5678def5678', commit: { author: { date: '2026-10-30T15:00:00Z' }, message: 'Atualiza app jogo-cobrinha (ZicoAI)' } }, { sha: 'abc1234abc1234', commit: { author: { date: '2026-10-29T10:00:00Z' }, message: 'Publica app jogo-cobrinha (ZicoAI)' } }]);
  if (/api\.github\.com\/repos\/.*\/contents\/apps\/jogo-cobrinha\/index\.html/.test(u)) { GH.push(o); return (o.method || 'get') === 'get' ? json({ sha: 'def5678' }) : { getResponseCode: () => 200, getContentText: () => '{}' }; }
  if (typeof o.payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp('ok'); } }
  return json({});
});
let r = H.post({ pin: '1234', acao: 'apps' });
ok(r.ok && r.apps.length === 2 && r.apps[1].url === 'https://thiagogaldinozicao-source.github.io/apps/jogo-cobrinha/', 'lista apps publicados (só pastas): ' + r.apps.map(a => a.slug).join(','));
r = H.post({ pin: '1234', acao: 'appCodigo', slug: 'jogo-cobrinha' });
ok(r.ok && /v2/.test(r.html), 'devolve o código atual do app');
r = H.post({ pin: '1234', acao: 'chat', appSlug: 'jogo-cobrinha', mensagens: [{ role: 'user', content: 'deixa a cobrinha mais rápida' }] });
ok(/### CÓDIGO ATUAL DO APP "jogo-cobrinha"/.test(sys) && /<body>v2<\/body>/.test(sys) && /arquivo COMPLETO/.test(sys) && r.passos.some(p => /Abriu o código do app/.test(p)), 'pedido de mudança leva o código atual no contexto');
r = H.post({ pin: '1234', acao: 'appVersoes', slug: 'jogo-cobrinha' });
ok(r.ok && r.versoes.length === 2 && r.versoes[1].sha.startsWith('abc1234') && /2026-10-29 10:00/.test(r.versoes[1].quando), 'lista versões do app');
H.PROPS.GITHUB_TOKEN = 'ghp';
r = H.post({ pin: '1234', acao: 'appRestaurar', slug: 'jogo-cobrinha', sha: 'abc1234abc1234' });
const put = GH.find(g => g.method === 'put');
ok(r.ok && put && /v1/.test(Buffer.from(JSON.parse(put.payload).content, 'base64').toString()) && JSON.parse(put.payload).sha === 'def5678', 'restaurar republica a versão antiga por cima: ' + r.url);
r = H.post({ pin: '1234', acao: 'appRestaurar', slug: 'jogo-cobrinha', sha: 'zzz' });
ok(!r.ok, 'sha inválido recusado');
ok(/parceira de criação/.test(sys) && /loja é UM dos assuntos/.test(sys), 'identidade: criação primeiro, loja é um assunto');
