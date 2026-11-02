// v90: MEMÓRIA LIMPA — com as 22 linhas REAIS da planilha (01/11): o que é lixo vira 'revisar' (sem apagar) e sai das respostas;
// só entra sempre o que o Thiago mandou guardar; ela não guarda sozinha o que ela mesma escreveu; texto colado não é "o Thiago disse".
const H = require('./harness'), vm = require('vm');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
const REAIS = [
  ['O endereço da Zicão Store é Rua Zeferino Paiva, 58, Itaú de Minas/MG.', 'auto', 1],
  ['Todos os parcelamentos na Zicão Store possuem juros (tabela Price).', 'auto', 1],
  ['A garantia para iPhone novo é de 1 ano.', 'auto', 1],
  ["O nome Átila tem origem gótica e significa 'paizinho' ou 'pequeno pai'.", 'auto', 1],
  ['A cotação do dólar é uma referência externa que deve ser consultada em tempo real quando solicitada pelo Thiago.', 'auto', 1],
  ['O preço do iPhone 15 128GB na Zicão Store é R$ 3.999,00.', 'auto', 1],
  ['App "jogo-da-velha" publicado em https://thiagogaldinozicao-source.github.io/apps/jogo-da-velha/', 'app', 0],
  ['Calculadora de gorjeta em HTML único, modo escuro, com botões de porcentagem e resultado visível', 'pc', 0],
  ['O PC do Thiago é um Windows com processador i9, 32 GB de RAM e placa de vídeo RTX 3080 de 10 GB.', 'auto', 0],
  ['O Thiago não apaga nenhum arquivo do PC por conta própria devido ao espaço em disco limitado.', 'auto', 1],
  ["A ponte do PC v2 utiliza o script 'ponte.ps1' e um arquivo 'config.json' com segredo, localizados em %USERPROFILE%\\ZicoAI-Ponte.", 'auto', 1],
  ['O Windows Defender deve ter exclusões configuradas para as pastas ZicoAI-Ponte e ZicoAI para evitar bloqueios de execução.', 'auto', 1],
  ['O guia técnico completo da ZicoAI está no arquivo zicoai/LEIAME.md no repositório thiagogaldinozicao-source.github.io.', 'auto', 1],
  ['O cérebro da ZicoAI é um projeto Apps Script com ID 11bPMMn25rnuGiQiAaK5qqCoxc89tmOxqPlx2TsUp_emb8Puxq5B6AWuw.', 'auto', 1],
  ["A memória da ZicoAI é centralizada na planilha 'ZicoAI Memória' (ID 1UOQHUjGdscAi6lfKZZbH4ipaa9lDaXrPeoHjNRxix0U).", 'auto', 1],
  ['O instalador da Ponte do PC v2 é acessado via comando PowerShell: irm "https://raw.githubusercontent.com/x/instalar.ps1?v=2" | iex.', 'auto', 1],
  ['A ZicoAI possui ferramentas de PC integradas: pc_status, pc_listar, pc_ler, pc_escrever, pc_print, pc_abrir e pc_comando.', 'auto', 1],
  ['O agente da ZicoAI deve processar pedidos relacionados ao Mac (oficina 24h, Mac Mini) utilizando as ferramentas mac_status, mac_testar, mac_abrir e mac_comando.', 'auto', 1],
  ['Ao receber uma tarefa para o Mac, responda em uma linha e utilize o formato [[TAREFA: o que fazer no Mac]].', 'auto', 1],
  ['Ficha técnica iPhone Duo: Modelo: iPhone Duo; Ano: 2026; Tela: 7,8" Super Retina XDR (OLED) dobrável; Chip: A20; Câmeras traseiras: Dupla: 48 MP (Principal) + 48 MP (Ultra-angular); Câmera frontal: 18 MP (Center Stage); Bateria (mAh): 4.500*; Carregamento: 45W; Resistência: IP68; Armazenamentos: 512 GB / 1 TB; 5G: Sim; Conector: USB-C (USB 3); eSIM: Sim (exclusivo).', 'IPHONE', 1],
  ['Calculadora com sistema de swipe para apagar (iOS style) criada com sucesso.', 'IPHONE', 1],
  ['Thiago prefere resposta curta', 'IPHONE', 0]
];
run("aba('memoria')"); run("aba('historico')");
REAIS.forEach(l => H.sheets.memoria.rows.push(['30/10/2026', l[0], l[1]]));
const total = H.sheets.memoria.rows.length;

// 1) revisão: marca 'revisar' sem apagar nada
const rv = H.post({ pin: '1234', acao: 'revisarMemoria' });
ok(rv.ok && H.sheets.memoria.rows.length === total, 'revisar NÃO apaga nenhuma linha (' + total + ')');
REAIS.forEach(l => {
  const linha = H.sheets.memoria.rows.find(x => x[1] === l[0]);
  const marcada = linha[2] === 'revisar';
  ok(marcada === !!l[2], (l[2] ? 'marcou ' : 'manteve ') + l[0].slice(0, 55) + (linha[2] !== 'revisar' ? '' : ''));
});
ok(rv.marcadas.length === REAIS.filter(l => l[2]).length && rv.marcadas.every(m => m.motivo), 'devolve a lista com o motivo de cada uma (' + rv.marcadas.length + ')');
ok(H.sheets.historico.rows.filter(l => l[5] === 'v90').length === rv.marcadas.length && H.sheets.historico.rows.some(l => /origem era "auto"; pra voltar/i.test(l[4])), 'histórico guarda o motivo e como voltar');

// 2) resposta comum: nada de 'revisar'; lixo velho não entra; o pedido explícito entra
let sis = '';
H.setFetch((u, o) => { try { const b = JSON.parse(o.payload); if (b.messages) sis = b.messages[0].content; } catch (e) {} return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), getHeaders: () => ({}) }; });
let r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'me ajuda a montar um texto de bom dia pros clientes' }] });
const mem = (sis.match(/### MEMÓRIA[\s\S]*?(\n### |$)/) || [''])[0];
ok(r.ok && !/Átila|dólar|3\.999|Apps Script|ponte\.ps1|Ficha técnica iPhone Duo|criada com sucesso/.test(mem), 'pergunta comum: nada de Átila, dólar, preço do iPhone 15, ID, ficha');
ok(/Thiago prefere resposta curta/.test(mem), 'o que ele mandou guardar (curto) entra sempre');
ok(!/i9, 32 GB/.test(mem), 'o que ela tirou sozinha só entra se tiver a ver (PC não tem nada com bom dia)');
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'qual a placa de video do meu pc?' }] });
ok(/RTX 3080/.test((sis.match(/### MEMÓRIA[\s\S]*?(\n### |$)/) || [''])[0]), 'pergunta sobre o PC: a lembrança do PC entra');

// 3) [[MEMORIA:]] que ELA escreveu sem o Thiago pedir: não grava
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Pronto! [[MEMORIA: Calculadora com tabela corrigida criada com sucesso]] [[MEMORIA: O Thiago trabalha com vendas de iPhone desde 2015]]' } }] }), getHeaders: () => ({}) }));
const antes = H.sheets.memoria.rows.length;
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'me fala uma ideia de post pro instagram' }] });
ok(H.sheets.memoria.rows.length === antes && r.passos.filter(p => /Não guardou na memória/.test(p)).length === 2, 'ela não guarda sozinha o que ELA inventou');
// texto colado (código/lista) não vale como "o Thiago disse"
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'ok [[MEMORIA: A calculadora usa a função calcParc pra tabela]]' } }] }), getHeaders: () => ({}) }));
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'olha isso ```js\nfunction calcParc(){ /* a calculadora usa a função calcParc pra tabela */ }\n```' }] });
ok(H.sheets.memoria.rows.length === antes, 'código colado não vira memória');
// ele pediu: grava
H.setFetch(() => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'Anotado! [[MEMORIA: O fornecedor de capinhas é o Marcos]]' } }] }), getHeaders: () => ({}) }));
r = H.post({ pin: '1234', acao: 'chat', aparelho: 'PC', mensagens: [{ role: 'user', content: 'anota: o fornecedor de capinhas é o Marcos' }] });
ok(H.sheets.memoria.rows.some(l => /fornecedor de capinhas é o Marcos/.test(l[1])), 'quando ele pede pra anotar, grava');

// 4) aprender sozinha: preço/dedução/sistema não viram memória; colado não conta
run("aba('mensagens')");
H.sheets.mensagens.rows.push(['m1', '2026-11-01 10:00:00', 'thiago', '{"memoria":"O preço do iPhone 15 é R$ 3.999 e o nome Átila significa paizinho"}', '', 'PC']);
H.sheets.mensagens.rows.push(['m1', '2026-11-01 10:00:05', 'zicoai', 'ok', 'Gemini', 'PC']);
H.sheets.mensagens.rows.push(['m1', '2026-11-01 10:01:00', 'thiago', 'minha esposa se chama Karina e o nosso cachorro se chama Thor', '', 'PC']);
H.PROPS.APRENDIDO_ATE = '2026-11-01 09:00:00';
H.setFetch((u, o) => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ memorias: ['O preço do iPhone 15 é R$ 3.999', 'O nome Átila significa paizinho', 'A esposa do Thiago se chama Karina e o cachorro se chama Thor'], aprendizados: [], esquecer: [], base: [], perfil: [] }) } }] }), getHeaders: () => ({}) }));
run('aprenderSozinha()');
const m2 = H.sheets.memoria.rows.map(l => l[1]);
ok(m2.some(t => /esposa do Thiago se chama Karina/.test(t)), 'fato que ele disse com as palavras dele: entra');
ok(!m2.some(t => /^O preço do iPhone 15 é R\$ 3\.999$/.test(t)) && !m2.some(t => /^O nome Átila significa paizinho$/.test(t)), 'preço e "significa" (mesmo colado por ele) não viram memória');
ok(H.PROPS.MEM_REVISADA_V90, 'revisão da memória velha roda sozinha uma vez');

ok(/versão (1\d\d|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 90 ou mais nova');
