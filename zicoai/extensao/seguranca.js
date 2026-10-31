/* ZicoAI no Chrome: as travas de segurança (v2.0).
 * Este arquivo roda em 3 lugares, sem mudar nada:
 *  - no service worker (fundo.js faz importScripts('seguranca.js'));
 *  - dentro da página (fundo.js injeta antes de clicar/preencher);
 *  - no node, pros testes (t42.js faz require).
 * Regra: na dúvida, NÃO faz. Quem libera botão perigoso é o Thiago (dados.confirmado === true).
 */
(function (raiz) {
  'use strict';

  // tira acento e deixa minúsculo: "Cartão" → "cartao"
  function limpar(t) {
    return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  }

  // bancos, carteiras e pagamento: a ZicoAI não lê, não clica, não preenche e não abre
  const DOMINIOS_PROIBIDOS = [
    'bb.com.br', 'caixa.gov.br', 'itau.com.br', 'itau.com', 'bradesco.com.br', 'bradesco', 'santander.com.br',
    'nubank.com.br', 'nu.com.br', 'bancointer.com.br', 'inter.co', 'c6bank.com.br', 'sicoob.com.br', 'sicredi.com.br',
    'btgpactual.com', 'bancooriginal.com.br', 'original.com.br', 'banrisul.com.br', 'bancopan.com.br', 'safra.com.br',
    'neon.com.br', 'next.me', 'mercadopago.com', 'mercadopago.com.br', 'pagseguro.uol.com.br', 'pagseguro.com.br',
    'pagbank.com.br', 'picpay.com', 'paypal.com', 'stripe.com', 'wise.com', 'binance.com', 'mercadobitcoin.com.br',
    'nubank.com', 'cielo.com.br', 'stone.com.br', 'rede.com.br', 'getnet.com.br', 'sumup.com.br', 'infinitepay.io',
    'acesso.gov.br', 'sso.acesso.gov.br', 'receita.fazenda.gov.br', 'meuinss.gov.br', 'pay.google.com', 'wallet.google.com'
  ];
  // palavras no endereço ou no título que indicam pagamento
  const PALAVRAS_PAGAMENTO = /(^|[^a-z])(checkout|pagamento|pagamentos|payment|payments|pix|boleto|fatura|internet ?banking|cartao de credito|credit ?card|billing|carteira digital)([^a-z]|$)/;
  const PAGAR_NO_ENDERECO = /(^|[^a-z])(pagar|pay)([^a-z]|$)/;   // só no endereço (no título "pagar" aparece em blog)

  // texto de botão que faz algo sem volta: só com o OK do Thiago
  const BOTAO_PERIGOSO = /(^|[^a-z])(enviar|envie|envia|send|submit|comprar|compre|buy|adicionar ao carrinho|pagar|pague|pay|finalizar|finalize|concluir (compra|pedido)|fechar pedido|place order|excluir|exclua|apagar|apague|deletar|delete|remover|remove|confirmar|confirme|confirm|publicar|publique|publish|postar|transferir|assinar|cancelar (assinatura|conta|pedido)|desinscrever)([^a-z]|$)/;
  // botão de formulário (type=submit) é perigoso, menos os de pesquisa
  const SUBMIT_INOFENSIVO = /(pesquis|buscar|busca|search|procurar|filtrar|ir$|^ok$|^go$)/;

  // campo que a ZicoAI NUNCA preenche (nem com OK)
  const CAMPO_PROIBIDO = /(senha|password|passwd|pass(code|word)?$|^pwd|cart(ao|oes)|cardnumber|card ?number|card-number|cc-?num|numero do cartao|\bcard\b|cvv|cvc|\bcsc\b|codigo de seguranca|security code|validade do cartao|vencimento do cartao|expir|cpf|cnpj|\brg\b|agencia|conta bancaria|numero da conta|conta corrente|iban|routing|swift|\bpin\b|token|\botp\b|codigo de verificacao|one-time)/;

  // link que baixa arquivo: nunca clica
  const EXT_DOWNLOAD = /\.(zip|rar|7z|exe|msi|dmg|pkg|apk|ipa|deb|rpm|bat|cmd|sh|ps1|jar|iso|bin|tar|gz|xz)(\?|#|$)/i;

  function host(url) {
    const m = String(url || '').match(/^https?:\/\/([^/:?#]+)/i);
    return m ? m[1].toLowerCase() : '';
  }

  /** Página proibida? Devolve o motivo (texto) ou '' se pode. */
  function paginaProibida(url, titulo) {
    const h = host(url);
    if (h) {
      for (const d of DOMINIOS_PROIBIDOS) {
        if (d.indexOf('.') < 0 ? h.split('.').indexOf(d) >= 0 : (h === d || h.endsWith('.' + d))) return 'página de banco/pagamento (' + h + ')';
      }
    }
    let caminho = '';
    try { caminho = decodeURIComponent(String(url || '')); } catch (e) { caminho = String(url || ''); }
    caminho = limpar(caminho.replace(/^https?:\/\//i, '').replace(/[\/_\-.?=&#+:]/g, ' '));
    if (PALAVRAS_PAGAMENTO.test(caminho) || PAGAR_NO_ENDERECO.test(caminho)) return 'página de pagamento (endereço)';
    if (PALAVRAS_PAGAMENTO.test(limpar(titulo))) return 'página de pagamento (título)';
    return '';
  }

  /** Pode abrir esta url? Só http/https, sem banco/pagamento e sem download. */
  function decidirAbrir(url) {
    const u = String(url || '').trim();
    if (!/^https?:\/\/[^\s]+$/i.test(u)) return { ok: false, erro: 'só abro endereço http:// ou https://' };
    if (EXT_DOWNLOAD.test(u.split('?')[0])) return { ok: false, erro: 'não baixo arquivo' };
    const p = paginaProibida(u, '');
    if (p) return { ok: false, erro: 'não mexo em ' + p };
    return { ok: true };
  }

  /** Campo proibido? info = {tipo, nome, id, autocomplete, rotulo, placeholder}. Devolve o motivo ou ''. */
  function campoProibido(info) {
    info = info || {};
    const tipo = limpar(info.tipo);
    const auto = limpar(info.autocomplete);
    if (tipo === 'password') return 'campo de senha';
    if (tipo === 'file') return 'campo de arquivo';
    if (/(^|\s)cc-/.test(auto) || /(current-password|new-password|one-time-code)/.test(auto)) return 'campo de cartão/senha (autocomplete ' + auto + ')';
    const texto = limpar([info.nome, info.id, info.rotulo, info.placeholder, info.aria].filter(Boolean).join(' | ').replace(/[_\-]/g, ' '));
    const m = texto.match(CAMPO_PROIBIDO);
    if (m) return 'campo sensível (' + m[0].trim() + ')';
    return '';
  }

  /** Esse clique precisa do OK? info = {texto, tipo, tag}. */
  function botaoPerigoso(info) {
    info = info || {};
    const t = limpar(info.texto);
    if (BOTAO_PERIGOSO.test(t)) return true;
    if (limpar(info.tipo) === 'submit' && !SUBMIT_INOFENSIVO.test(t)) return true;
    return false;
  }

  /** Decide o clique. info = {texto, tipo, tag, href, download, url, titulo}; confirmado = dados.confirmado. */
  function decidirClique(info, confirmado) {
    info = info || {};
    const p = paginaProibida(info.url, info.titulo);
    if (p) return { ok: false, erro: 'não mexo em ' + p };
    if (info.download || (info.href && EXT_DOWNLOAD.test(String(info.href).split('?')[0]))) return { ok: false, erro: 'não baixo arquivo' };
    if (botaoPerigoso(info) && confirmado !== true) return { ok: false, erro: 'precisa do OK do Thiago', motivo: 'botão "' + String(info.texto || info.tipo || '').slice(0, 40) + '" envia/compra/apaga/confirma' };
    return { ok: true };
  }

  /** Decide o preenchimento. info = dados do campo + {url, titulo}. Campo sensível: nunca, nem com OK. */
  function decidirPreencher(info) {
    info = info || {};
    const p = paginaProibida(info.url, info.titulo);
    if (p) return { ok: false, erro: 'não mexo em ' + p };
    const c = campoProibido(info);
    if (c) return { ok: false, erro: 'não preencho ' + c + ' (isso é com o Thiago)' };
    return { ok: true };
  }

  const API = { limpar, host, paginaProibida, decidirAbrir, campoProibido, botaoPerigoso, decidirClique, decidirPreencher, DOMINIOS_PROIBIDOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.ZicoSeguranca = API;
})(typeof self !== 'undefined' ? self : this);
