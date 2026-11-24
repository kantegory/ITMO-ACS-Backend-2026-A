# 04. Сетевая модель: типы Service, Ingress, сетевые политики

## Четыре способа пропустить трафик

Тип `spec.type` у Service определяет, откуда в сервис можно попасть:

**ClusterIP** (тип по умолчанию) — адрес только изнутри кластера. Обычный выбор для всех межсервисных вызовов: gateway ходит в `orders:80`, никто снаружи эти сервисы не видит.

**NodePort** — сервис торчит портом на каждой ноде кластера. Полезен только для отладки и как строительный блок для балансировщиков.

**LoadBalancer** — провайдер облака заводит настоящий балансировщик. Здесь работает знакомая по Yandex Cloud механика: при объявлении такого Service контроллер провайдера создаёт Network Load Balancer и target group с нодами кластера; менять или удалять эти ресурсы руками из консоли не следует — сломается синхронизация с кластером.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: orders-lb
spec:
  type: LoadBalancer
  selector:
    app: orders
  ports:
    - port: 80
      targetPort: 3000
```

Аннотациями можно попросить внутренний балансировщик (в Yandex Cloud — `yandex.cloud/load-balancer-type: "internal"`, при необходимости с `yandex.cloud/subnet-id`) или зарезервированный статический адрес в `loadBalancerIP`.

**ExternalName** — DNS-алиас на внешнее имя.

Если пропускать все сервисы через LoadBalancer, через месяц обнаружите счёт за балансировщики и десяток публичных IP. Практика обратная: наружу — один вход на всё приложение, остальное ClusterIP, для этого внутри кластера есть Ingress.

## Ingress

Ingress — правила маршрутизации HTTP на уровне пути и хоста: `api.example.com/orders → сервис orders`, `api.example.com/auth → сервис auth`. Один балансировщик, один сертификат, много сервисов.

Сам по себе объект Ingress — только описание: его исполняет ingress-контроллер, который надо установить в кластер. Два актуальных пути:

**nginx-ingress** (helm chart ingress-nginx) — классика: reverse proxy pod'ами внутри кластера, TLS на нём, массовая документация, с nginx вы уже знакомы.

**Gwin** (Yandex Cloud) — нативный контроллер, проецирующий Ingress-ресурсы в Application Load Balancer облака: TLS-терминация и сертификат на стороне провайдера, меньше moving parts внутри кластера. Появился позже и молодее, но для облака Yandex — это направление.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /auth
            pathType: Prefix
            backend:
              service:
                name: auth
                port:
                  number: 80
          - path: /orders
            pathType: Prefix
            backend:
              service:
                name: orders
                port:
                  number: 80
```

`ingressClassName` связывает правила с контроллером; если в кластере два контроллера (например, nginx и Gwin), каждый исполняет только свои классы.

Для TLS обычно добавляют также cert-manager: он выпускает сертификаты Let's Encrypt (через HTTP-challenge или DNS-записью) и складывает в Secret `app-tls` сам, включая продление. Без него сертификат можно получить из Certificate Manager Yandex Cloud и положить в Secret вручную — для учебного проекта допустимо, в продакшене такое продление превратится в регулярную ручную работу.

## NetworkPolicy

По умолчанию в кластере любой pod говорит с любым pod'ом. NetworkPolicy — файервол уровня подов: разрешает трафик по селекторам.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: orders-allow-gateway-only
spec:
  podSelector:
    matchLabels:
      app: orders
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: gateway
      ports:
        - protocol: TCP
          port: 3000
```

Обратите внимание на логику: как только к pod'у применена политика с `Ingress`, всё, что в политике не перечислено, запрещается. Отсюда частая жалоба «после применения NetworkPolicy сервис перестал отвечать ingress'у» — нужно явно разрешить трафик от контроллера.

## Health-эндпоинты в кластерной связке

У вас уже есть `/health` и, скорее всего, `/metrics` (prom-client). В кластере к ним добавляется третий, отдельный эндпоинт `/healthz` или `/live` — liveness-проба обязана отвечать «жив» даже при недоступной БД: процесс-то живой. Разделяйте readiness (зависимости) и liveness (процесс) физически разными путями, иначе при отказе базы кластер перезапустит все pod'ы сервиса.
