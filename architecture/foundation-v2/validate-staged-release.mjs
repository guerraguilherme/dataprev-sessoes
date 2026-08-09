import fs from 'node:fs';

function fail(errors, code, detail) { errors.push({ code, detail }); }
function uniq(xs) { return new Set(xs).size === xs.length; }
function words(s='') { return String(s).trim().split(/\s+/).filter(Boolean); }

export function validateStagedRelease(pkg) {
  const errors = [];
  if (!pkg || typeof pkg !== 'object') return { ok:false, errors:[{code:'INVALID_STAGE_SCHEMA',detail:'package must be object'}] };

  const req = ['release_id','decision_id','session_id','discipline_id','content_version','payload_checksum','primary_coverage_ids','source_ids','session_payload','qa','release_state','previous_publication_snapshot'];
  for (const k of req) if (pkg[k] === undefined || pkg[k] === null) fail(errors,'INVALID_STAGE_SCHEMA',`missing ${k}`);
  if (!Array.isArray(pkg.primary_coverage_ids) || pkg.primary_coverage_ids.length === 0) fail(errors,'UNKNOWN_COVERAGE_ID','primary_coverage_ids required');
  for (const k of ['primary_coverage_ids','secondary_coverage_ids','review_coverage_ids','source_ids']) {
    if (Array.isArray(pkg[k]) && !uniq(pkg[k])) fail(errors,'DUPLICATE_ID',k);
  }
  if (!pkg.qa || Object.values(pkg.qa).some(v => v !== true)) fail(errors,'INVALID_STAGE_SCHEMA','all QA assertions must be true');
  if (!pkg.previous_publication_snapshot?.verified) fail(errors,'INCOMPLETE_REMOTE_VERSION','previous publication snapshot must be verified');

  const sp = pkg.session_payload || {};
  if (sp.session_id && sp.session_id !== pkg.session_id) fail(errors,'TARGET_SESSION_MISMATCH','payload session_id differs');

  const seen = new Set();
  const concepts = Array.isArray(sp.concepts) ? sp.concepts : [];
  const questionGroups = [sp.fixations, sp.final_questions].filter(Array.isArray);
  for (const c of concepts) {
    if (!c.id || seen.has(c.id)) fail(errors,'DUPLICATE_ID',`concept ${c.id || '<missing>'}`); else seen.add(c.id);
    const sd = c.supportDetails || {};
    const main = `${c.what || ''} ${c.explanation || ''}`.trim();
    const supportText = Object.values(sd).filter(v => typeof v === 'string').join(' ');
    if (words(supportText).length < 20) fail(errors,'SHALLOW_SUPPORT_DETAILS',c.id || 'concept');
    if (supportText && main && supportText.toLowerCase() === main.toLowerCase()) fail(errors,'SUPPORT_DETAILS_PARAPHRASE_ONLY',c.id || 'concept');
    if (/placeholder|exemplo gen[eé]rico|lorem ipsum/i.test(supportText)) fail(errors,'PLACEHOLDER_EXAMPLE',c.id || 'concept');
    if (sd.checklist && /identifique o tema|leia com aten[cç][aã]o|elimine alternativas/i.test(sd.checklist)) fail(errors,'GENERIC_CHECKLIST',c.id || 'concept');
  }

  for (const group of questionGroups) for (const q of group) {
    if (!q.id || seen.has(q.id)) fail(errors,'DUPLICATE_ID',`question ${q.id || '<missing>'}`); else seen.add(q.id);
    const opts = Array.isArray(q.options) ? q.options : [];
    const ans = q.answerIndex ?? q.answer;
    if (opts.length < 2 || !Number.isInteger(ans) || ans < 0 || ans >= opts.length) fail(errors,'INVALID_CORRECT_ANSWER',q.id || 'question');
    if (opts.some(o => !String(o).trim())) fail(errors,'IMPLAUSIBLE_OR_EMPTY_DISTRACTOR',q.id || 'question');
    if (!q.explanation || words(q.explanation).length < 4) fail(errors,'MISSING_QUESTION_EXPLANATION',q.id || 'question');
    if (q.provenance?.kind === 'real' && q.provenance?.verified !== true) fail(errors,'UNVERIFIED_REAL_QUESTION_ATTRIBUTION',q.id || 'question');
    if (q.provenance?.adapted === true && !q.provenance?.label) fail(errors,'UNLABELLED_EDITORIAL_ADAPTATION',q.id || 'question');
  }

  if (sp.mobileQA?.answerLeak === true) fail(errors,'MOBILE_ANSWER_LEAK',pkg.session_id);
  if (sp.mobileQA?.horizontalScrollBlocker === true) fail(errors,'MOBILE_HORIZONTAL_SCROLL_BLOCKER',pkg.session_id);
  if (pkg.release_state === 'staged_release') {
    const rb = pkg.staging_readback;
    if (!rb || rb.payload_checksum !== pkg.payload_checksum || rb.session_id !== pkg.session_id || rb.content_version !== pkg.content_version) fail(errors,'STAGE_READBACK_MISMATCH',pkg.session_id);
  }
  if (pkg.release_state === 'published_release') {
    const rb = pkg.publish_readback;
    if (!rb || rb.payload_checksum !== pkg.payload_checksum || rb.session_id !== pkg.session_id || rb.content_version !== pkg.content_version) fail(errors,'PUBLISH_READBACK_MISMATCH',pkg.session_id);
  }
  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && process.argv[1].endsWith('validate-staged-release.mjs')) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node validate-staged-release.mjs <package.json>'); process.exit(2); }
  const result = validateStagedRelease(JSON.parse(fs.readFileSync(file,'utf8')));
  console.log(JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
}
