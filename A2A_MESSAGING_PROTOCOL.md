# A2A v3 Messaging Protocol — Reference Implementation

## Overview

A simple, loop-safe agent-to-agent messaging protocol built on NATS pub/sub. Designed to prevent infinite reply loops while maintaining reliable delivery.

## Message Types

| Type | Behavior | Purpose |
|------|----------|---------|
| **ask** | LLM generates a response → one reply sent | Questions, requests, coordination |
| **reply** | Logged only, NO LLM call, NO further response | **Loop breaker** |
| **inform** | Broadcast only, never responded to | Heartbeats, status updates, events |

## Loop Prevention

1. **Type-based chain breaker**: `reply` messages never trigger a response — this stops A→B→A→B cycles dead
2. **Message dedup**: Each agent tracks the last 200 message IDs. Duplicates are silently dropped.
3. **Sender cooldown**: Maximum 1 `ask` per sender per 10 seconds. Subsequent asks are silently dropped.
4. **Heartbeat isolation**: Heartbeats use `inform` type — they never trigger LLM responses.

## Message Format

```json
{
  "jsonrpc": "2.0",
  "method": "message/send",
  "params": {
    "source": "agent-alpha",
    "target": "agent-beta",
    "type": "ask",
    "payload": {
      "text": "Your message here"
    },
    "msgId": "unique-message-id",
    "timestamp": "2026-05-19T00:00:00.000Z"
  }
}
```

## NATS Subjects

```
a2a.msg.<agent-name>    # Direct message to a specific agent
```

## Architecture

```
┌──────────┐     ask/reply     ┌──────────┐
│ Agent A  │ ◄──────────────► │ Agent B  │
│          │     NATS Bus      │          │
└──────────┘                   └──────────┘
     │                              │
     └────────── :4222 ─────────────┘
     subjects: a2a.msg.<name>
```

## Persistence

Agents are monitored every 2 minutes by a health check script. If the agent process dies, it's automatically restarted. Logs are written to `/var/log/nats-agents/` for debugging.

## Requirements

- Node.js 18+
- NATS server (with JetStream recommended)
- An LLM API key (OpenAI, DeepSeek, or compatible)

## Quick Start

```bash
# Start NATS
docker run -d --name nats -p 4222:4222 nats:latest -js

# Start an agent
node a2a-agent.js <agent-name>

# Send a message from another terminal
node a2a-send.js <target-agent> "Hello from agent-alpha"
```

## Security

- Use unique API keys per agent (no shared production keys)
- Use VPN or WireGuard for multi-host deployments
- Run NATS with `-js` for JetStream persistence
- Never expose the NATS port (4222) to the public internet
