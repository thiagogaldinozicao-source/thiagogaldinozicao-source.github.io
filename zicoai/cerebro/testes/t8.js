// Rotinas: bom dia, backup, aviso de cota
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
let pedido = null;
H.setFetch((u, o) => { pedido = JSON.parse(o.payload); return resp('☀️ Bom dia! Hoje 14:00 entregar iPhone do João. Ontem R$ 0.'); });
H.ctx.aba('vendas').appendRow(["'2026-10-29 15:00:00", 2500, 'iPhone 13', 'iPhone']);
const txt = H.ctx.bomDia();
ok(/Bom dia/.test(txt), 'bom dia gerado');
ok(/AGENDA DE HOJE/.test(pedido.messages[1].content) && /Entregar iPhone do João/.test(pedido.messages[1].content), 'resumo traz agenda');
ok(/VENDAS DE ONTEM: 1 venda\(s\), R\$ 2\.500,00/.test(pedido.messages[1].content), 'resumo traz vendas de ontem');
ok(/E-MAILS NOVOS/.test(pedido.messages[1].content) && /Lista de preços/.test(pedido.messages[1].content), 'resumo traz e-mails');
const chat = H.sheets.chats.rows.find(l => /^bomdia/.test(l[0]));
ok(chat && /Bom dia/.test(chat[1]) && H.sheets.mensagens.rows.some(l => l[0] === chat[0] && l[2] === 'zicoai'), 'virou conversa nova no app');
H.ctx.bomDia();
ok(H.sheets.chats.rows.filter(l => /^bomdia/.test(l[0])).length === 1, 'rodar de novo no mesmo dia não duplica a conversa');
// backup
const id = H.ctx.backupPlanilha();
ok(/^COPIA_ZicoAI Memória - backup 2026-10-30/.test(id), 'backup copia a planilha: ' + id);
H.ctx.ligarRotinas();
// aviso de cota a 80%
H.PROPS['rpd_gemini_20261030'] = '400';
H.setFetch(() => resp('ok'));
let r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(/Cota grátis quase no fim hoje: Gemini 40[01]\/480/.test(r.aviso || ''), 'aviso de cota na resposta: ' + r.aviso);
H.PROPS['rpd_gemini_20261030'] = '10';
r = H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'oi' }] });
ok(!r.aviso, 'sem aviso quando a cota tá folgada');
