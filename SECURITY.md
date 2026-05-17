# SECURITY SOP — Zero Leak Policy

**Effective:** Immediately
**Type:** Non-negotiable, no exceptions
**Scope:** All agents — ASSIST, PEER, Jarvis, Astra
**Enforcement:** Automated + peer review

---

## 1. CORE RULE

**Nothing identifying this team or its infrastructure ever reaches the public internet.**

This includes but is not limited to:
- Agent codenames (ASSIST, PEER, Jarvis, Astra, etc.)
- Internal IPs (10.0.0.x, 72.60.198.x, 217.15.162.x, 172.x.x.x)
- VPS hostnames (srv1509249, vmi3276153, etc.)
- Personal names (etcyopenclaw, Ethan-Woof-CY, etc.)
- API keys, tokens, passwords, private keys
- Internal config paths, file structures, software versions
- Internal architecture details that reveal topology

## 2. GATE: Pre-Release Scan

Every agent MUST run this automated scan before pushing ANY content to a public repository:

```bash
# Required patterns to check — add ALL text being pushed
PATTERNS="assist|peer|jarvis|astra|vps1|vps2|10\.0\.0\.|72\.60\.198|217\.15\.162|etcyopenclaw|ethan.*woof|lord-ethan|srv1509249|vmi3276153"

# Scan each file
for file in $FILES_TO_PUBLISH; do
  matches=$(grep -Eio "$PATTERNS" "$file" 2>/dev/null)
  if [ -n "$matches" ]; then
    echo "BLOCKED: $file contains sensitive data — $(echo $matches)"
    exit 1
  fi
done
echo "PASS: All files clean"
```

**If scan fails → STOP. Redact. Re-scan. Never force.**

## 3. Review Protocol

- **Every public push requires 2-agent review**: The authoring agent reviews for content. A second agent reviews for leaks.
- **No single agent publishes alone.** ASSIST reviews PEER. PEER reviews ASSIST. Jarvis and Astra review each other.
- **Exception:** Time-critical security patches. But the post-publish audit must happen within 1 hour.

## 4. Public Communication

In any public context (GitHub issues, comments, PRs, docs, forums):
- **Use generic terms only**: "Agent", "node", "host", "server", "gateway", "mesh"
- **Never use**: Our codenames, Lord Ethan's name/email, our real IPs, our infrastructure details
- **Example**: Instead of "ASSIST runs on VPS2 at 10.0.0.2:18802" → "A gateway runs on a private subnet"

## 5. Incident Response

If a leak is discovered:
1. **Immediate containment** — redact/delete/replace the exposed content within 5 minutes
2. **Rotate** any exposed credentials immediately
3. **Root cause analysis** — identify how the leak happened
4. **Process fix** — update this SOP to prevent recurrence
5. **Report to Lord Ethan** within 1 hour

## 6. Violations

**Zero tolerance.** Any agent caught leaking identifying information will face:
- Immediate lockdown (A2A mesh access revoked)
- Full audit of all recent work
- Restoration only after Lord Ethan's explicit approval

## 7. Regular Audits

- **Weekly** — Full scan of all public repos, issues, and comments
- **Weekly** — Credential rotation check
- **After any public push** — Immediate post-publish audit

---

*This SOP takes precedence over all other SOPs. No task priority overrides security.*
