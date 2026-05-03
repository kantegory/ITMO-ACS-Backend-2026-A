# Boilerplate и источники каркаса (ЛР 1, RecipeHub на Go)

В методичке курса упоминается Node-шаблон **express-typeorm-boilerplate** как пример отправной точки. Здесь стек **Go**, отдельный «склонированный» репозиторий-скелет под весь проект **не использовался** — сервис собран вручную, но **HTTP-слой** опирается на тот же официальный паттерн, что и эталонный пример **chi** (см. ниже).

## 1. HTTP-слой: пример go-chi `rest`

**Boilerplate** в смысле «как строится роутер» зафиксирован в коде приложения **`internal/httpserver/router.go`**:

- **`chi.NewRouter()`**, вложенные **`r.Route(...)`**, middleware из **`github.com/go-chi/chi/v5/middleware`** (например `RequestID`).
- По смыслу совпадает с официальным примером [**`go-chi/chi` → `_examples/rest`**](https://github.com/go-chi/chi/tree/v5.2.1/_examples/rest) под тегом **v5.2.1** (эта версия **`chi/v5`** указана в **`go.mod`**).
- Собственная логика RecipeHub (JWT, handlers/DTO и т.д.) реализована поверх этого каркаса; **`chi/render`** из примера **не используется**.

## 2. Слои приложения по `structure.md` курса

Раскладка `cmd/`, `internal/api`, `internal/domain`, `internal/usecase`, `internal/infrastructure`, каталог **`migrations/`** — по **`structure.md`** в корне репозитория дисциплины (`ITMO-ACS-Backend-2026-A/structure.md`).

## 3. Go layout и данные

- Раскладка модуля: [Organizing a Go module](https://go.dev/doc/modules/layout); при желании — [project-layout](https://github.com/golang-standards/project-layout).

- Данные: **[PostgreSQL](https://www.postgresql.org/)** через **[GORM](https://gorm.io/)** и **`gorm.io/driver/postgres`**. Стартовая схема — **`AutoMigrate`** (`internal/infrastructure/database/open.go`); **`migrations/`** с `.gitkeep` — под явные SQL-миграции.

## 4. Формулировка для отчёта

> Каркас HTTP построен по паттерну официального примера **`chi/_examples/rest`** (ссылка на репозиторий `go-chi/chi`, версия **`v5.2.1`** совпадает с зависимостью в **`go.mod`**), реализация — в **`internal/httpserver/router.go`**. Остальное приложение следует **`structure.md`** курса и документации **Go / GORM**. Node-шаблон методички не подключался из-за другого языка и стека.
