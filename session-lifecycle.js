'use strict';

(function(){
  const gatedDeliveryOnly=typeof DP_GATED_DELIVERY_ONLY!=='undefined'&&DP_GATED_DELIVERY_ONLY;
  const AUTO_KEY='dataprev_sessoes_auto_buffer_v1';
  const SYNCED_KEY='dataprev_sessoes_completed_sync_v1';
  const style=document.createElement('style');
  style.textContent=`
    .dp-toast{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:12000;max-width:min(92vw,560px);background:#162033;color:#fff;border-radius:999px;padding:10px 14px;font-size:.8rem;font-weight:750;box-shadow:0 8px 28px rgba(0,0,0,.22);text-align:center}
    .session-page-nav{display:flex;justify-content:flex-end;gap:6px;margin:-2px 0 10px}.session-page-nav button{padding:7px 10px;min-width:42px;border-radius:999px;background:#f7f9fc;color:var(--muted);font-size:.8rem}.session-page-nav button:not(:disabled):active{background:var(--accent2);color:#173f91;border-color:#bfd0ff}
  `;document.head.appendChild(style);

  function toast(msg){document.querySelector('.dp-toast')?.remove();const el=document.createElement('div');el.className='dp-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3600)}
  window.dpSessionToast=toast;

  function readObj(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return{}}}
  function writeObj(key,obj){localStorage.setItem(key,JSON.stringify(obj))}
  function nextRoadmapId(id){
    if(typeof ROADMAP==='undefined')return null;
    for(const rows of Object.values(ROADMAP)){
      const i=rows.findIndex(x=>x[0]===id);if(i>=0)return rows[i+1]?.[0]||null;
    }
    return null;
  }
  function markGenerationFailure(nextId,title,error){
    if(typeof plannerQueue!=='function'||typeof savePlannerQueue!=='function')return;
    const q=plannerQueue().filter(x=>x.sessionId!==nextId);
    q.push({sessionId:nextId,status:'erro_geracao',requestedAt:new Date().toISOString(),requestId:'',triggerType:'auto_buffer',error:String(error?.message||error||'falha não especificada')});
    savePlannerQueue(q);
    toast(`Buffer não entrou na fila: ${title}. A trilha mostrará “Tentar novamente”.`);
    if(typeof renderHome==='function'&&state?.phase==='home')renderHome();
  }
  async function ensureNextBuffered(currentId){
    if(gatedDeliveryOnly)return;
    const nextId=nextRoadmapId(currentId);if(!nextId)return;
    if(typeof catalogById==='function'&&catalogById().has(nextId))return;
    if(typeof plannerQueue==='function'&&plannerQueue().some(x=>x.sessionId===nextId&&x.status==='pendente_geracao'))return;
    const marks=readObj(AUTO_KEY);if(marks[nextId])return;
    const cfg=typeof readConfig==='function'?readConfig():{};if(!cfg.endpoint||!cfg.token||!cfg.deviceId){markGenerationFailure(nextId,nextId,new Error('sincronização não configurada'));return}
    const row=Object.values(ROADMAP).flat().find(x=>x[0]===nextId),title=row?.[1]||nextId;
    marks[nextId]=new Date().toISOString();writeObj(AUTO_KEY,marks);
    try{
      const response=await jsonp(cfg.endpoint,{action:'request_session_generation',token:cfg.token,device_id:cfg.deviceId,session_id:nextId,title,trigger_type:'auto_buffer',requested_sessions:1,content_version:catalog.contentVersion},20000);
      if(!response?.request_id)throw new Error('o serviço não confirmou um código de fila');
      const q=plannerQueue().filter(x=>x.sessionId!==nextId);q.push({sessionId:nextId,status:'pendente_geracao',requestedAt:new Date().toISOString(),requestId:response.request_id,triggerType:'auto_buffer'});savePlannerQueue(q);
      toast(`Próxima sessão confirmada na fila: ${title}`);
      if(typeof renderHome==='function'&&state?.phase==='home')renderHome();
    }catch(err){delete marks[nextId];writeObj(AUTO_KEY,marks);markGenerationFailure(nextId,title,err);console.warn('Buffer automático não solicitado:',err)}
  }

  if(typeof manualUsed==='function')manualUsed=function(){return plannerQueue().filter(x=>['pendente_geracao','pronta'].includes(x.status)&&x.triggerType!=='auto_buffer').length};

  if(typeof openSession==='function'){
    const baseOpen=openSession;
    openSession=function(id){const result=baseOpen(id);setTimeout(()=>ensureNextBuffered(id),300);return result}
  }

  if(typeof renderComplete==='function'){
    const baseComplete=renderComplete;
    renderComplete=function(){
      if(state?.completedAt){
        try{state.reportText=buildReport();saveState()}catch{}
        const done=readObj(SYNCED_KEY);const key=`${state.sessionId}|${state.completedAt}`;
        if(!done[key]){
          done[key]='pending';writeObj(SYNCED_KEY,done);
          setTimeout(async()=>{
            try{
              toast('Sessão concluída. Enviando relatório e checkpoint…');
              await syncNow();
              const ok=document.getElementById('syncBadge')?.classList.contains('ok');
              if(ok){done[key]='sent';writeObj(SYNCED_KEY,done);toast('Relatório e checkpoint final sincronizados.')}
              else{delete done[key];writeObj(SYNCED_KEY,done);toast('Progresso salvo localmente; sincronização final ainda não confirmou.')}
            }catch(err){delete done[key];writeObj(SYNCED_KEY,done);toast('Progresso salvo localmente; sincronização final será tentada novamente.')}
          },250);
        }
        setTimeout(()=>ensureNextBuffered(state.sessionId),450);
      }
      baseComplete();
    }
  }

  function injectNav(){
    const panel=document.getElementById('studyPanel');if(!panel||panel.classList.contains('hidden')||document.querySelector('.session-page-nav'))return;
    if(!state||!session||!['concepts','final','complete'].includes(state.phase))return;
    const nav=document.createElement('div');nav.className='session-page-nav';
    const back=document.createElement('button');back.type='button';back.textContent='‹';back.setAttribute('aria-label','Página anterior');
    const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','Próxima página');
    nav.append(back,next);document.getElementById('studyTitle')?.insertAdjacentElement('afterend',nav);
    back.disabled=state.phase==='concepts'&&state.conceptIndex===0;next.disabled=state.phase==='complete';
    back.onclick=()=>{
      if(state.phase==='concepts'){document.getElementById('prevConcept')?.click();return}
      if(state.phase==='final'){
        if(state.finalIndex>0){state.finalIndex--;saveState();render();scrollTop()}
        else{state.phase='concepts';state.conceptIndex=Math.max(0,(session.concepts?.length||1)-1);saveState();render();scrollTop()}
        return;
      }
      if(state.phase==='complete'){state.phase='final';state.finalIndex=Math.max(0,(session.finalQuestions?.length||1)-1);saveState();render();scrollTop()}
    };
    next.onclick=()=>{
      if(state.phase==='concepts'){document.getElementById('nextConcept')?.click();return}
      if(state.phase==='final'){const btn=document.getElementById('nextFinal');if(btn)btn.click();else toast('Corrija a resposta atual antes de avançar.')}
    };
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(injectNav));observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(injectNav,0));setTimeout(injectNav,500);
})();
