# Addendum: Hazardous Chemicals (Intermodal) Scenario

This addendum covers international procurement (e.g., South Africa → Australia) with sea legs, DG compliance, containers/ISO tanks, and domestic road/rail to mines with mixing/decant operations.

## Intermodal Itinerary (ADG/GHS aware)
- Legs: `sea` (external‑handled) → `road`/`rail` (domestic) → decant/distribution legs.
- Sea legs: tracked for plan/visibility and documents; events via N8N (agents/shipping lines). We do not route sea legs in v1.
- Domestic legs: full routing/scheduling with constraints and re‑optimization.

## Sea Leg Metadata (per itinerary_legs)
- Fields: `external_operator`, `booking_ref`, `vessel`, `voyage`, `load_port`, `discharge_port`, `etd`, `eta`, `docs[]`.
- DG fields (per leg): `dg_class`, `UN_number`, `packing_group`, `placarding_required`, `msds_ref`, `route_restrictions[]` (see compliance/au-standards.md for ADG context).
- Typical status events (via N8N): `booking_confirmed`, `export_cleared`, `loaded_on_vessel`, `departed_port`, `arrived_port`, `discharge_completed`, `customs_cleared`, `gate_out`.

## Containers / ISO Tanks
- Entity: `containers` with fields: `container_id`, `iso_code (T11/T14)`, `dg_class`, `UN_number`, `packing_group`, `seals[]`, `reefer_setpoint_c?`, `vgm_kg?`, `owner`, `status`.
- Association: containers linked to itinerary legs; after discharge, container continues on `road` or `rail` legs.
- Decant events: create child orders for outbound ISOs; labels/barcodes per GS1 and DG (ADG/GHS) labelling rules; record who/when/where.

## Site & Compliance Requirements
- Route stops carry `site_requirements` (credentials/PPE/permits/escort flags).
- Drivers and carriers have `credentials[]` with expiry; assignment validators enforce compliance.
- Non‑FMS stops: `stop_type` supports `break|other` to capture planned detours; included in ETA and audit.

## Planning & Documents
- Forecast→Provisional→Firm pipeline accommodates long lead times and frequent plan updates from agents.
- Documents tracked as references in `docs[]` (B/L, DG declaration, MSDS, permits). Full DMS out of scope for v1, but references and status are visible.
- Sea→AU handoff is configurable: on `gate_out` (or configured event), system may auto‑create/firm the first AU leg if gating fields are satisfied. Gating and behavior controlled per tenant via planning settings (`sea_handoff`) and includes financial clearance flags (duties_and_taxes_settled, port_charges_settled). ADG‑related fields are captured prior to domestic leg firming.

## Mapping to Core Models
- Added `sea` to `itinerary_legs.mode` and to outbound event `mode`.
- Added DG and external sea metadata to `itinerary_legs`.
- Added `containers` collection and DG fields in `order.constraints` for ingestion mapping.
- Extended `route_stops` with `break/other/decant` stop types and `site_requirements`.
- Extended `drivers` with `credentials[]`.

## Future Enhancements
- Hazmat routing (provider data for restricted roads/tunnels; automatic avoidance).
- Carrier portal; standardized data exchange per carrier.
- Temperature telemetry ingestion for reefers and ISO tanks.
