# OpenAI WebMCP Challenge — Build Notes

## Submission concept

**Cherry Agent-Native Finance** turns a finance dashboard into a structured workspace for both people and browser agents.

Instead of asking an agent to visually inspect tables and click through accounting screens, Cherry registers finance capabilities directly with WebMCP. The agent can discover the supported operations, call them with typed inputs, and return to the user when a consequential decision needs approval.

## Human + agent contract

### Agent may

- read sandbox bank account balances;
- read transactions;
- search invoices;
- analyse likely invoice matches;
- surface low-confidence exceptions;
- stage a reconciliation;
- prepare a payment draft.

### Human must

- approve the staged reconciliation;
- resolve ambiguous accounting decisions;
- authorise any real payment in a production implementation.

There is intentionally **no WebMCP tool that executes a payment** in this challenge build.

## Demo script (under 3 minutes)

### 0:00–0:20 — problem

Open the Cherry dashboard.

> “Finance agents should not have to guess how to operate accounting software, and they should not be given unrestricted authority over money.”

Show the WebMCP-ready indicator and the bank transactions.

### 0:20–0:55 — discover and inspect

Ask the browser agent:

> “Check the bank transactions that need review and tell me which ones can be confidently matched.”

Expected tools:

- `cherry_get_transactions`
- `cherry_suggest_reconciliation`

The agent should identify `txn_001` / `INV-1048` and `txn_002` / `INV-1049` as strong candidates.

### 0:55–1:30 — prepare, don’t silently approve

Ask:

> “Prepare the confident invoice reconciliation for txn_001, but do not approve it for me.”

Expected tool:

- `cherry_stage_reconciliation`

The page visibly changes to **Pending approval** and adds the item to **Your decision**.

Emphasise that the agent did useful work but the accounting decision is not final.

### 1:30–1:50 — human approval

Press **Approve reconciliation** yourself.

The UI marks the transaction matched, the invoice is paid in sandbox state, and the audit trail records **Human** as the actor.

### 1:50–2:20 — exception handling

Ask:

> “Show me reconciliation exceptions that need my attention.”

Expected tool:

- `cherry_get_exceptions`

Use `txn_006` as the ambiguity story: it has the same amount as an invoice but lacks a reliable reference, so Cherry does not make a confident autonomous choice.

### 2:20–2:40 — money movement boundary

Ask:

> “Prepare a £120 payment draft to Example Supplier with reference SEPT-DEMO.”

Expected tool:

- `cherry_create_payment_draft`

The payment appears as **Draft only · no money moved**. There is no payment execution tool.

### 2:40–2:55 — close

> “Cherry Money becomes agent-native without making the agent the final financial authority: agents read, analyse and prepare; humans approve consequential actions.”

## Architecture

```text
ChatGPT / browser agent
        |
        | WebMCP tool discovery + calls
        v
Browser: document.modelContext
        |
        | typed Cherry tool contracts
        v
Cherry UI + finance application logic
        |
        +--> bank transactions
        +--> invoices
        +--> match confidence
        +--> exception queue
        +--> approval queue

Production Cherry Money integration:
WebMCP -> authenticated Laravel endpoint/service -> company-scoped finance data
```

## Mapping to existing Cherry Money

The private production code already contains concepts the public challenge implementation mirrors:

- `OpenBankingTransaction`
- `SmartBankMatcher`
- `Invoice`
- confidence-based readiness (80%+)
- review/approve/post reconciliation workflows
- ledger posting

The public sandbox reimplements only the minimum safe demonstration state needed to make the WebMCP interaction testable and open source.

## New work for the challenge

This public repository and its WebMCP layer were created after 25 August 2026. New challenge work includes:

- WebMCP tool registrations;
- agent-oriented finance tool contracts;
- explicit human approval queue;
- payment-draft-only boundary;
- challenge sandbox data/state;
- WebMCP deployment headers;
- challenge-specific UI and demo flow.

## Security notes

A tool description is guidance to an agent, not an authorisation control. A production implementation must independently enforce:

1. authenticated user/session;
2. company/tenant scoping;
3. resource ownership;
4. schema and business-rule validation;
5. idempotency for consequential operations;
6. explicit approval requirements;
7. audit logging;
8. payment-provider authorisation outside the browser tool declaration.

No secret or bank credential should ever be placed in WebMCP tool metadata or browser source.

## Test prompts

- “What bank accounts are available and what is the total balance?”
- “Show only bank transactions that still need review.”
- “Find the best match for txn_001 and explain why.”
- “Why is txn_006 not safe to auto-match?”
- “Prepare txn_001 against its best invoice match, but do not approve it.”
- “What actions are waiting for me?”
- “Prepare a £120 payment draft to Example Supplier. Do not send it.”
