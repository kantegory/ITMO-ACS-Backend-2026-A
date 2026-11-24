# Поиск работы · второй семестр

Инфраструктура для десяти сервисов из ЛР2–3. [Условия курса](../../README.md) и [результаты проверок](../../БР1.2/Алексеев%20Андрей/semester2-verification.md).

| Работа | Материалы |
| --- | --- |
| ЛР4 · Ручное развёртывание | [Отчёт](../../БР1.2/Алексеев%20Андрей/labs/lab4/report.md), [Compose](compose.yml), [nginx](nginx.conf) |
| ДЗ6 · Деплой на ВМ | [Отчёт](../../БР1.2/Алексеев%20Андрей/homeworks/hw6/report.md), [GitHub Actions](../../.github/workflows/semester2.yml) |
| ЛР5 · Ansible | [Отчёт](../../БР1.2/Алексеев%20Андрей/labs/lab5/report.md), [плейбук](ansible/site.yml) |
| ЛР6 · Наблюдаемость | [Отчёт](../../БР1.2/Алексеев%20Андрей/labs/lab6/report.md), [мониторинг](monitoring) |
| ДЗ7 · Облачный дизайн | [Отчёт и схема](../../БР1.2/Алексеев%20Андрей/homeworks/hw7) |
| ЛР7 · Kubernetes | [Отчёт](../../БР1.2/Алексеев%20Андрей/labs/lab7/report.md), [манифесты](kubernetes) |
| ДЗ8 · Облачный CI/CD | [Отчёт](../../БР1.2/Алексеев%20Андрей/homeworks/hw8/report.md), [скрипт доставки](../../scripts/semester2/deploy-kubernetes.sh) |
| ДЗ9 · Документация | [Отчёт](../../БР1.2/Алексеев%20Андрей/homeworks/hw9/report.md), [MkDocs](docs/index.md) |
| ДЗ10 · Профили нагрузки | [Отчёт](../../БР1.2/Алексеев%20Андрей/homeworks/hw10/report.md), [k6](load) |
| ЛР8 · Испытания и HPA | [Отчёт](../../БР1.2/Алексеев%20Андрей/labs/lab8/report.md), [методика](docs/performance.md) |

Инструкции по запуску и доступу собраны в [руководстве эксплуатации](docs/operations.md). PDF лежат рядом с исходниками отчётов и используют имена из правил сдачи.

```bash
python -m venv .venv
.venv/bin/pip install -r infra/semester2/requirements.txt
.venv/bin/mkdocs serve -f infra/semester2/mkdocs.yml
# Для генерации PDF дополнительно нужны pandoc и weasyprint:
.venv/bin/pip install weasyprint==66.0
.venv/bin/python scripts/semester2/render-reports.py
```
