#!/usr/bin/env bash
#
# Upload Chrome Web Store secrets to GitHub repository secrets.
# Reads from .env.publish by default.
#
# Usage:
#   ./scripts/upload-secrets.sh              # upload secrets
#   ./scripts/upload-secrets.sh --dry-run    # show what would be uploaded (values masked)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.publish"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
fi

# Required secret keys
REQUIRED_KEYS="CHROME_CLIENT_ID CHROME_CLIENT_SECRET CHROME_REFRESH_TOKEN CHROME_EXTENSION_ID CHROME_PUBLISHER_ID"

# Check env file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: $ENV_FILE not found."
    echo "Copy .env.publish.example to .env.publish and fill in your values."
    exit 1
fi

# Check gh CLI
if ! command -v gh &>/dev/null; then
    echo "Error: gh CLI not found. Install it from https://cli.github.com"
    exit 1
fi

if ! gh auth status &>/dev/null; then
    echo "Error: Not logged in to GitHub. Run: gh auth login"
    exit 1
fi

# Detect repo
REPO=$(cd "$ROOT_DIR" && gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || true)
if [[ -z "$REPO" ]]; then
    echo "Error: Could not determine GitHub repository."
    exit 1
fi

echo "Repository: $REPO"
echo ""

# Helper: get value for a key from the env file
get_env_value() {
    local key="$1"
    local value
    value=$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)
    echo "$value"
}

# Validate required keys
MISSING=""
for key in $REQUIRED_KEYS; do
    value=$(get_env_value "$key")
    if [[ -z "$value" ]]; then
        MISSING="$MISSING $key"
    fi
done

if [[ -n "$MISSING" ]]; then
    echo "Error: Missing required keys in $ENV_FILE:"
    for key in $MISSING; do
        echo "  - $key"
    done
    exit 1
fi

# Upload all non-empty, non-comment lines from the env file
upload_count=0
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    # Trim whitespace
    key=$(echo "$key" | xargs)
    [[ -z "$value" ]] && continue

    masked="${value:0:4}****"
    if $DRY_RUN; then
        echo "[dry-run] Would set secret: $key = $masked"
    else
        echo "$value" | gh secret set "$key" --repo "$REPO"
        echo "Set secret: $key = $masked"
    fi
    ((upload_count++))
done < "$ENV_FILE"

echo ""
if $DRY_RUN; then
    echo "Dry run complete. $upload_count secrets would be uploaded to $REPO."
else
    echo "Done. $upload_count secrets uploaded to $REPO."
fi
