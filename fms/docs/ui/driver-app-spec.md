# Driver App Spec (Launch)

<a id="driver-platform"></a>
Platform
- React Native (Expo). Background location, camera, barcode/QR scanning, offline storage, push notifications.

Voice turn‑by‑turn integration
- Android: prefer `google.navigation:q=lat,lon&mode=d`; fallback to HTTPS `dir/?api=1` if scheme not available.
- iOS: prefer `comgooglemaps://?daddr=lat,lon&directionsmode=driving`; fallback to Apple Maps `maps://?daddr=lat,lon`.
- Multi‑stop: launch navigation for the next stop only; return to the app on Arrive to capture scans and status.
- Re‑optimization: display a prompt; on accept, regenerate the next deep link and reopen nav.
- Offline: prompt drivers to download offline packs for their operating zones; provide in‑app step list when native nav unavailable.

<a id="driver-core-flows"></a>
Core flows
- Authentication: SSO/OIDC or magic link. Persist session securely; refresh tokens.
- My Tasks: list today/next tasks with status chips (Pending, Scheduled, In Transit, Arrived, Delivered, Exception).
- Task detail: stops (pickup/drop), time windows, contact, notes, scan requirements.
- Status transitions: Depart, Arrive, Deliver, Exception (reason code). Confirmations with haptics.
 - Navigation: Deep link to Google/Apple Maps for turn‑by‑turn voice guidance. Open for the next stop only and return to the app on Arrive. Re‑opt prompt SLO: driver Accept/Reject within 60 seconds (configurable) with rationale logged.
- Scanning/POD: GS1‑128 and GS1 Digital Link QR. Validate required scans (pickup/drop). Photo & signature per rule.
- Offline: queue actions locally; sync on reconnect with conflict resolution.

<a id="driver-wireframes"></a>
UI wireframes (ASCII)
```
Top Bar: [≡] My Tasks                  {Bell}
─────────────────────────────────────────────
Task Card: 08:00  Route R‑19  (VIC‑West)
Pickup → Dropoff  ETA 09:45   [Start]
─────────────────────────────────────────────
Task Detail
• Stops: Pickup (Farm A)  Drop (Plant B)
• Windows: 08:00–10:00 / 11:00–13:00
• Actions: [Depart] [Arrive] [Deliver]
• Nav: [Open in Google Maps]
• POD: [Scan] [Photo] [Signature]
• Status: In Transit  ETA 10:02 (+17m)
```

<a id="driver-data-flows"></a>
Data sources / processes / validations / destinations
- Sources: Convex queries (assigned tasks), push updates; Google deep link addresses.
- Processes: offline queue (SQLite/AsyncStorage), barcode decoding (GS1 AIs and Digital Link), photo/signature capture, background location.
- Validations: required scans before Deliver; window compliance; standard hours warnings; PII handling for photos.
- Destinations: status events to Convex; POD artifacts to object storage (S3/compatible) with metadata; push ack; audit log.

<a id="driver-permissions"></a>
Permissions & reliability
- Request location (Always/When in use), camera, notifications. Educate users on battery optimizations.
- Background location with interval 15s (configurable); throttle when idle.

<a id="driver-a11y"></a>
Accessibility & performance
- Large touch targets; text scaling (Dynamic Type); voiceover labels on buttons.
- Cold start ≤ 3s; task list scroll ≥ 60 FPS; camera preview stable on mid‑range devices.

Open items (future)
- In‑app navigation with voice; map‑matching; geofence‑based auto Arrive/Depart; driver chat; documents viewer.

---

<a id="driver-scanning"></a>
## Barcode/QR Scanning & Parsing (GS1‑128 + GS1 Digital Link)

Scope
- Enforce mandatory scans at Pickup and Drop‑off (per tenant rules) with mixed granularity (default case/carton; item or pallet when required).
- Support GS1‑128 linear and GS1 Digital Link QR; accept Code128 (custom) only when enabled.

Supported data (examples)
- GS1 AIs (min set):
  - (01) GTIN, (10) Batch/Lot, (21) Serial, (37) Count
  - (15) Best before, (17) Expiry (date yymmdd)
  - (00) SSCC for pallets (optional)
  - (240) Additional product ID (optional)
- Digital Link URL patterns:
  - https://id.gs1.org/01/{gtin}[ /21/{serial} /10/{lot} ] with attributes as query params (per standard)

Parsing flow
1) Detect symbology (QR vs linear). If QR → try Digital Link parse; else → GS1‑128 AI parser.
2) GS1‑128: split by FNC1; extract AIs by dictionary; validate each field (length, charset, date).
3) Digital Link: parse path segments for primary identifiers; parse query params for attributes.
4) Normalize into a ScanRecord:
   `{ gtin, lot, serial, count, sscc, best_before, expiry, extras{}, raw, format: 'gs1-128'|'gs1-dl' }`.
5) Match to expected lines for the current task stop:
   - By GTIN + (lot|serial) when present; else by GTIN only; decrement expected `qty` or mark items as scanned.
6) Persist locally (offline queue) and emit to Convex (POD metadata) on sync.

Pseudo‑code (TypeScript)
```ts
function parseScan(raw: string, symbology: 'qr'|'code128'): ScanRecord {
  if (symbology === 'qr' && looksLikeDigitalLink(raw)) return parseDigitalLink(raw);
  return parseGs1_128(raw); // uses AI dictionary + FNC1 handling
}

function matchToManifest(scan: ScanRecord, manifest: Manifest): MatchResult {
  const candidates = manifest.lines.filter(l => l.gtin === scan.gtin);
  // Prefer lot/serial match when present
  const exact = candidates.find(l => (scan.lot ? l.lot===scan.lot : true) && (scan.serial ? l.serial===scan.serial : true));
  if (exact) return {line: exact, status: 'matched'};
  if (candidates.length) return {line: candidates[0], status: 'gtin_only'};
  return {status: 'unexpected_item'};
}
```

Validations & UX
- Required scans: block Deliver until all required lines (by rule) meet scanned quantity; show checklist with progress.
- Duplicates: warn and ignore if same GTIN+lot+serial already scanned for this stop.
- Mismatch: items not on manifest → flag as "Unexpected item"; allow note + photo and continue only if rule permits.
- Quantity checks: if (37) provided, apply as count; otherwise each scan increments count by 1 (configurable).
- Dates: validate (15)/(17) as yymmdd; show human‑readable date.
- Offline: queue ScanRecord; prevent duplicate submissions by local idempotency (hash of raw+stop_id).
- Error reporting: clear message with AI code, expected format, and example.

Flows / sources / destinations
- Sources: Camera/scanner input; manifest lines for the stop (Convex query); rules from tenant settings.
- Processes: symbology detect → parser → normalize → match → update local checklist → queue event.
- Validations: required scans; duplicates; qty; date formats; GTIN checksum.
- Destinations: Convex POD metadata (scan list); outbound `pod.received` includes scan summary per line; audit log.

Acceptance criteria
- Pickup and drop‑off scans enforced per rules; Deliver button disabled until satisfied.
- Parser accepts GS1‑128 with FNC1 and GS1 Digital Link URLs; rejects invalid AIs with helpful message.
- Offline scanning produces the same results on sync; duplicates not re‑counted.

UI wireframe (Scan screen, ASCII)
```
Top: Task #123  Pickup — Farm A           [Cancel]
──────────────────────────────────────────────────
[📷 Scan]  [Manual GTIN]  Status: 2 / 10 cases scanned

Expected Lines
• GTIN 09312345000012  Lot L123  Qty 10   [■■□□□□□□□□]
• GTIN 09312345000029  Qty 6    (serialized) [■■■□□□□]

Last Scan
GTIN …0012  Lot L123  (AI 01/10)   ✓ matched  (+1)
```
