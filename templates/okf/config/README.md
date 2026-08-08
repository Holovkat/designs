# OKF Repository Controls

These source defaults map to repository-local paths as follows:

| Source default | Installed path | Contract |
|---|---|---|
| `profile.json` | `.okf/profile.json` | Warning-first `okf-core/1.0`; strict promotion requires repository-local migration evidence and an operator decision. |
| `cadence.json` | `.okf/cadence.json` | Explicit manual checkpoint reviews only; no scheduling or execution authority. |
| `kill-switch.json` | `.okf/KILL_SWITCH` | Unambiguous inactive bounded-run switch. An active switch requires `activated_by`, `activated_at`, and `reason`. |
| `scheduled-curation.example.json` | `.okf/templates/scheduled-curation.example.json` | Inert example only. Copy to a separately reviewed root-relative profile and replace every placeholder/pin before a named operator-approved pilot. |

`install-okf.sh` copies each default only when its installed path is absent. It
does not overwrite, normalize, or execute an existing project-local control on
reinstall. A missing or malformed kill switch remains fail-closed; the
installer does not silently repair operator state.

Numeric curation/archive quotas are deliberately absent. Every bounded run must
receive explicit positive item, input-byte, generated-byte, runtime, and
single-session limits from its approved plan. The defaults install no cron,
launchd, Factory task, queue, polling process, retry loop, enabled scheduled-
curation profile, or network client. Distribution of the inert adapter and
example does not create execution authority.
