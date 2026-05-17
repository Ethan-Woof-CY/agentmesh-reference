# Shared Tools Catalog

All tools are deployed as **shared services** on VPS1. Every agent accesses them via the internal network. No per-container installs.

## Browser — Headless Chromium CDP

| Property | Value |
|---|---|
| **Service** | Headless Chrome 148 |
| **Endpoint** | `http://10.0.0.1:18801` |
| **Health** | `curl http://10.0.0.1:18801/json/version` |
| **Usage** | Connect via CDP protocol for screenshots, page inspection, automation |
| **Container** | `shared-browser` on VPS1 (chromedp/headless-shell) |
| **Restart** | `docker restart shared-browser` on VPS1 |
| **SOP** | Shared tooling — never install per-container (SECURITY_SOP §10) |

## NATS Message Bus

| Property | Value |
|---|---|
| **Service** | NATS v2.14.0 with JetStream |
| **Endpoint** | `nats://10.0.0.1:4222` |
| **Monitor** | `http://10.0.0.1:8222/varz` |
| **Subjects** | `agents.<name>.>` (direct), `agents.broadcast.*` (all agents) |
| **Container** | `nats` on VPS1 |
| **Restart** | `docker restart nats` on VPS1 |

## Mission Control — Kanban & Dashboard

| Property | Value |
|---|---|
| **Service** | Node.js/Express kanban server |
| **URL** | `https://72.60.198.17:57451` (public) |
| **Auth** | `?token=***` or passcode login |
| **API** | `/api/board` (kanban data), `/api/tracks` (team tracks) |
| **Data** | Kanban: `/app/data/kanban.json`, Tracks: `/app/data/tracks.json` |
| **Container** | `mission-control-kb` on VPS1 (node:22-alpine) |
| **Restart** | `docker restart mission-control-kb` on VPS1 |

## Credentials Store

| Property | Value |
|---|---|
| **Location** | VPS1 `/docker/openclaw-peer/data/.openclaw/credentials.json` |
| **Access (ASSIST)** | `ssh vps1 cat /docker/openclaw-peer/data/.openclaw/credentials.json` |
| **Access (PEER)** | `cat /data/.openclaw/credentials.json` (inside container) |
| **Contents** | GitHub PAT, Resend API key (placeholder), Gmail App Password (placeholder), A2A signing key, SSH keys |

## A2A Gateways (per-agent, not shared)

These run per-container intentionally — each agent needs its own gateway.

| Agent | Host | Port | Token |
|---|---|---|---|
| ASSIST | VPS2 | 18802 | `***` (in credentials store) |
| PEER | VPS1 | 18802 | `***` (in credentials store) |
| Jarvis | VPS1 | 57441 | `***` (in credentials store) |
| Astra | VPS2 | 57444 | `***` (in credentials store) |

## Adding a New Shared Tool

All new tools must follow the shared service pattern:
1. Deploy as a standalone Docker container on VPS1
2. Expose a port accessible from both VPS1 and VPS2 internal networks
3. Document in this catalog
4. No per-container installs (exception only if shared service is impossible)
