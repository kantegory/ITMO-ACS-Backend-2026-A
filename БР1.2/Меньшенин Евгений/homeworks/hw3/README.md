# ДЗ3 — Тестирование API в Postman

В папке находится готовая Postman-коллекция с одним комплексным сценарием основного бизнес-процесса:

`register -> login -> profile -> create restaurant -> create table -> list/filter restaurants -> restaurant details -> list tables -> create booking -> get booking -> get all bookings`

## Файл коллекции

- `restaurant-api-main-flow.postman_collection.json`

## Что проверяют тесты

- корректные HTTP-статусы на каждом шаге;
- наличие обязательных полей в ответах;
- сохранение и использование `accessToken`, `userId`, `restaurantId`, `tableId`, `bookingId`;
- наличие созданного ресторана в отфильтрованном списке;
- наличие созданного стола в списке доступных столов;
- наличие созданного бронирования в ответе по ID и в общем списке бронирований пользователя.
