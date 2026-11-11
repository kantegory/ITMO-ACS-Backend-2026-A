# Заметки

## Ручной запуск приложения

```
npm run start
```

## Prisma

```
# Миграции
npx prisma migrate dev --name <название_миграции>
npx prisma migrate dev

# Создание/обновление клиента Prisma
# (нужно вызывать после каждого изменения `prisma/schema.prisma`)
npx prisma generate

# Запуск Prisma Studio
npx prisma studio

# Сброс БД и повторное применение миграций
npx prisma migrate reset

# Быстрая синхронизация текущей схемы Prisma c БД (без миграции)
npx prisma db push
```
