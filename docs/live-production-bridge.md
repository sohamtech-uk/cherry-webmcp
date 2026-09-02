# Authenticated Cherry Money production bridge

The public WebMCP challenge UI includes an opt-in production mode. The representative sandbox remains the default.

## Data flow

1. The user explicitly selects **Connect Cherry Money**.
2. Credentials are posted directly to `https://cherrymoney.co.uk/api/login` over HTTPS.
3. The returned Sanctum bearer token is retained in `sessionStorage` for the current tab only.
4. Accounts, invoices, bank transactions, proposals and drafts are hydrated from company-scoped `/api/webmcp/*` endpoints.
5. Ask Cherry calls the original private Cherry Money AI endpoint; OpenAI is called server-side by that backend.
6. Native WebMCP tools use the same authenticated backend endpoints when live mode is connected.

## Privacy and safety contracts

- No OpenAI API key, bank credential or Cherry Money password is stored in this public repository.
- The frontend never calls `api.openai.com` directly.
- Production finance records are kept in page memory only and are not written to `localStorage`.
- The login token is tab-scoped and revoked through the existing Cherry Money logout endpoint on disconnect.
- The UI labels OpenAI as verified only after a response returns `meta.provider: openai`.
- Reconciliation approval requires an explicit human UI request with the `X-Cherry-Human-Approval: confirmed` header and `{ "confirmation": true }` request body.
- There is no WebMCP approval, payment-authorisation or payment-execution tool.

## Rollout dependency

The private `cherrymoney` production bridge must be reviewed, merged, migrated and reachable before live mode is used. Use a dedicated judge/demo company with representative records, never a real customer workspace.

After both deployments, verify:

- `/api/webmcp/status` reports the expected company, model and `key_exposed: false`;
- a non-deterministic Ask Cherry question returns `meta.provider: openai`;
- production data disappears from memory after disconnect and is absent from localStorage;
- staging creates only a pending proposal;
- only an authorised human can approve;
- payment creation remains `draft_only` with `moneyMoved: false`.
