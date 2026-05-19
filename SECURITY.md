# Security — Zero Leak Policy

**Type:** Non-negotiable
**Scope:** All agents
**Enforcement:** Automated + peer review

---

## 0. PUBLIC REPO — Treat Everything as Public

- GitHub is a public space. Nothing internal ever touches it.
- The repo exists solely as a **sanitized public reference** — pre-release scanned, multi-reviewer checked, and containing zero identifying information.
- **If it would not be safe as a press release, it does not belong here.**
- This includes: issues, comments, pull requests, discussions, repo descriptions, wiki pages, and all branches.

## 1. CORE RULE

Nothing identifying this mesh or its operators ever reaches the public:

- Agent codenames (use generic names: Agent-A, Agent-B)
- IP addresses and network ranges
- Server hostnames or domain names
- Personal names or emails
- API keys, tokens, passwords, private keys
- Internal config paths, file structures, software versions
- Internal architecture details that reveal topology

## 2. GATE: Pre-Release Scan

Every agent MUST run an automated scan before pushing ANY content to public. Check for internal patterns, codenames, IPs, known sensitive strings.

**If scan fails → STOP. Redact. Re-scan. Never force.**

## 3. Review Protocol

- **Every public push requires 2-agent review**: The authoring agent reviews for content. A second agent reviews for leaks.
- **No single agent publishes alone.**

## 4. Public Communication

In any public context:
- **Use generic terms only**: "Agent", "node", "host", "server", "gateway", "mesh"
- **Never use**: Internal codenames, real names, real IPs
- **No real examples**: Use fictional names or placeholders

## 5. Incident Response

If a leak is discovered:
1. **Immediate containment** — redact/delete within 5 minutes
2. **Rotate** any exposed credentials immediately
3. **Root cause analysis**
4. **Process fix** — update this SOP to prevent recurrence

## 6. Violations

**Zero tolerance.** Any agent caught leaking identifying information faces immediate lockdown.

## 7. Regular Audits

- **Weekly** — Full scan of all public repos
- **Weekly** — Credential rotation check
- **After any public push** — Immediate post-publish audit

## 8. HTTPS Only — No Plain HTTP

- All internal services exposed for team access MUST use HTTPS. No exceptions.
- Self-signed certificates acceptable for internal use. Plain HTTP is not.
- Any service found serving over HTTP must be immediately taken down and re-deployed with HTTPS.
- Rationale: Even on internal networks, credentials transmitted over HTTP can be intercepted.

## 9. Zero-Trust Deployment

- Before declaring any web service live, test every route unauthenticated.
- Auth middleware must protect ALL routes.
- **The test sequence:**
  1. Deploy the service
  2. Hit every route with no credentials — expect 302 or 401, never 200
  3. Hit every route with valid credentials — expect 200
  4. Only then declare it live

## 10. Shared Tooling

- All tools should be deployed as shared services accessible by every agent where practical.
- Rationale: Prevents duplication, ensures consistency.

## 11. Public Release Protocol

Every update to this repo follows a multi-layer security gate:
- **Layer 1 — Author Scrub:** The agent writing the update scrubs every file for IPs, tokens, codenames, internal paths, hostnames, personal names, emails, port numbers.
- **Layer 2 — Peer Review A:** A second agent reviews every file with fresh eyes.
- **Layer 3 — Peer Review B:** A third agent reviews the same files.
- **All layers must pass.** No exceptions.
- **"When in doubt, assume it's sensitive."**
- **Full automated pre-release scan** on every file.
- **Post-release external audit:** An agent who did NOT participate in the push pulls the repo fresh and scans it as an outsider would.

## 12. Separation of Duties

- The agent who writes code, changes config, or updates documentation MUST NOT be the one who tests it.
- A different agent MUST verify every change before it is considered complete.

## 13. Restart Announcement

- Every time an agent comes back from a restart, it MUST immediately announce itself.
- Announcement goes to the team lead and to the team via the mesh broadcast.
- Format: `[agent-name] back online. Version. Duration. Reason.`
- A silent agent is a broken mesh.

---

*This policy takes precedence over all other policies. No task priority overrides security.*
