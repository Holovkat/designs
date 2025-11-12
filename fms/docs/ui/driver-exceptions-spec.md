<a id="driver-exceptions"></a>
# Driver App — Exceptions & Issues (Launch)

Purpose
- Define how drivers raise and resolve exceptions in the field (delay, damage, address issue, customer unavailable, compliance hold, weather, partial delivery), aligned to accepted reason codes.

Flows
- Raise Exception (from any task state)
  1) Driver taps “Exception” → choose reason (list filtered by context).
  2) Capture required evidence: photos (damage), note, barcode rescans (partial), location.
  3) Submit → offline queue if needed; UI shows banner; dispatcher alerted via toast/inbox.
- Resolve Exception
  - Driver provides resolution (e.g., rescheduled, delivered partial, returned); submit evidence.
  - Dispatcher may convert to reattempt task; original task marked accordingly.

Reason codes (configurable starter set)
- Delayed_Traffic, Delayed_Breakdown, Address_Issue, Customer_Unavailable, Damaged_Goods, Partial_Delivery, Compliance_Hold, Rail_Carrier_Delay, Weather.

Validations
- Some reasons require photo (Damaged_Goods) or rescan (Partial_Delivery); enforce before submit.
- When inside freeze window, warn and log; still allow exception submission.
- PII redaction: mask phone/emails in notes before sending.

Data contracts
- POST /api/v1/tasks/{taskId}/exception {reason, note, evidence[], location}
- POST /api/v1/tasks/{taskId}/resolve {resolution, note, evidence[]}
- Events: exception.raised, exception.resolved (outbound to ERP via n8n)

UI wireframe (ASCII)
```
Task #123  In Transit              [Exception ▾]
───────────────────────────────────────────────
[Select reason ▾]   [Add Photo] [Scan] [Note]
Required: Photo ✓  Scan —    Note ✓
[Submit]  (offline queued)
```

Dispatcher triage
- Alerts Inbox receives item; quick actions: Re‑route, Assign backup, Create Reattempt, Acknowledge.
- Delivery Performance report counts exceptions separately.

Acceptance
- Driver can submit exceptions offline; sync on reconnect; dispatcher sees alert < 5s after sync.
- Required evidence enforced; events emitted with consistent payloads.
