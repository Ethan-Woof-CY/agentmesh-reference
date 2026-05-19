#!/bin/sh
# github-scan.sh — Automated security scanner for GitHub Push Protocol
# Usage: ./github-scan.sh <staging-directory>
# Returns non-zero if banned patterns found

STAGING="${1:-/tmp/github-staging}"
FAIL=0

if [ ! -d "$STAGING" ]; then
  echo "ERROR: Directory not found: $STAGING"
  exit 1
fi

echo "Scanning $STAGING for banned security patterns..."
echo ""

ignore_files="(\.git|node_modules|github-scan\.sh)"

scan_pattern() {
  local label="$1"
  local pattern="$2"
  local matches
  matches=$(find "$STAGING" -type f -not -path "*/.git/*" -not -path "*/node_modules/*" -not -name "github-scan.sh" -exec grep -lnE "$pattern" {} + 2>/dev/null)
  if [ -n "$matches" ]; then
    echo "WARNING [$label] Matches found in:"
    echo "$matches" | sed 's/^/    /'
    FAIL=1
  fi
}

scan_pattern "Private IPs (10.x.x.x)" '10\.(0|[0-9]{1,3})\.(0|[0-9]{1,3})\.(0|[0-9]{1,3})'
scan_pattern "API keys" 'sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|ghr_[a-zA-Z0-9]{36,}|github_pat_[a-zA-Z0-9]{70,}'
scan_pattern "Bot tokens" 'bot[0-9]+:[A-Za-z0-9_-]{35,}'
scan_pattern "Private keys" '-----BEGIN.*PRIVATE KEY-----'
scan_pattern "SSH key fingerprints" 'SHA256:[A-Za-z0-9+/=]{40,}'
scan_pattern "Ed25519 public keys" 'AAAAC3NzaC1lZDI1NTE5'
scan_pattern "Internal domain patterns" '\.(local|internal|private|corp)\.'
scan_pattern "Real names or codenames" '(Lord|Team Lead|Senior Agent|Lead Agent)[^s]'
scan_pattern "Real API keys or credentials" '[A-Z]+_API_KEY|BOT_TOKEN|SECRET_KEY|PASSWORD'

echo ""
if [ "$FAIL" = "1" ]; then
  echo "BLOCKED — Banned patterns detected. Sanitize files before retrying."
  exit 1
fi

echo "PASS — No banned patterns found. Push authorized."
exit 0
