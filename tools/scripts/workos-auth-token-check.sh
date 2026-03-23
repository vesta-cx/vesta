#!/usr/bin/env bash
set -euo pipefail

WORKOS_BASE_URL="https://api.workos.com/user_management/authenticate"
DEFAULT_ORG_NAME="${WORKOS_DEFAULT_ORG_NAME:-vesta}"

read -rp "WorkOS client ID: " WORKOS_CLIENT_ID
read -rsp "WorkOS staging API key: " WORKOS_API_KEY
echo
read -rp "Email: " WORKOS_EMAIL
read -rsp "Password: " WORKOS_PASSWORD
echo
read -rp "Preferred organization name [${DEFAULT_ORG_NAME}]: " WORKOS_ORG_NAME
WORKOS_ORG_NAME="${WORKOS_ORG_NAME:-$DEFAULT_ORG_NAME}"

authenticate() {
  local payload="$1"

  curl -sS "$WORKOS_BASE_URL" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

AUTH_JSON="$(
  authenticate "$(
    jq -n \
      --arg client_id "$WORKOS_CLIENT_ID" \
      --arg client_secret "$WORKOS_API_KEY" \
      --arg email "$WORKOS_EMAIL" \
      --arg password "$WORKOS_PASSWORD" \
      '{
        client_id: $client_id,
        client_secret: $client_secret,
        grant_type: "password",
        email: $email,
        password: $password,
        user_agent: "curl/workos-token-check"
      }'
  )"
)"

echo
echo "=== Raw initial auth response ==="
echo "$AUTH_JSON" | jq .

AUTH_CODE="$(echo "$AUTH_JSON" | jq -r '.code // empty')"

if [ "$AUTH_CODE" = "organization_selection_required" ]; then
  PENDING_AUTHENTICATION_TOKEN="$(
    echo "$AUTH_JSON" | jq -r '.pending_authentication_token // empty'
  )"
  SELECTED_ORG_ID="$(
    echo "$AUTH_JSON" | jq -r \
      --arg org_name "$WORKOS_ORG_NAME" \
      '[.organizations[]? | select((.name | ascii_downcase) == ($org_name | ascii_downcase))][0].id // empty'
  )"

  if [ -z "$PENDING_AUTHENTICATION_TOKEN" ] || [ -z "$SELECTED_ORG_ID" ]; then
    echo
    echo "Could not auto-select organization '${WORKOS_ORG_NAME}'."
    echo "Available organizations:"
    echo "$AUTH_JSON" | jq '.organizations'
    exit 1
  fi

  echo
  echo "=== Continuing auth with organization ==="
  echo "Using organization '${WORKOS_ORG_NAME}' (${SELECTED_ORG_ID})"

  AUTH_JSON="$(
    authenticate "$(
      jq -n \
        --arg client_id "$WORKOS_CLIENT_ID" \
        --arg client_secret "$WORKOS_API_KEY" \
        --arg pending_authentication_token "$PENDING_AUTHENTICATION_TOKEN" \
        --arg organization_id "$SELECTED_ORG_ID" \
        '{
          client_id: $client_id,
          client_secret: $client_secret,
          grant_type: "urn:workos:oauth:grant-type:organization-selection",
          pending_authentication_token: $pending_authentication_token,
          organization_id: $organization_id,
          user_agent: "curl/workos-token-check"
        }'
    )"
  )"

  echo
  echo "=== Raw organization-selection auth response ==="
  echo "$AUTH_JSON" | jq .
fi

ACCESS_TOKEN="$(echo "$AUTH_JSON" | jq -r '.access_token')"

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo
  echo "No access_token returned."
  exit 1
fi

echo
echo "=== Decoded access token payload (NOT signature-verified) ==="
ACCESS_TOKEN="$ACCESS_TOKEN" python3 - <<'PY'
import base64
import json
import os

token = os.environ["ACCESS_TOKEN"]
parts = token.split(".")
if len(parts) != 3:
    raise SystemExit("access_token is not a JWT")

payload = parts[1]
payload += "=" * (-len(payload) % 4)
decoded = base64.urlsafe_b64decode(payload.encode("utf-8"))
print(json.dumps(json.loads(decoded), indent=2))
PY

echo
echo "=== Claims of interest ==="
ACCESS_TOKEN="$ACCESS_TOKEN" python3 - <<'PY'
import base64
import json
import os

token = os.environ["ACCESS_TOKEN"]
parts = token.split(".")
payload = parts[1]
payload += "=" * (-len(payload) % 4)
claims = json.loads(base64.urlsafe_b64decode(payload.encode("utf-8")).decode("utf-8"))

for key in [
    "feature_flags",
    "entitlements",
    "permissions",
    "roles",
    "role",
    "org_id",
    "sub",
]:
    print(f"{key}: {claims.get(key)}")
PY

echo
echo "JWKS URL:"
echo "https://api.workos.com/sso/jwks/${WORKOS_CLIENT_ID}"
