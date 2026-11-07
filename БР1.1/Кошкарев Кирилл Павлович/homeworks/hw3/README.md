# ДЗ3 — тестирование API средствами Postman

Комплексный сценарий основного процесса: регистрация → вход → личный кабинет →
список рецептов → фильтрация → просмотр рецепта → лайк и сохранение → комментарий →
подписка на автора → лента подписок → собственная публикация.

| Файл | Содержимое |
|---|---|
| `ДЗ3_Кошкарев Кирилл Павлович_БР1.1.pdf` | отчёт |
| `recipe-api.postman_collection.json` | коллекция: 28 запросов, 75 тестов |
| `local.postman_environment.json` | окружение с переменной `baseUrl` |
| `newman-run.txt`, `newman-report.json` | протокол прогона |

Запуск (приложение ЛР1 должно быть поднято):

```bash
newman run recipe-api.postman_collection.json -e local.postman_environment.json
```

Коллекция проходит и на микросервисной версии — достаточно указать адрес шлюза:

```bash
newman run recipe-api.postman_collection.json --env-var baseUrl=http://localhost:3000
```
