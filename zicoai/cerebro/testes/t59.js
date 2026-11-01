// v79: revisora do dia — acha erro nas conversas SEM o Thiago reclamar
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
run('aba("mensagens"); aba("estudo_erros")');
const M = H.sheets.mensagens.rows;
const add = (c, d, q, t) => M.push([c, d, q, t, q === 'zicoai' ? 'Gemini' : '', 'pc']);
// 1) pediu pra melhorar ELA e veio app genérico (caso real de 31/10)
add('c1', '2026-10-31 20:40:00', 'thiago', 'vc ja e minha ia entendeu e preciso melhorar vc e nao fazer isso que vc fez ai em cima kkk me ajuda');
add('c1', '2026-10-31 20:40:30', 'zicoai', '```html\n<!DOCTYPE html>\n<html><body>novo app</body></html>\n```\n\n✅ Testei no navegador: sem erro.');
add('c1', '2026-10-31 20:41:00', 'thiago', 'ok');
// 2) agente terminou perguntando
add('c2', '2026-10-31 20:50:00', 'thiago', 'melhora o visual das bolhas');
add('c2', '2026-10-31 20:52:00', 'zicoai', '🧠 **Resultado da tarefa** (MELHORAR MEU CÓDIGO: bolhas):\n\nVi a estrutura atual. O que vc prefere ajustar primeiro?');
// 3) pergunta normal, resposta ok (não é suspeito)
add('c3', '2026-10-31 21:00:00', 'thiago', 'que dia é hoje');
add('c3', '2026-10-31 21:00:05', 'zicoai', 'Sábado, 31 de outubro de 2026.');
// 4) tem reclamação logo depois: fica pro aprenderComErros
add('c4', '2026-10-31 21:10:00', 'thiago', 'melhora vc');
add('c4', '2026-10-31 21:10:30', 'zicoai', '```html\n<!DOCTYPE html><html></html>\n```');
add('c4', '2026-10-31 21:11:00', 'thiago', 'ta errado isso');
let prof = [];
run('chamarCompat = function(c, msgs){ var u = msgs[1].content; globalThis._prof = (globalThis._prof||[]).concat([u]); if (/que dia/.test(u)) return \'{"erro":false}\'; return JSON.stringify({ causa: "fez app novo em vez de ler o próprio código", regra: "Pedido pra melhorar ela = ler_meu_codigo e mudar o app dela, nunca app novo", porque: "x", situacoes: ["melhora vc"], resposta_certa: "Vou ler meu código e te mostrar o que mudar.", tipo: "código" }); }; temCerebro = function(n){ return n === "gemini"; }; motivoNaoCabe = function(){ return ""; }; aulaSozinha = function(){ return null; }; resultadosBusca = function(){ throw new Error("não devia pesquisar"); };');
let r = run('revisoraRodada()');
ok(r.revisou && r.sinal === 'app_generico_pra_ela' && r.aprendeu, 'achou sozinha: pedido pra melhorar ELA virou app genérico');
const linha = H.sheets.estudo_erros.rows[H.sheets.estudo_erros.rows.length - 1];
ok(/REVISORA achou/.test(linha[4]) && /ler_meu_codigo/.test(linha[6]) && linha[10] === 'revisar' && /^revisora/.test(linha[9]), 'gravou na estudo_erros: causa, regra, "revisar", marcada como da revisora');
ok(/SINAL DA REVISORA/.test(run('globalThis._prof[0]')), 'professor recebeu o sinal (não uma reclamação inventada)');
r = run('revisoraRodada()');
ok(r.revisou && r.sinal === 'agente_perguntou_no_fim', 'achou: agente terminou perguntando em vez de fazer');
r = run('revisoraRodada()');
ok(!r.revisou && /nenhum erro novo/.test(r.motivo), 'resposta certa e caso com reclamação ficam de fora (o 4º é do aprenderComErros)');
r = run('revisoraRodada()');
ok(!r.revisou, 'não revisa a mesma conversa duas vezes');
// professor pode dizer que tava certo
add('c5', '2026-11-01 07:00:00', 'thiago', 'que dia é hoje e me passa o link');
add('c5', '2026-11-01 07:00:05', 'zicoai', 'Não encontrei o arquivo, me passa o link');
run('globalThis._prof = []; chamarCompat = function(){ return \'{"erro":false}\'; }');
r = run('revisoraRodada()');
ok(r.revisou && !r.aprendeu && /agiu certo/.test(r.motivo), 'professor achou que ela agiu certo: não grava nada');
// limite por dia
run('PropertiesService.getScriptProperties().setProperty("REVISORA_" + Utilities.formatDate(new Date(), FUSO, "yyyyMMdd"), "6")');
ok(/já revisou 6/.test(run('revisoraRodada()').motivo), 'no máximo 6 lições por dia');
// aprenderComErros continua igual (pega a reclamação do caso 4)
run('chamarCompat = function(){ return JSON.stringify({ causa: "c", regra: "regra da reclamação com mais de quinze letras", porque: "p", resposta_certa: "r", tipo: "geral" }); }; resultadosBusca = function(){ return null; };');
r = run('aprenderComErros()');
ok(r.aprendeu && r.conversa === 'c4', 'aprender com reclamação continua funcionando');
ok(/versão (79|[89]\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 79 ou mais nova');
