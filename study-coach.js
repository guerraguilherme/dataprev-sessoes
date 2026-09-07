'use strict';
// Review evidence is additive inside each session checkpoint and uses the existing sync queue.
// Scheduling intervals are a transparent product rule, not a calibrated mastery estimate.
(function(){
  const DAY=86400000, INTERVALS=[1,3,7,14];
  const panel=document.getElementById('reviewPanel');
  let batch=[],position=0,results=[];
  const keyOf=x=>x.kind+':'+x.q.id;
  const validDate=x=>Number.isFinite(Date.parse(x))?Date.parse(x):0;
  const dateLabel=ms=>new Date(ms).toLocaleDateString('pt-BR');
  function reviewState(item){return readMap()[item.material.id]?.reviewPractice?.items?.[keyOf(item)]||{}}
  function originalQuestion(item){return {id:item.q.id,prompt:item.q.prompt,options:item.q.options,optionIds:item.q.optionIds,stimuli:item.q.stimuli||[]}}
  function candidates(now=Date.now()){
    const map=readMap(),items=[];
    for(const material of catalog.sessions){
      const record=map[material.id];if(!record?.startedAt)continue;
      const add=(q,source,kind,concept)=>{
        if(!q?.options?.length||!q.prompt||source?.submitted===false)return;
        const item={material,q,source,kind,concept},review=record.reviewPractice?.items?.[keyOf(item)]||{},last=review.attempts?.at(-1);
        const missed=source.correct===false||source.firstAttemptOptionId&&source.firstAttemptOptionId!==correctOptionId(kind==='transfer'?concept.immediate[0]:q);
        const unsure=source.confidence&&source.confidence!=='alta'||/^n[aã]o\s+sei[.!?]*$/i.test(String(source.justification||'').trim());
        item.reason=last?(last.correct&&last.confidence==='alta'?'Reencontro programado':'Ainda precisa de reforço'):missed?'Erro na tentativa anterior':unsure?'Acerto com dúvida ou sem justificativa':'Verificar o que ficou depois do estudo';
        const answered=validDate(source.answeredAt)||validDate(record.completedAt);
        item.due=last?validDate(last.nextDueAt):answered?answered+(missed||unsure?DAY:3*DAY):0;
        item.priority=last&&!last.correct||missed?0:unsure?1:2;
        item.draft=review.draft;
        item.dueNow=!!review.draft||item.due<=now;
        items.push(item);
      };
      for(const q of material.finalQuestions||[]){const r=record.final?.[q.id];if(r?.submitted)add(q,r,'repeat')}
      for(const concept of material.concepts||[]){
        const guide=window.DP_LEARNING_GUIDES?.[concept.id],q=concept.immediate?.[0],r=record.immediate?.[q?.id];
        // A new transfer item can test only the teaching version the learner has encountered.
        if(guide&&record.learningGuideVersions?.[concept.id]===guide.version&&r?.answeredAt)add(guide.transfer,r,'transfer',concept);
      }
    }
    return items.sort((a,b)=>Number(!!b.draft)-Number(!!a.draft)||a.priority-b.priority||a.due-b.due||keyOf(a).localeCompare(keyOf(b)));
  }
  function selectBatch(items){
    const out=[],seen=new Set();
    for(const item of items){if(!seen.has(item.material.id)){out.push(item);seen.add(item.material.id)}if(out.length===3)return out}
    for(const item of items){if(!out.includes(item))out.push(item);if(out.length===3)break}return out;
  }
  function saveReview(item,update){
    const map=readMap(),record=map[item.material.id];
    if(!record?.startedAt)throw Error('A sessão de origem não tem checkpoint de estudo.');
    const review=record.reviewPractice||{schemaVersion:1,items:{}};
    if(review.schemaVersion!==1)throw Error('Versão de revisão incompatível.');
    review.items=review.items||{};const next=update(clone(review.items[keyOf(item)]||{}));
    review.items[keyOf(item)]=next;record.reviewPractice=review;
    // Do not update original answers, lastTick, completion, scores, or learner mastery.
    writeMap(map);
    if(state?.sessionId===record.sessionId){state=clone(record);localStorage.setItem(LEGACY_STATE_KEY,JSON.stringify(state))}
    dpQueueSessionSnapshot(record,'spaced_review');
    return next;
  }
  function schedule(previous,correct,confidence,justification,now){
    const secure=correct&&confidence==='alta'&&!/^n[aã]o\s+sei[.!?]*$/i.test(justification.trim());
    const streak=secure?(previous?.secureStreak||0)+1:0;
    const days=secure?INTERVALS[Math.min(streak,INTERVALS.length-1)]:1;
    return {secureStreak:streak,intervalDays:days,nextDueAt:new Date(now+days*DAY).toISOString()};
  }
  function guideHtml(g){return `<section class="learning-guide" aria-label="Explicação em etapas">${g.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${g.code?`<pre><code>${esc(g.code)}</code></pre>`:''}<h2>Como resolver</h2><ol>${g.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="guide-trap"><strong>Atenção:</strong> ${esc(g.trap)}</p></section>`}
  const baseConcept=renderConcept;
  renderConcept=function(){
    baseConcept();const c=session?.concepts?.[state?.conceptIndex],g=window.DP_LEARNING_GUIDES?.[c?.id];if(!g)return;
    const body=document.getElementById('studyBody');
    body.querySelector('.concept-explanation')?.remove();
    body.querySelector('.concept-example')?.remove();
    // Replace the short legacy exposition, keeping questions, IDs, notes and support intact.
    for(const el of [...body.children])if(el.tagName==='PRE'||el.classList.contains('session-visuals'))el.remove();
    body.querySelector('.concept-anchor')?.insertAdjacentHTML('afterend',guideHtml(g));
  };
  const baseAnswer=answerImmediate;
  answerImmediate=function(id,index){
    const c=session?.concepts?.[state?.conceptIndex],g=window.DP_LEARNING_GUIDES?.[c?.id];
    if(g){state.learningGuideVersions=state.learningGuideVersions||{};state.learningGuideVersions[c.id]=g.version}
    return baseAnswer(id,index);
  };
  const baseFocus=renderStudyFocus;
  renderStudyFocus=function(){baseFocus();const el=document.getElementById('studyFocus');if(!el)return;
    const all=candidates(),due=all.filter(x=>x.dueNow),draft=due.some(x=>x.draft),future=all.filter(x=>!x.dueNow).sort((a,b)=>a.due-b.due),attempts=Object.values(readMap()).flatMap(r=>Object.values(r.reviewPractice?.items||{}).flatMap(x=>x.attempts||[]));
    const today=new Date().toDateString(),todayCount=attempts.filter(a=>new Date(a.answeredAt).toDateString()===today).length;
    el.classList.remove('hidden');
    el.insertAdjacentHTML('beforeend',`<section class="review-home" aria-label="Revisão espaçada"><div class="kicker">Recuperar sem consultar</div><h2>${due.length?`${due.length} revisão${due.length===1?'':'ões'} para retomar`:all.length?'Revisão em dia':'Ainda sem revisões agendadas'}</h2><p>${due.length?'Faça uma rodada de até três questões; depois continue o conteúdo.':future.length?`Próximo reencontro a partir de ${dateLabel(future[0].due)}. Continue sua Trilha.`:'Ao responder às questões finais, você cria pontos para revisar depois. O app precisa dessas tentativas para escolher o que retomar.'}</p>${due.length?`<button id="startReview" class="${draft?'primary':'ghost'}">${draft?'Retomar revisão':'Revisar até 3 questões'}</button>`:''}${todayCount?`<p class="small">Hoje: ${todayCount} resposta(s) em revisão. Esse número registra prática, não domínio.</p>`:''}<details><summary>Como a revisão é escolhida</summary><p>Entram questões finais já corrigidas e aplicações dos conceitos estudados na explicação ampliada. Erros e dúvidas voltam primeiro. As rodadas misturam sessões quando há material disponível.</p><p>O primeiro reencontro ocorre após 1 dia para erro/dúvida e 3 dias para os demais. Acertos com segurança alta e justificativa ampliam o intervalo para 3, 7 e 14 dias; erro ou dúvida voltam no dia seguinte. São intervalos de organização, não uma previsão da sua nota.</p><p>As respostas ficam no checkpoint da sessão e seguem sua sincronização configurada. Repetir uma questão não comprova que você resolve qualquer questão nova sobre o tema.</p></details></section>`);
    document.getElementById('startReview')?.addEventListener('click',()=>startReview());
  };
  function startReview(){
    batch=selectBatch(candidates().filter(x=>x.dueNow));position=0;results=[];
    if(!batch.length)return renderHome();
    if(state?.timerRunning)pauseTimer();
    document.body.classList.add('review-mode');show('reviewPanel');renderReview();scrollTop();
  }
  function leaveReview(){document.body.classList.remove('review-mode');renderHome();renderStats();scrollTop()}
  function renderReview(){
    const item=batch[position];if(!item)return finish();
    const saved=reviewState(item),done=results.find(x=>x.key===keyOf(item)&&x.sessionId===item.material.id),q=item.q;
    const draft=done||saved.draft||{optionOrder:canReorderQuestion(q)?shuffledIndices(q.options.length,item.material.id+keyOf(item)+':'+(saved.attempts?.length||0)):q.options.map((_,i)=>i),selected:null,confidence:'',justification:''};
    const revealed=!!done;
    panel.innerHTML=`<div class="kicker">Revisão ${position+1} de ${batch.length} · ${esc(item.material.discipline)}</div><h1>O que você consegue recuperar?</h1><p class="small">${esc(item.material.title)} · ${item.kind==='transfer'?'Aplicação autoral em outro exemplo':'Questão da sessão, reapresentada'}<br>${esc(item.reason)}</p><div class="exercise" data-phase="${revealed?'revealed':draft.selected!==null?'selected':'idle'}"><p class="review-prompt">${esc(q.prompt)}</p>${(q.stimuli||[]).map(v=>window.DP_renderSessionVisual?.(v)||'').join('')}${draft.optionOrder.map((i,k)=>`<button class="alt${draft.selected===i?' selected':''}${revealed&&i===correctOptionIndex(q)?' correct':''}${revealed&&draft.selected===i&&!done.correct?' wrong':''}" data-review-choice="${i}" aria-pressed="${draft.selected===i}" ${revealed?'disabled':''}>${String.fromCharCode(65+k)}. ${esc(q.options[i])}</button>`).join('')}</div><fieldset class="review-confidence"><legend>Qual é sua segurança?</legend>${['baixa','media','alta'].map(v=>`<button type="button" data-review-confidence="${v}" aria-pressed="${draft.confidence===v}" class="${draft.confidence===v?'active':''}" ${revealed?'disabled':''}>${v==='media'?'Média':v==='alta'?'Alta':'Baixa'}</button>`).join('')}</fieldset><label for="reviewReason">Explique em uma frase como decidiu</label><textarea id="reviewReason" rows="2" placeholder="Se não souber explicar, escreva: não sei" ${revealed?'disabled':''}>${esc(draft.justification)}</textarea>${revealed?`<section class="feedback ${done.correct?'ok':'bad'}" role="status"><strong>${done.correct?'Resposta correta.':'Vamos corrigir o raciocínio.'}</strong><p>${esc(revealedFeedback(q,draft.selected,done.correct))}</p><p>Próximo reencontro: ${dateLabel(validDate(done.nextDueAt))}.</p></section>${item.concept?`<details class="review-relearn"><summary>Rever o conceito em etapas</summary>${guideHtml(window.DP_LEARNING_GUIDES[item.concept.id])}</details>`:''}<button id="reviewNext" class="primary">${position+1===batch.length?'Encerrar rodada':'Próxima revisão'}</button>`:`<button id="reviewSubmit" class="primary" ${draft.selected===null||!draft.confidence||!meaningfulJustification(draft.justification)?'disabled':''}>Conferir raciocínio</button>`}<button id="reviewPause" class="study-stop">Pausar e voltar à Trilha</button><p id="reviewSaveStatus" class="small" role="status"></p>`;
    const persist=()=>{try{saveReview(item,r=>({...r,draft:{...draft,question:originalQuestion(item),updatedAt:new Date().toISOString()}}));return true}catch(e){document.getElementById('reviewSaveStatus').textContent='Não foi possível salvar: '+e.message;return false}};
    panel.querySelectorAll('[data-review-choice]').forEach(b=>b.onclick=()=>{draft.selected=Number(b.dataset.reviewChoice);if(persist())renderReview()});
    panel.querySelectorAll('[data-review-confidence]').forEach(b=>b.onclick=()=>{draft.confidence=b.dataset.reviewConfidence;if(persist())renderReview()});
    if(!revealed){document.getElementById('reviewReason').oninput=e=>{draft.justification=e.target.value;persist();document.getElementById('reviewSubmit').disabled=draft.selected===null||!draft.confidence||!meaningfulJustification(draft.justification)};
      document.getElementById('reviewSubmit').onclick=()=>{
        const current=reviewState(item);if(!current.draft||current.draft.selected===null||!current.draft.confidence||!meaningfulJustification(current.draft.justification))return;
        const at=Date.now(),correct=current.draft.selected===correctOptionIndex(q),last=current.attempts?.at(-1);
        const attempt={...clone(current.draft),selectedOptionId:optionId(q,current.draft.selected),correct,correctOptionId:correctOptionId(q),answeredAt:new Date(at).toISOString(),...schedule(last,correct,current.draft.confidence,current.draft.justification,at),question:{...originalQuestion(item),correctOptionId:correctOptionId(q),explanation:revealedFeedback(q,current.draft.selected,correct)},kind:item.kind};
        try{saveReview(item,r=>({...r,draft:null,attempts:[...(r.attempts||[]),attempt]}));results.push({...attempt,key:keyOf(item),sessionId:item.material.id});renderReview()}catch(e){document.getElementById('reviewSaveStatus').textContent='Não foi possível salvar: '+e.message}
      };
    }else document.getElementById('reviewNext').onclick=()=>{position++;renderReview();scrollTop()};
    document.getElementById('reviewPause').onclick=leaveReview;
  }
  function finish(){
    const right=results.filter(r=>r.correct).length;
    panel.innerHTML=`<div class="kicker">Rodada encerrada</div><h1>Agora avance na Trilha</h1><p>${right} de ${results.length} respostas corretas nesta revisão.</p><p>Os pontos praticados foram reagendados. Sua primeira tentativa e o resultado original das sessões permanecem separados.</p><ul>${results.map(r=>`<li>${esc(r.question.prompt.slice(0,100))} — ${r.correct?'acerto':'rever'}; próximo reencontro em ${dateLabel(validDate(r.nextDueAt))}.</li>`).join('')}</ul><button id="reviewDone" class="primary">Voltar e continuar estudando</button>`;
    document.getElementById('reviewDone').onclick=leaveReview;
  }
  const baseReport=buildReport;
  buildReport=function(){
    const out=[baseReport()];
    const expanded=(session.concepts||[]).filter(c=>state.learningGuideVersions?.[c.id]);
    if(expanded.length){out.push('\nEXPLICAÇÕES AMPLIADAS ESTUDADAS');for(const c of expanded){const g=window.DP_LEARNING_GUIDES?.[c.id];if(g)out.push(`${c.id} — versão ${state.learningGuideVersions[c.id]}`,g.paragraphs.join('\n'),g.code,g.steps.join('\n'),g.trap)}}
    out.push('\nREVISÕES ESPAÇADAS — evidência separada das tentativas originais');
    for(const [key,r] of Object.entries(state.reviewPractice?.items||{})){
      if(r.draft){const d=r.draft,q=d.question;out.push(`${key}: revisão em andamento; resposta ainda não corrigida.`);if(q){out.push(q.prompt,`Estímulos: ${JSON.stringify(q.stimuli||[])}`);d.optionOrder.forEach((i,k)=>out.push(`${String.fromCharCode(65+k)}: ${q.options[i]}`))}out.push(`Seleção: ${q?.options?.[d.selected]??'—'}; segurança: ${d.confidence||'—'}; justificativa: ${d.justification||'—'}`)}
      for(const a of r.attempts||[]){const q=a.question;out.push(`\n${key} · ${a.answeredAt} · ${a.kind}`,q.prompt,`Estímulos: ${JSON.stringify(q.stimuli||[])}`);a.optionOrder.forEach((i,k)=>out.push(`${String.fromCharCode(65+k)} · ${q.optionIds?.[i]||'option_'+(i+1)}: ${q.options[i]}`));out.push(`Resposta: ${a.selectedOptionId} — ${q.options[a.selected]}`,`Segurança: ${a.confidence}`,`Justificativa: ${a.justification}`,`Resultado: ${a.correct?'acerto':'erro'}`,`Gabarito: ${a.correctOptionId}`,`Feedback: ${q.explanation}`,`Próxima revisão: ${a.nextDueAt}`)}
    }
    return out.join('\n');
  };
  // Expose pure policy for regression tests; no startup writes or generated learner evidence.
  window.DPStudyCoach={candidates,selectBatch,schedule,startReview,keyOf};
})();
