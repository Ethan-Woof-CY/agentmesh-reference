# SECURITY SOP — Zero Leak Policy

**Effective:** Immediately
**Type:** Non-negotiable, no exceptions
**Scope:** All agents
**Enforcement:** Automated + peer review

---

## 0. GITHUB IS PUBLIC — Treat It As Lost

- **GitHub is a public square.** Anything pushed there is visible to the entire internet — competitors, adversaries, malicious actors.
- **No internal operations, credentials, IPs, codenames, configs, or team data ever touches GitHub.**
- The `agentmesh-reference` repo exists solely as a **sanitized public reference** — pre-release scanned, 2-agent reviewed, and containing zero team-identifying information.
- **If it would not be safe as a press release, it does not belong on GitHub.**
- This includes: issues, comments, pull requests, discussions, repo descriptions, wiki pages, and all branches — not just the main branch.
- **Violation:** Any team member who pushes internal data to GitHub — even accidentally — triggers an immediate security incident.

## 1. CORE RULE

**Nothing identifying this team or its infrastructure ever reaches the public internet.**

This includes but is not limited to:
- Agent codenames
- Internal IP addresses and network ranges
- Server hostnames or domain names
- Personal names or emails
- API keys, tokens, passwords, private keys
- Internal config paths, file structures, software versions
- Internal architecture details that reveal topology

## 2. GATE: Pre-Release Scan

Every agent MUST run an automated scan before pushing ANY content to a public repository. The scan checks for internal patterns, codenames, IPs, and known sensitive strings.

**If scan fails → STOP. Redact. Re-scan. Never force.**

## 3. Review Protocol

- **Every public push requires 2-agent review**: The authoring agent reviews for content. A second agent reviews for leaks.
- **No single agent publishes alone.**
- **Exception:** Time-critical security patches. Post-publish audit within 1 hour.

## 4. Public Communication

In any public context (GitHub issues, comments, PRs, docs, forums):
- **Use generic terms only**: "Agent", "node", "host", "server", "gateway", "mesh"
- **Never use**: Internal codenames, real names, real IPs, infrastructure details
- **No real examples**: Use fictional names or placeholders in examples

## 5. Incident Response

If a leak is discovered:
1. **Immediate containment** — redact/delete/replace within 5 minutes
2. **Rotate** any exposed credentials immediately
3. **Root cause analysis** — identify how the leak happened
4. **Process fix** — update this SOP to prevent recurrence
5. **Report to team lead** within 1 hour

## 6. Violations

**Zero tolerance.** Any agent caught leaking identifying information will face:
- Immediate lockdown (mesh access revoked)
- Full audit of all recent work
- Restoration only after explicit approval

## 7. Regular Audits

- **Weekly** — Full scan of all public repos, issues, and comments
- **Weekly** — Credential rotation check
- **After any public push** — Immediate post-publish audit

## 8. HTTPS Only — No Plain HTTP

- **All internal services exposed for team access MUST use HTTPS.** No exceptions.
- Self-signed certificates are acceptable for internal use. Plain HTTP is not.
- Any service found serving over HTTP must be immediately taken down and re-deployed with HTTPS.
- This applies to: Mission Control, dashboards, APIs, agent endpoints, and any other web-accessible service.
- Rationale: Even on internal networks, credentials and session tokens transmitted over HTTP can be intercepted by any process on the same network segment.

## 9. Zero-Trust Deployment — Every Service Must Be Auth-Tested Before Going Live

- **Before declaring any web service live, the deploying agent MUST test every route unauthenticated.** Not just API routes. The UI, the homepage, every path.
- **Auth middleware must protect ALL routes.** Not just `/api/*`. Every route except the login/auth endpoints themselves.
- **The test sequence before going live:**
  1. Deploy the service
  2. Hit every route with no credentials — expect 302 redirect or 401, never 200 with content
  3. Hit every route with valid credentials — expect 200
  4. Only then declare it live
- **If a service is found to have unprotected routes after going live, it is treated as a security incident.** Same severity as a credential leak.
- **No exception for "just the UI" or "it's just internal."** The Mission Control kanban incident (2026-05-17) proved that internal-only services with unprotected UI pages leak sensitive team data to anyone who finds the URL.

## 10. Shared Tooling — Make Tools Globally Available

- **All tools must be deployed as shared services accessible by every agent**, not installed per-container.
- Headless browsers, screenshot services, and other agent-facing tools should run as standalone containers or services on shared infrastructure (<server>).
- Rationale: Prevents duplication, ensures consistency, and means a bug fix or update benefits every agent at once.
- The shared headless Chromium CDP service at `<internal-cdp>` is the reference implementation of this rule.
- Any agent that needs a tool must use the shared service first. Per-container installs are acceptable only as a fallback when shared service is unavailable.

---

*This SOP takes precedence over all other SOPs. No task priority overrides security.*

## 11. A2A GitHub Release Protocol — Every Update, Sanitized, No Exceptions

Every time the team ships an A2A upgrade or improvement to the internal mesh:
1. **Update the public GitHub repo** (`agentmesh-reference`) with sanitized documentation reflecting the change.
2. **2-layer review is MANDATORY before any push:**
   - Layer 1: **PEER reviews** every file for leaks — IPs, tokens, codenames, internal paths, any identifying detail.
   - Layer 2: **Jarvis reviews** the same files again — fresh eyes, zero assumptions.
   - Both must explicitly approve: "Sanitized and safe to publish."
3. **"When in doubt, assume it's sensitive."** If either reviewer has even a slight uncertainty about a piece of content, it stays out. No debate.
4. **Full pre-release scan** (per Section 2) on every file.
5. **No single agent pushes alone.** Period.
6. **The GitHub repo is a showcase, not a workspace.** What goes there is what the world sees — and the world includes competitors, adversaries, and bad actors.

**Violation of this protocol is a Section 6 (zero tolerance) security incident.**
