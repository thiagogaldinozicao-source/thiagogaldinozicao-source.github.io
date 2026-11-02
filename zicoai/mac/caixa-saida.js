'use strict';
// Outbox persistente da ponte: escrita atômica ANTES da execução e ANTES do envio.
// Evita repetir efeitos após reinício. Ações incertas precisam de reconciliação humana.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function criarCaixa(diretorio = process.env.ZICO_OUTBOX_DIR || path.join(os.homedir(), 'ZicoAI', 'ponte-pendentes')) {
  const raiz = path.resolve(diretorio);
  fs.mkdirSync(raiz, { recursive: true, mode: 0o700 });
  // Garante que esta pasta não seja um link para outra pasta inesperada.
  if (fs.realpathSync(raiz) !== raiz) throw new Error('Pasta da caixa de saída não é canônica');
  try { fs.chmodSync(raiz, 0o700); } catch (_) { /* permissões em disco externo */ }
  const caminho = id => {
    if (!/^p[a-z0-9]{1,100}$/.test(String(id))) throw new Error('ID de pedido inválido');
    return path.join(raiz, id + '.json');
  };
  const ler = id => {
    const arq = caminho(id);
    if (!fs.existsSync(arq)) return null;
    const r = JSON.parse(fs.readFileSync(arq, 'utf8'));
    if (r.id !== id || !['iniciada', 'pronta'].includes(r.estado)) throw new Error('Registro inválido: ' + id);
    return r;
  };
  const gravar = (id, registro) => {
    const destino = caminho(id);
    const temporario = destino + '.' + process.pid + '.' + require('node:crypto').randomBytes(6).toString('hex') + '.tmp';
    try {
      fs.writeFileSync(temporario, JSON.stringify({ id, ...registro }), { flag: 'wx', mode: 0o600 });
      fs.renameSync(temporario, destino);
    } finally { if (fs.existsSync(temporario)) fs.unlinkSync(temporario); }
  };
  function iniciar(id, acao) {
    const anterior = ler(id);
    if (anterior) return anterior;
    gravar(id, { estado: 'iniciada', acao: String(acao || '').slice(0, 80), criado: new Date().toISOString() });
    return ler(id);
  }
  function concluir(id, resultado) {
    const r = ler(id);
    if (!r) throw new Error('Não existe registro de início: ' + id);
    if (r.estado === 'pronta') return r;
    gravar(id, { ...r, estado: 'pronta', resultado, concluido: new Date().toISOString() });
    return ler(id);
  }
  function pendentes() {
    return fs.readdirSync(raiz).filter(n => /^p[a-z0-9]{1,100}\.json$/.test(n)).sort()
      .map(n => ler(n.slice(0, -5)));
  }
  function confirmar(id) {
    const registro = ler(id);
    if (registro?.estado === 'pronta') fs.unlinkSync(caminho(id));
  }
  return { iniciar, concluir, ler, pendentes, confirmar };
}
function resultadoIncerteza(acao) {
  return { ok: false, codigo: 'EXECUCAO_INCERTA', erro: 'A ponte do Mac foi interrompida durante ' + String(acao || 'a operação') + '. Não repeti a ação para evitar duplicação. Verifique o efeito antes de tentar novamente.' };
}
function respostaConfirmada(r) {
  return Boolean(r && r.ok === true);
}
module.exports = { criarCaixa, resultadoIncerteza, respostaConfirmada };
