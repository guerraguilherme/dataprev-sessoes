const {JSDOM}=require('jsdom');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'../../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dom=new JSDOM(html,{url:'https://qa.invalid/dataprev-sessoes/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,ctx=dom.getInternalVMContext(),checks=[],errors=[];
w.console.warn=(...a)=>errors.push(a.map(String).join(' '));w.console.error=w.console.warn;
w.setInterval=()=>0;w.setTimeout=()=>0;w.requestAnimationFrame=()=>0;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false});w.CSS={escape:s=>s};w.alert=s=>{throw Error('Unexpected alert: '+s)};w.confirm=()=>false;
w.fetch=async u=>{const p=new URL(u,w.location.href);assert.equal(p.origin,'https://qa.invalid','external write/read denied');const file=path.join(root,p.pathname.replace('/dataprev-sessoes/',''));return {ok:fs.existsSync(file),status:fs.existsSync(file)?200:404,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))}};
for(const m of html.matchAll(/<script src="\.\/([^?\"]+)/g))vm.runInContext(fs.readFileSync(path.join(root,m[1]),'utf8'),ctx,{filename:m[1]});
const run=code=>vm.runInContext(code,ctx);const check=(name,fn)=>{fn();checks.push({name,status:'PASS'})};
(async()=>{
for(let i=0;i<20;i++)await Promise.resolve();
const api=w.DPStudyCoach,day=86400000,now=Date.now();
const initial=w.localStorage.getItem('dataprev_sessoes_states_v2');
check('No invented review evidence from canonical completion or startup',()=>{assert.equal(api.candidates().length,0);run('renderHome()');assert.equal(w.localStorage.getItem('dataprev_sessoes_states_v2'),initial);assert.equal(run('dpQueueCount()'),0)});
check('All 12 transfer questions have stable IDs and complete distractor feedback',()=>{const gs=Object.values(w.DP_LEARNING_GUIDES);assert.equal(gs.length,12);for(const g of gs){assert.equal(g.transfer.options.length,4);assert.equal(Object.keys(g.transfer.feedbackByOption).length,4);assert(g.steps.length>=3);assert(g.paragraphs.length>=2)}});
check('New order removes uniform position patterns while preserving canonical answer identity',()=>{
 for(const id of ['MAT-ALG-002','BD-NORM-002','MAT-ALG-004A','EN-TEXT-001']){
 run(`session=catalog.sessions.find(s=>s.id==='${id}')`);const qs=run('[...session.concepts.flatMap(c=>c.immediate||[]),...session.finalQuestions]'),positions=[];
 for(const q of qs){const order=run(`questionOrder(${JSON.stringify(q)},{})`);assert.equal(new Set(order).size,q.options.length);positions.push(order.indexOf(q.answer));assert.equal(run(`correctOptionIndex(${JSON.stringify(q)})`),q.answer)}
 assert(new Set(positions).size>=3,id+': insufficient position variation');
 }
});
check('Legacy draft and answered question keep original order byte-for-byte',()=>{
 run("session=catalog.sessions.find(s=>s.id==='MAT-ALG-004A')");const q=run('session.finalQuestions[0]');for(const r of [{selected:0},{confidence:'alta'},{attempts:[0],correct:true},{justification:'já pensei'}]){const before=JSON.stringify(r);assert.deepEqual([...run(`questionOrder(${JSON.stringify(q)},${JSON.stringify(r)})`)],q.options.map((_,i)=>i));assert.equal(JSON.stringify(r),before)}
});
check('Shuffled selection records canonical index and persists shown order across confidence and report',()=>{
 run("session=catalog.sessions.find(s=>s.id==='MAT-ALG-004A');state=freshState(session.id);state.startedAt=new Date().toISOString();state.phase='final';renderFinal()");
 const q=run('session.finalQuestions[0]'),before=[...w.document.querySelectorAll('[data-final-choice]')].map(x=>x.dataset.finalChoice);
 w.document.querySelector(`[data-final-choice='${q.answer}']`).click();w.document.querySelector('[data-confidence=alta]').click();
 assert.deepEqual([...w.document.querySelectorAll('[data-final-choice]')].map(x=>x.dataset.finalChoice),before);
 const t=w.document.getElementById('justification');t.value='Apliquei a propriedade';t.dispatchEvent(new w.Event('input'));
 w.document.getElementById('submitFinal').click();assert.equal(run('state.final[session.finalQuestions[0].id].correct'),true);
 const report=run('buildReport()').split('QUESTÕES FINAIS')[1];assert(report.includes('A · option_'+(Number(before[0])+1)));
});
// Known aged records across three sessions, isolated test data; no network service.
run(`writeMap({});state=freshState('PY-LOOP-001');session=catalog.sessions.find(s=>s.id===state.sessionId)`);
const seeded={};for(const id of ['PY-LOOP-001','PY-FUNC-001','EST-VA-001']){
 const s=run(`catalog.sessions.find(s=>s.id==='${id}')`),r=run(`freshState('${id}')`);r.startedAt=new Date(now-10*day).toISOString();r.lastTick=now-4*day;r.phase='final';r.notes={untouched:'preserve'};
 for(const [i,q] of s.finalQuestions.entries())r.final[q.id]={selected:q.answer,firstAttempt:q.answer,selectedOptionId:q.optionIds?.[q.answer]||'option_'+(q.answer+1),firstAttemptOptionId:q.optionIds?.[q.answer]||'option_'+(q.answer+1),submitted:true,correct:i!==0,confidence:i===1?'media':'alta',justification:'Justificativa original',answeredAt:new Date(now-4*day).toISOString()};
 seeded[id]=r;
}
w.localStorage.setItem('dataprev_sessoes_states_v2',JSON.stringify(seeded));run("state=getState('PY-LOOP-001')");
check('Scheduling prioritizes recorded errors and spreads three items across sessions',()=>{const list=api.candidates(now);assert.equal(list[0].priority,0);const picked=api.selectBatch(list.filter(x=>x.dueNow));assert.equal(picked.length,3);assert.equal(new Set(picked.map(x=>x.material.id)).size,3)});
check('Unseen enhanced content never creates a transfer assessment',()=>assert.equal(api.candidates().filter(x=>x.kind==='transfer').length,0));
check('Confident success expands interval; uncertainty and failure return next day',()=>{
 for(const [correct,confidence,j,days] of [[true,'alta','calculei',3],[true,'media','calculei',1],[true,'alta','não sei',1],[false,'alta','calculei',1]])assert.equal(api.schedule(null,correct,confidence,j,now).intervalDays,days);
 assert.equal(api.schedule({secureStreak:1},true,'alta','calculei',now).intervalDays,7);
 assert.equal(api.schedule({secureStreak:9},true,'alta','calculei',now).intervalDays,14);
});
api.startReview();let item=api.selectBatch(api.candidates().filter(x=>x.dueNow))[0],key=api.keyOf(item);
check('Review starts without exposing answer and requires choice confidence and explanation',()=>{assert.equal(w.document.querySelectorAll('#reviewPanel .correct,#reviewPanel .wrong,#reviewPanel .feedback').length,0);assert(w.document.getElementById('reviewSubmit').disabled)});
// Static render fixture: actual component markup/styles, no scripts or learner storage.
const visualFrames=[];
function captureVisual(label){
 const css=w.document.querySelector('style').textContent+fs.readFileSync(path.join(root,'planner.css'),'utf8')+fs.readFileSync(path.join(root,'study-coach.css'),'utf8');
 const cloned=w.document.body.cloneNode(true);cloned.querySelectorAll('script,.hidden').forEach(x=>x.remove());
 visualFrames.push({label,html:'<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head>'+cloned.outerHTML+'</html>'});
}
captureVisual('Revisão antes da resposta — dados fictícios');
const choice=(item.q.answer+1)%item.q.options.length;
w.document.querySelector(`[data-review-choice='${choice}']`).click();w.document.querySelector('[data-review-confidence=media]').click();const reason=w.document.getElementById('reviewReason');reason.value='Escolhi pela regra';reason.dispatchEvent(new w.Event('input'));
check('Review draft survives pause and reload of session map without leaking report answer',()=>{
 w.document.getElementById('reviewPause').click();assert.match(w.document.getElementById('startReview').textContent,/Retomar/);api.startReview();assert.equal(w.document.getElementById('reviewReason').value,'Escolhi pela regra');assert.equal(w.document.querySelector('[data-review-confidence=media]').getAttribute('aria-pressed'),'true');
 run(`session=catalog.sessions.find(s=>s.id==='${item.material.id}');state=getState(session.id)`);
 const report=run('buildReport()').split('REVISÕES ESPAÇADAS')[1];assert(report.includes(item.q.prompt));assert(!report.includes('Gabarito:'));assert(!report.includes(item.q.explanation));
});
// Concurrent note update in latest map must survive review acknowledgement locally.
run(`{const m=readMap();m['${item.material.id}'].notes.concurrent='new note';writeMap(m)}`);
w.document.getElementById('reviewSubmit').click();
captureVisual('Revisão corrigida — dados fictícios');
check('Review correction persists separate evidence and queues the full latest checkpoint',()=>{
 const record=run(`readMap()['${item.material.id}']`);assert.equal(record.notes.concurrent,'new note');assert.equal(JSON.stringify(record.final),JSON.stringify(seeded[item.material.id].final));assert.equal(record.lastTick,seeded[item.material.id].lastTick);const a=record.reviewPractice.items[key].attempts[0];assert.equal(a.correct,false);assert.equal(a.intervalDays,1);assert.equal(a.selected,choice);assert.equal(record.reviewPractice.items[key].draft,null);
 const queued=JSON.parse(run(`dpReadQueue()['${item.material.id}'].stateJson`));assert.equal(queued.reviewPractice.items[key].attempts.length,1);assert.equal(queued.notes.concurrent,'new note');assert.equal(w.document.querySelectorAll('#reviewPanel .correct').length,1);
});
check('Corrected review is not immediately due and report includes full evidence',()=>{
 assert.equal(api.candidates().find(x=>x.material.id===item.material.id&&api.keyOf(x)===key).dueNow,false);
 run('state=getState(session.id)');const report=run('buildReport()').split('REVISÕES ESPAÇADAS')[1];for(const str of [item.q.prompt,'Escolhi pela regra','Gabarito:','Próxima revisão:'])assert(report.includes(str));
});
check('All enhanced concepts teach before asking; original question payloads unchanged',()=>{
 for(const [cid,g] of Object.entries(w.DP_LEARNING_GUIDES)){
  run(`session=catalog.sessions.find(s=>s.id==='${g.sessionId}');state=freshState(session.id);state.phase='concepts';state.conceptIndex=session.concepts.findIndex(c=>c.id==='${cid}');renderConcept()`);
  const guide=w.document.querySelector('.learning-guide'),exercise=w.document.querySelector('#studyBody .exercise');assert(guide.compareDocumentPosition(exercise)&4);assert.equal(w.document.querySelectorAll('#studyBody .alt.correct,#studyBody .alt.wrong').length,0);
 }
});
check('A taught concept can later create a transfer question with full feedback',()=>{
 run("session=catalog.sessions.find(s=>s.id==='EST-VA-001');state=freshState(session.id);state.phase='concepts';state.startedAt=new Date().toISOString();renderConcept();answerImmediate(session.concepts[0].immediate[0].id,0)");
 assert.equal(run("state.learningGuideVersions['EST-VA-C01']"),'1.0.0');assert(api.candidates(now+5*day).some(x=>x.kind==='transfer'));
});
run("session=catalog.sessions.find(s=>s.id==='NP-001');state=freshState(session.id);state.phase='concepts';state.conceptIndex=1;renderConcept()");w.document.body.classList.remove('review-mode');captureVisual('NumPy: shape, dimensões e tamanho');
const e=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
fs.writeFileSync(path.join(root,'architecture/learning/visual-qa-0.7.17.html'),'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>DATAPREV 0.7.17 — visual QA fictício</title><style>body{font:16px system-ui;background:#eee;padding:16px}iframe{display:block;border:1px solid #bbb;margin:12px 0 32px;height:1400px;max-width:100%}</style><h1>Prévia estática — dados fictícios</h1><p>Componentes renderizados pelo teste. Sem scripts, armazenamento ou sincronização.</p>'+visualFrames.map(f=>'<h2>'+f.label+'</h2><iframe title="'+f.label+' mobile" width="390" sandbox srcdoc="'+e(f.html)+'"></iframe><iframe title="'+f.label+' desktop" width="1024" sandbox srcdoc="'+e(f.html)+'"></iframe>').join('')+'</html>');
assert.equal(errors.length,0,errors.join('\n'));
fs.writeFileSync(path.join(root,'architecture/runtime/study-coach-qa-0.7.17.json'),JSON.stringify({ok:true,checks,externalLearnerWrites:0,environment:'simulated DOM; no physical Safari certification'},null,2));
console.log(JSON.stringify({ok:true,checks},null,2));process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
