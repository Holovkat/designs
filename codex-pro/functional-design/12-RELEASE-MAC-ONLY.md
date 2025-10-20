---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 12 — Release (Mac‑Only, Commit‑First)

Outcome
- Build on Mac, bump version (`-apc.N` per change; reset to `-apc.0` after upstream bump), push all changes, and publish a GitHub release with local artifacts.

Steps
1) Bump `[workspace.package]` version in root `Cargo.toml`.
2) Build: `rustup override set 1.89.0 && cargo build --release --bin codex-agentic`.
3) Package: tar.gz and SHA256SUMS across arch.
4) Commit and push: `git add -A && git commit -m "release: vX.Y.Z-apc.N" && git push`.
5) Tag and release: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z && gh release create …`.

Verification
- `gh release view vX.Y.Z` shows artifacts; `codex-agentic --version` prints the released version.