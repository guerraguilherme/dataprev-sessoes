'use strict';

// Confirmação visível e honesta das solicitações de preparação.
// Uma sessão só entra como pendente quando o serviço devolve um request_id.
(function(){
  function feedback(message,type='bad'){
    const el=document.getElementById('prepareFeedback');
    if(el){el.textContent=message;el.className='status '+type;el.classList.remove('hidden')}
    if(typeof setStatus==='function')setStatus(message,type);
  }

  if(typeof confirmPrepare==='function'){
    confirmPrepare=function(id){
      const row=Object.values(ROADMAP).flat().find(x=>x[0]===id),used=manualUsed();
      if(used>=MANUAL_LIMIT)return alert('Você já tem duas sessões antecipadas aguardando início. Inicie uma delas para liberar uma vaga.');
      const title=row?.[1]||id;
      const modal=showPlannerModal(`<h2>Preparar esta sessão agora?</h2><p><b>${esc(title)}</b></p><p class="small">O material será preparado por completo considerando a trilha, seu histórico, revisões pertinentes, desempenho, segurança, erros, notas e pré-requisitos. Essa antecipação ocupa 1 das 2 vagas manuais.</p><p class="small">A sessão seguinte <b>não</b> será gerada em cascata agora. O buffer automático volta a funcionar quando você iniciar esta sessão.</p><div id="prepareFeedback" class="status hidden"></div><div class="modal-actions"><button id="cancelPrepare">Cancelar</button><button id="confirmPrepareBtn" class="primary">Confirmar preparação</button></div>`);
      modal.querySelector('#cancelPrepare').onclick=closePlannerModal;
      modal.querySelector('#confirmPrepareBtn').onclick=()=>requestPreparation(id,title);
    };
  }

  if(typeof requestPreparation==='function'){
    requestPreparation=async function(id,title){
      const cfg=readConfig();
      if(!cfg.endpoint||!cfg.token||!cfg.deviceId){feedback('A sincronização não está configurada neste aparelho. O pedido não foi enviado.');return}
      const btn=document.getElementById('confirmPrepareBtn');
      if(btn){btn.disabled=true;btn.textContent='Solicitando…'}
      try{
        const response=await jsonp(cfg.endpoint,{action:'request_session_generation',token:cfg.token,device_id:cfg.deviceId,session_id:id,title,trigger_type:'manual_prepare',requested_sessions:1,content_version:catalog.contentVersion},20000);
        if(!response?.request_id)throw new Error('o serviço não confirmou um código de fila');
        const q=plannerQueue().filter(x=>x.sessionId!==id);
        q.push({sessionId:id,status:'pendente_geracao',requestedAt:new Date().toISOString(),requestId:response.request_id,triggerType:'manual_prepare'});
        savePlannerQueue(q);
        closePlannerModal();
        setStatus(`Pedido confirmado na fila (${response.request_id}). A sessão ficará pronta após a publicação do conteúdo.`,'ok');
        if(typeof dpSessionToast==='function')dpSessionToast('Pedido de preparação confirmado na fila.');
        renderHome();
      }catch(error){
        const q=plannerQueue().filter(x=>x.sessionId!==id);
        q.push({sessionId:id,status:'erro_geracao',requestedAt:new Date().toISOString(),requestId:'',triggerType:'manual_prepare',error:String(error.message||error)});
        savePlannerQueue(q);
        feedback('O pedido não entrou na fila: '+(error.message||error)+'. Nada foi consumido das suas duas vagas; você pode tentar novamente.');
        if(btn){btn.disabled=false;btn.textContent='Tentar novamente'}
      }
    };
  }
})();

// Hotfix seguro de qualidade. Diferentemente da tentativa 0.7.7, não observa nem
// reescreve continuamente o DOM: atua apenas nos pontos normais de renderização.
(function(){
  const UI_VERSION='0.7.8';
  const style=document.createElement('style');
  style.textContent=`
    .dp-toast{top:calc(8px + env(safe-area-inset-top))!important;bottom:auto!important;max-width:min(88vw,440px)!important;border-radius:13px!important;padding:8px 11px!important;font-size:.72rem!important;line-height:1.28!important;font-weight:700!important;opacity:.96!important}
    #nextConcept:disabled{background:#f7f9fc!important;border-color:var(--line)!important;color:#98a2b3!important;opacity:1!important}
  `;
  document.head.appendChild(style);

  function setVersionLabel(){
    document.title=`DATAPREV Sessões — PWA ${UI_VERSION}`;
    const summary=document.getElementById('contentSummary');
    if(summary){
      const text=summary.textContent||'';
      summary.textContent=/PWA\s+[\d.]+/.test(text)?text.replace(/PWA\s+[\d.]+/,`PWA ${UI_VERSION}`):`${text} · PWA ${UI_VERSION}`;
    }
  }

  function patchOrthoData(){
    if(typeof catalog==='undefined'||!catalog?.sessions)return false;
    const s=catalog.sessions.find(x=>x.id==='PT-ORT-001');
    const c=s?.concepts?.find(x=>x.id==='PT-ORT-C01');
    if(!c)return false;
    const leak=(c.visuals?.[0]?.left?.items||[]).includes('privilégio');
    if(!leak)return false;
    c.visuals=[{
      type:'comparison',title:'Familiaridade não é regra',
      left:{title:'Formas corretas',items:['análise','pesquisa','benefício']},
      right:{title:'Armadilhas comuns',items:['analize','pesquiza','benefísio']}
    }];
    if(c.supportDetails)c.supportDetails.example="Em 'pesquisa', a grafia é com s. A forma 'pesquiza' parece plausível pelo som, mas não pertence ao padrão oficial.";
    return true;
  }

  function gateNextConcept(){
    const btn=document.getElementById('nextConcept');
    if(!btn||typeof state==='undefined'||typeof session==='undefined'||state?.phase!=='concepts')return;
    const c=session?.concepts?.[state.conceptIndex];
    const allowed=!c||typeof conceptDone!=='function'||conceptDone(c);
    btn.disabled=!allowed;
    btn.setAttribute('aria-disabled',String(!allowed));
    btn.title=allowed?'':'Conclua a fixação imediata antes de avançar.';
  }

  if(typeof renderHome==='function'){
    const base=renderHome;
    renderHome=function(){patchOrthoData();base();setVersionLabel()};
  }
  if(typeof renderConcept==='function'){
    const base=renderConcept;
    renderConcept=function(){patchOrthoData();base();gateNextConcept();setVersionLabel()};
  }
  if(typeof renderFinal==='function'){
    const base=renderFinal;
    renderFinal=function(){patchOrthoData();base();setVersionLabel()};
  }
  if(typeof renderComplete==='function'){
    const base=renderComplete;
    renderComplete=function(){patchOrthoData();base();setVersionLabel()};
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#nextConcept')&&e.target.closest('#nextConcept')?.disabled){
      e.preventDefault();e.stopImmediatePropagation();
    }
  },true);
  setTimeout(()=>{patchOrthoData();gateNextConcept();setVersionLabel()},350);
})();
