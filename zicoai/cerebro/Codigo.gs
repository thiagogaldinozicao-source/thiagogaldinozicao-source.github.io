/**
 * ============================================================
 *  ZicoAI - cérebro na nuvem (Google Apps Script)
 *  Memória: planilha "ZicoAI Memória" (perfil, aprendizados,
 *  memoria, base, chats, mensagens)
 *  Cérebros: Gemini (principal, aguenta textos grandes, lê foto,
 *  pesquisa no Google) e Groq (rápido, forte em programação).
 *
 *  Chaves ficam em: Configurações do projeto (engrenagem) >
 *  Propriedades do script:  GEMINI_KEY  |  GROQ_KEY  |  PIN
 *  Opcional (PC ligado vira cérebro): PC_URL (link do Tailscale Funnel)
 *  e PC_MODELO (padrão: zicoai)
 * ============================================================
 */

const PLANILHA_ID = '1UOQHUjGdscAi6lfKZZbH4ipaa9lDaXrPeoHjNRxix0U';
const FUSO = 'America/Sao_Paulo';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_COMPAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_NATIVO_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

const CEREBROS = {
  gemini: { url: GEMINI_COMPAT_URL, chave: 'GEMINI_KEY', modelo: 'gemini-3.1-flash-lite', nome: 'Gemini', limite: 200000, maxSaida: 8192 },
  groq:   { url: GROQ_URL, chave: 'GROQ_KEY', modelo: 'openai/gpt-oss-120b', nome: 'Groq GPT-OSS 120B', limite: 7800, maxSaida: 4096 },
  groq2:  { url: GROQ_URL, chave: 'GROQ_KEY', modelo: 'qwen/qwen3.8-27b', nome: 'Groq Qwen', limite: 7800, maxSaida: 4096 },
  // PC de casa (Ollama pelo Tailscale Funnel). Endereço e modelo vêm das Propriedades do script.
  pc:     { url: '', chave: null, modelo: '', nome: 'PC', limite: 16000, maxSaida: 4096, local: true }
};

/** Monta o cérebro do PC se ele estiver configurado e não tiver caído há pouco. */
function cerebroPC() {
  const base = String(prop('PC_URL') || '').trim().replace(/\/+$/, '');
  if (!base) return null;
  if (CacheService.getScriptCache().get('pc_off')) return null;
  const modelo = prop('PC_MODELO') || 'zicoai';
  return Object.assign({}, CEREBROS.pc, { url: base + '/v1/chat/completions', modelo: modelo, nome: 'PC (' + modelo + ')' });
}
function marcarPCdesligado() { CacheService.getScriptCache().put('pc_off', '1', 180); }

const ABAS = {
  memoria:      ['Data', 'Lembrança', 'Origem'],
  aprendizados: ['Data', 'Erro', 'Certo', 'Assunto'],
  perfil:       ['Tópico', 'Informação'],
  base:         ['Assunto', 'Conteúdo'],
  chats:        ['Conversa', 'Título', 'Criada', 'Atualizada', 'Aparelho'],
  mensagens:    ['Conversa', 'Data', 'Quem', 'Mensagem', 'Cérebro', 'Aparelho']
};

const PERSONA = [
  'Você é a ZicoAI, assistente pessoal do Thiago, dono da Zicão Store em Itaú de Minas/MG.',
  'Agora é {DATA} (horário de Brasília).',
  '',
  '### REGRAS',
  '1. Português do Brasil, direto, começando pela resposta. Sem preâmbulo, sem repetir a pergunta, sem resumo no final.',
  '2. Honestidade: se não souber, diga "Não tenho essa informação." NUNCA invente especificações, preços ou dados. Em mensagem pra cliente use só o que o Thiago passou.',
  '3. O PERFIL, os APRENDIZADOS, a MEMÓRIA e a BASE abaixo são verdade. Nunca repita um erro listado nos aprendizados.',
  '4. Contas: mostre o passo a passo e depois o resultado final.',
  '5. Seu conhecimento interno é antigo: existem aparelhos mais novos (linha iPhone 17, iPhone Air e depois). Se o Thiago citar, confie.',
  '6. Foto: transcreva textos e números exatamente. Tela de app de TV Box pedindo ativação: responda só o MAC e a key.',
  '7. Pergunta simples = resposta curta. Problema detalhado = aprofunda.',
  '8. Reclamação de cliente: a mensagem começa reconhecendo o problema, depois a solução.',
  '9. Sempre "vc", nunca "tu". Jeito mineiro, informal.',
  '10. Não ofereça extras que não foram pedidos. Se algo for difícil demais pra vc, diga que é melhor pedir pro Claude.',
  '11. CARD DE COPIAR: tudo que o Thiago vai copiar e colar (mensagem pra cliente ou família, lista de preço, MAC e key, comparativo, código) vai SEMPRE dentro de um bloco de código markdown (três crases). Explicação fica fora do bloco.',
  '12. Programação: o Thiago NÃO sabe programar. Entregue o arquivo COMPLETO e funcionando e explique como leigo (nome do arquivo, onde salvar, como abrir). Modo escuro, mobile-first.',
  '13. Dados de cliente (CPF, telefone, endereço): se o Thiago mandar, avise em uma linha que isso é melhor fazer na ZicoAI do PC (offline) e não salve na memória.',
  '',
  '### COMO VC APRENDE (linhas especiais, o sistema lê e esconde do Thiago)',
  '- Quando o Thiago pedir pra lembrar/salvar/anotar algo, ou contar um fato novo e duradouro sobre ele, a loja ou os projetos, coloque no FINAL: [[MEMORIA: o fato, curto e completo]]',
  '- Quando o Thiago corrigir um erro seu: [[APRENDIZADO: o que estava errado || o jeito certo]]',
  '- Quando o Thiago pedir pra esquecer algo ou um fato da memória mudar: [[ESQUECER: trecho exato da lembrança antiga]] (e, se for o caso, uma nova [[MEMORIA: ...]])',
  '- Quando o Thiago pedir pra criar/gerar/desenhar uma imagem: responda uma frase curta e coloque [[IMAGEM: descrição detalhada da imagem EM INGLÊS]]',
  '- Não use essas linhas à toa. Não salve conversa fiada nem coisa passageira.'
].join('\n');

/** Lista do que a ZicoAI fez em cada resposta (aparece no app em "Como respondi"). */
let PASSOS = [];
function passo(t) { PASSOS.push(t); }

/* ============================================================
 *  ENTRADA
 * ============================================================ */

function doGet() {
  return ContentService.createTextOutput('ZicoAI no ar ✅');
}

function doPost(e) {
  PASSOS = [];
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!req.pin || String(req.pin) !== String(prop('PIN'))) return saida({ ok: false, erro: 'PIN errado' });
    const aparelho = String(req.aparelho || 'app').slice(0, 40);

    switch (req.acao) {
      case 'teste':         return saida({ ok: true, msg: 'Conectado ✅' });
      case 'chat':          return saida(chat(req, aparelho));
      case 'contexto':      return saida({ ok: true, sistema: montarSistema(String(req.pergunta || ''), false), passos: PASSOS });
      case 'registrar':     return saida(registrar(req, aparelho));
      case 'chats':         return saida({ ok: true, chats: listarChats() });
      case 'abrir':         return saida({ ok: true, mensagens: abrirChat(req.chatId) });
      case 'apagarChat':    apagarChat(req.chatId); return saida({ ok: true });
      case 'memorias':      return saida(listarMemorias());
      case 'salvar':        return saida(salvarMemoria(req.texto, aparelho));
      case 'apagarMemoria': return saida({ ok: true, apagadas: esquecer(req.texto, true) });
      default:              return saida({ ok: false, erro: 'Ação desconhecida' });
    }
  } catch (err) {
    return saida({ ok: false, erro: String(err && err.message || err), passos: PASSOS });
  }
}

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function prop(nome) { return PropertiesService.getScriptProperties().getProperty(nome); }

/* ============================================================
 *  CHAT
 * ============================================================ */

function chat(req, aparelho) {
  const historico = (req.mensagens || []).slice(-12)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 20000) }))
    .filter(m => m.content);
  if (!historico.length) return { ok: false, erro: 'Mensagem vazia' };

  const pergunta = historico[historico.length - 1].content;
  const temFoto = !!req.imagem;
  const modo = req.modo || 'auto';               // auto | web | imagem
  const preferido = req.cerebro || 'auto';       // auto | gemini | groq

  // conversa (cria se for nova)
  let chatId = req.chatId;
  let titulo = null;
  if (!chatId) {
    chatId = Utilities.getUuid().slice(0, 8) + Date.now().toString(36);
    titulo = criarTitulo(pergunta);
    aba('chats').appendRow([chatId, seguro(titulo), "'" + agora(), "'" + agora(), aparelho]);
  }
  if (req.refazer) apagarUltimaResposta(chatId);
  else gravarMensagem(chatId, 'thiago', pergunta + (temFoto ? '\n[📷 foto enviada]' : ''), '', aparelho);

  if (temFoto) passo('Analisou a foto');

  let resultado = null;
  const querPesquisa = modo === 'web' || (!temFoto && modo !== 'imagem' && precisaPesquisar(pergunta));
  const extraSistema = modo === 'imagem'
    ? '\n\nO Thiago quer GERAR UMA IMAGEM agora. Responda curto e use obrigatoriamente [[IMAGEM: ...]].'
    : '';

  if (querPesquisa) resultado = pesquisar(historico, pergunta);
  if (!resultado) resultado = conversar(historico, pergunta, req.imagem, preferido, extraSistema);
  if (!resultado.ok) return Object.assign(resultado, { chatId: chatId, titulo: titulo, passos: PASSOS });

  const proc = processarTags(resultado.texto, aparelho);
  let textoFinal = proc.texto;
  if (resultado.fontes && resultado.fontes.length) {
    textoFinal += '\n\n**Fontes:** ' + resultado.fontes.slice(0, 5).map(f => '[' + f.titulo + '](' + f.url + ')').join(' · ');
  }
  if (querPesquisa && !resultado.pesquisou) {
    textoFinal = '_(não consegui pesquisar na web agora, respondi com o que eu sei)_\n\n' + textoFinal;
  }

  gravarMensagem(chatId, 'zicoai', textoFinal, resultado.cerebro, aparelho);
  tocarChat(chatId);

  return { ok: true, chatId: chatId, titulo: titulo, resposta: textoFinal, cerebro: resultado.cerebro, salvou: proc.salvou, passos: PASSOS };
}

/* ---------- resposta feita pelo modelo do PC (offline) ---------- */
/* O app pega o contexto (acao 'contexto'), o PC responde, e aqui a gente
   guarda a conversa e o que ela aprendeu, igual nos outros cérebros. */

function registrar(req, aparelho) {
  const pergunta = String(req.pergunta || '').slice(0, 20000);
  const resposta = String(req.resposta || '');
  if (!pergunta || !resposta) return { ok: false, erro: 'Faltou pergunta ou resposta' };
  let chatId = req.chatId;
  let titulo = null;
  if (!chatId) {
    chatId = Utilities.getUuid().slice(0, 8) + Date.now().toString(36);
    titulo = criarTitulo(pergunta);
    aba('chats').appendRow([chatId, seguro(titulo), "'" + agora(), "'" + agora(), aparelho]);
  }
  if (req.refazer) apagarUltimaResposta(chatId);
  else gravarMensagem(chatId, 'thiago', pergunta + (req.foto ? '\n[📷 foto enviada]' : ''), '', aparelho);
  const proc = processarTags(resposta.replace(/<think>[\s\S]*?<\/think>/g, '').trim(), aparelho);
  const cerebro = String(req.cerebro || 'PC').slice(0, 60);
  gravarMensagem(chatId, 'zicoai', proc.texto, cerebro, aparelho);
  tocarChat(chatId);
  return { ok: true, chatId: chatId, titulo: titulo, resposta: proc.texto, cerebro: cerebro, salvou: proc.salvou, passos: PASSOS };
}

/* ---------- conversa normal ---------- */

function conversar(historico, pergunta, imagem, preferido, extraSistema) {
  const sistema = montarSistema(pergunta, false) + (extraSistema || '');
  const msgs = [{ role: 'system', content: sistema }];
  historico.forEach((m, i) => {
    if (imagem && i === historico.length - 1) {
      msgs.push({ role: 'user', content: [
        { type: 'text', text: m.content || 'O que tem nessa foto?' },
        { type: 'image_url', image_url: { url: imagem } }
      ] });
    } else msgs.push(m);
  });

  // Nuvem primeiro (modelos grandes respondem melhor). O PC de casa (modelo 8B)
  // é reserva: entra quando a nuvem falha ou estoura o limite, ou se o Thiago escolher "PC".
  const pc = cerebroPC();
  let ordem;
  if (imagem) ordem = ['gemini', 'pc'];
  else if (ehProgramacao(pergunta)) { ordem = ['groq', 'gemini', 'pc', 'groq2']; passo('Assunto de programação: chamou o cérebro de código'); }
  else ordem = ['gemini', 'groq', 'pc', 'groq2'];
  if (['groq', 'gemini', 'pc'].indexOf(preferido) >= 0 && !(imagem && preferido === 'groq')) {
    ordem = [preferido].concat(ordem.filter(c => c !== preferido));
  }
  if (preferido === 'pc' && prop('PC_URL') && !pc) passo('PC desligado, usou a nuvem');
  ordem = ordem.filter(n => n !== 'pc' || pc);

  const tokens = estimarTokens(JSON.stringify(msgs)) + (imagem ? 1500 : 0);
  const erros = [];
  for (const nome of ordem) {
    const c = nome === 'pc' ? pc : CEREBROS[nome];
    const maxSaida = Math.min(c.maxSaida, c.limite - tokens);
    if (maxSaida < 1200) { erros.push(c.nome + ': conversa grande demais pro plano grátis'); continue; }
    try {
      const texto = chamarCompat(c, msgs, maxSaida);
      passo((c.local && erros.length ? 'Nuvem indisponível, respondeu com o ' : 'Respondeu com ') + c.nome);
      return { ok: true, texto: texto, cerebro: c.nome };
    } catch (err) {
      erros.push(String(err.message || err));
      if (c.local) { marcarPCdesligado(); passo('PC não respondeu, trocou de cérebro'); }
      else passo(c.nome + ' falhou, trocou de cérebro');
    }
  }
  return { ok: false, erro: 'Nenhum cérebro respondeu agora. ' + erros.join(' | ') };
}

function chamarCompat(c, msgs, maxSaida, extras) {
  const chave = c.chave ? prop(c.chave) : 'ollama';
  if (!chave) throw new Error('Falta a chave ' + c.chave + ' nas Propriedades do script');
  const corpo = Object.assign({ model: c.modelo, messages: msgs, temperature: 0.6, max_tokens: maxSaida }, extras || {});
  const r = UrlFetchApp.fetch(c.url, {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + chave },
    payload: JSON.stringify(corpo), muteHttpExceptions: true
  });
  if (c.local && /<html/i.test(r.getContentText().slice(0, 200))) throw new Error(c.nome + ' fora do ar');
  const cod = r.getResponseCode();
  const txt = r.getContentText();
  if (cod !== 200) throw new Error(c.nome + ' ' + cod + ': ' + resumoErro(txt));
  const j = JSON.parse(txt);
  const conteudo = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!conteudo) throw new Error(c.nome + ' respondeu vazio');
  return String(conteudo).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/* ---------- pesquisa na web ---------- */

function pesquisar(historico, pergunta) {
  const sistema = montarSistema(pergunta, true) +
    '\n\nVocê tem acesso à pesquisa na web. Pesquise, confira e responda com os dados atuais. Diga a data da informação quando fizer diferença (preço, cotação).';

  // 1) Groq com navegador (funciona no plano grátis)
  try {
    const msgs = [{ role: 'system', content: sistema }].concat(historico.slice(-4));
    const c = CEREBROS.groq;
    const maxSaida = Math.min(2048, c.limite - estimarTokens(JSON.stringify(msgs)));
    if (maxSaida >= 800) {
      const texto = chamarCompat(c, msgs, maxSaida, { tools: [{ type: 'browser_search' }], tool_choice: 'required', reasoning_effort: 'low' })
        .replace(/【[^】]*】/g, '').trim();
      passo('Pesquisou na web (Groq)');
      return { ok: true, texto: texto, cerebro: c.nome + ' + web', fontes: [], pesquisou: true };
    }
  } catch (e) { passo('Pesquisa pelo Groq falhou, tentou o Google'); }

  // 2) Gemini com Google Search (no plano grátis pode estar sem cota)
  try {
    const r = geminiComGoogle(sistema, historico);
    if (r) { passo('Pesquisou no Google (' + r.fontes.length + ' fontes)'); return r; }
  } catch (e) { /* cai pra conversa normal */ }

  passo('Não conseguiu pesquisar, respondeu com o que sabe');
  return null;
}

function geminiComGoogle(sistema, historico) {
  const chave = prop('GEMINI_KEY');
  if (!chave) return null;
  const contents = historico.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const corpo = {
    systemInstruction: { parts: [{ text: sistema }] },
    contents: contents,
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
  };
  const r = UrlFetchApp.fetch(GEMINI_NATIVO_URL + CEREBROS.gemini.modelo + ':generateContent', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-goog-api-key': chave },
    payload: JSON.stringify(corpo), muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) return null;
  const j = JSON.parse(r.getContentText());
  const cand = j.candidates && j.candidates[0];
  if (!cand || !cand.content || !cand.content.parts) return null;
  const texto = cand.content.parts.map(p => p.text || '').join('').trim();
  if (!texto) return null;
  const fontes = [];
  const vistos = {};
  ((cand.groundingMetadata && cand.groundingMetadata.groundingChunks) || []).forEach(g => {
    if (g.web && g.web.uri && !vistos[g.web.uri]) {
      vistos[g.web.uri] = 1;
      fontes.push({ titulo: String(g.web.title || 'fonte').replace(/[\[\]]/g, ''), url: g.web.uri });
    }
  });
  return { ok: true, texto: texto, cerebro: 'Gemini + Google', fontes: fontes, pesquisou: true };
}

/* ---------- classificação ---------- */

function precisaPesquisar(t) {
  const s = normalizar(t);
  if (/^(lembra|lembre|salva|salve|anota|anote|guarda|guarde|esquece|esqueca)/.test(s)) return false;
  return /(pesquis|procura na|busca na|na internet|na web|no google|noticia|cotacao|dolar hoje|preco atual|quanto ta custando|quanto esta custando|lancament|lancou|previsao do tempo|clima em|resultado do jogo|placar|quem ganhou|ultimas|mais recente|atualizad|hoje em dia)/.test(s);
}

function ehProgramacao(t) {
  return /(codigo|html|css|javascript|\bjs\b|python|unreal|blueprint|vs ?code|script|programa|aplicativo|\bapp\b|funcao|\bbug\b|pwa|supabase|github|\bapi\b|json|planilha.*formula|formula.*planilha)/.test(normalizar(t));
}

/* ============================================================
 *  MEMÓRIA
 * ============================================================ */

let _ss = null;
function planilha() { if (!_ss) _ss = SpreadsheetApp.openById(PLANILHA_ID); return _ss; }

function aba(nome) {
  let a = planilha().getSheetByName(nome);
  if (!a) {
    a = planilha().insertSheet(nome);
    a.appendRow(ABAS[nome]);
    a.setFrozenRows(1);
    a.getRange(1, 1, 1, ABAS[nome].length).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#ffffff');
  }
  return a;
}

function linhas(nome) {
  const a = aba(nome);
  const n = a.getLastRow();
  if (n < 2) return [];
  return a.getRange(2, 1, n - 1, ABAS[nome].length).getDisplayValues().filter(l => l.join('').trim());
}

function montarSistema(pergunta, enxuto) {
  let s = PERSONA.replace('{DATA}', Utilities.formatDate(new Date(), FUSO, "dd/MM/yyyy 'às' HH:mm"));

  const perfil = linhas('perfil');
  const perfilUsado = enxuto ? perfil.filter(l => /como responder/i.test(l[0])) : perfil;
  if (perfilUsado.length) s += '\n\n### PERFIL DO THIAGO\n' + perfilUsado.map(l => '- [' + l[0] + '] ' + l[1]).join('\n');

  const apr = linhas('aprendizados');
  const aprUsado = enxuto ? relevantes(apr, pergunta, 5, l => l[1] + ' ' + l[2] + ' ' + l[3]) : apr.slice(-80);
  if (aprUsado.length) s += '\n\n### APRENDIZADOS (erros que já aconteceram e o jeito certo)\n' + aprUsado.map(l => '- ERRO: ' + l[1] + ' → CERTO: ' + l[2]).join('\n');

  const mem = linhas('memoria');
  const recentes = mem.slice(enxuto ? -8 : -25);
  const antigas = mem.slice(0, Math.max(0, mem.length - recentes.length));
  const memUsada = relevantes(antigas, pergunta, enxuto ? 8 : 35, l => l[1]).concat(recentes);
  if (memUsada.length) s += '\n\n### MEMÓRIA (o que o Thiago já ensinou)\n' + memUsada.map(l => '- (' + l[0] + ') ' + l[1]).join('\n');

  const base = relevantes(linhas('base'), pergunta, enxuto ? 4 : 10, l => l[0] + ' ' + l[1], l => l[0]);
  if (base.length) s += '\n\n### BASE DA LOJA (trechos ligados à pergunta)\n' + base.map(l => '- ' + l[0] + ': ' + l[1]).join('\n');

  const pl = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
  passo('Leu o perfil e ' + pl(aprUsado.length, 'aprendizado', 'aprendizados'));
  passo('Consultou ' + pl(memUsada.length, 'lembrança', 'lembranças') + (base.length ? ' e ' + pl(base.length, 'trecho', 'trechos') + ' da base' : ''));
  return s;
}

/** Escolhe as linhas que têm mais palavras em comum com a pergunta. */
function relevantes(lista, pergunta, limite, textoDe, tituloDe) {
  const pn = normalizar(pergunta);
  const palavras = pn.split(/[^a-z0-9]+/).filter(p => p.length >= 3 && PARADAS.indexOf(p) < 0);
  const numeros = pn.match(/\b\d{2}\b/g) || [];
  if ((!palavras.length && !numeros.length) || !lista.length) return [];
  return lista.map((l, i) => {
    const alvo = ' ' + normalizar(textoDe(l)) + ' ';
    const tit = tituloDe ? normalizar(tituloDe(l)) : '';
    let p = 0;
    palavras.forEach(w => {
      if (alvo.indexOf(' ' + w + ' ') >= 0) p += 2; else if (alvo.indexOf(w) >= 0) p += 1;
      if (tit && tit.indexOf(w) >= 0) p += 2;
    });
    // números (ex.: 15, 17) pesam mais pra acertar o modelo do iPhone
    numeros.forEach(n => { if (tit && new RegExp('\\b' + n + '\\b').test(tit)) p += 4; });
    return { l: l, p: p, i: i };
  }).filter(x => x.p >= 2)
    .sort((a, b) => b.p - a.p || b.i - a.i)
    .slice(0, limite)
    .sort((a, b) => a.i - b.i)
    .map(x => x.l);
}

const PARADAS = ['que', 'qual', 'quais', 'como', 'para', 'pra', 'com', 'uma', 'umas', 'uns', 'por', 'dos', 'das', 'nos', 'nas', 'esse', 'essa', 'isso', 'este', 'esta', 'isto', 'mais', 'menos', 'muito', 'voce', 'manda', 'faz', 'fazer', 'quero', 'preciso', 'tem', 'ter', 'sobre', 'ele', 'ela', 'eles', 'elas', 'meu', 'minha', 'seu', 'sua', 'ser', 'tah', 'sim', 'nao', 'mas', 'quando', 'onde', 'porque', 'entao', 'tambem', 'tbm', 'aqui', 'ali', 'agora'];

function processarTags(texto, aparelho) {
  const salvou = [];
  texto = texto.replace(/\[\[ESQUECER:\s*([\s\S]*?)\]\]/gi, (_, t) => {
    const n = esquecer(t.trim(), false);
    if (n) { salvou.push('esqueceu'); passo('Apagou ' + n + ' lembrança(s) antiga(s)'); }
    return '';
  });
  texto = texto.replace(/\[\[MEMORIA:\s*([\s\S]*?)\]\]/gi, (_, t) => {
    t = t.trim();
    if (t && !temDadoSensivel(t) && !jaSabe(t, linhas('memoria').map(l => l[1]))) {
      aba('memoria').appendRow(["'" + hoje(), seguro(t), aparelho]);
      salvou.push('memória'); passo('Guardou na memória: ' + t.slice(0, 80));
    }
    return '';
  });
  texto = texto.replace(/\[\[APRENDIZADO:\s*([\s\S]*?)\]\]/gi, (_, t) => {
    const p = t.split('||');
    aba('aprendizados').appendRow(["'" + hoje(), seguro((p[0] || '').trim()), seguro((p[1] || '').trim()), aparelho]);
    salvou.push('aprendizado'); passo('Anotou o erro pra não repetir');
    return '';
  });
  texto = texto.replace(/\[\[IMAGEM:\s*([\s\S]*?)\]\]/gi, (_, t) => {
    const seed = Math.floor(Math.random() * 1e9);
    const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(t.trim()) + '?width=1024&height=1024&nologo=true&model=flux&seed=' + seed;
    passo('Mandou gerar a imagem');
    return '\n\n![imagem gerada](' + url + ')\n';
  });
  return { texto: texto.replace(/\n{3,}/g, '\n\n').trim(), salvou: salvou };
}

function temDadoSensivel(t) {
  return /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(t) || /\(?\b\d{2}\)?\s?9\d{4}-?\d{4}\b/.test(t);
}

function esquecer(trecho, exato) {
  trecho = String(trecho || '').trim();
  if (trecho.length < 4) return 0;
  const a = aba('memoria');
  const n = a.getLastRow();
  if (n < 2) return 0;
  const vals = a.getRange(2, 2, n - 1, 1).getDisplayValues();
  const alvo = normalizar(trecho);
  let apagadas = 0;
  for (let i = vals.length - 1; i >= 0; i--) {
    const v = normalizar(vals[i][0]);
    if (exato ? v === alvo : v.indexOf(alvo) >= 0) { a.deleteRow(i + 2); apagadas++; }
  }
  return apagadas;
}

function salvarMemoria(texto, aparelho) {
  texto = String(texto || '').trim();
  if (!texto) return { ok: false, erro: 'Texto vazio' };
  if (temDadoSensivel(texto)) return { ok: false, erro: 'Parece CPF ou telefone. Isso não vai pra nuvem.' };
  aba('memoria').appendRow(["'" + hoje(), seguro(texto.slice(0, 2000)), aparelho]);
  return { ok: true, msg: 'Salvo na memória ✅' };
}

function listarMemorias() {
  return {
    ok: true,
    memorias: linhas('memoria').slice(-80).reverse(),
    aprendizados: linhas('aprendizados').slice(-50).reverse()
  };
}

/* ============================================================
 *  CONVERSAS (histórico sincronizado entre aparelhos)
 * ============================================================ */

function gravarMensagem(chatId, quem, texto, cerebro, aparelho) {
  aba('mensagens').appendRow([chatId, "'" + agora(), quem, seguro(String(texto).slice(0, 45000)), cerebro || '', aparelho]);
}

function tocarChat(chatId) {
  const a = aba('chats');
  const achou = a.getRange('A:A').createTextFinder(chatId).matchEntireCell(true).findNext();
  if (achou) a.getRange(achou.getRow(), 4).setValue("'" + agora());
}

function listarChats() {
  return linhas('chats')
    .map(l => ({ id: l[0], titulo: l[1], atualizada: l[3] }))
    .sort((a, b) => (a.atualizada < b.atualizada ? 1 : -1))
    .slice(0, 100);
}

function abrirChat(chatId) {
  if (!chatId) return [];
  return linhas('mensagens')
    .filter(l => l[0] === chatId)
    .map(l => ({ role: l[2] === 'thiago' ? 'user' : 'assistant', content: l[3], cerebro: l[4] }));
}

function apagarUltimaResposta(chatId) {
  const a = aba('mensagens');
  const n = a.getLastRow();
  if (n < 2) return;
  const vals = a.getRange(2, 1, n - 1, 3).getDisplayValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i][0] === chatId) {
      if (vals[i][2] === 'zicoai') a.deleteRow(i + 2);
      return;
    }
  }
}

function apagarChat(chatId) {
  if (!chatId) return;
  const a = aba('mensagens');
  const n = a.getLastRow();
  if (n >= 2) {
    const ids = a.getRange(2, 1, n - 1, 1).getDisplayValues();
    // apaga de baixo pra cima, em blocos seguidos
    let i = ids.length - 1;
    while (i >= 0) {
      if (ids[i][0] === chatId) {
        const fim = i;
        while (i - 1 >= 0 && ids[i - 1][0] === chatId) i--;
        a.deleteRows(i + 2, fim - i + 1);
      }
      i--;
    }
  }
  const c = aba('chats');
  const achou = c.getRange('A:A').createTextFinder(chatId).matchEntireCell(true).findNext();
  if (achou) c.deleteRow(achou.getRow());
}

function criarTitulo(t) {
  t = String(t).replace(/\s+/g, ' ').trim();
  return t.length > 42 ? t.slice(0, 40).replace(/\s\S*$/, '') + '…' : t;
}

/* ============================================================
 *  UTILIDADES
 * ============================================================ */

function agora() { return Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd HH:mm:ss'); }
function hoje() { return Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy'); }
function seguro(t) { t = String(t == null ? '' : t); return /^[=+\-@]/.test(t) ? "'" + t : t; }
function normalizar(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function estimarTokens(t) { return Math.ceil(String(t).length / 3.2); }
function resumoErro(txt) {
  try { const j = JSON.parse(txt); const e = Array.isArray(j) ? j[0].error : j.error; return (e && (e.message || e.status)) || String(txt).slice(0, 200); }
  catch (e) { return String(txt).slice(0, 200); }
}

/* ============================================================
 *  APRENDER SOZINHA
 *  A cada 10 minutos ela relê as conversas novas e tira dali o que
 *  o Thiago ensinou (fatos, preferências, correções). Assim ele não
 *  precisa repetir nada, mesmo que na hora ela não tenha anotado.
 * ============================================================ */

const PROMPT_APRENDER = [
  'Você é o sistema de memória da ZicoAI, assistente do Thiago (dono da Zicão Store).',
  'Leia as conversas abaixo e extraia SÓ o que vale lembrar pra sempre, dito pelo THIAGO (nunca o que a ZicoAI disse sozinha):',
  '- fatos duradouros sobre ele, a família, a loja, preços fixos, regras, fornecedores, projetos, gostos',
  '- jeitos que ele quer que ela responda (formato, tom, o que evitar)',
  '- correções: quando ele disse que algo estava errado, guarde o erro e o jeito certo',
  '- quando ele disser que algo mudou ou pedir pra esquecer, coloque o trecho antigo em "esquecer"',
  'NÃO guarde: conversa fiada, coisa passageira (o que tá fazendo agora, dúvida do momento), dados de cliente (nome, CPF, telefone, endereço), senhas, chaves, números de cartão.',
  'NÃO repita o que já está em MEMÓRIA ATUAL ou APRENDIZADOS ATUAIS. Se nada novo, devolva listas vazias.',
  'Cada lembrança: uma frase curta, completa, que faça sentido sozinha (ex.: "O frete da Will é 15% sobre o valor em dólar").',
  'Responda SÓ com JSON neste formato:',
  '{"memorias":["..."],"aprendizados":[{"erro":"...","certo":"...","assunto":"..."}],"esquecer":["trecho exato da lembrança antiga"]}'
].join('\n');

function aprenderSozinha() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const ultima = props.getProperty('APRENDIDO_ATE') || '';
    const novas = linhas('mensagens').filter(l => l[1] > ultima).slice(0, 60);
    if (!novas.length) return;
    if (!novas.some(l => l[2] === 'thiago')) { props.setProperty('APRENDIDO_ATE', novas[novas.length - 1][1]); return; }

    let conversa = '';
    novas.forEach(l => {
      const quem = l[2] === 'thiago' ? 'THIAGO' : 'ZICOAI';
      conversa += quem + ': ' + String(l[3]).slice(0, quem === 'THIAGO' ? 2500 : 1200) + '\n';
    });
    const memAtual = linhas('memoria').map(l => '- ' + l[1]).join('\n').slice(-12000);
    const aprAtual = linhas('aprendizados').map(l => '- ' + l[1] + ' → ' + l[2]).join('\n').slice(-6000);

    const msgs = [
      { role: 'system', content: PROMPT_APRENDER },
      { role: 'user', content: 'MEMÓRIA ATUAL:\n' + (memAtual || '(vazia)') + '\n\nAPRENDIZADOS ATUAIS:\n' + (aprAtual || '(vazio)') + '\n\nCONVERSAS NOVAS:\n' + conversa }
    ];
    let txt = null;
    for (const nome of ['gemini', 'groq2', 'groq']) {
      try { txt = chamarCompat(CEREBROS[nome], msgs, 1500, { temperature: 0.1 }); break; } catch (e) { /* próximo */ }
    }
    if (!txt) return; // tenta de novo na próxima rodada, sem marcar como lido

    const j = lerJSON(txt);
    if (!j) { props.setProperty('APRENDIDO_ATE', novas[novas.length - 1][1]); return; }
    const resumo = guardarAprendido(j, 'auto');
    props.setProperty('APRENDIDO_ATE', novas[novas.length - 1][1]);
    if (resumo) Logger.log('Aprendeu sozinha: ' + resumo);
  } finally {
    lock.releaseLock();
  }
}

function lerJSON(txt) {
  const m = String(txt).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

/** Grava o que foi aprendido sem duplicar o que já existe. */
function guardarAprendido(j, origem) {
  const feito = [];
  (j.esquecer || []).forEach(t => { const n = esquecer(String(t), false); if (n) feito.push('esqueceu ' + n); });
  const existentes = linhas('memoria').map(l => l[1]);
  (j.memorias || []).forEach(m => {
    m = String(m || '').trim();
    if (m.length < 6 || temDadoSensivel(m) || jaSabe(m, existentes)) return;
    aba('memoria').appendRow(["'" + hoje(), seguro(m.slice(0, 500)), origem]);
    existentes.push(m);
    feito.push('memória: ' + m.slice(0, 60));
  });
  const aprEx = linhas('aprendizados').map(l => l[1] + ' ' + l[2]);
  (j.aprendizados || []).forEach(a => {
    if (!a || !a.erro || !a.certo) return;
    const junto = a.erro + ' ' + a.certo;
    if (jaSabe(junto, aprEx)) return;
    aba('aprendizados').appendRow(["'" + hoje(), seguro(String(a.erro).slice(0, 400)), seguro(String(a.certo).slice(0, 400)), seguro(String(a.assunto || origem).slice(0, 40))]);
    aprEx.push(junto);
    feito.push('aprendizado: ' + String(a.certo).slice(0, 60));
  });
  return feito.join(' | ');
}

/** Já existe uma lembrança igual ou quase igual? */
function jaSabe(novo, lista) {
  const pal = t => normalizar(t).split(/[^a-z0-9]+/).filter(p => p.length >= 3 && PARADAS.indexOf(p) < 0);
  const a = pal(novo);
  if (!a.length) return true;
  const na = normalizar(novo);
  return lista.some(x => {
    const nx = normalizar(x);
    if (nx === na || nx.indexOf(na) >= 0 || na.indexOf(nx) >= 0 && nx.length > 20) return true;
    const b = pal(x);
    const comum = a.filter(p => b.indexOf(p) >= 0).length;
    return comum / Math.max(a.length, b.length) >= 0.75;
  });
}

/** Rode UMA vez: liga o "aprender sozinha" a cada 10 minutos. */
function ligarAprendizado() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'aprenderSozinha').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('aprenderSozinha').timeBased().everyMinutes(10).create();
  aprenderSozinha();
  Logger.log('Aprender sozinha: LIGADO (roda a cada 10 minutos)');
}

/* ============================================================
 *  RODE ESTA FUNÇÃO UMA VEZ PELO EDITOR (botão Executar)
 *  Ela pede a autorização do Google e testa os cérebros.
 * ============================================================ */

function instalar() {
  Object.keys(ABAS).forEach(aba);
  const log = [];
  log.push('PIN: ' + (prop('PIN') ? 'ok' : 'FALTANDO'));
  ['gemini', 'groq'].forEach(nome => {
    try {
      const r = chamarCompat(CEREBROS[nome], [{ role: 'user', content: 'Responda só: ok' }], 50);
      log.push(CEREBROS[nome].nome + ': funcionando (' + r.slice(0, 20) + ')');
    } catch (e) { log.push(CEREBROS[nome].nome + ': ERRO → ' + e.message); }
  });
  CacheService.getScriptCache().remove('pc_off');
  const pc = cerebroPC();
  if (pc) {
    try { log.push('PC: funcionando (' + chamarCompat(pc, [{ role: 'user', content: 'Responda só: ok' }], 20).slice(0, 20) + ')'); }
    catch (e) { log.push('PC: ERRO → ' + e.message); }
  } else log.push('PC: não configurado (opcional)');
  try {
    const g = geminiComGoogle('Responda curto.', [{ role: 'user', content: 'Qual a cotação do dólar hoje?' }]);
    log.push('Pesquisa no Google: ' + (g ? 'funcionando' : 'sem cota no plano grátis (usa o Groq)'));
  } catch (e) { log.push('Pesquisa no Google: ERRO → ' + e.message); }
  Logger.log(log.join('\n'));
}
