
set -euo pipefail
BASE="${1:-http://127.0.0.1}"
EMAIL="smoke$(date +%s)@example.com"

echo "== GET /api/v1/categories"
curl -fsS -i "$BASE/api/v1/categories" | head -n 12

echo; echo "== GET /api/v1/vacancies"
curl -fsS -o /dev/null -w "HTTP %{http_code}\n" "$BASE/api/v1/vacancies"

echo; echo "== POST /api/v1/auth/register"
curl -fsS -X POST "$BASE/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Passw0rd!\",\"role\":\"applicant\"}" | head -c 300
echo

echo; echo "== POST /api/v1/auth/login"
curl -fsS -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Passw0rd!\"}" | head -c 300
echo
