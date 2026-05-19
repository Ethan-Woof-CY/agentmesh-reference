# Agent Mesh Reference

A reference implementation for building a **private, secure agent-to-agent mesh** using open standards — from simple NATS-based messaging to full A2A gateway integration.

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Inter-agent messaging** | A2A v3 (NATS-based) | Simple ask/reply/inform loop-safe messaging |
| **Agent identity** | Per-agent API keys via env vars | Authentication inside your mesh |
| **Message bus** | NATS (CNCF) | Real-time event streaming, pub/sub |
| **Protocol version** | A2A v1.0 | Linux Foundation A2A gateway standard (optional) |

## A2A v3 Messaging Protocol (Default)

The recommended approach — a simple NATS-based protocol with loop-safe message types:

| Type | Behavior | Purpose |
|------|----------|---------|
| **ask** | LLM generates a response | Questions, coordination |
| **reply** | Logged only, no response | **Loop breaker** |
| **inform** | Broadcast only | Heartbeats, status |

```
┌──────────┐     ask/reply     ┌──────────┐
│ Agent A  │ ◄──────────────► │ Agent B  │
│          │     NATS Bus      │          │
└──────────┘                   └──────────┘
     subjects: a2a.msg.<name>
```

## A2A v1.0 Gateway (Optional)

For interoperability with the Linux Foundation A2A standard, an optional A2A Gateway provides HTTP+JSON-RPC endpoints with signed agent cards. See `setup/a2a-gateway.md`.

## What's Inside

- **`A2A_MESSAGING_PROTOCOL.md`** — Loop-safe NATS messaging protocol (v3)
- **`scripts/a2a-agent.js`** — Reference agent implementation with ask/reply/inform
- **`setup/`** — Deployment guides for NATS, A2A Gateway, and Signed Agent Cards
- **`scripts/`** — Utility scripts for signing, bridging, and agent management
- **`templates/`** — Agent card and Docker Compose templates

## Quick Start

```bash
# Start a NATS message bus
docker run -d --name nats -p 4222:4222 nats:latest -js

# Start an agent with LLM integration
node scripts/a2a-agent.js agent-alpha

# Send a message from another terminal
node a2a-send.js agent-beta 'Hello from agent-alpha'

# Or deploy the full A2A v1.0 gateway stack (see setup/)
```

## Security Model

- **Private mesh** — Agents communicate over VPN/WireGuard, never exposed to the internet
- **Per-agent API keys** — Unique keys stored in environment variables
- **NATS auth** — Bearer token or JWT authentication for the message bus
- **No secrets in configs** — All sensitive values via environment variables or $PLACEHOLDERS

## License

MIT
