export function releasePreflight({staged,currentPublication,registries,manualDemand}) {
  const errors=[];
  if(!staged || staged.release_state!=='staged_release') errors.push('NOT_STAGED_RELEASE');
  if(!manualDemand || manualDemand.session_id!==staged?.session_id) errors.push('NO_MATCHING_ACTUAL_STUDY_DEMAND');
  if(!currentPublication?.verified || currentPublication.status!=='published') errors.push('NO_VERIFIED_CURRENT_PUBLICATION');
  if(staged?.previous_publication_snapshot?.content_version!==currentPublication?.content_version) errors.push('STALE_PUBLICATION_SNAPSHOT');
  const cov=[...(staged?.primary_coverage_ids||[]),...(staged?.secondary_coverage_ids||[]),...(staged?.review_coverage_ids||[])];
  for(const id of cov){ if(!registries?.validatedCoverageIds?.has(id)) errors.push(`UNVALIDATED_COVERAGE:${id}`); }
  for(const id of staged?.source_ids||[]){ if(!registries?.validSourceIds?.has(id)) errors.push(`INVALID_SOURCE:${id}`); }
  if(staged?.qa && Object.values(staged.qa).some(v=>v!==true)) errors.push('QA_NOT_ALL_TRUE');
  if(Array.isArray(staged?.state_mutations_allowed) && staged.state_mutations_allowed.length) errors.push('FORBIDDEN_STATE_MUTATION');
  if(staged?.mastery_mutation!=null) errors.push('FORBIDDEN_MASTERY_MUTATION');
  return {ok:errors.length===0,errors,session_id:staged?.session_id||null};
}
