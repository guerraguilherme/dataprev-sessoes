'use strict';

// Safari/iPhone: confirmar uma resposta não deve reposicionar a página.
// Intercepta o clique antes do handler legado, confirma a questão e preserva
// exatamente a posição de leitura enquanto a correção é inserida.
(function(){
  function restoreScroll(y){
    const apply=()=>window.scrollTo({top:y,left:0,behavior:'auto'});
    apply();
    requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});
    setTimeout(apply,60);
    setTimeout(apply,180);
  }

  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('#simConfirm');
    if(!btn)return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if(typeof simCurrent==='undefined'||typeof simState==='undefined'||!simCurrent||!simState)return;
    const q=simCurrent.questions?.[simState.currentIndex];
    if(!q)return;
    const rec=simState.answers?.[q.id]||{};
    if(rec.selected===undefined){alert('Marque uma alternativa.');return}
    if(!rec.confidence){alert('Informe sua segurança.');return}

    const y=window.scrollY;
    rec.confirmed=true;
    rec.correct=rec.selected===q.answer;
    rec.answeredAt=new Date().toISOString();
    simState.answers[q.id]=rec;
    simUpdateClock();
    simSaveState();
    simRender();
    restoreScroll(y);
  },true);
})();
