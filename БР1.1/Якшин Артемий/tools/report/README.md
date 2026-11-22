# Сборка PDF-отчётов

`build_report.py` превращает `README.md` работы в PDF с титульным листом ИТМО: pandoc (Markdown → HTML), блоки ` ```mermaid ` → PNG (mermaid-cli), печать через headless Chrome.

```bash
brew install pandoc                       # + Google Chrome
(cd tools/report/mermaid && PUPPETEER_SKIP_DOWNLOAD=1 npm i)
cd labs/lab8 && python3 ../../tools/report/build_report.py . lab 8 "Нагрузочное тестирование облачной инфраструктуры и настройка автоскейлинга"
cd homeworks/hw7 && python3 ../../tools/report/build_report.py . hw 7 "Технический дизайн облачной инфраструктуры для микросервисного веб-приложения"
```

Аргументы: каталог работы, `lab|hw`, номер, название. Первая строка README (`# …`) и всё до первого `## ` заменяются титульным листом.
