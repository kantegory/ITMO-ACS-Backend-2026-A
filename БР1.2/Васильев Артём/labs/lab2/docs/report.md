# Отчет по ЛР2

## Цель

Разделить монолитное Express + TypeORM приложение Job Platform на микросервисы и настроить корректное межсервисное HTTP-взаимодействие.

## Актуальные правки

По замечаниям преподавателя одиночные internal endpoints для получения сущности по id заменены на batch endpoints. Это уменьшает количество HTTP-запросов при проверках и позволяет получать несколько сущностей одним вызовом.

## Batch internal API

Формат запроса:

```json
{
  "ids": ["uuid-1", "uuid-2"]
}
```

Формат ответа:

```json
{
  "items": [],
  "missingIds": ["uuid-2"]
}
```

Реализованы endpoints:

- `POST /internal/v1/users/batch`;
- `POST /internal/v1/companies/batch`;
- `POST /internal/v1/employer-profiles/batch`;
- `POST /internal/v1/vacancies/batch`;
- `POST /internal/v1/resumes/batch`;
- `POST /internal/v1/applications/batch`.

## Удаленные internal endpoints

Из `dictionary-service` удалены internal endpoints справочников. Справочники используются через публичные read endpoints:

- `GET /industries/:industry_id`;
- `GET /experience-levels/:experience_level_id`.

Из `application-service` удален internal endpoint количества откликов на вакансию, потому что он не используется обязательной бизнес-логикой.

## Вывод

Internal API стал единообразным: сущности, которые реально нужны другим сервисам, запрашиваются batch-запросами. Справочники остались публичными read API, а лишняя связь через internal count endpoint удалена.
