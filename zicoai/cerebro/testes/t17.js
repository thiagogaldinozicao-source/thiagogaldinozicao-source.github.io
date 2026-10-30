// Erros de digitação do Thiago: busca tolerante e regra no prompt
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
let sys = '';
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (b.messages) sys = b.messages[0].content; return resp('ok'); });
H.sheets.base.rows.push(['Garantia seminovo', 'Seminovo tem garantia da loja']);
H.sheets.base.rows.push(['Película', 'Película 3D cobre a borda inteira']);
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'qual a garnatia do seminvo?' }] });
ok(/Garantia seminovo/.test(sys), 'acha "garantia seminovo" mesmo com "garnatia" e "seminvo"');
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oq vc sabe da peliucla?' }] });
ok(/Película 3D/.test(sys), 'acha "película" com "peliucla"');
ok(/digita rápido, com erro de digitação/.test(sys) && /Nunca corrija a escrita dele/.test(sys), 'regra de digitação no prompt');
ok(H.ctx.parecida('celular', 'o celuakr novo') && H.ctx.parecida('garantia', 'qual a garnatia') && !H.ctx.parecida('garantia', 'qual a gaveta'), 'parecida() acerta e não confunde');
ok(H.ctx.expandir('oq vc acha do cel hj? tbm quero') === 'o que voce acha do celular hoje? tambem quero', 'abreviações expandidas pra busca: ' + H.ctx.expandir('oq vc acha do cel hj? tbm quero'));
