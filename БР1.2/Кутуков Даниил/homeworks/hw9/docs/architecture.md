# Архитектура

| Компонент | Ответственность | Интерфейс |
|---|---|---|
| Frontend | Ассистент и административная SPA | HTTPS, порт контейнера 3000 |
| Backend | Вход ADFS, права, чаты, файлы, ресурсы | FastAPI `/api/v1`, WebSocket `/api/v1/ws/connect` |
| Scheduler | Обработка статусов и повторная постановка зависших заданий | `GET /health`, RabbitMQ |
| ML Core | RAG, потоковый ответ, заголовок чата | FastAPI, `/health`, `/chat/send_message`, `/chat/chat_name` |
| ML Indexer | Обработка фоновых заданий документов | RabbitMQ, PostgreSQL ML |
| Embedding и LLM | Векторизация, reranking и генерация | Внутренние HTTP-сервисы |

При отправке сообщения backend проверяет права и передаёт запрос ML Core. ML Core выполняет поиск по Qdrant и передаёт контекст LLM. События генерации идут к backend по SSE, а к браузеру по WebSocket.

При изменении ресурса backend пишет задачу в `ml_core.resources.processing`. Индексатор получает метаданные и файлы через подписанные служебные запросы, складывает результаты в S3 и Qdrant, публикует статус в `backend.processing_job.processing`. Scheduler применяет статус к записи backend. Сериализация и повторная обработка зависят от сохранённых заданий и lease в БД ML.

Для backend и ML используются разные базы PostgreSQL. Redis обслуживает кэш и ограничение запросов backend. Ключи для S3, ADFS и внутреннего API принадлежат окружению.
