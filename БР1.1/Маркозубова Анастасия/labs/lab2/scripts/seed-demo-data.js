const { Client } = require('pg');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
};

const passwordHash =
    '$2b$08$rRxAZrtBQkLk9QXwcuiAXOWtgaraWuAzRbjpoEily6OWXcyT3BA6i';

async function connect(database) {
    const client = new Client({ ...dbConfig, database });
    await client.connect();
    return client;
}

async function one(client, sql, params = []) {
    const result = await client.query(sql, params);
    return result.rows[0];
}

async function insertIndustry(referenceDb, name) {
    const existing = await one(
        referenceDb,
        'SELECT industry_id FROM industries WHERE name = $1 ORDER BY industry_id LIMIT 1',
        [name],
    );

    if (existing) {
        return existing.industry_id;
    }

    const created = await one(
        referenceDb,
        'INSERT INTO industries (name) VALUES ($1) RETURNING industry_id',
        [name],
    );
    return created.industry_id;
}

async function insertSpecialization(referenceDb, industryId, name) {
    const existing = await one(
        referenceDb,
        'SELECT specialization_id FROM specializations WHERE industry_id = $1 AND name = $2 ORDER BY specialization_id LIMIT 1',
        [industryId, name],
    );

    if (existing) {
        return existing.specialization_id;
    }

    const created = await one(
        referenceDb,
        'INSERT INTO specializations (industry_id, name) VALUES ($1, $2) RETURNING specialization_id',
        [industryId, name],
    );
    return created.specialization_id;
}

async function main() {
    const authDb = await connect('auth_db');
    const profileDb = await connect('profile_db');
    const referenceDb = await connect('reference_db');
    const resumeDb = await connect('resume_db');
    const vacancyDb = await connect('vacancy_db');
    const applicationDb = await connect('application_db');

    try {
        console.log('Seeding auth_db...');
        const users = [
            ['ivan.petrov@example.ru', 'seeker'],
            ['anna.smirnova@example.ru', 'seeker'],
            ['dmitry.kuznetsov@example.ru', 'seeker'],
            ['hr.neva@example.ru', 'company'],
            ['hr.sibirsoft@example.ru', 'company'],
            ['hr.medplus@example.ru', 'company'],
        ];

        const userIds = {};
        for (const [email, role] of users) {
            const user = await one(
                authDb,
                `
                    INSERT INTO users (email, password_hash, user_role)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (email) DO UPDATE
                    SET password_hash = EXCLUDED.password_hash,
                        user_role = EXCLUDED.user_role,
                        updated_at = now()
                    RETURNING user_id
                `,
                [email, passwordHash, role],
            );
            userIds[email] = user.user_id;
        }

        console.log('Seeding reference_db...');
        await referenceDb.query(
            "DELETE FROM specializations WHERE name LIKE '%Ð%' OR name LIKE '%Ñ%' OR name LIKE '%?%'",
        );
        await referenceDb.query(
            "DELETE FROM industries WHERE name LIKE '%Ð%' OR name LIKE '%Ñ%' OR name LIKE '%?%'",
        );

        const itIndustryId = await insertIndustry(
            referenceDb,
            'Информационные технологии',
        );
        const marketingIndustryId = await insertIndustry(
            referenceDb,
            'Маркетинг',
        );
        const medicineIndustryId = await insertIndustry(referenceDb, 'Медицина');
        const financeIndustryId = await insertIndustry(referenceDb, 'Финансы');
        const educationIndustryId = await insertIndustry(
            referenceDb,
            'Образование',
        );

        const backendSpecId = await insertSpecialization(
            referenceDb,
            itIndustryId,
            'Backend-разработчик',
        );
        const frontendSpecId = await insertSpecialization(
            referenceDb,
            itIndustryId,
            'Frontend-разработчик',
        );
        const qaSpecId = await insertSpecialization(
            referenceDb,
            itIndustryId,
            'QA-инженер',
        );
        await insertSpecialization(referenceDb, marketingIndustryId, 'SMM-менеджер');
        const marketingSpecId = await insertSpecialization(
            referenceDb,
            marketingIndustryId,
            'Интернет-маркетолог',
        );
        await insertSpecialization(referenceDb, medicineIndustryId, 'Медицинская сестра');
        await insertSpecialization(referenceDb, medicineIndustryId, 'Врач-терапевт');
        await insertSpecialization(referenceDb, financeIndustryId, 'Финансовый аналитик');
        await insertSpecialization(referenceDb, educationIndustryId, 'Преподаватель');

        console.log('Cleaning old demo rows...');
        await applicationDb.query(
            `
                DELETE FROM applications
                WHERE cover_letter = ANY($1::text[])
            `,
            [
                [
                    'Здравствуйте! Хочу откликнуться на вакансию, опыт и стек совпадают с требованиями.',
                    'Добрый день! Интересна ваша команда, готова выполнить тестовое задание.',
                    'Здравствуйте! Есть опыт ручного и автоматизированного тестирования, буду рад обсудить вакансию.',
                ],
            ],
        );

        console.log('Seeding profile_db...');
        const seekers = [
            {
                email: 'ivan.petrov@example.ru',
                firstName: 'Иван',
                lastName: 'Петров',
                phone: '+7 921 111-22-33',
                bio: 'Backend-разработчик, работаю с Node.js, PostgreSQL и REST API.',
                contact: 'Telegram: @ivan_backend, ivan.petrov@example.ru',
            },
            {
                email: 'anna.smirnova@example.ru',
                firstName: 'Анна',
                lastName: 'Смирнова',
                phone: '+7 921 222-33-44',
                bio: 'Frontend-разработчик, люблю React, TypeScript и аккуратные интерфейсы.',
                contact: 'Telegram: @anna_frontend, anna.smirnova@example.ru',
            },
            {
                email: 'dmitry.kuznetsov@example.ru',
                firstName: 'Дмитрий',
                lastName: 'Кузнецов',
                phone: '+7 921 333-44-55',
                bio: 'QA-инженер, пишу чек-листы, автотесты и внимательно ищу дефекты.',
                contact: 'Telegram: @dmitry_qa, dmitry.kuznetsov@example.ru',
            },
        ];

        const seekerIds = {};
        for (const seeker of seekers) {
            const row = await one(
                profileDb,
                `
                    INSERT INTO seekers (user_id, first_name, last_name, phone, bio, contact_info)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (user_id) DO UPDATE
                    SET first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        phone = EXCLUDED.phone,
                        bio = EXCLUDED.bio,
                        contact_info = EXCLUDED.contact_info,
                        updated_at = now()
                    RETURNING seeker_id
                `,
                [
                    userIds[seeker.email],
                    seeker.firstName,
                    seeker.lastName,
                    seeker.phone,
                    seeker.bio,
                    seeker.contact,
                ],
            );
            seekerIds[seeker.email] = row.seeker_id;
        }

        const companies = [
            {
                email: 'hr.neva@example.ru',
                name: 'Нева Тех',
                description:
                    'Петербургская IT-компания, разрабатывает сервисы для онлайн-торговли и логистики.',
                website: 'https://neva-tech.example.ru',
            },
            {
                email: 'hr.sibirsoft@example.ru',
                name: 'СибирьСофт',
                description:
                    'Команда продуктовой разработки: веб-сервисы, аналитика, мобильные приложения.',
                website: 'https://sibirsoft.example.ru',
            },
            {
                email: 'hr.medplus@example.ru',
                name: 'МедПлюс',
                description:
                    'Сеть современных клиник с цифровыми сервисами для пациентов и врачей.',
                website: 'https://medplus.example.ru',
            },
        ];

        const companyIds = {};
        for (const company of companies) {
            const row = await one(
                profileDb,
                `
                    INSERT INTO companies (user_id, name, description, website)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) DO UPDATE
                    SET name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        website = EXCLUDED.website,
                        updated_at = now()
                    RETURNING company_id
                `,
                [
                    userIds[company.email],
                    company.name,
                    company.description,
                    company.website,
                ],
            );
            companyIds[company.name] = row.company_id;
        }

        console.log('Seeding resume_db...');
        await resumeDb.query(
            `
                DELETE FROM educations
                WHERE resume_id IN (
                    SELECT resume_id FROM resumes WHERE seeker_id = ANY($1::int[])
                )
            `,
            [Object.values(seekerIds)],
        );
        await resumeDb.query(
            `
                DELETE FROM experiences
                WHERE resume_id IN (
                    SELECT resume_id FROM resumes WHERE seeker_id = ANY($1::int[])
                )
            `,
            [Object.values(seekerIds)],
        );
        await resumeDb.query('DELETE FROM resumes WHERE seeker_id = ANY($1::int[])', [
            Object.values(seekerIds),
        ]);

        const resumes = [
            {
                email: 'ivan.petrov@example.ru',
                specId: backendSpecId,
                title: 'Backend-разработчик Node.js',
                salary: 180000,
                years: 3,
                location: 'Санкт-Петербург',
                education: [
                    'Санкт-Петербургский политехнический университет',
                    'Бакалавр',
                    'Прикладная информатика',
                    '2018-09-01',
                    '2022-06-30',
                ],
                experience: [
                    'Логика Онлайн',
                    'Junior Backend-разработчик',
                    'Разработка REST API, интеграция с PostgreSQL, поддержка внутренних сервисов.',
                    '2022-07-01',
                    '2025-04-30',
                ],
            },
            {
                email: 'anna.smirnova@example.ru',
                specId: frontendSpecId,
                title: 'Frontend-разработчик React',
                salary: 160000,
                years: 2,
                location: 'Москва',
                education: [
                    'НИУ ВШЭ',
                    'Бакалавр',
                    'Программная инженерия',
                    '2019-09-01',
                    '2023-06-30',
                ],
                experience: [
                    'ВебЛиния',
                    'Frontend-разработчик',
                    'Разработка личных кабинетов, форм и адаптивных интерфейсов.',
                    '2023-07-01',
                    null,
                ],
            },
            {
                email: 'dmitry.kuznetsov@example.ru',
                specId: qaSpecId,
                title: 'QA-инженер',
                salary: 120000,
                years: 2,
                location: 'Екатеринбург',
                education: [
                    'Уральский федеральный университет',
                    'Бакалавр',
                    'Информационные системы',
                    '2018-09-01',
                    '2022-06-30',
                ],
                experience: [
                    'ТестЛаб',
                    'QA-инженер',
                    'Функциональное тестирование, регрессионные проверки, оформление баг-репортов.',
                    '2022-08-01',
                    null,
                ],
            },
        ];

        const resumeIds = {};
        for (const resume of resumes) {
            const row = await one(
                resumeDb,
                `
                    INSERT INTO resumes
                        (seeker_id, specialization_id, title, desired_salary, experience_years, location)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING resume_id
                `,
                [
                    seekerIds[resume.email],
                    resume.specId,
                    resume.title,
                    resume.salary,
                    resume.years,
                    resume.location,
                ],
            );
            resumeIds[resume.title] = row.resume_id;

            await resumeDb.query(
                `
                    INSERT INTO educations
                        (resume_id, institution, degree, field_of_study, start_date, end_date)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [row.resume_id, ...resume.education],
            );

            await resumeDb.query(
                `
                    INSERT INTO experiences
                        (resume_id, company_name, position, description, start_date, end_date)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [row.resume_id, ...resume.experience],
            );
        }

        console.log('Seeding vacancy_db...');
        await vacancyDb.query(
            'DELETE FROM vacancies WHERE company_id = ANY($1::int[])',
            [Object.values(companyIds)],
        );

        const vacancies = [
            {
                companyName: 'Нева Тех',
                specId: backendSpecId,
                title: 'Backend-разработчик Node.js',
                description:
                    'Разработка микросервисов для платформы обработки заказов и интеграций с внешними системами.',
                requirements:
                    'Node.js, TypeScript, PostgreSQL, REST API, понимание микросервисной архитектуры.',
                salaryMin: 170000,
                salaryMax: 230000,
                years: 2,
                location: 'Санкт-Петербург',
                format: 'hybrid',
                type: 'full-time',
            },
            {
                companyName: 'СибирьСофт',
                specId: frontendSpecId,
                title: 'Frontend-разработчик React',
                description:
                    'Разработка интерфейсов личного кабинета и внутренних инструментов для аналитиков.',
                requirements:
                    'React, TypeScript, работа с API, аккуратная верстка, базовое понимание UX.',
                salaryMin: 140000,
                salaryMax: 200000,
                years: 1,
                location: 'Москва',
                format: 'remote',
                type: 'full-time',
            },
            {
                companyName: 'СибирьСофт',
                specId: qaSpecId,
                title: 'QA-инженер в продуктовую команду',
                description:
                    'Тестирование веб-приложений, подготовка тест-кейсов, участие в релизном процессе.',
                requirements:
                    'Опыт ручного тестирования, Postman, SQL на базовом уровне, внимательность к деталям.',
                salaryMin: 100000,
                salaryMax: 150000,
                years: 1,
                location: 'Екатеринбург',
                format: 'hybrid',
                type: 'full-time',
            },
            {
                companyName: 'МедПлюс',
                specId: marketingSpecId,
                title: 'Интернет-маркетолог',
                description:
                    'Продвижение медицинских услуг, настройка рекламных кампаний, анализ эффективности каналов.',
                requirements:
                    'Яндекс Директ, аналитика, работа с посадочными страницами, грамотная коммуникация.',
                salaryMin: 90000,
                salaryMax: 130000,
                years: 2,
                location: 'Москва',
                format: 'office',
                type: 'full-time',
            },
        ];

        const vacancyIds = {};
        for (const vacancy of vacancies) {
            const row = await one(
                vacancyDb,
                `
                    INSERT INTO vacancies
                        (
                            company_id,
                            specialization_id,
                            title,
                            description,
                            requirements,
                            salary_min,
                            salary_max,
                            experience_required,
                            location,
                            work_format,
                            employment_type,
                            status
                        )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
                    RETURNING vacancy_id
                `,
                [
                    companyIds[vacancy.companyName],
                    vacancy.specId,
                    vacancy.title,
                    vacancy.description,
                    vacancy.requirements,
                    vacancy.salaryMin,
                    vacancy.salaryMax,
                    vacancy.years,
                    vacancy.location,
                    vacancy.format,
                    vacancy.type,
                ],
            );
            vacancyIds[vacancy.title] = row.vacancy_id;
        }

        console.log('Seeding application_db...');
        const applications = [
            [
                resumeIds['Backend-разработчик Node.js'],
                vacancyIds['Backend-разработчик Node.js'],
                'Здравствуйте! Хочу откликнуться на вакансию, опыт и стек совпадают с требованиями.',
                'viewed',
            ],
            [
                resumeIds['Frontend-разработчик React'],
                vacancyIds['Frontend-разработчик React'],
                'Добрый день! Интересна ваша команда, готова выполнить тестовое задание.',
                'sent',
            ],
            [
                resumeIds['QA-инженер'],
                vacancyIds['QA-инженер в продуктовую команду'],
                'Здравствуйте! Есть опыт ручного и автоматизированного тестирования, буду рад обсудить вакансию.',
                'invited',
            ],
        ];

        for (const application of applications) {
            await applicationDb.query(
                `
                    INSERT INTO applications
                        (resume_id, vacancy_id, cover_letter, status)
                    VALUES ($1, $2, $3, $4)
                `,
                application,
            );
        }

        console.log('Demo data is ready.');
        console.log('Demo password for all users: password123');
    } finally {
        await authDb.end();
        await profileDb.end();
        await referenceDb.end();
        await resumeDb.end();
        await vacancyDb.end();
        await applicationDb.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
