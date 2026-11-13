/* Local-only CSV and backup rules. No network or credentials. */
(function(root){
'use strict';
const metrics=['views','impressions','reach','likes','comments','shares','saves','replies','clicks','interactions'];
const aliases={date:['data','date','timestamp','date with time','published at','data de publicacao','fecha'],type:['tipo','type','media type','post type','formato'],text:['legenda','caption','content','texto','text','description','titulo','title'],id:['id','post id','media id','reel id','post url','url','permalink','link'],hour:['hora','time','hour','horario'],views:['views','visualizacoes','plays','reproducoes'],impressions:['impressions','impressoes'],reach:['reach','alcance','accounts reached'],likes:['likes','curtidas'],comments:['comments','comentarios'],shares:['shares','compartilhamentos'],saves:['saves','saved','salvos','salvamentos'],replies:['replies','respostas'],clicks:['link clicks','cliques no link','cliques','link taps'],interactions:['interactions','interacoes','engagements']};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function numeric(value){
 let s=String(value??'').trim().replace(/[\s\u00a0]/g,'');
 if(!s||/^(?:-|—|n\/?a|null|undefined)$/i.test(s))return null;
 if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
 else if(s.includes(','))s=/^\d{1,3}(,\d{3})+$/.test(s)?s.replace(/,/g,''):s.replace(',','.');
 else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 if(!/^\d+(?:\.\d+)?$/.test(s)||!Number.isFinite(Number(s)))throw Error('Número inválido: '+String(value).slice(0,40));
 return Number(s);
}
function csv(text){
 const s=String(text).replace(/^\uFEFF/,'');
 function read(sep){let rows=[],row=[],cell='',quoted=false,closed=false;
  for(let i=0;i<s.length;i++){const c=s[i];if(quoted){if(c==='"'){if(s[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=c;continue}
   if(c==='"'){if(cell||closed)throw Error('Aspas fora de posição');quoted=true}
   else if(c===sep){row.push(cell);cell='';closed=false}
   else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';closed=false}
   else {if(closed&&!/\s/.test(c))throw Error('Texto após aspas');if(!closed)cell+=c}
  }
  if(quoted)throw Error('Aspas não fechadas');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
 }
 let best=null;
 for(const sep of [',',';','\t']){try{const rows=read(sep);for(let h=0;h<Math.min(8,rows.length);h++){const score=rows[h].map(norm).filter(v=>Object.values(aliases).some(a=>a.includes(v))).length;if(!best||score>best.score)best={rows,h,sep,score}}}catch{}}
 if(!best||best.score<2)throw Error('Não reconheci o CSV ou as aspas estão malformadas. Use colunas Data e ao menos uma métrica.');
 return best;
}
function dateTime(value,hour){
 const s=String(value||'').trim();let m=s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(.*)$/);let y,mo,d,tail;
 if(m){[,y,mo,d,tail]=m}else{m=s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(.*)$/);if(!m)throw Error('Data inválida: '+s);[,d,mo,y,tail]=m}
 const day=y+'-'+mo+'-'+d,dt=new Date(day+'T12:00:00Z');if(!Number.isFinite(+dt)||dt.toISOString().slice(0,10)!==day)throw Error('Data inexistente: '+day);
 let stamp=day+'T'+String(tail).trim().replace(/^T/,'');
 if(tail&&/(Z|[+-]\d\d:?\d\d)$/.test(tail)){
  const instant=new Date(stamp);if(!Number.isFinite(+instant))throw Error('Horário inválido');
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:p.year+'-'+p.month+'-'+p.day,hour:Number(p.hour),minute:Number(p.minute)};
 }
 const t=String(hour||tail).trim().replace(/^T/,'');if(!t)return {date:day,hour:null,minute:null};
 m=t.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);if(!m||+m[1]>23||+m[2]>59)throw Error('Horário inválido: '+t);return {date:day,hour:+m[1],minute:+m[2]};
}
function parse(text,filename,defaultType){
 const {rows,h,sep}=csv(text),headers=rows[h].map(norm),mapping={};
 for(const [key,names]of Object.entries(aliases)){const found=headers.map((v,i)=>names.includes(v)?i:-1).filter(i=>i>=0);if(found.length>1)throw Error('Colunas ambíguas para '+key);mapping[key]=found[0]??-1}
 if(mapping.date<0||!metrics.some(k=>mapping[k]>=0))throw Error('CSV precisa de Data e ao menos uma métrica reconhecida.');
 const items=[];let outside=0;
 for(let i=h+1;i<rows.length;i++){const cells=rows[i];if(cells.length!==headers.length)throw Error('Linha '+(i+1)+': quantidade de colunas diferente do cabeçalho.');const get=k=>mapping[k]<0?'':cells[mapping[k]];
  try{const time=dateTime(get('date'),get('hour'));if(time.date<'2026-11-12'||time.date>'2026-12-31'){outside++;continue}
   let type=norm(get('type'));type=/stor|historia/.test(type)?'Story':/reel/.test(type)?'Reel':/carross|carousel|album/.test(type)?'Carrossel':type?'Post':defaultType;
   if(!type)throw Error('Escolha o formato do arquivo antes de importar.');
   const r={...time,type,id:get('id').trim(),text:get('text').trim().slice(0,1000),source:filename};for(const k of metrics)r[k]=numeric(get(k));items.push(r);
  }catch(e){throw Error('Linha '+(i+1)+': '+e.message)}
 }
 if(!items.length)throw Error('Nenhuma publicação entre 12/11 e 31/12/2026.');
 return {items,outside,columns:Object.entries(mapping).filter(([,i])=>i>=0).map(([k,i])=>({field:k,column:rows[h][i]})),missing:metrics.filter(k=>mapping[k]<0),separator:sep==='\t'?'tabulação':sep};
}
function merge(existing,incoming){const map=new Map();let added=0,updated=0;
 const key=r=>r.id?'id:'+r.id:'fallback:'+JSON.stringify([r.date,r.hour,r.minute,r.type,r.text]);
 for(const r of existing)map.set(key(r),r);
 for(const r of incoming){const k=key(r);if(map.has(k))updated++;else added++;map.set(k,r)}
 if(map.size>3000)throw Error('Limite de 3.000 publicações. Nenhum dado foi descartado.');return {records:[...map.values()],added,updated};
}
function summary(records,key){const values=records.map(r=>r[key]).filter(v=>typeof v==='number'&&Number.isFinite(v));return {count:values.length,total:values.length?values.reduce((a,b)=>a+b,0):null,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null}}
function validateState(s){if(!s||typeof s!=='object'||Array.isArray(s))throw Error('Progresso inválido');for(const k of ['done','checks','overrides','notes','metrics']){if(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k]))throw Error('Campo de progresso inválido: '+k)}return s}
function validateAnalytics(a){if(!a||a.schema!==2||!Array.isArray(a.records)||a.records.length>3000)throw Error('Métricas incompatíveis');for(const r of a.records){const t=dateTime(r.date,'');if(t.date<'2026-11-12'||t.date>'2026-12-31'||!['Story','Reel','Post','Carrossel'].includes(r.type)||typeof r.id!=='string'||typeof r.text!=='string'||!(r.hour===null||Number.isInteger(r.hour)&&r.hour>=0&&r.hour<=23)||!(r.minute===null||Number.isInteger(r.minute)&&r.minute>=0&&r.minute<=59))throw Error('Publicação inválida');for(const k of metrics)if(!(r[k]===null||typeof r[k]==='number'&&Number.isFinite(r[k])&&r[k]>=0))throw Error('Métrica inválida: '+k)}return a}
function validateBackup(b){if(!b||b.app!=='zicao-social-studio'||b.version!==2||b.timezone!=='America/Sao_Paulo')throw Error('Este arquivo não é um backup completo v2 do Social Studio');validateState(b.state);validateAnalytics(b.analytics);return b}
root.StudioCore={metrics,parse,numeric,dateTime,merge,summary,validateState,validateAnalytics,validateBackup};
})(globalThis);
