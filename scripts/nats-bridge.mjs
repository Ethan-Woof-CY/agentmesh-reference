// NATS Agent Bridge — connect agents to the NATS message bus
// Usage: node nats-bridge.mjs <agent-name>
// Environment: NATS_SERVER (default: nats://localhost:4222)

import pkg from "nats";
const { connect, StringCodec } = pkg;

const AGENT = process.argv[2] || "agent";
const SERVER = process.env.NATS_SERVER || "nats://localhost:4222";
const sc = StringCodec();

async function main() {
  const nc = await connect({ servers: SERVER, name: `agent-${AGENT}` });
  console.log(`[bridge] Connected as agent-${AGENT}`);

  // Listen for agent-specific messages
  const sub = nc.subscribe(`agents.${AGENT}.>`);
  const broadcast = nc.subscribe("agents.broadcast.*");

  (async () => {
    for await (const msg of sub) {
      const data = sc.decode(msg.data);
      console.log(`[bridge] → ${msg.subject}: ${data.slice(0, 200)}`);
    }
  })();

  (async () => {
    for await (const msg of broadcast) {
      const data = sc.decode(msg.data);
      console.log(`[bridge] 📢 ${msg.subject}: ${data.slice(0, 200)}`);
    }
  })();

  // Announce online
  await nc.publish(`agents.${AGENT}.heartbeat`, sc.encode(JSON.stringify({
    agent: AGENT, status: "online", ts: new Date().toISOString()
  })));

  console.log(`[bridge] Running. Publish: nats pub agents.${AGENT}.command '{"hello":"world"}'`);
}

main().catch(err => { console.error(err); process.exit(1); });
