# Запуск и проверка

Запустите стенд из ЛР4 или ЛР7. Базовый URL Compose - `http://127.0.0.1:18000`, URL k3s Ingress - `http://127.0.0.1:18081`.

```bash
curl -fsS http://127.0.0.1:18000/ready
curl -fsS 'http://127.0.0.1:18000/api/recipes/?difficulty=easy'
```

Импортируйте [коллекцию](recipes.postman_collection.json) в Postman и укажите `baseUrl`. Запустите цепочку целиком, чтобы получить токен, создать рецепт и комментарий, проверить ответы и удалить тестовые записи. Для командной строки используйте Newman.

```bash
npx newman run docs/recipes.postman_collection.json \
  --env-var baseUrl=http://127.0.0.1:18000
```

Для защищённых запросов передавайте `Authorization: Bearer <token>`. Если сервис отклоняет запрос по правилу предметной области, проверьте поле `message` даже при HTTP 200. Невалидный токен даёт HTTP 401. Ошибка связи Gateway с сервисом даёт HTTP 502.
