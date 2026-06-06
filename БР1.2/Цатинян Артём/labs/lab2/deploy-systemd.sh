#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
JAVA_BIN="${JAVA_BIN:-/usr/bin/java}"
JWT_SECRET="${APP_JWT_SECRET:-lab2-server-development-secret-with-at-least-256-bits}"

install_service() {
  local unit_name="$1"
  local jar_path="$2"
  local spring_name="$3"

  cat > "/etc/systemd/system/${unit_name}.service" <<EOF
[Unit]
Description=Restaurant Booking ${spring_name}
After=network.target postgresql.service rabbitmq-server.service
Wants=postgresql.service rabbitmq-server.service

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=APP_JWT_SECRET=${JWT_SECRET}
Environment=SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/storage_local
Environment=SPRING_DATASOURCE_USERNAME=storage
Environment=SPRING_DATASOURCE_PASSWORD=storage
Environment=SPRING_RABBITMQ_HOST=localhost
Environment=SPRING_RABBITMQ_PORT=5672
Environment=SPRING_RABBITMQ_USERNAME=storage
Environment=SPRING_RABBITMQ_PASSWORD=storage
ExecStart=${JAVA_BIN} -jar ${APP_DIR}/${jar_path}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
}

install_service restaurant-booking-identity identity-service/build/libs/identity-service.jar identity-service
install_service restaurant-booking-catalog catalog-service/build/libs/catalog-service.jar catalog-service
install_service restaurant-booking-booking booking-service/build/libs/booking-service.jar booking-service
install_service restaurant-booking-review review-service/build/libs/review-service.jar review-service

wait_for_service() {
  local service_name="$1"
  local port="$2"
  local url="http://localhost:${port}/v3/api-docs"

  echo "Waiting for ${service_name} on port ${port}..."
  for attempt in $(seq 1 90); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "${service_name} is ready"
      return 0
    fi

    if ! systemctl is-active --quiet "$service_name"; then
      echo "${service_name} is not active"
      systemctl --no-pager --full status "$service_name" || true
      return 1
    fi

    sleep 1
  done

  echo "${service_name} did not become ready in time"
  systemctl --no-pager --full status "$service_name" || true
  journalctl -u "$service_name" --no-pager -n 80 || true
  return 1
}

systemctl daemon-reload
systemctl enable restaurant-booking-identity restaurant-booking-catalog restaurant-booking-booking restaurant-booking-review
systemctl restart restaurant-booking-identity
wait_for_service restaurant-booking-identity 8081
systemctl restart restaurant-booking-catalog
wait_for_service restaurant-booking-catalog 8082
systemctl restart restaurant-booking-booking
wait_for_service restaurant-booking-booking 8083
systemctl restart restaurant-booking-review
wait_for_service restaurant-booking-review 8084
systemctl --no-pager --full status restaurant-booking-identity restaurant-booking-catalog restaurant-booking-booking restaurant-booking-review
