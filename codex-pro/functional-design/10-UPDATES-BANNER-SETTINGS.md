---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 10 — Updates Banner (What / Where / How / Why / When)

What
- A lightweight update check that can be enabled/disabled and points to our chosen repository.

Where
- Library module handling updates and the TUI banner.

How
- Build an `UpdateConfig` from `settings.json` keys: `updates.repo`, `updates.latest_url`, `updates.upgrade_cmd`, and `updates.disable_check`. The current version comes from the launcher package metadata.
- Cache the latest version in `~/.codex/version.json` and refresh in the background so startup is fast.
- Compare versions; treat `apc.N` as a tiebreaker when the core `X.Y.Z` matches; ignore prereleases.

Why
- Keeps users informed while remaining fully controllable from settings.

When
- Checked opportunistically on startup; the banner shows only when a newer version is available and checks are enabled.

Verification
- With `updates.disable_check=true` → no banner. With a higher latest tag → banner appears on the next run.

Find / Insert Map (grounded in current code)
- codex-rs/tui/src/version.rs (or updates-related functionality)
  - Find: existing update checking implementation
  - Replace input sources with an `UpdateConfig` constructed from settings; keep version parsing semantics including any tiebreaker logic.

Acceptance Criteria
| Item | Must be true |
|---|---|
| Config source | Updates module uses settings-derived config; no inline constants for repo/endpoint/cmd |
| Compare | Any version tiebreaker logic works when `X.Y.Z` equal; prereleases ignored |

Replace Protocol (concrete replacements)
- These will be implemented to modify the existing update functionality to use settings.