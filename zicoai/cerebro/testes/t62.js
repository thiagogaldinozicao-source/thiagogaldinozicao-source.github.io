// v82: preço do dia dos lacrados → catálogo (por encomenda). Conta no código, antes → depois, grava só com "ok".
const H = require('./harness'), vm = require('vm'), fs = require('fs'), path = require('path');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const run = c => vm.runInContext(c, H.ctx);
run('Utilities.getUuid = function(){ return "u" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2); }');
const FIX = path.join(__dirname, 'catalogo_exemplo');
const ESTOQUE0 = fs.readFileSync(path.join(FIX, 'estoque.json'), 'utf8'), ENC0 = fs.readFileSync(path.join(FIX, 'encomenda.json'), 'utf8');
let repo, site, puts;
const reset = () => { repo = { 'estoque.json': ESTOQUE0, 'sync/encomenda.json': ENC0 }; site = ESTOQUE0; puts = []; };
reset();
const resp = (c, t) => ({ getResponseCode: () => c, getContentText: () => t, getHeaders: () => ({}) });
let semPermissao = false;
H.setFetch((u, o) => {
  o = o || {};
  let m = u.match(/api\.github\.com\/repos\/thiagogaldinozicao-source\/catalogo\/contents\/([^?]+)/);
  if (m) {
    const f = m[1];
    if ((o.method || 'get') === 'put') {
      if (semPermissao) return resp(403, '{"message":"Resource not accessible"}');
      const b = JSON.parse(o.payload);
      const shaAtual = require('crypto').createHash('sha1').update(repo[f]).digest('hex');
      if (b.sha !== shaAtual) return resp(409, '{"message":"sha"}');
      repo[f] = Buffer.from(b.content, 'base64').toString('utf8'); puts.push({ f, msg: b.message, auth: o.headers.Authorization });
      return resp(200, JSON.stringify({ content: { sha: 'x' } }));
    }
    if (repo[f] == null) return resp(404, '{}');
    return resp(200, JSON.stringify({ sha: require('crypto').createHash('sha1').update(repo[f]).digest('hex'), content: Buffer.from(repo[f]).toString('base64').replace(/(.{60})/g, '$1\n') }));
  }
  if (/thiagogaldinozicao-source\.github\.io\/catalogo\/estoque\.json/.test(u)) return resp(200, site);
  if (/api\.github\.com/.test(u)) return resp(500, 'não esperado ' + u);
  return resp(200, JSON.stringify({ choices: [{ message: { content: 'resposta normal' } }] }));
});
H.PROPS.GITHUB_TOKEN = 'ghp_teste';
const est0 = JSON.parse(ESTOQUE0), enc0 = JSON.parse(ENC0);
const preco = (txt, mod, cor, soEnc) => { const i = JSON.parse(txt).itens.find(x => x.modelo === mod && x.cor === cor && x.cond === 'novo' && (!soEnc || x.enc)); return i && i.preco; };

// 1) refazer os "por encomenda" do estoque.json dá exatamente o que a sincronização da noite gerou
const refeito = JSON.parse(run('JSON.stringify(estoqueComEncomenda_(' + ESTOQUE0.trim() + ', ' + JSON.stringify(ENC0) + '))'));
ok(JSON.stringify(refeito.itens) === JSON.stringify(est0.itens), 'mesma lista e mesma ordem da sincronização (sync/estoque_para_catalogo.py)');

// 2) leitura da lista do fornecedor
const conh = run('JSON.stringify(estadoCatalogo_().conhecidas)');
const ler = t => JSON.parse(run('JSON.stringify(lerListaPrecos_(' + JSON.stringify(t) + ', ' + conh + '))'));
const LISTA = 'Lista do fornecedor hoje\nIPHONE 17 PRO MAX 256GB\n🟠 Laranja 7.250\n🔵 Azul 7.150\n⚪ Prata 7.400\n\niPhone 18 Pro 256 Preto R$ 8.500\n18 pro 256gb bordô/azul 8.000\n18 Pro Max 512GB preto 11.000\n17 pro max 256 roxo 7.000\nlucro 300';
let l = ler(LISTA);
const acha = (m, c) => l.itens.find(i => i.modelo === m && i.cor === c);
ok(acha('iPhone 17 Pro Max', 'Laranja-cósmico') && acha('iPhone 17 Pro Max', 'Laranja-cósmico').custo === 7250 && acha('iPhone 17 Pro Max', 'Laranja-cósmico').cap === '256GB', 'cabeçalho "17 PRO MAX 256GB" + "Laranja 7.250" → Laranja-cósmico 256GB custo 7250');
ok(acha('iPhone 17 Pro Max', 'Azul-profundo') && acha('iPhone 17 Pro Max', 'Prateado'), '"Azul" e "Prata" viram as cores do catálogo (Azul-profundo, Prateado)');
ok(acha('iPhone 18 Pro', 'Bordô') && acha('iPhone 18 Pro', 'Azul') && acha('iPhone 18 Pro', 'Azul').custo === 8000, '"bordô/azul 8.000" vira 2 aparelhos');
ok(acha('iPhone 18 Pro Max', 'Preto') && acha('iPhone 18 Pro Max', 'Preto').cap === '512GB', 'linha completa "18 Pro Max 512GB preto 11.000"');
ok(l.lucro === 300, 'lucro do dia 300');
ok(l.naoEntendi.some(x => /roxo.*não tem no catálogo/i.test(x)) && !l.itens.some(i => i.modelo === 'iPhone 17 Pro Max' && i.custo === 7000), 'cor que o modelo não tem (roxo no 17 Pro Max) não é inventada: vai pro "não entendi"');
ok(ler('iPhone 19 Pro 256GB\nPrata 9.000\nAzul profundo 9.100').itens.map(i => i.cor).join() === 'Prateado,Azul-profundo', 'modelo que o catálogo ainda não tem: usa o nome padrão da cor');
ok(ler('17 pro max 256 laranja 7200\n17 pro max lucro 400\n18 pro 256 preto 8000\nlucro 250').lucros['iPhone 17 Pro Max'] === 400, 'lucro por modelo ("17 pro max lucro 400")');
ok(ler('lucro 17 pro max 400\n17 pro max 256 laranja 7200').lucros['iPhone 17 Pro Max'] === 400, 'lucro por modelo ("lucro 17 pro max 400") não lê o 17 como lucro');
const eh = t => run('ehListaPrecos_(' + JSON.stringify(t) + ')');
ok(eh(LISTA), 'reconhece a lista colada');
ok(!eh('quanto tá o 17 pro max 256 laranja?') && !eh('o 17 pro max tá 7.500 e o 18 pro 8.800, qual vende mais?'), 'pergunta normal com preço não vira lista');

// 3) pelo chat: proposta antes → depois, nada gravado
const chat = (txt, hist, extra) => H.post(Object.assign({ pin: '1234', acao: 'chat', aparelho: 'iPhone', mensagens: (hist || []).concat([{ role: 'user', content: txt }]) }, extra || {}));
let r = chat(LISTA);
const prop1 = r.resposta;
ok(r.ok && r.cerebro === 'catalogo' && /Antes \| Depois/.test(prop1), 'mostra a tabela antes → depois');
ok(/18 Pro 256GB Preto \| R\$ 8\.850 \| R\$ 8\.800/.test(prop1) && /18 Pro 256GB Bordô \| R\$ 8\.350 \| R\$ 8\.300/.test(prop1), 'preço = custo + lucro (8.500 + 300 = 8.800)');
ok(/18 Pro Max 512GB Preto \| — \| R\$ 11\.300 \|.*🆕/.test(prop1), 'aparelho novo na lista entra por encomenda 🆕');
ok(/No estoque[\s\S]*iPhone 17 Pro Max 256GB Laranja-cósmico: R\$ 7\.500 → R\$ 7\.550/.test(prop1) && /Já tão certos:.*17 Pro Max Azul-profundo/.test(prop1), 'o que tá no estoque vai pro texto do Gestão (ela não mexe)');
ok(/Não vieram na lista de hoje.*18 Pro Prateado/.test(prop1), 'avisa os por encomenda que não vieram (sem tirar sozinha)');
ok(/17 Pro Max Prateado.*vale quando acabar/.test(prop1), 'encomenda escondida (tem no estoque) já fica com o preço novo');
ok(!puts.length && repo['estoque.json'] === ESTOQUE0, 'sem o ok, nada foi gravado');
ok(!/ghp_teste/.test(prop1), 'token não aparece');
const hist = [{ role: 'user', content: LISTA }, { role: 'assistant', content: prop1 }];

// 4) "sim" solto em outra conversa/assunto não grava
ok(chat('ok', [{ role: 'user', content: 'oi' }, { role: 'assistant', content: 'Oi Thiago!' }], { chatId: r.chatId }).cerebro !== 'catalogo' && !puts.length, '"ok" que não responde a proposta não grava nada');

// 5) "ok" grava, confere e não mexe em mais nada
r = chat('ok', hist, { chatId: r.chatId });
ok(r.ok && /✅ Catálogo atualizado/.test(r.resposta) && /Conferi no GitHub/.test(r.resposta), 'com ok: atualizou e conferiu: ' + r.resposta.slice(0, 80));
ok(puts.length === 2 && puts[0].f === 'sync/encomenda.json' && puts[1].f === 'estoque.json' && /OK do Thiago/.test(puts[0].msg), 'grava encomenda.json e estoque.json (só esses 2)');
const encNovo = JSON.parse(repo['sync/encomenda.json']);
ok(encNovo._leia === enc0._leia && encNovo.itens.length === enc0.itens.length + 1, 'encomenda.json mantém o aviso e ganha 1 aparelho');
ok(preco(repo['estoque.json'], 'iPhone 18 Pro', 'Preto', 1) === 8800 && preco(repo['estoque.json'], 'iPhone 18 Pro Max', 'Preto', 1) === 9750 && JSON.parse(repo['estoque.json']).itens.some(i => i.modelo === 'iPhone 18 Pro Max' && i.cap === '512GB' && i.enc === 1 && i.preco === 11300), 'site com os preços novos por encomenda');
ok(preco(repo['estoque.json'], 'iPhone 18 Pro', 'Prateado', 1) === 8500, 'o que não veio na lista ficou como estava');
const naoEnc = t => JSON.stringify(JSON.parse(t).itens.filter(i => !i.enc));
ok(naoEnc(repo['estoque.json']) === naoEnc(ESTOQUE0), 'semi-novos, acessórios e lacrados do estoque: idênticos (nem um caractere)');
ok(encNovo.itens.find(e => e.modelo === 'iPhone 17 Pro Max' && e.cor === 'Prateado').preco === 7700, 'encomenda escondida atualizada');
ok(!JSON.parse(repo['estoque.json']).itens.some(i => i.enc && i.modelo === 'iPhone 17 Pro Max' && i.cor === 'Prateado'), '...e continua escondida (tem no estoque)');
ok(puts.every(p => p.auth === 'Bearer ghp_teste'), 'usa o token do cérebro');
// 6) "subiu?" confere no site
site = ESTOQUE0;
r = chat('subiu?', [], { chatId: r.chatId });
ok(/Ainda não/.test(r.resposta), 'site ainda velho: diz que não subiu');
site = repo['estoque.json'];
r = chat('subiu?', [], { chatId: r.chatId });
ok(/✅ Subiu/.test(r.resposta), 'site novo: confirma que subiu');

// 7) "ok tira" tira os que não vieram
reset();
r = chat(LISTA); let p2 = r.resposta;
r = chat('ok tira', [{ role: 'user', content: LISTA }, { role: 'assistant', content: p2 }], { chatId: r.chatId });
ok(/tirei 1/.test(r.resposta) && !JSON.parse(repo['sync/encomenda.json']).itens.some(e => e.modelo === 'iPhone 18 Pro' && e.cor === 'Prateado'), '"ok tira": tira o 18 Pro Prateado que não veio');

// 8) catálogo mudou entre a proposta e o ok: refaz e pede ok de novo
reset();
r = chat(LISTA); p2 = r.resposta;
repo['sync/encomenda.json'] = ENC0.replace('"cor": "Preto", "preco": 8850', '"cor": "Preto", "preco": 8900');
r = chat('ok', [{ role: 'user', content: LISTA }, { role: 'assistant', content: p2 }], { chatId: r.chatId });
ok(/mudou desde a proposta/.test(r.resposta) && /R\$ 8\.900 \| R\$ 8\.800/.test(r.resposta) && !puts.length, 'catálogo mudou: não grava, mostra a conta nova');

// 9) sem lucro: pergunta e continua
reset();
r = chat(LISTA.replace('\nlucro 300', ''));
ok(/Qual o lucro de hoje/.test(r.resposta), 'faltou o lucro: pergunta');
r = chat('350', [{ role: 'user', content: 'lista' }, { role: 'assistant', content: r.resposta }], { chatId: r.chatId });
ok(/18 Pro Max 512GB Preto \| — \| R\$ 11\.350/.test(r.resposta) && /Já tão certos:.*18 Pro Preto/.test(r.resposta), 'com o lucro 350: monta a proposta (11.000 + 350; 8.500 + 350 já tá certo)');

// 10) "não" cancela
const cid = r.chatId;
r = chat('não', [{ role: 'assistant', content: r.resposta }], { chatId: cid });
ok(/não mexi/.test(r.resposta) && !puts.length, '"não": cancela sem gravar');

// 11) token sem acesso ao repo: avisa direito
reset(); semPermissao = true;
r = chat(LISTA); p2 = r.resposta;
r = chat('ok', [{ role: 'user', content: LISTA }, { role: 'assistant', content: p2 }], { chatId: r.chatId });
ok(/token não tem acesso ao repositório catalogo/.test(r.resposta), 'token sem o repo catalogo: explica o que fazer');
semPermissao = false;

// 12) funcionária/sócia não mexe no catálogo
reset();
const k = H.post({ pin: '1234', acao: 'convidar', nome: 'Karina', perfil: 'funcionaria' });
r = H.post({ convite: k.chave, acao: 'chat', aparelho: 'x', mensagens: [{ role: 'user', content: LISTA }] });
ok(r.ok && r.cerebro !== 'catalogo' && !puts.length, 'Karina mandando a lista: não vira mudança de catálogo');
ok(/versão (8[2-9]|9\d)/.test(run('VERSAO_CEREBRO')), 'cérebro na versão 82 ou mais nova');
