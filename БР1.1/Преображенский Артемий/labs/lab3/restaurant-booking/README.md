# restaurant-booking

Основа - архивный код, использованный в ЛР3: три сервиса Auth/Catalog/Booking, три PostgreSQL и RabbitMQ. Сохранены исходные каталоги, DTO, маршруты, миграции и Go-зависимости.

Дополнения к существующим `main.go`: `/ready` с проверкой БД, Swagger под `/docs/<service>/` и заголовок `X-App-Revision`. В Auth исправлены закрытие nil-pool и проверка JWT duration; в существующем Booking `postgres.go` создание брони защищено транзакцией от пересечений. Новых Go-файлов и пакетов нет.

## Локальный запуск

Скопировать `.env.example` в `.env` и заменить пароли. `make up` использует `deploy/docker-compose.dev.yml`.

Рабочий локальный сценарий ЛР3 - `make up`: dev Compose подключает SQL-схемы к первому запуску PostgreSQL через `docker-entrypoint-initdb.d`, приложения запускаются через `Dockerfile.dev`. В стеке три API, три PostgreSQL и RabbitMQ. Данные сохраняются в именованных volumes; обычная остановка выполняется без `-v`.

## Postman

Импортировать [restaurant-booking.postman_collection.json](restaurant-booking.postman_collection.json). В коллекции 35 запросов: все 27 бизнес-маршрутов, /ready и OpenAPI трех сервисов, повторное чтение измененного/удаленного отзыва. Запускать Runner сверху вниз с задержкой 100 мс: token и ID сохраняются автоматически, Cleanup удаляет созданные отзыв, блюдо, столик и ресторан; тестовый пользователь и история отмененной брони сохраняются. Реальные токены и ID в файл не записаны.

По умолчанию используются 127.0.0.1 и порты 8081/8082/8083; адреса задаются authBaseUrl, catalogBaseUrl, bookingBaseUrl.
