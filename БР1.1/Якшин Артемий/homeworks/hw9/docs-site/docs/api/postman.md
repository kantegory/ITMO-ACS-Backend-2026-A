# Коллекция Postman

Коллекция **Restaurant Booking API — ДЗ9** одновременно документирует API и служит сквозным тестом:

- у каждого запроса есть описание (назначение, параметры, коды ответов), тесты и сохранённые примеры ответов, снятые с работающего стенда;
- папки упорядочены как путь пользователя: регистрация → вход → профиль → каталог → столики → бронь → отзыв → уведомления → отмена;
- тесты сохраняют `token`, `restaurant_id`, `table_id`, `reservation_id` в переменные коллекции, поэтому следующие запросы используют результаты предыдущих;
- авторизация Bearer `{{token}}` задана на уровне коллекции, публичные запросы помечены `No Auth`.

[Скачать коллекцию](restaurant-booking.postman_collection.json){ .md-button }

Файлы в репозитории: `homeworks/hw9/postman/`:

| Файл | Назначение |
|---|---|
| `Restaurant Booking API.postman_collection.json` | коллекция (Postman v2.1) |
| `local.postman_environment.json` | `base_url = http://127.0.0.1:3000/api/v1` |
| `k8s.postman_environment.json` | `base_url = http://SERVER_IP:8088/k8s/api/v1` (подставьте адрес сервера) |

## Запуск из командной строки

```bash
cd "БР1.1/Якшин Артемий/homeworks/hw9/postman"
npx newman run "Restaurant Booking API.postman_collection.json" -e local.postman_environment.json
# против кластера:
npx newman run "Restaurant Booking API.postman_collection.json" -e k8s.postman_environment.json \
    --env-var base_url=http://<SERVER_IP>:8088/k8s/api/v1
```
