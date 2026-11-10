# Генераторы дашбордов Grafana

Дашборды описаны кодом: скрипт печатает JSON, provisioning Grafana читает его из `../dashboards/`.

```bash
python3 rb_overview.py ../dashboards/rb-overview.json     # ЛР6: ВМ, healthcheck, логи
python3 rb_k8s_load.py ../dashboards/rb-k8s-load.json     # ЛР8: Kubernetes, HPA, нагрузка
```
