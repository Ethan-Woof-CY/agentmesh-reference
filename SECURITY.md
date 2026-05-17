# SECURITY SOP — Zero Leak Policy

**Effective:** Immediately
**Type:** Non-negotiable, no exceptions
**Scope:** All agents
**Enforcement:** Automated + peer review

---

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

---

*This SOP takes precedence over all other SOPs. No task priority overrides security.*

## 8. HTTPS Only — No Plain HTTP

- **All internal services exposed for team access MUST use HTTPS.** No exceptions.
- Self-signed certificates are acceptable for internal use. Plain HTTP is not.
- Any service found serving over HTTP must be immediately taken down and re-deployed with HTTPS.
- This applies to: Mission Control, dashboards, APIs, agent endpoints, and any other web-accessible service.
- Rationale: Even on internal networks, credentials and session tokens transmitted over HTTP can be intercepted by any process on the same network segment.
