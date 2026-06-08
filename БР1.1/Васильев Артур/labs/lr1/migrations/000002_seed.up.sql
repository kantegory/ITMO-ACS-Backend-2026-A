INSERT INTO industries (name, slug) VALUES
    ('IT и разработка', 'it'),
    ('Финансы', 'finance'),
    ('Маркетинг', 'marketing'),
    ('Продажи', 'sales'),
    ('Медицина', 'medicine'),
    ('Образование', 'education'),
    ('Производство', 'manufacturing'),
    ('Логистика', 'logistics');

INSERT INTO experience_levels (name, slug, min_years, max_years) VALUES
    ('Без опыта', 'no-experience', 0, 0),
    ('Junior', 'junior', 0, 2),
    ('Middle', 'middle', 2, 5),
    ('Senior', 'senior', 5, NULL);
