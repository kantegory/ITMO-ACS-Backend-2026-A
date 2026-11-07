#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    echo "Create .env from .env.example before deployment." >&2
    exit 1
fi

docker compose config --quiet

# The target server has 2 GB RAM. Build one image at a time to avoid OOM.
for service in \
    auth-user-service \
    company-service \
    dictionary-service \
    vacancy-service \
    resume-service \
    application-service \
    interaction-service
do
    COMPOSE_PARALLEL_LIMIT=1 docker compose build "$service"
done

docker compose up -d

for service in \
    auth-user-service \
    company-service \
    dictionary-service \
    vacancy-service \
    resume-service \
    application-service \
    interaction-service
do
    docker compose exec -T "$service" npm run migrate
done

docker compose ps
curl --fail --silent --show-error http://127.0.0.1:3003/api/v1/industries >/dev/null
echo "Job Platform LAB4 deployment completed."

