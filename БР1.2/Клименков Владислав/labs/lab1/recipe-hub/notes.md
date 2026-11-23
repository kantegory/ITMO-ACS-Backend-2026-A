# Заметки

## Основные команды

```
# Запуск БД
docker-compose up -d

# Запуск сервера
npm run dev

# Остановка БД
docker-compose down
```

## Запуск сервера

```
npm run dev
```

## Docker

```
# Список запущенных сервисов
docker-compose ps

# Запуск в фоновом режиме 
docker-compose up -d

# Остановка и удаление контейнеров (тома сохраняются)
docker-compose down

# Остановка контейнера
docker-compose stop

# Запуск остановленного контейнера
docker-compose start

# Остановить и удалить контейнер вместе с томами
docker-compose down -v

# Посмотреть существующие тома
docker volume ls

# Удалить неиспользуемые тома
docker volume prune

# Удалить все тома
docker volume rm $(docker volume ls -q)
```

## Prisma

```
# Миграции
npx prisma migrate dev --name <название_миграции>
npx prisma migrate dev

# Создание клиента Prisma
# (нужно вызывать после каждого изменения `prisma/schema.prisma`)
npx prisma generate

# Запуск Prisma Studio
npx prisma studio
```
