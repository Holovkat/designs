# Epic #26 D3-D5 Canary Harness

`epic26-canary-harness.mjs` runs one explicitly approved D3, D4, or D5
scenario against a temporary Git snapshot. It does not discover repositories,
read dirty source files into the snapshot, mutate the live source repository,
use a network, schedule work, launch Factory, create a child runtime session,
or retry automatically.

Do not run the harness as an ordinary test. Each packet is an operational
canary authority record and must name the frozen revision, exact selected
inputs, reviewed output, run IDs, and numeric ceilings.

## Invocation

```bash
node templates/okf/tests/epic26-canary-harness.mjs \
  --packet /absolute/path/to/packet.json \
  --report /tmp/epic26-d3-evidence.json
```

`--report` is optional; evidence is always written to stdout. A report path
must be outside the live source repository and must not exist. The temporary
snapshot is removed after evidence is measured. `--retain-snapshot` is an
explicit diagnostic option and leaves the reported temporary root in place.

## Packet Contract

```json
{
  "version": "okf-epic26-canary/1",
  "scenario": "normal",
  "source": {
    "root": "/absolute/physical/git/root",
    "revision": "0000000000000000000000000000000000000000",
    "selected_inbox": [
      "knowledge/inbox/2026-08-08T00-00-00Z-example.md"
    ]
  },
  "operator": {
    "identity": "operator identity",
    "request": "explicit repository-scoped canary request"
  },
  "run_ids": {
    "normal": "epic26-d3-normal"
  },
  "limits": {
    "max_items": 1,
    "max_input_bytes": 4096,
    "max_generated_bytes": 262144,
    "max_runtime_seconds": 30,
    "max_sessions": 1
  },
  "harness_limits": {
    "max_snapshot_bytes": 1073741824,
    "max_disk_growth_bytes": 1048576,
    "max_report_bytes": 65536,
    "max_wall_seconds": 120,
    "max_cpu_milliseconds_per_run": 5000
  },
  "curated_concept": {
    "path": "knowledge/decisions/epic26-d3-canary.md",
    "content": "---\ntype: Decision\ntitle: Reviewed output\ndescription: Reviewed output description.\ntags: [okf, canary]\ntimestamp: 2026-08-08T00:00:00Z\nstatus: active\nid: okf-00000000-0000-4000-8000-000000000000\nassertion_state: verified\ngenerated_at: 2026-08-08T00:00:00Z\ngenerated_by: operator-authorized-curator\nsource_authority: repository-git\nevidence_refs: [git:0000000000000000000000000000000000000000:knowledge/inbox/example.md]\nverified_at: 2026-08-08T00:00:00Z\nverification_method: frozen-git-snapshot\nvalidity_basis: exact-revision-and-source-hash\n---\n\n# Decision\n\nUniquePortableCanaryToken\n"
  },
  "retrieval": {
    "semantic": {
      "terms": ["UniquePortableCanaryToken"],
      "assertionStates": ["verified"],
      "hasEvidence": true,
      "statuses": ["active"],
      "validationStatuses": ["strict"]
    },
    "portable_terms": ["UniquePortableCanaryToken"],
    "portable_decisions_only": true
  }
}
```

Selections and relationship/query arrays must be unique and lexically sorted
where the executor requires deterministic order. `max_items` must equal the
selected path count. `max_input_bytes` accounts only for selected inbox bytes;
the executor reports proposal bytes separately as `control_input_bytes` and
bounds them under `max_generated_bytes`.

Scenario-specific `run_ids` are:

- `normal`: `{ "normal": "..." }`
- `invalid-then-success`: `{ "invalid": "...", "success": "..." }`
- `interrupt-resume`: `{ "interrupt": "..." }`
- `blocked-control`: `{ "blocked_control": "..." }`

The invalid scenario removes only `generated_at` in the temporary staged
concept and requires strict staging failure plus source retention before the
separately named success run. The interruption scenario uses only the
executor's injected test fault after the first source move, proves the
transaction restores that source and every output while retaining checkpoint/
report evidence, then performs one explicit, sequential resume with identical
selection, hashes, proposal, and limits.

`blocked-control` is the non-mutating D7 control proof. Its tracked packet is
`epic26-canary-blocked-control.packet.json`. It replaces
`curated_concept`/`retrieval` with:

```json
{
  "control": {
    "activated_by": "bounded operator identity",
    "activated_at": "2026-08-08T00:00:00Z",
    "reason": "bounded control-test reason"
  }
}
```

The scenario activates only the throwaway snapshot's `.okf/KILL_SWITCH`, proves
the exact check-only request is blocked with `kill-switch-active`, restores the
inactive file byte-for-byte, and proves the identical request is permitted. It
does not create a curation lock, proposal, checkpoint, report, executor
session, or knowledge mutation. Its output version is
`okf-cadence-control-evidence/1` and includes explicit blocked/restored/
permitted proof plus live, selected, unselected, instruction, worktree, and
control-manifest integrity fields.

## Evidence Boundary

The bounded JSON report includes paths, byte counts, SHA-256 manifests,
terminal outcomes, proposal and executor-report hashes, resource measurements,
strict diagnostic counts, retrieval result hashes, retention state, and live
source before/after fingerprints. It never includes inbox bodies, proposal
content, query output, Git diffs, or command stderr/stdout.
