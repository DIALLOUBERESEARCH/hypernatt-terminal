# HyperNatt Terminal — Agentic Workflow Diagram

**Future Caribbean Global AI Buildathon · Track 02 — Finance, Payments & MSME Capital**  
**OpenClaw stack alignment:** MCP · x402 · agent-native payments · GOAT / Base / Solana

> Diagram for application form. GitHub renders Mermaid below.

---

## System overview

```mermaid
flowchart TB
  subgraph INPUTS["Inputs"]
    A1["External AI agent<br/>(Claude, Cursor, OpenClaw, custom)"]
    A2["Human operator<br/>(optional oversight)"]
    A3["Agent wallet<br/>USDC on Base or Solana"]
  end

  subgraph DISCOVERY["Discovery — free (MCP standard)"]
    D1["MCP initialize / tools/list"]
    D2["get_agent_manifest<br/>REST or MCP"]
  end

  subgraph PAYWALL["Payment gate — x402 seller"]
    P0{"Intro free?<br/>1st call per tool"}
    P1{"Swap quota?"}
    P2{"Agent Pass $5/mo?"}
    P3["HTTP 402 + PAYMENT-REQUIRED<br/>Base eip155:8453 + Solana"]
    P4["verify → settle → deliver<br/>CDP facilitator"]
  end

  subgraph MCP["HyperNatt Terminal MCP<br/>hypernatt.com/mcp/protocol"]
    T1["get_btc_usdc_signal"]
    T2["get_mm_trap_state"]
    T3["get_mm_hunt_score"]
    T4["get_liq_radar"]
    T5["get_similarity_match"]
    T6["get_swap_quote · Li.Fi"]
    T7["get_agent_manifest"]
  end

  subgraph DATA["Data sources & APIs"]
    HL["HyperLiquid L2<br/>orderbook · trades · liquidations"]
    VAULT["Mimo vault<br/>15m BTC/USDC cycles"]
    HIST["Historical microstructure<br/>TOP3 similarity"]
    LIFI["Li.Fi cross-chain<br/>swap routes"]
  end

  subgraph CORE["Decision core (server)"]
    C1["MM trap / hunt / liq radar engines"]
    C2["Cycle signal + observed outcomes"]
    C3["Fail-closed if data stale"]
  end

  subgraph HITL["Human-in-the-loop"]
    H1["Vault depositor<br/>deposits USDC · withdraws"]
    H2["Agent operator<br/>approves wallet spend"]
    H3["No auto-trade on MCP<br/>read-only intelligence"]
  end

  subgraph OUTPUTS["Outputs"]
    O1["Structured JSON<br/>trap state · hunt score · signal"]
    O2["On-chain proof links<br/>vault · x402 receipt"]
    O3["Agent decision context<br/>not financial advice"]
  end

  A1 --> D1 --> D2
  A1 --> MCP
  A2 -.->|monitors| A1
  A3 --> PAYWALL

  MCP --> P0
  P0 -->|yes| CORE
  P0 -->|no| P1
  P1 -->|no| P2
  P2 -->|no| P3
  P3 --> A3
  A3 --> P4 --> CORE

  T1 & T2 & T3 & T4 & T5 --> CORE
  T6 --> LIFI
  T7 --> D2

  HL --> CORE
  VAULT --> CORE
  HIST --> CORE

  CORE --> O1
  P4 --> O2
  CORE --> O3

  H1 --> VAULT
  H2 -.-> A3
  H3 -.-> MCP
```

---

## Sequence — agent pays and reads MM trap state

```mermaid
sequenceDiagram
  autonumber
  participant Agent as AI Agent
  participant Wallet as Agent wallet (Base/Solana)
  participant MCP as HyperNatt Terminal MCP
  participant X402 as x402 seller (verify/settle)
  participant HL as HyperLiquid API
  participant Human as Human operator (optional)

  Agent->>MCP: tools/call get_mm_trap_state
  alt First call on this tool (intro free)
    MCP->>HL: fetch L2 + liquidation context
    HL-->>MCP: live microstructure
    MCP-->>Agent: JSON trap state (free)
  else Paywall
    MCP-->>Agent: HTTP 402 + accepts[] dual rail
    Human-->>Agent: approve spend (HITL policy)
    Agent->>Wallet: sign USDC payment
    Wallet->>X402: on-chain settle
    X402->>MCP: payment confirmed
    MCP->>HL: fetch live data
    HL-->>MCP: live microstructure
    MCP-->>Agent: JSON trap state + receipt
  end
  Agent->>Agent: decide trade / hold / route
  Note over Agent,Human: MCP is read-only — no auto-execution
```

---

## Key decision points

| Step | Decision | Fail mode |
|------|----------|-----------|
| Tool discovery | MCP `tools/list` | Standard MCP errors |
| Intro eligibility | Per-tool first call | Falls through to paywall |
| Payment | x402 verify → settle before deliver | 402 until paid; no grant on failed settle |
| Data freshness | Stale HL feed | Fail-closed / degraded flag |
| Agent action | Agent chooses use of JSON | No server-side auto-trade |
| Vault (parallel) | Human deposits USDC | Non-custodial; on-chain only |

---

## Links

| Resource | URL |
|----------|-----|
| MCP endpoint | https://hypernatt.com/mcp/protocol |
| Server card | https://hypernatt.com/.well-known/mcp/server-card.json |
| Live vault proof | https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8 |
| Repo | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Loom (application) | https://www.loom.com/share/618c17521a964a60a6b6605c196a6460 |

---

MIT · DIALLOUBE-RESEARCH · HyperNatt Terminal v2.5.11
