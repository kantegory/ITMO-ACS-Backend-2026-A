#!/usr/bin/env bash
# Run from deploy.sh. Only installation-specific credentials and CA certificates are prepared here.
set -euo pipefail
umask 077
cd "$(dirname "$0")"
tf=../terraform
: "${KUBECONFIG:?Set KUBECONFIG to the lab cluster}"
cmp -s "$KUBECONFIG" "$tf/.lab7/kubeconfig.yaml" || exit 1
db_id=$(terraform -chdir="$tf" output -raw database_id)
dir="$tf/.lab7/credentials-$db_id"
mkdir -p "$dir"
temp=$(mktemp -d "$dir/.tmp.XXXXXX")
trap 'rm -rf -- "$temp"' EXIT
k=(kubectl -n rental-lab7)
put() {
  "${k[@]}" create "$@" --dry-run=client -o yaml |
    "${k[@]}" apply --server-side --field-manager=rental-lab7 -f -
}

password() {
  local key=$1
  if [[ ! -s "$dir/$key" ]]; then
    openssl rand -hex 24 | tr -d '\n' > "$temp/$key"
    ln "$temp/$key" "$dir/$key" || test -s "$dir/$key"
  fi
}

if [[ ${1:-} == monitoring ]]; then
  password grafana
  put secret generic grafana-auth --from-file="password=$dir/grafana"
  exit
fi
[[ ${1:-} == prepare ]] || { echo 'Usage: secrets.sh {prepare|monitoring}' >&2; exit 2; }

# Keep each TLS key with its certificate, even when two runs start together.
certs="$temp/tls"
if [[ -s "$dir/tls.crt" ]]; then
  certs="$dir"  # Existing credentials from the original deployment.
else
  mkdir "$certs"
  if [[ ! -f "$dir/rabbit-tls.tar" ]]; then
    (
      cd "$certs"
      openssl req -x509 -newkey rsa:2048 -nodes -days 30 -subj '/CN=Rental Lab 7 CA' -keyout ca.key -out ca.crt
      openssl req -newkey rsa:2048 -nodes -subj /CN=rabbit -keyout tls.key -out server.csr
      printf '%s\n' 'subjectAltName=DNS:rabbit,DNS:rabbit.rental-lab7.svc.cluster.local' \
        'extendedKeyUsage=serverAuth' 'basicConstraints=CA:FALSE' > server.ext
      openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 28 -extfile server.ext -out tls.crt
      tar cf ../rabbit-tls.tar ca.crt tls.crt tls.key
    )
    ln "$temp/rabbit-tls.tar" "$dir/rabbit-tls.tar" || test -s "$dir/rabbit-tls.tar"
  fi
  tar xf "$dir/rabbit-tls.tar" -C "$certs"
fi

if [[ ! -s "$dir/pg-ca.pem" ]]; then
  printf 'header = "Authorization: Bearer %s"\n' "${UPCLOUD_TOKEN:?Set UPCLOUD_TOKEN}" |
    curl -fsS --config - https://api.upcloud.com/1.3/database/certificate |
    jq -er '.certificate' > "$temp/pg-ca.pem"
  openssl x509 -in "$temp/pg-ca.pem" -noout
  mv "$temp/pg-ca.pem" "$dir/pg-ca.pem"
fi
put configmap ca --from-file="pg-ca.pem=$dir/pg-ca.pem" --from-file="rabbit-ca.pem=$certs/ca.crt"
put secret generic rabbit-tls --from-file="tls.key=$certs/tls.key" --from-file="tls.crt=$certs/tls.crt" --from-file="ca.crt=$certs/ca.crt"

password jwt
password internal
password broker
password cookie
put secret generic auth --from-file="JWT_SECRET=$dir/jwt" --from-file="INTERNAL_SERVICE_TOKEN=$dir/internal"
put secret generic rabbit-cookie --from-file="value=$dir/cookie"
put secret generic rabbit-password --from-file="password=$dir/broker"
printf 'amqps://rental:%s@rabbit:5671/%%2F' "$(<"$dir/broker")" > "$temp/amqps"
put secret generic broker-client --from-file="RABBITMQ_URL=$temp/amqps"

roles=()
for db in identity property rental messaging; do
  password "role-$db"
  roles+=(--from-file="$db=$dir/role-$db")
  put secret generic "db-$db" --from-literal="DB_NAME=$db" --from-literal="DB_USER=$db" --from-file="DB_PASSWORD=$dir/role-$db"
done
put secret generic pg-roles "${roles[@]}"

for key in service_username service_password; do
  jq -erj --arg id "$db_id" --arg key "$key" \
    '.resources[] | select(.type=="upcloud_managed_database_postgresql" and .name=="lab") | .instances[].attributes | select(.id==$id) | .[$key] | strings | select(length>0)' \
    "$tf/terraform.tfstate" > "$temp/$key"
done
put secret generic pg-bootstrap --from-file="PGUSER=$temp/service_username" --from-file="PGPASSWORD=$temp/service_password"
