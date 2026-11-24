#!/usr/bin/env python3
"""Render course PDFs from versioned Markdown with a shared A4 cover.
Requires pandoc and `pip install weasyprint==66.0`.
"""
from pathlib import Path
import subprocess, html, re
from weasyprint import HTML
root=Path(__file__).resolve().parents[2]
student=root/'БР1.2/Алексеев Андрей'
css = """
@page { size: A4; margin: 20mm 18mm 20mm 30mm; }
@page cover { margin-bottom: 20mm; }
body { font-family: "Times New Roman", "Liberation Serif", serif;
  font-size: 14pt; line-height: 1.32; color: #000; }
.cover { page: cover; break-after: page; text-align: center; padding-top: 18mm; }
.cover p { margin: 0; }
.cover .university { font-size: 12pt; white-space: nowrap; }
.cover .discipline { margin-top: 7mm; }
.cover .report { margin-top: 7mm; }
.cover .task { margin-top: 5mm; }
.cover .author { margin-top: 12mm; line-height: 1.9; }
.cover .reviewer { margin-top: 6mm; line-height: 1.9; }
.cover .year { margin-top: 19mm; line-height: 1.9; }
h1, h2, h3 { font-size: 14pt; font-weight: bold; margin: 10pt 0 5pt; break-after: avoid; }
h1:first-of-type { margin-top: 0; }
p { margin: 0 0 6pt; orphans: 2; widows: 2; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 2mm 3mm;
  font-size: 9pt; border: 0.5pt solid #bbb; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 0.74em;
  overflow-wrap: anywhere; }
pre code { font-size: inherit; }
table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 10pt;
  margin: 5pt 0 9pt; break-inside: avoid; }
th:first-child { width: 35%; }
th, td { border: 0.5pt solid #888; padding: 1.5mm; overflow-wrap: anywhere; vertical-align: top; }
th { background: #eee; }
tr { break-inside: avoid; }
a { color: inherit; text-decoration: underline; }
figure { margin: 6pt 0; break-inside: avoid; }
img { max-width: 100%; }
figcaption { font-size: 11pt; }
"""
for task in ['labs/lab4','labs/lab5','labs/lab6','labs/lab7','labs/lab8','homeworks/hw6','homeworks/hw7','homeworks/hw8','homeworks/hw9','homeworks/hw10']:
    folder=student/task;source=folder/'report.md'
    if not source.exists(): continue
    lab=task.startswith('labs/');number=folder.name.removeprefix('lab' if lab else 'hw')
    title=f'{"Лабораторная работа" if lab else "Домашнее задание"} №{number}'
    output=folder/f'{"ЛР" if lab else "ДЗ"}{number}_Алексеев Андрей_БР1.2.pdf'
    cover = f"""
    <section class="cover">
      <p class="university">САНКТ-ПЕТЕРБУРГСКИЙ НАЦИОНАЛЬНЫЙ ИССЛЕДОВАТЕЛЬСКИЙ<br>УНИВЕРСИТЕТ ИТМО</p>
      <p class="discipline">Дисциплина: Бэк-энд разработка</p>
      <p class="report">Отчёт</p>
      <p class="task">{html.escape(title)}</p>
      <p class="author">Выполнил<br>Алексеев Андрей<br>Группа: K3341</p>
      <p class="reviewer">Проверил<br>Добряков Д. И.</p>
      <p class="year">Санкт-Петербург<br>2026 г.</p>
    </section>
    """
    body=subprocess.run(['pandoc',str(source),'-t','html5'],check=True,capture_output=True,text=True).stdout
    body = re.sub(r'<colgroup>.*?</colgroup>', '', body, flags=re.DOTALL)
    document=f'<!doctype html><html lang="ru"><meta charset="utf-8"><title>{html.escape(title)}</title><style>{css}</style><body>{cover}{body}</body></html>'
    HTML(string=document,base_url=str(folder)+'/').write_pdf(output)
    print(output.relative_to(root),flush=True)
