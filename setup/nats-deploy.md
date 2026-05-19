# Deploying NATS

NATS serves as the internal message bus for agent-to-agent messaging.

## Quick Start

```bash
docker run -d --name nats \
  --restart unless-stopped \
  -p 4222:4222 -p 8222:8222 \
  nats:latest -js -m 8222
```

- `4222` — Client connections
- `8222` — HTTP monitoring dashboard

## Verify

```bash
# Check NATS version and connections
curl http://localhost:8222/varz
```

## Subject Conventions

### A2A v3 NATS Protocol (Recommended)

```
a2a.msg.<agent-name>     # Direct message to a specific agent
```

### Legacy Convention (for custom bridges)

```
agents.<agent-name>.<action>     # Direct agent messages
agents.broadcast.<type>          # Broadcast to all agents
```

## Agent Connection (Node.js)

```javascript
import pkg from "nats";
const { connect, StringCodec } = pkg;
const sc = StringCodec();

const nc = await connect({ 
  servers: process.env.NATS_SERVER || "nats://localhost:4222" 
});

// Publish an ask message (A2A v3)
await nc.publish("a2a.msg.target-agent", sc.encode(JSON.stringify({
  jsonrpc: "2.0",
  method: "message/send",
  params: {
    source: "my-agent",
    target: "target-agent",
    type: "ask",
    payload: { text: "Hello!" },
    msgId: "msg-" + Date.now(),
    timestamp: new Date().toISOString()
  }
})));

// Subscribe to incoming messages
const sub = nc.subscribe("a2a.msg.my-agent");
for await (const msg of sub) {
  const data = JSON.parse(sc.decode(msg.data));
  console.log("From " + data.params.source + ": " + data.params.payload.text);
}
```
