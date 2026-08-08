'use strict';

const SIM_CATALOG_URL='./simulados/catalog.json';
const SIM_STATE_KEY='dataprev_simulados_states_v1';
const SIM_QUEUE_KEY='dataprev_simulados_generation_queue_v1';
let simCatalog={simulados:[],targetReadyBuffer:2,examModel:null};
let simCurrent=null;
let simState=null;
let simLoaded=false;

function simReadStates(){return readJson(SIM_STATE_KEY,{})||{}}
function simWriteStates(map){localStorage.setItem(SIM_STATE_KEY,JSON.stringify(map))}
function simFreshState(id){return{simuladoId:id,currentIndex:0,answers:{},startedAt:'',completedAt:'',activeMs:0,timerRunning:false,lastTick:Date.now(),generationTriggered:false}}
function simGetState(id){return{...simFreshState(id),...(simReadStates()[id]||{}),simuladoId:id}}
function simSaveState(){if(!simState?.simuladoId)return;simState.lastTick=Date.now();const map=simReadStates();map[simState.simuladoId]=JSON.parse(JSON.stringify(simState));simWriteStates(map)}
function simStatus(item){const s=simReadStates()[item.id];if(s?.completedAt)return'completed';if(s?.startedAt)return'in_progress';return item.status||'locked'}
function simChip(status){const m={completed:['Concluído','done'],in_progress:['Em curso','course'],ready:['Pronto','ready'],preparing_initial:['Preparação inicial','pending'],pending_generation:['Em preparação','pending'],locked:['Bloqueado','locked'],error:['Falha','pending']};const [label,cls]=m[status]||[status,'locked'];return `<span class="status-chip ${cls}">${label}</span>`}

async function simLoadCatalog(){
  try{const r=await fetch(SIM_CATALOG_URL+'?v=2',{cache:'no-store'});if(!r.ok)throw new Error('catálogo indisponível');const data=await r.json();simCatalog=data||simCatalog;simLoaded=true;if(document.getElementById('catalogCard')&&!document.getElementById('homePanel')?.classList.contains('hidden'))simInjectHome()}catch(error){console.warn('Simulados:',error)}
}

function simInjectHome(){
  const shell=document.querySelector('#catalogCard .catalog-shell');if(!shell)return;
  shell.querySelector('.simulados-block')?.remove();
  const sims=simCatalog.simulados||[];
  const counts=sims.reduce((a,item)=>{const st=simStatus(item);a[st]=(a[st]||0)+1;return a},{});
  const ready=(counts.ready||0),course=(counts.in_progress||0),done=(counts.completed||0),pending=(counts.preparing_initial||0)+(counts.pending_generation||0);
  const rows=sims.map(item=>{
    const st=simStatus(item),state=simReadStates()[item.id]||{},answered=Object.values(state.answers||{}).filter(x=>x?.confirmed).length;
    let action='';
    if(st==='completed')action=`<button class="ghost grow" data-open-sim="${esc(item.id)}">Ver resultado</button>`;
    else if(st==='in_progress')action=`<button class="primary grow" data-open-sim="${esc(item.id)}">Retomar simulado</button>`;
    else if(st==='ready')action=`<button class="primary grow" data-open-sim="${esc(item.id)}">Iniciar simulado</button>`;
    else if(st==='preparing_initial'||st==='pending_generation')action='<button class="grow" disabled>Conteúdo em preparação</button>';
    else action='<button class="grow" disabled>Aguardando sequência</button>';
    return `<article class="road-session ${st==='locked'?'locked':''}${['ready','in_progress'].includes(st)?' current':''}"><div class="road-top"><div><div class="road-code">${esc(item.id)}</div><div class="road-title">${esc(item.title)}</div><div class="road-topic">70 questões · FGV realista · edital completo${answered?` · ${answered}/70 respondidas`:''}</div></div>${simChip(st)}</div><div class="road-actions">${action}</div></article>`;
  }).join('');
  const block=document.createElement('section');block.className='discipline-block simulados-block';block.innerHTML=`<button class="discipline-toggle" id="simToggle"><div class="discipline-main"><div class="discipline-name">Simulados completos</div><div class="discipline-summary">${done} concluído${done===1?'':'s'} · ${ready} pronto${ready===1?'':'s'} · ${course} em curso${pending?` · ${pending} em preparação`:''}</div><div class="mini-progress"><span style="width:${sims.length?100*done/sims.length:0}%"></span></div></div><div class="discipline-right"><span class="pill">estoque alvo: 2</span><span class="discipline-chevron">⌄</span></div></button><div class="discipline-body"><div class="sim-exam-note"><b>Modelo:</b> 70 questões cobrando todo o escopo do edital, inclusive assuntos ainda não estudados. Ao confirmar cada questão, a correção aparece imediatamente. O apoio de assunto só marca <b>com apoio</b> quando aberto antes da resposta.</div><div class="discipline-scroll">${simLoaded?rows:'<div class="road-empty">Carregando simulados…</div>'}</div></div>`;
  const list=shell.querySelector('.discipline-list');if(list)list.insertAdjacentElement('afterend',block);else shell.appendChild(block);
  block.querySelector('#simToggle').onclick=()=>block.classList.toggle('open');
  block.querySelectorAll('[data-open-sim]').forEach(btn=>btn.onclick=()=>simOpen(btn.dataset.openSim));
}

function simValidateQuestion(q,index){
  if(!q||!q.id)throw new Error(`questão ${index+1} sem ID`);
  if(!Array.isArray(q.options)||q.options.length!==5)throw new Error(`${q.id}: são exigidas 5 alternativas`);
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)throw new Error(`${q.id}: gabarito inválido`);
  if(!q.explanation)throw new Error(`${q.id}: falta explicação da resposta correta`);
  if(!Array.isArray(q.optionExplanations)||q.optionExplanations.length!==q.options.length)throw new Error(`${q.id}: faltam explicações individuais das alternativas`);
  if(!q.support?.summary&&!q.support?.concept)throw new Error(`${q.id}: falta bloco de explicação do assunto`);
}
async function simOpen(id){
  const item=(simCatalog.simulados||[]).find(x=>x.id===id);if(!item)return;
  const st=simStatus(item);
  if(!['ready','in_progress','completed'].includes(st))return setStatus('Este simulado ainda não está pronto.','bad');
  if(!item.file)return setStatus('Arquivo do simulado ainda não foi publicado.','bad');
  try{
    const r=await fetch('./simulados/'+item.file+'?v=2',{cache:'no-store'});if(!r.ok)throw new Error('arquivo indisponível');const data=await r.json();
    if(!Array.isArray(data.questions)||data.questions.length!==70)throw new Error('o simulado publicado não contém exatamente 70 questões');
    data.questions.forEach(simValidateQuestion);
    simCurrent=data;simState=simGetState(id);
    if(!simState.startedAt){simState.startedAt=new Date().toISOString();simState.timerRunning=true;simState.lastTick=Date.now();simSaveState();simMaybeTriggerNext(item)}
    simRender();window.scrollTo({top:0,behavior:'smooth'});
  }catch(error){setStatus('Não foi possível abrir o simulado: '+error.message,'bad')}
}

function simMaybeTriggerNext(item){
  const sims=simCatalog.simulados||[],idx=sims.findIndex(x=>x.id===item.id);if(idx<1||simState.generationTriggered)return;
  const next=sims[idx+1];if(!next||!['locked','error'].includes(next.status||'locked'))return;
  simState.generationTriggered=true;simSaveState();
  const cfg=readConfig();if(!cfg.endpoint||!cfg.token||!cfg.deviceId)return;
  const q=readJson(SIM_QUEUE_KEY,[])||[];if(q.some(x=>x.simuladoId===next.id))return;
  q.push({simuladoId:next.id,status:'pending_generation',requestedAt:new Date().toISOString(),triggeredBy:item.id});localStorage.setItem(SIM_QUEUE_KEY,JSON.stringify(q));
  jsonp(cfg.endpoint,{action:'request_simulado_generation',token:cfg.token,device_id:cfg.deviceId,simulado_id:next.id,trigger_type:'buffer_on_start',requested_simulados:1},20000).catch(error=>console.warn('Gatilho de simulado não confirmado:',error));
}

function simUpdateClock(){if(!simState?.timerRunning)return;const now=Date.now();if(document.visibilityState==='visible'){const d=Math.max(0,now-(simState.lastTick||now));if(d<=15000)simState.activeMs+=d}simState.lastTick=now;simSaveState()}
function simSupportHtml(q,rec){const s=q.support||{};let note='';if(rec.supported)note='Esta questão foi marcada como respondida com apoio porque este conteúdo foi aberto antes da confirmação.';else if(rec.confirmed)note='Revisão pós-resposta: abrir este conteúdo agora não altera o indicador de apoio.';else note='Se você abrir este bloco antes de confirmar a resposta, o uso de apoio será registrado automaticamente.';return `<div class="sim-support ${rec.supportOpen?'':'hidden'}"><div class="support-box"><h3>${rec.confirmed?'Revisar / aprofundar assunto':'Explorar assunto'}</h3>${s.concept?`<p><b>Conceito:</b> ${esc(s.concept)}</p>`:''}${s.summary?`<p>${esc(s.summary)}</p>`:''}${s.example?`<p><b>Exemplo:</b> ${esc(s.example)}</p>`:''}${s.trap?`<p><b>Pegadinha FGV:</b> ${esc(s.trap)}</p>`:''}${s.terms?`<p><b>Vocabulário e equivalências:</b> ${esc(s.terms)}</p>`:''}<p class="small">${note}</p></div></div>`}
function simCorrectionHtml(q,rec){
  if(!rec.confirmed)return'';
  const ok=rec.selected===q.answer;
  const opts=q.options.map((o,i)=>{const marker=i===q.answer?'✓ correta':(i===rec.selected?'✕ marcada':'incorreta');return `<div class="sim-option-explanation ${i===q.answer?'is-correct':i===rec.selected?'is-selected-wrong':''}"><b>${String.fromCharCode(65+i)}. ${esc(o)} — ${marker}</b><div>${esc(q.optionExplanations[i])}</div></div>`}).join('');
  return `<section class="sim-correction ${ok?'ok':'bad'}"><div class="feedback ${ok?'ok':'bad'}"><b>${ok?'Correto.':'Incorreto.'}</b> ${esc(q.explanation)}</div><div class="sim-option-explanations">${opts}</div></section>`;
}
function simRender(){
  if(!simCurrent||!simState)return;show('simuladoPanel');
  if(simState.completedAt)return simRenderResult();
  const q=simCurrent.questions[simState.currentIndex],rec=simState.answers[q.id]||{};const answered=Object.values(simState.answers).filter(x=>x?.confirmed).length;
  $('simuladoPanel').innerHTML=`<div class="sim-head"><div><div class="kicker">${esc(simCurrent.id)} · Questão ${simState.currentIndex+1} de 70</div><h1>${esc(q.discipline||'Simulado')}</h1><div class="small">${answered}/70 confirmadas · tempo ativo ${fmt(simState.activeMs)}${rec.supported?' · com apoio':''}</div></div><button id="simExit">Voltar à trilha</button></div><div class="progress"><div style="width:${100*answered/70}%"></div></div><div class="exercise"><p style="white-space:pre-wrap">${esc(q.prompt)}</p>${q.options.map((o,i)=>{let cls='alt';if(rec.selected===i)cls+=' selected';if(rec.confirmed&&i===q.answer)cls+=' correct';if(rec.confirmed&&rec.selected===i&&i!==q.answer)cls+=' wrong';return `<button class="${cls}" data-sim-choice="${i}" ${rec.confirmed?'disabled':''}>${String.fromCharCode(65+i)}. ${esc(o)}</button>`}).join('')}</div><button id="simSupportBtn" class="ghost" style="width:100%;margin-top:10px">${rec.supportOpen?'Fechar assunto':rec.confirmed?'Revisar / explorar assunto':'Explorar assunto / Não entendi'}</button>${simSupportHtml(q,rec)}<div class="confidence">${['baixa','media','alta'].map(v=>`<button data-sim-confidence="${v}" class="${rec.confidence===v?'active':''}" ${rec.confirmed?'disabled':''}>${v==='media'?'Média':v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div>${simCorrectionHtml(q,rec)}<div class="sim-nav"><button id="simPrev" ${simState.currentIndex===0?'disabled':''}>Anterior</button>${rec.confirmed?`<button id="simNext" class="primary">${simState.currentIndex===69?'Finalizar simulado':'Próxima questão'}</button>`:'<button id="simConfirm" class="primary">Corrigir resposta</button>'}</div><div class="small" style="margin-top:10px">${rec.confirmed?'A resposta desta questão está travada. Você pode revisar o assunto agora sem alterar o registro de apoio.':'A correção comentada aparece assim que você confirmar a resposta.'}</div>`;
  $('simExit').onclick=()=>{simUpdateClock();simState.timerRunning=false;simSaveState();simCurrent=null;simState=null;renderHome();renderStats();scrollTop()};
  document.querySelectorAll('[data-sim-choice]').forEach(btn=>btn.onclick=()=>{if(rec.confirmed)return;rec.selected=Number(btn.dataset.simChoice);simState.answers[q.id]=rec;simSaveState();simRender()});
  document.querySelectorAll('[data-sim-confidence]').forEach(btn=>btn.onclick=()=>{if(rec.confirmed)return;rec.confidence=btn.dataset.simConfidence;simState.answers[q.id]=rec;simSaveState();simRender()});
  $('simSupportBtn').onclick=()=>{rec.supportOpen=!rec.supportOpen;if(rec.supportOpen&&!rec.confirmed){rec.supported=true;rec.supportOpenedAt=rec.supportOpenedAt||new Date().toISOString()}else if(rec.supportOpen&&rec.confirmed){rec.postAnswerReviewOpenedAt=rec.postAnswerReviewOpenedAt||new Date().toISOString()}simState.answers[q.id]=rec;simSaveState();simRender()};
  $('simPrev').onclick=()=>{simUpdateClock();simState.currentIndex=Math.max(0,simState.currentIndex-1);simSaveState();simRender();scrollTop()};
  if(!rec.confirmed)$('simConfirm').onclick=()=>{if(rec.selected===undefined)return alert('Marque uma alternativa.');if(!rec.confidence)return alert('Informe sua segurança.');rec.confirmed=true;rec.correct=rec.selected===q.answer;rec.answeredAt=new Date().toISOString();simState.answers[q.id]=rec;simUpdateClock();simSaveState();simRender();scrollTop()};
  else $('simNext').onclick=()=>{simUpdateClock();if(simState.currentIndex<69){simState.currentIndex++;simSaveState();simRender();scrollTop()}else simFinish()};
}
function simFinish(){const confirmed=Object.values(simState.answers||{}).filter(x=>x?.confirmed).length;if(confirmed<70&&!confirm(`Você confirmou ${confirmed}/70 questões. Deseja finalizar mesmo assim?`))return;simUpdateClock();simState.timerRunning=false;simState.completedAt=new Date().toISOString();simSaveState();simRenderResult();scrollTop()}
function simRenderResult(){
  const qs=simCurrent.questions||[],answers=simState.answers||{};let raw=0,supported=0,specific=0,specificCorrect=0;const by={};
  qs.forEach(q=>{const r=answers[q.id]||{},ok=r.selected===q.answer;if(ok)raw++;if(r.supported)supported++;const d=q.discipline||'Outros';by[d]=by[d]||{total:0,correct:0};by[d].total++;if(ok)by[d].correct++;if(q.group==='specific'){specific++;if(ok)specificCorrect++}});
  const weightedGeneral=qs.filter(q=>q.group!=='specific').reduce((a,q)=>a+((answers[q.id]?.selected===q.answer)?1:0),0);const weighted=weightedGeneral+specificCorrect*2.5;
  $('simuladoPanel').innerHTML=`<div class="kicker">Simulado concluído</div><h1>${esc(simCurrent.title||simCurrent.id)}</h1><div class="stats sim-result-stats"><div class="stat"><b>${raw}/70</b><span>acertos brutos</span></div><div class="stat"><b>${weighted.toFixed(1)}</b><span>pontuação ponderada</span></div><div class="stat"><b>${specificCorrect}/${specific}</b><span>específicas</span></div><div class="stat"><b>${supported}</b><span>com apoio</span></div></div><h2>Desempenho por disciplina</h2><div class="sim-breakdown">${Object.entries(by).map(([d,v])=>`<div><b>${esc(d)}</b><span>${v.correct}/${v.total}</span></div>`).join('')}</div><details class="panel" open><summary>Revisão por questão</summary><div class="sim-review-list">${qs.map((q,i)=>{const r=answers[q.id]||{},ok=r.selected===q.answer;return `<details class="sim-review-item"><summary>Q${i+1} · ${esc(q.discipline||'')} · ${ok?'✓':'✕'}${r.supported?' · com apoio':''}</summary><p>${esc(q.prompt)}</p><p><b>Sua resposta:</b> ${r.selected===undefined?'—':esc(q.options[r.selected])}</p><p><b>Gabarito:</b> ${esc(q.options[q.answer])}</p><p>${esc(q.explanation||'')}</p>${q.optionExplanations?.map((x,j)=>`<p><b>${String.fromCharCode(65+j)}:</b> ${esc(x)}</p>`).join('')||''}${q.support?.summary?`<details><summary>Revisar assunto</summary><p>${esc(q.support.summary)}</p>${q.support.example?`<p><b>Exemplo:</b> ${esc(q.support.example)}</p>`:''}${q.support.trap?`<p><b>Pegadinha:</b> ${esc(q.support.trap)}</p>`:''}</details>`:''}</details>`}).join('')}</div></details><div class="row"><button id="simResultHome" class="primary">Voltar à trilha</button></div>`;
  $('simResultHome').onclick=()=>{simCurrent=null;simState=null;renderHome();renderStats();scrollTop()};
}

const simBaseShow=show;
show=function(panel){simBaseShow(panel);const p=$('simuladoPanel');if(p)p.classList.toggle('hidden',panel!=='simuladoPanel')};
const simBaseRenderHome=renderHome;
renderHome=function(){simBaseRenderHome();simInjectHome()};

document.addEventListener('visibilitychange',()=>{if(simState){if(document.visibilityState==='hidden')simUpdateClock();else simState.lastTick=Date.now()}});
setInterval(()=>{if(simState?.timerRunning){simUpdateClock();const el=document.querySelector('#simuladoPanel .sim-head .small');if(el){const answered=Object.values(simState.answers||{}).filter(x=>x?.confirmed).length;el.textContent=`${answered}/70 confirmadas · tempo ativo ${fmt(simState.activeMs)}`}}},1000);
simLoadCatalog();
