# Skill Presentation Bilingual Audit

**Evidence date:** 2026-07-24  
**Scope:** `data/skill-presentation.json`  
**Source alignment:** `data/skill-graph.json`

## Result

- Source skill-node coverage: **130 / 130**
- Presentation entries with no display term: **0**
- Display terms missing a Chinese value: **0**
- Display terms missing an English value: **0**
- Duplicate display-term IDs: **0**
- Display terms containing a prohibited compound joiner: **0**
- Compound exemptions: **0**
- Legacy skill titles requiring decomposition: **46**
- Total atomic bilingual display terms after decomposition: **177**

## Presentation contract

`skill-presentation.json` is a display-only catalog keyed by every stable skill ID in `skill-graph.json`. It does not rename source nodes, change prerequisites, alter role-family mappings, or split the underlying learning graph. A consumer should resolve a skill ID against `displayTerms` before falling back to the legacy `title` and `titleZh` fields.

Each display term contains:

1. A stable, lowercase kebab-case term ID.
2. A nonempty Chinese label.
3. A semantically aligned, nonempty English label.
4. Exactly one learnable or assessable concept.

## Atomization rules

Distinct concepts must be separate display terms. A visible label must not combine them with:

- English `and`, `&`, `/`, commas, or equivalent enumeration punctuation.
- Chinese `与`, `及`, `和`, `、`, `，`, or `/`.
- A compressed label that hides two separately assessable skills.

Established abbreviations and hyphenated single concepts remain intact when no prohibited joiner is required. Examples include C++, EDA, HDL, SAT, BDD, SLO, RTL, UVM, FPGA, AXI-Stream, ISA, TLB, NoC, MMMC, DRC, LVS, RTOS, MMIO, DMA, SECS, GEM, OPC UA, MES, OEE, and STAR.

## Representative decompositions

- `Linux and Shell Fundamentals` becomes `Linux Fundamentals` plus `Shell Fundamentals`.
- `Ready/Valid Protocol Design` becomes `Ready Signal Semantics` plus `Valid Signal Semantics`.
- `Placement and Routing Cost Models` becomes `Placement Cost Models` plus `Routing Cost Models`.
- `Setup and Hold Analysis` becomes `Setup Analysis` plus `Hold Analysis`.
- `SECS/GEM Messaging` becomes `SECS Messaging` plus `GEM Equipment Communication`.
- `Feedback, Integrity, and Learning` becomes `Feedback Practice`, `Integrity`, and `Learning Practice`.
- `English Summary and Q&A` becomes `English Summary` plus `English Question Response`.

## Residual risk

- Atomizing a display title does not automatically create separate prerequisite nodes, progress records, or question-bank coverage. The graph remains at 130 source nodes until a future schema migration explicitly splits it.
- Some acronyms denote broad bodies of knowledge even when their visible labels are atomic. Question-level tagging should continue to identify the exact capability being assessed.
- Chinese and English labels are semantically aligned rather than mechanically literal. Domain reviewers should revisit terminology when the interview corpus exposes a more precise industry usage.
- Consumers must render every item in `displayTerms`; showing only the first item would hide part of a decomposed legacy skill.

## Integration guidance

The UI should render each `displayTerms` entry as its own bilingual chip or list item. Filters, search indexes, readiness summaries, and question links should retain the parent skill ID while optionally storing the display-term ID for finer-grained navigation. If a future formal name truly cannot be expressed without a prohibited joiner, add `compoundExempt: true` and a concise `reason` to that skill entry, then include the exception in this audit.
