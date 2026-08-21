'use strict';

// Solicitação manual de preparação.
// Caminho principal: request_session_generation. Se o Apps Script ainda não expuser
// essa ação no doPost, usamos o canal já estável push_session_state como relay durável.
(function(){
  function feedback(message,type='bad'){
    const el=document.getElementById('prepareFeedback');
    if(el){el.textContent=message;el.className='status '+type;el.classList.remove('hidden')}
    if(typeof setStatus==='function')setStatus(message,type);
  }
  function queueLocal(id,status,extra={}){
    const q=plannerQueue().filter(x=>x.sessionId!==id);
    q.push({sessionId:id,status,requestedAt:new Date().toISOString(),triggerType:'manual_prepare',...extra});
    savePlannerQueue(q);
  }
  function clearLocalRequest(id){
    if(typeof plannerQueue!=='function'||typeof savePlannerQueue!=='function')return false;
    const before=plannerQueue(),after=before.filter(x=>x.sessionId!==id);
    if(after.length===before.length)return false;
    savePlannerQueue(after);return true;
  }
  function isPrepared(id){
    try{return typeof catalogById==='function'&&catalogById().has(id)}catch{return false}
  }
  function reconcilePreparedRequests(){
    if(typeof plannerQueue!=='function'||typeof savePlannerQueue!=='function'||typeof catalogById!=='function')return false;
    const ready=catalogById(),before=plannerQueue();
    const after=before.filter(x=>!ready.has(x.sessionId));
    if(after.length===before.length)return false;
    savePlannerQueue(after);
    return true;
  }
  function requestIdFor(id){
    const stamp=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14);
    return `SESS-${id}-${stamp}`;
  }
  async function postJson(cfg,payload){
    const response=await fetch(cfg.endpoint,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(payload),
      redirect:'follow',
      cache:'no-store'
    });
    const text=await response.text();
    let data=null;
    try{data=JSON.parse(text)}catch{throw new Error(`Resposta inválida do serviço: ${String(text||'').slice(0,120)}`)}
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    if(data?.ok===false)throw new Error(data.error||'Falha no serviço.');
    return data;
  }
  async function relayGenerationRequest(cfg,id,title){
    if(typeof sha256!=='function'||typeof jsonp!=='function')throw new Error('Canal de sincronização indisponível neste carregamento.');
    const requestId=requestIdFor(id);
    const relaySessionId=`__GENREQ__${id}`;
    const requestState={
      kind:'session_generation_request',
      request_id:requestId,
      status:'pending',
      source:'dataprev_sessoes_pwa',
      device_id:cfg.deviceId,
      trigger_type:'manual_prepare',
      session_id:id,
      title,
      requested_sessions:1,
      content_version_at_request:catalog?.contentVersion||'',
      created_at:new Date().toISOString()
    };
    const stateJson=JSON.stringify(requestState),checksum=await sha256(stateJson);
    void fetch(cfg.endpoint,{
      method:'POST',mode:'no-cors',cache:'no-store',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        action:'push_session_state',token:cfg.token,device_id:cfg.deviceId,
        app_version:typeof APP_VERSION!=='undefined'?APP_VERSION:'',
        content_version:catalog?.contentVersion||'',session_id:relaySessionId,
        checksum,state_json:stateJson
      })
    }).catch(()=>{});
    let confirmed=null;
    for(let attempt=0;attempt<5&&!confirmed;attempt++){
      await new Promise(r=>setTimeout(r,attempt===0?900:1400));
      try{
        const meta=await jsonp(cfg.endpoint,{action:'session_state_meta',token:cfg.token,device_id:cfg.deviceId,session_id:relaySessionId},9000);
        if(meta?.found&&meta.checksum===checksum)confirmed=meta;
      }catch{}
    }
    if(!confirmed)throw new Error('Não foi possível confirmar o pedido na base compartilhada.');
    return {ok:true,request_id:requestId,relay:true};
  }
  async function submitGenerationRequest(cfg,payload){
    try{return await postJson(cfg,payload)}catch(error){
      const msg=String(error?.message||error||'');
      if(/Ação POST inválida|acao post invalida|action.*invalid/i.test(msg))return relayGenerationRequest(cfg,payload.session_id,payload.title);
      throw error;
    }
  }

  if(typeof confirmPrepare==='function'){
    confirmPrepare=function(id){
      if(typeof DP_GATED_DELIVERY_ONLY!=='undefined'&&DP_GATED_DELIVERY_ONLY){if(typeof setStatus==='function')setStatus('Esta sessão será liberada somente após os gates da Content Factory.','');return}
      if(isPrepared(id)){
        clearLocalRequest(id);
        if(typeof setStatus==='function')setStatus('Esta sessão já está preparada e foi liberada.','ok');
        if(typeof renderHome==='function')renderHome();
        return;
      }
      const row=Object.values(ROADMAP).flat().find(x=>x[0]===id),used=manualUsed();
      if(used>=MANUAL_LIMIT)return alert('Você já tem duas sessões antecipadas aguardando início. Inicie uma delas para liberar uma vaga.');
      const title=row?.[1]||id;
      const modal=showPlannerModal(`<h2>Preparar esta sessão agora?</h2><p><b>${esc(title)}</b></p><p class="small">O material será preparado por completo considerando a trilha, seu histórico, revisões pertinentes, desempenho, segurança, erros, notas e pré-requisitos. A explicação detalhada deve acrescentar intuição, mecanismo, exemplo guiado, contraste com erro comum e checklist específico da disciplina.</p><p class="small">Essa antecipação ocupa 1 das 2 vagas manuais. A sessão seguinte <b>não</b> será gerada em cascata agora.</p><div id="prepareFeedback" class="status hidden"></div><div class="modal-actions"><button id="cancelPrepare">Cancelar</button><button id="confirmPrepareBtn" class="primary">Confirmar preparação</button></div>`);
      modal.querySelector('#cancelPrepare').onclick=closePlannerModal;
      modal.querySelector('#confirmPrepareBtn').onclick=()=>requestPreparation(id,title);
    };
  }

  requestPreparation=async function(id,title){
    if(typeof DP_GATED_DELIVERY_ONLY!=='undefined'&&DP_GATED_DELIVERY_ONLY){if(typeof setStatus==='function')setStatus('Geração pelo aplicativo desativada: aguarde a liberação do material validado.','');return}
    // Se o conteúdo já chegou ao catálogo enquanto o modal estava aberto, não crie fila fantasma.
    if(isPrepared(id)){
      clearLocalRequest(id);closePlannerModal();
      if(typeof setStatus==='function')setStatus('Sessão já preparada. Liberada para início.','ok');
      if(typeof renderHome==='function')renderHome();
      return;
    }
    const cfg=readConfig();
    if(!cfg.endpoint||!cfg.token||!cfg.deviceId){feedback('A sincronização não está configurada neste aparelho. O pedido não foi enviado.');return}
    const btn=document.getElementById('confirmPrepareBtn');if(btn){btn.disabled=true;btn.textContent='Solicitando…'}
    const payload={action:'request_session_generation',token:cfg.token,device_id:cfg.deviceId,session_id:id,title,trigger_type:'manual_prepare',requested_sessions:1,content_version:catalog.contentVersion};
    try{
      const response=await submitGenerationRequest(cfg,payload);
      if(response?.request_id){
        queueLocal(id,'pendente_geracao',{requestId:response.request_id,confirmation:response.relay?'relay_confirmed':'native_confirmed'});
        closePlannerModal();setStatus(`Pedido confirmado (${response.request_id}). A sessão entrou na preparação.`,'ok');renderHome();return;
      }
      throw new Error('O serviço respondeu sem confirmar um identificador de pedido.');
    }catch(error){
      const msg=String(error?.message||error||'Falha desconhecida');
      queueLocal(id,'erro_geracao',{requestId:'',error:msg});
      feedback('O pedido não foi confirmado: '+msg+' Você pode tentar novamente.');if(btn){btn.disabled=false;btn.textContent='Tentar novamente'}
    }
  };

  // Corrige filas locais antigas: se o arquivo preparado já está no catálogo,
  // qualquer estado pendente/erro/pronta na fila manual deixa de ser fonte de verdade.
  const baseRenderHome=typeof renderHome==='function'?renderHome:null;
  if(baseRenderHome){
    renderHome=function(){reconcilePreparedRequests();return baseRenderHome()};
  }
  let tries=0;
  const reconcileTimer=setInterval(()=>{
    tries++;
    const changed=reconcilePreparedRequests();
    if(changed&&typeof renderHome==='function'&&(!state||state.phase==='home'))renderHome();
    if(tries>=20)clearInterval(reconcileTimer);
  },500);
})();

// Hotfix seguro de qualidade, sem MutationObserver recursivo.
(function(){
  const UI_VERSION='0.7.14';
  const style=document.createElement('style');
  style.textContent=`
    .dp-toast{top:calc(8px + env(safe-area-inset-top))!important;bottom:auto!important;max-width:min(88vw,440px)!important;border-radius:13px!important;padding:8px 11px!important;font-size:.72rem!important;line-height:1.28!important;font-weight:700!important;opacity:.96!important}
    #nextConcept:disabled{background:#f7f9fc!important;border-color:var(--line)!important;color:#98a2b3!important;opacity:1!important}
    .sv-flow{scroll-padding-left:2px}.session-visual{max-width:100%}
  `;document.head.appendChild(style);
  function setVersionLabel(){document.title=`DATAPREV Sessões — PWA ${UI_VERSION}`;const summary=document.getElementById('contentSummary');if(summary){const text=summary.textContent||'';summary.textContent=/PWA\s+[\d.]+/.test(text)?text.replace(/PWA\s+[\d.]+/,`PWA ${UI_VERSION}`):`${text} · PWA ${UI_VERSION}`}}
  function patchOrthoData(){if(typeof catalog==='undefined'||!catalog?.sessions)return false;const s=catalog.sessions.find(x=>x.id==='PT-ORT-001');const c=s?.concepts?.find(x=>x.id==='PT-ORT-C01');if(!c)return false;const leak=(c.visuals?.[0]?.left?.items||[]).includes('privilégio');if(!leak)return false;c.visuals=[{type:'comparison',title:'Familiaridade não é regra',left:{title:'Formas corretas',items:['análise','pesquisa','benefício']},right:{title:'Armadilhas comuns',items:['analize','pesquiza','benefísio']}}];if(c.supportDetails){c.supportDetails.example="Em 'pesquisa', a grafia é com s. A forma 'pesquiza' parece plausível pelo som, mas não pertence ao padrão oficial.";c.supportDetails.contrast="O erro nasce quando você decide só pelo som. O som de /z/ entre vogais não garante a letra z: 'pesquisa' conserva s pela grafia lexical.";c.supportDetails.why="Ortografia é convenção escrita: pronúncia ajuda, mas não determina sozinha a sequência de letras. Família lexical e padrão oficial têm prioridade."}return true}
  function gateNextConcept(){const btn=document.getElementById('nextConcept');if(!btn||typeof state==='undefined'||typeof session==='undefined'||state?.phase!=='concepts')return;const c=session?.concepts?.[state.conceptIndex];const allowed=!c||typeof conceptDone!=='function'||conceptDone(c);btn.disabled=!allowed;btn.setAttribute('aria-disabled',String(!allowed));btn.title=allowed?'':'Conclua a fixação imediata antes de avançar.'}
  if(typeof renderHome==='function'){const base=renderHome;renderHome=function(){patchOrthoData();base();setVersionLabel()}}
  if(typeof renderConcept==='function'){const base=renderConcept;renderConcept=function(){patchOrthoData();base();gateNextConcept();setVersionLabel();document.querySelectorAll('.sv-flow').forEach(x=>{try{x.scrollLeft=0}catch{}})}}
  if(typeof renderFinal==='function'){const base=renderFinal;renderFinal=function(){patchOrthoData();base();setVersionLabel()}}
  if(typeof renderComplete==='function'){const base=renderComplete;renderComplete=function(){patchOrthoData();base();setVersionLabel()}}
  document.addEventListener('click',e=>{if(e.target.closest?.('#nextConcept')&&e.target.closest('#nextConcept')?.disabled){e.preventDefault();e.stopImmediatePropagation()}},true);
  setTimeout(()=>{patchOrthoData();gateNextConcept();setVersionLabel()},350);
})();
