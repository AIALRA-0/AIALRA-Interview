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

Organization and question evidence snapshot: **2026-07-27**

Current-job and compensation evidence snapshot: **2026-07-26**

- **887** organization-market nodes: **360** in the U.S.-first universe and
  **527** in the China-first universe, spanning companies, state-owned groups,
  research institutes, university laboratories, national laboratories,
  foundries, equipment and materials suppliers, startups, public agencies,
  standards bodies, and open-source ecosystems
- Audited bilingual organization taxonomy: 3 opportunity-market roots, 20
  organization types, and 595 live category keys normalized into 528
  cross-market groups, then decomposed into 531 bilingual atomic filters. Of
  the 887 organization names, 731 have reviewed
  Chinese/English display pairs and 156 are explicitly English-only when no
  reviewed Chinese name is available
- **390 / 390** China `company` nodes have a separate bilingual ownership
  record and evidence entry. **176** are provisionally classified from an
  explicit source tag; **214** remain honestly marked mixed or unknown until a
  direct control source is added. This includes **88** separately reviewed
  foreign-controlled China-market nodes. The UI distinguishes **115** direct
  ownership-registry entries from **313** organization-context review sources
- **15** normalized role families with **2,541** audited company-to-role edges
- **12** technical role families with auditable U.S. BLS OEWS May 2025
  P25/P50/P75 wage benchmarks and separate China government recruitment-pay
  proxies; 3 cross-cutting capability families are explicitly not occupations
  and receive no invented salary
- **2** normalized, first-party current-job observations. Both preserve the
  employer pages' actual `not-disclosed` compensation state rather than
  displaying zero or presenting a market proxy as an offer
- **130** atomic skills with prerequisite relationships and **177** bilingual
  atomic display terms
- **2,100** fully bilingual training tasks: 210 independently authored,
  field-aligned anchor scenarios plus 1,890 progressively harder drills
  (nine per anchor), yielding 140 tasks per role family without pretending
  that every drill is an unrelated interview prompt
- Question-bank content version **2026-07-27.1**; deterministic SHA-256
  `b859f7b6abd50e95af3fe75b1c91d2fb84f97d9d0457dd7f357e8ab2427c9a18`
- Persistent applications, bookmarks, skill progress, attempts, aggregate
  mastery statistics, and private candidate preferences

The company layer is an organization universe, not a claim that every
organization has an open requisition today. Time-sensitive job, eligibility,
visa, export-control, and deadline decisions must be re-verified against the
specific official job posting before applying.

## Product surfaces

- Mission control with an adaptive next-action queue
- Searchable bilingual US/China company and research-institute atlas
- Canonical company → role → skill → prerequisite graph
- Foundation-to-advanced Interview Dojo with provenance and review status
- Chinese-only, English-only, and side-by-side bilingual prompts, rubrics,
  failure patterns, follow-ups, reference outlines, and observable completion
  oracles
- Compact question index with digest-verified on-demand shards, three automatic
  retries, and 16 independently verified recovery packs
- Digest-verified, on-demand organization universe so all 887 profiles remain
  available without serializing the full atlas into the initial HTML
- Role-specific readiness estimates based on evidence, not fabricated
  acceptance probabilities
- Full requisition fact sheet for role ID, family, team, business unit, level,
  location, workplace mode, posting state, responsibilities, minimum and
  preferred qualifications, eligibility, materials, funnel stage, and
  evidence-backed compensation status/range/source
- Distinctive training protocol spanning JD evidence compilation, staged
  gates, authentic engineering artifacts, bounded hints, evidence reports,
  fault injection, blind transfer, and outcome feedback
- Per-user Cloudflare D1 persistence with authenticated-user isolation

## Research

- [Coverage contract](research/coverage-contract.md)
- [US company universe](research/us-company-universe.md)
- [China company universe](research/china-company-universe.md)
- [Strategy framework](research/strategy-framework.md)
- [Competitive landscape](research/competitive-landscape.md)
- [Compensation methodology](research/compensation-methodology.md)
- [Interview content contract](research/interview-content-contract.md)
- [Bilingual question-bank v2 design and audit](research/bilingual-question-bank-v2.md)
- [Pre-fix independent quality audit](research/question-bank-quality-audit-v2.md)
- [Post-fix independent quality audit](research/question-bank-quality-audit-v3.md)
- [v4 release verification](research/release-verification-v4.md)
- [Organization-tree bilingual audit](research/organization-tree-bilingual-audit.md)
- [China company ownership audit](research/china-company-ownership-audit.md)
- [Organization relations audit](research/organization-relations-audit.md)

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

## Production

The canonical authenticated entry point is
`https://carreerdojo.aialra.online`. Its edge path is Cloudflare DNS → VPS
Nginx → the existing AIALRA Auth Gateway and Authentik → a loopback-only,
shared-secret-authenticated origin proxy → the private Sites deployment and
existing Sites D1. See [deploy/README.md](deploy/README.md). Neither the Sites
bypass bearer nor the proxy shared secret belongs in Git.

## Quality gates

```bash
npm run validate
```

The gate audits cross-file IDs, graph cycles, role mapping, evidence fields,
all 799 organization-name decisions, the complete 20-type and 595-category
bilingual taxonomy, all 177 atomic skill display terms, question quality and
coverage, all 1,512 technical
source-scenario payloads, all 168 minimal-invalid-fixture exercises, all 168
contract-only exercises, the complete TAP fixture lineage, privacy boundaries,
TypeScript, lint, production build output, server rendering, API
authentication, user isolation, request validation, cache privacy, and the
generated D1 migration. It also verifies compensation-source semantics,
non-disclosure handling, legacy application-table migration, Authentik proxy
identity, same-origin mutation enforcement, and deployment secret boundaries.

Run the separate network audit when refreshing the evidence snapshot:

```bash
npm run audit:links
```

It distinguishes confirmed missing pages from access-controlled, rate-limited,
timed-out, and other links that need human browser review; it is intentionally
not part of the deterministic offline validation gate.
