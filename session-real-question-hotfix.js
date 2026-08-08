'use strict';

// Hotfix permanente para questões reais incorporadas às Sessões.
// Regra: toda questão interativa precisa ter ID estável antes de ligar estado e eventos.
(function(){
  function current(){
    const c=window.session?.concepts?.[window.state?.conceptIndex];
    const q=c?.realQuestion;
    if(!c||!q)return null;
    if(!q.id)q.id=`REAL-${window.session?.id||'SESSION'}-${c.id||'CONCEPT'}`;
    return {c,q};
  }
  function ensureRec(c,q){
    state.realPractice=state.realPractice||{};
    return state.realPractice[q.id]||(state.realPractice[q.id]={});
  }
  function cleanupDuplicate(){
    const body=document.getElementById('studyBody');if(!body)return;
    if(body.querySelector('.real-practice'))body.querySelectorAll('.real-q-card').forEach(el=>el.remove());
  }

  document.addEventListener('click',ev=>{
    const option=ev.target.closest?.('[data-real-practice]');
    const submit=ev.target.closest?.('[data-real-submit]');
    if(!option&&!submit)return;
    const data=current();if(!data)return;
    const {c,q}=data,rec=ensureRec(c,q);

    if(option){
      ev.preventDefault();ev.stopPropagation();
      rec.selected=Number(option.dataset.index);
      rec.selectedAt=new Date().toISOString();
      saveState();
      renderConcept();
      requestAnimationFrame(cleanupDuplicate);
      return;
    }
    if(submit){
      ev.preventDefault();ev.stopPropagation();
      if(rec.selected===undefined||rec.selected===null)return;
      rec.submitted=true;
      rec.correct=rec.selected===q.answer;
      rec.answeredAt=new Date().toISOString();
      saveState();
      renderConcept();
      requestAnimationFrame(cleanupDuplicate);
    }
  },true);

  const observer=new MutationObserver(()=>requestAnimationFrame(cleanupDuplicate));
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(cleanupDuplicate,100);
})();
