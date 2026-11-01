// v98: busca de aula/base/exemplo sem ruído (medido com 160 perguntas reais e as 296 aulas: "bom dia chefe" puxava aula de agentes,
// "que dia é hoje" puxava orçamento do dia, "era pra arrumar a calculadora, amigo" puxava "mandar app pro amigo").
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
delete H.PROPS.GEMINI_KEY;
run("aba('aulas')");
H.sheets.aulas.rows.push(['D09', 'D', 'agentes que trabalham sozinhos em segundo plano', 'agente, segundo plano, chefe, tarefa, fila', 'Tarefa longa vai pro agente em segundo plano.', 'O agente trabalha sozinho; o chefe acompanha a fila.', 'GitHub']);
H.sheets.aulas.rows.push(['C107', 'C', 'Orçamento do dia no WhatsApp', 'orçamento, dia, hoje, whatsapp, cliente', 'Orçamento do dia em bloco de código.', 'Todo dia o Thiago manda o orçamento de hoje.', 'planilha (privado)']);
H.sheets.aulas.rows.push(['E301', 'E', 'Mandar o app para um amigo (Calculadora do Zicão)', 'amigo, mandar, calculadora, link', 'Manda o link do app pro amigo.', 'Amigo instala pela tela inicial.', 'planilha (privado)']);
H.sheets.aulas.rows.push(['A301', 'A', 'Regras fixas do projeto (Calculadora do Zicão)', 'calculadora, arrumar, corrigir, bug, deslizar, velocidade', 'Na calculadora não mexe no deslizar nem na velocidade.', 'Arrumar bug da calculadora: só o trecho.', 'planilha (privado)']);
const ids = q => run(`aulasPara(${JSON.stringify(q)}, 3, null)`).map(x => x[0]);
ok(ids('E aí bom dia chefe').length === 0, '"bom dia chefe" não puxa aula');
ok(ids('Que dia é hoje').length === 0, '"que dia é hoje" não puxa aula');
ok(ids('Era pra vc arrumar essa calculadora tô na peleja meu amigo bora')[0] === 'A301', '"arrumar a calculadora, amigo" puxa a regra da calculadora, não "mandar pro amigo"');
ok(ids('manda o agente fazer essa tarefa em segundo plano').indexOf('D09') >= 0, 'pergunta de verdade continua achando a aula');
// base: 1 palavra só não puxa trecho
run("aba('base')");
H.sheets.base.rows.push(['Horário', 'A loja abre 10h e fecha 20h']);
H.sheets.base.rows.push(['Garantia seminovo', 'Seminovo tem garantia da loja, resolvida em Itaú']);
const b = run(`relevantes(linhas('base'), 'qual o horário da loja?', 8, function(l){ return l[0] + ' ' + l[1]; }, function(l){ return l[0]; }, 4)`).map(l => l[0]);
ok(b.indexOf('Horário') >= 0 && b.indexOf('Garantia seminovo') < 0, 'base: só o trecho que tem a ver (' + b.join(', ') + ')');
ok(/x\.p >= 0\.72/.test(run('semelhantes.toString()')), 'busca por significado com corte 0,72 (era 0,62)');
