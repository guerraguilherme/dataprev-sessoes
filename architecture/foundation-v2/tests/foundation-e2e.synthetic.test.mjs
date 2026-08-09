import { validateComposerDecision } from '../validate-composer-decision.mjs';
import { validateStagedRelease } from '../validate-staged-release.mjs';

const clone = (x) => JSON.parse(JSON.stringify(x));
const VALID_COVERAGE = new Set(['COV-EST-0001','COV-EST-0002']);
const VALIDATED_COVERAGE = new Set(['COV-EST-0001','COV-EST-0002']);
const VALID_SOURCES = new Set(['SRC-EDITAL-P4-2026']);

const composerBase = {
  schema_version: 2,
  decision_id: 'DEC-TEST-001',
  request_id: 'REQ-TEST-001',
  trigger_type: 'manual_prepare',
  target_session_id: 'EST-TEST-001',
  discipline_id: 'EST',
  primary_coverage_ids: ['COV-EST-0001'],
  secondary_coverage_ids: [],
  review_coverage_ids: [],
  prerequisite_advisories: [{ coverage_id:'COV-EST-0001', enforcement:'advisory_only' }],
  evidence_summary: {},
  source_ids: ['SRC-EDITAL-P4-2026'],
  composition_directives: {},
  quality_gate_requirements: [
    'supportDetails_additional','concept_specific_examples','discipline_specific_checklists','informative_visuals_when_useful',
    'validated_answer_keys','plausible_distractors','provenance_verified','prerequisites_checked','unique_ids','mobile_json_valid'
  ],
  cascade_allowed: false,
  state_mutations_allowed: [],
  decision_status: 'ready_for_staging'
};

const concept = {
  id: 'C1',
  what: 'Probabilidade quantifica incerteza.',
  explanation: 'Representa a chance de eventos em um espaço amostral.',
  supportDetails: {
    core: 'Probabilidade é uma medida numérica associada a eventos de um experimento aleatório.',
    intuition: 'Em casos equiprováveis, compare quantos resultados favorecem o evento com quantos resultados são possíveis.',
    why: 'Separar espaço amostral e evento evita misturar resultado individual com conjunto de resultados favoráveis.',
    identify: 'Antes da conta, identifique experimento, espaço amostral, evento e se os resultados são equiprováveis.',
    example: 'Num dado justo, o evento sair par contém 2, 4 e 6; são três resultados favoráveis entre seis possíveis.',
    contrast: 'Um resultado elementar é um único resultado; um evento pode reunir vários resultados elementares.',
    trap: 'Não use favoráveis sobre total quando os resultados não forem equiprováveis sem justificar o modelo.',
    connection: 'O complemento simplifica questões de pelo menos um quando o cálculo direto exige muitos casos.',
    checklist: 'Liste o espaço amostral, delimite o evento, teste equiprobabilidade e só então aplique a razão apropriada.',
    microcheck: 'Com oito resultados equiprováveis e dois favoráveis, a probabilidade é 2/8.'
  }
};

const question = {
  id: 'Q1',
  prompt: 'Em um dado justo, qual a probabilidade de sair número par?',
  options: ['1/6','1/3','1/2','2/3','5/6'],
  answerIndex: 2,
  explanation: 'Há três resultados pares entre seis equiprováveis, então a probabilidade é 3/6 = 1/2.',
  provenance: { kind:'authorial', label:'Autoral — estilo FGV' }
};

const stageBase = {
  release_id: 'REL-TEST-001',
  decision_id: 'DEC-TEST-001',
  session_id: 'EST-TEST-001',
  discipline_id: 'EST',
  content_version: 'test-v1',
  payload_checksum: 'checksum-test-001',
  primary_coverage_ids: ['COV-EST-0001'],
  secondary_coverage_ids: [],
  review_coverage_ids: [],
  source_ids: ['SRC-EDITAL-P4-2026'],
  session_payload: {
    session_id: 'EST-TEST-001',
    declared_counts: { concepts:1, fixations:1, final_questions:1 },
    concepts: [concept],
    fixations: [question],
    final_questions: [{...question,id:'Q2'}],
    visual_requirement: { required:false, satisfied:true },
    mobileQA: { answerLeak:false, horizontalScrollBlocker:false }
  },
  qa: {
    schema_valid:true, ids_unique:true, coverage_validated:true, provenance_valid:true,
    pedagogical_depth_pass:true, informative_visual_pass:true, question_integrity_pass:true,
    question_count_pass:true, mobile_qa_pass:true, no_history_mutation:true, no_mastery_mutation:true
  },
  release_state: 'staged_release',
  previous_publication_snapshot: { verified:true, content_version:'known-good' },
  staging_readback: {
    payload_checksum:'checksum-test-001', session_id:'EST-TEST-001', content_version:'test-v1',
    coverage_ids:['COV-EST-0001'], source_ids:['SRC-EDITAL-P4-2026']
  }
};

const tests = [];
function add(name, run, expectedOk, expectedCode) {
  const result = run();
  const codes = (result.errors || []).map(e => typeof e === 'string' ? e : e.code);
  const passed = result.ok === expectedOk && (!expectedCode || codes.some(c => c === expectedCode || c.startsWith(expectedCode)));
  tests.push({name,passed,result});
}

add('composer_valid_manual', () => validateComposerDecision(composerBase,{requested_session_id:'EST-TEST-001',valid_coverage_ids:VALID_COVERAGE,valid_source_ids:VALID_SOURCES}), true);
let d = clone(composerBase); d.target_session_id='EST-OTHER'; add('manual_target_mismatch',()=>validateComposerDecision(d,{requested_session_id:'EST-TEST-001'}),false,'MANUAL_TARGET_MISMATCH');
d = clone(composerBase); d.cascade_allowed=true; add('manual_cascade_forbidden',()=>validateComposerDecision(d,{}),false,'CASCADE_FORBIDDEN');
d = clone(composerBase); d.state_mutations_allowed=['complete_previous']; add('history_mutation_forbidden',()=>validateComposerDecision(d,{}),false,'FORBIDDEN_HISTORY_MUTATION');
d = clone(composerBase); d.evidence_summary={mastery_score:0.9}; add('mastery_inference_forbidden',()=>validateComposerDecision(d,{}),false,'FORBIDDEN_MASTERY_INFERENCE');
d = clone(composerBase); d.trigger_type='auto_buffer'; d.target_session_id='EST-TEST-003'; add('auto_buffer_only_immediate_next',()=>validateComposerDecision(d,{immediate_next_session_id:'EST-TEST-002'}),false,'AUTO_BUFFER_NOT_IMMEDIATE_NEXT');
d = clone(composerBase); d.trigger_type='auto_buffer'; d.target_session_id='EST-TEST-002'; add('auto_buffer_ready_becomes_noop',()=>validateComposerDecision(d,{immediate_next_session_id:'EST-TEST-002',immediate_next_ready:true}),false,'AUTO_BUFFER_ALREADY_READY');
d = clone(composerBase); d.primary_coverage_ids=['COV-EST-9999']; add('composer_unknown_coverage',()=>validateComposerDecision(d,{valid_coverage_ids:VALID_COVERAGE}),false,'UNKNOWN_COVERAGE_ID');
d = clone(composerBase); d.source_ids=['SRC-FAKE']; add('composer_unknown_source',()=>validateComposerDecision(d,{valid_source_ids:VALID_SOURCES}),false,'UNKNOWN_SOURCE_ID');
d = clone(composerBase); d.prerequisite_advisories=[{coverage_id:'COV-EST-0001',enforcement:'hard_block'}]; add('prerequisite_never_hard_block',()=>validateComposerDecision(d,{}),false,'INVALID_INPUT_SCHEMA:prerequisite_enforcement');

const stageCtx = {valid_coverage_ids:VALID_COVERAGE,validated_coverage_ids:VALIDATED_COVERAGE,valid_source_ids:VALID_SOURCES,require_extended_stage_readback:true};
add('stage_valid',()=>validateStagedRelease(stageBase,stageCtx),true);
let p = clone(stageBase); p.primary_coverage_ids=['COV-EST-9999']; add('stage_unknown_coverage',()=>validateStagedRelease(p,stageCtx),false,'UNKNOWN_COVERAGE_ID');
p = clone(stageBase); p.source_ids=['SRC-FAKE']; add('stage_unknown_source',()=>validateStagedRelease(p,stageCtx),false,'UNKNOWN_SOURCE_ID');
p = clone(stageBase); add('stage_invalid_source_provenance',()=>validateStagedRelease(p,{...stageCtx,invalid_source_ids:new Set(['SRC-EDITAL-P4-2026'])}),false,'INVALID_SOURCE_PROVENANCE');
p = clone(stageBase); p.session_payload.concepts[0].supportDetails={core:'Curto.'}; add('shallow_support',()=>validateStagedRelease(p,stageCtx),false,'SHALLOW_SUPPORT_DETAILS');
p = clone(stageBase); delete p.session_payload.concepts[0].supportDetails.example; add('missing_concept_example',()=>validateStagedRelease(p,stageCtx),false,'SHALLOW_SUPPORT_DETAILS');
p = clone(stageBase); delete p.session_payload.concepts[0].supportDetails.checklist; add('missing_discipline_checklist',()=>validateStagedRelease(p,stageCtx),false,'SHALLOW_SUPPORT_DETAILS');
p = clone(stageBase); p.session_payload.concepts[0].supportDetails.example='placeholder'; add('placeholder_example',()=>validateStagedRelease(p,stageCtx),false,'PLACEHOLDER_EXAMPLE');
p = clone(stageBase); p.session_payload.concepts[0].supportDetails.checklist='Leia com atenção e elimine alternativas.'; add('generic_checklist',()=>validateStagedRelease(p,stageCtx),false,'GENERIC_CHECKLIST');
p = clone(stageBase); p.session_payload.fixations[0].answerIndex=9; add('invalid_answer_key',()=>validateStagedRelease(p,stageCtx),false,'INVALID_CORRECT_ANSWER');
p = clone(stageBase); p.session_payload.fixations[0].options[1]=''; add('empty_distractor',()=>validateStagedRelease(p,stageCtx),false,'IMPLAUSIBLE_OR_EMPTY_DISTRACTOR');
p = clone(stageBase); p.session_payload.final_questions[0].explanation='correta'; add('missing_question_explanation',()=>validateStagedRelease(p,stageCtx),false,'MISSING_QUESTION_EXPLANATION');
p = clone(stageBase); p.session_payload.final_questions[0].provenance={kind:'real',verified:false}; add('unverified_real_attribution',()=>validateStagedRelease(p,stageCtx),false,'UNVERIFIED_REAL_QUESTION_ATTRIBUTION');
p = clone(stageBase); p.session_payload.final_questions[0].provenance={kind:'real',verified:true,adapted:true}; add('unlabelled_adaptation',()=>validateStagedRelease(p,stageCtx),false,'UNLABELLED_EDITORIAL_ADAPTATION');
p = clone(stageBase); p.session_payload.final_questions[0].provenance={kind:'authorial',label:'Questão nova'}; add('authorial_label_required',()=>validateStagedRelease(p,stageCtx),false,'INVALID_SOURCE_PROVENANCE');
p = clone(stageBase); p.session_payload.declared_counts.final_questions=2; add('question_count_mismatch',()=>validateStagedRelease(p,stageCtx),false,'QUESTION_COUNT_MISMATCH');
p = clone(stageBase); p.session_payload.visual_requirement={required:true,satisfied:false}; add('informative_visual_when_required',()=>validateStagedRelease(p,stageCtx),false,'MISSING_INFORMATIVE_VISUAL');
p = clone(stageBase); p.session_payload.mobileQA.answerLeak=true; add('mobile_answer_leak',()=>validateStagedRelease(p,stageCtx),false,'MOBILE_ANSWER_LEAK');
p = clone(stageBase); p.session_payload.mobileQA.horizontalScrollBlocker=true; add('mobile_horizontal_scroll',()=>validateStagedRelease(p,stageCtx),false,'MOBILE_HORIZONTAL_SCROLL_BLOCKER');
p = clone(stageBase); p.staging_readback.payload_checksum='wrong'; add('stage_checksum_readback',()=>validateStagedRelease(p,stageCtx),false,'STAGE_READBACK_MISMATCH');
p = clone(stageBase); p.staging_readback.coverage_ids=[]; add('stage_coverage_readback',()=>validateStagedRelease(p,stageCtx),false,'STAGE_READBACK_MISMATCH');
p = clone(stageBase); p.previous_publication_snapshot.verified=false; add('incomplete_previous_remote',()=>validateStagedRelease(p,stageCtx),false,'INCOMPLETE_REMOTE_VERSION');
p = clone(stageBase); p.qa={schema_valid:true}; add('all_qa_assertions_required',()=>validateStagedRelease(p,stageCtx),false,'INVALID_STAGE_SCHEMA');
p = clone(stageBase); p.state_mutations_allowed=['complete_previous']; add('stage_history_mutation_forbidden',()=>validateStagedRelease(p,stageCtx),false,'FORBIDDEN_HISTORY_MUTATION');
p = clone(stageBase); p.mastery_mutation={coverage_id:'COV-EST-0001',score:1}; add('stage_mastery_mutation_forbidden',()=>validateStagedRelease(p,stageCtx),false,'FORBIDDEN_MASTERY_MUTATION');
p = clone(stageBase); p.release_state='published_release'; p.publish_readback={payload_checksum:'checksum-test-001',session_id:'EST-TEST-001',content_version:'test-v1',publication_pointer:'github:test'}; add('published_readback_valid',()=>validateStagedRelease(p,stageCtx),true);
p = clone(stageBase); p.release_state='published_release'; p.publish_readback={payload_checksum:'wrong',session_id:'EST-TEST-001',content_version:'test-v1',publication_pointer:'github:test'}; add('publish_readback_mismatch',()=>validateStagedRelease(p,stageCtx),false,'PUBLISH_READBACK_MISMATCH');
p = clone(stageBase); p.rollback={required:true,verified:false}; add('rollback_failure_is_hard_error',()=>validateStagedRelease(p,stageCtx),false,'ROLLBACK_FAILED');

const failed = tests.filter(t => !t.passed);
console.log(JSON.stringify({total:tests.length,passed:tests.length-failed.length,failed:failed.length,failures:failed.map(f=>({name:f.name,result:f.result}))},null,2));
process.exit(failed.length ? 1 : 0);
