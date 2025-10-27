# Continuation: Z.AI Non-Streaming Fallback

## Summary so far
- Added non-streaming fallback in `core/src/chat_completions.rs` so providers that reject streaming (Z.AI coding endpoint) now send a single JSON request instead of SSE.
- BYOK editor now captures extra HTTP headers (e.g., `tenant=83005`) and `CustomProvider` persists them; both model refresh and request builder apply these headers.
- Settings discovery now prefers `~/.codex/settings.json`, avoiding stray files at `$HOME`.
- Fixed the missing conversation payload in the fallback path: we now build the full `messages` array (system + conversation, including the current user prompt) before dispatching the non-streaming request. Verified with `RUST_LOG=codex_core::chat_completions=debug cargo run -p codex-cli --bin codex-agentic -- exec --model glm-4.6 -- "hi"` returning HTTP 200.
- Remaining work is limited to hardening (tests + error telemetry); functional parity between streaming and non-streaming flows is restored.

## Open tasks / next steps
1. **Regression coverage**  
   - Unit/integration test that constructs a mock provider with `stream=false` and asserts the fallback adds both custom headers and the bearer token, and that the `messages` payload mirrors the streaming branch.
2. **Error reporting polish**  
   - Bubble non-2xx HTTP status bodies into user-facing errors with clear provider context (status + body excerpt) so BYOK misconfigurations are easier to diagnose.
