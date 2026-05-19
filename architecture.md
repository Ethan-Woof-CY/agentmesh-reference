# Architecture: Private A2A Agent Mesh

## Design Principles

1. **Private by default** — All agent communication occurs over a private network (WireGuard, Tailscale, or VLAN). No ports exposed to the public internet.
2. **Open standards** — Use NATS for messaging, A2A for interoperability where needed
3. **Environment-based config** — No hardcoded secrets anywhere

## Primary Architecture: A2A v3 NATS Messaging

The default architecture uses a lightweight NATS-based messaging protocol:

### Components

- **a2a-agent.js** — Per-agent process running on Node.js that connects to NATS and provides LLM-driven responses
- **NATS server** — Central message bus with JetStream for persistence
- **LLM integration** — Each agent has an API key for its language model

### Message Types

| Type | Behavior |
|------|----------|
| **ask** | LLM generates response, one reply sent |
| **reply** | Logged only — breaks reply chains |
| **inform** | One-way broadcast, no response |

### Loop Prevention

- Reply type breaks A to B to A to B cycles
- Message dedup (last 200 IDs tracked per agent)
- Per-sender cooldown (max 1 ask per sender per 10s)
- Heartbeats use "inform" type — never trigger LLM responses

### Message Format

```json
{
  "jsonrpc": "2.0",
  "method": "message/send",
  "params": {
    "source": "agent-alpha",
    "target": "agent-beta",
    "type": "ask",
    "payload": { "text": "Your message here" },
    "msgId": "unique-message-id",
    "timestamp": "2026-05-19T00:00:00.000Z"
  }
}
```

### Architecture Diagram

```
┌──────────┐     ask/reply     ┌──────────┐
│ Agent A  │ ◄──────────────► │ Agent B  │
│          │     NATS Bus      │          │
└──────────┘                   └──────────┘
     │                              │
     └────────── :4222 ─────────────┘
     subjects: a2a.msg.<name>

┌──────────┐                     ┌──────────┐
│ Agent C  │                     │ Agent D  │
│ (LLM)    │                     │ (LLM)    │
└──────────┘                     └──────────┘
```

### Persistence

Agents are monitored by a health check script running every 2 minutes. If the agent process dies, it is automatically restarted. Logs are written to a dedicated log directory.

## Alternative: A2A v1.0 Gateway (Interoperability)

For teams needing the full Linux Foundation A2A standard, an optional gateway can be deployed per agent:

### A2A Gateway (per agent)
- Hosts an Agent Card at `/.well-known/agent-card.json`
- Exposes JSON-RPC 2.0 endpoints for task management
- Supports streaming (SSE) for real-time responses
- Signs its agent card using a shared mesh signing key

### Signed Agent Cards (Optional)
Each agent card contains a JWS signature (`agentCardSignature`) that cryptographically binds the card content to the mesh's signing key. Other agents verify the signature before trusting the card.

### Agent Card Template

```json
{
  "protocolVersion": "1.0",
  "name": "$AGENT_NAME",
  "url": "$A2A_ENDPOINT",
  "skills": [{"id": "chat", "name": "chat"}],
  "capabilities": { "streaming": true },
  "securitySchemes": {
    "bearer": { "type": "http", "scheme": "bearer" }
  },
  "supportedInterfaces": [
    { "protocolVersion": "1.0", "protocolBinding": "JSONRPC" }
  ]
}
```

## Security

- **Per-agent API keys**: Unique keys stored in environment variables for LLM and NATS auth
- **No TLS needed internally**: WireGuard already encrypts the transport
- **No public DNS**: Agent discovery via static config with private IPs
- **Sanitized public repo**: All examples use $PLACEHOLDERS, never real credentials

## Choosing an Architecture

| If you want... | Use... |
|---|---|
| Simple, loop-safe messaging | A2A v3 NATS (this repo's primary) |
| Linux Foundation A2A compatibility | A2A v1.0 Gateway + Agent Cards |
| Signed identity verification | Add Signed Agent Cards on top of v3 |
