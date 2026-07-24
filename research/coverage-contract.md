# Coverage contract

Evidence freeze: 2026-07-23

## Employer universe

The research universe is not complete merely because it contains many names. A
release must report the source directories consulted, raw entities discovered,
canonical entities retained, aliases and acquisitions merged, restricted
entities, stale evidence, and residual entities awaiting verification.

United States coverage starts from semiconductor and engineering ecosystem
directories, conference exhibitors, university recruiting evidence, official
career sites, and relevant research organizations.

China coverage includes companies, state-owned groups, research institutes,
Chinese Academy of Sciences units, universities and laboratories, national and
local integrated-circuit platforms, open-source communities, foundries,
equipment/material suppliers, design services, system companies, automotive,
and robotics.

The v2 evidence freeze retains 529 canonical organization nodes: 256 in the
US/global-first universe and 273 in the China-first universe. This is an
auditable coverage snapshot, not a mathematical claim that every legal entity,
lab, team, or future startup in both markets has been enumerated. A new node is
retained only when it has an independent identity, a plausible path to one of
the target role families, and first-party or authoritative evidence.

## Evidence states

- `verified`: supported by a current first-party or authoritative source.
- `inferred`: reasoned from verified evidence; the inference must be explicit.
- `unverified`: useful lead without sufficient current evidence.
- `stale`: previously supported, but outside the freshness window.

## Opportunity states

- `green`: no observed hard exclusion; still requires posting-level review.
- `yellow`: sponsorship, eligibility, or timing needs confirmation.
- `orange`: export-control or U.S.-person language requires human review.
- `red`: explicit citizenship, clearance, or otherwise incompatible gate.
- `unverified`: no current evidence.

## Organization universe versus live requisitions

The organization tree answers “where could this capability plausibly develop?”
It does not imply that every node has an opening today. A live requisition is a
separate, volatile entity and may be called current only when the record has:

- an official posting URL and stable requisition identifier when available;
- exact title, employment type, location, and observed date;
- deadline or explicit rolling status;
- posting-level eligibility, sponsorship, and export-control language;
- normalized role-family and JD-to-skill edges;
- a last-seen state so closed or replaced postings are retained historically.

Active target postings should be refreshed at least weekly during recruiting
season and no less than every 30 days otherwise. A removed posting becomes
`closed` rather than disappearing. Career landing pages and organization pages
remain useful discovery evidence but may not be labeled as current jobs.

This release provides the full organization layer plus an authenticated
requisition intake/tracker. Automated job discovery and outcome-based
reweighting remain governed by the same provenance, access, and terms-of-use
rules; the system must not bypass login, robots restrictions, or access
controls to claim false completeness.

## Question coverage

Question completeness means coverage of role signals and atomic skills, not
copying every reported prompt. Every published task requires provenance policy,
learning objective, prerequisites, deliverables, rubric, common failure modes,
follow-ups, version, and review status.

The v2 release baseline is at least 2,100 tasks: at least 140 for each of the 15
canonical role families. Every counted task must provide semantically parallel
English and Chinese titles, prompts, deliverables, rubric items, failure modes,
follow-ups, reference outlines, and observable or executable oracles. Bilingual
arrays are equal-length and item-aligned. Exact duplicates, metadata-exposing
prompts, missing generation provenance, cosmetic numeric/name permutations,
and role families below the declared baseline fail the release audit.

The bank reports its learning topology explicitly: 210 independently authored
anchor scenarios, each followed by nine progressively different exercises,
produce 2,100 countable tasks. A drill must change the observed hiring signal,
required artifact, reasoning path, or validation burden; lineage membership is
not represented as 2,100 unrelated employer-reported prompts.

`review-ready` means these structural and source gates pass. It does not mean a
task is an employer-reported question, technically certified, psychometrically
calibrated, or safe for consequential scoring. Promotion to `active` requires
domain-expert review, bilingual sampling, executable/reference validation where
applicable, and candidate pilot calibration under the interview content
contract.
