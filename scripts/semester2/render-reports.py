#!/usr/bin/env python3
"""Render course PDFs from versioned Markdown with a shared A4 cover.
Requires pandoc and `pip install weasyprint==66.0`.
"""
from pathlib import Path
import subprocess, html
from weasyprint import HTML
root=Path(__file__).resolve().parents[2]
student=root/'БР1.2/Алексеев Андрей'
css='''@page { size: A4; margin: 20mm 19mm; @bottom-center { content: counter(page); font-size: 9pt; color: #64748b; } }
body { font-family: "DejaVu Serif", serif; font-size: 10.5pt; line-height: 1.5; color: #172033; }
.cover { height: 247mm; page-break-after: always; text-align: center; position: relative; }
.university { font: 12pt/1.6 "DejaVu Sans"; padding-top: 10mm; }
.discipline { margin-top: 25mm; } .report { margin-top: 28mm; font: 26pt "DejaVu Sans"; }
.task { font: 16pt "DejaVu Sans"; margin-top: 8mm; }
.author { text-align: right; margin-top: 28mm; line-height: 2; }
.year { position: absolute; bottom: 5mm; width: 100%; }
h1 { font: bold 17pt "DejaVu Sans"; margin-top: 9mm; color: #1e3a5f; }
h2 { font: bold 12pt "DejaVu Sans"; margin-top: 7mm; }
h1,h2,h3 { break-after: avoid; } p { orphans: 3; widows: 3; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f1f5f9; padding: 3mm; font-size: 8pt; }
code { font-family: "DejaVu Sans Mono"; font-size: 8.5pt; overflow-wrap: anywhere; }
table { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 4mm 0; }
th,td { border: 1px solid #cbd5e1; padding: 2mm; overflow-wrap: anywhere; vertical-align: top; }
th { background: #e2e8f0; } tr { break-inside: avoid; } a { color: #1d4ed8; }
img { max-width: 100%; } figcaption { font-size: 9pt; color: #475569; }
'''
for task in ['labs/lab4','labs/lab5','labs/lab6','labs/lab7','labs/lab8','homeworks/hw6','homeworks/hw7','homeworks/hw8','homeworks/hw9','homeworks/hw10']:
    folder=student/task;source=folder/'report.md'
    if not source.exists(): continue
    lab=task.startswith('labs/');number=folder.name.removeprefix('lab' if lab else 'hw')
    title=f'{"Лабораторная" if lab else "Домашняя"} работа №{number}'
    output=folder/f'{"ЛР" if lab else "ДЗ"}{number}_Алексеев Андрей_БР1.2.pdf'
    cover=f'''<section class="cover"><div class="university">САНКТ-ПЕТЕРБУРГСКИЙ НАЦИОНАЛЬНЫЙ<br>ИССЛЕДОВАТЕЛЬСКИЙ УНИВЕРСИТЕТ ИТМО</div><div class="discipline">Дисциплина: Бэк-энд разработка</div><div class="report">Отчёт</div><div class="task">{html.escape(title)}</div><div class="author">Выполнил: Алексеев Андрей<br>Группа: K3341 (БР1.2)<br><br>Проверил: Добряков Д. И.</div><div class="year">Санкт-Петербург<br>2026 г.</div></section>'''
    body=subprocess.run(['pandoc',str(source),'-t','html5'],check=True,capture_output=True,text=True).stdout
    document=f'<!doctype html><html lang="ru"><meta charset="utf-8"><title>{html.escape(title)}</title><style>{css}</style><body>{cover}{body}</body></html>'
    HTML(string=document,base_url=str(folder)+'/').write_pdf(output)
    print(output.relative_to(root),flush=True)
