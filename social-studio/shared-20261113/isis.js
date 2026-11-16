/* Guided execution, using the existing task IDs and progress. Test version only. */
(()=>{'use strict';
const essential=new Set(['saudacao','produto','produto2','interacao','acessorio','produto3','produto4','fecho']);
let lastMarked=null;
const guide=document.createElement('section');guide.id='isis-guide';guide.className='isis-guide';guide.setAttribute('aria-label','Próximo passo da Isis');
document.getElementById('dayIntro').after(guide);
function fold(id,title,nodes){const d=document.createElement('details');d.id=id;d.className='isis-fold';const summary=document.createElement('summary');summary.textContent=title;d.append(summary);nodes[0].before(d);nodes.forEach(n=>d.append(n));return d}
const first=document.getElementById('live-hero'),last=document.getElementById('preflight');
if(first&&last){let nodes=[],n=first;while(n){nodes.push(n);if(n===last)break;n=n.nextElementSibling}fold('isis-prep','Conferir aparelhos e preparação',nodes)}
const timeline=document.getElementById('timeline');const full=fold('isis-full','Ver roteiro completo e extras',[timeline.previousElementSibling,timeline]);
const closing=document.querySelector('#view-hoje .cols2');fold('isis-closing','Encerrar o dia: anotações e atendimentos',[closing]);
document.querySelector('.mast h1').textContent='Equipe Zicão, vamos por partes.';
document.querySelector('.mast .lead').textContent='Confira o próximo bloco, grave e marque depois de publicar. O roteiro completo continua logo abaixo.';
function draw(){const d=BYDAY[selectedDate];if(!d)return;
if(d.sunday||d.holiday){
 const t=allTasks(d).find(x=>x.kind==='story'&&!x.history);
 const owner=window.StudioCloud&&window.StudioCloud.role==='owner';
 const done=t&&!!state.done[t.id];
 guide.innerHTML='<div class="isis-topline"><span>DESCANSO DA EQUIPE</span><span>Sem blocos obrigatórios</span></div>'+
 '<h2 id="isis-task-title" tabindex="-1">'+(d.sunday?'Domingo — loja fechada':d.date==='2026-12-25'?'Natal — mensagem opcional':'Feriado — conteúdo opcional')+'</h2>'+
 '<p>Nenhum Story é obrigatório para Isis, Karina ou Thuane neste dia. Use somente conteúdo preparado antes, se quiser.</p>'+
 (t?'<p class="isis-owner">Conteúdo opcional: <b>'+safe(t.who)+'</b></p><p>'+safe(t.shot)+'</p><blockquote>'+safe(t.script)+'</blockquote><p class="isis-cta">'+safe(t.cta)+'</p>':'')+
 (owner&&t?'<div class="isis-actions"><button id="isis-copy" class="btn" type="button">Copiar fala</button><button id="isis-done" class="btn primary" type="button">'+(done?'Desfazer marcação':'Marquei que publiquei ✓')+'</button></div>':'')+
 '<p class="isis-check">A loja não deve ser anunciada como aberta. A publicação é opcional e não é uma tarefa da equipe.</p>';
 const copyButton=document.getElementById('isis-copy');
 if(copyButton)copyButton.onclick=()=>copy(t.script+'\n\n'+t.cta);
 const doneButton=document.getElementById('isis-done');
 if(doneButton)doneButton.onclick=()=>setTaskDone(t.id,!done);
 return;
}
const main=requiredTasks(d).filter(t=>t.kind!=='story'||essential.has(t.id.split('-').pop()));
const finished=main.filter(t=>state.done[t.id]).length,remaining=main.filter(t=>!state.done[t.id]),t=remaining[0];
guide.innerHTML='<div class="isis-topline"><span>ROTEIRO PRINCIPAL</span><span>'+finished+' de '+main.length+' blocos marcados</span></div>'+
((d.sunday||d.holiday||d.specialHours)?'<p class="isis-check">Conteúdo pré-gravado ou programado. Confirme o expediente; não anuncie a loja aberta sem conferir.</p>':'')+
'<p class="isis-local">Marcações compartilhadas da equipe. O app não confere o Instagram; marque apenas o que já foi publicado.</p>'+
(t?'<div class="isis-task-meta">'+safe(t.label)+' · horário sugerido '+safe(t.time)+'</div><h2 id="isis-task-title" tabindex="-1">'+safe(t.name)+'</h2><p class="isis-owner">Quem participa: '+safe(t.who)+'</p><ol class="isis-steps"><li><b>Confira antes</b><p>'+(t.who.startsWith('Karina')?'Confira estoque, preço, condição e bateria da unidade.':'Confirme aparelho, preço e condição com a Karina.')+' Grave na vertical, sem mostrar dados de cliente.</p></li><li><b>Grave assim</b><p>'+safe(t.shot)+'</p></li><li><b>Fale do seu jeito</b><blockquote>'+safe(t.script)+'</blockquote><p class="isis-cta">'+safe(t.cta)+'</p></li></ol>'+(t.disclaimer?'<p class="isis-check">'+safe(t.disclaimer)+'</p>':'')+'<div class="isis-actions"><button type="button" class="btn" id="isis-copy">Copiar fala</button><button type="button" class="btn primary" id="isis-done">Publiquei este bloco ✓</button></div><p class="isis-small">'+(t.kind==='story'&&t.count>1?'Marque depois de publicar os '+t.count+' Stories deste bloco.':'Marque somente depois de publicar.')+' Isso atualiza o checklist da equipe, sem publicar pelo app.</p>'+(remaining[1]?'<p class="isis-next">Depois: '+safe(remaining[1].time)+' · '+safe(remaining[1].name)+'</p>':''):'<h2 id="isis-task-title" tabindex="-1">Parte principal marcada como concluída ✓</h2><p>Os extras continuam no roteiro completo. No fim do expediente, anote os atendimentos em “Encerrar o dia”.</p>')+
(lastMarked&&lastMarked.startsWith(selectedDate)?'<button type="button" class="isis-undo" id="isis-undo">Desfazer última marcação</button>':'')+
'<p class="isis-check">Revezem: enquanto uma grava, a outra cobre WhatsApp e Instagram. Se a loja estiver movimentada, retomem o roteiro depois.</p><p class="isis-small">Aqui aparecem os blocos essenciais, posts e Reels. Os horários são sugestões; os extras ficam no roteiro completo.</p>';
if(t){document.getElementById('isis-copy').onclick=()=>copy(t.script+'\n\n'+t.cta);document.getElementById('isis-done').onclick=()=>{lastMarked=t.id;setTaskDone(t.id,true);document.getElementById('isis-task-title').focus({preventScroll:true});guide.scrollIntoView({behavior:'smooth',block:'start'})}}
const undo=document.getElementById('isis-undo');if(undo)undo.onclick=()=>{const id=lastMarked;lastMarked=null;setTaskDone(id,false);document.getElementById('isis-task-title').focus({preventScroll:true})};
}
const renderBefore=renderDay;renderDay=function(){renderBefore();draw()};
document.getElementById('nextStory').onclick=()=>{view('hoje');draw();guide.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('isis-task-title').focus({preventScroll:true})};
document.getElementById('nextStory').textContent='Meu próximo passo';
document.getElementById('copyDay').hidden=true;
draw();
})();
