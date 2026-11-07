// Общий шаблон отчётов по дисциплине «Бэк-энд разработка».
// Сборка: typst compile --root .. lab4.typ out.pdf

#let todo(body) = block(
  width: 100%, inset: 8pt, radius: 3pt,
  stroke: (paint: rgb("#c0392b"), thickness: 1pt, dash: "dashed"),
  fill: rgb("#fdecea"),
  text(fill: rgb("#c0392b"), size: 11pt)[*TODO (заменить после деплоя на сервер):* #body],
)

#let shot(path, caption, width: 100%) = figure(
  image(path, width: width),
  caption: caption,
)

#let report(title: "", body) = {
  set document(title: title, author: "Субботин Александр")
  set page(paper: "a4", margin: (left: 30mm, right: 15mm, top: 20mm, bottom: 20mm))
  set text(font: ("Times New Roman", "PT Serif"), size: 14pt, lang: "ru")
  set par(justify: true, leading: 0.8em, first-line-indent: (amount: 1.25cm, all: true), spacing: 0.9em)
  show raw: set text(font: ("PT Mono", "Menlo"))
  show raw.where(block: true): set text(size: 10pt)
  // по умолчанию raw = 0.8em; инлайн-код делаем ~0.86 от окружающего текста
  show raw.where(block: false): set text(size: 1.075em)
  show raw.where(block: true): it => {
    set par(justify: false, first-line-indent: 0pt)
    block(width: 100%, inset: 8pt, radius: 3pt, fill: luma(245), stroke: luma(220), it)
  }
  set list(indent: 1.25cm)
  set enum(indent: 1.25cm)
  show list: set par(first-line-indent: 0pt)
  show enum: set par(first-line-indent: 0pt)
  set heading(numbering: "1.1")
  show heading: it => {
    set par(first-line-indent: 0pt)
    v(0.6em)
    it
    v(0.3em)
  }
  show heading.where(level: 1): set text(size: 16pt)
  show heading.where(level: 2): set text(size: 14pt)
  show figure: set block(breakable: false)
  set figure(supplement: "Рисунок")
  show figure.where(kind: table): set figure(supplement: "Таблица")
  show figure.where(kind: table): set figure.caption(position: top)
  set table(stroke: 0.5pt + luma(150), inset: 6pt)
  show table: set text(size: 11pt)
  show table: set par(justify: false, first-line-indent: 0pt)

  // ---- титульный лист
  page(numbering: none)[
    #set par(first-line-indent: 0pt, justify: false)
    #align(center)[
      #text(weight: "bold")[САНКТ-ПЕТЕРБУРГСКИЙ НАЦИОНАЛЬНЫЙ ИССЛЕДОВАТЕЛЬСКИЙ УНИВЕРСИТЕТ ИТМО]
      #v(1fr)
      #text(size: 18pt, weight: "bold")[ОТЧЁТ]
      #v(0.4em)
      #text(weight: "bold")[ПО ДИСЦИПЛИНЕ «БЭК-ЭНД РАЗРАБОТКА»]
      #v(1.2em)
      по теме:
      #v(0.4em)
      #text(weight: "bold")[#upper(title)]
      #v(1fr)
    ]
    #grid(
      columns: (1fr, 1fr), column-gutter: 1em, row-gutter: 0.4em,
      [Проверил: Добряков Д. И.], [Выполнил: Субботин Александр, БР1.1],
      text(size: 10pt)[#v(1.2em)#line(length: 80%) подпись, дата],
      text(size: 10pt)[#v(1.2em)#line(length: 80%) подпись, дата],
    )
    #v(1fr)
    #align(center)[Санкт-Петербург 2026]
  ]

  set page(numbering: "1", number-align: center)
  counter(page).update(2)
  body
}
