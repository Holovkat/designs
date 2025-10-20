# 14 — Additional Enhancements (Delivered)

## TUI Index Footer Improvements (2025‑10‑09)
- ASCII footer progress bar for `/index` (no transcript churn) plus a 5 s “Index complete …” toast upon success.
- Steady footer line now reads `Indexed <age> • <files> files · <chunks> chunks` and refreshes every 60 s.
- Slash palette parity: `/index` rebuilds, `/search` hits the shared semantic query handler, both driven by the registry commands.

## Delta Monitor (2025‑10‑09)
- Ignore-aware snapshot diff (polls every 300 s) triggers incremental rebuilds when filesystem changes occur.
- Shared helpers in `codex-agentic-core/src/index/{files,builder}.rs` ensure CLI/TUI reuse the same file filters.

## Optional Follow-Ups
- Allow configuring the delta poll interval and footer refresh cadence via `settings.json`.
- Extend the completion toast to include delta summaries (`+added / ~modified / -removed`).
