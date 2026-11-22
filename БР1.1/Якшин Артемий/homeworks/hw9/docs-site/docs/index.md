# Restaurant Booking

Микросервисное веб-приложение для **бронирования столиков в ресторанах**: поиск ресторанов с фильтрами по кухне, городу и цене, карточка ресторана с меню, фото и отзывами, проверка свободных столиков на дату и время, бронирование, отзывы и уведомления.

Проект выполнен в рамках курса «Бэк-энд разработка» (ИТМО) и прошёл путь от монолита до облачного развёртывания:

| Этап | Что сделано | Где |
|---|---|---|
| ДЗ1–ДЗ2 | модель данных, OpenAPI-дизайн REST API | `homeworks/hw1`, `hw2` |
| ЛР1, ДЗ3 | монолит на Express + TypeORM, тесты Postman | `labs/lab1`, `homeworks/hw3` |
| ДЗ4, ЛР2 | декомпозиция на микросервисы (database-per-service) | `homeworks/hw4`, `labs/lab2` |
| ДЗ5 | асинхронные события через RabbitMQ | `homeworks/hw5` |
| ЛР3, ЛР4 | Docker, docker compose, развёртывание на сервере за nginx | `labs/lab3`, `labs/lab4` |
| ДЗ6 | CI/CD в GitHub Actions: сборка, деплой, откат | `homeworks/hw6` |
| ЛР5 | конфигурация сервера через Ansible | `labs/lab5` |
| ЛР6 | мониторинг: Grafana, Prometheus, Loki, Promtail | `labs/lab6` |
| ДЗ7, ЛР7, ДЗ8 | облачная инфраструктура на Kubernetes и CI/CD в кластер | `homeworks/hw7`, `labs/lab7`, `homeworks/hw8` |
| ДЗ10, ЛР8 | нагрузочное тестирование (k6), SLO, HPA | `homeworks/hw10`, `labs/lab8` |

## Быстрый старт

```bash
git clone https://github.com/cicada-pops/itmo-backend-sem2.git
cd "itmo-backend-sem2/БР1.1/Якшин Артемий/labs/lab2"
docker compose up --build
curl -s http://127.0.0.1:3000/health
open http://127.0.0.1:3000/api/docs/      # Swagger UI
```

Тестовые пользователи: `ivan@example.com / securepass123`, `maria@example.com / mariapass456`.

## Стек

| Слой | Технологии |
|---|---|
| Сервисы | Node.js 22, TypeScript, Express 4, TypeORM 0.3, `prom-client` |
| Данные | SQLite (локально, compose) / PostgreSQL 17 (Kubernetes) |
| Сообщения | RabbitMQ 3.13, topic-exchange `restaurant.events` |
| Вход | API Gateway (`http-proxy-middleware`), nginx, Traefik Ingress |
| Платформа | Docker, docker compose, Kubernetes (k3s v1.36 в k3d), kustomize |
| Автоматизация | GitHub Actions, GHCR, Ansible |
| Наблюдаемость | Prometheus, Grafana, Loki, Promtail, cAdvisor, node-exporter, blackbox-exporter, kube-state-metrics |
| Нагрузка | k6 |

## Разделы документации

- [Архитектура](architecture.md): сервисы, взаимодействие, данные.
- [API](api/index.md): публичный REST API (интерактивный Swagger), внутренние эндпоинты, события, коллекция Postman.
- [Запуск и развёртывание](deploy/local.md): локально, на сервере, в Kubernetes, CI/CD.
- [Эксплуатация](ops/monitoring.md): мониторинг, логи, нагрузка и SLO, инструкции на случай сбоев.
