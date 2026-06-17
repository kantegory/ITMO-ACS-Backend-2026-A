-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    role VARCHAR(50),
    is_active BOOLEAN DEFAULT true
);

-- Таблица вакансий
CREATE TABLE IF NOT EXISTS vacancies (
    id SERIAL PRIMARY KEY,
    employer_id INT,
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

-- Таблица резюме
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    applicant_id INT,
    desired_position VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

-- Таблица откликов
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    vacancy_id INT,
    resume_id INT,
    status VARCHAR(50)
);

-- Вставляем тестовые данные
INSERT INTO users (email, role, is_active) VALUES 
('emp1@test.com', 'employer', true), 
('app1@test.com', 'applicant', true), 
('app2@test.com', 'applicant', true);

INSERT INTO vacancies (employer_id, title, is_active) VALUES 
(1, 'Go Developer', true), 
(1, 'Python Developer', true);

INSERT INTO resumes (applicant_id, desired_position, is_active) VALUES 
(2, 'Backend Dev', true), 
(3, 'Frontend Dev', true);

INSERT INTO applications (vacancy_id, resume_id, status) VALUES 
(1, 1, 'pending');
