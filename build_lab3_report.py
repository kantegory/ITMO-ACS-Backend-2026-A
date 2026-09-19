from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
import struct

root = next(Path('.').glob('*/*/report'))
out = root / 'Back dev Lab3.docx'
md = max(Path('.').rglob('Lab3/*.md'), key=lambda p: p.stat().st_size).read_text(encoding='utf-8')
images = [
    ('.smoke-test-docker.ps1.png', 'Рисунок 1 - Успешное выполнение smoke-теста'),
    ('dockercomposeps.png', 'Рисунок 2 - Состояние контейнеров Docker Compose'),
    ('gateaway.png', 'Рисунок 3 - Swagger UI API Gateway'),
    ('exchange.png', 'Рисунок 4 - Exchange rentease.events в RabbitMQ'),
    ('queues.png', 'Рисунок 5 - Очередь communication.booking-confirmed'),
]

def run(text, size=24, bold=False):
    rp = f'<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    if bold:
        rp += '<w:b/><w:bCs/>'
    rp += '</w:rPr>'
    return f'<w:r>{rp}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

def para(text='', size=24, bold=False, align='both', before=0, after=160):
    pp = f'<w:pPr><w:jc w:val="{align}"/><w:spacing w:before="{before}" w:after="{after}" w:line="276" w:lineRule="auto"/></w:pPr>'
    return f'<w:p>{pp}{run(text, size, bold)}</w:p>'

def heading(text):
    return para(text, size=30, bold=True, align='left', before=240, after=120)

def picture(rid, filename, caption):
    data = (root / filename).read_bytes()
    w, h = struct.unpack('>II', data[16:24])
    cx = 5700000
    cy = int(cx * h / w)
    drawing = (
        f'<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="60"/></w:pPr><w:r><w:drawing>'
        f'<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/>'
        f'<wp:docPr id="{rid}" name="{escape(filename)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        f'<pic:pic><pic:nvPicPr><pic:cNvPr id="{rid}" name="{escape(filename)}"/><pic:cNvPicPr/></pic:nvPicPr>'
        f'<pic:blipFill><a:blip r:embed="rId{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
        f'</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
    )
    return drawing + para(caption, size=20, align='center', after=180)

parts = [
    para('МИНИСТЕРСТВО НАУКИ И ВЫСШЕГО ОБРАЗОВАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ', size=24, bold=True, align='center', after=120),
    para('Лабораторная работа 3', size=36, bold=True, align='center', before=720, after=120),
    para('Контейнеризация микросервисного приложения RentEase средствами Docker', size=28, align='center', after=720),
    para('Выполнил: Фёдоров Иван, группа K3340', align='right', before=900, after=80),
    para('Санкт-Петербург, 2026', align='center', before=900, after=600),
]
for line in md.splitlines():
    if not line.strip():
        continue
    if line.startswith('# '):
        parts.append(heading(line[2:].strip()))
    elif line.startswith('## '):
        parts.append(heading(line[3:].strip()))
    elif line.startswith('- '):
        parts.append(para('• ' + line[2:].strip(), after=80))
    elif line.startswith('```'):
        continue
    else:
        parts.append(para(line.strip()))
for i, (name, caption) in enumerate(images, 10):
    parts.append(picture(i, name, caption))
parts.append(heading('Итог'))
parts.append(para('Контейнерный запуск RentEase проверен через Docker Compose. Скриншоты подтверждают состояние контейнеров, доступность Gateway, успешный smoke-тест и наличие exchange и очереди RabbitMQ.'))
body = ''.join(parts)
sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
document = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>{body}{sect}</w:body></w:document>'
styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>'
rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
doc_rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' + ''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{escape(name)}"/>' for i, (name, _) in enumerate(images, 10)) + '</Relationships>'
ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'
with ZipFile(out, 'w', ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', ct)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', document)
    z.writestr('word/styles.xml', styles)
    z.writestr('word/_rels/document.xml.rels', doc_rels)
    for name, _ in images:
        z.writestr('word/media/' + name, (root / name).read_bytes())
print(out)
