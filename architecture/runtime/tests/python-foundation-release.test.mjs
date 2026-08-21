import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const json=relative=>JSON.parse(read(relative));
const checks=[];
const check=(name,fn)=>{fn();checks.push({name,status:'PASS'})};

const app=read('app.js');
const loader=read('prepared-sessions-loader.js');
const sw=read('service-worker.js');
const support=read('session-support-ux.js');
const bridge=json('architecture/runtime/content-factory-v3-pwa-bridge-v1.json');
const loop=json('PY-LOOP-001.json');
const func=json('PY-FUNC-001.json');
const coll=json('PY-COLL-001.json');
const numpy=json('PY-NP-001.json');

function allItems(session){
  return [
    ...session.concepts.flatMap(c=>c.immediate||[]),
    ...session.concepts.flatMap(c=>c.supportPractice||[]),
    ...session.finalQuestions
  ];
}

function validateItem(item,{final=false}={}){
  assert.ok(item.id,'item sem id');
  assert.ok(Array.isArray(item.options)&&item.options.length>1,`${item.id}: opções`);
  if(final)assert.equal(item.options.length,5,`${item.id}: final deve ter cinco alternativas`);
  assert.equal(item.optionIds.length,item.options.length,`${item.id}: optionIds`);
  assert.equal(new Set(item.optionIds).size,item.optionIds.length,`${item.id}: optionIds duplicados`);
  assert.equal(item.optionIds[item.answer],item.correctOptionId,`${item.id}: gabarito semântico`);
  assert.deepEqual(Object.keys(item.feedbackByOption).sort(),[...item.optionIds].sort(),`${item.id}: feedback por opção`);
  for(const id of item.optionIds){
    const minimum=id===item.correctOptionId?10:20;
    assert.ok(String(item.feedbackByOption[id]).trim().length>=minimum,`${item.id}/${id}: feedback raso`);
  }
}

function validateSession(session,expectedId){
  assert.equal(session.id,expectedId);
  assert.equal(session.status,'published');
  assert.equal(session.concepts.length,6);
  assert.equal(session.finalQuestions.length,8);
  const ids=[session.id];
  for(const concept of session.concepts){
    ids.push(concept.id);
    assert.ok(concept.connection?.trim(),`${concept.id}: conexão ausente`);
    assert.ok(concept.trap?.trim(),`${concept.id}: pegadinha ausente`);
    assert.ok(concept.supportDetails?.example,`${concept.id}: exemplo de apoio ausente`);
    assert.ok((concept.visuals||[]).length>0,`${concept.id}: visual principal ausente`);
    assert.ok((concept.supportVisuals||[]).length>0,`${concept.id}: representação alternativa ausente`);
    assert.ok((concept.supportPractice||[]).length>=2,`${concept.id}: microperguntas insuficientes`);
    for(const item of [...concept.immediate||[],...concept.supportPractice||[]]){ids.push(item.id);validateItem(item)}
  }
  for(const item of session.finalQuestions){
    ids.push(item.id);validateItem(item,{final:true});
    assert.match(item.origin?.type||item.provenance?.originType||'',/authorial_fgv_style/,`${item.id}: origem`);
  }
  assert.equal(new Set(ids).size,ids.length,`${expectedId}: IDs duplicados`);
  const distribution=Array(5).fill(0);session.finalQuestions.forEach(q=>distribution[q.answer]++);
  assert.ok(Math.max(...distribution)<=2,`${expectedId}: padrão previsível ${distribution}`);
}

check('PY_LOOP_CONTENT_GATE',()=>validateSession(loop,'PY-LOOP-001'));
check('PY_FUNC_CONTENT_GATE',()=>validateSession(func,'PY-FUNC-001'));

check('CURRICULUM_SEQUENCE_RECONCILED',()=>{
  assert.ok(loop.prerequisites.includes('PY-COLL-001'));
  assert.ok(func.prerequisites.includes('PY-LOOP-001'));
  assert.ok(numpy.prerequisites.includes('PY-LOOP-001'));
  assert.ok(numpy.prerequisites.includes('PY-FUNC-001'));
  assert.match(coll.nextStep,/PY-LOOP-001/);
  assert.match(loop.nextStep,/PY-FUNC-001/);
  assert.match(func.nextStep,/NP-001/);
  assert.deepEqual(bridge.python_foundation_release_0_7_15.recommended_sequence,['PY-LOOP-001','PY-FUNC-001','NP-001']);
  assert.equal(bridge.python_foundation_release_0_7_15.curriculum_mapping_status['PY-LOOP-001'],'mapped_proposed');
  assert.equal(bridge.python_foundation_release_0_7_15.curriculum_mapping_status['PY-FUNC-001'],'mapped_proposed');
});

check('LOADER_AND_OFFLINE_ALLOWLIST',()=>{
  const loopAt=loader.indexOf("{file:'PY-LOOP-001.json'}");
  const funcAt=loader.indexOf("{file:'PY-FUNC-001.json'}");
  const numpyAt=loader.indexOf("{file:'PY-NP-001.json'");
  assert.ok(loopAt>0&&funcAt>loopAt&&numpyAt>funcAt,'ordem do loader');
  assert.equal((loader.match(/PY-LOOP-001\.json/g)||[]).length,1);
  assert.equal((loader.match(/PY-FUNC-001\.json/g)||[]).length,1);
  assert.equal((sw.match(/\.\/PY-LOOP-001\.json/g)||[]).length,1);
  assert.equal((sw.match(/\.\/PY-FUNC-001\.json/g)||[]).length,1);
});

check('SEMANTIC_OPTION_ID_IS_CANONICAL',()=>{
  const start=app.indexOf('const optionId=');
  const end=app.indexOf('function meaningfulJustification',start);
  assert.ok(start>=0&&end>start);
  const context={String,Number};
  vm.runInNewContext(`${app.slice(start,end)};this.api={optionId,correctOptionId,correctOptionIndex,selectedOptionIndex,attemptOptionId,attemptOptionIndex};`,context);
  const q={options:['incorreta','correta'],optionIds:['wrong_semantic','right_semantic'],correctOptionId:'right_semantic',answer:0};
  assert.equal(context.api.correctOptionIndex(q),1,'answer posicional obsoleto não pode vencer correctOptionId');
  assert.equal(context.api.selectedOptionIndex(q,{selected:0,selectedOptionId:'right_semantic'}),1,'selectedOptionId deve vencer índice obsoleto');
  assert.equal(context.api.attemptOptionIndex(q,{optionId:'right_semantic',presentedIndex:0}),1);
  assert.match(app,/rec\.correct=chosenId===rec\.correctOptionId/);
  assert.match(app,/rec\.correct=rec\.selectedOptionId===rec\.correctOptionId/);
});

check('FIRST_ATTEMPT_AND_REPORT_NO_LEAK',()=>{
  assert.match(app,/legacyFirst=previous\[0\]/);
  assert.match(app,/if\(!rec\.firstAttemptOptionId&&legacyFirst!==undefined\)/);
  assert.match(app,/Gabarito: ainda não revelado/);
  assert.match(app,/if\(r\.submitted\)out\.push\(`Gabarito revelado/);
});

check('SUPPORT_IS_LOCAL_AND_EXPLICITLY_REVEALED',()=>{
  assert.match(support,/r\?\.submitted===true/);
  assert.match(support,/submitted:true,revealed:true/);
  assert.match(support,/não alteram seu resultado formal/);
  assert.doesNotMatch(support,/Learner Evidence|mastery\s*=/i);
  for(const item of [...allItems(loop),...allItems(func)])validateItem(item,{final:loop.finalQuestions.includes(item)||func.finalQuestions.includes(item)});
});

check('LEARNER_STATE_CONTRACT_UNCHANGED',()=>{
  assert.match(app,/STATE_MAP_KEY='dataprev_sessoes_states_v2'/);
  assert.equal(bridge.python_foundation_release_0_7_15.learner_state_write,false);
  assert.equal(bridge.python_foundation_release_0_7_15.learner_state_schema_change,false);
});

console.log(JSON.stringify({ok:true,total:checks.length,checks},null,2));
