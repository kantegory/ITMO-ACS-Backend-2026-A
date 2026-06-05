# ДЗ 3: тестирование RecipeHub API в Postman

Комплексный сценарий в Collection Runner: **регистрация**, затем **справочники**, **новый рецепт**, **список с пагинацией**, **поиск по строке**, **открыть рецепт из выдачи**, **комментарий к рецепту**. Все шаги в одной папке, по порядку сверху вниз.

## Что внутри

| Файл | Назначение |
|------|------------|
| `postman/RecipeHub-DZ3.postman_collection.json` | Коллекция с **Tests** на каждом шаге |
| `postman/RecipeHub-local.postman_environment.json` | Окружение с `baseUrl` (по умолчанию `http://localhost:8080`) |

## Требования

- Запущенный **RecipeHub** из соседней папки **`../labs/lab1`** (`make run`, `go run ./cmd/service` или Docker из того каталога), доступный по `baseUrl`.
- **Postman** (Desktop или Web).

## Как запустить сценарий

1. Через **Import** загрузите оба файла из папки `postman/` (коллекцию и environment).
2. В верхнем выпадающем списке окружений выберите **RecipeHub local**.
3. При необходимости измените в окружении **`baseUrl`** (порт, HTTPS и т.д.).
4. Откройте коллекцию **RecipeHub - ДЗ3, один сценарий**, затем **Run collection** (или по очереди **Send** сверху вниз).

Все запросы лежат в **одной папке** в порядке выполнения; переменные `accessToken`, `recipeId`, `recipeBrowseId`, уникальные `email` и `username` подставляются из скриптов **Pre-request** и **Tests**.

## Запуск из CLI (необязательно)

Если установлен [Newman](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/), в терминале перейдите в **эту** папку `homeworks/hw3` (она лежит рядом с `labs/lab1` в вашем каталоге студента) и выполните:

```bash
newman run postman/RecipeHub-DZ3.postman_collection.json -e postman/RecipeHub-local.postman_environment.json
```

## Отчёт по курсу

Оформление по [шаблону из README курса](https://docs.google.com/document/d/1aAUawxv6_5k_Na7bLqrfUFANodyl89uPHXY4IKXS8WE/edit?usp=sharing): опишите сценарий, приложите скрин Collection Runner / результата тестов.
