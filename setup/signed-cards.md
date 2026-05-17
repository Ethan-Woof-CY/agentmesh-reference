# Signed Agent Cards

Cryptographically verify agent identity using Ed25519 signatures.

## Generate a Signing Key

```bash
node scripts/sign-card.mjs generate /path/to/mesh-signing-key.pem
```

This creates two files:
- `mesh-signing-key.pem` — Private key (keep secure)
- `mesh-signing-key.pem.pub` — Public key (distribute to all agents)

## Sign an Agent Card

```bash
# Fetch your agent card
curl http://localhost:18802/.well-known/agent-card.json > card.json

# Sign it
node scripts/sign-card.mjs sign /path/to/mesh-signing-key.pem card.json

# Output: signed card with agentCardSignature field
```

## Verify a Signed Card

```bash
node scripts/sign-card.mjs verify /path/to/public-key.pem signed-card.json
# Output: "Signature verified ✅" or error
```

## Auto-Signing in Production

Patch your agent card builder to sign on every request:

```javascript
import crypto from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

// In buildAgentCard(), add after building the card object:
const keyPath = process.env.A2A_SIGNING_KEY;
if (keyPath && existsSync(keyPath)) {
  const key = crypto.createPrivateKey({
    key: readFileSync(keyPath, "utf-8"),
    format: "pem", type: "pkcs8"
  });
  const header = JSON.stringify({ alg: "EdDSA", typ: "agent-card+jws" });
  const payload = canonicalize(card);
  const input = Buffer.from(header).toString("base64url") + "." 
             + Buffer.from(payload).toString("base64url");
  card.agentCardSignature = input + "." 
    + crypto.sign(null, Buffer.from(input), key).toString("base64url");
}
```

## How It Works

The signature is a JWS (JSON Web Signature, RFC 7515) using EdDSA (Ed25519):

1. Canonicalize the agent card JSON (sorted keys, no whitespace)
2. Base64url-encode `{"alg":"EdDSA","typ":"agent-card+jws"}` as header
3. Base64url-encode the canonicalized card as payload
4. Sign `header.payload` with the Ed25519 private key
5. Append the signature as `header.payload.signature`
