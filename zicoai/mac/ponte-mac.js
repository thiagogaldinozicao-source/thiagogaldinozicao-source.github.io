#!/usr/bin/env node
// ZicoAI - ponte do Mac (Node, sem instalar nada) - mesmo protocolo da ponte.ps1 do PC.
// O Mac é que BUSCA os pedidos na ZicoAI (nada fica aberto no Mac).
// Regras: só pastas liberadas no config.json; NUNCA apaga; NUNCA sobrescreve (cria "nome (2)");
// comandos só da lista segura. Cada pedido fica anotado em ponte-log.txt.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { execFile } = require('child_process');

const DIR = process.env.ZPONTE_DIR || __dirname;
const CFG = path.join(DIR, 'config.json');
const LOG = path.join(DIR, 'ponte-log.txt');
const VERSAO = 'mac-2.0';
const HOME = os.homedir();
process.env.PATH = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:' + (process.env.PATH || '');

function log(t) {
  const l = new Date().toLocaleString('sv-SE') + ' ' + t + '\n';
  try { fs.appendFileSync(LOG, l); } catch (e) { /* ok */ }
}
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch (e) { log('não li o config.json: ' + e.message); }

function expandir(p) { return String(p || '').replace(/^~(?=$|\/)/, HOME).replace(/\$HOME|\$\{HOME\}/g, HOME); }
// caminho real (resolve atalhos/symlinks do pedaço que já existe), pra ninguém escapar da pasta liberada
function real(p) {
  let cur = path.resolve(p); const resto = [];
  while (!fs.existsSync(cur) && cur !== path.dirname(cur)) { resto.unshift(path.basename(cur)); cur = path.dirname(cur); }
  try { cur = fs.realpathSync(cur); } catch (e) { /* ok */ }
  return path.join(cur, ...resto);
}
function raizes() {
  return (cfg.pastas || []).map(p => ({ caminho: real(expandir(p.caminho)), escrever: !!p.escrever }));
}
const igual = (a, b) => a.toLowerCase() === b.toLowerCase(); // disco do Mac não diferencia maiúscula
function dentro(full, raiz) { return igual(full, raiz) || full.toLowerCase().startsWith(raiz.toLowerCase() + '/'); }

function liberado(caminho, paraEscrever) {
  if (!caminho) throw new Error('Faltou o caminho');
  caminho = expandir(caminho);
  const rs = raizes();
  if (!rs.length) throw new Error('Nenhuma pasta liberada no config.json');
  if (!path.isAbsolute(caminho)) {
    const apelidos = { 'documentos': 'documents', 'area de trabalho': 'desktop', 'área de trabalho': 'desktop', 'imagens': 'pictures', 'baixados': 'downloads', 'transferências': 'downloads' };
    const i = caminho.search(/[\\/]/);
    let primeiro = (i < 0 ? caminho : caminho.slice(0, i)).trim().toLowerCase();
    const resto = i < 0 ? '' : caminho.slice(i + 1).replace(/\\/g, '/');
    if (apelidos[primeiro]) primeiro = apelidos[primeiro];
    const r = rs.find(x => path.basename(x.caminho).toLowerCase() === primeiro);
    if (r) caminho = resto ? path.join(r.caminho, resto) : r.caminho;
    else caminho = path.join((rs.find(x => x.escrever) || rs[0]).caminho, caminho.replace(/\\/g, '/'));
  }
  const full = real(caminho);
  for (const r of rs) {
    if (dentro(full, r.caminho)) {
      if (paraEscrever && !r.escrever) throw new Error('A pasta ' + r.caminho + ' é só de leitura');
      return { caminho: full, raiz: r.caminho };
    }
  }
  throw new Error('Pasta não liberada: ' + full);
}

function rodar(cmd, args, opts) {
  return new Promise(res => {
    execFile(cmd, args || [], Object.assign({ timeout: 60000, maxBuffer: 20 * 1024 * 1024, encoding: 'utf8' }, opts || {}),
      (err, out, errOut) => res({ cod: err ? (typeof err.code === 'number' ? err.code : 1) : 0, saida: (String(out || '') + String(errOut || '')).trim(), erro: err && !out && !errOut ? err.message : '' }));
  });
}

const TEXTO = ['.txt', '.md', '.csv', '.json', '.html', '.htm', '.js', '.css', '.ps1', '.py', '.log', '.xml', '.gs', '.ini', '.yaml', '.yml', '.tsv', '.bat', '.sql', '.sh', '.plist'];
const IMAGEM = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
const ABRIR_OK = ['.txt', '.md', '.csv', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.xlsx', '.xls', '.docx', '.doc', '.pptx', '.mp4', '.mp3', '.html', '.htm'];
const MB = 1024 * 1024, GB = 1024 * MB;

async function discoLivre() {
  const r = await rodar('df', ['-k', HOME]);
  const l = r.saida.split('\n')[1]; if (!l) return '';
  const c = l.trim().split(/\s+/);
  return 'Disco: ' + (c[3] * 1024 / GB).toFixed(1) + ' GB livres de ' + Math.round(c[1] * 1024 / GB) + ' GB';
}
async function status() {
  return { ok: true, nome: os.hostname().replace(/\.local$/, ''), versao: VERSAO, hora: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    pastas: raizes(), disco: await discoLivre() };
}
function listar(d) {
  const l = liberado(d.pasta ? String(d.pasta) : raizes()[0].caminho, false);
  if (!fs.existsSync(l.caminho) || !fs.statSync(l.caminho).isDirectory()) throw new Error('Pasta não existe');
  const itens = fs.readdirSync(l.caminho, { withFileTypes: true }).filter(e => !e.name.startsWith('.'))
    .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name)).slice(0, 300)
    .map(e => {
      if (e.isDirectory()) return { nome: e.name, tipo: 'pasta' };
      let st = {}; try { st = fs.statSync(path.join(l.caminho, e.name)); } catch (x) { /* ok */ }
      return { nome: e.name, tipo: 'arquivo', tamanho: st.size || 0, modificado: st.mtime ? st.mtime.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '' };
    });
  return { ok: true, pasta: l.caminho, itens };
}
function ler(d) {
  const l = liberado(String(d.arquivo || ''), false);
  if (!fs.existsSync(l.caminho) || !fs.statSync(l.caminho).isFile()) throw new Error('Arquivo não existe');
  const tam = fs.statSync(l.caminho).size, ext = path.extname(l.caminho).toLowerCase();
  if (IMAGEM[ext]) { if (tam > MB) throw new Error('Imagem grande demais (máx. 1 MB)'); return { ok: true, arquivo: l.caminho, mime: IMAGEM[ext], base64: fs.readFileSync(l.caminho).toString('base64') }; }
  if (TEXTO.includes(ext)) { if (tam > MB) throw new Error('Arquivo de texto grande demais (máx. 1 MB)'); return { ok: true, arquivo: l.caminho, texto: fs.readFileSync(l.caminho, 'utf8') }; }
  throw new Error('Tipo de arquivo que eu não leio: ' + ext + ' (' + Math.ceil(tam / 1024) + ' KB)');
}
function escrever(d) {
  const l = liberado(String(d.arquivo || ''), true);
  const conteudo = String(d.conteudo == null ? '' : d.conteudo);
  if (conteudo.length > 1000000) throw new Error('Conteúdo grande demais');
  const pasta = path.dirname(l.caminho), ext = path.extname(l.caminho), nome = path.basename(l.caminho, ext);
  fs.mkdirSync(pasta, { recursive: true });
  for (let n = 1; n < 1000; n++) {
    const alvo = n === 1 ? l.caminho : path.join(pasta, nome + ' (' + n + ')' + ext);
    try { fs.writeFileSync(alvo, conteudo, { encoding: 'utf8', flag: 'wx' }); return { ok: true, arquivo: alvo }; } // 'wx' = só cria, nunca sobrescreve
    catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
  throw new Error('Nomes demais iguais');
}
async function tirarPrint() {
  const arq = path.join(os.tmpdir(), 'zicoai-print.jpg');
  const r = await rodar('/usr/sbin/screencapture', ['-x', '-t', 'jpg', arq]);
  if (r.cod !== 0 || !fs.existsSync(arq)) throw new Error('Não consegui tirar o print (o Mac precisa liberar "Gravação de Tela" pro node em Ajustes › Privacidade)');
  await rodar('/usr/bin/sips', ['-Z', '1600', arq]);
  return { ok: true, mime: 'image/jpeg', base64: fs.readFileSync(arq).toString('base64') };
}
async function abrir(d) {
  const alvo = String(d.alvo || '').trim();
  if (/^https?:\/\/[^\s"]+$/.test(alvo)) { const r = await rodar('/usr/bin/open', [alvo]); if (r.cod) throw new Error(r.saida || 'não abriu'); return { ok: true, aberto: alvo }; }
  const k = alvo.toLowerCase();
  const apps = { 'safari': 'Safari', 'navegador': 'Safari', 'chrome': 'Google Chrome', 'calculadora': 'Calculator', 'calc': 'Calculator', 'bloco de notas': 'TextEdit', 'notepad': 'TextEdit', 'textedit': 'TextEdit', 'terminal': 'Terminal' };
  if (['finder', 'explorador', 'explorer', 'pasta zicoai'].includes(k)) { const p = (raizes().find(x => x.escrever) || raizes()[0]).caminho; await rodar('/usr/bin/open', [p]); return { ok: true, aberto: p }; }
  if (apps[k]) { const r = await rodar('/usr/bin/open', ['-a', apps[k]]); if (r.cod) throw new Error('Não achei o app ' + apps[k]); return { ok: true, aberto: apps[k] }; }
  const l = liberado(alvo, false);
  const ext = path.extname(l.caminho).toLowerCase();
  if (!ABRIR_OK.includes(ext)) throw new Error('Por segurança eu não abro arquivos ' + (ext || 'sem extensão') + ' (programa/instalador).');
  if (!fs.existsSync(l.caminho)) throw new Error('Arquivo não existe');
  await rodar('/usr/bin/open', [l.caminho]);
  return { ok: true, aberto: l.caminho };
}
async function testesZicoai() {
  const repo = path.join(HOME, 'ZicoAI', 'repo');
  if ((await rodar('git', ['--version'])).cod) throw new Error('Git não está instalado no Mac');
  if (!fs.existsSync(path.join(repo, '.git'))) await rodar('git', ['clone', '--depth', '1', 'https://github.com/thiagogaldinozicao-source/thiagogaldinozicao-source.github.io', repo], { timeout: 180000 });
  else await rodar('git', ['-C', repo, 'pull', '--ff-only'], { timeout: 120000 });
  const pasta = path.join(repo, 'zicoai', 'cerebro', 'testes');
  if (!fs.existsSync(pasta)) throw new Error('Não achei a pasta de testes');
  const arqs = fs.readdirSync(pasta).filter(f => /^t\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  let total = 0; const falhas = [], linhas = [];
  for (const f of arqs) {
    const r = await rodar(process.execPath, [path.join(pasta, f)], { cwd: pasta, timeout: 120000 });
    const o = r.saida.split('\n');
    const ok = o.filter(x => x.startsWith('PASS')).length;
    const fa = o.filter(x => x.startsWith('FAIL') || x.includes('Error'));
    if (r.cod && !fa.length) fa.push('saiu com código ' + r.cod);
    total += ok;
    if (fa.length) falhas.push(f + ': ' + fa.slice(0, 2).join(' ; '));
    linhas.push(f + ': ' + ok + ' ok' + (fa.length ? ' | FALHOU' : ''));
  }
  const commit = (await rodar('git', ['-C', repo, 'log', '-1', '--format=%h %s'])).saida;
  return ['TOTAL: ' + total + ' testes ok, ' + falhas.length + ' arquivo(s) com falha', 'commit: ' + commit].concat(falhas, linhas).join('\n');
}
const LISTA = 'espaco_disco, processos, gpu, ip, sistema, ollama_modelos, testes_zicoai, diagnostico';
// Diagnóstico do Mac (só LÊ): o que tá rodando, o que deu erro, memória, disco, logs. Pra ela depurar o Mac sozinha.
function cauda(arq, n) { try { const t = fs.readFileSync(arq, 'utf8').split('\n'); return t.slice(-n).join('\n'); } catch (e) { return '(não achei ' + path.basename(arq) + ')'; } }
async function diagnostico() {
  const H = os.homedir(), partes = [];
  partes.push('== Mac: ' + os.hostname() + ' · ligado há ' + Math.round(os.uptime() / 3600) + ' h · ponte ' + VERSAO);
  partes.push('== Disco: ' + await discoLivre());
  const vm = (await rodar('/usr/bin/vm_stat', [])).saida.split('\n').filter(l => /free|active|wired|compressed|swap/i.test(l)).slice(0, 6).join(' | ');
  partes.push('== Memória (páginas de 16 KB): ' + vm.replace(/\s+/g, ' '));
  partes.push('== Mais pesados agora:\n' + (await rodar('/bin/ps', ['-Ao', 'rss=,pcpu=,comm='])).saida.split('\n').map(l => l.trim().split(/\s+/)).filter(x => x[2])
    .sort((a, b) => b[0] - a[0]).slice(0, 8).map(x => path.basename(x.slice(2).join(' ')) + ' - ' + Math.round(x[0] / 1024) + ' MB, ' + x[1] + '% CPU').join('\n'));
  partes.push('== Serviços da ZicoAI (launchd):\n' + ((await rodar('/bin/launchctl', ['list'])).saida.split('\n').filter(l => /zicoai|ollama/i.test(l)).join('\n') || '(nenhum)'));
  partes.push('== Ollama: ' + ((await rodar('ollama', ['ps'])).saida || 'sem modelo carregado'));
  partes.push('== Últimas linhas do log do Ollama:\n' + cauda(path.join(H, '.ollama', 'logs', 'server.log'), 15));
  partes.push('== Últimas linhas da ponte:\n' + cauda(LOG, 12));
  try {
    const dir = path.join(H, 'Library', 'Logs', 'DiagnosticReports'), lim = Date.now() - 3 * 86400000;
    const cr = fs.readdirSync(dir).filter(f => /\.(ips|crash)$/.test(f)).map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).filter(x => x.t > lim).sort((a, b) => b.t - a.t).slice(0, 8);
    partes.push('== Programas que travaram (3 dias): ' + (cr.length ? cr.map(x => x.f.replace(/-\d{4}-.*$/, '') + ' (' + new Date(x.t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) + ')').join(', ') : 'nenhum'));
  } catch (e) { partes.push('== Travamentos: não deu pra ler'); }
  return partes.join('\n\n').slice(0, 12000);
}
async function comando(d) {
  const n = String(d.nome || '').toLowerCase();
  let s;
  if (n === 'espaco_disco') s = await discoLivre();
  else if (n === 'processos') s = (await rodar('/bin/ps', ['-Ao', 'rss=,comm='])).saida.split('\n').map(l => l.trim().split(/\s+(.+)/)).filter(x => x[1])
    .sort((a, b) => b[0] - a[0]).slice(0, 15).map(x => path.basename(x[1]) + ' - ' + Math.round(x[0] / 1024) + ' MB').join('\n');
  else if (n === 'gpu') s = 'GPU integrada do chip Apple (usa a RAM do Mac, não tem memória de vídeo separada).\nModelos carregados agora:\n' + (await rodar('ollama', ['ps'])).saida;
  else if (n === 'ip') { s = ''; for (const i of ['en0', 'en1']) { const r = await rodar('/usr/sbin/ipconfig', ['getifaddr', i]); if (!r.cod && r.saida) s += i + ': ' + r.saida + '\n'; } s = s.trim() || 'sem IP na rede local'; }
  else if (n === 'sistema') s = [(await rodar('/usr/bin/sw_vers', [])).saida.replace(/\s+/g, ' '), 'Ligado há ' + Math.round(os.uptime() / 3600) + ' h',
    'RAM: ' + (os.totalmem() / GB).toFixed(0) + ' GB (o macOS usa a RAM livre como cache; "livre" baixo é normal)', 'Chip: ' + (os.cpus()[0] || {}).model].join('\n');
  else if (n === 'ollama_modelos') s = (await rodar('ollama', ['list'])).saida;
  else if (n === 'testes_zicoai') s = await testesZicoai();
  else if (n === 'diagnostico') s = await diagnostico();
  else throw new Error('Comando fora da lista segura: ' + LISTA);
  return { ok: true, saida: String(s).trim() };
}

// Cérebro do Mac: conversa com o Ollama local (só localhost; modelo da lista instalada).
async function ollamaChat(d) {
  const modelo = String(d.modelo || 'qwen3:8b');
  if (!/^[a-z0-9._:-]+$/i.test(modelo)) throw new Error('nome de modelo inválido');
  const msgs = (Array.isArray(d.mensagens) ? d.mensagens : []).slice(-40).map(m => ({ role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user', content: String(typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).slice(0, 60000) }));
  if (!msgs.length) throw new Error('sem mensagens');
  const t0 = Date.now();
  const r = await fetch('http://127.0.0.1:11434/api/chat', { method: 'POST', signal: AbortSignal.timeout(110000), body: JSON.stringify({ model: modelo, stream: false, think: false, keep_alive: '30m',
    options: { temperature: Number(d.temperatura) >= 0 ? Number(d.temperatura) : 0.6, num_predict: Math.min(Number(d.maxTokens) || 2048, 8192), num_ctx: Math.min(Number(d.contexto) || 16384, 32768) }, messages: msgs }) });
  const j = await r.json();
  if (j.error) throw new Error('Ollama: ' + j.error);
  const texto = String((j.message && j.message.content) || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return { ok: true, texto, modelo, ms: Date.now() - t0, tokens: j.eval_count || 0 };
}
async function executar(p) {
  const d = p.dados || {};
  log('pedido: ' + p.acao + ' ' + (d.pasta || '') + (d.arquivo || '') + (d.alvo || '') + (d.nome || '') + (d.html ? (String(d.html).length + ' letras de html') : ''));
  try {
    switch (p.acao) {
      case 'status': return await status();
      case 'listar': return listar(d);
      case 'ler': return ler(d);
      case 'escrever': return escrever(d);
      case 'print': return await tirarPrint();
      case 'abrir': return await abrir(d);
      case 'comando': return await comando(d);
      case 'ollama_chat': return await ollamaChat(d);   // cérebro do Mac (sem limite de token)
      case 'navegador': return await require('./navegador-zico.js').navegador(d);   // o navegador PRÓPRIO da ZicoAI (pesquisa, depura, ao vivo)
      case 'testar_html': return await require('./testar-html.js').testarHtml(d);   // abre o app no Chromium e devolve os erros
      default: return { ok: false, erro: 'Ação desconhecida: ' + p.acao };
    }
  } catch (e) { return { ok: false, erro: e.message }; }
}

async function chamar(obj, ms) {
  const r = await fetch(cfg.exec, { method: 'POST', body: JSON.stringify(obj), headers: { 'content-type': 'application/json; charset=utf-8' }, redirect: 'follow', signal: AbortSignal.timeout(ms || 90000) });
  return JSON.parse(await r.text());
}
const esperar = ms => new Promise(r => setTimeout(r, ms));
// Atualização sozinha: se o ponte-mac.js (ou o testar-html.js) mudar no disco, a ponte sai e o launchd liga a versão nova.
const ARQS_PONTE = [__filename, path.join(__dirname, 'testar-html.js'), path.join(__dirname, 'navegador-zico.js')];
const mtimeDe = f => { try { return fs.statSync(f).mtimeMs; } catch (e) { return 0; } };
const MTIMES = ARQS_PONTE.map(mtimeDe);
function mudouArquivo() { return ARQS_PONTE.some((f, i) => mtimeDe(f) !== MTIMES[i]); }
// Estudo 24h: com o Mac ligado, a cada 30 min pede pra ZicoAI estudar uma rodada (aprender com um erro ou um tema da web).
// Vai pelo web app (não gasta a cota de gatilhos do Apps Script). ZPONTE_ESTUDO_MIN=0 desliga.
const ESTUDO_MIN = Number(process.env.ZPONTE_ESTUDO_MIN || 30);
let ultimoEstudo = 0, estudando = false;
async function estudarSePrecisa() {
  if (!ESTUDO_MIN || estudando || Date.now() - ultimoEstudo < ESTUDO_MIN * 60000) return;
  estudando = true; ultimoEstudo = Date.now();
  try {
    const r = await chamar({ acao: 'ponteEstudar', segredo: cfg.segredo, dispositivo: 'mac' }, 330000);   // estudo com o cérebro do Mac + revisor passa de 90 s; o Apps Script corta em 6 min
    if (r.erro === 'PIN errado') { ultimoEstudo = Date.now() + 6 * 3600000; log('estudo: cérebro ainda sem a v51, tenta de novo em 6h'); estudando = false; return; }
    const e = r.erros || r;
    log('estudo: ' + (r.erro ? 'erro ' + r.erro : r.pulou ? 'pulou (' + r.pulou + ')' : e && e.aprendeu ? 'aprendeu com erro: ' + String(e.regra || '').slice(0, 120) : 'tema: ' + String((r.tema && r.tema.tema) || '?') + ' (' + ((r.tema && r.tema.salvos) || 0) + ' exercício(s) aprovados)'));
  } catch (e) { log('estudo falhou: ' + e.message); }
  estudando = false;
}

// Agentes no Mac (v2.0): o Mac é o trabalhador das tarefas. A cada ~10 s, cada trabalhador livre pede uma rodada
// (`ponteTarefa`, até 5 min no web app do Google, que não gasta os 90 min/dia de gatilhos). Rodou e sobrou → já pede de novo.
// ZPONTE_AGENTES=0 desliga (aí o Google volta a usar os gatilhos sozinho em 2 min).
const AGENTES = Math.max(0, Math.min(3, Number(process.env.ZPONTE_AGENTES === undefined ? 2 : process.env.ZPONTE_AGENTES)));
let trabalhando = 0, ultimaBatida = 0;
async function trabalhador() {
  trabalhando++;
  try {
    for (let i = 0; i < 200; i++) {   // emenda rodadas enquanto tiver tarefa (200 × 5 min no máximo)
      const r = await chamar({ acao: 'ponteTarefa', segredo: cfg.segredo, dispositivo: 'mac' }, 370000);
      if (!r.ok) {
        // cérebro antigo (sem ponteTarefa) responde "PIN errado": para 6 h pra não travar o PIN do app
        if (/PIN|tentativas/i.test(String(r.erro))) { ultimaBatida = Date.now() + 6 * 3600000; log('tarefa: cérebro ainda sem a v78, tenta de novo em 6h'); }
        else log('tarefa: ' + r.erro);
        break;
      }
      if (r.nada || !r.rodou) break;
      log('tarefa ' + r.rodou + ': rodada de ' + Math.round((r.ms || 0) / 1000) + ' s → ' + r.status);
    }
  } catch (e) { log('tarefa falhou: ' + e.message); }
  trabalhando--;
}
function trabalharSePrecisa() {
  if (!AGENTES || trabalhando >= AGENTES || Date.now() - ultimaBatida < 10000) return;
  ultimaBatida = Date.now();
  trabalhador();   // sem await: a ponte continua buscando pedidos (o agente usa o Mac pela ponte enquanto roda)
}

async function laco() {
  if (!cfg.exec || !cfg.segredo) { log('config.json sem exec ou segredo'); return; }
  log('ponte ' + VERSAO + ' ligada (busca pedidos na ZicoAI)');
  let falhas = 0, conectou = false;
  for (;;) {
    try {
      const r = await chamar({ acao: 'ponteBuscar', segredo: cfg.segredo, dispositivo: 'mac', nome: os.hostname().replace(/\.local$/, ''), versao: VERSAO });
      if (!r.ok) { if (conectou || falhas === 0) log('a ZicoAI recusou: ' + r.erro); conectou = false; falhas = 1; await esperar(60000); continue; }
      if (!conectou) { log('conectado na ZicoAI'); conectou = true; }
      falhas = 0;
      if (mudouArquivo()) { log('ponte atualizada no disco: reiniciando sozinha'); process.exit(1); }   // launchd liga de novo (KeepAlive)
      estudarSePrecisa();   // sem await: estuda em paralelo, não atrasa pedido
      trabalharSePrecisa();   // sem await: tarefas dos agentes rodam em paralelo
      for (const p of r.pedidos || []) {
        if (!p) continue;
        const res = await executar(p);
        try { await chamar({ acao: 'ponteResposta', segredo: cfg.segredo, dispositivo: 'mac', id: String(p.id), resultado: JSON.stringify(res) }); }
        catch (e) { log('não consegui mandar a resposta: ' + e.message); }
      }
    } catch (e) {
      falhas++; conectou = false;
      log('sem conexão com a ZicoAI: ' + e.message);
      await esperar(Math.min(60000, 5000 * falhas));
    }
  }
}

if (require.main === module) laco();
else module.exports = { executar, liberado, raizes, recarregar: c => { cfg = c; } };
