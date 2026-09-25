# Домашняя работа №6: Настройка CI/CD для автоматического развёртывания бэкенд-приложения

Данная работа содержит конфигурацию конвейера автоматического тестирования и развёртывания (CI/CD) на базе GitHub Actions для микросервисного бэкенд-приложения бронирования столиков.

## 1. Структура Pipeline (`deploy.yml`)

Конвейер состоит из двух стадий:
1. **lint-and-test**:
   - Запускается на любой push и pull request в ветку `main`.
   - Разворачивает Node.js 20 окружение с кешированием `npm`.
   - Устанавливает зависимости и проверяет компиляцию TypeScript (`npm run build`).
2. **deploy**:
   - Запускается только при успешном завершении стадии `lint-and-test` и только для коммитов в ветку `main`.
   - Подключается по защищённому протоколу SSH к целевому удалённому Linux-серверу (`appleboy/ssh-action@v1.0.3`).
   - Выполняет обновление репозитория (`git pull origin main`), пересборку и запуск Docker-контейнеров (`docker compose up -d --build`), а также перезагрузку обратного прокси Nginx (`sudo systemctl reload nginx`).

## 2. Необходимые секреты GitHub Actions (Repository Secrets)

Для успешного выполнения стадии деплоя в настройках репозитория GitHub (**Settings -> Secrets and variables -> Actions -> New repository secret**) необходимо задать следующие переменные:

| Название секрета | Описание | Пример значения |
| :--- | :--- | :--- |
| `SERVER_HOST` | Публичный IP-адрес или доменное имя целевого VPS/VDS | `84.201.156.42` / `api.booking.example.com` |
| `SERVER_USER` | Имя пользователя Linux с правами выполнения docker/systemctl | `deployer` / `ubuntu` |
| `SERVER_SSH_KEY` | Приватный SSH-ключ (OpenSSH/ED25519/RSA) для беспарольного входа | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |

## 3. Настройка удалённого сервера перед запуском CI/CD

На целевом сервере должны быть предварительно выполнены следующие действия (см. также ЛР4):
1. Установлены Docker, Docker Compose Plugin и Nginx.
2. Пользователь добавлен в группу `docker`:
   ```bash
   sudo usermod -aG docker deployer
   ```
3. Разрешена перезагрузка Nginx без пароля через `sudoers`:
   ```bash
   echo "deployer ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/deployer-nginx
   ```
4. Склонирован репозиторий в каталог `/opt/restaurant-booking` и установлены права владельца:
   ```bash
   sudo mkdir -p /opt/restaurant-booking
   sudo chown -R deployer:deployer /opt/restaurant-booking
   git clone https://github.com/kantegory/ITMO-ACS-Backend-2026-A.git /opt/restaurant-booking
   ```
5. Публичный SSH-ключ добавлен в `~deployer/.ssh/authorized_keys`.
