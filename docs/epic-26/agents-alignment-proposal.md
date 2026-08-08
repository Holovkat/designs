# Epic #26 AGENTS.md Alignment Proposal

Status: proposed, not applied

Epic #26 changed durable OKF counts and operating boundaries. The root
`AGENTS.md` remains byte-unchanged because applying these edits requires
explicit operator approval.

## Proposal 1: Current concept count

- Current: `knowledge/ | Self-documenting OKF knowledge bundle (54 concepts)`
- Proposed: `knowledge/ | Self-documenting OKF knowledge bundle (63 concepts)`
- Reason: the curated type indexes contain 63 concepts after Epic #26.

## Proposal 2: Curation operating boundary

- Current: `Do not add schedules, cron, Factory automation, or a cross-project rollout before Epic #26's First Decision Gate.`
- Proposed: `Curation remains manual and explicitly repository-scoped. Do not add schedules, cron/launchd, queues, polling, hook launches, Factory automation, child sessions, automatic retries, or broader live-project adoption unless a later operator-approved decision reopens the Epic #26 STOP boundary.`
- Reason: D3-D7 validated the bounded manual workflow, while the E5 review
  explicitly stopped broader live-project adoption pending sustained
  observation evidence and a new operator decision.

No change should be applied from this document without exact operator approval.
