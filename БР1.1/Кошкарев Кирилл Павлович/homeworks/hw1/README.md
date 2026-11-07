# ДЗ1 — проектирование базы данных

Вариант 5: сервис обмена рецептами и кулинарных блогов «Lecter's Recipes».

| Файл | Содержимое |
|---|---|
| `ДЗ1_Кошкарев Кирилл Павлович_БР1.1.pdf` | отчёт по шаблону |
| `erd.png` | ER-диаграмма: 14 таблиц, связи и мощности |
| `schema.sql` | DDL для PostgreSQL: типы, таблицы, ограничения, индексы |

Проверка DDL:

```bash
createdb erd_check && psql -d erd_check -v ON_ERROR_STOP=1 -f schema.sql && dropdb erd_check
```
