# Заметки

## Docker

```
# Список запущенных сервисов
docker compose ps

# Запуск в фоновом режиме 
docker compose up -d

# Запуск с пересборкой образов
docker compose up -d --build

# Остановка и удаление контейнеров (тома сохраняются)
docker compose down

# Остановить и удалить контейнер вместе с томами
docker compose down -v

# Посмотреть существующие тома
docker volume ls

# Удалить неиспользуемые тома
docker volume prune

# Удалить неиспользуемые сети
docker network prune -f

# Удалить все тома
docker volume rm $(docker volume ls -q)

# Посмотреть все логи
docker compose logs

# Посмотреть логи конкретного сервиса
docker compose logs <название_сервиса>
docker compose logs user-db
docker compose logs user-service
docker compose logs api-gateway
docker compose logs prisma-studio-user
docker compose logs prisma-studio-recipe
```

# Prisma Studio

```
# Запуск Docker Compose с Prisma Studio
docker compose --profile prisma-studio up -d --build

# Остановка
docker compose --profile prisma-studio down
```

```
# prisma-studio-user
http://localhost:5555

# prisma-studio-recipe
http://localhost:5556
```
