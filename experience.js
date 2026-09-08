'use strict';
// View preferences are transient. Navigation never invents learning evidence.
(function(){
  let homeView='today',filter='available',query='';
  const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function setView(view){
    document.body.dataset.view=view;
    document.querySelectorAll('.app-nav [data-view]').forEach(b=>{
      if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    document.getElementById('settingsPanel').classList.toggle('hidden',view!=='settings');
    document.getElementById('releaseLabel').textContent=document.getElementById('contentSummary').textContent;
  }
  const baseShow=show;
  show=function(panel){baseShow(panel);setView(panel==='homePanel'?homeView:panel==='studyPanel'?'lesson':panel==='reviewPanel'?'review':panel==='simuladoPanel'?'exam':'report')};
  function navigate(view){
    if(typeof simState!=='undefined'&&simState){simUpdateClock();simState.timerRunning=false;simSaveState();simCurrent=null;simState=null}
    if(state?.startedAt&&state.timerRunning)pauseTimer();
    if(state?.startedAt&&state.phase!=='home'){state.phase='home';saveState()}
    homeView=view;renderHome();setView(view);window.scrollTo({top:0,behavior:'auto'});
  }
  document.querySelectorAll('.app-nav [data-view]').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
  window.dpGoTrail=()=>navigate('trail');
  document.getElementById('homeBtn').onclick=window.dpGoTrail;
  const baseHome=renderHome;
  renderHome=function(){
    baseHome();setView(homeView);
    const focus=document.getElementById('studyFocus');
    if(focus&&!focus.querySelector('.home-actions')){
      const actions=document.createElement('section');actions.className='home-actions';actions.setAttribute('aria-label','Outras formas de estudar');
      actions.innerHTML='<h2>Escolha seu ritmo</h2><p>Um conceito novo, uma revisão curta ou treino de prova. Pause quando precisar; retome do ponto salvo.</p><div class="row"><button id="browseTrail">Escolher outra sessão</button><button id="browseExams">Treinar com simulado</button></div>';
      focus.appendChild(actions);
      actions.querySelector('#browseTrail').onclick=()=>navigate('trail');
      actions.querySelector('#browseExams').onclick=()=>{navigate('trail');const block=document.querySelector('.simulados-block');if(block){block.classList.add('open');block.querySelector('button')?.setAttribute('aria-expanded','true');block.scrollIntoView({block:'start'})}};
    }
    const shell=document.querySelector('.catalog-shell');if(!shell)return;
    const head=shell.querySelector('.catalog-head');
    head.querySelector('h1').textContent='Sua Trilha';
    head.querySelector('p').textContent='Encontre o que estudar agora. A ordem de cada disciplina continua preservada.';
    const tools=document.createElement('div');tools.className='trail-tools';
    tools.innerHTML='<label for="trailSearch">Buscar sessão ou assunto</label><input id="trailSearch" type="search" placeholder="Ex.: Python, variáveis, matrizes" autocomplete="off"><div class="trail-filters" role="group" aria-label="Filtrar sessões"><button data-trail-filter="available">Disponíveis</button><button data-trail-filter="ongoing">Em curso</button><button data-trail-filter="all">Todo o planejamento</button></div><p id="trailResult" class="small" role="status" aria-live="polite"></p>';
    head.insertAdjacentElement('afterend',tools);
    const input=tools.querySelector('input');input.value=query;input.oninput=()=>{query=input.value;filterTrail()};
    tools.querySelectorAll('[data-trail-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.trailFilter;filterTrail()});
    document.querySelectorAll('[data-toggle-discipline]').forEach(b=>b.setAttribute('aria-expanded',String(b.closest('.discipline-block').classList.contains('open'))));
    filterTrail();
  };
  function filterTrail(){
    const search=normalize(query).trim();let total=0;
    document.querySelectorAll('.discipline-list > .discipline-block').forEach(block=>{
      let count=0;block.querySelectorAll('[data-road-id]').forEach(row=>{
        const status=sessionLocalStatus(row.dataset.roadId);
        const accepted=filter==='all'||filter==='ongoing'&&status==='em_curso'||filter==='available'&&['pronta','em_curso','concluida'].includes(status);
        const visible=accepted&&(!search||normalize(row.textContent+' '+block.dataset.discipline).includes(search));
        row.hidden=!visible;if(visible)count++;
      });
      block.hidden=!count;total+=count;
      // Search results open automatically; clearing search restores the chosen discipline.
      const open=!!search&&count>0||!search&&localStorage.getItem(PLANNER_OPEN_KEY)===block.dataset.discipline;
      block.classList.toggle('open',open);
      block.querySelector('[data-toggle-discipline]')?.setAttribute('aria-expanded',String(open));
    });
    document.querySelectorAll('[data-trail-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trailFilter===filter)));
    const result=document.getElementById('trailResult');if(result)result.textContent=total?`${total} sessão${total===1?'':'ões'} nesta seleção.${filter==='available'?' Inclui resultados já registrados.':''}`:'Nenhuma sessão nesta seleção. Tente outro termo ou filtro.';
  }
  const baseToggle=toggleDiscipline;
  toggleDiscipline=function(name){baseToggle(name);document.querySelectorAll('[data-toggle-discipline]').forEach(b=>b.setAttribute('aria-expanded',String(b.closest('.discipline-block').classList.contains('open'))))};
  function lessonNavigation(){
    const panel=document.getElementById('studyPanel');panel.querySelector('.lesson-tools')?.remove();panel.querySelector('.lesson-outline')?.remove();
    const tools=document.createElement('div');tools.className='lesson-tools';
    tools.innerHTML='<button id="lessonPause">Pausar e sair</button><button id="lessonReport">Meu registro</button>';
    panel.prepend(tools);tools.querySelector('#lessonPause').onclick=()=>navigate('today');tools.querySelector('#lessonReport').onclick=showReport;
    const outline=document.createElement('details');outline.className='lesson-outline';
    const current=state.phase==='concepts'?state.conceptIndex+1:session.concepts.length;
    outline.innerHTML=`<summary>${esc(session.title)} · ${current}/${session.concepts.length} conceitos</summary><ol>${session.concepts.map((c,i)=>{
      const accessible=i<=state.conceptIndex||state.conceptsCompleted?.[c.id]||state.completedAt;
      return `<li><button data-lesson-concept="${i}" ${accessible?'':'disabled'} ${state.phase==='concepts'&&i===state.conceptIndex?'aria-current="step"':''}>${esc(c.title)}${accessible?'':' · a seguir'}</button></li>`;
    }).join('')}</ol><p class="small">As etapas seguintes abrem após a prática do conceito atual.</p>`;
    document.getElementById('studyTitle').insertAdjacentElement('afterend',outline);
    outline.querySelectorAll('[data-lesson-concept]').forEach(b=>b.onclick=()=>{state.phase='concepts';state.conceptIndex=Number(b.dataset.lessonConcept);saveState();renderConcept();renderStats();scrollTop()});
    if(state.phase==='concepts'){
      const next=document.getElementById('nextConcept');
      if(next?.disabled){const hint=document.createElement('p');hint.className='next-step-hint';hint.textContent='Para continuar, resolva a fixação abaixo. Se travar, abra “Não entendi”.';next.parentElement.insertAdjacentElement('beforebegin',hint)}
    }
    if(state.phase==='final'){
      const conf=document.querySelector('#studyBody .confidence');if(conf){conf.setAttribute('role','group');conf.setAttribute('aria-label','Sua segurança na resposta');conf.insertAdjacentHTML('beforebegin','<h2>Sua segurança na resposta</h2>')}
      document.querySelector('#studyBody label')?.setAttribute('for','justification');
      const back=document.createElement('button');back.id='prevFinal';back.textContent='Anterior';document.querySelector('#studyBody .row')?.prepend(back);
      back.onclick=()=>{if(state.finalIndex>0)state.finalIndex--;else{state.phase='concepts';state.conceptIndex=session.concepts.length-1}saveState();render();scrollTop()};
    }
    document.querySelectorAll('#studyBody .confidence button').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
  }
  const baseConcept=renderConcept;renderConcept=function(){baseConcept();lessonNavigation()};
  const baseFinal=renderFinal;renderFinal=function(){baseFinal();lessonNavigation()};
  const baseComplete=renderComplete;renderComplete=function(){baseComplete();lessonNavigation()};
  // Keep errors visible even when the service settings are collapsed.
  const baseStatus=setStatus;
  setStatus=function(message,type=''){baseStatus(message,type);let alert=document.getElementById('appNotice');if(type==='bad'){
    if(!alert){alert=document.createElement('div');alert.id='appNotice';alert.className='status bad';alert.setAttribute('role','alert');document.querySelector('.app-nav').insertAdjacentElement('afterend',alert)}
    alert.textContent=message;
  }else alert?.remove()};
  window.DPExperience={navigate,filterTrail};
})();
