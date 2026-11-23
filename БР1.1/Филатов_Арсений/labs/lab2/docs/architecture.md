# Архитектура

```text
клиент → gateway → auth | catalog | jobseeker | employer | application
                              ↓
                         PostgreSQL (lab2_*)
application ──application.created──→ RabbitMQ ──→ employer
```

- database-per-service: отдельные БД `lab2_auth`, `lab2_catalog`, `lab2_jobseeker`, `lab2_employer`, `lab2_application`;
- межсервисные HTTP-вызовы с заголовком `x-internal-secret`;
- после создания отклика событие в exchange `job.events`.

Оркестрация: Docker Compose (ЛР3–6) или Kubernetes/kind (ЛР7), манифесты в `k8s/`.
