# Deploying NATS

NATS serves as the internal message bus for agent-to-agent events.

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
curl http://localhost:8222/varz
# Should show version, uptime, connection count
```

## Subject Convention

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

// Publish
await nc.publish("agents.myagent.heartbeat", sc.encode(JSON.stringify({
  agent: "myagent", status: "online" 
})));

// Subscribe
const sub = nc.subscribe("agents.myagent.>");
for await (const msg of sub) {
  console.log(`Received: ${sc.decode(msg.data)}`);
}
```
