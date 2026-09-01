# Cherry Agent-Native Finance — WebMCP Challenge

Cherry Agent-Native Finance is a WebMCP extension of **Cherry Money** that lets browser agents work with finance data through structured tools instead of guessing their way through a dashboard.

The core safety principle is simple:

> **Agents can read, analyse, match and prepare. Humans approve consequential financial actions.**

## WebMCP Challenge work

Cherry Money existed before 25 August 2026. This repository contains the new, public WebMCP challenge implementation created after 25 August 2026.

The production Cherry Money application is maintained separately in a private repository. This challenge repository intentionally contains no production credentials, bank tokens, customer data, API secrets, or proprietary deployment configuration.

## What the demo does

The app exposes structured WebMCP tools for:

- reading bank accounts and transactions;
- searching unpaid invoices;
- suggesting transaction-to-invoice matches;
- staging reconciliations for explicit human approval;
- surfacing exceptions that need review;
- preparing payment drafts without executing money movement.

A typical agent interaction is:

1. “Check the transactions that need review.”
2. The agent calls `cherry_get_transactions`.
3. “Find likely invoice matches.”
4. The agent calls `cherry_suggest_reconciliation`.
5. “Prepare the confident matches.”
6. The agent calls `cherry_stage_reconciliation`.
7. Cherry shows the staged action in the UI.
8. **The human approves it in Cherry before the transaction is marked reconciled.**

## WebMCP tools

- `cherry_get_accounts`
- `cherry_get_transactions`
- `cherry_search_invoices`
- `cherry_suggest_reconciliation`
- `cherry_stage_reconciliation`
- `cherry_get_exceptions`
- `cherry_create_payment_draft`

The implementation uses the current experimental API:

```js
await document.modelContext.registerTool({
  name: 'cherry_get_transactions',
  description: 'Return Cherry Money bank transactions for agent-assisted review.',
  inputSchema: { /* ... */ },
  execute: async (input) => { /* ... */ }
}, { signal: controller.signal });
```

Tool registrations are owned by an `AbortController`; aborting its signal unregisters the challenge tools.

## Relationship to Cherry Money

The private Cherry Money product is a Laravel 10 / PHP 8.2 application and already contains:

- Open Banking transactions;
- invoice and expense workflows;
- confidence-based bank matching;
- bank reconciliation review actions;
- ledger posting;
- UK accounting workflows.

This public project demonstrates the WebMCP interaction layer and human/agent boundary in a safe standalone sandbox. The same tool contracts are designed to wrap the corresponding authenticated Cherry Money services server-side.

## Run locally

Requirements: Node.js 22+.

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

> WebMCP currently requires a supported/experimental browser environment. The page remains usable as a normal finance dashboard when `document.modelContext` is unavailable.

## Build

```bash
npm run build
npm run preview
```

## Deployment

The repository includes deployment headers for both Vercel and Netlify. They explicitly enable an origin-keyed context and the WebMCP `tools` permission:

- `Origin-Agent-Cluster: ?1`
- `Permissions-Policy: tools=(self)`

## Security model

The tool schema is **not** treated as an authorisation boundary.

For the challenge sandbox:

- tools only operate on local demo state;
- reconciliation tools can stage an action but cannot silently approve it;
- payment tooling creates a draft only;
- approval/execution remains a visible human action in the UI.

For production integration, authentication, company scoping, validation, authorisation and audit logging belong on the Cherry Money server.

## Challenge submission

**Project:** Cherry Agent-Native Finance  
**Challenge:** OpenAI WebMCP Challenge 2026  
**Repository:** `sohamtech-uk/cherry-webmcp`

See [`docs/CHALLENGE.md`](docs/CHALLENGE.md) for the demo flow, architecture and challenge-specific build notes.

## Licence

MIT — see [LICENSE](LICENSE).
