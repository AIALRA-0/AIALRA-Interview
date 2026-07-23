# AIALRA Interview

This repository is the evidence-driven career intelligence and interview
training system for AIALRA.

## Product rules

- Treat company, role, visa, recruiting, compensation, and interview claims as
  time-sensitive evidence. Store a source URL, observed date, and confidence.
- Distinguish verified facts, structured inference, and unknowns.
- Never copy paid question banks, NDA material, or leaked interview questions.
- Keep personal resumes, immigration documents, contact lists, application
  notes, and other private data out of public source files.
- Prefer role-level decisions over company-wide assumptions. Work
  authorization and export-control restrictions must be evaluated per posting.
- The public product may use seeded research data. Personal progress and
  application state belong in the persistent database.

## Engineering rules

- Preserve the Sites/vinext structure and `.openai/hosting.json`.
- Keep static research in `data/`, methodology in `research/`, and product code
  in `app/`.
- Run `npm run audit:data`, `npm run build`, and `npm test` before publishing.
- Use short-lived `agent/*` branches and intentional commits.
