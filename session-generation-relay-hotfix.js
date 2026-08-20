'use strict';

// Hotfix: torna o pedido manual de preparação resistente a falso-negativo de confirmação.
// Estratégia: tenta ação nativa; se ela não existir, usa push_session_state como relay.
// Quando o POST do relay retorna sucesso explícito, isso já vale como confirmação do pedido.
(function(){
  if(typeof DP_GATED_DELIVERY_ONLY!=='undefined'&&DP_GATED_DELIVERY_ONLY)return;
  const UI_ERR_PREFIX='O pedido não foi confirmado: ';

  function feedback(message,type='bad'){
    const el=document.getElementById('prepareFeedback');
    if(el){el.textContent=message;el.className='status '+type;el.classList.remove('hidden')}
    if(typeof setStatus==='function')setStatus(message,type);
  }

  function prepared(id){
    try{return typeof catalogById==='function'&&catalogById().has(id)}catch{return false}
  }

  function queueRequest(id,status,extra={}){
    if(typeof plannerQueue!=='function'||typeof savePlannerQueue!=='function')return;
    const q=plannerQueue().filter(x=>x.sessionId!==id);
    q.push({sessionId:id,status,requestedAt:new Date().toISOString(),triggerType:'manual_prepare',...extra});
    savePlannerQueue(q);
  }

  function clearRequest(id){
    if(typeof plannerQueue!=='function'||typeof savePlannerQueue!=='function')return;
    savePlannerQueue(plannerQueue().filter(x=>x.sessionId!==id));
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

  async function relayRequest(cfg,id,title){
    if(typeof sha256!=='function')throw new Error('Canal de sincronização indisponível neste carregamento.');
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
      content_version_at_request:(typeof catalog!=='undefined'&&catalog?.contentVersion)||'',
      created_at:new Date().toISOString()
    };
    const stateJson=JSON.stringify(requestState);
    const checksum=await sha256(stateJson);
    const relayPayload={
      action:'push_session_state',token:cfg.token,device_id:cfg.deviceId,
      app_version:typeof APP_VERSION!=='undefined'?APP_VERSION:'',
      content_version:(typeof catalog!=='undefined'&&catalog?.contentVersion)||'',
      session_id:relaySessionId,checksum,state_json:stateJson
    };

    // 1) Caminho preferido: POST com resposta JSON. Se o servidor disser OK, não tratamos
    //    como falha só porque a leitura posterior ainda não propagou.
    try{
      const direct=await postJson(cfg,relayPayload);
      if(direct?.ok!==false)return {ok:true,request_id:requestId,relay:true,confirmation:'relay_post_confirmed'};
    }catch(error){
      const msg=String(error?.message||error||'');
      // Se o serviço rejeitou explicitamente push_session_state, não masque o erro.
      if(/Ação POST inválida|acao post invalida|action.*invalid/i.test(msg))throw error;
      // Outros erros podem ser CORS/transporte; tentamos o caminho já usado pelo sync.
    }

    // 2) Fallback compatível com o sync atual: envio no-cors + confirmação por meta.
    void fetch(cfg.endpoint,{
      method:'POST',mode:'no-cors',cache:'no-store',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(relayPayload)
    }).catch(()=>{});

    if(typeof jsonp==='function'){
      for(let attempt=0;attempt<7;attempt++){
        await new Promise(r=>setTimeout(r,attempt===0?900:1400));
        try{
          const meta=await jsonp(cfg.endpoint,{action:'session_state_meta',token:cfg.token,device_id:cfg.deviceId,session_id:relaySessionId},9000);
          if(meta?.found&&meta.checksum===checksum)return {ok:true,request_id:requestId,relay:true,confirmation:'relay_meta_confirmed'};
        }catch{}
      }
    }
    throw new Error('Não foi possível confirmar o relay de preparação na base compartilhada.');
  }

  async function submit(cfg,payload){
    try{return await postJson(cfg,payload)}catch(error){
      const msg=String(error?.message||error||'');
      if(/Ação POST inválida|acao post invalida|action.*invalid/i.test(msg))return relayRequest(cfg,payload.session_id,payload.title);
      throw error;
    }
  }

  window.requestPreparation=async function(id,title){
    if(prepared(id)){
      clearRequest(id);
      if(typeof closePlannerModal==='function')closePlannerModal();
      if(typeof setStatus==='function')setStatus('Sessão já preparada. Liberada para início.','ok');
      if(typeof renderHome==='function')renderHome();
      return;
    }

    const cfg=typeof readConfig==='function'?readConfig():{};
    if(!cfg.endpoint||!cfg.token||!cfg.deviceId){feedback('A sincronização não está configurada neste aparelho. O pedido não foi enviado.');return}
    const btn=document.getElementById('confirmPrepareBtn');
    if(btn){btn.disabled=true;btn.textContent='Solicitando…'}

    const payload={
      action:'request_session_generation',token:cfg.token,device_id:cfg.deviceId,
      session_id:id,title,trigger_type:'manual_prepare',requested_sessions:1,
      content_version:(typeof catalog!=='undefined'&&catalog?.contentVersion)||''
    };

    try{
      const response=await submit(cfg,payload);
      if(!response?.request_id)throw new Error('O serviço respondeu sem confirmar um identificador de pedido.');
      queueRequest(id,'pendente_geracao',{
        requestId:response.request_id,
        confirmation:response.confirmation||(response.relay?'relay_confirmed':'native_confirmed')
      });
      if(typeof closePlannerModal==='function')closePlannerModal();
      if(typeof setStatus==='function')setStatus(`Pedido confirmado (${response.request_id}). A sessão entrou na preparação.`,'ok');
      if(typeof renderHome==='function')renderHome();
    }catch(error){
      const msg=String(error?.message||error||'Falha desconhecida');
      queueRequest(id,'erro_geracao',{requestId:'',error:msg});
      feedback(UI_ERR_PREFIX+msg+' Você pode tentar novamente.');
      if(btn){btn.disabled=false;btn.textContent='Tentar novamente'}
    }
  };
})();
