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
check('catalog loads all 29 sessions',()=>assert.equal(run('catalog.sessions.length'),29));
check('catalog count refreshed',()=>assert.match(w.document.getElementById('contentSummary').textContent,/29 sessões/));
check('idle clock and sync leave learner map unchanged',()=>{const before=w.localStorage.getItem('dataprev_sessoes_states_v2');for(let i=0;i<30;i++)run('updateClock()');assert.equal(w.localStorage.getItem('dataprev_sessoes_states_v2'),before);assert.equal(run('dpQueueCount()'),0)});
check('dashboard counts unavailable sessions',()=>assert.equal(w.document.getElementById('timeStat').textContent,'112'));
check('single support module',()=>assert.equal([...html.matchAll(/src="[^\"]*session-support-ux/g)].length,1));
check('all 156 concepts render without initial answer leakage',()=>{
 let count=0;
 for(const s of run('catalog.sessions'))for(let i=0;i<s.concepts.length;i++){
  run(`session=catalog.sessions.find(s=>s.id===${JSON.stringify(s.id)});state=freshState(session.id);state.phase='concepts';state.conceptIndex=${i};renderConcept()`);
  assert.equal(w.document.querySelectorAll('#studyBody .alt.correct,#studyBody .alt.wrong,#studyBody .feedback').length,0,s.id+' '+i);count++;
 }
 assert.equal(count,156);
});
check('existing guided example appears before the exercise',()=>{run("session=catalog.sessions.find(s=>s.id==='EST-VA-001');state=freshState(session.id);state.phase='concepts';renderConcept()");assert.match(w.document.querySelector('.concept-example').textContent,/Duas moedas/);assert(w.document.querySelector('.concept-example').compareDocumentPosition(w.document.querySelector('.exercise'))&4)});
run("session=catalog.sessions.find(s=>s.id==='PY-LOOP-001');state=freshState(session.id);state.phase='concepts';state.startedAt='2026-09-06T10:00:00.000Z';renderConcept()");
check('wrong then correct preserves first attempt',()=>{
 const q=run('session.concepts[0].immediate[0]');const wrong=(q.answer+1)%q.options.length;
 w.document.querySelector(`[data-immediate="${q.id}"][data-index="${wrong}"]`).click();
 assert.match(w.document.querySelector('#studyBody .feedback').textContent,/A resposta correta é/);
 w.document.querySelector(`[data-immediate="${q.id}"][data-index="${q.answer}"]`).click();
 assert.equal(run(`state.immediate[${JSON.stringify(q.id)}].firstAttempt`),wrong);
 assert.equal(run('learningEvidence(session,state).correctAfterFeedback'),1);
 const before=JSON.stringify(run('state'));run('learningEvidence(session,state)');assert.equal(JSON.stringify(run('state')),before);
});
check('note persists and pause offers resume',()=>{
 const note=w.document.getElementById('conceptNote');note.value='QA fictício';note.dispatchEvent(new w.Event('input'));
 w.document.querySelector('.study-stop').click();assert.match(w.document.getElementById('studyFocus').textContent,/Continue de onde parou/);
 w.document.getElementById('focusContinue').click();assert.equal(w.document.getElementById('conceptNote').value,'QA fictício');
});
check('support opens once and closes',()=>{w.document.getElementById('adaptiveToggle').click();assert.equal(w.document.querySelectorAll('.session-detail-overlay').length,1);w.document.querySelector('[data-session-close]').click();assert.equal(w.document.querySelectorAll('.session-detail-overlay').length,0)});
check('final confidence and justification preserve selected answer; report hides pending feedback',()=>{
 run("state.phase='final';state.finalIndex=0;renderFinal()");
 w.document.querySelector('[data-final-choice="0"]').click();
 w.document.querySelector('[data-confidence="alta"]').click();
 const note=w.document.getElementById('justification');note.value='não sei';note.dispatchEvent(new w.Event('input'));
 assert.equal(run('state.final[session.finalQuestions[0].id].selected'),0);
 assert.equal(w.document.querySelectorAll('#studyBody .alt.correct,#studyBody .alt.wrong').length,0);
 const report=run('buildReport()').split('QUESTÕES FINAIS')[1];assert(!report.includes('Gabarito revelado:'));
 w.document.getElementById('submitFinal').click();assert.equal(run('state.final[session.finalQuestions[0].id].submitted'),true);
});
check('reload reproduces corrected state',()=>{run('state=getState(session.id);renderFinal()');assert.equal(w.document.querySelectorAll('#studyBody .alt.correct').length,1);assert.equal(w.document.getElementById('justification').value,'não sei')});
check('report pauses clock',()=>{run('state.timerRunning=true;showReport()');assert.equal(run('state.timerRunning'),false)});
check('reset cancelled leaves data intact',()=>{const before=w.localStorage.getItem('dataprev_sessoes_states_v2');w.document.getElementById('resetBtn').click();assert.equal(w.localStorage.getItem('dataprev_sessoes_states_v2'),before)});
// Controlled delayed confirmation while new work arrives in both same and another session.
run(`state.startedAt='2026-09-06T10:00:00.000Z';dpWriteQueue({A:{stateJson:'old',queuedAt:'old',contentVersion:'v'}});sha256=async x=>'hash-'+x;readConfig=()=>({endpoint:'https://qa.invalid/sync',token:'synthetic',deviceId:'synthetic'});`);
w.setTimeout=fn=>{Promise.resolve().then(fn);return 0};run('dpScheduleFlush=()=>{}');w.fetch=async()=>({ok:true});
run(`jsonp=async()=>{const q=dpReadQueue();q.A={stateJson:'new',queuedAt:'new',contentVersion:'v'};q.B={stateJson:'other',queuedAt:'other',contentVersion:'v'};dpWriteQueue(q);return {found:true,checksum:'hash-old'}}`);
await run('dpFlushQueue()');
check('old sync acknowledgement preserves new same-session and other-session snapshots',()=>{assert.equal(run('dpReadQueue().A.stateJson'),'new');assert.equal(run('dpReadQueue().B.stateJson'),'other')});
run(`dpWriteQueue({A:{stateJson:'sent',queuedAt:'sent',contentVersion:'v'}});jsonp=async()=>({found:true,checksum:'hash-sent'})`);await run('dpFlushQueue()');
check('exact confirmed snapshot leaves queue',()=>assert.equal(run('dpQueueCount()'),0));
assert.equal(errors.length,0,errors.join('\n'));
fs.writeFileSync(process.env.DATAPREV_QA_OUTPUT||path.join(root,'architecture/runtime/study-quality-qa-0.7.16.json'),JSON.stringify({ok:true,checks,externalLearnerWrites:0,environment:'jsdom simulated DOM; not Safari or visual-browser certification'},null,2));
console.log(JSON.stringify({ok:true,checks},null,2));process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
