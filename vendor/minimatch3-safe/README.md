# minimatch 3 compatibility bridge

Several current ESLint plugins still request the legacy callable
`minimatch@3` CommonJS API. Its historical `brace-expansion@1` dependency has
no fixed release for CVE-2026-14257.

This private, development-only bridge keeps the callable `minimatch@3` export
shape while delegating matching and brace expansion to
`minimatch@10.2.5`/`brace-expansion@5.0.8`. This is an API-compatibility bridge
for the simple ignore and file-selection patterns used by this project, not a
claim of byte-for-byte `minimatch@3` semantic equivalence. The lint and test
suites lock the required API behavior, and npm audit can verify the actual
dependency graph contains only the fixed expansion implementation.
