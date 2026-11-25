# ДЗ9 — документация Job Platform

Изменения ограничены этой папкой. Источники: `../hw6` (семь сервисов,
Compose и OpenAPI), `../hw3/job-platform-dz3.postman_collection.json`.
Контракты скопированы без изменения байтов; бизнес-логика не меняется.

## Сборка и просмотр

Из `homeworks/hw9` (Python 3.14, uv):

```bash
uv run --python 3.14 --with-requirements requirements.txt mkdocs build --strict
uv run --python 3.14 --with-requirements requirements.txt mkdocs serve --dev-addr 127.0.0.1:8001
```

Открыть `http://127.0.0.1:8001/`; результат сборки — `site/` (исключён из Git).
MkDocs закреплён на 1.6.1; совместимость проверяется реальным запуском, а не
только полем Requires-Python. Локальный Python 3.14.7 успешно импортирует MkDocs.
Сайт содержит восемь страниц, Swagger и скачиваемые контракты.

## Валидация контрактов

Команды ниже для Bash/Git Bash, из этой папки:

```bash
for spec in docs/contracts/openapi.yaml docs/contracts/services/*.yaml; do
  uv run --python 3.14 --with openapi-spec-validator==0.7.2 openapi-spec-validator "$spec" || exit 1
done
uv run --python 3.14 --with check-jsonschema==0.29.2 check-jsonschema \
  --schemafile https://schema.getpostman.com/json/collection/v2.1.0/collection.json \
  docs/contracts/job-platform-dz3.postman_collection.json
```

JSON Schema берётся с официального сайта Postman; для этой проверки нужен интернет.
Эти команды проверяют формат контрактов, а не выполнение запросов API.
Swagger использует закреплённый Swagger UI 5.17.14 с CDN; без сети остаются
страницы и YAML/JSON. Выполнение запросов и внешний валидатор в Swagger выключены.

## Границы

`site_url` — целевой адрес будущей публикации `/docs/`, не свидетельство деплоя.
Сервер, Kubernetes, исходные hw3/hw6 и существующие лабораторные не изменяются.
PDF, commit/push, запуск backend и E2E на сервере в эту работу не входят.
