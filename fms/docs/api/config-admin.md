# Admin Config API — Registry & Changesets (Stubs)

Purpose
- Define the API surface for schema‑driven settings (Themes, Alerts, Planning, Ingestion, Features, Reports) with scoped overrides and a governed changeset workflow.

Auth & headers
- Auth: JWT (Admin role). Zone/mode scoping enforced on read/write.
- Headers: `Content-Type: application/json`

Scopes
- `scope_type`: tenant | mode | zone | mode_zone
- `tenant_id`: implicit from JWT; `mode`: road|rail|sea|air (as applicable); `zone_id`: UUID

---

GET /api/v1/config/registry
- Returns available setting groups and their schemas.
- 200 Response
```json
{
  "groups": [
    {"id":"theme","title":"Theme","scopeTypes":["tenant","mode","zone","mode_zone"],
     "schemaRef":"docs/settings/schemas/theme-settings.schema.json","version":"1.0.0"},
    {"id":"alerts","title":"Alerts","scopeTypes":["tenant","zone"],
     "schemaRef":"docs/settings/schemas/alerts-settings.schema.json","version":"1.0.0"}
  ]
}
```

GET /api/v1/config
- Query current + effective settings for one or more groups at a scope.
- Params: `scope_type`, `mode?`, `zone_id?`, `ids=theme,alerts,...`
- 200 Response
```json
{
  "scope": {"scope_type":"mode_zone","mode":"road","zone_id":"c7c8..."},
  "items": [
    {"id":"theme","effective":{"theme_id":"slate","colors":{"background_60":"#0B1E2D","text_20":"#DCE7F2","accent_10":"#00B4D8"}},
     "overrides":{"mode_zone":{},"zone":{},"mode":{},"tenant":{"theme_id":"slate"}}}
  ]
}
```

POST /api/v1/config/changesets
- Create a draft changeset for a group at a scope.
- Body
```json
{"scope":{"scope_type":"tenant"},"group":"planning","values":{"freeze_window_hours":48}}
```
- 201 Response
```json
{"changeset_id":"chg_01H...","status":"draft","created_at":"2025-11-11T10:15:00Z"}
```

GET /api/v1/config/changesets
- List changesets with filters: `group`, `status`, `scope_type`, `mode`, `zone_id`.
- 200 Response
```json
{"items":[{"id":"chg_01H..","group":"planning","status":"draft","scope":{"scope_type":"tenant"},"updated_at":"2025-11-11T10:16:00Z"}]}
```

POST /api/v1/config/changesets/{id}/validate
- Run client/server validators; produce errors/warnings.
- 200 Response
```json
{"ok":false,"errors":[{"path":"/freeze_window_hours","code":"MIN_VALUE","message":"Must be >= 0"}],"warnings":[]}
```

POST /api/v1/config/changesets/{id}/approve
- Body: `{ "comment": "Reviewed by ops" }`
- 200 Response: `{ "status": "approved", "approved_by": "user_123", "approved_at": "..." }`

POST /api/v1/config/changesets/{id}/apply
- Applies the approved changeset.
- 200 Response
```json
{"status":"applied","applied_at":"2025-11-11T10:20:00Z","effective":{"planning":{"freeze_window_hours":48}}}
```
- Side effects: emit `fms.config.changed.v1`.

Errors
- 400 `INVALID_SCOPE` | `INVALID_SCHEMA` | `VALIDATION_FAILED`
- 401/403 auth/permission
- 404 not found
- 409 conflict (approve/apply state mismatch)

Idempotency
- Changeset creation returns same `changeset_id` on retry if identical body within 5 minutes; approve/apply are idempotent by `{id}`.

Audit
- Every action writes audit with before/after; includes scope, group, user, comment.
