# ДЗ3: Postman-тестирование API

Готовый сценарий лежит в файлах:

- `Restaurant_Booking_HW3.postman_collection.json` - коллекция Postman с запросами и тестами.
- `Restaurant_Booking_HW3.postman_environment.json` - окружение с `baseUrl` и `baseurl`.

## Как запустить

1. Запусти API из лабораторной:

```sh
cd ../../Labs/lab1
npm install
npm run dev
```

2. В Postman импортируй два файла из `homeworks/hw3`.
3. Выбери окружение `Restaurant Booking HW3 Environment`. Если Postman пишет `DNSLookup: EBADNAME {{baseurl}}`, значит переменная не подставилась: проверь, что окружение выбрано, или переимпортируй обновлённые JSON-файлы.
4. Запусти коллекцию через `Runner`.

Сценарий: проверка API -> регистрация -> вход -> профиль -> список ресторанов -> фильтрация -> случайный ресторан -> столики -> бронирование -> список бронирований -> отзыв -> отмена бронирования.
