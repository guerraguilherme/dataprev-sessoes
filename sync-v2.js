'use strict';

// Sincronização contínua local-first para o DATAPREV Sessões.
const DP_SYNC_QUEUE_KEY='dataprev_sessoes_sync_queue_v2';
const DP_SYNC_META_KEY='dataprev_sessoes_sync_meta_v2';
const DP_SYNC_NORMAL_DELAY=12000;
const DP_SYNC_RETRY_DELAY=45000;
let dpSyncTimer=null;
let dpSyncRunning=false;

const DP_CANONICAL_COMPLETED={
  'PY-COND-001':{completedAt:'2026-08-06T13:56:12.280Z',source:'Estado_Sessoes'},
  'PY-COND-R01':{completedAt:'2026-08-06T15:47:58.078Z',source:'Estado_Sessoes'},
  'MAT-ALG-002':{completedAt:'2026-08-07T16:37:00.000Z',source:'Documento Mestre / resultado registrado'},
  'BD-NORM-002':{completedAt:'2026-08-08T03:37:28.867Z',source:'Controle Pedagógico / relatório autossuficiente'}
};

function dpReadQueue(){return readJson(DP_SYNC_QUEUE_KEY,{})||{}}
function dpWriteQueue(q){localStorage.setItem(DP_SYNC_QUEUE_KEY,JSON.stringify(q));dpUpdateSyncBadge()}
function dpQueueCount(){return Object.keys(dpReadQueue()).length}
function dpCanonicalOnly(id){const local=readMap()[id];return !!DP_CANONICAL_COMPLETED[id]&&!(local?.completedAt||local?.phase==='complete')}
function dpHomeVisible(){return !document.getElementById('homePanel')?.classList.contains('hidden')}

function dpUpdateSyncBadge(){
  const badge=document.getElementById('syncBadge');if(!badge)return;
  const n=dpQueueCount();badge.classList.remove('ok');
  if(!navigator.onLine){badge.textContent='Offline · progresso protegido';return}
  if(n){badge.textContent=`${n} aguardando envio`;return}
  const meta=readJson(DP_SYNC_META_KEY,{});
  if(meta.lastConfirmedAt){badge.textContent='✓ Sincronizado';badge.classList.add('ok');return}
  badge.textContent='Sync local';
}

function dpSnapshotCurrent(reason='state_change'){
  if(!state?.sessionId)return;
  const q=dpReadQueue();q[state.sessionId]={sessionId:state.sessionId,stateJson:JSON.stringify(state),contentVersion:catalog?.contentVersion||state.contentVersion||'',queuedAt:new Date().toISOString(),reason};
  dpWriteQueue(q);dpScheduleFlush(state.completedAt||state.phase==='complete'?1200:DP_SYNC_NORMAL_DELAY);
}
function dpScheduleFlush(delay=DP_SYNC_NORMAL_DELAY){if(dpSyncTimer)return;dpSyncTimer=setTimeout(()=>{dpSyncTimer=null;dpFlushQueue()},delay)}
async function dpFlushQueue(){
  if(dpSyncRunning)return;const cfg=readConfig(),queue=dpReadQueue();
  if(!Object.keys(queue).length){dpUpdateSyncBadge();return}
  if(!navigator.onLine||!cfg.endpoint||!cfg.token||!cfg.deviceId){dpUpdateSyncBadge();dpScheduleFlush(DP_SYNC_RETRY_DELAY);return}
  dpSyncRunning=true;dpUpdateSyncBadge();const remaining={...queue};
  try{for(const [id,item] of Object.entries(queue)){const checksum=await sha256(item.stateJson);try{
    void fetch(cfg.endpoint,{method:'POST',mode:'no-cors',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'push_session_state',token:cfg.token,device_id:cfg.deviceId,app_version:APP_VERSION,content_version:item.contentVersion,session_id:id,checksum,state_json:item.stateJson})}).catch(()=>{});
    let confirmed=null;for(let attempt=0;attempt<5&&!confirmed;attempt++){await new Promise(r=>setTimeout(r,attempt===0?900:1400));try{const meta=await jsonp(cfg.endpoint,{action:'session_state_meta',token:cfg.token,device_id:cfg.deviceId,session_id:id},9000);if(meta?.found&&meta.checksum===checksum)confirmed=meta}catch{}}
    if(confirmed){delete remaining[id];localStorage.setItem(DP_SYNC_META_KEY,JSON.stringify({lastConfirmedAt:confirmed.updated_at||new Date().toISOString(),sessionId:id}))}
  }catch(error){console.warn('Auto-sync não confirmado para',id,error)}}}finally{dpWriteQueue(remaining);dpSyncRunning=false;if(Object.keys(remaining).length)dpScheduleFlush(DP_SYNC_RETRY_DELAY)}
}

const dpBaseSaveState=saveState;
saveState=function(){dpBaseSaveState();dpSnapshotCurrent('checkpoint')};
const dpBaseSessionLocalStatus=sessionLocalStatus;
sessionLocalStatus=function(id){if(DP_CANONICAL_COMPLETED[id])return'concluida';return dpBaseSessionLocalStatus(id)};
const dpBaseRenderPlannerSession=renderPlannerSession;
renderPlannerSession=function(row){
  if(!dpCanonicalOnly(row.id))return dpBaseRenderPlannerSession(row);
  return `<article class="road-session current" data-road-id="${esc(row.id)}"><div class="road-top"><div><div class="road-code">${esc(row.id)}</div><div class="road-title">${esc(row.title)}</div><div class="road-topic">${esc(row.topic)}</div></div>${chip('concluida')}</div><div class="road-actions"><button class="ghost grow" disabled>Resultado registrado</button></div><div class="prepare-note">Conclusão confirmada na base compartilhada; o checkpoint detalhado deste contexto local não será inventado.</div></article>`;
};

function dpSetHomeDashboard(){
  const rows=Object.values(ROADMAP).flat(),statuses=rows.map(r=>sessionLocalStatus(r[0]));
  const done=statuses.filter(s=>s==='concluida').length,ready=statuses.filter(s=>s==='pronta').length,course=statuses.filter(s=>s==='em_curso').length,pending=statuses.filter(s=>s==='pendente_geracao').length;
  const labels=document.querySelectorAll('.stats .stat span');
  if(labels.length>=4){labels[0].textContent='sessões concluídas';labels[1].textContent='prontas';labels[2].textContent='em curso';labels[3].textContent='aguardando geração'}
  $('conceptStat').textContent=`${done}/${rows.length}`;$('immediateStat').textContent=ready;$('finalStat').textContent=course;$('timeStat').textContent=pending;
  $('progressBar').style.width=`${rows.length?100*done/rows.length:0}%`;$('progressText').textContent=`Visão geral da trilha · ${done} concluídas de ${rows.length} planejadas no mapa atual`;$('phaseBadge').textContent='Início';
}

const dpBasePlannerRenderHome=renderHome;
renderHome=function(){dpBasePlannerRenderHome();dpSetHomeDashboard();dpUpdateSyncBadge()};

// O relógio do app chama renderStats a cada segundo. Na Home ele não pode
// repintar o painel com os dados da última sessão aberta.
const dpBaseRenderStats=renderStats;
renderStats=function(){
  if(dpHomeVisible()){dpSetHomeDashboard();return}
  const labels=document.querySelectorAll('.stats .stat span');
  if(labels.length>=4){labels[0].textContent='conceitos';labels[1].textContent='fixações';labels[2].textContent='questões finais';labels[3].textContent='tempo ativo'}
  dpBaseRenderStats();
};

const dpBaseSyncNow=syncNow;
syncNow=async function(){await dpFlushQueue();return dpBaseSyncNow()};
window.addEventListener('online',()=>{dpUpdateSyncBadge();dpScheduleFlush(800)});window.addEventListener('offline',dpUpdateSyncBadge);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){dpSnapshotCurrent('background');dpFlushQueue()}else dpUpdateSyncBadge()});
window.addEventListener('pagehide',()=>{dpSnapshotCurrent('pagehide');dpFlushQueue()});
setInterval(()=>{if(dpQueueCount())dpFlushQueue()},60000);
setTimeout(()=>{dpUpdateSyncBadge();if(dpQueueCount())dpScheduleFlush(1500);if(dpHomeVisible())dpSetHomeDashboard()},300);
