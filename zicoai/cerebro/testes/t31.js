// Oficina 24h (Mac): ponte do Mac com segredo e fila próprios, sem pegar pedido do PC
const H = require('./harness');
const vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => '{}' }));
H.PROPS.PONTE_SEGREDO = 'seg-pc';
const run = n => vm.runInContext('FERRAMENTAS', H.ctx)[n].run;
const erroDe = f => { try { f(); return ''; } catch (e) { return e.message; } };

// sem PONTE_SEGREDO_MAC: o Mac é recusado e as ferramentas dizem que não está instalada
ok(!H.post({ acao: 'ponteBuscar', segredo: 'seg-mac', dispositivo: 'mac' }).ok, 'sem a propriedade, o Mac é recusado');
ok(/ponte do Mac não está instalada/.test(erroDe(() => run('mac_status')({}))), 'mac_status explica que não está instalada');

H.PROPS.PONTE_SEGREDO_MAC = 'seg-mac';
ok(/Mac desligado ou ponte fechada/.test(erroDe(() => run('mac_status')({}))), 'Mac que nunca apareceu: erro na hora');

// Mac e PC buscam: cada um só vê a própria fila
const b = H.post({ acao: 'ponteBuscar', segredo: 'seg-mac', nome: 'mac', versao: 'mac-1.0' });
ok(b.ok && b.pedidos.length === 0, 'Mac busca com o segredo dele');
const c = H.ctx.CacheService.getScriptCache();
ok(c.get('ponte_visto_mac') && !c.get('ponte_visto') && c.get('ponte_versao_mac') === 'mac-1.0', 'Mac marca "visto" só pra ele (o PC continua desligado)');
ok(/PC desligado/.test(erroDe(() => vm.runInContext('ponte("status")', H.ctx))), 'Mac ligado não faz o PC parecer ligado');

vm.runInContext('ponteFila(f => f.push({ id: "ppc1", acao: "status", dados: {}, ate: Date.now() + 60000 }))', H.ctx);
vm.runInContext('ponteFila(f => f.push({ id: "pmac1", acao: "status", dados: {}, ate: Date.now() + 60000 }), "mac")', H.ctx);
const doMac = H.post({ acao: 'ponteBuscar', segredo: 'seg-mac' }).pedidos.map(p => p.id);
const doPC = H.post({ acao: 'ponteBuscar', segredo: 'seg-pc' }).pedidos.map(p => p.id);
ok(doMac.join() === 'pmac1' && doPC.join() === 'ppc1', 'cada ponte pega só o pedido dela');

// Mac de mentira responde: mac_status, mac_testar, mac_abrir, mac_comando
const respMac = p => {
  if (p.acao === 'status') return { ok: true, nome: 'mac', hora: '31/10/2026 12:00', disco: 'Disco: 127.0 GB livres de 228 GB', pastas: [{ caminho: '/Users/thiagogaldino/ZicoAI', escrever: true }] };
  if (p.acao === 'abrir') return { ok: true, aberto: p.dados.alvo };
  if (p.acao === 'comando' && p.dados.nome === 'testes_zicoai') return { ok: true, saida: 'TOTAL: 430 testes ok, 0 arquivo(s) com falha' };
  if (p.acao === 'comando') return { ok: false, erro: 'Comando fora da lista segura: espaco_disco, processos, gpu, ip, sistema, ollama_modelos, testes_zicoai' };
  return { ok: false, erro: 'x' };
};
const pedidosVistos = [];
const macVisto = () => vm.runInContext('CacheService.getScriptCache().put("ponte_visto_mac", String(Date.now()), 600)', H.ctx);
const run0 = run; const runMac = n => a => { macVisto(); return run0(n)(a); };
const sleepOrig = H.ctx.Utilities.sleep;
H.ctx.Utilities.sleep = ms => {
  sleepOrig(ms);
  vm.runInContext('CacheService.getScriptCache().put("ponte_visto_mac", String(Date.now()), 600)', H.ctx); // relógio de mentira do harness
  const peds = vm.runInContext('ponteFila(f => f.splice(0, f.length), "mac")', H.ctx);
  peds.forEach(p => { pedidosVistos.push(p); H.post({ acao: 'ponteResposta', segredo: 'seg-mac', id: p.id, resultado: JSON.stringify(respMac(p)) }); });
};
ok(/Mac mac .*ZicoAI \(lê e escreve\).*127\.0 GB livres/s.test(runMac('mac_status')({})), 'mac_status mostra pastas e disco');
ok(/430 testes ok/.test(runMac('mac_testar')({})) && pedidosVistos.some(p => p.dados.nome === 'testes_zicoai'), 'mac_testar roda os testes na oficina');
ok(/aberto no Mac: https:\/\/thiagogaldinozicao/.test(runMac('mac_abrir')({ alvo: 'https://thiagogaldinozicao-source.github.io/zicoai/' })), 'mac_abrir abre o site no navegador do Mac');
ok(/fora da lista segura/.test(erroDe(() => runMac('mac_comando')({ nome: 'rm -rf' }))), 'comando fora da lista é recusado pelo Mac');
ok(vm.runInContext('JSON.parse(CacheService.getScriptCache().get("ponte_fila") || "[]").length', H.ctx) === 0, 'nada do Mac caiu na fila do PC');
macVisto();
const d = H.post({ pin: '1234', acao: 'dispositivos' });
ok(d.ok && (d.dispositivos || []).some(x => x.nome === 'Oficina (Mac)' && x.ok), 'painel de dispositivos mostra a Oficina (Mac)');
ok(/versão 46/.test(vm.runInContext('VERSAO_CEREBRO', H.ctx)), 'cérebro na versão 46');
