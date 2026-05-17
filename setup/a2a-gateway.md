# Deploying an A2A Gateway

This guide walks through deploying the [openclaw-a2a-gateway](https://github.com/win4r/openclaw-a2a-gateway) plugin.

## Prerequisites

- Docker and Docker Compose
- OpenClaw or compatible agent framework
- NATS server (see nats-deploy.md)

## Docker Compose

```yaml
services:
  agent:
    image: openclaw-official:latest
    init: true
    ports:
      - "18802:18802"   # A2A gateway
    volumes:
      - ./data:/data
    environment:
      - A2A_SIGNING_KEY=/data/.openclaw/agent-card-signing-key.pem
```

## Config

Minimal `openclaw.json` with A2A plugin:

```json
{
  "plugins": {
    "entries": {
      "a2a-gateway": {
        "enabled": true,
        "config": {
          "server": {
            "host": "0.0.0.0",
            "port": 18802
          },
          "agentCard": {
            "name": "MyAgent",
            "description": "My A2A Agent"
          },
          "security": {
            "inboundAuth": "bearer",
            "token": "$A2A_GATEWAY_TOKEN"
          },
          "peers": [
            {
              "name": "OtherAgent",
              "agentCardUrl": "http://$OTHER_AGENT_IP:18802/.well-known/agent-card.json",
              "auth": {
                "type": "bearer",
                "token": "$OTHER_AGENT_TOKEN"
              }
            }
          ]
        },
        "activation": {
          "onStartup": true
        }
      }
    }
  }
}
```

## Verify

```bash
# Check agent card
curl http://localhost:18802/.well-known/agent-card.json

# Send a test message
curl -X POST http://localhost:18802/a2a/jsonrpc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "A2A-Version: 1.0" \
  -d '{
    "jsonrpc": "2.0",
    "method": "SendMessage",
    "params": {
      "message": {
        "messageId": "test-1",
        "role": "ROLE_USER",
        "content": [{"text": "ping"}]
      }
    }
  }'
```
