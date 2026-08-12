# DATAPREV 2026 — Content Factory v3

Status: migration scaffold. This branch must not change learner progress or published runtime behavior until QA approval.

## Objective
Separate curriculum/content production from the study runtime. The PWA consumes validated session manifests; it does not manufacture pedagogical content locally.

## Canonical flow

Sources -> Source Registry -> Curriculum/KB/Question Bank -> Composer -> Session Manifest -> QA Gate -> Release Manifest -> Runtime

Learner events -> Learner projections -> Composer/adaptation

## State model

A session preparation request may use only these states:

- blocked
- requested
- preparing
- qa
- ready
- in_progress
- completed
- failed

Rules:

1. `failed` can only be emitted after a real pipeline execution returns a terminal error.
2. A local PWA timeout or missing readback must not invent `failed`; use `requested`/`preparing` plus diagnostic metadata.
3. `ready` requires content existence, schema validation, QA pass, publication and readback.
4. `completed` is monotonic historical evidence.
5. A session may be ready outside sequence; this does not block or alter another session.
6. Manual anticipation changes availability only; it does not complete or start the session.

## Required canonical entities

- coverage_id
- concept_id
- item_id
- session_id
- assessment_id
- attempt_id
- event_id
- source_id
- source_revision_id

## Release contract

A release is valid only if the same `content_version` resolves all of:

- curriculum mapping
- KB concept versions
- Question Bank item versions
- session manifests
- source revisions
- QA report
- runtime loader
- cache/service worker manifest

Publication is logical-transactional: stage -> resolve -> QA -> dry-run -> promote -> readback.

## Migration phases

### M0 — Freeze and inventory
No silent migration of learner state, roadmap or completed sessions. Record current main as legacy baseline.

### M1 — Source Registry and canonical IDs
Create registries and preserve legacy IDs/aliases.

### M2 — Session Registry
Reconcile planner session IDs with materialized files and Drive rows. Detect aliases such as legacy/mismatched IDs before publication.

### M3 — Master Content
Build reusable concepts, examples, support representations and Question Bank items from curated sources.

### M4 — Composer
Generate an adaptive session manifest from validated master content + learner evidence. Do not generate factual content ad hoc in the PWA.

### M5 — QA / Publishing Gate
Run curriculum, pedagogy, provenance, item quality, answer-position, learner-model and mobile regression tests.

### M6 — Runtime migration
PWA becomes schema-driven consumer. Requests create idempotent pipeline jobs and display their actual shared state.

## Immediate migration test
Use `EST-PROB-002` as the first end-to-end pilot because the roadmap knows the session while the current published content does not resolve it. The pilot must prove:

1. canonical `session_id` resolution;
2. source-backed master content;
3. QA-approved manifest;
4. publication/readback;
5. PWA changes from blocked/requested to ready without manual reconciliation;
6. learner history remains untouched.
