#!/usr/bin/env python3
"""README.md задачи -> PDF-отчёт с титульным листом ИТМО (pandoc + headless Chrome).

usage: build_report.py <task_dir> <kind: lab|hw> <number> "<title>"
README.md: первая строка '# ...' и всё до первого '## ' пропускаются (их заменяет титульник).
"""
import html
import pathlib
import re
import subprocess
import sys
import tempfile
import hashlib

MMD = pathlib.Path(__file__).resolve().parent / "mermaid"   # npm i (см. README)


def render_mermaid(md: str) -> str:
    """```mermaid блоки -> PNG (кэш по хэшу); первая строка '%% caption: ...' — подпись."""
    def repl(m):
        code = m.group(1)
        cap = ""
        first = code.strip().splitlines()[0]
        if first.startswith("%% caption:"):
            cap = first.split(":", 1)[1].strip()
        h = hashlib.sha1(code.encode()).hexdigest()[:12]
        cache = MMD / "cache"; cache.mkdir(exist_ok=True)
        png = cache / f"{h}.png"
        if not png.exists():
            src = cache / f"{h}.mmd"; src.write_text(code, encoding="utf-8")
            subprocess.run([str(MMD / "node_modules/.bin/mmdc"), "-p", str(MMD / "puppeteer.json"), "-i", str(src),
                            "-o", str(png), "-b", "white", "-s", "2", "-w", "1400"], check=True, capture_output=True)
        return f"\n![{cap}]({png.as_uri()})\n"
    return re.sub(r"```mermaid\n(.*?)```", repl, md, flags=re.S)

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
STUDENT, GROUP, TEACHER = "Якшин Артемий", "БР1.1", "Добряков Д. И."

CSS = r"""
@page { size: A4; margin: 20mm 15mm 20mm 25mm; }
html { font-family: "Times New Roman", Times, serif; font-size: 13.5pt; line-height: 1.45; color: #000; }
body { margin: 0; }
.title { height: 248mm; box-sizing: border-box; position: relative; page-break-after: always; }
.title .uni { text-align: center; font-weight: bold; font-size: 14pt; margin-top: 5mm; line-height: 1.35; }
.title .block1 { position: absolute; top: 85mm; left: 0; }
.title .block2 { position: absolute; top: 160mm; left: 0; }
.title .city { position: absolute; bottom: 0; width: 100%; text-align: center; }
.title p { margin: 0 0 4mm 0; }
.content p { text-align: justify; }
.content p { margin: 0 0 2.5mm 0; }
h2 { font-size: 15pt; margin: 7mm 0 3mm; page-break-after: avoid; }
h3 { font-size: 13.5pt; margin: 5mm 0 2mm; page-break-after: avoid; }
h4 { font-size: 13pt; margin: 4mm 0 2mm; font-style: italic; page-break-after: avoid; }
ul, ol { margin: 0 0 2.5mm 0; padding-left: 7mm; }
li { margin-bottom: 1mm; }
code { font-family: "Courier New", Courier, monospace; font-size: 10.5pt; background: #eeeeee;
       padding: 0 1.5px; border-radius: 2px; word-break: break-word; }
pre { background: #f2f2f2; border: 1px solid #dddddd; border-radius: 3px; padding: 2.5mm 3mm;
      font-size: 9.2pt; line-height: 1.3; white-space: pre-wrap; word-break: break-all; margin: 1.5mm 0 3mm;
      page-break-inside: auto; }
pre code { background: none; padding: 0; font-size: inherit; }
table { border-collapse: collapse; width: 100%; margin: 2mm 0 3.5mm; font-size: 11.5pt; page-break-inside: auto; }
th, td { border: 1px solid #777; padding: 1.2mm 2mm; vertical-align: top; text-align: left; }
th { background: #eeeeee; }
tr { page-break-inside: avoid; }
blockquote { margin: 2mm 0 3mm; padding: 1.5mm 4mm; border-left: 3px solid #999; background: #fafafa; font-size: 12pt; }
blockquote p { margin: 0; }
img { max-width: 100%; display: block; margin: 2mm auto 1mm; border: 1px solid #ccc; }
figure { margin: 2mm 0 4mm; page-break-inside: avoid; }
figcaption, .caption { text-align: center; font-size: 11.5pt; font-style: italic; margin-bottom: 3mm; }
a { color: #000; text-decoration: none; }
hr { border: none; border-top: 1px solid #ccc; margin: 4mm 0; }
.mermaid, svg { max-width: 100%; }
"""


def main() -> None:
    task_dir = pathlib.Path(sys.argv[1]).resolve()
    kind, number, title = sys.argv[2], sys.argv[3], sys.argv[4]
    readme = (task_dir / "README.md").read_text(encoding="utf-8")
    # срезаем заголовок README до первого раздела '## '
    m = re.search(r"^## ", readme, re.M)
    body_md = readme[m.start():] if m else readme
    body_md = render_mermaid(body_md)

    fragment = subprocess.run(
        ["pandoc", "-f", "gfm+pipe_tables+implicit_figures", "-t", "html5", "--no-highlight", "--wrap=none"],
        input=body_md, capture_output=True, text=True, check=True,
    ).stdout

    work_kind = "Лабораторная работа" if kind == "lab" else "Домашнее задание"
    prefix = "ЛР" if kind == "lab" else "ДЗ"
    doc = f"""<!doctype html><html lang="ru"><head><meta charset="utf-8">
<base href="{task_dir.as_uri()}/"><title>{prefix}{number} {html.escape(title)}</title><style>{CSS}</style></head><body>
<section class="title">
  <div class="uni">САНКТ-ПЕТЕРБУРГСКИЙ НАЦИОНАЛЬНЫЙ<br>ИССЛЕДОВАТЕЛЬСКИЙ УНИВЕРСИТЕТ ИТМО</div>
  <div class="block1">
    <p><b>Дисциплина:</b> Бэк-энд разработка</p>
    <p>Отчет</p>
    <p>{work_kind} №{number}<br>«{html.escape(title)}»</p>
  </div>
  <div class="block2">
    <p>Выполнил:</p><p>{STUDENT}</p><p>Группа {GROUP}</p>
    <p style="margin-top:7mm">Проверил:</p><p>{TEACHER}</p>
  </div>
  <div class="city"><p>Санкт-Петербург</p><p>2026 г.</p></div>
</section>
<main class="content">{fragment}</main></body></html>"""

    out_pdf = task_dir / f"{prefix}{number}_{STUDENT}_{GROUP}.pdf"
    with tempfile.TemporaryDirectory() as tmp:
        html_file = pathlib.Path(tmp) / "report.html"
        html_file.write_text(doc, encoding="utf-8")
        subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
             "--virtual-time-budget=8000", f"--print-to-pdf={out_pdf}", html_file.as_uri()],
            check=True, capture_output=True,
        )
    pages = len(re.findall(rb"/Type\s*/Page[^s]", out_pdf.read_bytes()))
    print(f"{out_pdf.name}: {pages} pages")


if __name__ == "__main__":
    main()
