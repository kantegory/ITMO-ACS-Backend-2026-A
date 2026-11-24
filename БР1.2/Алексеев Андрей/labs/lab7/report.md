# Задача

Развернуть проект авторизации из ДЗ7 в облачном Kubernetes.

# Исходные данные

Облачная ВМ с Docker, k3d 5.8.3 и K3s v1.34.1+k3s1. Рабочее пространство — `itmo-auth`. Манифесты находятся в `infra/semester2/auth/kubernetes`.

# Ход работы

На VPS создан один сервер K3s в k3d. Kubernetes API привязан к loopback. Манифесты создают namespace itmo-auth, PostgreSQL StatefulSet и PVC, Deployment, два Service и HPA. PostgreSQL получает пароль из Secret. Auth-service использует профиль standalone-auth, проверку запуска и пробу готовности. Для учебного профиля выбран локальный StorageClass.

# Проверка результата

K3s v1.34.1+k3s1 на VPS, control-plane Ready. Авторизация и PostgreSQL в Running/Ready, PVC 1 GiB Bound на StorageClass local-path. После обновления Deployment сквозная проверка приняла 200, 409 и 401 в соответствующих сценариях. Данные из Docker Compose экспортированы pg_dump и восстановлены транзакцией psql. Caddy направляет запросы на nginx перед Kubernetes.

# Вывод

Контроллер Kubernetes управляет жизненным циклом приложения и томом базы. Публичный HTTPS-трафик ограничен маршрутами авторизации и документации.
