# notification-service

Получает события из RabbitMQ и отправляет уведомления.


**Порт:** 3006 | **БД:** нет

Сервис не имеет HTTP API и базы данных. Его единственная задача — **слушать события** из RabbitMQ и имитировать отправку уведомлений (логирование в консоль).

## Подписки

Сервис создаёт одну очередь `notification-service` и подписывается на следующие события:

| Exchange | Routing Key | Действие |
|----------|-------------|----------|
| `auth` | `user.registered` | Лог приветственного письма |
| `reservations` | `reservation.created` | Лог подтверждения бронирования |
| `reservations` | `reservation.cancelled` | Лог отмены бронирования |
| `restaurants` | `restaurant.status_changed` | Лог изменения статуса ресторана |

Пример вывода в консоль:
```
[NOTIFICATION] Welcome email → user #1 (ivan@example.com): Hello, Иван!
[NOTIFICATION] Reservation confirmed → user #2: reservation #10 at restaurant #1 from 2026-06-01T18:00:00...
[NOTIFICATION] Restaurant status update → restaurant #1 is now "Verified"
```

В реальной системе здесь было бы обращение к email/SMS/push-провайдеру.



