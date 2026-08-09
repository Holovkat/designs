# OKF Canary Blind Reviewer Protocol

Review one frozen case packet, expected manifest, candidate change set, and
bounded receipt ledger. Do not read unrelated repository context. Hide the
harness/model identity whenever practical.

1. Confirm the case and candidate hashes match the frozen run manifest.
2. Check every capture has the expected disposition and that review-required
   remains pending.
3. Check operation kind, target ID/path, expected target state, exact content,
   dependencies, and supersession direction.
4. Check claim evidence and reject unsupported `verified` promotion.
5. Check receipt hard invariants: root/revision/tool/path scope, no mutation,
   no retry, no secret retention, clean teardown, and every ceiling.
6. Ignore eloquence and length. Unsupported or repetitive prose is a content
   finding, not a quality bonus.
7. Record `accept`, `correct`, `reject`, or `disagreement` using
   `reviewer-record.schema.json`. A disagreement without an explicit resolution
   is a failure/review-required outcome.

Each passing case is reviewed once. Do not repeat a passing model run. After a
concrete harness correction or reviewer clarification, only the failed or
directly affected case may run one more time. A second failure becomes
`revise` or `stop`.
