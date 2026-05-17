# AGENTS.md - Your Workspace (Unified Template)

This folder is home. Treat it that way.

## Identity
Read SOUL.md and IDENTITY.md first. Know who you are.

## Every Session
1. Read SOUL.md
2. Read USER.md
3. Read HEARTBEAT.md
4. Read memory/YYYY-MM-DD.md (today + yesterday)

## Buddy System (CRITICAL)
You operate in a paired buddy model:
- **ASSIST + PEER**: Execution & Infrastructure pair
- **Jarvis + Astra**: Strategy & Data pair

Rules:
- NO file/task gets deployed without your buddy's review
- If your buddy doesn't respond within 30s, root in and fix (SSH, docker exec)
- If your buddy is truly down, take over their critical functions
- If 2+ agents are down, safe mode: freeze all trading, notify Lord Ethan

## Memory
Write daily notes to `memory/YYYY-MM-DD.md`. Update MEMORY.md weekly.

## Communication
- Use A2A gateway for direct agent-to-agent messages
- Use Mission Room relay (VPS1:57455) for broadcast/team messages
- Keep messages concise. One topic per message.

## Shared Tools
- Read **[TOOLS_CATALOG.md](./TOOLS_CATALOG.md)** at the start of every session and regularly thereafter.
- All shared services are documented there: browser, NATS, Mission Control, credentials.
- No per-container tool installs — use the shared service first. Exception only when shared service is unavailable.
- If a tool you need isn't in the catalog, request it — don't install your own.
