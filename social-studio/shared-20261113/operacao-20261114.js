/* Zicão Social Studio — rotina comercial enxuta e aparições do dono.
   Só altera planejamento em memória. Não altera Firebase, preços nem estoque. */
(function(){
'use strict';
const feedOriginal=new Set(DAYS.filter(function(d){return d.feed}).map(function(d){return d.date}));
const datasFeedEspecial=new Set(['2026-11-16','2026-12-01','2026-12-24','2026-12-31']);
const datasAberturaDono={
 '2026-11-16':'Fala, galeraaaaa! Boraaaa! Começou a Black da Zicão Store. A Isis e a Karina vão mostrar os seminovos com condições realmente liberadas. Chama a gente para conferir a unidade e o valor atual!',
 '2026-11-27':'Falaaaa, galera! Sextou com a Black da Zicão! Bora conferir os aparelhos que ainda estiverem disponíveis. A equipe confirma tudo certinho antes da venda!',
 '2026-12-01':'Fala, galeraaaa! Boraaa pensar nos presentes de Natal! A Zicão tem opções de iPhone, Android e acessórios. A Isis e a Karina vão mostrar ideias para cada perfil!',
 '2026-12-24':'Fala, galeraaaa! Passando para desejar um Feliz Natal e agradecer a confiança de vocês. Toda a equipe Zicão Store deseja um dia especial!',
 '2026-12-31':'Fala, galeraaaaa! Obrigado por cada visita, mensagem e compra em 2026! Boraaaa para 2027! O que vocês querem ver mais na Zicão?'
};
const temasDomingo={
 '2026-11-15':'A Black começa amanhã. Vocês querem conhecer primeiro seminovos ou lacrados?',
 '2026-11-22':'Qual iPhone vocês gostariam de conhecer melhor nesta Black?',
 '2026-11-29':'A Black termina amanhã. Qual modelo vocês ainda querem conhecer? A equipe confirma tudo no próximo atendimento.',
 '2026-12-06':'Qual presente tem mais a ver com você: celular ou acessório?',
 '2026-12-13':'Qual celular você gostaria de ganhar de presente?',
 '2026-12-20':'Na semana do Natal, o que você prefere ver: ideias de presente ou dicas de compra?',
 '2026-12-27':'O que vocês querem ver na Zicão em 2027: aparelhos, dicas ou bastidores?'
};
for(const day of DAYS){
 if(day.sunday){
   day.slots=[['10:00','saudacao',1]];
   day.feed=false;day.reel=false;
 }else if(day.date==='2026-12-25'){
   day.slots=[['10:00','saudacao',1]];
   day.feed=false;day.reel=false;
 }else if(day.holiday){
   day.slots=[['10:00','saudacao',1],['12:00','produto',2]];
 }else if(day.saturday){
   day.slots=[['09:15','saudacao',1],['10:00','produto',2],['11:30','interacao',1],['12:30','produto2',2],['13:30','acessorio',1],['14:30','fecho',1]];
 }else{
   day.slots=[['09:15','saudacao',1],['10:00','produto',2],['12:00','interacao',1],['14:30','produto2',2],['16:30','acessorio',1],['17:30','fecho',1]];
 }
 const weekday=new Date(day.date+'T12:00:00Z').getUTCDay();
 if(day.feed&&weekday!==1&&weekday!==4&&!datasFeedEspecial.has(day.date))day.feed=false;
}
const antigoStory=mkStory;
mkStory=function(day,slot,idx){
 const task=antigoStory(day,slot,idx);
 const type=slot[1];
 if(day.sunday){
   task.name='Domingo do dono — Story opcional';
   task.who='Thiago (dono, de casa — opcional)';
   task.shot='Selfie vertical, 8 a 15 segundos, de casa. Sem equipe, sem loja aberta e sem obrigação de postar. Pode usar enquete do Instagram.';
   task.script='Falaaaa, galeraaaaa! Domingão por aqui, a loja está fechada e a equipe está de folga. '+(temasDomingo[day.date]||'O que vocês gostariam de ver na Zicão esta semana?');
   task.cta='Responde à enquete ou deixa sua sugestão. A equipe responde no próximo expediente.';
   task.why='Presença humana do dono sem ocupar o descanso da equipe.';
   task.disclaimer='DOMINGO: loja fechada. Sem tarefa para Isis, Karina ou Thuane. Publicação inteiramente opcional.';
   task.optional=true;
   return task;
 }
 if(day.date==='2026-12-25'){
   task.name='Natal — mensagem opcional do dono';
   task.who='Thiago (opcional; pode deixar programado)';
   task.shot='Vídeo curto de agradecimento gravado antes do Natal. Nada de exigir gravação ou atendimento no feriado.';
   task.script='Fala, galeraaaaa! Feliz Natal! Obrigado pela confiança e pelo carinho com a Zicão Store. Que seja um dia especial para todos vocês!';
   task.cta='A equipe retorna às mensagens no próximo expediente confirmado.';
   task.why='Mensagem humana sem movimentar a equipe no feriado.';
   task.disclaimer='25/12: nenhuma tarefa para Isis, Karina ou Thuane. Não anunciar a loja como aberta.';
   task.optional=true;
   return task;
 }
 if(day.holiday){
   task.who='Conteúdo preparado previamente (somente se expediente confirmado)';
   task.shot+=' Confirmar expediente de feriado antes de anunciar abertura; gravar antes, se a loja não funcionar.';
   task.disclaimer='Feriado: expediente não confirmado. Não exigir trabalho fora da escala.';
 }
 if(type==='produto2'){
   task.who='Karina (mostra e confere) · Isis cobre o atendimento';
   task.shot+=' Se a Karina estiver atendendo, a Isis pode assumir a gravação depois.';
 }else if(type==='acessorio'){
   task.who='Karina (demonstra acessório) · Isis apoia';
   task.shot+=' Mostrar compatibilidade apenas depois de conferir.';
 }else if(type==='interacao'){
   task.who='Isis (enquete) + Karina (opções, quando disponível)';
 }
 if(type==='saudacao'&&datasAberturaDono[day.date]){
   task.name='Participação do dono — '+(day.phase==='black'?'Black Zicão':day.phase==='christmas'?'Natal Zicão':'Mensagem especial');
   task.who='Thiago (fala curta, se disponível) + Isis (publica)';
   task.shot='Thiago aparece em selfie de 10 a 15 segundos, gravada em casa ou na loja. Se não puder, Isis faz a abertura normalmente.';
   task.script=datasAberturaDono[day.date];
   task.cta='Confira as opções reais com a equipe no horário de atendimento.';
   task.disclaimer='A participação do dono é flexível; preços e disponibilidade só após confirmação. Não prometer atendimento fora do expediente.';
 }
 return task;
};
const antigoMedia=mediaTask;
const reelsDono={
 '2026-11-27':'Falaaaa, galera! É sexta de Black na Zicão. A Karina separou uma unidade que a gente vai mostrar sem esconder nenhum detalhe. Chama a equipe para confirmar a condição e o valor atual!',
 '2026-12-04':'Fala, galeraaaa! Presente bom é aquele que combina com a pessoa. A Karina e a Isis vão mostrar opções para comparar. Bora escolher com calma!',
 '2026-12-18':'Fala, galeraaaa! Antes de trocar de celular, pensa no que você mais usa e quanto quer investir. A equipe da Zicão te ajuda a comparar opções de verdade!',
 '2026-12-24':'Fala, galeraaaa! Feliz Natal! Obrigado a cada cliente e amigo que passou pela Zicão Store este ano. Um abraço de toda a equipe!',
 '2026-12-31':'Fala, galeraaaaa! Obrigado por fazer parte da nossa história em 2026! Boraaa para 2027! Conta aí: o que vocês querem ver mais por aqui?'
};
mediaTask=function(day,type){
 const task=antigoMedia(day,type);
 if(type==='feed'){
   task.who='Karina (fotos e conferência) + Isis (publica); Thuane apoia na arte';
   task.shot='Karina confere e fotografa os aparelhos reais; Isis escolhe uma legenda curta e publica. Thuane pode aprimorar a arte quando disponível. '+task.shot;
 }
 if(type==='reel'&&reelsDono[day.date]){
   task.name='Reel da semana — participação do dono';
   task.who='Thiago (fala, se disponível) + Karina (demonstra) + Isis (publica)';
   task.shot='Thiago grava fala de 8–15 segundos. Karina mostra aparelho ou acessório real; Isis publica. Se Thiago não puder, a equipe grava sem adiar o Reel.';
   task.script=reelsDono[day.date];
   task.cta='Uma chamada para conversar no direct ou WhatsApp, com informações conferidas pela equipe.';
   task.why='Dono cria proximidade; Karina demonstra; Isis mantém o ritmo do Instagram.';
 }
 if(typeof task.disclaimer==='string')task.disclaimer=task.disclaimer.replace(/Toani/g,'Thuane');
 return task;
};
const tarefasAntes=allTasks;
allTasks=function(day){
 const tasks=tarefasAntes(day);
 if(!day.feed&&feedOriginal.has(day.date)&&state.done[day.date+'-feed']){
   const hist=antigoMedia(day,'feed');
   tasks.push(Object.assign({},hist,{
     name:'Post marcado anteriormente — histórico',
     who:'Registro preservado; não é uma nova tarefa',
     disclaimer:'Post anteriormente concluído, mantido somente no histórico. Nenhuma nova publicação exigida.'
   }));
 }
 return tasks.sort(function(a,b){return a.time.localeCompare(b.time)||a.kind.localeCompare(b.kind)});
};
const team=document.getElementById('isis-team');
if(team){
 team.innerHTML='<summary>Quem faz o quê — revezamento da equipe</summary>'+
 '<p class="mini"><b>Isis:</b> abertura, enquete, atendimento e publicação. <b>Karina:</b> demonstra o segundo aparelho, acessórios e confere bateria, condição e disponibilidade. As duas se revezam; atendimento tem prioridade.</p>'+
 '<p class="mini"><b>Thiago:</b> abertura da Black em 16/11; fala de Black em 27/11; Natal em 01 e 24/12; Reels previstos em 27/11, 04, 18, 24 e 31/12, se disponível. Aos domingos, só ele pode fazer 1 Story de casa, opcional.</p>'+
 '<p class="mini"><b>Thuane:</b> artes e acabamento quando necessário; sem obrigação de participar no domingo.</p>'+
 '<p class="isis-check">Domingo: loja fechada, equipe de folga. Horários do calendário são testes e devem ser revistos com métricas reais. Não inventar preços ou publicar sem conferência.</p>';
}
const help=document.getElementById('view-ajuda');
if(help)for(const panel of help.querySelectorAll('.panel')){
 if(panel.querySelector('h3')&&panel.querySelector('h3').textContent.includes('Quem faz')){
   const p=panel.querySelector('p');if(p)p.textContent='Isis: abertura, enquete, publicação e atendimento. Karina: demonstração, acessórios, estoque e apoio. Thiago: vídeos de dono e Story opcional em casa aos domingos. Thuane: artes e edição quando necessário. A equipe folga aos domingos.';
 }
}
const foot=document.querySelector('.side-foot small');
if(foot)foot.textContent='Até 31/12: Stories úteis em blocos, 1 Reel principal por semana, posts selecionados e atendimento real. Domingo é folga da equipe.';
const note=document.getElementById('editorial-frequency');
const renderAntes=renderDay;
renderDay=function(){
 renderAntes();
 const d=BYDAY[selectedDate];
 if(!d)return;
 if(note){
   note.textContent=d.sunday?'DOMINGO: loja fechada, equipe de folga. Thiago pode gravar 1 Story de casa, se quiser.':
   d.date==='2026-12-25'?'NATAL: mensagem pré-gravada opcional. Nenhuma tarefa para a equipe.':
   d.holiday?'FERIADO: confirmar expediente. Conteúdo pode ser preparado antes.':
   d.reel?'Reel principal da semana: Thiago participa nas datas previstas, se disponível. Isis e Karina têm alternativa.':
   'Hoje: priorizar atendimento, Stories úteis e demonstrações reais; sem obrigação de Reel.';
 }
};
window.StudioOperacao20261114={domingoOpcional:true,roteiroEnxuto:true};
renderDay();
})();