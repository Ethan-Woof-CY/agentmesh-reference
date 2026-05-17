# Agent Mesh Reference

A reference implementation for building a **private, secure agent-to-agent mesh** using open standards.

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Inter-agent protocol** | A2A v1.0 (Linux Foundation) | Agent discovery, task lifecycle, streaming |
| **Agent identity** | Signed Agent Cards (Ed25519/JWS) | Cryptographic trust inside your mesh |
| **Message bus** | NATS (CNCF) | Real-time event streaming, pub/sub |
| **Agent-to-tool** | MCP | Tool integration within agents |

## Architecture

```
┌──────────┐     A2A v1.0      ┌──────────┐
│ Agent A  │ ◄──────────────► │ Agent B  │
│          │  Signed Cards     │          │
└────┬─────┘                   └────┬─────┘
     │                              │
     │          NATS Bus            │
     └────────── :4222 ─────────────┘
     subjects: agents.<name>.>
              agents.broadcast.*
```

## What's Inside

- **`setup/`** — Deployment guides for A2A gateway, NATS, and Signed Agent Cards
- **`scripts/`** — Utility scripts for signing and verification
- **`templates/`** — Agent card template, Docker Compose template

## Quick Start

```bash
# 1. Deploy NATS
docker run -d --name nats -p 4222:4222 nats:latest -js

# 2. Deploy an A2A gateway (see setup/a2a-gateway.md)
# 3. Generate and sign agent cards (see setup/signed-cards.md)
# 4. Connect agents via NATS bridge (scripts/nats-bridge.mjs)
```

## Security Model

- **Private mesh** — Agents communicate over VPN/WireGuard, never exposed to the internet
- **Signed Agent Cards** — Cryptographically verifiable agent identity using Ed25519 + JWS
- **Bearer token auth** — Simple, effective for internal networks
- **No secrets in configs** — All sensitive values via environment variables

## License

MIT
