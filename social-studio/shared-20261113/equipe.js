/* Role suggestions for store coverage; stable task IDs and calendar retained. */
(()=>{'use strict';
const storyBefore=mkStory;
mkStory=function(day,slot,index){const task=storyBefore(day,slot,index);if(['produto2','produto3','produto4','acessorio2'].includes(slot[1]))task.who='Karina (demonstração e conferência)';return task};
const mediaBefore=mediaTask;
mediaTask=function(day,type){const task=mediaBefore(day,type);task.who=task.who.replace('Dono (escritório)','Thiago (vídeo do escritório)');return task};
const team=document.createElement('details');team.className='isis-fold';team.id='isis-team';team.innerHTML='<summary>Quem faz o quê: revezamento da equipe</summary><p class="mini"><b>Isis:</b> abertura, primeiro aparelho, acessório principal e fechamento. Nos Reels em que está escalada, grava os clipes para a Thuane.</p><p class="mini"><b>Karina:</b> confere e separa os aparelhos; assume as demonstrações do segundo, terceiro e quarto modelos. O acessório extra também pode ficar com ela.</p><p class="mini"><b>Thiago:</b> participação nos vídeos já previstos para 16 e 27/11; 04, 13, 18, 24 e 31/12. A equipe usa os clipes pré-gravados no roteiro desses dias.</p><p class="mini"><b>Thuane:</b> artes, montagem e acabamento dos posts e Reels, conforme o roteiro.</p><p class="isis-check"><b>Atendimento tem prioridade.</b> Enquanto uma grava, a outra cobre WhatsApp e Instagram. Se as duas estiverem atendendo, retomem o conteúdo depois. Esta divisão é uma sugestão para combinar entre vocês, sem depender das duas gravando ao mesmo tempo.</p>';
document.getElementById('alerts').before(team);
const originalResults=renderResults;
renderResults=function(){originalResults();const entries=Object.values(state.metrics);const summary=key=>{const values=entries.map(m=>m[key]).filter(v=>v!==undefined&&v!==null&&v!=='');return {value:values.length?values.reduce((a,v)=>a+Number(v),0):'Não informado',count:values.length}};const directs=summary('directs'),sales=summary('sales');const cards=document.getElementById('periodSummary').children;for(const [index,value]of [[2,directs],[3,sales]]){cards[index].querySelector('.n').textContent=value.value;const note=document.createElement('small');note.textContent=value.count+' de 50 dias com dado';cards[index].append(note)}};
renderDay();
})();
