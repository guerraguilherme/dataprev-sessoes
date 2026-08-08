# DATAPREV Sessões — Foundation v2

Status: foundation-only. This directory does not authorize bulk pedagogical content generation and does not mutate learner history.

## Canonical identity decision

`coverage_id` uses strategy B+:

`COV-{DOMINIO}-{SERIAL_ESTAVEL}`

Properties:
- opaque and immutable after assignment;
- never derived again from title, syllabus order or numbering;
- semantic meaning lives in registry fields (`canonical_key`, `program_ref`, `semantic_scope`, legacy aliases);
- renaming/reordering a syllabus item must not change the ID.

## Coverage lifecycle

`mapped_proposed -> mapped_validated -> materialized -> taught -> practiced -> reviewed -> assessed -> mastered`

These states are distinct. Mapping does not imply teaching, practice, assessment or mastery.

## Mastery

No definitive mastery formula is implemented in v2. Raw evidence is captured in the Learner Event Store. Any future mastery score must be a versioned projection derived from events and must never overwrite raw evidence.

## Fail-closed publishing principle

Future publishing must fail closed on invalid schema, duplicate canonical IDs, unresolved coverage references, invalid provenance, broken question keys or structural/mobile QA failures. No silent repair of learner progress/history is permitted.

## Operational registries

The Google Sheet `DATAPREV Sessões — Controle Pedagógico e Trilha` contains the v2 staging registries:
- `Coverage_Registry_v2`
- `Source_Registry_v2`
- `Learner_Event_Store_v2`

Legacy operational tabs remain untouched and continue to represent the current app until an explicit migration/release gate is approved.
