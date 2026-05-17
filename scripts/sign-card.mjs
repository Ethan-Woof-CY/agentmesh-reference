// Generate or sign A2A Agent Cards using Ed25519 + JWS
// Usage:
//   node sign-card.mjs generate <key-path>           — create signing key
//   node sign-card.mjs sign <key-path> <card.json>   — sign a card
//   node sign-card.mjs verify <pub-key> <card.json>  — verify signature

import crypto from "node:crypto";
import fs from "node:fs";

function canonicalize(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalize).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}

function b64url(buf) { return buf.toString("base64url"); }

function generateKey(path) {
  const kp = crypto.generateKeyPairSync("ed25519", { privateKey: { type: "pkcs8" }, publicKey: { type: "spki" } });
  const privPem = kp.privateKey.export({ format: "pem", type: "pkcs8" });
  const pubPem = kp.publicKey.export({ format: "pem", type: "spki" });
  fs.writeFileSync(path, privPem);
  fs.chmodSync(path, 0o600);
  fs.writeFileSync(path + ".pub", pubPem);
  console.log("Key saved to", path);
}

function signCard(card, keyPath) {
  const key = crypto.createPrivateKey({ key: fs.readFileSync(keyPath, "utf-8"), format: "pem", type: "pkcs8" });
  const header = JSON.stringify({ alg: "EdDSA", typ: "agent-card+jws" });
  const payload = canonicalize(card);
  const input = b64url(Buffer.from(header)) + "." + b64url(Buffer.from(payload));
  const sig = b64url(crypto.sign(null, Buffer.from(input), key));
  const jws = input + "." + sig;

  // Self-verify
  const pubPath = keyPath + ".pub";
  if (fs.existsSync(pubPath)) {
    try {
      const pub = crypto.createPublicKey(fs.readFileSync(pubPath, "utf-8"));
      if (crypto.verify(null, Buffer.from(input), pub, Buffer.from(sig, "base64url")))
        console.log("Self-verification: PASSED");
    } catch(e) { /* skip if no pub key */ }
  }

  card.agentCardSignature = jws;
  return card;
}

function verifyCard(card, pubKeyPath) {
  const jws = card.agentCardSignature;
  if (!jws) throw new Error("No agentCardSignature in card");
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWS format");
  const pub = crypto.createPublicKey(fs.readFileSync(pubKeyPath, "utf-8"));
  const ok = crypto.verify(null, Buffer.from(parts[0] + "." + parts[1]), pub, Buffer.from(parts[2], "base64url"));
  if (!ok) throw new Error("Signature INVALID");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString());
}

const mode = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (mode === "generate" && arg1) { generateKey(arg1); process.exit(0); }
if (mode === "sign" && arg1 && arg2) {
  const card = JSON.parse(fs.readFileSync(arg2, "utf-8"));
  console.log(JSON.stringify(signCard(card, arg1), null, 2));
  process.exit(0);
}
if (mode === "verify" && arg1 && arg2) {
  const card = JSON.parse(fs.readFileSync(arg2, "utf-8"));
  const verified = verifyCard(card, arg1);
  console.log("Signature verified. Card:", JSON.stringify(verified, null, 2));
  process.exit(0);
}

console.log("Usage:");
console.log("  generate: node sign-card.mjs generate <key-path>");
console.log("  sign:     node sign-card.mjs sign <key-path> <card.json>");
console.log("  verify:   node sign-card.mjs verify <pub-key-path> <card.json>");
