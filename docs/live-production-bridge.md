# Authenticated Cherry Money production bridge

The public WebMCP challenge UI includes an opt-in production mode. The representative sandbox remains the default.

## Data flow

1. The user explicitly selects **Connect Cherry Money**.
2. The user either:
   - submits existing credentials directly to `https://cherrymoney.co.uk/api/login` over HTTPS; or
   - selects **Continue with Google**, which starts Cherry Money's existing server-side Google OAuth flow.
3. Google returns to the established `https://cherrymoney.co.uk/google/callback` URI. The private backend creates a two-minute, single-use code bound to the exact WebMCP origin.
4. The browser receives that code in the URL fragment and exchanges it through `POST /api/webmcp/google/exchange`. The raw code is never stored by Cherry Money and is removed from browser history immediately.
5. The returned Sanctum bearer token is retained in `sessionStorage` for the current tab only.
6. Accounts, invoices, bank transactions, proposals and drafts are hydrated from company-scoped `/api/webmcp/*` endpoints.
7. Ask Cherry calls the original private Cherry Money AI endpoint; OpenAI is called server-side by that backend.
8. Native WebMCP tools use the same authenticated backend endpoints when live mode is connected.

## Google sign-in controls

- The WebMCP site never receives or stores a Google client secret.
- Google OAuth state validation occurs on the Cherry Money server.
- Only an existing, active Cherry Money business user can connect through this bridge; it does not silently create a production company.
- The exchange code is stored only as a SHA-256 hash, expires after two minutes, is bound to the requesting browser origin and can be consumed once.
- Accounts with Cherry Money two-factor authentication are not allowed to bypass that control through the challenge bridge.

## Privacy and safety contracts

- No OpenAI API key, bank credential, Google client secret or Cherry Money password is stored in this public repository.
- The frontend never calls `api.openai.com` directly.
- Production finance records are kept in page memory only and are not written to `localStorage`.
- The login token is tab-scoped and revoked through the existing Cherry Money logout endpoint on disconnect.
- The UI labels OpenAI as verified only after a response returns `meta.provider: openai`.
- Reconciliation approval requires an explicit human UI request with the `X-Cherry-Human-Approval: confirmed` header and `{ "confirmation": true }` request body.
- There is no WebMCP approval, payment-authorisation or payment-execution tool.

## Rollout dependency

The private `cherrymoney` production bridge must be reviewed, merged, migrated and reachable before live mode is used. Use a dedicated judge/demo company with representative records, never a real customer workspace.

After both deployments, verify:

- password and Google authentication both connect the intended demo company;
- a Google exchange code cannot be reused;
- `/api/webmcp/status` reports the expected company, model and `key_exposed: false`;
- a non-deterministic Ask Cherry question returns `meta.provider: openai`;
- production data disappears from memory after disconnect and is absent from localStorage;
- staging creates only a pending proposal;
- only an authorised human can approve;
- payment creation remains `draft_only` with `moneyMoved: false`.
