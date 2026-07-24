# Role Presentation Bilingual Audit

**Evidence date:** 2026-07-23  
**Scope:** `data/role-presentation.json`  
**Source alignment:** `data/role-families.json` and `data/organization-intelligence.json`

## Result

- Role-family coverage: **15 / 15**
- Missing Chinese descriptions: **0**
- Missing English descriptions: **0**
- Role descriptions: **35–90 Chinese characters and 20–60 English words**
- Typical-title labels without a Chinese or English value: **0**
- Interview-stage labels without a Chinese or English value: **0**
- Compound title or stage labels joined by `and`, `&`, `/`, `与`, `及`, or `、`: **0**

## Presentation contract

`role-presentation.json` is a display-only bilingual catalog keyed by the stable role-family IDs in `role-families.json`. It does not replace the source role taxonomy or change role-to-organization mappings.

Every role entry contains:

1. A concise Chinese explanation of the role’s actual work.
2. A semantically aligned English explanation.
3. Atomic typical job titles, each representing one recruitable position concept.
4. Atomic interview stages, each representing one assessment stage or knowledge checkpoint.

## Atomization policy

Visible title and stage chips must not combine distinct concepts with `A and B`, `A & B`, `A/B`, `A 与 B`, `A 及 B`, or Chinese enumeration punctuation. Distinct concepts are separate records even when the legacy source joins them.

Examples:

- `assertions and formal` becomes `Assertions` plus `Formal Verification`.
- `MBIST and JTAG` becomes `MBIST` plus `JTAG`.
- `board and lab debug` becomes `Board Debugging` plus `Lab Validation`.
- `simulation and debug` is represented as the single assessment concept `Simulation Debugging`.
- `C and systems` becomes `C Programming` plus `Systems Fundamentals`.

Indivisible industry terms and standard abbreviations remain intact, including EDA, CAD, RTL, UVM, FPGA, SoC, STA, ATPG, MBIST, JTAG, BSP, RTOS, SPC, ECO, ML, CPU, and GPU.

## Semantic review notes

- The three cross-cutting families—behavioral interview, project deep dive, and technical English—use a neutral candidate concept instead of pretending that they are standalone job requisition titles.
- Physical design keeps implementation and timing as separate stages and separate typical titles.
- Design verification keeps assertions, formal verification, UVM, and debugging as separate checkpoints.
- Manufacturing automation separates control systems, functional safety, factory data, and SPC so the UI can filter or score them independently.

## Integration guidance

The UI should resolve a role ID against this catalog before falling back to legacy `name`, `description`, `typicalTitles`, or `interviewStages`. Chips should render the Chinese label as the primary line and the English label as the secondary line. Descriptions should render as paired paragraphs rather than concatenated inline text.
