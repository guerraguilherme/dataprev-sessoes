'use strict';

// Navegação sem salto automático + enunciados compartilhados persistentes.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .sim-shared-stimulus-note{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px;padding:7px 9px;border:1px solid #bfd0ff;border-radius:10px;background:#f3f6ff;color:#173f91;font-size:.76rem;font-weight:800}
    .sim-shared-stimulus-note span:last-child{color:var(--muted);font-weight:700}
  `;
  document.head.appendChild(style);

  function preserveY(fn){
    const y=window.scrollY;
    fn();
    const restore=()=>window.scrollTo({top:y,left:0,behavior:'auto'});
    restore();
    requestAnimationFrame(()=>{restore();requestAnimationFrame(restore)});
    setTimeout(restore,50);
    setTimeout(restore,140);
  }

  // Intercepta antes dos handlers legados, que chamam scrollTop()/scrollIntoView().
  document.addEventListener('click',event=>{
    const jump=event.target.closest?.('[data-sim-jump]');
    if(jump){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(!simCurrent||!simState)return;
      const i=Number(jump.dataset.simJump);
      if(!Number.isInteger(i)||i<0||i>=simCurrent.questions.length)return;
      preserveY(()=>{
        simUpdateClock();
        simState.currentIndex=i;
        simSaveState();
        simRender();
      });
      return;
    }

    const next=event.target.closest?.('#simNext');
    if(next){
      if(!simCurrent||!simState||simState.currentIndex>=69)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      preserveY(()=>{
        simUpdateClock();
        simState.currentIndex++;
        simSaveState();
        simRender();
      });
    }
  },true);

  function normalizedStimuli(q){
    const own=Array.isArray(q?.stimuli)?q.stimuli:(q?.stimulus?[q.stimulus]:[]);
    if(own.length)return own;
    const groupId=q?.stimulusGroupId||q?.sharedStimulusId||q?.stimulus_group_id;
    if(!groupId||!simCurrent)return [];
    if(simCurrent.sharedStimuli?.[groupId]){
      const shared=simCurrent.sharedStimuli[groupId];
      return Array.isArray(shared)?shared:[shared];
    }
    const donor=simCurrent.questions?.find(other=>(other.stimulusGroupId||other.sharedStimulusId||other.stimulus_group_id)===groupId && ((Array.isArray(other.stimuli)&&other.stimuli.length)||other.stimulus));
    return donor?(Array.isArray(donor.stimuli)?donor.stimuli:[donor.stimulus]):[];
  }

  function stimulusSignature(q){
    const items=normalizedStimuli(q);
    if(!items.length)return'';
    try{return JSON.stringify(items.map(s=>({type:s.type||'',label:s.label||'',text:s.text||'',code:s.code||'',src:s.src||'',headers:s.headers||[],rows:s.rows||[]})))}catch{return''}
  }

  function sharedRange(index){
    if(!simCurrent?.questions?.length)return null;
    const q=simCurrent.questions[index];
    const explicit=q?.stimulusGroupId||q?.sharedStimulusId||q?.stimulus_group_id;
    const sig=stimulusSignature(q);
    if(!explicit&&!sig)return null;
    let start=index,end=index;
    const matches=i=>{
      const other=simCurrent.questions[i];
      if(explicit)return (other?.stimulusGroupId||other?.sharedStimulusId||other?.stimulus_group_id)===explicit;
      return stimulusSignature(other)===sig;
    };
    while(start>0&&matches(start-1))start--;
    while(end<simCurrent.questions.length-1&&matches(end+1))end++;
    return end>start?{start,end}:null;
  }

  if(typeof simStimulusHtml==='function'){
    const baseStimulusHtml=simStimulusHtml;
    simStimulusHtml=function(q){
      if(!q)return'';
      const index=simCurrent?.questions?.indexOf(q)??-1;
      const effective=normalizedStimuli(q);
      if(!effective.length)return'';
      const clone={...q,stimuli:effective,stimulus:null};
      const body=baseStimulusHtml(clone);
      const range=index>=0?sharedRange(index):null;
      if(!range)return body;
      return `<div class="sim-shared-stimulus-note"><span>Enunciado comum</span><span>questões ${range.start+1}–${range.end+1}</span></div>${body}`;
    };
  }
})();
