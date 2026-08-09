# Designs-local operational cleanup

`designs-scheduled-cleanup.mjs` is the separately gated executor for Epic #37
Issue #51. It is not installed into another project.

The default invocation is read-only and validates the reviewed
`okf-designs-scheduled-cleanup-plan/1` manifest, exact Designs root/branch/
revision, every selected path hash, preserved evidence/control hashes, crontab
hash, process state, and kill-switch identity.

```bash
node templates/okf/operations/designs-scheduled-cleanup.mjs \
  --manifest /absolute/path/51-cleanup-dry-run.json
```

`--execute` additionally requires the separate owner approval reference for the
exact manifest SHA-256. It backs up exact bytes/modes outside the repository,
removes only enumerated installed scheduled artifacts, preserves prior attempt
and failure reports plus generic manual controls, proves the retired path cannot
start, and resets the kill switch last. Failure restores backed-up files.

General Epic #37 commencement is not live cleanup authority. Do not execute
until the owner explicitly approves the manifest hash recorded in
`docs/epic-37/51-cleanup-dry-run.json`.
