// v71: o Thiago usa o navegador dela pelo app (painel Navegador) + chip de aparelhos no topo
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
H.PROPS.PIN = '1234'; H.PROPS.PONTE_SEGREDO_MAC = 'smac'; H.PROPS.PONTE_SEGREDO = 'spc'; H.PROPS.PONTE_SEGREDO_NAV = 'snav';
run(`ponteSemDetalhe = function(acao, d, espera, disp){ globalThis.__p = { acao: acao, d: d, disp: disp };
  if (acao !== 'navegador' || disp !== 'mac') throw new Error('ponte errada');
  if (d.op === 'abrir' && /banco/.test(d.url)) return { ok: false, erro: 'site de banco: não abro' };
  return { ok: true, titulo: 'Loja', url: 'https://loja.exemplo/', tela: 'SU1H' }; };`);
let r = H.post({ pin: '1234', acao: 'navegar', op: 'tocar', x: 200, y: 300 });
ok(r.ok && r.tela && r.tela.img === 'SU1H' && run('__p.d.x') === 200 && run('__p.d.y') === 300, 'toque na tela vai pro Chrome dela no Mac com x/y e volta o print');
r = H.post({ pin: '1234', acao: 'navegar', op: 'tamanho', w: 430, h: 860 });
ok(r.ok && run('__p.d.w') === 430 && run('__p.d.h') === 860, 'celular pede tela de celular');
r = H.post({ pin: '1234', acao: 'navegar', op: 'escrever', texto: 'iphone 17' });
ok(r.ok && run('__p.d.texto') === 'iphone 17', 'digitar');
r = H.post({ pin: '1234', acao: 'navegar', op: 'abrir', url: 'meubanco.com' });
ok(!r.ok && /banco/.test(r.erro), 'banco continua recusado mesmo pelo Thiago');
ok(H.post({ pin: '1234', acao: 'navegar', op: 'apagarTudo' }).ok === false, 'ação fora da lista é recusada');
ok(H.post({ acao: 'navegar', op: 'tela' }).ok === false, 'sem PIN não usa o navegador');
const t = JSON.parse(run('CacheService.getScriptCache().get("tela_vivo_geral")'));
ok(t && t.acao === 'Thiago: abrir' || t.acao === 'Thiago: escrever', 'o que o Thiago faz também vira print ao vivo');
ok(!Object.keys(run('FERRAMENTAS')).some(k => /^(web|nav)_(tocar|escrever|roda|tamanho)$/.test(k)) && !/OPS_MANUAIS/.test(run('webNav.toString()')), 'agente NÃO ganhou tocar/escrever/rolar sem trava (continua só com web_*)');
// chip
run('CacheService.getScriptCache().put("ponte_visto_mac", String(Date.now()))');
r = H.post({ pin: '1234', acao: 'aparelhosRapido' });
ok(r.ok && r.aparelhos.length === 3 && r.aparelhos[0].ok === true && r.aparelhos[1].ok === false, 'chip do topo: Mac ligado, PC e Chrome desligados (sem chamar ninguém)');
ok(H.post({ acao: 'aparelhosRapido' }).ok === false, 'chip exige PIN');
ok((+run('VERSAO_CEREBRO').match(/versão (1\d\d|\d+)/)[1]) >= 71, 'cérebro na versão 71 ou mais nova');
// v72: abas, foco no campo e digitar com Enter
run(`ponteSemDetalhe = function(acao, d, espera, disp){ globalThis.__p = { acao: acao, d: d, disp: disp };
  return { ok: true, titulo: 'Google', url: 'https://google.com/', tela: 'SU1H', foco: d.op === 'tocar', abas: [{ titulo: 'Google', url: 'https://google.com/', ativa: true }, { titulo: 'Loja', url: 'https://loja/', ativa: false }] }; };`);
r = H.post({ pin: '1234', acao: 'navegar', op: 'trocarAba', i: 1 });
ok(r.ok && run('__p.d.op') === 'trocarAba' && run('__p.d.i') === 1 && r.abas.length === 2 && r.abas[0].ativa, 'trocar de aba e voltar a lista de abas');
ok(H.post({ pin: '1234', acao: 'navegar', op: 'novaAba' }).ok && H.post({ pin: '1234', acao: 'navegar', op: 'fecharAba', i: 0 }).ok, 'aba nova e fechar aba');
r = H.post({ pin: '1234', acao: 'navegar', op: 'tocar', x: 10, y: 20 });
ok(r.foco === true, 'tocou num campo: o app fica sabendo (abre o teclado)');
r = H.post({ pin: '1234', acao: 'navegar', op: 'escrever', texto: 'iphone', enter: true });
ok(run('__p.d.enter') === true && run('__p.d.texto') === 'iphone', '"Ir" do teclado: digita e aperta Enter');
