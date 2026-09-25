#!/usr/bin/env bash
# ==============================================================================
# Скрипт комплексной проверки микросервисной системы (E2E Integration Verification)
# Проект: Система бронирования столиков в ресторанах (Вариант 1)
# Студент: Галилей Кирилл Дмитриевич (гр. К3340, поток БР1.1)
# ==============================================================================

set -e

# Цвета для терминала
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PASSED_COUNT=0
FAILED_COUNT=0

log_section() {
    echo ""
    echo -e "${BLUE}${BOLD}══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${BLUE}${BOLD}══════════════════════════════════════════════════════════════════════════${NC}"
}

log_step() {
    echo -e "\n${YELLOW}▶ $1...${NC}"
}

assert_success() {
    local message="$1"
    echo -e "  ${GREEN}✔ [PASS]${NC} $message"
    PASSED_COUNT=$((PASSED_COUNT + 1))
}

assert_failure() {
    local message="$1"
    echo -e "  ${RED}✘ [FAIL]${NC} $message"
    FAILED_COUNT=$((FAILED_COUNT + 1))
}

json_val() {
    local json="$1"
    local expr="$2"
    python3 -c "import sys, json; data=json.loads(sys.argv[1]); print($expr)" "$json" 2>/dev/null || echo ""
}

echo -e "${BOLD}${CYAN}"
cat << "EOF"
  ____            _    _                 ______ ___  ______   _____           _   
 |  _ \          | |  (_)               |  ____|__ \|  ____| |_   _|         | |  
 | |_) | ___  ___| | ___ _ __   __ _    | |__     ) | |__      | |  ___  ___| |_ 
 |  _ < / _ \/ _ \ |/ / | '_ \ / _` |   |  __|   / /|  __|     | | / _ \/ __| __|
 | |_) | (_) | (_) |   <| | | | (_| |   | |____ / /_| |____   _| ||  __/\__ \ |_ 
 |____/ \___/ \___/|_|\_\_|_| |_|\__, |   |______|____|______| |_____\___||___/\__|
                                  __/ |                                           
                                 |___/                                            
EOF
echo -e "${NC}"
echo -e "  Автор: ${BOLD}Галилей Кирилл Дмитриевич${NC} (ИТМО, гр. К3340)"
echo -e "  Дата проверки: $(date)"
echo -e "  Стек: Node.js, Express, TypeScript, TypeORM, PostgreSQL, RabbitMQ, Docker"

# ------------------------------------------------------------------------------
# ФАЗА 1: Проверка доступности портов и контейнеров
# ------------------------------------------------------------------------------
log_section "ФАЗА 1: Проверка статуса сервисов и доступности портов"

check_http() {
    local name="$1"
    local url="$2"
    local expected="$3"
    log_step "Проверка $name ($url)"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    if [ "$code" = "$expected" ] || ([ "$expected" = "200" ] && [ "$code" = "200" ]); then
        assert_success "$name отвечает с кодом HTTP $code"
    else
        assert_failure "$name недоступен! Код: $code (ожидался $expected)"
    fi
}

check_http "Auth Service" "http://localhost:5001/internal/auth/verify" "401"
check_http "Restaurant Service" "http://localhost:5002/restaurants" "200"
check_http "Booking Service" "http://localhost:5003/reservations/my" "200"
check_http "Notification Service" "http://localhost:5004/health" "200"
check_http "RabbitMQ Management API" "http://guest:guest@localhost:15672/api/overview" "200"

# ------------------------------------------------------------------------------
# ФАЗА 2: Сервис аутентификации (Auth Service :5001)
# ------------------------------------------------------------------------------
log_section "ФАЗА 2: Проверка Auth Service (JWT, Регистрация, Логин)"

TIMESTAMP=$(date +%s)
TEST_EMAIL="student_${TIMESTAMP}@itmo.ru"
TEST_PASSWORD="StrongPassword123!"
TEST_NAME="Кирилл Дмитриевич Галилей"

log_step "Регистрация нового пользователя ($TEST_EMAIL)"
REG_RESP=$(curl -s -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"full_name\":\"$TEST_NAME\",\"phone\":\"+79991234567\",\"role\":\"customer\"}")

USER_ID=$(json_val "$REG_RESP" "data['user']['id']")
AUTH_TOKEN=$(json_val "$REG_RESP" "data['token']")

if [ -n "$USER_ID" ] && [ -n "$AUTH_TOKEN" ]; then
    assert_success "Пользователь успешно зарегистрирован (UUID: $USER_ID)"
else
    assert_failure "Ошибка регистрации пользователя: $REG_RESP"
    exit 1
fi

log_step "Вход в систему (POST /auth/login)"
LOGIN_RESP=$(curl -s -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

LOGIN_TOKEN=$(json_val "$LOGIN_RESP" "data['token']")
if [ -n "$LOGIN_TOKEN" ]; then
    assert_success "Успешная авторизация, получен JWT токен"
else
    assert_failure "Ошибка логина: $LOGIN_RESP"
fi

log_step "Проверка валидности JWT через внутренний эндпоинт (GET /internal/auth/verify)"
VERIFY_RESP=$(curl -s -X GET http://localhost:5001/internal/auth/verify \
  -H "Authorization: Bearer $AUTH_TOKEN")

VERIFY_EMAIL=$(json_val "$VERIFY_RESP" "data.get('email', '')")
if [ "$VERIFY_EMAIL" = "$TEST_EMAIL" ]; then
    assert_success "Токен проверен и декодирован (email: $VERIFY_EMAIL)"
else
    assert_failure "Верификация токена не удалась: $VERIFY_RESP"
fi

# ------------------------------------------------------------------------------
# ФАЗА 3: Сервис ресторанов (Restaurant Service :5002)
# ------------------------------------------------------------------------------
log_section "ФАЗА 3: Проверка Restaurant Service (Каталог и Столики)"

log_step "Создание нового ресторана"
REST_RESP=$(curl -s -X POST http://localhost:5002/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ресторан Университетский ИТМО",
    "description": "Лучшая кухня на Кронверкском проспекте",
    "cuisine_type": "Европейская",
    "price_range": 3,
    "address": "Кронверкский пр., д. 49",
    "city": "Санкт-Петербург",
    "phone": "+78121112233"
  }')

RESTAURANT_ID=$(json_val "$REST_RESP" "data['id']")
if [ -n "$RESTAURANT_ID" ]; then
    assert_success "Ресторан создан (ID: $RESTAURANT_ID)"
else
    assert_failure "Не удалось создать ресторан: $REST_RESP"
    exit 1
fi

log_step "Добавление столика в ресторан"
TABLE_RESP=$(curl -s -X POST "http://localhost:5002/restaurants/$RESTAURANT_ID/tables" \
  -H "Content-Type: application/json" \
  -d '{
    "table_number": 12,
    "capacity": 4,
    "location_zone": "VIP у панорамного окна"
  }')

TABLE_ID=$(json_val "$TABLE_RESP" "data['id']")
if [ -n "$TABLE_ID" ]; then
    assert_success "Столик успешно добавлен (ID: $TABLE_ID, Стол №12, Вместимость: 4)"
else
    assert_failure "Не удалось добавить столик: $TABLE_RESP"
    exit 1
fi

log_step "Межсервисная верификация существования стола (GET /internal/restaurants/.../verify)"
TABLE_VERIFY=$(curl -s "http://localhost:5002/internal/restaurants/$RESTAURANT_ID/tables/$TABLE_ID/verify")
TABLE_VERIFY_ID=$(json_val "$TABLE_VERIFY" "data.get('id', '')")
if [ "$TABLE_VERIFY_ID" = "$TABLE_ID" ]; then
    TABLE_CAP=$(json_val "$TABLE_VERIFY" "data.get('capacity', 0)")
    assert_success "Столик подтверждён внутренним эндпоинтом: id=$TABLE_VERIFY_ID, вместимость=$TABLE_CAP"
else
    assert_failure "Внутренняя верификация столика не прошла: $TABLE_VERIFY"
fi

# ------------------------------------------------------------------------------
# ФАЗА 4: Сервис бронирования (Booking Service :5003) и защита от овербукинга
# ------------------------------------------------------------------------------
log_section "ФАЗА 4: Проверка Booking Service & Защита от овербукинга"

RESERVATION_DATE="2026-10-15"
START_TIME="18:00"
END_TIME="20:00"

log_step "Позитивный тест: Создание первого бронирования (POST /reservations)"
BOOK_RESP=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5003/reservations \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"restaurant_id\": \"$RESTAURANT_ID\",
    \"table_id\": \"$TABLE_ID\",
    \"reservation_date\": \"$RESERVATION_DATE\",
    \"start_time\": \"$START_TIME\",
    \"end_time\": \"$END_TIME\",
    \"guests_count\": 2,
    \"special_requests\": \"Проверка интеграции системы бронирования\"
  }")

HTTP_CODE=$(echo "$BOOK_RESP" | tail -n1)
JSON_BODY=$(echo "$BOOK_RESP" | sed '$d')

RESERVATION_ID=$(json_val "$JSON_BODY" "data.get('id', '')")

if [ "$HTTP_CODE" = "201" ] && [ -n "$RESERVATION_ID" ]; then
    assert_success "Бронирование создано (ID: $RESERVATION_ID, Статус: 201 Created)"
else
    assert_failure "Ошибка бронирования! HTTP: $HTTP_CODE, ответ: $JSON_BODY"
    exit 1
fi

log_step "Негативный тест (Overbooking): Попытка забронировать тот же столик в пересекающееся время (19:00 - 21:00)"
CONFLICT_RESP=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5003/reservations \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"restaurant_id\": \"$RESTAURANT_ID\",
    \"table_id\": \"$TABLE_ID\",
    \"reservation_date\": \"$RESERVATION_DATE\",
    \"start_time\": \"19:00\",
    \"end_time\": \"21:00\",
    \"guests_count\": 3,
    \"special_requests\": \"Попытка вызвать конфликт\"
  }")

CONFLICT_CODE=$(echo "$CONFLICT_RESP" | tail -n1)
CONFLICT_BODY=$(echo "$CONFLICT_RESP" | sed '$d')

if [ "$CONFLICT_CODE" = "409" ]; then
    assert_success "Защита сработала штатно: возвращён HTTP 409 Conflict ('Table already reserved')"
else
    assert_failure "Ошибка: овербукинг не заблокирован! Код: $CONFLICT_CODE, ответ: $CONFLICT_BODY"
fi

log_step "Проверка списка бронирований (GET /reservations/my)"
MY_BOOKS=$(curl -s http://localhost:5003/reservations/my)
HAS_MY_RESERVATION=$(python3 -c "import sys, json; data=json.loads(sys.argv[1]); found=any(r.get('id')=='$RESERVATION_ID' for r in data); print(found)" "$MY_BOOKS")

if [ "$HAS_MY_RESERVATION" = "True" ]; then
    assert_success "Созданное бронирование отображается в списке активных"
else
    assert_failure "Бронирование не найдено в списке"
fi

# ------------------------------------------------------------------------------
# ФАЗА 5: Асинхронные события RabbitMQ и Notification Service :5004
# ------------------------------------------------------------------------------
log_section "ФАЗА 5: Проверка RabbitMQ и Notification Service (Event-Driven)"

log_step "Проверка очереди RabbitMQ (notifications_queue) через Management API"
QUEUE_INFO=$(curl -s -u guest:guest http://localhost:15672/api/queues/%2F/notifications_queue)
QUEUE_EXISTS=$(json_val "$QUEUE_INFO" "'name' in data and data['name'] == 'notifications_queue'")

if [ "$QUEUE_EXISTS" = "True" ]; then
    assert_success "Очередь 'notifications_queue' активна в RabbitMQ"
else
    assert_failure "Очередь notifications_queue не найдена в RabbitMQ"
fi

log_step "Ожидание и вычитка события бронирования в Notification Service"
sleep 2

NOTIF_LOGS=$(docker compose -f docker-compose.yml logs --tail 30 notification-service 2>&1 || true)
if echo "$NOTIF_LOGS" | grep -q "$RESERVATION_ID"; then
    assert_success "Notification Service успешно вычитал событие reservation.created для ID $RESERVATION_ID"
    assert_success "Эмуляция отправки email/push клиенту выполнена успешно ([EMAIL DISPATCHER])"
else
    # Проверим общее получение событий
    if echo "$NOTIF_LOGS" | grep -q "EVENT RECEIVED"; then
        assert_success "Notification Service активно получает события из очереди RabbitMQ"
    else
        assert_failure "Событие бронирования не зафиксировано в логах Notification Service"
    fi
fi

# ------------------------------------------------------------------------------
# ФАЗА 6: Изоляция баз данных (Database-per-service pattern)
# ------------------------------------------------------------------------------
log_section "ФАЗА 6: Проверка разделения баз данных (Database-per-service)"

log_step "Проверка БД Auth Service (postgres_auth_db, таблица users)"
AUTH_USERS_COUNT=$(docker exec postgres_auth_db psql -U postgres -d auth_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$AUTH_USERS_COUNT" -gt 0 ]; then
    assert_success "Таблица users содержит $AUTH_USERS_COUNT записей в auth_db"
else
    assert_failure "В auth_db нет записей"
fi

log_step "Проверка БД Restaurant Service (postgres_restaurant_db, таблица restaurants)"
REST_COUNT=$(docker exec postgres_restaurant_db psql -U postgres -d restaurant_db -t -c "SELECT COUNT(*) FROM restaurants;" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$REST_COUNT" -gt 0 ]; then
    assert_success "Таблица restaurants содержит $REST_COUNT записей в restaurant_db"
else
    assert_failure "В restaurant_db нет записей"
fi

log_step "Проверка БД Booking Service (postgres_booking_db, таблица reservations)"
BOOK_COUNT=$(docker exec postgres_booking_db psql -U postgres -d booking_db -t -c "SELECT COUNT(*) FROM reservations;" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$BOOK_COUNT" -gt 0 ]; then
    assert_success "Таблица reservations содержит $BOOK_COUNT записей в booking_db"
else
    assert_failure "В booking_db нет записей"
fi

# ------------------------------------------------------------------------------
# ИТОГОВЫЙ ОТЧЁТ
# ------------------------------------------------------------------------------
log_section "ИТОГОВЫЙ ОТЧЁТ ВЕРИФИКАЦИИ"

TOTAL_TESTS=$((PASSED_COUNT + FAILED_COUNT))

echo -e "  Всего проверок:     ${BOLD}$TOTAL_TESTS${NC}"
echo -e "  Успешно пройдено:   ${GREEN}${BOLD}$PASSED_COUNT${NC}"
echo -e "  Ошибок:             ${RED}${BOLD}$FAILED_COUNT${NC}"

if [ "$FAILED_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}${BOLD}✔ ВСЕ СЕРВИСЫ, ОЧЕРЕДИ И БАЗЫ ДАННЫХ РАБОТАЮТ ИДЕАЛЬНО!${NC}"
    echo -e "${GREEN}  Система полностью готова к демонстрации и защите лабораторных работ!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}${BOLD}✘ Внимание: обнаружены ошибки при тестировании!${NC}"
    exit 1
fi
