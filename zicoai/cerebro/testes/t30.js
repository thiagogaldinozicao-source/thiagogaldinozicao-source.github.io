// Corrigir / reescrever com um clique (acao 'texto')
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
let ultimo = null, devolve = '';
H.setFetch((u, o) => { if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { ultimo = b; return resp(devolve); } } return resp('ok'); });
const tx = r => H.post(Object.assign({ pin: '1234', acao: 'texto' }, r));

devolve = 'oi, vc ainda quer o iPhone 13? kkk';
let r = tx({ modo: 'corrigir', texto: 'oi vc ainda qr o iphone 13? kkk' });
ok(r.ok && r.texto === 'oi, vc ainda quer o iPhone 13? kkk' && r.modo === 'corrigir', 'corrige e devolve só o texto');
ok(/Corrija só ortografia/.test(ultimo.messages[0].content) && /"vc", "kkk"/.test(ultimo.messages[0].content) && ultimo.temperature === 0, 'corrigir mantém gírias e usa temperatura 0');

devolve = 'Um texto completamente diferente e bem maior que o original, que virou outra coisa inteira de propósito pra testar';
r = tx({ modo: 'corrigir', texto: 'oi tudo bem' });
ok(!r.ok, 'se o "corrigir" virou outro texto, não aceita');

devolve = '"Opa! O iPhone 13 ainda tá disponível, vc quer?"';
r = tx({ modo: 'reescrever', estilo: 'cliente', texto: 'iphone 13 ainda tem quer?' });
ok(r.ok && r.texto === 'Opa! O iPhone 13 ainda tá disponível, vc quer?' && r.estilo === 'cliente', 'reescreve no estilo cliente e tira as aspas');
ok(/Não invente preço, prazo, garantia/.test(ultimo.messages[0].content), 'estilo cliente proíbe inventar preço e garantia');

r = tx({ modo: 'reescrever', estilo: 'qualquer', texto: 'texto' });
ok(r.ok && r.estilo === 'claro', 'estilo desconhecido vira "claro"');
ok(!tx({ modo: 'corrigir', texto: '   ' }).ok, 'texto vazio dá erro');
ok(!tx({ modo: 'corrigir', texto: 'a'.repeat(6001) }).ok, 'texto gigante dá erro');
ok(!H.post({ pin: 'errado', acao: 'texto', texto: 'oi' }).ok, 'sem PIN não usa');
