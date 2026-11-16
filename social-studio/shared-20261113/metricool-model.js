/* Validates imported Metricool snapshots. Never turns missing metrics into zero. */
(function(root){'use strict';
const dailyFields=['followers','feedPosts','views','reach','stories','storyReach','averageStoryReach','reels','reelInteractions','reelReach','totalContent','totalContentInteractions','followersGained','followersLost'];
const publicationFields=['views','impressions','reach','likes','comments','shares','saves','replies','clicks','interactions','engagementPercent','averageWatchSeconds','retentionPercent','viewRatePercent','skipRatePercent'];
function date(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw Error('Data inválida nas métricas');return value}
function number(value,max=1e12){if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max))throw Error('Métrica inválida');return value}
function validate(s){
 if(!s||s.schema!==1||s.provider!=='metricool'||s.brandId!=='8084197'||s.account!=='zicao.store'||s.timezone!=='America/Sao_Paulo')throw Error('A origem das métricas não corresponde à Zicão Store');
 if(!Number.isFinite(Date.parse(s.collectedAt))||!s.periods||!Array.isArray(s.daily)||s.daily.length>366||!Array.isArray(s.publications)||s.publications.length>3000||!Array.isArray(s.bestTimes)||s.bestTimes.length>168)throw Error('Pacote de métricas incompatível');
 for(const p of Object.values(s.periods)){date(p.from);date(p.to);if(p.from>p.to)throw Error('Período inválido')}
 const dates=new Set(),ids=new Set(),hours=new Set();
 for(const row of s.daily){date(row.date);if(row.date<s.periods.daily.from||row.date>s.periods.daily.to||dates.has(row.date)||typeof row.partial!=='boolean')throw Error('Dia duplicado ou fora do período');dates.add(row.date);dailyFields.forEach(k=>number(row[k]))}
 for(const row of s.publications){date(row.date);if(row.date<s.periods.publications.from||row.date>s.periods.publications.to||!['Post','Carrossel','Reel','Story'].includes(row.type)||typeof row.id!=='string'||!row.id||ids.has(row.type+'|'+row.id)||typeof row.text!=='string'||row.text.length>1000||typeof row.url!=='string'||!/^https:\/\/www\.instagram\.com\//.test(row.url)||!Number.isInteger(row.hour)||row.hour<0||row.hour>23||!Number.isInteger(row.minute)||row.minute<0||row.minute>59)throw Error('Publicação inválida ou repetida');ids.add(row.type+'|'+row.id);publicationFields.forEach(k=>number(row[k],/Percent$/.test(k)?100:1e12))}
 for(const row of s.bestTimes){const key=row.isoWeekday+'|'+row.hour;if(!Number.isInteger(row.isoWeekday)||row.isoWeekday<1||row.isoWeekday>7||!Number.isInteger(row.hour)||row.hour<0||row.hour>23||hours.has(key))throw Error('Horário inválido ou repetido');hours.add(key);number(row.score);if(row.score===null)throw Error('Pontuação ausente')}
 return s;
}
function summary(rows,key){const values=rows.map(r=>r[key]).filter(v=>typeof v==='number'&&Number.isFinite(v));return {count:values.length,total:values.length?values.reduce((a,b)=>a+b,0):null,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null}}
function latest(rows,key){return [...rows].filter(r=>r[key]!==null).sort((a,b)=>b.date.localeCompare(a.date))[0]||null}
function bestByDay(rows){return Array.from({length:7},(_,i)=>({isoWeekday:i+1,slots:rows.filter(r=>r.isoWeekday===i+1).sort((a,b)=>b.score-a.score||a.hour-b.hour).slice(0,3)}))}
root.StudioMetricool={validate,summary,latest,bestByDay,dailyFields,publicationFields};
})(globalThis);
