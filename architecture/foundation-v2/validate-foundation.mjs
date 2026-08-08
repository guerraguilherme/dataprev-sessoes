const COVERAGE_ID = /^COV-[A-Z0-9]+-[0-9]{4,}$/;

export function validateCoverageRegistry(entries) {
  const errors = [];
  const ids = new Set();
  const keys = new Set();
  for (const [i, e] of entries.entries()) {
    if (!COVERAGE_ID.test(e.coverage_id || '')) errors.push(`coverage[${i}]: invalid coverage_id`);
    if (!e.canonical_key) errors.push(`coverage[${i}]: missing canonical_key`);
    if (!e.discipline_id) errors.push(`coverage[${i}]: missing discipline_id`);
    if (!e.program_ref) errors.push(`coverage[${i}]: missing program_ref`);
    if (!e.semantic_scope || typeof e.semantic_scope !== 'object') errors.push(`coverage[${i}]: missing semantic_scope`);
    if (ids.has(e.coverage_id)) errors.push(`coverage[${i}]: duplicate coverage_id ${e.coverage_id}`);
    if (keys.has(e.canonical_key)) errors.push(`coverage[${i}]: duplicate canonical_key ${e.canonical_key}`);
    ids.add(e.coverage_id);
    keys.add(e.canonical_key);
  }
  return { ok: errors.length === 0, errors };
}

export function validateSources(entries) {
  const errors = [];
  const ids = new Set();
  for (const [i, e] of entries.entries()) {
    for (const f of ['source_id','source_type','title','canonical_locator','authority_level','provenance_status','registry_version']) {
      if (!e[f]) errors.push(`source[${i}]: missing ${f}`);
    }
    if (ids.has(e.source_id)) errors.push(`source[${i}]: duplicate source_id ${e.source_id}`);
    ids.add(e.source_id);
  }
  return { ok: errors.length === 0, errors };
}

export function validateEvents(events, coverageIds = new Set()) {
  const errors = [];
  const eventIds = new Set();
  for (const [i, e] of events.entries()) {
    for (const f of ['event_id','event_type','occurred_at','recorded_at','channel','schema_version']) {
      if (!e[f]) errors.push(`event[${i}]: missing ${f}`);
    }
    if (eventIds.has(e.event_id)) errors.push(`event[${i}]: duplicate event_id ${e.event_id}`);
    if (e.coverage_id && (!COVERAGE_ID.test(e.coverage_id) || !coverageIds.has(e.coverage_id))) {
      errors.push(`event[${i}]: unresolved coverage_id ${e.coverage_id}`);
    }
    eventIds.add(e.event_id);
  }
  return { ok: errors.length === 0, errors };
}

export function publishingGate({ coverage = [], sources = [], events = [] }) {
  const c = validateCoverageRegistry(coverage);
  const s = validateSources(sources);
  const coverageIds = new Set(coverage.map(x => x.coverage_id));
  const e = validateEvents(events, coverageIds);
  const errors = [...c.errors, ...s.errors, ...e.errors];
  return { ok: errors.length === 0, errors };
}

// Intentionally no mastery formula here. Foundation v2 stores raw evidence only.
