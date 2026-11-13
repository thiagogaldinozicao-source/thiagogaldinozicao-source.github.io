/* Firebase adapter: per-field transactions, revision checks, persisted per-user drafts. */
(()=>{'use strict';
const S=StudioShared,STUDIO='zicao-social-studio',subscribers=new Set();
let sdk,db,auth,user=null,role=null,authorized=false,seenServer=false,serverFresh=false,records=new Map(),pending=new Map(),uiState=new Map(),stop=null,timer,busy=false,lastError='',migrationBusy=false;
const gate=document.getElementById('cloud-gate'),status=document.getElementById('cloud-status'),login=document.getElementById('cloud-login'),message=document.getElementById('cloud-login-message');
document.body.dataset.cloudLocked='true';
const draftKey=()=>user?'zicao_social_shared_drafts_v1:'+user.uid:null;
function persist(){if(!draftKey())return;try{localStorage.setItem(draftKey(),JSON.stringify([...pending]))}catch{lastError='Não foi possível guardar o rascunho neste aparelho. Exporte um backup antes de sair.'}}
function currentRecords(){const all=new Map(records);for(const [id,p]of pending)all.set(id,{...(all.get(id)||{}),...p.entry,pending:true});return all}
function safeRender(){const active=document.activeElement,id=active?.id,start=active?.selectionStart,end=active?.selectionEnd;renderDay();if(currentView==='resultados')renderResults();const input=id&&document.getElementById(id);if(input&&active===input){try{input.setSelectionRange(start,end)}catch{}}}
function apply(){const all=currentRecords();const model=S.materialize(all.values());state=model.state;uiState=S.flatten(state);safeRender();for(const fn of subscribers)fn(model.analytics);drawStatus()}
function drawStatus(){status.replaceChildren();const text=document.createElement('span');text.textContent=!authorized?'Acesso da equipe':pending.size?pending.size+' alteração(ões) pendente(s) · '+(serverFresh?'aguardando envio':'aguardando conexão'):serverFresh?'Sincronizado com a equipe':'Aguardando confirmação do servidor';status.append(text);
if(user){const label=document.createElement('small');label.textContent=(user.displayName||user.email)+' · '+(role==='owner'?'administrador':'equipe');status.append(label);const retry=document.createElement('button');retry.className='btn small';retry.textContent='Tentar sincronizar';retry.onclick=()=>{for(const p of pending.values())if(!p.conflict)p.failed=false;flush()};status.append(retry);const out=document.createElement('button');out.className='btn small';out.textContent='Sair';out.onclick=async()=>{if(pending.size&&!confirm('Há rascunhos pendentes neste aparelho. Exporte um backup antes de sair. Sair mesmo assim?'))return;await sdk.signOut(auth)};status.append(out)}
if(lastError){const error=document.createElement('p');error.textContent=lastError;status.append(error)}
const area=document.getElementById('cloud-conflicts');area.replaceChildren();for(const [id,p]of [...pending].filter(([,p])=>p.conflict).slice(0,10)){const card=document.createElement('div');card.className='cloud-conflict';const title=document.createElement('strong');title.textContent='Outra pessoa alterou '+p.entry.section+' · '+p.entry.key;const info=document.createElement('p');info.textContent='Seu rascunho: '+short(p.entry.value)+' | Compartilhado: '+short(records.get(id)?.value);card.append(title,info);const keep=document.createElement('button');keep.className='btn';keep.textContent='Usar o compartilhado';keep.onclick=()=>{pending.delete(id);persist();apply()};const mine=document.createElement('button');mine.className='btn';mine.textContent='Salvar meu rascunho sobre este campo';mine.onclick=()=>{p.expectedRev=records.get(id)?.rev||0;p.conflict=false;p.failed=false;persist();drawStatus();flush()};card.append(keep,mine);area.append(card)}}
function short(v){const text=typeof v==='string'?v:JSON.stringify(v);return String(text??'não informado').slice(0,240)}
function canEdit(){if(!authorized||!seenServer)throw Error('Entre com uma conta autorizada e aguarde a primeira sincronização.');}
async function commit(entry,expectedRev,origin){canEdit();if(!navigator.onLine)throw Error('Sem conexão. O rascunho continua neste aparelho.');const reference=sdk.doc(db,'studios',STUDIO,'entries',entry.id);let committed;
try{await sdk.runTransaction(db,async tx=>{const snap=await tx.get(reference),current=snap.exists()?snap.data():null;S.assertRevision(current,expectedRev,entry);const value={section:entry.section,key:entry.key,value:entry.value,rev:expectedRev+1,actorUid:user.uid,actorEmail:user.email,updatedAt:sdk.serverTimestamp(),origin:String(origin||'painel').slice(0,120)};tx.set(reference,value);tx.set(sdk.doc(reference,'changes',String(value.rev)),value);committed={...entry,...value,updatedAt:new Date().toISOString()}});}catch(error){if(error.code!=='conflict'){try{const latest=await sdk.getDocFromServer(reference);S.assertRevision(latest.exists()?latest.data():null,expectedRev,entry)}catch(check){if(check.code==='conflict')throw check}}throw error}return committed;
}
async function flush(){if(busy||!authorized||!seenServer||!navigator.onLine)return;busy=true;
try{for(const [id,op]of [...pending]){if(op.conflict||op.failed)continue;try{const result=await commit(op.entry,op.expectedRev,'painel');records.set(id,result);const latest=pending.get(id);if(latest===op)pending.delete(id);else if(latest&&latest.expectedRev===op.expectedRev)latest.expectedRev=result.rev;lastError=''}catch(e){const latest=pending.get(id);if(latest){latest.conflict=e.code==='conflict';latest.failed=!latest.conflict;}lastError=e.code==='conflict'?'Há um campo para comparar antes de salvar.':'Não foi possível enviar uma alteração. O rascunho não está compartilhado; tente novamente ou exporte um backup.';if(e.code!=='conflict')break}persist();apply()}}finally{busy=false;drawStatus();if([...pending.values()].some(p=>!p.failed&&!p.conflict))timer=setTimeout(flush,600)}}
// Automatic migration is restricted to this authenticated member's browser snapshot.
async function migrateLegacy(archive,sourceHash){
 canEdit();if(migrationBusy)throw Error('A transferência já está em andamento.');if(pending.size)throw Error('Aguarde o envio dos rascunhos antes de transferir as marcações antigas.');
 if(!/^[a-f0-9]{64}$/.test(sourceHash))throw Error('Identificação de cópia inválida');
 const account=user.uid,actorEmail=user.email;const check=()=>{if(!authorized||user?.uid!==account)throw Error('A conta mudou. Entre novamente para concluir a transferência.')};
 const receiptRef=sdk.doc(db,'studios',STUDIO,'migrationReceipts',account+'_'+sourceHash);
 migrationBusy=true;
 try{
  const receipt=await sdk.getDocFromServer(receiptRef);check();if(receipt.exists())return {...receipt.data(),alreadyDone:true};
  const payload=JSON.stringify(archive.raw);if(payload.length>8000000)throw Error('Cópia antiga muito grande para transferência automática. Os dados originais permanecem preservados.');
  const chunks=[];for(let offset=0;offset<payload.length;){let end=Math.min(offset+120000,payload.length);const last=payload.charCodeAt(end-1);if(end<payload.length&&last>=0xD800&&last<=0xDBFF)end--;chunks.push(payload.slice(offset,end));offset=end}
  for(let part=0;part<chunks.length;part++){check();const ref=sdk.doc(db,'studios',STUDIO,'migrationArchives',account+'_'+sourceHash+'_'+part);const existing=await sdk.getDocFromServer(ref);check();if(existing.exists()){if(existing.data().payload!==chunks[part])throw Error('A cópia de segurança não corresponde à origem.');continue}try{await sdk.setDoc(ref,{actorUid:account,actorEmail,sourceHash,part,total:chunks.length,payload:chunks[part],createdAt:sdk.serverTimestamp()})}catch(error){const retry=await sdk.getDocFromServer(ref);if(!retry.exists()||retry.data().payload!==chunks[part])throw error}check()}
  // The complete raw snapshot is safely stored before interpreting or merging any field.
  const raw=archive.raw.zicao_isis_social_2026_v1;
  const incoming=raw===null?[]:S.readBackup({app:'zicao-social-isis',version:1,state:{done:{},checks:{},overrides:{},notes:{},metrics:{},...JSON.parse(raw)}});
  let added=0,same=0,conflicts=0,empty=0;
  const preserve=entry=>{conflicts++;if(!pending.has(entry.id))pending.set(entry.id,{entry,expectedRev:records.get(entry.id)?.rev||0,conflict:true,failed:false,origin:'migracao-antiga'});persist();apply()};
  for(const entry of incoming){check();if(entry.value===''||entry.value===false){empty++;continue}
   if(pending.has(entry.id)){preserve(entry);continue}
   const current=records.get(entry.id);
   if(current){if(S.equal(current.value,entry.value)||(entry.section==='done'&&current.value&&entry.value)){same++;continue}preserve(entry);continue}
   try{const result=await commit(entry,0,'migracao-antiga:'+sourceHash.slice(0,20));check();records.set(entry.id,result);added++;apply()}
   catch(error){check();if(error.code==='conflict'){const fresh=await sdk.getDocFromServer(sdk.doc(db,'studios',STUDIO,'entries',entry.id));check();if(fresh.exists())records.set(entry.id,{...entry,...fresh.data()});preserve(entry)}else throw error}
  }
  check();const result={actorUid:account,actorEmail,sourceHash,added,same,conflicts,empty,createdAt:sdk.serverTimestamp()};
  // Creating a receipt only after all fields prevents stale legacy data from reappearing
  // after someone later unchecks a successfully migrated block.
  try{await sdk.setDoc(receiptRef,result)}catch(error){const retry=await sdk.getDocFromServer(receiptRef);if(!retry.exists())throw error;check();apply();return {...retry.data(),alreadyDone:true}}check();apply();return result;
 }finally{migrationBusy=false}
}

save=function(){try{canEdit();const after=S.flatten(state);for(const entry of S.changes(uiState,after)){const previous=pending.get(entry.id);pending.set(entry.id,{entry,expectedRev:previous?.expectedRev??records.get(entry.id)?.rev??0,conflict:previous?.conflict||false,failed:false})}uiState=after;persist();lastError='';drawStatus();clearTimeout(timer);timer=setTimeout(flush,650)}catch(e){lastError=e.message;drawStatus();apply()}};
window.addEventListener('beforeunload',e=>{if(pending.size){e.preventDefault();e.returnValue='Há rascunhos ainda não sincronizados.'}});
window.addEventListener('online',()=>{for(const p of pending.values())if(!p.conflict)p.failed=false;flush()});window.addEventListener('offline',()=>{serverFresh=false;drawStatus()});
window.StudioCloud={
 subscribe(fn){subscribers.add(fn);fn(S.materialize(currentRecords().values()).analytics);return()=>subscribers.delete(fn)},
 migrateLegacy,
 get authReady(){return !!auth},
 async loginWithPassword(name,password){if(!auth)throw Error('Aguarde a conexão e tente novamente.');await sdk.setPersistence(auth,sdk.browserLocalPersistence);return sdk.signInWithEmailAndPassword(auth,StudioAccess.emailFor(name),password)},
 async checkActivation(code){if(!auth)throw Error('Aguarde a conexão.');const email=await sdk.verifyPasswordResetCode(auth,code);return {email,name:StudioAccess.nameFor(email)}},
 async activate(code,password){if(!auth)throw Error('Aguarde a conexão.');if(typeof password!=='string'||password.length<10)throw Error('Escolha uma senha com pelo menos 10 caracteres.');const email=await sdk.verifyPasswordResetCode(auth,code);StudioAccess.nameFor(email);await sdk.confirmPasswordReset(auth,code,password);await sdk.setPersistence(auth,sdk.browserLocalPersistence);return sdk.signInWithEmailAndPassword(auth,email,password)},
 get role(){return role},get ready(){return authorized&&seenServer},get pendingCount(){return pending.size},
 get records(){return new Map(records)},get projectId(){return window.ZICAO_FIREBASE_CONFIG?.projectId||null},
 snapshot(){canEdit();const b=S.backup(currentRecords().values(),this.projectId);b.cloud.unsentDrafts=pending.size;return b},
 plan(incoming){canEdit();if(role!=='owner')throw Error('Somente Thiago pode importar backups e métricas.');if(pending.size)throw Error('Sincronize ou resolva os rascunhos antes de importar.');return S.planImport(records,incoming)},
 async importEntries(entries,origin,progress){canEdit();if(role!=='owner')throw Error('Importação restrita ao administrador');let saved=0,conflicts=0,failed=0;for(const entry of entries){try{const result=await commit(entry,entry.expectedRev,origin);records.set(entry.id,result);saved++}catch(e){if(e.code==='conflict')conflicts++;else {failed++;lastError=e.message;break}}progress?.({saved,conflicts,failed,total:entries.length});}apply();return {saved,conflicts,failed,total:entries.length}},
};
async function connect(){try{const config=window.ZICAO_FIREBASE_CONFIG;if(!config?.apiKey||!config?.projectId){message.textContent='Versão preparada. A configuração pública do Firebase ainda não foi preenchida. O site atual permanece intacto.';drawStatus();return}
const base='https://www.gstatic.com/firebasejs/13.3.0/';const [app,authSDK,firestore]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);sdk={...app,...authSDK,...firestore};
const emulated=window.ZICAO_FIREBASE_EMULATORS===true&&['localhost','127.0.0.1'].includes(location.hostname);
const instance=sdk.initializeApp(emulated?{...config,projectId:'demo-zicao-social-studio',apiKey:'demo-only',authDomain:'localhost'}:config);auth=sdk.getAuth(instance);db=sdk.getFirestore(instance);
if(emulated){sdk.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});sdk.connectFirestoreEmulator(db,'127.0.0.1',8081)}
login.disabled=false;message.textContent='Entre com seu usuário da loja ou com seu Google autorizado.';
login.onclick=async()=>{try{login.disabled=true;await sdk.setPersistence(auth,sdk.browserLocalPersistence);const provider=new sdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});try{await sdk.signInWithPopup(auth,provider)}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code))await sdk.signInWithRedirect(auth,provider);else throw e}}catch(e){message.textContent='Não foi possível entrar: '+e.message}finally{login.disabled=false}};
await sdk.getRedirectResult(auth).catch(e=>{message.textContent='Não foi possível concluir a entrada: '+e.message});
sdk.onAuthStateChanged(auth,async account=>{if(stop){stop();stop=null}user=account;role=null;authorized=false;seenServer=false;serverFresh=false;records=new Map();pending=new Map();state=S.emptyState();uiState=new Map();document.body.dataset.cloudLocked='true';for(const fn of subscribers)fn({schema:2,records:[],lastImport:null,timezone:'America/Sao_Paulo'});safeRender();drawStatus();if(!account)return;
try{const member=await sdk.getDocFromServer(sdk.doc(db,'studios',STUDIO,'members',account.email));if(!account.emailVerified||!member.exists()||!member.data().active||!['owner','editor'].includes(member.data().role))throw Error('Este e-mail ainda não foi autorizado para a equipe.');role=member.data().role;authorized=true;
try{const drafts=JSON.parse(localStorage.getItem(draftKey())||'[]');for(const [id,p]of drafts){const entry=S.validate(p.entry.section,p.entry.key,p.entry.value);if(id!==entry.id||!Number.isInteger(p.expectedRev)||p.expectedRev<0)throw Error('Rascunho incompatível');pending.set(id,{...p,entry,failed:false})}}catch{pending=new Map();lastError='Não foi possível ler um rascunho antigo deste aparelho.'}
stop=sdk.onSnapshot(sdk.collection(db,'studios',STUDIO,'entries'),{includeMetadataChanges:true},snapshot=>{const next=new Map();snapshot.forEach(doc=>{const raw=doc.data(),entry=S.validate(raw.section,raw.key,raw.value);if(doc.id!==entry.id)throw Error('Registro com identidade inválida');next.set(doc.id,{...entry,...raw,updatedAt:raw.updatedAt?.toDate?.().toISOString()||null})});records=next;serverFresh=!snapshot.metadata.fromCache;if(serverFresh)seenServer=true;if(seenServer&&!window.ZICAO_STORE_ACTIVATION)document.body.dataset.cloudLocked='false';apply();if(serverFresh)flush()},error=>{lastError='Sem acesso ao painel compartilhado: '+error.message;serverFresh=false;drawStatus()});
}catch(e){authorized=false;message.textContent=e.message;drawStatus()}});
}catch(e){message.textContent='Não foi possível carregar a conexão: '+e.message;drawStatus()}}
connect();
})();
