# Configuration & Secrets Management (DB‑Driven)

Policy
- No application configuration in `.env` beyond absolute bootstrap needs (DB, Redis, event broker, N8N key). Everything else must be persisted in the database and editable at runtime.

Data model (Convex)
- Tables are intentionally generic to support reuse across product areas.
- `config_settings`
  - id, tenantId (nullable for global), env (dev|stage|prod), group, key, type (string|number|bool|json),
    value_string, value_number, value_bool, value_json, isSecret (bool),
    status (active|deprecated|locked), version (int), effectiveFrom (ts|nullable),
    requiresRestart (bool, default false), updatedBy, updatedAt.
- `config_history`
  - id, settingId, prev_value (json), new_value (json), changedBy, changedAt, reason.
- `config_change_sets`
  - id, title, description, createdBy, createdAt, status (draft|approved|applied|rolled_back), scheduledFor (ts|nullable).
- `config_change_set_items`
  - id, changeSetId, tenantId, env, group, key, from_value (json), to_value (json), validation_status.
- `config_groups`
  - id, group (string), label, ownerRole, order.
- `config_key_registry`
  - key (PK), group, label, description, type, default, enum, min, max, regex, jsonSchema, isSecret,
    scopable (array: global|env|tenant|role|user), dependsOn (array of keys),
    editableBy (roles), rollout (none|percent|targeting), requiresRestart.
- `feature_flags`
  - id, tenantId, key, description, enabled, rolloutPercent, conditions (JSON),
    targeting (JSON: segments, attributes), updatedBy, updatedAt.
- `secrets`
  - id, tenantId, key, ciphertext, version, updatedBy, updatedAt (values never emitted in logs/events).

Read precedence
1) User > Role > Tenant > Env > Global default (highest to lowest), unless a key sets a custom precedence in registry.
2) Feature flag targeting evaluated after base config; flags may reference config keys.
3) Read‑through cache with TTL and event‑driven invalidation.

Bootstrap
- On first run, the app checks if `app_config` is empty; if empty, it seeds defaults from a versioned JSON embedded in the codebase.
- A safe‑mode flag allows starting with minimal defaults when DB is reachable but config tables are empty.

Editing & audit
- Settings UI uses the registry to render correct controls (toggle, select, number, JSON editor) and validate input.
- Operators batch edits into a Change Set (draft) → validate (dry‑run) → submit for approval → apply/schedule.
- All changes append history rows and publish `fms.config.changeset.*` events (no secret values), plus `fms.config.changed.v1` upon apply.

Runtime behavior
- Services subscribe to `fms.config.changed.v1` to invalidate caches and re‑apply without restart.
- Changes marked `requiresRestart=true` surface a banner and create rollout tasks; apply still updates DB but services defer until safe.

Secrets
- Store secrets encrypted; access via short‑lived decryption tokens; never expose through client APIs.
- N8N credentials remain in its own vault; integration keys that the app needs are stored in `secrets`.

Backups & DR
- Include config and secrets tables in backup/restore plans.

Acceptance
- App can start with only DB/broker/redis envs set; all other settings loaded from DB; changes propagate live across services.
- Settings UI supports search, grouping, diff vs defaults, change sets, approvals, scheduling, and rollback.
