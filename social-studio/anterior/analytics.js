/* Zicão Social Studio | Instagram Analytics — dados importados e mantidos só neste navegador */
(()=>{
'use strict';
const STORE='zicao_social_instagram_analytics_2026_v1';
const PERIOD0='2026-11-12', PERIOD1='2026-12-31';
let records=[],lastImport=null,source='CSV importado',loadError='';
try{const s=JSON.parse(localStorage.getItem(STORE)||'null');if(s&&Array.isArray(s.records)){records=s.records;lastImport=s.lastImport;source=s.source||source}}catch{}
const fmt=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
const pct=n=>(100*n).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases={
 date:['date','data','published at','publish date','published','posting date','data de publicacao','dia','fecha','created at','created time','publish time','timestamp'],
 type:['type','tipo','content type','media type','post type','format','formato','tipo de publicacao','publication type','media product type','media'],
 text:['caption','legenda','text','texto','description','descricao','title','titulo','post','media text','content','copy'],
 hour:['time','hora','horario','posting time','published time','publication hour','posted at'],
 views:['views','visualizacoes','visualizacoes totais','visualizaciones','total views','impressions','impressoes','plays','reproducoes'],
 reach:['reach','alcance','accounts reached','contas alcancadas','people reached'],
 likes:['likes','curtidas','me gusta'],
 comments:['comments','comentarios'],
 shares:['shares','compartilhamentos','compartidos','reposts'],
 saves:['saves','salvamentos','salvos','guardados'],
 replies:['replies','respostas','respuestas','story replies'],
 clicks:['link clicks','cliques no link','link taps','website clicks','cliques','taps link'],
 interactions:['interactions','interacoes','engagements','total interactions','interacciones'],
 visits:['profile visits','visitas ao perfil','visitas del perfil','profile activity'],
 id:['id','post id','media id','url','permalink','link','post url']
};
function scoreHeader(rows){if(!rows.length)return 0;let cols=rows[0].map(norm);return Object.values(aliases).filter(a=>a.some(x=>cols.includes(norm(x)))).length}
function parseCSV(input){
  const s=String(input||'').replace(/^\uFEFF/,'');let best=',',bestN=-1;
  for(const sep of [',',';','\t']){let quote=false,count=0;for(const c of s.slice(0,800)){if(c==='"')quote=!quote;else if((c==='\n'||c==='\r')&&!quote)break;else if(c===sep&&!quote)count++}if(count>bestN){bestN=count;best=sep}}
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(q&&s[i+1]==='"'){cell+='"';i++}else q=!q}
    else if(c===best&&!q){row.push(cell);cell=''}
    else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}
    else cell+=c}
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
function number(v){
  if(typeof v==='number')return Number.isFinite(v)?v:0;
  let s=String(v??'').trim().replace(/[\s\u00A0]/g,'').replace(/%/g,'');
  if(!s)return 0;
  // 1.234,56 / 1,234.56 / 1234,56
  if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  else if(s.includes(','))s=/,\d{3}$/.test(s)?s.replace(',',''):s.replace(',','.');
  else if(/^\d{1,3}(?:\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
  const n=Number(s);return Number.isFinite(n)?Math.max(0,n):0;
}
function asDate(v){
 const s=String(v||'').trim();if(!s)return '';
 let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);if(m)return [m[1],m[2].padStart(2,'0'),m[3].padStart(2,'0')].join('-');
 m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);if(m)return [m[3],m[2].padStart(2,'0'),m[1].padStart(2,'0')].join('-');
 return '';
}
function field(row,key){
 const n=aliases[key].map(norm),headers=row.headers;
 let idx=headers.findIndex(h=>n.includes(h));if(idx<0)idx=headers.findIndex(h=>n.some(a=>h.startsWith(a+' ')));
 return idx<0?'':row.cells[idx]??'';
}
function contentType(v,filename){
 const z=norm(v)+' '+norm(filename);
 if(/story|stories|historias|historie/.test(z))return 'Story';
 if(/reel|video curto/.test(z))return 'Reel';
 if(/carousel|carrossel|album/.test(z))return 'Carrossel';
 return 'Post';
}
function fromRows(rows,filename){
 if(!rows.length)return {items:[],problem:'Arquivo sem linhas'};
 // Alguns CSVs trazem linhas de apresentação antes dos títulos
 let headerIndex=0,max=0;for(let i=0;i<Math.min(8,rows.length);i++){const n=scoreHeader([rows[i]]);if(n>max){max=n;headerIndex=i}}
 if(max<2)return {items:[],problem:'Não reconheci as colunas. Use um CSV exportado da lista de Posts, Reels ou Stories do Metricool.'};
 const headers=rows[headerIndex].map(norm),items=[];let skipped=0;
 for(const cells of rows.slice(headerIndex+1)){
  const row={headers,cells};const date=asDate(field(row,'date'));
  if(!date||date<PERIOD0||date>PERIOD1){skipped++;continue}
  const obj={date,
    type:contentType(field(row,'type'),filename),
    text:String(field(row,'text')).replace(/\s+/g,' ').slice(0,150)||'Publicação sem título',
    views:number(field(row,'views')),reach:number(field(row,'reach')),
    likes:number(field(row,'likes')),comments:number(field(row,'comments')),
    shares:number(field(row,'shares')),saves:number(field(row,'saves')),replies:number(field(row,'replies')),
    clicks:number(field(row,'clicks')),visits:number(field(row,'visits')),
    inter:number(field(row,'interactions')),id:String(field(row,'id')).slice(0,180)};
  if(!obj.inter)obj.inter=obj.likes+obj.comments+obj.shares+obj.saves+obj.replies;
  const hourField=String(field(row,'hour')||field(row,'date'));
  const hour=hourField.match(/(?:^|[ T])([01]?\d|2[0-3]):([0-5]\d)/);
  obj.hour=hour?Number(hour[1]):-1;
  // Sem visualizações e alcance, manter métricas de interação, se houver.
  items.push(obj);
 }
 return {items,skipped,problem:items.length?'':'Não encontrei publicações no período de 12/11 a 31/12/2026 neste arquivo.'};
}
function store(){try{localStorage.setItem(STORE,JSON.stringify({records,lastImport,source}))}catch{loadError='Não foi possível salvar. Libere espaço no navegador ou importe menos registros.'}}
function bucket(arr,key){
 const map=new Map();for(const x of arr){const k=key(x);if(!map.has(k))map.set(k,[]);map.get(k).push(x)}return map;
}
function avg(a,fn){return a.length?a.reduce((n,x)=>n+fn(x),0)/a.length:0}
function goodName(x){return x.text||x.type+' em '+x.date}
function render(){
 const root=document.getElementById('ig-analytics-root');if(!root)return;
 const N=records.length;
 const totals=records.reduce((x,r)=>{x.views+=r.views;x.reach+=r.reach;x.inter+=r.inter;x.clicks+=r.clicks;return x},{views:0,reach:0,inter:0,clicks:0});
 const byType=bucket(records,x=>x.type),typeStats=[...byType].map(([type,arr])=>({type,count:arr.length,views:avg(arr,x=>x.views),reach:avg(arr,x=>x.reach),inter:avg(arr,x=>x.inter)})).sort((a,b)=>b.inter-a.inter);
 const top=records.slice().sort((a,b)=>(b.inter+b.replies*2+b.clicks*3)-(a.inter+a.replies*2+a.clicks*3)).slice(0,6);
 const h=bucket(records.filter(x=>x.hour>=0),x=>x.hour),best=[...h].filter(([,a])=>a.length>=2).map(([hour,arr])=>({hour,c:arr.length,reach:avg(arr,x=>x.reach),inter:avg(arr,x=>x.inter)})).sort((a,b)=>b.inter-a.inter).slice(0,3);
 const month=records.filter(x=>x.date.slice(0,7)==='2026-11');const rest=records.filter(x=>x.date.slice(0,7)==='2026-12');
 let logged={leads:0,directs:0,sales:0};try{
   const s=JSON.parse(localStorage.getItem('zicao_isis_social_2026_v1')||'null');
   Object.entries(s?.metrics||{}).forEach(([d,m])=>{if(d<PERIOD0||d>PERIOD1)return;for(const k of Object.keys(logged))logged[k]+=number(m[k])});
 }catch{}
 root.innerHTML=
 '<div class="igs-top"><div><div class="igs-kicker">Instagram • análises locais</div><h3>O que está funcionando nas postagens?</h3><p>Importe os CSVs de Posts, Reels e Stories do Metricool. Os números permanecem <b>somente neste navegador</b>, sem ir para o GitHub ou para o servidor.</p></div><a class="igs-link" href="https://app.metricool.com/" target="_blank" rel="noopener noreferrer">Abrir Metricool ↗</a></div>'+
 '<div class="igs-buttons"><label class="igs-upload" for="igs-file">⬆ Importar métricas CSV<input type="file" id="igs-file" accept=".csv,.tsv,text/csv,text/plain" multiple hidden></label>'+
 '<button id="igs-template" type="button">⬇ CSV exemplo</button><button id="igs-clear" type="button" class="igs-quiet">Limpar dados locais</button></div>'+
 (loadError?'<div class="igs-warning">'+escape(loadError)+'</div>':'')+
 '<div class="igs-meta">'+(lastImport?'Última importação: '+escape(lastImport)+' • ':'')+fmt(N)+' publicações no período · '+escape(source)+'</div>'+
 '<div class="igs-kpis">'+[
  [fmt(N),'Publicações analisadas'],[fmt(totals.views),'Visualizações somadas'],[fmt(avg(records,x=>x.reach)),'Alcance médio por publicação'],
  [fmt(totals.inter),'Interações somadas'],[fmt(totals.clicks),'Cliques informados']].map(([v,l])=>'<div class="igs-kpi"><strong>'+v+'</strong><span>'+l+'</span></div>').join('')+'</div>'+
 (N?'<div class="igs-two"><div class="igs-card"><h4>📊 Comparação por formato</h4><table class="igs-table"><thead><tr><th>Formato</th><th>Qtd.</th><th>Alcance médio</th><th>Interações médias</th></tr></thead><tbody>'+
 typeStats.map(x=>'<tr><td>'+escape(x.type)+'</td><td>'+x.count+'</td><td>'+fmt(x.reach)+'</td><td>'+fmt(x.inter)+'</td></tr>').join('')+
 '</tbody></table><p class="igs-fine">Comparar médias ajuda a evitar favorecer o formato que teve apenas mais publicações.</p></div>'+
 '<div class="igs-card"><h4>⏰ Horários com melhores resultados na amostra</h4>'+
 (best.length?best.map(x=>'<div class="igs-line"><strong>'+String(x.hour).padStart(2,'0')+'h</strong><span>'+fmt(x.inter)+' interações médias · '+x.c+' publicações</span></div>').join(''):'<p>Importe CSV com horário de publicação e pelo menos 2 registros por faixa horária. Sem amostra, não há horário campeão.</p>')+
 '<p class="igs-fine">Correlação, não garantia. Acompanhe também a atividade dos seguidores e teste dias comparáveis.</p></div></div>'+
 '<div class="igs-card"><h4>🏆 Conteúdos que geraram mais ações</h4><div class="igs-best">'+top.map(x=>
 '<div class="igs-bestrow"><strong>'+escape(goodName(x))+'</strong><span>'+escape(x.type)+' · '+escape(x.date)+' · '+fmt(x.reach)+' alcance · '+fmt(x.inter)+' interações'+(x.clicks?' · '+fmt(x.clicks)+' cliques':'')+'</span></div>').join('')+'</div></div>'+
 '<div class="igs-card"><h4>🧠 Leitura comercial</h4><div class="igs-insights">'+[
 'Maior média de interações na amostra: '+(typeStats[0]?.type||'—')+'. Teste mais conteúdos semelhantes, sem abandonar os outros formatos.',
 'Novembro: '+month.length+' publicações analisadas; dezembro: '+rest.length+'. Os meses não são comparáveis enquanto não tiverem durações equivalentes.',
 'Atendimentos anotados no painel: '+fmt(logged.directs)+' directs, '+fmt(logged.leads)+' interessados e '+fmt(logged.sales)+' vendas. Esses números são informados manualmente; não comprovam que uma publicação específica causou uma venda.',
 'Teste 3–4 modelos por dia: seminovo de giro, lacrado, Android e acessório. Meça respostas e atendimentos por produto, não apenas visualizações.'
 ].map(x=>'<p>• '+escape(x)+'</p>').join('')+'</div></div>':
 '<div class="igs-empty"><strong>Pronto para conectar os resultados.</strong><p>Este painel ainda não está conectado diretamente ao Instagram. Para começar sem senha ou API paga: no Metricool, abra <b>Analíticas → Instagram → Posts, Reels ou Stories → Baixar CSV</b> e importe o arquivo aqui. Só aparecerão métricas realmente fornecidas no CSV.</p><p>Para métricas de Stories e horários personalizados, conecte o Instagram profissional ao Metricool pela Página do Facebook vinculada.</p></div>')+
 '<div class="igs-safety">🔐 Não coloque senha, cookies ou token do Instagram aqui. A conexão do Metricool com o ChatGPT é separada deste site. Para sincronização automática no futuro, será preciso uma integração de servidor segura e acesso de API compatível. Não são enviados dados privados pelo botão Importar.</div>';
 root.querySelector('#igs-file').onchange=async e=>{
  const files=[...e.target.files];let merged=records.slice(),accepted=0,errors=[];
  for(const file of files){if(file.size>8e6){errors.push(file.name+': maior que 8 MB');continue}
   const parsed=fromRows(parseCSV(await file.text()),file.name);
   if(parsed.problem){errors.push(file.name+': '+parsed.problem);continue}
   merged.push(...parsed.items);accepted+=parsed.items.length;
  }
  // Deduplicação usa ID, senão dados da linha, sem misturar publicações diferentes de mesmo horário.
  const seen=new Map();
  for(const x of merged.slice(-5000)){const k=x.id?'id:'+x.id:'fallback:'+JSON.stringify([x.date,x.type,x.text,x.hour,x.views,x.reach,x.inter]);seen.set(k,x)}
  if(accepted){records=[...seen.values()].slice(-3000);lastImport=new Date().toLocaleString('pt-BR');source='CSV importado (manual)';store()}
  loadError=errors.join(' | ');render();
 };
 root.querySelector('#igs-template').onclick=()=>{
  const txt='Data;Tipo;Legenda;Visualizações;Alcance;Curtidas;Comentários;Compartilhamentos;Salvos;Respostas;Cliques;Hora\n2026-11-16;Reel;Exemplo demonstrativo - apague esta linha;1200;850;50;8;12;3;0;2;12:30\n';
  const a=document.createElement('a'),u=URL.createObjectURL(new Blob(['\uFEFF'+txt],{type:'text/csv;charset=utf-8'}));a.href=u;a.download='modelo-metricas-instagram-exemplo.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);
 };
 root.querySelector('#igs-clear').onclick=()=>{if(!confirm('Apagar somente as métricas do Instagram importadas neste navegador? O calendário e os checklists serão preservados.'))return;records=[];lastImport=null;source='Sem importação';loadError='';localStorage.removeItem(STORE);render()};
}
function install(){
 const holder=document.querySelector('#view-resultados #periodSummary');if(!holder)return;
 const shell=document.createElement('section');shell.id='ig-analytics-root';shell.className='igs-shell';holder.insertAdjacentElement('afterend',shell);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();