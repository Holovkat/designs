---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Integration Hub

This directory defines how external systems exchange data with the FMS via n8n.

## Core Spec
- `integration-hub.md` documents the n8n architecture, inbound ERP webhook (HMAC, dedupe by canonical fingerprint, partial acceptance), outbound domain events, ClickSend notifications, reconciliation flows, telematics ingestion, and sea→AU handoffs. It also prescribes retry/DLQ behavior, observability metrics, and payload security.

## Supporting Assets
- `schemas/` — JSON schemas for inbound batches, responses, and outbound events (see the subfolder README for details).
- `mappings/` — CSV mappings for telematics providers and other flat-file integrations.

## Usage
- Reference this folder when implementing webhook handlers, n8n flows, or partner integrations.
- The spec aligns with Convex schemas and Admin settings (e.g., planning and ingestion dedupe settings) to ensure behavior like auto-firming and fingerprinting remains consistent across the stack.

By documenting both contracts and operational behaviors (DLQ, replay, observability), the Integration Hub folder keeps all ERP, telematics, and notification touchpoints auditable.

