/* Shared record and migration model. No network or browser persistence. */
(function(root){'use strict';
const sections=['done','checks','overrides','notes','metrics','publication'];
const emptyState=()=>({done:{},checks:{},overrides:{},notes:{},metrics:{}});
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const day=s=>/^2026-(11-(1[2-9]|2\d|30)|12-(0[1-9]|[12]\d|3[01]))$/.test(s);
function identifier(section,key){if(section!=='publication')return section+'~'+key;const text=JSON.stringify([section,key]);let a=2166136261,b=0x9e3779b9,c=0x85ebca6b,d=0xc2b2ae35;for(let i=0;i<text.length;i++){const v=text.charCodeAt(i);a=Math.imul(a^v,16777619);b=Math.imul(b^v,2246822519);c=Math.imul(c^v,3266489917);d=Math.imul(d^v,668265263)}return section+'_'+[a,b,c,d].map(v=>(v>>>0).toString(16).padStart(8,'0')).join('')}
function validate(section,key,value){
 if(!sections.includes(section)||typeof key!=='string'||!key||key.length>4000)throw Error('Registro incompatível');
 if(section==='done'){if(!day(key.slice(0,10))||!/^[a-z0-9-]+$/.test(key)||!(value===false||Number.isSafeInteger(value)&&value>=1&&value<=8640000000000000))throw Error('Marcação inválida')}
 if(section==='checks'){if(!/^2026-\d\d-\d\d-prep-[0-3]$/.test(key)||!day(key.slice(0,10))||typeof value!=='boolean')throw Error('Preparação inválida')}
 if(section==='overrides'){if(!day(key.slice(0,10))||!/^2026-\d\d-\d\d:p[0-3]$/.test(key)||typeof value!=='string'||value.length>80)throw Error('Aparelho inválido')}
 if(section==='notes'){if(!day(key)||typeof value!=='string'||value.length>4000)throw Error('Anotação inválida ou maior que 4.000 caracteres')}
 if(section==='metrics'){const [date,field]=key.split('|');if(!day(date)||!['directs','leads','sales'].includes(field)||key!==date+'|'+field||typeof value!=='string'||!/^\d{0,9}$/.test(value))throw Error('Indicador deve ser inteiro, positivo ou zero')}
 if(section==='publication'&&value!==null){root.StudioCore.validateAnalytics({schema:2,records:[value]});if(value.text.length>1000||value.id.length>500)throw Error('Identificador ou legenda muito longo')}
 return {id:identifier(section,key),section,key,value};
}
function flatten(state){root.StudioCore.validateState(state);const out=new Map();for(const section of ['done','checks','overrides','notes'])for(const [key,raw]of Object.entries(state[section])){if(raw===undefined)continue;const value=section==='done'?(raw===true?1:raw):raw;const r=validate(section,key,value);out.set(r.id,r)}for(const [date,fields]of Object.entries(state.metrics)){if(!fields||typeof fields!=='object'||Array.isArray(fields))throw Error('Indicadores inválidos');for(const [field,value]of Object.entries(fields)){if(value===undefined||value===null)continue;const r=validate('metrics',date+'|'+field,String(value));out.set(r.id,r)}}return out}
function publicationKey(r){return r.id?'id:'+r.id:'fallback:'+JSON.stringify([r.date,r.hour,r.minute,r.type,r.text])}
function publications(records){const out=new Map();for(const r of records){const item=validate('publication',publicationKey(r),r);out.set(item.id,item)}return out}
function materialize(records){const state=emptyState(),analytics={schema:2,timezone:'America/Sao_Paulo',lastImport:null,records:[]};for(const r of records){validate(r.section,r.key,r.value);if(r.section==='publication'){if(r.value!==null)analytics.records.push(r.value);if(r.updatedAt&&(!analytics.lastImport||r.updatedAt>analytics.lastImport))analytics.lastImport=r.updatedAt}else if(r.section==='metrics'){const [date,field]=r.key.split('|');(state.metrics[date]??={})[field]=r.value}else state[r.section][r.key]=r.value}return {state,analytics}}
function emptyValue(section){return section==='done'||section==='checks'?false:section==='publication'?null:''}
function changes(before,after){const edits=[];for(const id of new Set([...before.keys(),...after.keys()])){const a=before.get(id),b=after.get(id);if(a&&b&&(a.key!==b.key||a.section!==b.section))throw Error('Identidade de registro em conflito');if(!a||!b||!equal(a.value,b.value)){const r=b||{...a,value:emptyValue(a.section)};edits.push(validate(r.section,r.key,r.value))}}return edits}
function readBackup(b){let records;
 if(b?.app==='zicao-social-isis'&&b.version===1){records=flatten(b.state)}
 else if(b?.app==='zicao-social-studio'&&(b.version===2||b.version===3)){root.StudioCore.validateState(b.state);root.StudioCore.validateAnalytics(b.analytics);records=flatten(b.state);for(const [id,r]of publications(b.analytics.records))records.set(id,r)}
 else throw Error('Backup não reconhecido. Use o JSON de progresso v1 ou backup completo v2/v3 do Social Studio.');
 if(records.size>5000)throw Error('Backup excede 5.000 registros');return [...records.values()];
}
function planImport(existing,incoming){const plan={add:[],same:[],conflicts:[]};for(const r of incoming){validate(r.section,r.key,r.value);const current=existing.get(r.id);if(!current)plan.add.push({...r,expectedRev:0});else if(current.section!==r.section||current.key!==r.key)throw Error('Identidade conflitante');else if(equal(current.value,r.value))plan.same.push(r);else plan.conflicts.push({incoming:r,current})}return plan}
function backup(records,projectId){const current=[...records];const {state,analytics}=materialize(current);return {app:'zicao-social-studio',version:3,exportedAt:new Date().toISOString(),timezone:'America/Sao_Paulo',state,analytics,cloud:{projectId,studioId:'zicao-social-studio',records:current}}}
function assertRevision(current,expected,incoming){if(current&&(!equal(current.key,incoming.key)||current.section!==incoming.section))throw Error('Identidade conflitante');if((current?.rev||0)!==expected){const e=Error('Outra pessoa alterou este campo. Compare antes de substituir.');e.code='conflict';throw e}}
root.StudioShared={sections,emptyState,equal,identifier,validate,flatten,publications,publicationKey,materialize,changes,emptyValue,readBackup,planImport,backup,assertRevision};
})(globalThis);
