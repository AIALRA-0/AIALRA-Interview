# AIALRA Career Dojo

A private, evidence-driven career intelligence and interview training system
for semiconductor, EDA, verification, RTL/FPGA, architecture, physical design,
AI hardware, research, and adjacent engineering careers.

Target operating model:

`company evidence → role fit → skill gaps → training → applications → outcomes`

The current foundation stores the evidence, training attempts, application
state, and outcome observations needed for that loop. It deliberately does not
infer rejection causes or automatically reweight skills from sparse outcomes.

## Current snapshot

Evidence date: **2026-07-23**

- **390** company, institute, university-lab, foundry, equipment, IP, startup,
  and open-source ecosystem nodes: 200 US/global-first and 190 China-first
- **15** normalized role families and **1,168** company-to-role edges
- **130** atomic skills with prerequisite relationships
- **210** original training tasks, including 45 short foundation drills and
  role-specific multi-stage Boss Fights
- Persistent applications, bookmarks, skill progress, attempts, aggregate
  mastery statistics, and private candidate preferences

The company layer is an organization universe, not a claim that every
organization has an open requisition today. Time-sensitive job, eligibility,
visa, export-control, and deadline decisions must be re-verified against the
specific official job posting before applying.

## Product surfaces

- Mission control with an adaptive next-action queue
- Searchable US/China company and research-institute atlas
- Canonical company → role → skill → prerequisite graph
- Foundation-to-advanced Interview Dojo with provenance and review status
- Rubrics, failure patterns, reference outlines, and observable completion
  oracles
- Role-specific readiness estimates based on evidence, not fabricated
  acceptance probabilities
- Editable requisition tracker for JD URL, deadline, eligibility signals,
  contacts, resume version, keywords, notes, and funnel stage
- Per-user Cloudflare D1 persistence with authenticated-user isolation

## Research

- [Coverage contract](research/coverage-contract.md)
- [US company universe](research/us-company-universe.md)
- [China company universe](research/china-company-universe.md)
- [Strategy framework](research/strategy-framework.md)
- [Competitive landscape](research/competitive-landscape.md)
- [Interview content contract](research/interview-content-contract.md)

## Evidence and content policy

Every time-sensitive claim should carry a source, observation date, and
confidence. Paid question banks, leaked OA material, NDA content, close
paraphrases of competitor questions, and stealth live-interview assistance are
excluded. Training content uses original engineering scenarios, public
concepts, official documentation, and license-reviewed open material.

Question status is visible in the interface. `review-ready` means the task has
passed structural and source checks but still needs domain-expert and learner
pilot calibration; it must not be treated as an industry-certified score, and
its self-score does not change role readiness.

## Privacy

This repository is public. The checked-in profile is an anonymized template.
Real candidate facts live under the ignored `private/` directory and can be
written into the authenticated site's private D1 preference store after
deployment. Do not commit personal education, immigration, timeline, contact,
or application data.

## Local development

Requires Node.js 22.15 or newer.

```bash
npm install
npm run dev
```

The local app runs at `http://localhost:3000`.

## Quality gates

```bash
npm run validate
```

The gate audits cross-file IDs, graph cycles, role mapping, evidence fields,
question quality and coverage, privacy boundaries, TypeScript, lint, production
build output, server rendering, API authentication, user isolation, request
validation, cache privacy, and the generated D1 migration.

Run the separate network audit when refreshing the evidence snapshot:

```bash
npm run audit:links
```

It distinguishes confirmed missing pages from access-controlled, rate-limited,
timed-out, and other links that need human browser review; it is intentionally
not part of the deterministic offline validation gate.
