#!/usr/bin/env node
/**
 * a2a-agent.js — A2A v3 Agent Protocol
 * 
 * Message types:
 *   ask    → Expects a reply (LLM-generated). One response per ask.
 *   reply  → Answer to a previous ask. NEVER triggers further reply.
 *   inform → One-way data push. No response expected.
 *
 * Loop breakers:
 *   - "reply" messages are logged only — no LLM call, no response
 *   - Dedup by message ID (last 200 tracked)
 *   - Sender cooldown: max 1 ask per sender per 10 seconds
 *   - Heartbeats (inform type) — never responded to
 *
 * Usage: node a2a-agent.js <agent_id>
 * Env:   A2A_NOTIFY_DISABLE=true  (set to disable Telegram forwarding)
 */

const AGENT_ID = process.argv[2] || process.env.AGENT_ID || 'agent';
const NATS_SERVER = process.env.NATS_SERVER || 'nats://localhost:4222';
const NOTIFY_ENABLED = process.env.A2A_NOTIFY_DISABLE !== 'true';
const LORD_ETHAN_CHAT = '145479963';
const https = require('https');

// ── Dedup tracker ──
const SEEN_IDS = new Set();
const MAX_SEEN = 200;

// ── Sender cooldown (prevents ask bursts) ──
const ASK_COOLDOWN_MS = 10000;
const lastAskFrom = {};

// ── Telegram NOTIFY (Notification Protocol) ──
const NOTIFICATION_BOT_TOKEN = process.env.NOTIFICATION_BOT_TOKEN || '';

function sendTelegram(msg) {
  if (!NOTIFICATION_BOT_TOKEN || !NOTIFY_ENABLED) return;
  const body = JSON.stringify({ chat_id: LORD_ETHAN_CHAT, text: msg.substring(0, 200) });
  const req = https.request(`https://api.telegram.org/bot${NOTIFICATION_BOT_TOKEN}/sendMessage`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

// ── LLM call (DeepSeek V4 Flash) — only used for "ask" messages ──
function callLLM(prompt) {
  return new Promise((resolve) => {
    const apiKey = process.env.LLM_API_KEY || '';
    if (!apiKey) {
      return resolve(`[${AGENT_ID} echo] Received: ${prompt.substring(0, 100)}`);
    }
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: `You are ${AGENT_ID}, an autonomous agent. Respond concisely.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150
    });
    const req = https.request('https://api.openai.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).choices?.[0]?.message?.content || `[${AGENT_ID} echo]`); }
        catch { resolve(`[${AGENT_ID} echo]`); }
      });
    });
    req.on('error', () => resolve(`[${AGENT_ID} echo]`));
    req.write(body);
    req.end();
  });
}

// ── Publish to NATS ──
function sendMessage(nc, target, type, text, replyTo) {
  const { StringCodec } = require('/data/.openclaw/node_modules/nats');
  const sc = StringCodec();
  const msg = JSON.stringify({
    jsonrpc: '2.0',
    method: 'message/send',
    params: {
      source: AGENT_ID,
      target,
      type,
      payload: { text },
      replyTo: replyTo || null,
      msgId: `${AGENT_ID}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    }
  });
  nc.publish(`a2a.msg.${target}`, sc.encode(msg));
}

// ── Check if we've seen this message before ──
function isDuplicate(msg) {
  const msgId = msg.params?.msgId || `${msg.params?.source}-${msg.params?.timestamp}`;
  if (SEEN_IDS.has(msgId)) return true;
  SEEN_IDS.add(msgId);
  if (SEEN_IDS.size > MAX_SEEN) {
    const first = SEEN_IDS.values().next().value;
    SEEN_IDS.delete(first);
  }
  return false;
}

// ── Check sender cooldown for ask messages ──
function isOnCooldown(sender) {
  const now = Date.now();
  const last = lastAskFrom[sender] || 0;
  if (now - last < ASK_COOLDOWN_MS) return true;
  lastAskFrom[sender] = now;
  return false;
}

// ── Main loop ──
async function start() {
  const { connect, StringCodec } = require('/data/.openclaw/node_modules/nats');
  const sc = StringCodec();
  const nc = await connect({ servers: NATS_SERVER, name: `agent-${AGENT_ID}` });

  const inbox = nc.subscribe(`a2a.msg.${AGENT_ID}`);
  const broadcast = nc.subscribe('a2a.broadcast');

  console.log(`[${new Date().toISOString()}] 🤖 A2A v3 agent ${AGENT_ID} started (NOTIFY:${NOTIFY_ENABLED ? 'ON' : 'OFF'})`);
  sendTelegram(`🟢 A2A v3 agent ${AGENT_ID} started`);

  // ── Inbox handler ──
  (async () => {
    for await (const m of inbox) {
      try {
        const raw = sc.decode(m.data);
        const msg = JSON.parse(raw);
        const type = msg.params?.type || 'ask'; // default to ask for backward compat
        const from = msg.params?.source || 'unknown';
        const text = msg.params?.payload?.text || '';
        const msgId = msg.params?.msgId || '';

        // Dedup check
        if (isDuplicate(msg)) continue;

        // Self-message check (shouldn't happen but safeguard)
        if (from === AGENT_ID) continue;

        console.log(`📩 ${AGENT_ID} ${type} from ${from}: ${text.substring(0, 80)}`);

        // Route by type
        switch (type) {
          case 'ask':
            // Cooldown check
            if (isOnCooldown(from)) {
              console.log(`  ↪ cooldown: skipping response to ${from}`);
              sendTelegram(`⏳ ${AGENT_ID} cooldown from ${from}: ${text.substring(0, 80)}`);
              break;
            }
            // Generate LLM response
            sendTelegram(`❓ ${AGENT_ID} ask from ${from}: ${text.substring(0, 80)}`);
            const response = await callLLM(`${from} asks: ${text}`);
            sendMessage(nc, from, 'reply', response, msgId);
            console.log(`  ↪ reply → ${from}: ${response.substring(0, 80)}`);
            break;

          case 'reply':
            // Reply to a previous ask — log only, NO further response
            console.log(`  ↪ reply to ${AGENT_ID}'s ask: ${text.substring(0, 80)}`);
            sendTelegram(`💬 ${AGENT_ID} reply from ${from}: ${text.substring(0, 80)}`);
            break;

          case 'inform':
            // One-way info — log only
            console.log(`  ↪ info from ${from}: ${text.substring(0, 80)}`);
            break;

          default:
            console.log(`  ↪ unknown type "${type}", treating as inform`);
        }
      } catch (e) {
        console.error(`❌ ${AGENT_ID} inbox error:`, e.message);
      }
    }
  })();

  // ── Broadcast handler ──
  (async () => {
    for await (const m of broadcast) {
      try {
        const msg = JSON.parse(sc.decode(m.data));
        const from = msg.params?.source || 'unknown';
        const text = msg.params?.payload?.text || '';
        if (from === AGENT_ID) continue;
        console.log(`📢 ${AGENT_ID} broadcast from ${from}: ${text.substring(0, 80)}`);
      } catch (e) { /* ignore */ }
    }
  })();

  // ── Heartbeat (inform broadcast every 60s) ──
  setInterval(() => {
    sendMessage(nc, 'broadcast', 'inform', `${AGENT_ID} heartbeat`, null);
    console.log(`💓 ${AGENT_ID} heartbeat`);
  }, 60000);

  // Keep alive
  setInterval(() => {}, 65000);
}

start().catch(e => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
