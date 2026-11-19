# ЛР4. Развёртывание приложения

На выделенной Ubuntu 24.04 установите Docker Engine с Compose plugin по официальной инструкции Docker, а также пакеты `nginx`, `openssl`, `git` и `curl`. Для публичного стенда настройте HTTPS и ограничьте доступ к учебному API адресами участников. На тестовом стенде используйте вымышленные данные.

Скопируйте каталог `lab4` на ВМ. Из каталога `lab4` выполните:

```bash
bash app/init-env.sh
docker compose --project-directory app up --build --wait
sudo install -m 0644 nginx/recipes.conf /etc/nginx/sites-available/recipes
sudo ln -sfn /etc/nginx/sites-available/recipes /etc/nginx/sites-enabled/recipes
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
curl -fsS http://127.0.0.1/ready
```

Для проверки извне запросите `http://<адрес-ВМ>/ready` на отдельной машине из разрешённой сети. При настроенном TLS используйте HTTPS. Проверка БД и маршрутов из корня приложения описана в `app/smoke.mjs`.
