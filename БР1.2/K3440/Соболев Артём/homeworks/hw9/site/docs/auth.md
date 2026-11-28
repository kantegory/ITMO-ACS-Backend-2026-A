# Авторизация

Для входа нужна учётная запись FitnessAPI. Отправьте `POST /api/v1/auth/login` с заголовком `Content-Type: application/json` и телом запроса:

```json
{
  "username": "demo",
  "password": "your-password"
}
```

Подставьте имя и пароль своей тестовой учётной записи. При успешном входе скопируйте поле `accessToken` из JSON ответа.

- В **Swagger UI** нажмите **Authorize** и вставьте значение `accessToken` в поле для Bearer-токена.
- В **Postman** откройте **Authorization**, выберите **Bearer Token** и вставьте значение в поле **Token**.
- При ручном запросе передайте заголовок `Authorization: Bearer <accessToken>`.

В документации и экспортируемых коллекциях оставляйте только примеры и пустые переменные для секретов.

## Проверка входа через свой профиль

1. В Swagger UI выберите `user-service` и выполните `POST /auth/login`.
2. Скопируйте `accessToken` и вставьте его в поле `bearerAuth` через **Authorize**.
3. Выполните `GET /profiles/me`. Через шлюз полный путь этого запроса - `/api/v1/profiles/me`.
4. При успешном запросе API вернёт данные профиля текущей учётной записи.

Тот же запрос с заголовком авторизации:

```bash
curl -i "https://fitnessapi.example/api/v1/profiles/me" -H "Authorization: Bearer <accessToken>"
```

Подставьте адрес своего шлюза и значение токена без угловых скобок.

## Обновление токена и выход

- `accessToken` отправляется в заголовке `Authorization` при обращении к защищённым маршрутам.
- `refreshToken` используется в `POST /api/v1/auth/refresh` для получения новых токенов. Его можно передать полем `refreshToken` в JSON. Если клиент сохранил cookie, которую выдал сервис, он может передать токен обновления через эту cookie.
- Для завершения текущего сеанса используйте `POST /api/v1/auth/logout`. При успешном запросе сервис вернёт `204 No Content`.
