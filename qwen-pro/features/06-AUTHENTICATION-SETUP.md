# Authentication Setup – GLM & GPT‑5 Codex Bridge

## Credential Sources
- **GLM (z.ai)**: Requires API key (and optionally tenant ID) obtained from z.ai console. Stored via `/auth custom --provider=zai`.
- **OpenAI GPT‑5 Codex**: Uses standard OpenAI API key with reasoning scopes enabled.

## Flows
1. **Bridge Registration**
   - Startup hook calls `bridge.registerAuthHandlers(authService)` where `authService` is the upstream interface for storing/retrieving secrets.
2. **CLI Command `/auth custom`**
   - Bridge extends the menu with “z.ai GLM” and “OpenAI GPT‑5 Codex”.
   - Each option prompts for API key, optional base URL override, and CodePlan toggle.
3. **Secret Storage**
   - Delegated to Qwen’s existing vault; bridge only passes labels (e.g., `custom:zai`).
4. **Runtime Injection**
   - Provider adapters request secrets via `authService.getSecret('custom:zai')`.
   - Missing secrets throw a user-friendly error that links back to `/auth custom`.

## Additional Considerations
- **Token Refresh**: GLM access tokens can expire; bridge includes optional refresh endpoint support. When tokens expire mid-session, we prompt the user to rerun `/auth`.
- **Multi-Account**: Settings allow storing multiple GLM tenants; CLI shows them as a dropdown before establishing the session.
- **Security Logging**: Telemetry avoids printing raw keys; only provider IDs and hash digests appear in logs.
