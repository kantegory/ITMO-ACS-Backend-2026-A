#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 3cm, right: 1.5cm),
)

#set text(
  font: "Times New Roman",
  size: 14pt,
  lang: "ru",
)

#set par(justify: true)

#show heading: it => {
  set text(size: 14pt)
  it
  v(0.5cm)
}

#align(center)[
  #text(weight: "bold")[
    САНКТ-ПЕТЕРБУРГСКИЙ НАЦИОНАЛЬНЫЙ\
    ИССЛЕДОВАТЕЛЬСКИЙ УНИВЕРСИТЕТ ИТМО
  ]
]

#v(4cm)

#align(center)[
  #text(size: 18pt)[*Дисциплина:* Бэк-энд разработка]
  #v(0.5cm)
  #text(size: 18pt)[Отчет]
  #v(0.5cm)
  #text(size: 18pt)[Домашняя работа №5]
]

#v(3cm)

#align(right)[
  Выполнил:
  #v(0.3cm)
  Малахов Алексей
  #v(0.3cm)
  БР1.2
  #v(0.8cm)
  Проверил:\
  Добряков Д. И.
]

#v(1fr)

#align(center)[
  Санкт-Петербург

  2026 г.
]

#pagebreak()

= Задача

1. Подключить и настроить RabbitMQ.
2. Реализовать межсервисное взаимодействие посредством RabbitMQ.

= Ход работы

Реализована цепочка асинхронного взаимодействия трёх микросервисов через две очереди RabbitMQ:

#align(center)[
  `rental-service` → [`rental_events`] → `property-service` → [`property_events`] → `review-service`
]

RabbitMQ добавлен в `docker-compose.yml` (образ `rabbitmq:3-management`, AMQP-порт 5672, веб-интерфейс 15672). Во все три сервиса добавлена зависимость `amqplib` и переменная `RABBITMQ_URL`. Все очереди объявлены с флагом `durable: true`, сообщения — с `persistent: true`. При потере соединения сервисы переподключаются автоматически через 5 секунд.

*Шаг 1 — Rental Service (publisher).* При смене статуса аренды публикует событие в очередь `rental_events`:

```json
{ "event": "rental.status_changed", "rental_id": 42,
  "property_id": 1, "property_status": "rented" }
```

`property_status` принимает значения `"rented"` (активация) или `"active"` (завершение / отмена).

*Шаг 2 — Property Service (consumer + publisher).* Подписывается на `rental_events`, обновляет статус объекта в своей БД, затем публикует событие в очередь `property_events`:

```json
{ "event": "property.status_changed", "property_id": 1,
  "property_status": "rented", "rental_id": 42, "owner_id": 5 }
```

*Шаг 3 — Review Service (consumer).* Подписывается на `property_events`. Когда объект переходит обратно в статус `"active"` (аренда завершена), фиксирует, что отзыв об арендодателе теперь доступен для написания.

#set text(size: 10pt)
#table(
  columns: (1fr, 1fr),
  align: (left, left),
  table.header([*Файл*], [*Изменение*]),
  [`rental-service/src/messaging/publisher.ts`], [Publisher: публикация в `rental_events`],
  [`rental-service/src/controllers/rental.controller.ts`], [HTTP-вызов заменён на `publishRentalStatusChanged()`],
  [`property-service/src/messaging/consumer.ts`], [Consumer `rental_events` + вызов publisher],
  [`property-service/src/messaging/publisher.ts`], [Publisher: публикация в `property_events`],
  [`review-service/src/messaging/consumer.ts`], [Новый: consumer `property_events`],
  [`docker-compose.yml`], [`rabbitmq:3-management`, `RABBITMQ_URL` в трёх сервисах],
)
#set text(size: 14pt)

= Вывод

Реализована цепочка асинхронного межсервисного взаимодействия через RabbitMQ по аналогии с паттерном Producer–Consumer. Rental Service публикует событие смены статуса аренды, Property Service обрабатывает его и передаёт дальше, Review Service получает уведомление о готовности к написанию отзыва. Синхронная зависимость между сервисами устранена: недоступность любого получателя не блокирует работу отправителя.
