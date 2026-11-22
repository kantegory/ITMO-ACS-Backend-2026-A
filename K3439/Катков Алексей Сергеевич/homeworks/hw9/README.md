# ДЗ9. Документация

В каталоге `docs` находятся OpenAPI 3.0, коллекция Postman и страницы MkDocs. Сборка и запуск из каталога `hw9`:

```bash
python -m pip install -r requirements.txt
python -m mkdocs build --strict
python -m mkdocs serve
```

Swagger UI открывается на странице «Swagger». Он использует локальную спецификацию и загружает скрипт из jsDelivr.
