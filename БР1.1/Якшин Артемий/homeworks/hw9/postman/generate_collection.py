#!/usr/bin/env python3
"""ДЗ9: документированная коллекция Postman (v2.1) для «Restaurant Booking».

Примеры ответов берутся реальными запросами к стенду (BASE из argv[1]); в коллекцию адрес сервера
не попадает — только переменная {{base_url}}.
usage: python3 generate_collection.py http://<SERVER_IP>:8088/k8s/api/v1 .
(создаёт тестового пользователя, бронь и отзыв; бронь и отзыв удаляет сам — пользователя затем удалить из БД)
"""
import json, sys, time, uuid, urllib.request, urllib.error, pathlib

BASE = sys.argv[1].rstrip("/")
OUT = pathlib.Path(sys.argv[2])
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
ctx = {}

def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token: req.add_header("Authorization", f"Bearer {token}")
    try:
        with opener.open(req, timeout=15) as r:
            raw = r.read().decode() or ""
            return r.status, raw
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def example(name, method, path_tpl, status, raw, body=None):
    return {"name": name, "originalRequest": {"method": method, "url": "{{base_url}}" + path_tpl,
            "header": [{"key": "Content-Type", "value": "application/json"}],
            **({"body": {"mode": "raw", "raw": json.dumps(body, ensure_ascii=False, indent=2), "options": {"raw": {"language": "json"}}}} if body is not None else {})},
            "status": {200: "OK", 201: "Created", 204: "No Content", 400: "Bad Request", 401: "Unauthorized", 404: "Not Found", 409: "Conflict"}.get(status, ""),
            "code": status, "_postman_previewlanguage": "json",
            "header": [{"key": "Content-Type", "value": "application/json; charset=utf-8"}],
            "body": json.dumps(json.loads(raw), ensure_ascii=False, indent=2) if raw.strip().startswith(("{", "[")) else raw}

def item(name, method, path_tpl, desc, tests, body=None, auth=True, examples=(), prerequest=None, query=None):
    url = {"raw": "{{base_url}}" + path_tpl, "host": ["{{base_url}}"], "path": [p for p in path_tpl.split("?")[0].split("/") if p]}
    if query is None and "?" in path_tpl:   # параметры из шаблона пути: newman собирает URL из url.query
        query = [(kv.split("=", 1)[0], kv.split("=", 1)[1], "") for kv in path_tpl.split("?", 1)[1].split("&")]
    if query:
        url["query"] = [{"key": k, "value": v, "description": d, **({"disabled": True} if v == "" else {})} for k, v, d in query]
        active = "&".join(f"{k}={v}" for k, v, _ in query if v != "")
        url["raw"] = "{{base_url}}" + path_tpl.split("?")[0] + (f"?{active}" if active else "")
    req = {"method": method, "header": [], "url": url, "description": desc}
    if body is not None:
        req["header"].append({"key": "Content-Type", "value": "application/json"})
        raw = json.dumps(body, ensure_ascii=False, indent=2)
        for var in ("table_id", "restaurant_id"):   # числовые поля: переменная без кавычек, иначе API получит строку
            raw = raw.replace(f'"{{{{{var}}}}}"', f"{{{{{var}}}}}")
        req["body"] = {"mode": "raw", "raw": raw, "options": {"raw": {"language": "json"}}}
    if not auth: req["auth"] = {"type": "noauth"}
    ev = [{"listen": "test", "script": {"type": "text/javascript", "exec": tests}}]
    if prerequest: ev.insert(0, {"listen": "prerequest", "script": {"type": "text/javascript", "exec": prerequest}})
    return {"name": name, "event": ev, "request": req, "response": list(examples)}

def status_test(code, extra=()):
    return [f'pm.test("Статус {code}", () => pm.response.to.have.status({code}));',
            'pm.test("Время ответа < 3 с (с учётом сети до стенда)", () => pm.expect(pm.response.responseTime).to.be.below(3000));', *extra]

# ── реальные запросы к стенду для примеров ответов ────────────────────────────
email = f"docs-{int(time.time())}@example.com"
reg_body = {"name": "Анна Документова", "email": email, "phone": "+79001112233", "password": "docs-pass-123"}
s_reg, r_reg = call("POST", "/auth/register", reg_body)
token = json.loads(r_reg)["token"]
s_login, r_login = call("POST", "/auth/login", {"email": email, "password": "docs-pass-123"})
s_login_bad, r_login_bad = call("POST", "/auth/login", {"email": email, "password": "wrong-password"})
s_reg_bad, r_reg_bad = call("POST", "/auth/register", {"name": "A", "email": "not-an-email", "password": "123"})
s_me, r_me = call("GET", "/users/me", token=token)
s_me_401, r_me_401 = call("GET", "/users/me")
s_cuis, r_cuis = call("GET", "/cuisines")
s_list, r_list = call("GET", "/restaurants?city=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&limit=2")
s_rest, r_rest = call("GET", "/restaurants/1")
s_404, r_404 = call("GET", "/restaurants/999")
s_menu, r_menu = call("GET", "/restaurants/1/menu?category=%D0%94%D0%B5%D1%81%D0%B5%D1%80%D1%82%D1%8B")
s_photos, r_photos = call("GET", "/restaurants/1/photos")
slot_date, slot_time = "2027-03-08", "19:00"
s_tables, r_tables = call("GET", f"/restaurants/2/tables?date={slot_date}&time={slot_time}&guests=2")
res_body = {"table_id": 6, "reservation_date": slot_date, "reservation_time": slot_time, "guests_count": 2}
s_res, r_res = call("POST", "/reservations", res_body, token)
res_id = json.loads(r_res)["reservation_id"]
s_res409, r_res409 = call("POST", "/reservations", res_body, token)
s_getres, r_getres = call("GET", f"/reservations/{res_id}", token=token)
upd_body = {"guests_count": 1}
s_updres, r_updres = call("PUT", f"/reservations/{res_id}", upd_body, token)
s_myres, r_myres = call("GET", "/users/me/reservations", token=token)
rev_body = {"restaurant_id": 3, "rating": 5, "comment": "Отличные хинкали, быстрое обслуживание"}
s_rev, r_rev = call("POST", "/reviews", rev_body, token)
rev_id = json.loads(r_rev)["review_id"]
s_revs, r_revs = call("GET", "/restaurants/3/reviews?limit=2")
time.sleep(1.5)
s_notif, r_notif = call("GET", "/notifications", token=token)
s_delres, _ = call("DELETE", f"/reservations/{res_id}", token=token)
s_delrev, _ = call("DELETE", f"/reviews/{rev_id}", token=token)

# ── коллекция ─────────────────────────────────────────────────────────────────
save_token = ['const t = pm.response.json().token;', 'if (t) { pm.collectionVariables.set("token", t); }', 'pm.test("Есть JWT", () => pm.expect(t).to.be.a("string"));']
F = []
F.append({"name": "1. Аутентификация", "description": "Регистрация и вход. Ответ содержит JWT, который тесты сохраняют в переменную коллекции `token`; остальные запросы используют его автоматически (Bearer-авторизация на уровне коллекции).", "item": [
    item("Регистрация", "POST", "/auth/register",
         "Создаёт пользователя и сразу возвращает JWT.\n\n**Тело:** `name` (2–100 символов), `email`, `password` (8–64), `phone` (необязательно, `+7XXXXXXXXXX`).\n\n**Ответы:** `201` — пользователь и токен; `400` — ошибки валидации по полям; `409` — email уже занят.",
         ['pm.collectionVariables.set("user_email", JSON.parse(pm.request.body.raw).email);'] + status_test(201, save_token),
         body={"name": "{{user_name}}", "email": "{{$randomEmail}}", "phone": "+79001112233", "password": "{{user_password}}"}, auth=False,
         examples=[example("201 Created", "POST", "/auth/register", s_reg, r_reg, reg_body), example("400 Validation failed", "POST", "/auth/register", s_reg_bad, r_reg_bad, {"name": "A", "email": "not-an-email", "password": "123"})]),
    item("Вход", "POST", "/auth/login",
         "Проверяет пароль (bcrypt) и возвращает JWT сроком 7 дней.\n\n**Ответы:** `200` — токен и пользователь; `401` — неверный email или пароль.",
         status_test(200, save_token), body={"email": "{{user_email}}", "password": "{{user_password}}"}, auth=False,
         examples=[example("200 OK", "POST", "/auth/login", s_login, r_login, {"email": email, "password": "docs-pass-123"}), example("401 Invalid credentials", "POST", "/auth/login", s_login_bad, r_login_bad, {"email": email, "password": "wrong-password"})]),
]})
F.append({"name": "2. Профиль", "item": [
    item("Мой профиль", "GET", "/users/me", "Данные текущего пользователя по JWT. Без токена — `401`.",
         status_test(200, ['pm.test("email совпадает", () => pm.expect(pm.response.json().email).to.eql(pm.collectionVariables.get("user_email")));']),
         examples=[example("200 OK", "GET", "/users/me", s_me, r_me), example("401 без токена", "GET", "/users/me", s_me_401, r_me_401)]),
    item("Изменить профиль", "PUT", "/users/me", "Частичное обновление `name` и `phone`.", status_test(200),
         body={"name": "{{user_name}} (обновлено)"}),
]})
F.append({"name": "3. Каталог", "description": "Рестораны, кухни, меню и фото (catalog-service). Рейтинг ресторана catalog получает у review-service; при его недоступности рейтинг равен 0, но список отдаётся.", "item": [
    item("Кухни", "GET", "/cuisines", "Справочник типов кухонь, отсортирован по названию.",
         status_test(200, ['const c = pm.response.json(); pm.test("Непустой список", () => pm.expect(c.length).to.be.above(0));', 'pm.collectionVariables.set("cuisine_id", c[0].cuisine_id);']),
         auth=False, examples=[example("200 OK", "GET", "/cuisines", s_cuis, r_cuis)]),
    item("Поиск ресторанов", "GET", "/restaurants?city=Москва&limit=10",
         "Список с фильтрами и пагинацией. Ответ: `data[]` (рестораны с `average_rating`, `cuisines`, `main_photo`), `total`, `page`, `limit`.",
         status_test(200, ['const r = pm.response.json();', 'pm.test("Есть рестораны", () => pm.expect(r.data.length).to.be.above(0));', 'pm.collectionVariables.set("restaurant_id", r.data[0].restaurant_id);']),
         auth=False, query=[("city", "Москва", "город (точное совпадение)"), ("limit", "10", "размер страницы, 1–100"), ("cuisine_id", "", "фильтр по кухне"), ("price_level", "", "$, $$, $$$, $$$$"), ("search", "", "часть названия, без учёта регистра"), ("page", "1", "номер страницы")],
         examples=[example("200 OK (Москва, 2 на странице)", "GET", "/restaurants?city=Москва&limit=2", s_list, r_list)]),
    item("Ресторан", "GET", "/restaurants/{{restaurant_id}}", "Карточка ресторана: описание, кухни, фото, меню, рейтинг и число отзывов. Несуществующий id — `404`.",
         status_test(200), auth=False, examples=[example("200 OK", "GET", "/restaurants/1", s_rest, r_rest), example("404 Not Found", "GET", "/restaurants/999", s_404, r_404)]),
    item("Меню", "GET", "/restaurants/{{restaurant_id}}/menu", "Позиции меню; `category` — фильтр по части названия категории.", status_test(200), auth=False,
         query=[("category", "", "например «Десерты»")], examples=[example("200 OK (category=Десерты)", "GET", "/restaurants/1/menu?category=Десерты", s_menu, r_menu)]),
    item("Фото", "GET", "/restaurants/{{restaurant_id}}/photos", "Фотографии ресторана, главное — `is_main=true`.", status_test(200), auth=False,
         examples=[example("200 OK", "GET", "/restaurants/1/photos", s_photos, r_photos)]),
]})
F.append({"name": "4. Бронирование", "description": "Проверка свободных столиков и бронирования (reservation-service). Создание и отмена брони публикуют события в RabbitMQ.", "item": [
    item("Свободные столики", "GET", "/restaurants/{{restaurant_id}}/tables?date={{reservation_date}}&time={{reservation_time}}&guests=2",
         "Столики ресторана со статусом `available`/`reserved` на дату и время (catalog спрашивает занятость у reservation). `guests` отсекает столики меньшей вместимости.",
         status_test(200, ['const t = pm.response.json().find(x => x.status === "available");', 'pm.test("Есть свободный столик", () => pm.expect(t).to.exist);', 'if (t) pm.collectionVariables.set("table_id", t.table_id);']),
         auth=False, examples=[example("200 OK", "GET", f"/restaurants/2/tables?date={slot_date}&time={slot_time}&guests=2", s_tables, r_tables)]),
    item("Создать бронь", "POST", "/reservations",
         "Бронирует столик на слот. **Ответы:** `201`; `400` — валидация или гостей больше вместимости; `409` — слот уже занят; `503` — catalog недоступен (столик нельзя проверить).",
         status_test(201, ['pm.collectionVariables.set("reservation_id", pm.response.json().reservation_id);', 'pm.test("Статус confirmed", () => pm.expect(pm.response.json().status).to.eql("confirmed"));']),
         body={"table_id": "{{table_id}}", "reservation_date": "{{reservation_date}}", "reservation_time": "{{reservation_time}}", "guests_count": 2},
         prerequest=['// уникальный слот на каждый прогон, чтобы не получить 409',
                     'const d = new Date(Date.UTC(2027, 0, 1) + Math.floor(Math.random() * 365) * 86400000);',
                     'pm.collectionVariables.set("reservation_date", d.toISOString().slice(0, 10));',
                     'pm.collectionVariables.set("reservation_time", String(12 + Math.floor(Math.random() * 10)).padStart(2, "0") + ":30");'],
         examples=[example("201 Created", "POST", "/reservations", s_res, r_res, res_body), example("409 Слот занят", "POST", "/reservations", s_res409, r_res409, res_body)]),
    item("Бронь по id", "GET", "/reservations/{{reservation_id}}", "Бронь с данными ресторана. Чужая бронь — `403`.", status_test(200),
         examples=[example("200 OK", "GET", f"/reservations/{res_id}", s_getres, r_getres)]),
    item("Изменить бронь", "PUT", "/reservations/{{reservation_id}}", "Перенос на другую дату/время или изменение числа гостей (с повторной проверкой занятости).", status_test(200),
         body=upd_body, examples=[example("200 OK", "PUT", f"/reservations/{res_id}", s_updres, r_updres, upd_body)]),
    item("Мои брони", "GET", "/users/me/reservations", "История бронирований текущего пользователя с пагинацией.", status_test(200),
         examples=[example("200 OK", "GET", "/users/me/reservations", s_myres, r_myres)]),
]})
F.append({"name": "5. Отзывы", "item": [
    item("Оставить отзыв", "POST", "/reviews", "Один отзыв на ресторан от пользователя (`409` при повторе). Публикует событие `review.created`.",
         status_test(201, ['pm.collectionVariables.set("review_id", pm.response.json().review_id);']),
         body={"restaurant_id": "{{restaurant_id}}", "rating": 5, "comment": "Отличное место"},
         examples=[example("201 Created", "POST", "/reviews", s_rev, r_rev, rev_body)]),
    item("Отзывы ресторана", "GET", "/restaurants/{{restaurant_id}}/reviews", "Отзывы с именами авторов (review запрашивает их у auth-service).", status_test(200), auth=False,
         examples=[example("200 OK", "GET", "/restaurants/3/reviews?limit=2", s_revs, r_revs)]),
    item("Удалить отзыв", "DELETE", "/reviews/{{review_id}}", "Удаляет свой отзыв; чужой — `403`.", status_test(204)),
]})
F.append({"name": "6. Уведомления и отмена", "item": [
    item("Уведомления", "GET", "/notifications", "Уведомления, созданные notification-service из событий RabbitMQ (бронь, отмена, отзыв). Появляются асинхронно, обычно за доли секунды.",
         status_test(200, ['pm.test("Есть уведомление о брони", () => pm.expect(pm.response.json().data.map(n => n.type)).to.include("reservation.created"));']),
         prerequest=['setTimeout(() => {}, 1500); // даём событию дойти через брокер'],
         examples=[example("200 OK", "GET", "/notifications", s_notif, r_notif)]),
    item("Отменить бронь", "DELETE", "/reservations/{{reservation_id}}", "Отмена брони (`status=cancelled`), слот освобождается; публикуется `reservation.cancelled`.", status_test(204)),
]})

collection = {
    "info": {"_postman_id": str(uuid.uuid5(uuid.NAMESPACE_URL, "restaurant-booking-hw9")), "name": "Restaurant Booking API — ДЗ9",
             "description": "Документация публичного API микросервисного приложения «Restaurant Booking» (Якшин Артемий, БР1.1).\n\n"
                            "Все запросы идут через API Gateway (`/api/v1`). Папки упорядочены как пользовательский путь: регистрация → вход → профиль → каталог → столики → бронь → отзыв → уведомления → отмена. Поэтому коллекция одновременно служит документацией и сквозным тестом (Collection Runner или `newman`).\n\n"
                            "**Переменные:** `base_url` задаётся окружением (локально / Kubernetes); `token`, `restaurant_id`, `table_id`, `reservation_id` и др. заполняются тестами по ходу прогона.\n\n"
                            "**Авторизация:** Bearer `{{token}}` на уровне коллекции; публичные эндпоинты помечены `No Auth`.\n\n"
                            "**Запуск из CLI:** `npx newman run \"Restaurant Booking API.postman_collection.json\" -e <окружение>.json`",
             "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
    "auth": {"type": "bearer", "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}]},
    "item": F,
    "variable": [{"key": k, "value": v} for k, v in [("user_name", "Тестовый Пользователь"), ("user_password", "postman-pass-123"), ("user_email", ""), ("token", ""), ("cuisine_id", ""), ("restaurant_id", "1"), ("table_id", ""), ("reservation_id", ""), ("reservation_date", "2027-06-01"), ("reservation_time", "19:30"), ("review_id", "")]],
}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "Restaurant Booking API.postman_collection.json").write_text(json.dumps(collection, ensure_ascii=False, indent=2))
for name, url in [("Local (docker compose)", "http://127.0.0.1:3000/api/v1"), ("Kubernetes (k3d)", "http://SERVER_IP:8088/k8s/api/v1")]:
    env = {"id": str(uuid.uuid5(uuid.NAMESPACE_URL, name)), "name": f"Restaurant Booking — {name}",
           "values": [{"key": "base_url", "value": url, "type": "default", "enabled": True}], "_postman_variable_scope": "environment"}
    fn = "local" if name.startswith("Local") else "k8s"
    (OUT / f"{fn}.postman_environment.json").write_text(json.dumps(env, ensure_ascii=False, indent=2))
print("statuses:", s_reg, s_login, s_login_bad, s_me, s_me_401, s_list, s_404, s_tables, s_res, s_res409, s_updres, s_rev, s_notif, s_delres, s_delrev)
print("requests:", sum(len(f["item"]) for f in F), "examples:", sum(len(i["response"]) for f in F for i in f["item"]))
