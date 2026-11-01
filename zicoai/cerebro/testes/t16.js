// Blindagem do aprender sozinha: só fatos apoiados na fala do Thiago; perfil genérico nunca é sobrescrito
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
H.ctx.aba('mensagens');
H.sheets.mensagens.rows.push(['x1', '2026-10-30 12:00:00', 'thiago', 'PROMESSAS DA LOJA - Garantia TV Box: ___ - Sinal: ___', '', 'iPhone']);
H.sheets.mensagens.rows.push(['x1', '2026-10-30 12:00:05', 'zicoai', 'Garantia TV Box: 3 meses. Sinal: R$ 50 ou 10%. Película de brinde: sim.', 'PC (zicoai)', 'iPhone']);
H.sheets.mensagens.rows.push(['x1', '2026-10-30 12:01:00', 'thiago', 'meu endereco e zeferino paiva 58 e todo parcelamento tem juros', '', 'iPhone']);
H.sheets.mensagens.rows.push(['x1', '2026-10-30 12:01:05', 'zicoai', 'Anotado. Não consigo acessar GitHub nem rodar em segundo plano.', 'PC (zicoai)', 'iPhone']);
let pedido = null;
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (/sistema de memória/.test(b.messages[0].content)) { pedido = b; return resp(JSON.stringify({
  memorias: ['A garantia do TV Box é de 3 meses', 'O sinal para reserva é R$ 50 ou 10%', 'O endereço da loja é Rua Zeferino Paiva, 58', 'A ZicoAI não possui permissão para acessar o GitHub'],
  aprendizados: [{ erro: 'disse sem juros', certo: 'Todo parcelamento tem juros', assunto: 'pagamento' }, { erro: 'disse que trabalha em segundo plano', certo: 'Não inventar processos em segundo plano', assunto: 'sistema' }],
  esquecer: [],
  base: [{ assunto: 'Garantia TV Box', conteudo: 'TV Box tem 3 meses de garantia' }, { assunto: 'Endereço', conteudo: 'Rua Zeferino Paiva, 58, Itaú de Minas' }],
  perfil: [{ topico: 'Outros', informacao: 'O Thiago tem interesse no significado de nomes' }, { topico: 'Outros', informacao: 'Todo parcelamento da loja tem juros' }, { topico: 'Outros', informacao: 'O Thiago mora em Itaú de Minas' }]
})); } return resp('ok'); });
H.sheets.perfil.rows.push(['Outros', 'Plano de saúde: avaliando Unimed']);
const perfilAntes = H.sheets.perfil.rows.map(r => r.join('|'));
H.ctx.aprenderSozinha();
const mem = H.sheets.memoria.rows.map(l => l[1]);
ok(!mem.some(m => /Zeferino Paiva/.test(m)) && H.sheets.base.rows.some(l => /Zeferino Paiva/.test(l[1])), 'v90: endereço dito pelo Thiago vai pra BASE, não pra memória solta');
ok(!mem.some(m => /TV Box é de 3 meses/.test(m)) && !mem.some(m => /sinal para reserva/.test(m)), 'memória inventada pela ZicoAI NÃO entra');
ok(!mem.some(m => /não possui permissão/.test(m)), 'ruído sobre o próprio sistema não entra');
const apr = H.sheets.aprendizados.rows.map(l => l[2]);
ok(apr.some(a => /Todo parcelamento tem juros/.test(a)), 'aprendizado dito pelo Thiago entra');
ok(!apr.some(a => /segundo plano/.test(a)), 'aprendizado sobre o sistema não entra');
ok(!H.sheets.base.rows.some(l => l[0] === 'Garantia TV Box') && H.sheets.base.rows.some(l => l[0] === 'Endereço'), 'base: só o fato apoiado pelo Thiago');
ok(H.sheets.perfil.rows.some(r => /Plano de saúde: avaliando Unimed/.test(r[1])), 'perfil "Outros" original NÃO foi sobrescrito');
ok(!H.sheets.perfil.rows.some(r => /interesse no significado/.test(r[1])), 'perfil: "tem interesse" (uso momentâneo) não entra');
ok(H.sheets.perfil.rows.some(r => /Todo parcelamento da loja tem juros/.test(r[1])) && H.sheets.perfil.rows.filter(r => r[0] === 'Outros').length === 2, 'perfil: fato apoiado entra como linha NOVA em "Outros"');
ok(!H.sheets.perfil.rows.some(r => /mora em Itaú/.test(r[1])), 'v90: "mora em Itaú de Minas" ele não disse: não entra');
ok(/NADA que apareça só em linha ZICOAI/.test(pedido.messages[0].content) && /ZICOAI: Garantia TV Box: 3 meses/.test(pedido.messages[1].content), 'prompt avisa e linhas ZICOAI vão cortadas');
// gravarFato direto (tag BASE dita pelo Thiago) continua substituindo assunto único e específico
H.sheets.base.rows.push(['Garantia seminovo', 'Seminovo tem 6 meses']);
const r = H.ctx.gravarFato('base', 'Garantia seminovo', 'Seminovo tem 1 ano de garantia da loja', 'iPhone');
ok(r === 'base atualizada' && H.sheets.base.rows.filter(l => l[0] === 'Garantia seminovo').length === 1, 'assunto específico único ainda é substituído');
const r2 = H.ctx.gravarFato('perfil', 'Família', 'Filho Italo gosta de dinossauro', 'iPhone');
ok(r2 === 'perfil novo' && H.sheets.perfil.rows.some(x => /dinossauro/.test(x[1])), 'perfil sempre acrescenta, nunca sobrescreve');
// [IGNORAR]: linhas marcadas somem do contexto e são apagadas na arrumação
H.sheets.memoria.rows.push(["'30/10/2026", '[IGNORAR] fato inventado', 'x']);
H.sheets.base.rows.push(['[IGNORAR] Agenda', 'compromisso']);
let sysI = '';
H.setFetch((u, o) => { const b = JSON.parse(o.payload); if (b.messages) sysI = b.messages[0].content; return resp('ok'); });
H.post({ pin: '1234', acao: 'chat', mensagens: [{ role: 'user', content: 'fato inventado agenda compromisso' }] });
ok(!/fato inventado/.test(sysI) && !/\[IGNORAR\]/.test(sysI), 'linhas [IGNORAR] não entram no contexto');
const antesM = H.sheets.memoria.rows.length, antesB = H.sheets.base.rows.length;
const n = H.ctx.arrumarMemoria();
ok(n >= 2 && H.sheets.memoria.rows.length < antesM && H.sheets.base.rows.length === antesB - 1 && !H.sheets.memoria.rows.some(l => /IGNORAR/.test(l[1])) && !H.sheets.base.rows.some(l => /IGNORAR/.test(l[0])) && H.sheets.historico.rows.some(l => l[2] === 'ignorada'), 'arrumação apaga as [IGNORAR] e registra: ' + n);
