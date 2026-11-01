# Gera exercicios.json (academia de código da ZicoAI): apps pequenos com UM defeito de verdade + provas escondidas.
# As provas NÃO vão pra ela: o cérebro corrige só pelo pedido; quem dá a nota é o teste do Mac com as provas daqui.
import json
CAB = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title><style>body{font-family:system-ui;background:#111;color:#eee;padding:16px}input,button{font-size:16px;margin:4px;padding:6px}</style></head><body>'
FIM = '</body></html>'
def app(t, corpo): return CAB % t + corpo + FIM
EX = []
EX.append({ 'id': 'gorjeta-por-pessoa', 'nome': 'Gorjeta: total por pessoa',
  'pedido': 'na calculadora de gorjeta o "Por pessoa" tá errado: conta 100, gorjeta 10%, 2 pessoas tem que dar R$ 55,00 e tá dando R$ 110,00. corrige',
  'html': app('Gorjeta', '''<h1>Gorjeta</h1>
<label>Conta <input id="conta" inputmode="decimal"></label><br>
<label>Gorjeta % <input id="pct" value="10"></label><br>
<label>Pessoas <input id="pessoas" value="1"></label><br>
<button id="calc">Calcular</button>
<p>Por pessoa: <b id="porPessoa">R$ 0,00</b></p>
<script>
function num(t){ return parseFloat(String(t).replace(',', '.')) || 0; }
function brl(v){ return 'R$ ' + v.toFixed(2).replace('.', ','); }
document.getElementById('calc').onclick = function(){
  var c = num(document.getElementById('conta').value), p = num(document.getElementById('pct').value);
  var n = Math.max(1, parseInt(document.getElementById('pessoas').value) || 1);
  var total = c + c * p / 100;
  document.getElementById('porPessoa').textContent = brl(total);
};
</script>'''),
  'conserto': [["document.getElementById('porPessoa').textContent = brl(total);", "document.getElementById('porPessoa').textContent = brl(total / n);"]],
  'provas': [
    { 'nome': '100 + 10% em 2 = 55,00', 'passos': [{ 'preencher': '#conta', 'valor': '100' }, { 'preencher': '#pct', 'valor': '10' }, { 'preencher': '#pessoas', 'valor': '2' }, { 'clicar': '#calc' }], 'conferir': [{ 'texto': '#porPessoa', 'contem': 'R$ 55,00' }] },
    { 'nome': '90 + 10% em 3 = 33,00', 'passos': [{ 'preencher': '#conta', 'valor': '90' }, { 'preencher': '#pct', 'valor': '10' }, { 'preencher': '#pessoas', 'valor': '3' }, { 'clicar': '#calc' }], 'conferir': [{ 'texto': '#porPessoa', 'contem': 'R$ 33,00' }] }] })
EX.append({ 'id': 'lista-apaga-errado', 'nome': 'Lista de compras: apagar o item certo',
  'pedido': 'na lista de compras, quando eu apago um item some o item de cima dele em vez dele. corrige',
  'html': app('Lista', '''<h1>Lista de compras</h1>
<input id="item" placeholder="item"><button id="add">Adicionar</button>
<ul id="lista"></ul>
<script>
var itens = [];
function desenha(){
  document.getElementById('lista').innerHTML = itens.map(function(t, i){ return '<li><span>' + t + '</span> <button class="del" data-i="' + i + '">apagar</button></li>'; }).join('');
}
document.getElementById('add').onclick = function(){
  var c = document.getElementById('item'); if (!c.value.trim()) return;
  itens.push(c.value.trim()); c.value = ''; desenha();
};
document.getElementById('lista').onclick = function(e){
  if (e.target.classList.contains('del')) { itens.splice(Number(e.target.dataset.i) - 1, 1); desenha(); }
};
</script>'''),
  'conserto': [["itens.splice(Number(e.target.dataset.i) - 1, 1);", "itens.splice(Number(e.target.dataset.i), 1);"]],
  'provas': [
    { 'nome': 'apaga o 2º de A,B,C fica A,C', 'passos': [{ 'preencher': '#item', 'valor': 'A' }, { 'clicar': '#add' }, { 'preencher': '#item', 'valor': 'B' }, { 'clicar': '#add' }, { 'preencher': '#item', 'valor': 'C' }, { 'clicar': '#add' }, { 'clicar': '#lista li:nth-child(2) .del' }], 'conferir': [{ 'js': "var t=[...document.querySelectorAll('#lista li span')].map(s=>s.textContent).join(','); return t==='A,C' || ('ficou: '+t)" }] },
    { 'nome': 'apaga o 1º de A,B fica B', 'passos': [{ 'preencher': '#item', 'valor': 'A' }, { 'clicar': '#add' }, { 'preencher': '#item', 'valor': 'B' }, { 'clicar': '#add' }, { 'clicar': '#lista li:nth-child(1) .del' }], 'conferir': [{ 'js': "var t=[...document.querySelectorAll('#lista li span')].map(s=>s.textContent).join(','); return t==='B' || ('ficou: '+t)" }] }] })
EX.append({ 'id': 'dolar-virgula', 'nome': 'Conversor de dólar: vírgula',
  'pedido': 'no conversor de dólar, com dólar a 5,24 e US$ 100 tem que dar R$ 524,00 e tá dando R$ 500,00. corrige',
  'html': app('Dólar', '''<h1>Dólar → Real</h1>
<label>US$ <input id="usd" inputmode="decimal"></label><br>
<label>Cotação <input id="cot" inputmode="decimal"></label><br>
<button id="calc">Converter</button>
<p>Total: <b id="res">R$ 0,00</b></p>
<script>
function num(t){ return parseInt(String(t).replace(',', '.')) || 0; }
document.getElementById('calc').onclick = function(){
  var v = num(document.getElementById('usd').value) * num(document.getElementById('cot').value);
  document.getElementById('res').textContent = 'R$ ' + v.toFixed(2).replace('.', ',');
};
</script>'''),
  'conserto': [["return parseInt(String(t).replace(',', '.')) || 0;", "return parseFloat(String(t).replace(',', '.')) || 0;"]],
  'provas': [
    { 'nome': 'US$ 100 a 5,24 = 524,00', 'passos': [{ 'preencher': '#usd', 'valor': '100' }, { 'preencher': '#cot', 'valor': '5,24' }, { 'clicar': '#calc' }], 'conferir': [{ 'texto': '#res', 'contem': 'R$ 524,00' }] },
    { 'nome': 'US$ 12,5 a 5,1 = 63,75', 'passos': [{ 'preencher': '#usd', 'valor': '12,5' }, { 'preencher': '#cot', 'valor': '5,1' }, { 'clicar': '#calc' }], 'conferir': [{ 'texto': '#res', 'contem': 'R$ 63,75' }] }] })
EX.append({ 'id': 'estoque-negativo', 'nome': 'Contador de estoque: não ficar negativo',
  'pedido': 'no contador de estoque, o botão − deixa a quantidade ficar negativa. não pode passar de 0. o + tem que continuar funcionando',
  'html': app('Estoque', '''<h1>Estoque</h1>
<button id="menos">−</button> <b id="qtd">1</b> <button id="mais">+</button>
<script>
var q = 1;
function mostra(){ document.getElementById('qtd').textContent = q; }
document.getElementById('menos').onclick = function(){ q--; mostra(); };
document.getElementById('mais').onclick = function(){ q++; mostra(); };
</script>'''),
  'conserto': [["document.getElementById('menos').onclick = function(){ q--; mostra(); };", "document.getElementById('menos').onclick = function(){ if (q > 0) q--; mostra(); };"]],
  'provas': [
    { 'nome': '− 3x a partir de 1 fica 0', 'passos': [{ 'clicar': '#menos' }, { 'clicar': '#menos' }, { 'clicar': '#menos' }], 'conferir': [{ 'texto': '#qtd', 'igual': '0' }] },
    { 'nome': '+ continua: 1 vira 2', 'passos': [{ 'clicar': '#mais' }], 'conferir': [{ 'texto': '#qtd', 'igual': '2' }] }] })
EX.append({ 'id': 'desconto-porcento', 'nome': 'Desconto em %',
  'pedido': 'na tela de desconto, R$ 200 com 15% de desconto tem que dar R$ 170,00 e tá dando R$ 185,00. corrige',
  'html': app('Desconto', '''<h1>Desconto</h1>
<label>Valor <input id="valor" inputmode="decimal"></label><br>
<label>Desconto % <input id="pct" inputmode="decimal"></label><br>
<button id="calc">Calcular</button>
<p>Com desconto: <b id="res">R$ 0,00</b></p>
<script>
function num(t){ return parseFloat(String(t).replace(',', '.')) || 0; }
document.getElementById('calc').onclick = function(){
  var v = num(document.getElementById('valor').value), p = num(document.getElementById('pct').value);
  var r = v - p;
  document.getElementById('res').textContent = 'R$ ' + r.toFixed(2).replace('.', ',');
};
</script>'''),
  'conserto': [["var r = v - p;", "var r = v * (1 - p / 100);"]],
  'provas': [
    { 'nome': '200 com 15% = 170,00', 'passos': [{ 'preencher': '#valor', 'valor': '200' }, { 'preencher': '#pct', 'valor': '15' }, { 'clicar': '#calc' }], 'conferir': [{ 'texto': '#res', 'contem': 'R$ 170,00' }] },
    { 'nome': '80 com 10% = 72,00', 'passos': [{ 'preencher': '#valor', 'valor': '80' }, { 'preencher': '#pct', 'valor': '10' }, { 'clicar': '#calc' }], 'conferir': [{ 'texto': '#res', 'contem': 'R$ 72,00' }] }] })
EX.append({ 'id': 'calculadora-12x', 'nome': 'Calculadora do Zicão: tabela 12x (arquivo real, 116 mil letras)',
  'pedido': 'corrige a calculadora: na tabela de parcelas, R$ 1.000 em 12x mostra 12× 83,33 = 999,96. a 1ª parcela tem que ser 83,37 igual no resumo. não mexe no deslizar pra apagar nem na velocidade',
  'url': 'https://raw.githubusercontent.com/thiagogaldinozicao-source/Calculadora-do-zicao/b4c7bf6/index.html',
  'conserto': [["(c>1?money(x.par):'')", "(c>1?(x.first?'1ª '+money(x.first):money(x.par)):'')"]],
  'provas': [
    { 'nome': '1000 em 12x: 1ª de 83,37 na tabela', 'passos': [{ 'clicar': '#tools button[data-t="tools"]' }, { 'preencher': '#pV', 'valor': '1000' }, { 'escolher': '#pN', 'valor': '12' }, { 'esperar': 400 }], 'conferir': [{ 'js': "const tr=[...document.querySelectorAll('#pTab tr')].find(t=>t.dataset.n==='12'); return tr && /83,37/.test(tr.innerText) || ('linha 12x: '+(tr?tr.innerText:'?'))" }] }] })
json.dump(EX, open('exercicios.json', 'w'), ensure_ascii=False, indent=1)
print(len(EX), 'exercícios')
