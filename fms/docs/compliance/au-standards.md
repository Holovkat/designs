# Australian Standards — Compliance References (Launch Scope)

Purpose
- Summarize Australian regulatory and industry standards relevant to FMS launch, to guide scheduling, routing, POD/labelling, and driver compliance. Link to authoritative sources for later policy and validator implementation.

Scope at launch
- Enforceable policies in-app: default Australian Standard Hours (driver fatigue), mandatory POD scans, DG gating fields captured for sea→AU handoff, and load restraint considerations exposed for planners. Deep compliance automation (permits validation, hazmat routing rules) is roadmap.

Driver fatigue — Standard Hours (NHVR)
- Use “Standard Hours” as default fatigue profile for drivers. Additional schemes (Basic/Advanced Fatigue Management) are roadmap.
- Key concepts: maximum work time and minimum rest within 24‑hour/7‑day periods, work diaries as applicable.
- Reference: National Heavy Vehicle Regulator (NHVR) — Work and rest hours and Work Diary guidance.

Dangerous Goods (DG) — ADG Code
- Capture DG metadata on legs/orders: `dg_class`, `UN_number`, `packing_group`, placarding flags, MSDS reference.
- Treat sea legs as external; prior to AU domestic leg firming, gate on customs/biosecurity clearance and port/charges paid, plus DG fields being present.
- Reference: Australian Dangerous Goods (ADG) Code (current edition) by National Transport Commission (NTC).

GHS Labelling
- Where relevant (chemical goods), align labels and SDS to the current GHS edition adopted in Australia. UI stores references; DMS validation is roadmap.
- Reference: Safe Work Australia — GHS adoption guidance and SDS/label requirements.

Load Restraint
- Planning checklist should surface risk if payload characteristics imply special restraint (e.g., liquids/ISO tanks, pallets, oversized).
- Reference: Load Restraint Guide by the National Transport Commission (NTC).

GS1 Identification & Scanning
- Barcodes at pickup/drop: GS1‑128 (AIs) for cases/cartons/pallets; SSCC for logistics units where applicable.
- Optional QR: GS1 Digital Link for web‑resolvable identities; use when partner supplies.
- Reference: GS1 Australia — GS1‑128, SSCC, and GS1 Digital Link specifications.

System tie‑ins
- Driver fatigue profile: `drivers.fatigue_profile = StandardHours` (docs/data/schemas/convex-collections.yaml) and validation at assignment.
- DG & sea handoff gating: `itinerary_legs.dg_*` fields and planning settings `sea_handoff.required_fields` (planning‑settings.schema.json).
- POD: Mandatory scans at pickup and drop; rules for photo/signature and value threshold (default AUD 10,000) in Orders Lifecycle.

Roadmap
- Hazmat routing (restricted roads/tunnels), carrier compliance portal, document validation (permits, SDS), AFM/BFM profiles.

References (authoritative)
- NHVR — Work and Rest Hours; National Driver Work Diary.
- NTC — Australian Dangerous Goods (ADG) Code; Load Restraint Guide.
- Safe Work Australia — GHS adoption and labelling/SDS.
- GS1 Australia — GS1‑128, SSCC, GS1 Digital Link.

