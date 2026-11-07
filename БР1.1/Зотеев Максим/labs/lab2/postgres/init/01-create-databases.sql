-- Создаёт по одной БД на сервис в общем контейнере PostgreSQL.
-- Скрипт исполняется через docker-entrypoint-initdb.d при первом старте.

CREATE DATABASE identity;
CREATE DATABASE property;
CREATE DATABASE rental;
CREATE DATABASE messaging;
