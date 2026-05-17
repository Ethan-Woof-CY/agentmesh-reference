# Architecture: Private A2A Agent Mesh

## Design Principles

1. **Private by default** — All agent communication occurs over a private network (WireGuard, Tailscale, or VLAN). No ports exposed to the public internet.
2. **Open standards** — Use A2A v1.0 and NATS rather than custom protocols
3. **Cryptographic identity** — Every agent card is signed, preventing impersonation
4. **Environment-based config** — No hardcoded secrets anywhere

## Components

### A2A Gateway (per agent)
Each agent runs an A2A-compliant gateway that:
- Hosts an Agent Card at `/.well-known/agent-card.json`
- Exposes JSON-RPC 2.0 endpoints for task management
- Supports streaming (SSE) for real-time responses
- Signs its agent card using a shared mesh signing key

### NATS Message Bus (shared infrastructure)
A single NATS server (or cluster) provides:
- **Pub/sub subjects**: `agents.<name>.>`, `agents.broadcast.*`
- **JetStream persistence**: Durable message queues for task state
- **Request-reply patterns**: For synchronous agent calls

### Signed Agent Cards
Each agent card contains a JWS signature (`agentCardSignature`) that cryptographically binds the card content to the mesh's signing key. Other agents verify the signature before trusting the card.

## Agent Card Template

```json
{
  "protocolVersion": "1.0.0",
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

## Message Flow

```
Agent A                          Agent B
   │                                │
   │── POST /a2a/jsonrpc ──────────►│  SendMessage(task)
   │◄─ 200 { task: { status } } ───│  Accepted
   │                                │
   │◄─── SSE: task/update ─────────│  Streaming progress
   │◄─── SSE: task/complete ───────│  Done
   │                                │
   │── NATS pub agents.B.command ──►│  Real-time event
```

## Security

- **Mesh signing key**: Single Ed25519 key pair. Private key on a secure filesystem. Public key distributed to all agents.
- **Bearer tokens**: Per-agent tokens for A2A gateway auth. Stored in environment variables.
- **No TLS needed internally**: WireGuard already encrypts the transport.
- **No public DNS**: Agent discovery via static config with private IPs.
