'use strict';

(function(){
  if(document.getElementById('simuladosMediaStyles'))return;
  const style=document.createElement('style');
  style.id='simuladosMediaStyles';
  style.textContent='.sim-stimuli{display:grid;gap:10px;margin:0 0 14px}.sim-stimulus{border:1px solid var(--line);border-radius:13px;background:#f8fafc;padding:11px 12px}.sim-stimulus-label{font-size:.76rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px}.sim-stimulus-body{font-size:.9rem;line-height:1.6;color:var(--text)}.sim-stimulus-source{font-size:.72rem;line-height:1.4;color:var(--muted);margin-top:7px}.sim-stimulus-code pre{margin:0}.sim-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}.sim-stimulus table{width:100%;border-collapse:collapse;font-size:.82rem;min-width:360px}.sim-stimulus th,.sim-stimulus td{border:1px solid var(--line);padding:8px 9px;text-align:left;vertical-align:top}.sim-stimulus th{background:#eef2f7;font-weight:850}.sim-stimulus-image{margin:0}.sim-stimulus-image img{display:block;max-width:100%;height:auto;margin:auto;border-radius:9px}.sim-stimulus-image figcaption{font-size:.78rem;line-height:1.45;color:var(--muted);margin-top:7px}@media(max-width:580px){.sim-stimulus{padding:10px}.sim-stimulus table{font-size:.78rem}.sim-stimulus th,.sim-stimulus td{padding:7px}}';
  document.head.appendChild(style);
})();

function simStimulusHtml(q){
  const items=Array.isArray(q.stimuli)?q.stimuli:(q.stimulus?[q.stimulus]:[]);
  if(!items.length)return'';
  return `<div class="sim-stimuli">${items.map((s,idx)=>{
    if(!s||!s.type)return'';
    const label=s.label?`<div class="sim-stimulus-label">${esc(s.label)}</div>`:'';
    if(s.type==='passage'||s.type==='quote'||s.type==='reference'){
      const source=s.source?`<div class="sim-stimulus-source">${esc(s.source)}</div>`:'';
      return `<section class="sim-stimulus sim-stimulus-text">${label}<div class="sim-stimulus-body">${esc(s.text||'').replace(/\n/g,'<br>')}</div>${source}</section>`;
    }
    if(s.type==='code'){
      const lang=s.language?`<div class="sim-stimulus-source">${esc(s.language)}</div>`:'';
      return `<section class="sim-stimulus sim-stimulus-code">${label}<pre>${esc(s.code||s.text||'')}</pre>${lang}</section>`;
    }
    if(s.type==='table'){
      const headers=Array.isArray(s.headers)?s.headers:[];
      const rows=Array.isArray(s.rows)?s.rows:[];
      const head=headers.length?`<thead><tr>${headers.map(h=>`<th>${esc(String(h))}</th>`).join('')}</tr></thead>`:'';
      const body=`<tbody>${rows.map(r=>`<tr>${(Array.isArray(r)?r:[r]).map(c=>`<td>${esc(String(c))}</td>`).join('')}</tr>`).join('')}</tbody>`;
      const source=s.source?`<div class="sim-stimulus-source">${esc(s.source)}</div>`:'';
      return `<section class="sim-stimulus sim-stimulus-table">${label}<div class="sim-table-wrap"><table>${head}${body}</table></div>${source}</section>`;
    }
    if(s.type==='image'||s.type==='chart'||s.type==='diagram'){
      const src=esc(s.src||'');
      const alt=esc(s.alt||s.label||`Recurso visual ${idx+1}`);
      const caption=s.caption?`<figcaption>${esc(s.caption)}</figcaption>`:'';
      const source=s.source?`<div class="sim-stimulus-source">${esc(s.source)}</div>`:'';
      return `<figure class="sim-stimulus sim-stimulus-image">${label}<img src="${src}" alt="${alt}" loading="lazy">${caption}${source}</figure>`;
    }
    return `<section class="sim-stimulus sim-stimulus-text">${label}<div class="sim-stimulus-body">${esc(s.text||'')}</div></section>`;
  }).join('')}</div>`;
}

const simValidateQuestionBase=simValidateQuestion;
simValidateQuestion=function(q,index){
  simValidateQuestionBase(q,index);
  const items=Array.isArray(q.stimuli)?q.stimuli:(q.stimulus?[q.stimulus]:[]);
  for(const s of items){
    if(!s?.type)throw new Error(`${q.id}: estímulo sem tipo`);
    if(['image','chart','diagram'].includes(s.type)&&!s.src)throw new Error(`${q.id}: recurso visual sem arquivo`);
    if(['image','chart','diagram'].includes(s.type)&&!s.alt&&!s.label)throw new Error(`${q.id}: recurso visual sem descrição acessível`);
    if(s.type==='table'&&!Array.isArray(s.rows))throw new Error(`${q.id}: tabela sem linhas`);
  }
};

const simRenderBaseWithStimuli=simRender;
simRender=function(){
  simRenderBaseWithStimuli();
  if(!simCurrent||!simState||simState.completedAt)return;
  const q=simCurrent.questions?.[simState.currentIndex];
  if(!q)return;
  const html=simStimulusHtml(q);
  if(!html)return;
  const exercise=document.querySelector('#simuladoPanel .exercise');
  if(exercise)exercise.insertAdjacentHTML('afterbegin',html);
};

async function simLoadMultipartExam(item){
  const r=await fetch('./simulados/'+item.file+'?v=066',{cache:'no-store'});
  if(!r.ok)throw new Error('arquivo/manifesto indisponível');
  const data=await r.json();
  if(Array.isArray(data.questions))return data;
  if(!Array.isArray(data.parts)||!data.parts.length)throw new Error('manifesto sem questões ou partes');
  const questions=[];
  for(const part of data.parts){
    const pr=await fetch('./simulados/'+part+'?v=066',{cache:'no-store'});
    if(!pr.ok)throw new Error('parte indisponível: '+part);
    const pj=await pr.json();
    if(!Array.isArray(pj.questions))throw new Error('parte sem questões: '+part);
    questions.push(...pj.questions);
  }
  return {...data,questions};
}

simOpen=async function(id){
  const item=(simCatalog.simulados||[]).find(x=>x.id===id);if(!item)return;
  const st=simStatus(item);
  if(!['ready','in_progress','completed'].includes(st))return setStatus('Este simulado ainda não está pronto.','bad');
  if(!item.file)return setStatus('Arquivo do simulado ainda não foi publicado.','bad');
  try{
    const data=await simLoadMultipartExam(item);
    if(!Array.isArray(data.questions)||data.questions.length!==70)throw new Error('o simulado publicado não contém exatamente 70 questões');
    const ids=new Set();
    data.questions.forEach((q,i)=>{simValidateQuestion(q,i);if(ids.has(q.id))throw new Error('ID de questão repetido: '+q.id);ids.add(q.id)});
    simCurrent=data;simState=simGetState(id);
    if(!simState.startedAt){simState.startedAt=new Date().toISOString();simState.timerRunning=true;simState.lastTick=Date.now();simSaveState();simMaybeTriggerNext(item)}
    simRender();window.scrollTo({top:0,behavior:'smooth'});
  }catch(error){setStatus('Não foi possível abrir o simulado: '+error.message,'bad')}
};

(function(){
  let confirmScrollY=null;

  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('#simConfirm');
    if(!btn)return;
    confirmScrollY=window.scrollY;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(confirmScrollY===null)return;
      window.scrollTo({top:confirmScrollY,behavior:'auto'});
      confirmScrollY=null;
    }));
  },true);

  function resetCurrentSimulado(){
    if(!window.confirm('Reiniciar este simulado? Todas as respostas, marcações de apoio, segurança e tempo deste simulado serão apagados neste aparelho.'))return;
    if(typeof simState==='undefined'||typeof simCurrent==='undefined'||!simCurrent)return;
    const id=simState?.simuladoId||simCurrent.id;
    if(!id)return;
    try{
      const map=simReadStates();
      delete map[id];
      simWriteStates(map);
      simState=simGetState(id);
      simState.startedAt=new Date().toISOString();
      simState.completedAt='';
      simState.currentIndex=0;
      simState.answers={};
      simState.activeMs=0;
      simState.timerRunning=true;
      simState.lastTick=Date.now();
      simState.generationTriggered=true;
      simSaveState();
      simRender();
      requestAnimationFrame(()=>document.getElementById('simuladoPanel')?.scrollIntoView({block:'start',behavior:'auto'}));
    }catch(error){
      console.error('Falha ao reiniciar simulado:',error);
      alert('Não foi possível reiniciar o simulado neste aparelho.');
    }
  }

  function ensureResetButton(){
    const panel=document.getElementById('simuladoPanel');
    if(!panel||panel.classList.contains('hidden')||panel.querySelector('[data-reset-simulado]'))return;
    const head=panel.querySelector('.sim-head');
    const resultHome=panel.querySelector('#simResultHome');
    const button=document.createElement('button');
    button.type='button';
    button.className='danger';
    button.dataset.resetSimulado='1';
    button.textContent='Resetar simulado';
    button.addEventListener('click',resetCurrentSimulado);
    if(head){
      const existing=head.querySelector('#simExit');
      if(existing){
        let actions=head.querySelector('.sim-head-actions');
        if(!actions){
          actions=document.createElement('div');
          actions.className='sim-head-actions';
          existing.parentNode.insertBefore(actions,existing);
          actions.appendChild(existing);
        }
        actions.appendChild(button);
      }else head.appendChild(button);
    }else if(resultHome){
      resultHome.parentElement?.appendChild(button);
    }
  }

  const style=document.createElement('style');
  style.textContent='.sim-head-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.sim-head-actions button{min-width:0}@media(max-width:580px){.sim-head{display:block}.sim-head-actions{display:grid;grid-template-columns:1fr;margin-top:10px}.sim-head-actions button{width:100%}}';
  document.head.appendChild(style);

  const panel=document.getElementById('simuladoPanel');
  if(panel){
    new MutationObserver(()=>ensureResetButton()).observe(panel,{childList:true,subtree:true});
    ensureResetButton();
  }
})();
