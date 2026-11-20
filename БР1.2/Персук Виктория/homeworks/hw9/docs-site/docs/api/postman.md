# Коллекция Postman

Коллекция содержит 40 запросов, разложенных по девяти папкам в порядке сквозного сценария: регистрация, создание ресторана, столики, бронирования, меню, отзывы и проверки прав доступа. У каждого запроса есть описание и тесты, а у папок указано, какие переменные они заполняют.

## Файлы

| Файл | Назначение |
|------|------------|
| [`restaurant-booking.postman_collection.json`](restaurant-booking.postman_collection.json) | Коллекция запросов с тестами |
| [`local.postman_environment.json`](local.postman_environment.json) | Окружение для локального запуска через Docker Compose |
| [`eks.postman_environment.json`](eks.postman_environment.json) | Окружение для приложения в Amazon EKS |

## Переменные

Адрес API задаётся переменной окружения `base_url`, поэтому одна и та же коллекция работает и с локальным приложением, и с облачным. Остальные переменные хранятся в коллекции и заполняются тестами по ходу выполнения.

| Переменная | Где задаётся | Значение |
|------------|--------------|----------|
| `base_url` | Окружение | Адрес api-gateway с префиксом `/api/v1` |
| `test_email` | Pre-request скрипт регистрации | Уникальный email вида `testuser_<время>@example.com` |
| `token`, `admin_token` | Тесты запросов входа | JWT пользователя и администратора |
| `restaurant_id`, `table_id`, `reservation_id`, `menu_id`, `menu_item_id`, `review_id`, `cuisine_id` | Тесты запросов создания | Идентификаторы созданных объектов |

Пример теста из запроса входа. Он проверяет код ответа, наличие токена и сохраняет токен для следующих запросов.

```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('Has accessToken', () => {
  const json = pm.response.json();
  pm.expect(json).to.have.property('accessToken');
  pm.collectionVariables.set('token', json.accessToken);
});
```

## Запуск в Postman

1. Нажмите **Import** и выберите файл коллекции и оба файла окружений.
2. В правом верхнем углу выберите окружение **Local**.
3. Откройте коллекцию, нажмите **Run** и запустите все папки по порядку.

Описание коллекции, папок и запросов Postman показывает на вкладке **Documentation**. Эту документацию можно опубликовать по ссылке через **Publish**.

## Запуск из командной строки (Newman)

Newman выполняет коллекцию без графического интерфейса, поэтому его можно использовать в CI. Отчёт сохраняется в HTML.

```bash
npx newman run restaurant-booking.postman_collection.json \
  -e local.postman_environment.json \
  -r cli,htmlextra --reporter-htmlextra-export newman-report.html
```

Для проверки приложения в облаке достаточно подставить окружение EKS с адресом балансировщика.
