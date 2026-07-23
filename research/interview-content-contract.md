# Interview Content Contract v1

Status: normative for seed content

Version: 1.0.0

Effective date: 2026-07-23

## 1. Purpose

This contract governs role families, atomic skills, interview tasks, model-generated variants, human review, and scoring calibration. Its goals are:

1. teach transferable engineering ability rather than leaked question recall;
2. keep every published claim and task traceable to lawful public concepts;
3. make role, skill, prerequisite, and question relationships machine-verifiable;
4. prevent low-quality volume from outrunning technical correctness;
5. ensure AI feedback is evidence-based, calibrated, and able to abstain.

The v1 seed files are content inputs, not proof that a learner is interview-ready. A `review-ready` task still requires the release gates in this document before it may be used for consequential scoring.

## 2. Canonical files and wrappers

| File | Required root key | Stable entity key |
| --- | --- | --- |
| `data/role-families.json` | `roleFamilies` | `roleFamilies[].id` |
| `data/skill-graph.json` | `skills` | `skills[].id` |
| `data/questions.seed.json` | `questions` | `questions[].id` |

All three JSON documents must contain `schemaVersion` and `evidenceDate`. Root arrays must never replace the wrapper objects because downstream migrations, metadata, and compatibility checks depend on stable keys.

### 2.1 ID rules

- Role-family IDs use `rf-<kebab-case>`.
- Skill IDs use `sk-<domain-or-scope>-<kebab-case>`.
- Question IDs use `q-<role-prefix>-<kebab-case>`.
- IDs are permanent public identifiers. A corrected or deprecated entity keeps its ID.
- An ID must never be recycled for a different semantic entity.
- Display titles may change without changing IDs.
- Splitting one skill into two creates two new IDs and deprecates the old skill with explicit replacement links in a future schema revision.

### 2.2 Cross-reference rules

- Every `questions[].roleFamilies[]` value must exist in `roleFamilies[].id`.
- Every `questions[].skills[]`, optional `questions[].prerequisiteSkills[]`, and
  `skills[].prerequisites[]` value must exist in `skills[].id`.
- A skill prerequisite graph must be acyclic.
- A question must reference at least one skill and one role family.
- `questions[].skills[]` names the competencies taught or assessed by the task;
  it does not assert that the learner must already master those skills.
- If a task requires prior mastery beyond the skill graph, it must declare those
  nodes in `prerequisiteSkills[]`. Required prerequisites may not exceed the
  task level unless the prompt supplies them as scaffolding.
- An entry task may introduce an advanced target skill only when it is a
  deliberately scoped first-contact exercise with a reference outline and an
  observable oracle. This does not mark the full advanced skill as mastered.
- A question may span multiple role families only when the same task genuinely supplies a hiring signal for each; marketing reach is not a valid reason.
- Question level must not be lower than the practical level of every required skill unless the prompt supplies that skill as scaffolding.

## 3. Required question shape

Every seed or published question must include:

- `id`
- `title`
- `titleZh`
- `roleFamilies`
- `skills`
- `level`
- `difficulty`
- `type`
- `prompt`
- `deliverables[]`
- `rubric[]`
- `commonFailures[]`
- `followUps[]`
- `sourcePolicy`
- `sourceRefs[]`
- `estimatedMinutes`
- `evidenceDate`
- `status`
- `contentVersion`

The v1 type vocabulary is:

`conceptual`, `coding`, `debugging`, `design`, `waveform-analysis`, `log-analysis`, `system-task`, `behavioral`, `project-deep-dive`, `english-communication`, and `boss-fight`.

New types require a schema-minor change and at least one calibrated example. A UI-only label is not a new type.

## 4. Source and copyright policy

### 4.1 Allowed source classes

Content may be grounded in:

1. public standards summaries and publicly accessible portions of standards;
2. official vendor or project documentation;
3. open-source code, issues, tests, examples, and documentation, subject to their licenses;
4. academic papers and public course materials within quotation and license limits;
5. official company engineering blogs and public job descriptions;
6. original scenarios created from transferable engineering concepts;
7. user-submitted experiences for which the contributor grants the required rights;
8. link-only metadata pointing to a source that may not be reproduced.

The preferred default is an original isomorphic task: preserve the underlying competency and engineering constraints while creating new names, values, topology, artifacts, and wording.

### 4.2 Approved `sourcePolicy` values

- `original-isomorphic-public-concepts-only`
- `public-spec-derived-original-wording`
- `open-licensed-adapted`
- `user-submitted-consented-and-redacted`
- `link-only-metadata-no-reproduction`

The v1 seed uses `original-isomorphic-public-concepts-only`.

### 4.3 Prohibited material

Do not ingest, reproduce, paraphrase too closely, or train variants from:

- NDA-protected interview content;
- confidential employer, client, school, or project material;
- stolen, leaked, or access-controlled question banks;
- verbatim paid-course or paid-question content without a written license;
- personally identifying interview reports without informed consent;
- unpublished company test fixtures, hidden tests, scoring keys, or interviewer rubrics;
- prompts obtained by evading access controls, robots directives, or platform terms;
- covert recordings of interviews;
- real-time assistance intended to deceive an interviewer or bypass assessment rules.

“A candidate remembers seeing it” does not establish a right to publish it.

### 4.4 Public standards and paywalls

A public standards landing page may establish terminology and provenance. It does not grant permission to reproduce paywalled standard text, tables, diagrams, or test procedures. Questions derived from such concepts must use original wording and independently created examples.

### 4.5 Source references

- `sourceRefs[]` contains direct URLs or repository identifiers that support the public concept, not a claim that the prompt appeared in an interview.
- A source URL must not be presented as an endorsement by its owner.
- `evidenceDate` records when the source basis and content were last checked.
- Source disappearance does not invalidate an original task automatically, but it triggers provenance review.
- Mirrors are secondary; prefer canonical project, standards-body, vendor, or publisher URLs.

## 5. User-submitted interview experiences

Before storing a submission, the contributor must:

1. affirm that sharing does not violate an NDA or employer rule;
2. grant permission for storage, moderation, de-identification, aggregation, and original variant creation;
3. identify material they do not own;
4. consent separately before audio, video, or a transcript is retained;
5. be able to request deletion of personal data.

Moderation must remove personal names, interviewer details, requisition identifiers, internal project names, unreleased product facts, exact proprietary datasets, and other re-identification clues.

User reports may update a competency-frequency estimate. They do not authorize publication of an exact prompt. When legal or ownership status is uncertain, keep only non-expressive metadata such as role, stage, broad topic, date range, and confidence.

## 6. Originality and duplicate control

### 6.1 Duplicate layers

Deduplication operates at four levels:

1. **Exact:** normalized prompt, title, and artifact hashes.
2. **Near-text:** token shingles and multilingual semantic similarity.
3. **Structural:** same inputs, constraints, target transformation, and expected answer path despite different wording.
4. **Competency:** multiple tasks intentionally measure the same skill but must vary the evidence demanded.

Exact and near-text duplicates are blocked. Structural duplicates require human review. Competency overlap is allowed when the task adds a meaningful modality, context, difficulty, failure mode, or transfer test.

### 6.2 Canonicalization

Before comparing questions:

- Unicode-normalize text;
- normalize whitespace and punctuation;
- preserve technically meaningful symbols and units;
- replace incidental names and numeric constants only for similarity analysis;
- translate titles and prompts to a comparison language in addition to comparing originals;
- extract structured signatures: role, skills, type, input form, required artifact, central invariant, and failure mode.

### 6.3 Similarity decisions

Every flagged pair receives one of:

- `duplicate-remove`
- `merge-into-canonical`
- `variant-keep` with a written distinction
- `false-positive`

The reviewer records the decision, canonical ID, and rationale. A model similarity score alone must never delete content.

## 7. Content review gates

### Gate 0 — Schema and provenance

- JSON parses.
- Required fields and enums pass.
- IDs are unique and cross-references resolve.
- Source policy is approved.
- Source references are reachable or intentionally empty for fully original soft-skill exercises.
- No prohibited source or personal/confidential data is present.

### Gate 1 — Technical SME review

At least one qualified reviewer for the role family verifies:

- the scenario is technically plausible;
- the prompt has enough information or explicitly expects clarification;
- terminology, units, timing, protocol, and tool assumptions are correct;
- there is no single vendor-specific answer disguised as a universal rule;
- expected deliverables can demonstrate the linked skills;
- common failures are genuinely diagnostic;
- follow-ups increase depth or alter constraints instead of merely repeating the prompt.

Boss fights and advanced safety-, signoff-, or silicon-critical tasks require two reviewers or one reviewer plus a documented independent reference implementation.

### Gate 2 — Editorial and bilingual review

- English and Chinese titles are semantically aligned.
- The prompt avoids culture-specific idiom unless that idiom is the lesson.
- Acronyms are expanded when the target level cannot be assumed to know them.
- Instructions distinguish facts, supplied assumptions, and matters the candidate should clarify.
- The task can be completed in the stated time by a calibrated candidate.
- Behavioral prompts do not pressure a learner to fabricate, disclose confidential information, or claim group work as individual work.

### Gate 3 — Executable and artifact tests

For coding, RTL, scripts, parsers, data analysis, and runnable system tasks:

- a reference solution or independently specified oracle exists;
- public examples and hidden tests cover normal, boundary, negative, malformed, and scale cases;
- test fixtures are original or license-compatible;
- hidden tests do not depend on an undocumented trick;
- time and memory limits are measured in the production runner;
- nondeterministic tasks pin seeds and record environments;
- accepted alternate solutions are reviewed intentionally;
- the implementation and oracle do not share the same unverified logic.

For waveform and log tasks:

- the artifact is internally consistent;
- clock edges, units, ordering, and state transitions are machine-checked where practical;
- the declared root cause is supported but not revealed accidentally by metadata;
- at least one plausible distractor is ruled out by actual evidence.

For design and system tasks:

- a scenario budget supplies or invites assumptions for scale, latency, reliability, correctness, cost, and security;
- the rubric rewards justified alternatives, not one memorized architecture;
- at least two materially different defensible designs are considered during review.

### Gate 4 — Rubric review

Rubrics are ten-point analytic rubrics in v1:

- technical/content correctness: 0–4;
- reasoning or evidence quality: 0–2;
- validation/defensibility: 0–2;
- communication and scope control: 0–2.

Each score level needs observable anchors before production use. “Good,” “clear,” and “strong” are insufficient without behavioral evidence. Fatal errors such as unsafe advice, fabricated evidence, fundamental protocol violation, or a solution that cannot meet the stated contract are recorded separately from the numeric total.

### Gate 5 — Pilot and calibration

Before `active` status:

- pilot with candidates spanning at least two expected proficiency bands;
- collect completion time, clarification frequency, abandonment, score distribution, and reviewer disagreement;
- verify that the task measures linked skills rather than hidden background knowledge;
- revise tasks with ceiling, floor, ambiguity, or language-load problems;
- document a recommended readiness interpretation, not merely a raw average score.

## 8. Automated checks

CI or a content-validation command must fail on:

- invalid JSON;
- missing stable wrapper keys;
- duplicate IDs;
- unresolved role or skill references;
- duplicate prerequisites;
- self-prerequisites or prerequisite cycles;
- empty prompt or required arrays;
- unsupported enum values;
- non-positive or implausible `estimatedMinutes`;
- invalid ISO evidence dates;
- a `review-ready` or `active` question with an unapproved source policy;
- a question with fewer than one deliverable, two rubric items, one common failure, or one follow-up;
- a skill graph with an unreachable non-foundation skill unless explicitly justified;
- source URLs containing credentials, private tokens, local paths, or personal identifiers.

Warnings, rather than automatic failure, may cover:

- high semantic similarity;
- a question linked to unusually many skills;
- a question level below an explicit `prerequisiteSkills[]` node;
- evidence older than the source-class refresh interval;
- estimated time far from pilot median;
- role families with insufficient type or difficulty coverage.

## 9. Versioning and lifecycle

Schema versions follow semantic versioning:

- patch: typo, URL, or metadata correction with no consumer impact;
- minor: optional field, enum addition, or backward-compatible entity;
- major: required-field, wrapper, ID, or semantic behavior break.

Content entities use:

- `draft`: incomplete and not ready for review;
- `review-ready`: structurally complete, awaiting all release gates;
- `active`: approved for learners;
- `deprecated`: retained for history but not assigned to new learners;
- `retired`: blocked from use, typically for correctness, rights, or safety reasons.

Changes that alter the competency, expected answer, score meaning, or hidden tests require a content revision record and score-version boundary. Historical learner attempts keep the version they used.

Never silently edit an active question in a way that changes difficulty or correct behavior.

## 10. Refresh policy

- Public job and interview-format evidence: review at least every 90 days while actively used.
- Tool and vendor behavior: review on major release or at least every 180 days.
- Standards concepts and foundational theory: review annually or when an erratum appears.
- Open-source examples: pin a release or commit when behavior matters.
- Behavioral and communication tasks: annual bias and accessibility review.

An expired evidence date does not delete a transferable task, but it blocks current-company frequency claims until refreshed.

## 11. AI-generated variants

AI may propose variants only after receiving:

- the canonical competency signature;
- allowed public sources;
- prohibited details;
- difficulty and modality target;
- invariants that must remain true;
- dimensions that must differ from the canonical task.

Every generated variant must:

- receive a new ID;
- pass duplicate screening;
- pass the same technical and copyright gates as human-authored content;
- have independently generated tests or an independently reviewed oracle;
- disclose that it is an original variant, not a reported company question;
- avoid invented company attribution or frequency.

Changing names and numbers alone is not a meaningful variant.

## 12. AI scoring calibration

### 12.1 Human ground truth

AI scoring cannot be the sole release gate. For each role family, type, and level used for readiness decisions:

1. collect a calibration set covering weak, borderline, competent, and exceptional responses;
2. obtain two independent human ratings using the analytic rubric;
3. adjudicate large disagreements without exposing the adjudicated answer to the candidate;
4. retain evidence spans that justify each rating;
5. measure inter-rater agreement before treating the human score as a reference.

Initial targets:

- weighted kappa or an appropriate ordinal agreement statistic of at least 0.70 per major rubric dimension;
- AI versus adjudicated human mean absolute error no greater than 1.0 on the ten-point total;
- no proficiency band with systematic error greater than 0.75 points;
- false-ready rate measured and reported separately from overall correlation.

If the human raters do not agree, improve the rubric before tuning the model.

### 12.2 Evidence requirements

AI feedback must:

- cite the exact answer span, code line, waveform interval, log line, or missing deliverable supporting each material deduction;
- distinguish observed evidence from inference;
- never claim a hidden employer preference as fact;
- state uncertainty when multiple solutions are valid;
- abstain when audio, code, artifact, or rubric context is insufficient;
- separate technical score from language-delivery feedback.

### 12.3 Bias and accessibility

Do not score accent similarity, native-speaker style, camera quality, facial expression, disability-related speech patterns, or personality proxies as technical competence.

English communication scoring is limited to shared understanding, organization, precision, repair, and role-relevant intelligibility. A technically correct concise answer must not lose points for lacking ornamental vocabulary.

Calibration slices include, where consent and sample size permit:

- first language and interview language;
- career stage and nontraditional background;
- response modality;
- assistive technology use;
- question family and difficulty;
- short versus long response style.

Small slices are reported with uncertainty and are not used to infer protected characteristics.

### 12.4 Drift and audit

- Recalibrate after model, prompt, transcription, rubric, or task changes.
- Run a fixed blinded benchmark before release.
- Sample production scores for human audit.
- Track score drift, abstention, dimension-level disagreement, and appeal outcomes.
- Preserve model/prompt/rubric versions with every score.
- Provide a user-visible appeal or “feedback is wrong” path.
- Disable consequential scoring automatically when drift or agreement thresholds fail.

### 12.5 Security

Candidate content is untrusted input. Scoring systems must resist prompt injection in code comments, logs, documents, and spoken answers. Content must not be allowed to alter the system rubric, reveal hidden tests, access another user’s data, or trigger tools outside the scoring sandbox.

## 13. Training-only boundary

The platform supports preparation before an interview and post-session reflection with permission. It must not provide hidden real-time answers during an employer assessment, defeat proctoring, impersonate the candidate, or encourage breach of an interview policy.

Practice environments should clearly label whether AI use is:

- prohibited for the exercise;
- allowed for hints after an attempt;
- allowed as an explicit AI-enabled coding competency being evaluated.

The mode is part of the task contract and must be visible before the attempt starts.

## 14. v1 release note

The v1 dataset deliberately favors broad, original coverage across EDA, silicon, embedded, manufacturing automation, project, behavioral, and English interview signals. Its `review-ready` status means:

- schemas and cross-references are expected to validate;
- prompts are original isomorphic tasks based on public concepts;
- no task is represented as an actual company or NDA interview question;
- technical SME review, executable artifacts, response anchors, and empirical scoring calibration remain required before production readiness claims.
