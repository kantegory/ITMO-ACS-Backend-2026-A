
INSERT INTO categories (name, slug) VALUES
    ('Информационные технологии', 'it'),
    ('Маркетинг и реклама', 'marketing'),
    ('Продажи', 'sales'),
    ('Финансы и бухгалтерия', 'finance'),
    ('Производство', 'production'),
    ('Строительство', 'construction'),
    ('Транспорт и логистика', 'logistics'),
    ('Медицина и фармацевтика', 'medicine'),
    ('Образование и наука', 'education'),
    ('Юриспруденция', 'law')
ON CONFLICT (slug) DO NOTHING;