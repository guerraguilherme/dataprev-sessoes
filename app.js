'use strict';
const APP_VERSION='0.7.15';
const CONTENT_VERSION='2026.08.21-sessoes-17';
const STATE_MAP_KEY='dataprev_sessoes_states_v2';
const LEGACY_STATE_KEY='dataprev_sessoes_state_v1';
const SESSIONS_CFG_KEY='dataprev_sessoes_sync_config_v1';
const CARDS_CFG_KEY='dataprev_cards_sync_config_v1';
const CONTENT_BASE='./';
const CONTENT_FILES=['sessions.json','PY-COND-R01.json','MAT-ALG-002.json','BD-NORM-002.json'];
const REASONS={symbols:'Símbolos e nomenclatura',intuition:'Ideia intuitiva',calculation:'Cálculo ou passos',connection:'Conexão com o que já estudei'};
let catalog={contentVersion:CONTENT_VERSION,sessions:[]};
let session=null;
let state=null;
let tick=null;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=ms=>{const t=Math.floor((ms||0)/1000);return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`};
const clone=value=>JSON.parse(JSON.stringify(value));
const optionId=(q,index)=>String(q?.optionIds?.[index]||`option_${index+1}`);
const correctOptionId=q=>String(q?.correctOptionId||optionId(q,q?.answer));
const optionIndex=(q,id)=>{const i=(q?.optionIds||[]).indexOf(String(id));return i>=0?i:-1};
const correctOptionIndex=q=>{const i=optionIndex(q,correctOptionId(q));return i>=0?i:Number(q?.answer)};
const selectedOptionIndex=(q,rec)=>{const i=optionIndex(q,rec?.selectedOptionId);return i>=0?i:Number.isInteger(rec?.selected)?rec.selected:-1};
const attemptOptionId=(q,attempt)=>String(attempt?.optionId||attempt?.selectedOptionId||(Number.isInteger(attempt)?optionId(q,attempt):attempt||''));
const attemptOptionIndex=(q,attempt)=>{const i=optionIndex(q,attemptOptionId(q,attempt));return i>=0?i:Number.isInteger(attempt)?attempt:Number.isInteger(attempt?.presentedIndex)?attempt.presentedIndex:-1};
function optionFeedback(q,indexOrId){
  const index=Number.isInteger(indexOrId)?indexOrId:optionIndex(q,indexOrId),id=index>=0?optionId(q,index):String(indexOrId||''),byId=q?.feedbackByOption||q?.optionRationales||{};
  return String(byId[id]||q?.optionExplanations?.[index]||q?.explanation||'').trim();
}
function revealedFeedback(q,indexOrId,correct){
  const specific=optionFeedback(q,indexOrId),general=String(q?.explanation||'').trim();
  if(correct)return specific&&specific.length>=24?specific:[specific,general].filter((x,i,a)=>x&&a.indexOf(x)===i).join(' ')||'O raciocínio e o resultado estão corretos.';
  const answerText=q?.options?.[correctOptionIndex(q)]??'';
  const reconstruction=q?.explanation&&q.explanation!==specific?` ${q.explanation}`:'';
  return `${specific}${reconstruction} A resposta correta é: ${answerText}.`.trim();
}
function meaningfulJustification(value){
  const text=String(value||'').trim();
  if(/^n[aã]o\s+sei[.!?]*$/i.test(text))return true;
  return (text.match(/[\p{L}\p{N}]/gu)||[]).length>=3;
}

function freshState(id=''){
  return {sessionId:id,phase:'home',conceptIndex:0,finalIndex:0,conceptsCompleted:{},immediate:{},final:{},notes:{},support:{},startedAt:'',completedAt:'',activeMs:0,timerRunning:false,lastTick:Date.now(),contentVersion:CONTENT_VERSION};
}
function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function readMap(){return readJson(STATE_MAP_KEY,{})}
function writeMap(map){localStorage.setItem(STATE_MAP_KEY,JSON.stringify(map))}
function migrateLegacy(){
  const map=readMap();
  const legacy=readJson(LEGACY_STATE_KEY,null);
  if(legacy?.sessionId){
    const old=map[legacy.sessionId];
    if(!old||(legacy.lastTick||0)>=(old.lastTick||0))map[legacy.sessionId]=legacy;
  }
  writeMap(map);
}
function getState(id){const found=readMap()[id];return {...freshState(id),...(found||{}),sessionId:id,support:found?.support||{}}}
function saveState(){
  if(!state?.sessionId)return;
  state.lastTick=Date.now();
  state.contentVersion=catalog.contentVersion;
  const map=readMap();map[state.sessionId]=clone(state);writeMap(map);
  localStorage.setItem(LEGACY_STATE_KEY,JSON.stringify(state));
}
function readConfig(){
  for(const key of [SESSIONS_CFG_KEY,CARDS_CFG_KEY]){
    const cfg=readJson(key,null);
    if(cfg?.endpoint&&cfg?.token&&cfg?.deviceId)return {endpoint:String(cfg.endpoint).trim(),token:String(cfg.token).trim(),deviceId:String(cfg.deviceId).trim()};
  }
  return {endpoint:'',token:'',deviceId:''};
}
function saveConfig(cfg){
  const clean={endpoint:String(cfg.endpoint||'').trim(),token:String(cfg.token||'').trim(),deviceId:String(cfg.deviceId||'').trim()};
  localStorage.setItem(SESSIONS_CFG_KEY,JSON.stringify(clean));
  return clean;
}
function status(id){const s=readMap()[id];if(!s?.startedAt)return'Não iniciada';if(s.completedAt||s.phase==='complete')return'Concluída';return'Em andamento'}
function setStatus(message,type=''){$('syncStatus').textContent=message;$('syncStatus').className='status'+(type?' '+type:'')}
function show(panel){['homePanel','studyPanel','reportPanel'].forEach(id=>$(id).classList.toggle('hidden',id!==panel))}
function scrollTop(){window.scrollTo({top:0,behavior:'smooth'})}

function jsonp(endpoint,params,timeout=20000){
  return new Promise((resolve,reject)=>{
    const cb='dpSess_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const script=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();reject(new Error('Tempo esgotado.'))},timeout);
    function cleanup(){clearTimeout(timer);delete window[cb];script.remove()}
    window[cb]=data=>{cleanup();data?.ok===false?reject(new Error(data.error||'Falha no serviço.')):resolve(data)};
    const url=new URL(endpoint);Object.entries({...params,callback:cb}).forEach(([k,v])=>url.searchParams.set(k,v));
    script.src=url;script.onerror=()=>{cleanup();reject(new Error('Não foi possível acessar o serviço.'))};document.head.appendChild(script);
  });
}
async function loadFallback(){
  const responses=await Promise.all(CONTENT_FILES.map(async file=>{const r=await fetch(CONTENT_BASE+file+'?v='+CONTENT_VERSION,{cache:'no-store'});if(!r.ok)throw new Error('Falha ao carregar '+file);return r.json()}));
  const all=[];for(const item of responses){if(Array.isArray(item.sessions))all.push(...item.sessions);else all.push(item)}
  const byId=new Map();all.forEach(s=>s?.id&&byId.set(s.id,s));
  return {schemaVersion:1,contentVersion:CONTENT_VERSION,sessions:[...byId.values()]};
}
async function loadRemote(){
  const cfg=readConfig();if(!cfg.endpoint)return null;
  const meta=await jsonp(cfg.endpoint,{action:'sessions_meta'});if(!meta?.found)return null;
  let page=1,total=1,sessions=[];
  do{const result=await jsonp(cfg.endpoint,{action:'sessions_page',version:meta.content_version,page,page_size:10},30000);sessions.push(...(result.sessions||[]));total=Number(result.total_pages)||1;page++}while(page<=total);
  return sessions.length?{schemaVersion:1,contentVersion:meta.content_version,sessions}:null;
}
function chooseSession(){
  const map=readMap();
  const inProgress=catalog.sessions.filter(s=>{const st=map[s.id];return st?.startedAt&&!st.completedAt&&st.phase!=='complete'}).sort((a,b)=>(map[b.id]?.lastTick||0)-(map[a.id]?.lastTick||0));
  if(inProgress.length)return inProgress[0];
  return catalog.sessions.find(s=>status(s.id)!=='Concluída')||catalog.sessions[0];
}
function applyCatalog(nextCatalog,{preferCurrent=true}={}){
  const current=session?.id;
  catalog=nextCatalog;
  const selected=preferCurrent&&current?catalog.sessions.find(s=>s.id===current):null;
  session=selected||chooseSession();
  if(!session)throw new Error('Nenhuma sessão disponível no catálogo.');
  state=getState(session.id);
  $('contentSummary').textContent=`${catalog.contentVersion} · ${catalog.sessions.length} sessões · PWA ${APP_VERSION}`;
}
async function loadCatalog({preferCurrent=true,includeRemote=true}={}){
  const fallback=await loadFallback();
  applyCatalog(fallback,{preferCurrent});
  if(!includeRemote)return;
  let remote=null;
  try{remote=await loadRemote()}catch(error){console.warn('Consulta remota não bloqueante:',error)}
  if(remote?.sessions?.length)applyCatalog(remote,{preferCurrent:true});
}

function updateClock(){
  if(!state)return;
  const now=Date.now();
  if(state.timerRunning&&document.visibilityState==='visible'){const delta=Math.max(0,now-(state.lastTick||now));if(delta<=15000)state.activeMs+=delta;}
  state.lastTick=now;saveState();$('timeStat').textContent=fmt(state.activeMs);
}
function startTimer(){if(!state.startedAt)state.startedAt=new Date().toISOString();state.timerRunning=true;state.lastTick=Date.now();saveState();renderStats()}
function pauseTimer(){updateClock();state.timerRunning=false;saveState();renderStats()}
function immediateAll(){return session?.concepts?.flatMap(c=>c.immediate||[])||[]}
function immediateCorrect(){return Object.values(state?.immediate||{}).filter(x=>x.correct).length}
function finalAnswered(){return Object.values(state?.final||{}).filter(x=>x.submitted).length}
function finalCorrect(){return Object.values(state?.final||{}).filter(x=>x.submitted&&x.correct).length}
function renderStats(){
  if(!session||!state)return;
  const concepts=Object.keys(state.conceptsCompleted||{}).length;
  const finals=finalAnswered();
  const total=(session.concepts?.length||0)+(session.finalQuestions?.length||0);
  const done=concepts+finals;
  $('conceptStat').textContent=`${concepts}/${session.concepts?.length||0}`;$('immediateStat').textContent=immediateCorrect();$('finalStat').textContent=finals;$('timeStat').textContent=fmt(state.activeMs);
  $('progressBar').style.width=`${total?100*done/total:0}%`;
  $('progressText').textContent=state.completedAt?'Sessão concluída':state.startedAt?`${concepts} conceitos e ${finals} questões finais concluídos`:'Sessão disponível';
  $('phaseBadge').textContent=state.completedAt?'Concluída':state.phase==='concepts'?'Conceitos':state.phase==='final'?'Questões finais':'Início';
  $('timerBtn').textContent=state.timerRunning?'Pausar tempo':'Retomar tempo';
}
function render(){renderStats();if(state.completedAt||state.phase==='complete')renderComplete();else if(state.phase==='concepts')renderConcept();else if(state.phase==='final')renderFinal();else renderHome()}

function renderHome(){
  show('homePanel');
  const cards=catalog.sessions.map((item,index)=>{
    const st=status(item.id);const action=st==='Concluída'?'Ver resultado':st==='Em andamento'?'Retomar':'Iniciar';
    return `<article class="session-item"><div class="kicker">${index+1} · ${esc(item.discipline)} · ${esc(item.topic)}</div><h2>${esc(item.title)}</h2><p>${esc(item.objective)}</p><div class="meta"><span class="pill">${item.estimatedMinutes} min</span><span class="pill">Prioridade ${esc(item.priority)}</span><span class="pill">${st}</span></div><button class="${st==='Em andamento'?'primary':'ghost'}" data-open-session="${esc(item.id)}">${action}</button></article>`;
  }).join('');
  $('catalogCard').innerHTML=`<div class="kicker">Trilha do Controle Geral</div><h1>Sessões disponíveis</h1><p>Avanço do Plano Mestre com revisão adaptativa sem substituir a cobertura do edital.</p>${cards}`;
  document.querySelectorAll('[data-open-session]').forEach(button=>button.onclick=()=>openSession(button.dataset.openSession));
}
function inferPhase(s){if(s.completedAt)return'complete';if(s.phase==='final'||Object.keys(s.final||{}).length)return'final';return'concepts'}
function openSession(id){
  updateClock();state.timerRunning=false;saveState();
  session=catalog.sessions.find(s=>s.id===id);state=getState(id);
  if(state.completedAt){state.phase='complete';saveState();render();scrollTop();return}
  state.phase=inferPhase(state);startTimer();render();scrollTop();
}

function supportRecord(id){state.support=state.support||{};return state.support[id]||(state.support[id]={opened:false,reasons:[],viewed:[],resolved:false,autoOpened:false,check:null})}
function supportData(concept){
  if(concept.id==='MAT-ALG-C04')return {
    intro:'Produto vetorial é abstrato e introduz nova notação. Abra somente o ponto que travou.',
    sections:{
      symbols:{title:'O que são i, j e k?',html:'<p><b>i=(1,0,0)</b> aponta no eixo x; <b>j=(0,1,0)</b> no eixo y; <b>k=(0,0,1)</b> no eixo z.</p><div class="axes"><span>i → direita</span><span>j → frente</span><span>k → cima</span></div>'},
      intuition:{title:'Ideia intuitiva',html:'<p>Você fornece dois vetores e recebe um terceiro perpendicular aos dois. Se i e j estão no plano horizontal, k aponta para fora desse plano.</p>'},
      calculation:{title:'O cálculo necessário agora',html:'<ol><li>Use a relação básica <b>i × j = k</b>.</li><li>Inverter a ordem inverte o sinal.</li><li>Logo, <b>j × i = −k</b>.</li></ol><p>Determinantes e fórmula geral ficam para uma etapa posterior.</p>'},
      connection:{title:'Escalar x vetorial',html:'<p><b>u·v</b> produz um número. <b>u×v</b> produz um vetor perpendicular.</p>'}
    },
    check:{prompt:'Se i × j = k, então j × i é:',options:['−k','k','0','1'],answer:0,explanation:'Inverter a ordem inverte o sinal.'}
  };
  if(concept.support)return concept.support;
  return {intro:'Abra apenas o tipo de ajuda necessário. Isso não conta como erro.',sections:{symbols:{title:'Símbolos e termos',html:`<pre>${esc(concept.code||concept.what||'')}</pre>`},intuition:{title:'Ideia em linguagem direta',html:`<p>${esc(concept.what||'')}</p><p>${esc(concept.explanation||'')}</p>`},calculation:{title:'Sequência prática',html:`<ol><li>Identifique os dados.</li><li>Localize a propriedade central.</li><li>Aplique em um exemplo pequeno.</li><li>Confira a pegadinha: ${esc(concept.trap||'')}</li></ol>`},connection:{title:'Ligação com conhecimentos anteriores',html:`<p>${esc(concept.connection||'')}</p>`}},check:null};
}
function renderAdaptive(concept){
  const rec=supportRecord(concept.id),data=supportData(concept);
  const sections=(rec.viewed||[]).map(key=>data.sections[key]?`<div class="support-box"><h3>${data.sections[key].title}</h3>${data.sections[key].html}</div>`:'').join('');
  let check='';if(data.check&&rec.reasons.length){const answered=rec.check;check=`<div class="support-box"><h3>Microchecagem de resgate</h3><p>${data.check.prompt}</p>${data.check.options.map((o,i)=>{let cls='';if(answered&&i===data.check.answer)cls='correct';if(answered&&answered.selected===i&&!answered.correct)cls='wrong';return `<button class="alt ${cls}" data-support-check="${i}" ${answered?'disabled':''}>${String.fromCharCode(65+i)}. ${esc(o)}</button>`}).join('')}${answered?`<div class="feedback ${answered.correct?'ok':'bad'}">${answered.correct?'Correto.':'Ainda não.'} ${data.check.explanation}</div>`:''}</div>`}
  return `<section class="adaptive"><button id="adaptiveToggle">${rec.resolved?'✓ Ajuda usada — abrir novamente':rec.autoOpened?'⚠ Resgate recomendado':'▸ Não entendi — destravar conceito'}</button><div id="adaptivePanel" class="adaptive-panel ${rec.opened?'':'hidden'}"><p class="small">${data.intro}</p><div class="reason-grid">${Object.entries(REASONS).map(([k,v])=>`<button data-reason="${k}" class="${rec.reasons.includes(k)?'active':''}">${v}</button>`).join('')}</div>${sections}${check}<div class="row" style="margin-top:10px"><button id="supportResolved" class="primary">Entendi agora</button><button id="supportClose">Fechar ajuda</button></div></div></section>`;
}
function conceptDone(concept){return (concept.immediate||[]).every(q=>state.immediate[q.id]?.correct)}
function conceptDisclosureText(concept,kind){
  const support=concept?.supportDetails||{};
  const values=kind==='connection'
    ?[concept?.connection,support.connection]
    :[concept?.trap,support.trap,concept?.commonError,support.commonError];
  return [...new Set(values.map(value=>String(value||'').trim()).filter(Boolean))].join(' ');
}
function renderConceptDisclosure(concept,kind,label){
  const text=conceptDisclosureText(concept,kind);
  if(!text)return'';
  return `<details class="info ${kind} concept-disclosure"><summary>${esc(label)}</summary><div class="concept-disclosure-body">${esc(text)}</div></details>`;
}
function renderConcept(){
  show('studyPanel');const concept=session.concepts[state.conceptIndex];
  $('studyKicker').textContent=`Conceito ${state.conceptIndex+1} de ${session.concepts.length}`;$('studyTitle').textContent=concept.title;
  const exercises=(concept.immediate||[]).map((q,n)=>{const rec=state.immediate[q.id]||{},selected=selectedOptionIndex(q,rec),wrong=optionIndex(q,rec.lastWrongOptionId)>=0?optionIndex(q,rec.lastWrongOptionId):Number.isInteger(rec.lastWrong)?rec.lastWrong:-1,correct=correctOptionIndex(q);const feedback=rec.correct?revealedFeedback(q,rec.selectedOptionId||selected,true):wrong>=0?revealedFeedback(q,rec.lastWrongOptionId||wrong,false):'';return `<div class="exercise"><h3>Fixação imediata ${n+1}</h3><p>${esc(q.prompt)}</p>${q.options.map((o,i)=>{let cls='alt';if(selected===i)cls+=' selected';if(rec.correct&&i===correct)cls+=' correct';if(wrong===i)cls+=' wrong';return `<button class="${cls}" data-immediate="${q.id}" data-index="${i}" data-option-id="${esc(optionId(q,i))}" ${rec.correct?'disabled':''}>${String.fromCharCode(65+i)}. ${esc(o)}</button>`}).join('')}${rec.correct?`<div class="feedback ok">Correto. ${esc(feedback)}</div>`:wrong>=0?`<div class="feedback bad">Ainda não. ${esc(feedback)} Tente reconstruir o código antes de marcar novamente.</div>`:''}</div>`}).join('');
  $('studyBody').innerHTML=`<div class="info concept"><b>O que preciso saber</b><br>${esc(concept.what)}</div><div class="info concept"><b>Explicação objetiva</b><br>${esc(concept.explanation)}</div>${concept.code?`<pre>${esc(concept.code)}</pre>`:''}${renderConceptDisclosure(concept,'connection','Conexão com o que você já estudou')}${renderConceptDisclosure(concept,'trap','Pegadinha e erro comum')}${renderAdaptive(concept)}${exercises}<details style="margin-top:12px"><summary>Minha nota sobre este conceito</summary><textarea id="conceptNote">${esc(state.notes[concept.id]||'')}</textarea></details><div class="row" style="margin-top:14px"><button id="prevConcept" ${state.conceptIndex===0?'disabled':''}>Anterior</button><button id="nextConcept" class="primary">${state.conceptIndex===session.concepts.length-1?'Ir para questões finais':'Próximo conceito'}</button></div>`;
  document.querySelectorAll('[data-immediate]').forEach(btn=>btn.onclick=()=>answerImmediate(btn.dataset.immediate,Number(btn.dataset.index)));
  $('conceptNote').oninput=e=>{state.notes[concept.id]=e.target.value;saveState()};
  $('prevConcept').onclick=()=>{state.conceptIndex--;saveState();render();scrollTop()};
  $('nextConcept').onclick=()=>{if(!conceptDone(concept))return alert('Acerte a fixação imediata antes de avançar.');state.conceptsCompleted[concept.id]=true;if(state.conceptIndex<session.concepts.length-1)state.conceptIndex++;else{state.phase='final';state.finalIndex=0}saveState();render();scrollTop()};
  wireAdaptive(concept);
}
function wireAdaptive(concept){
  const rec=supportRecord(concept.id),data=supportData(concept);
  $('adaptiveToggle').onclick=()=>{rec.opened=!rec.opened;if(rec.opened&&!rec.openedAt)rec.openedAt=new Date().toISOString();saveState();renderConcept()};
  document.querySelectorAll('[data-reason]').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.reason;if(!rec.reasons.includes(key))rec.reasons.push(key);if(!rec.viewed.includes(key))rec.viewed.push(key);rec.opened=true;saveState();renderConcept()});
  document.querySelectorAll('[data-support-check]').forEach(btn=>btn.onclick=()=>{const selected=Number(btn.dataset.supportCheck);rec.check={selected,correct:selected===data.check.answer,answeredAt:new Date().toISOString()};saveState();renderConcept()});
  $('supportResolved').onclick=()=>{rec.resolved=true;rec.resolvedAt=new Date().toISOString();rec.opened=false;saveState();renderConcept()};
  $('supportClose').onclick=()=>{rec.opened=false;saveState();renderConcept()};
}
function answerImmediate(id,index){
  const concept=session.concepts[state.conceptIndex],q=(concept.immediate||[]).find(x=>x.id===id),rec=state.immediate[id]||{attempts:[]};
  const previous=rec.attempts||[],legacyFirst=previous[0];
  if(!rec.firstAttemptOptionId&&legacyFirst!==undefined){rec.firstAttemptOptionId=attemptOptionId(q,legacyFirst);rec.firstAttempt=attemptOptionIndex(q,legacyFirst)}
  const chosenId=optionId(q,index),answeredAt=new Date().toISOString();
  rec.attempts=[...previous,{optionId:chosenId,presentedIndex:index,answeredAt}];if(!rec.firstAttemptOptionId){rec.firstAttempt=index;rec.firstAttemptOptionId=chosenId}rec.selected=index;rec.selectedOptionId=chosenId;rec.correctOptionId=correctOptionId(q);rec.correct=chosenId===rec.correctOptionId;rec.answeredAt=answeredAt;if(rec.correct){delete rec.lastWrong;delete rec.lastWrongOptionId}else{rec.lastWrong=index;rec.lastWrongOptionId=chosenId}state.immediate[id]=rec;
  if(!rec.correct&&rec.attempts.length>=2){const support=supportRecord(concept.id);support.recommended=true;support.recommendedAt=support.recommendedAt||new Date().toISOString()}
  saveState();renderConcept();
}

function renderFinal(){
  show('studyPanel');const q=session.finalQuestions[state.finalIndex],rec=state.final[q.id]||{};
  $('studyKicker').textContent=`Questão final ${state.finalIndex+1} de ${session.finalQuestions.length}`;$('studyTitle').textContent='Integração e padrão FGV';
  const selected=selectedOptionIndex(q,rec),correct=correctOptionIndex(q),feedback=rec.submitted?revealedFeedback(q,rec.selectedOptionId||selected,rec.correct):'';
  $('studyBody').innerHTML=`<div class="exercise"><p style="white-space:pre-wrap">${esc(q.prompt)}</p>${q.options.map((o,i)=>{let cls='alt';if(selected===i)cls+=' selected';if(rec.submitted&&i===correct)cls+=' correct';if(rec.submitted&&selected===i&&!rec.correct)cls+=' wrong';return `<button class="${cls}" data-final-choice="${i}" data-option-id="${esc(optionId(q,i))}" ${rec.submitted?'disabled':''}>${String.fromCharCode(65+i)}. ${esc(o)}</button>`}).join('')}</div><div class="confidence">${['baixa','media','alta'].map(v=>`<button data-confidence="${v}" class="${rec.confidence===v?'active':''}" ${rec.submitted?'disabled':''}>${v==='media'?'Média':v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div><label class="small">Justificativa obrigatória</label><textarea id="justification" ${rec.submitted?'disabled':''}>${esc(rec.justification||'')}</textarea>${rec.submitted?`<div class="feedback ${rec.correct?'ok':'bad'}"><b>${rec.correct?'Correto.':'Incorreto.'}</b> ${esc(feedback)}</div>`:''}<div class="row" style="margin-top:14px">${rec.submitted?`<button id="nextFinal" class="primary">${state.finalIndex===session.finalQuestions.length-1?'Concluir sessão':'Próxima questão'}</button>`:'<button id="submitFinal" class="primary">Corrigir resposta</button>'}</div>`;
  document.querySelectorAll('[data-final-choice]').forEach(btn=>btn.onclick=()=>{rec.selected=Number(btn.dataset.finalChoice);rec.selectedOptionId=optionId(q,rec.selected);state.final[q.id]=rec;saveState();renderFinal()});
  document.querySelectorAll('[data-confidence]').forEach(btn=>btn.onclick=()=>{rec.confidence=btn.dataset.confidence;state.final[q.id]=rec;saveState();renderFinal()});
  if(!rec.submitted){$('justification').oninput=e=>{rec.justification=e.target.value;state.final[q.id]=rec;saveState()};$('submitFinal').onclick=()=>{const chosen=selectedOptionIndex(q,rec);if(chosen<0)return alert('Marque uma alternativa.');if(!rec.confidence)return alert('Informe sua segurança.');if(!meaningfulJustification(rec.justification))return alert('Escreva uma justificativa curta com significado. Se não souber justificar, você pode escrever “não sei”.');rec.submitted=true;rec.selected=chosen;rec.selectedOptionId=optionId(q,chosen);rec.correctOptionId=correctOptionId(q);rec.correct=rec.selectedOptionId===rec.correctOptionId;if(!rec.firstAttemptOptionId){rec.firstAttempt=chosen;rec.firstAttemptOptionId=rec.selectedOptionId}rec.answeredAt=new Date().toISOString();state.final[q.id]=rec;saveState();render()}}
  else $('nextFinal').onclick=()=>{if(state.finalIndex<session.finalQuestions.length-1)state.finalIndex++;else{updateClock();state.timerRunning=false;state.phase='complete';state.completedAt=new Date().toISOString()}saveState();render();scrollTop()};
}
function renderComplete(){
  show('studyPanel');$('studyKicker').textContent='Sessão concluída';$('studyTitle').textContent=session.title;
  $('studyBody').innerHTML=`<div class="feedback ok"><b>${finalCorrect()}/${session.finalQuestions.length} questões finais corretas.</b><br>Seu progresso e o apoio adaptativo utilizado foram preservados.</div><h2>Resumo de revisão</h2><div class="info concept">${(session.reviewSummary||[]).map(x=>'• '+esc(x)).join('<br>')}</div><div class="info connection"><b>Próximo passo</b><br>${esc(session.nextStep||'Retornar ao catálogo.')}</div><div class="row"><button id="completeReport" class="primary">Abrir relatório</button><button id="completeHome">Ver catálogo</button></div>`;
  $('completeReport').onclick=showReport;$('completeHome').onclick=()=>{state.phase='home';saveState();renderHome();renderStats()};
}

function buildReport(){
  const out=['DATAPREV SESSÕES — RELATÓRIO AUTOSSUFICIENTE',`Versão do conteúdo: ${catalog.contentVersion}`,`Sessão: ${session.id} — ${session.title}`,`Disciplina: ${session.discipline}`,`Item do edital: ${session.itemEdital}`,`Início: ${state.startedAt||'—'}`,`Término: ${state.completedAt||'em andamento'}`,`Tempo ativo: ${fmt(state.activeMs)}`,'','CONCEITOS E FIXAÇÃO IMEDIATA'];
  session.concepts.forEach((c,i)=>{
    out.push(`\n${i+1}. ${c.title}`,`Resumo: ${c.what}`,`Nota do usuário: ${state.notes[c.id]||'—'}`);
    (c.immediate||[]).forEach(q=>{
      const r=state.immediate[q.id]||{},attempts=r.attempts||[],first=attempts[0]??r.firstAttempt,last=attempts.at(-1),revealed=attempts.length>0,firstId=r.firstAttemptOptionId||attemptOptionId(q,first),firstIndex=optionIndex(q,firstId)>=0?optionIndex(q,firstId):attemptOptionIndex(q,first),lastId=attemptOptionId(q,last),lastIndex=attemptOptionIndex(q,last),answerIndex=correctOptionIndex(q);
      out.push(`  [${q.id}] ${q.prompt}`);
      q.options.forEach((o,j)=>out.push(`    ${String.fromCharCode(65+j)} · ${optionId(q,j)}: ${o}`));
      out.push(`  Primeira tentativa: ${firstIndex<0?'—':`${firstId} — ${q.options[firstIndex]}`}`,`  Resposta mais recente: ${lastIndex<0?'—':`${lastId} — ${q.options[lastIndex]}`}`,`  Tentativas: ${attempts.length}`);
      if(revealed)out.push(`  Gabarito revelado: ${correctOptionId(q)} — ${q.options[answerIndex]}`,`  Resultado atual: ${r.correct?'acerto':'erro com nova tentativa disponível'}`,`  Feedback: ${revealedFeedback(q,lastId,r.correct)}`);
      else out.push('  Gabarito: ainda não revelado','  Resultado: pendente');
    });
    const sup=state.support?.[c.id];
    if(sup){
      out.push(`  Apoio sob demanda: aberto=${sup.openedAt?'sim':'não'}; resolvido=${sup.resolved?'sim':'não'}; recomendado após dificuldade=${sup.recommended?'sim':'não'}; abertura automática legada=${sup.autoOpened?'sim':'não'}; motivos=${(sup.reasons||[]).map(x=>REASONS[x]||x).join(', ')||'—'}; microchecagem=${sup.check?(sup.check.correct?'acerto':'erro'):'não realizada'}`);
      for(const p of c.supportPractice||[]){const r=sup.practice?.[p.id];if(!r?.submitted)continue;const selected=selectedOptionIndex(p,r),answerIndex=correctOptionIndex(p);out.push(`    [${p.id}] ${p.prompt}`);p.options.forEach((o,j)=>out.push(`      ${String.fromCharCode(65+j)} · ${optionId(p,j)}: ${o}`));out.push(`    Resposta: ${r.selectedOptionId||optionId(p,selected)} — ${p.options[selected]}`,`    Gabarito revelado: ${correctOptionId(p)} — ${p.options[answerIndex]}`,`    Resultado: ${r.correct?'acerto de apoio':'erro de apoio'}`,`    Feedback: ${revealedFeedback(p,r.selectedOptionId||selected,r.correct)}`)}
    }
  });
  const realItems=session.concepts.map(c=>c.realQuestion).filter(Boolean);
  if(realItems.length){out.push('\nQUESTÕES REAIS INCORPORADAS');for(const q of realItems){const r=state.realPractice?.[q.id]||{};out.push(`\n[${q.id}] ${q.prompt}`);q.options.forEach((o,j)=>out.push(`  ${String.fromCharCode(65+j)}. ${o}`));out.push(`Resposta marcada: ${r.selected===undefined?'—':q.options[r.selected]}`);if(r.submitted)out.push(`Gabarito revelado: ${q.options[q.answer]}`,`Resultado: ${r.correct?'acerto':'erro'}`,`Feedback: ${q.explanation||'—'}`);else out.push('Gabarito: ainda não revelado','Resultado: não corrigida')}}
  out.push('\nQUESTÕES FINAIS');session.finalQuestions.forEach((q,i)=>{
    const r=state.final[q.id]||{},selected=selectedOptionIndex(q,r),answerIndex=correctOptionIndex(q);
    out.push(`\nQ${i+1} [${q.id}] ${q.prompt}`);
    q.options.forEach((o,j)=>out.push(`  ${String.fromCharCode(65+j)} · ${optionId(q,j)}: ${o}`));
    out.push(`Resposta marcada: ${selected<0?'—':`${r.selectedOptionId||optionId(q,selected)} — ${q.options[selected]}`}`,`Segurança: ${r.confidence||'—'}`,`Justificativa: ${r.justification||'—'}`);
    if(r.submitted)out.push(`Gabarito revelado: ${correctOptionId(q)} — ${q.options[answerIndex]}`,`Resultado: ${r.correct?'acerto':'erro'}`,`Feedback: ${revealedFeedback(q,r.selectedOptionId||selected,r.correct)}`);
    else out.push('Gabarito: ainda não revelado','Resultado: não corrigida');
  });
  out.push('\nRESUMO',`Conceitos concluídos: ${Object.keys(state.conceptsCompleted).length}/${session.concepts.length}`,`Fixações corretas: ${immediateCorrect()}/${immediateAll().length}`,`Questões finais: ${finalCorrect()}/${finalAnswered()} acertos`,`Próximo passo: ${session.nextStep||'—'}`);return out.join('\n');
}
function showReport(){$('reportText').value=buildReport();show('reportPanel')}

async function sha256(text){const buffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return[...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function syncNow(){
  const cfg=readConfig();if(!cfg.endpoint||!cfg.token||!cfg.deviceId)return setStatus('Importe ou salve a configuração.','bad');
  updateClock();saveState();const stateJson=JSON.stringify(state),checksum=await sha256(stateJson);$('syncBtn').disabled=true;setStatus('Enviando checkpoint…');
  try{
    void fetch(cfg.endpoint,{method:'POST',mode:'no-cors',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'push_session_state',token:cfg.token,device_id:cfg.deviceId,app_version:APP_VERSION,content_version:catalog.contentVersion,session_id:session.id,checksum,state_json:stateJson})}).catch(()=>{});
    let confirmed=null;for(let attempt=1;attempt<=18&&!confirmed;attempt++){await new Promise(r=>setTimeout(r,attempt===1?1200:1600));try{const meta=await jsonp(cfg.endpoint,{action:'session_state_meta',token:cfg.token,device_id:cfg.deviceId,session_id:session.id},12000);if(meta?.found&&meta.checksum===checksum)confirmed=meta}catch{}}
    if(!confirmed)throw new Error('A planilha não confirmou a tempo; o progresso local está salvo.');
    setStatus(`Sessão sincronizada em ${new Date(confirmed.updated_at||Date.now()).toLocaleString('pt-BR')}.`,'ok');$('syncBadge').textContent='Sincronizado';$('syncBadge').classList.add('ok');
  }catch(error){setStatus('Falha: '+error.message,'bad')}finally{$('syncBtn').disabled=false}
}
async function refreshCatalog(){setStatus('Consultando sessões…');try{await loadCatalog();renderHome();renderStats();setStatus(`Catálogo atualizado: ${catalog.sessions.length} sessões disponíveis.`,'ok')}catch(error){setStatus('Falha: '+error.message,'bad')}}

$('timerBtn').onclick=()=>state?.timerRunning?pauseTimer():startTimer();
$('homeBtn').onclick=()=>{if(state){pauseTimer();state.phase='home';saveState()}renderHome();renderStats();scrollTop()};
$('reportBtn').onclick=showReport;$('closeReportBtn').onclick=render;$('copyReportBtn').onclick=async()=>{try{await navigator.clipboard.writeText($('reportText').value);alert('Relatório copiado.')}catch{$('reportText').select();document.execCommand('copy');alert('Relatório copiado.')}};
$('resetBtn').onclick=()=>{if(!state||!confirm('Apagar apenas o progresso desta sessão?'))return;state=freshState(session.id);saveState();render()};
$('syncBtn').onclick=syncNow;$('refreshBtn').onclick=refreshCatalog;
$('saveConfigBtn').onclick=()=>{try{const endpoint=new URL($('endpointInput').value.trim());if(endpoint.protocol!=='https:'||!endpoint.pathname.endsWith('/exec'))throw new Error('Use uma URL HTTPS terminada em /exec.');const cfg=saveConfig({endpoint:endpoint.toString(),token:$('tokenInput').value,deviceId:$('deviceInput').value});if(!cfg.token||!cfg.deviceId)throw new Error('Preencha todos os campos.');setStatus('Configuração salva.','ok')}catch(error){setStatus('Falha: '+error.message,'bad')}};
$('importBtn').onclick=async()=>{try{const parsed=JSON.parse(await navigator.clipboard.readText());if(parsed?.type!=='dataprev-sync-config')throw new Error('Conteúdo copiado inválido.');const cfg=saveConfig({endpoint:parsed.endpoint,token:parsed.token,deviceId:parsed.deviceId});$('endpointInput').value=cfg.endpoint;$('tokenInput').value=cfg.token;$('deviceInput').value=cfg.deviceId;setStatus('Configuração importada.','ok')}catch(error){setStatus('Falha ao importar: '+error.message,'bad')}};
document.addEventListener('visibilitychange',()=>document.visibilityState==='hidden'?updateClock():(state&&(state.lastTick=Date.now())));window.addEventListener('beforeunload',updateClock);

async function bootstrap(){
  migrateLegacy();
  const cfg=readConfig();
  $('endpointInput').value=cfg.endpoint;
  $('tokenInput').value=cfg.token;
  $('deviceInput').value=cfg.deviceId;
  try{
    await loadCatalog({preferCurrent:false,includeRemote:false});
    render();
    tick=setInterval(()=>{if(state){updateClock();renderStats()}},1000);
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
    void loadCatalog({preferCurrent:true,includeRemote:true})
      .then(()=>render())
      .catch(error=>console.warn('Atualização remota em segundo plano:',error));
  }catch(error){
    $('catalogCard').innerHTML=`<div class="feedback bad"><b>Falha ao carregar.</b><br>${esc(error.message)}</div>`;
  }
}
bootstrap();
