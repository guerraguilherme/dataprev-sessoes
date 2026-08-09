const COV = /^COV-[A-Z]+-[0-9]{4}$/;
const TRIGGERS = new Set(['manual_prepare','auto_buffer']);
const STATUSES = new Set(['ready_for_staging','no_op','blocked_fail_closed']);

export function validateComposerDecision(d, ctx = {}) {
  const errors = [];
  const req = ['schema_version','decision_id','request_id','trigger_type','target_session_id','discipline_id','primary_coverage_ids','secondary_coverage_ids','review_coverage_ids','prerequisite_advisories','evidence_summary','source_ids','composition_directives','quality_gate_requirements','cascade_allowed','state_mutations_allowed','decision_status'];
  for (const k of req) if (!(k in d)) errors.push(`INVALID_INPUT_SCHEMA:${k}`);
  if (d.schema_version !== 2) errors.push('INVALID_INPUT_SCHEMA:schema_version');
  if (!TRIGGERS.has(d.trigger_type)) errors.push('INVALID_INPUT_SCHEMA:trigger_type');
  if (!STATUSES.has(d.decision_status)) errors.push('INVALID_INPUT_SCHEMA:decision_status');
  const arrays = ['primary_coverage_ids','secondary_coverage_ids','review_coverage_ids'];
  for (const k of arrays) {
    if (!Array.isArray(d[k])) { errors.push(`INVALID_INPUT_SCHEMA:${k}`); continue; }
    if (new Set(d[k]).size !== d[k].length) errors.push(`DUPLICATE_ID:${k}`);
    for (const id of d[k]) if (!COV.test(id)) errors.push(`UNKNOWN_COVERAGE_ID:${id}`);
  }
  if (!Array.isArray(d.primary_coverage_ids) || d.primary_coverage_ids.length < 1) errors.push('INVALID_INPUT_SCHEMA:primary_coverage_ids');
  if (!Array.isArray(d.state_mutations_allowed) || d.state_mutations_allowed.length !== 0) errors.push('FORBIDDEN_HISTORY_MUTATION');
  if (d.trigger_type === 'manual_prepare') {
    if (d.cascade_allowed !== false) errors.push('CASCADE_FORBIDDEN');
    if (ctx.requested_session_id && d.target_session_id !== ctx.requested_session_id) errors.push('MANUAL_TARGET_MISMATCH');
  }
  if (d.trigger_type === 'auto_buffer' && ctx.immediate_next_session_id && d.target_session_id !== ctx.immediate_next_session_id) errors.push('AUTO_BUFFER_NOT_IMMEDIATE_NEXT');
  if (d.trigger_type === 'auto_buffer' && ctx.immediate_next_ready === true && d.decision_status !== 'no_op') errors.push('AUTO_BUFFER_ALREADY_READY');
  if (Array.isArray(d.prerequisite_advisories)) for (const p of d.prerequisite_advisories) if (p.enforcement !== 'advisory_only') errors.push('INVALID_INPUT_SCHEMA:prerequisite_enforcement');
  if (!Array.isArray(d.quality_gate_requirements) || d.quality_gate_requirements.length < 10) errors.push('MISSING_QUALITY_REQUIREMENT');
  const text = JSON.stringify(d).toLowerCase();
  if (/"mastery(_score)?"\s*:/.test(text) || /"mastered"/.test(text)) errors.push('FORBIDDEN_MASTERY_INFERENCE');
  if (ctx.valid_coverage_ids) for (const id of [...(d.primary_coverage_ids||[]),...(d.secondary_coverage_ids||[]),...(d.review_coverage_ids||[])]) if (!ctx.valid_coverage_ids.has(id)) errors.push(`UNKNOWN_COVERAGE_ID:${id}`);
  if (ctx.valid_source_ids) for (const id of d.source_ids || []) if (!ctx.valid_source_ids.has(id)) errors.push(`UNKNOWN_SOURCE_ID:${id}`);
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const sample = {
    schema_version:2, decision_id:'DEC-TEST', request_id:'REQ-TEST', trigger_type:'manual_prepare', target_session_id:'TEST-001', discipline_id:'EST',
    primary_coverage_ids:['COV-EST-0001'], secondary_coverage_ids:[], review_coverage_ids:[], prerequisite_advisories:[], evidence_summary:{}, source_ids:['SRC-EDITAL-P4-2026'],
    composition_directives:{advance_share:'70%',review_share:'30%',support_depth:'adaptive',difficulty_policy:'adaptive',cross_channel_policy:'context_only'},
    quality_gate_requirements:['supportDetails_additional','concept_specific_examples','discipline_specific_checklists','informative_visuals_when_useful','validated_answer_keys','plausible_distractors','provenance_verified','prerequisites_checked','unique_ids','mobile_json_valid'],
    cascade_allowed:false,state_mutations_allowed:[],decision_status:'ready_for_staging'
  };
  const result = validateComposerDecision(sample,{requested_session_id:'TEST-001'});
  console.log(JSON.stringify(result));
  if (!result.ok) process.exit(1);
}
