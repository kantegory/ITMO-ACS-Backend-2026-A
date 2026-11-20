import dataSource from '../config/data-source';
import hashPassword from '../utils/hash-password';

type SavedUser = {
    user_id: number;
    email: string;
    password_hash: string;
    user_role: string;
};

type SavedSeeker = {
    seeker_id: number;
};

type SavedCompany = {
    company_id: number;
};

type SavedResume = {
    resume_id: number;
};

type SavedVacancy = {
    vacancy_id: number;
};

async function getSpecializationByName(name: string) {
    const specializationRepository = dataSource.getRepository('specializations');

    return await specializationRepository.findOne({
        where: {
            name,
        },
        relations: ['industry'],
    });
}

async function createUserIfNotExists(
    email: string,
    password: string,
    role: 'seeker' | 'company',
): Promise<SavedUser> {
    const userRepository = dataSource.getRepository('users');
    const existingUser = await userRepository.findOneBy({
        email,
    });

    if (existingUser) {
        return existingUser as SavedUser;
    }

    return (await userRepository.save(
        userRepository.create({
            email,
            password_hash: hashPassword(password),
            user_role: role,
        }),
    )) as SavedUser;
}

async function seedSeekersAndResumes(): Promise<void> {
    const seekerRepository = dataSource.getRepository('seekers');
    const resumeRepository = dataSource.getRepository('resumes');
    const educationRepository = dataSource.getRepository('educations');
    const experienceRepository = dataSource.getRepository('experiences');

    const backendSpecialization = await getSpecializationByName(
        'Backend-разработчик',
    );
    const qaSpecialization = await getSpecializationByName('QA-инженер');

    if (!backendSpecialization || !qaSpecialization) {
        return;
    }

    const ivanUser = await createUserIfNotExists(
        'ivan.petrov@example.com',
        'qwerty123',
        'seeker',
    );
    const annaUser = await createUserIfNotExists(
        'anna.smirnova@example.com',
        'qwerty123',
        'seeker',
    );

    let ivanSeeker = await seekerRepository.findOne({
        where: {
            user: {
                user_id: ivanUser.user_id,
            },
        },
        relations: ['user'],
    });

    if (!ivanSeeker) {
        ivanSeeker = await seekerRepository.save(
            seekerRepository.create({
                first_name: 'Иван',
                last_name: 'Петров',
                phone: '+7 900 100-10-10',
                bio: 'Backend-разработчик с опытом разработки REST API на Node.js и TypeScript.',
                contact_info: 'Telegram: @ivan_backend',
                user: ivanUser,
            }),
        );
    }

    let annaSeeker = await seekerRepository.findOne({
        where: {
            user: {
                user_id: annaUser.user_id,
            },
        },
        relations: ['user'],
    });

    if (!annaSeeker) {
        annaSeeker = await seekerRepository.save(
            seekerRepository.create({
                first_name: 'Анна',
                last_name: 'Смирнова',
                phone: '+7 900 200-20-20',
                bio: 'QA-инженер, люблю тестировать веб-приложения и API.',
                contact_info: 'Email: anna.smirnova@example.com',
                user: annaUser,
            }),
        );
    }

    let ivanResume = await resumeRepository.findOne({
        where: {
            title: 'Backend-разработчик Node.js',
            seeker: {
                seeker_id: (ivanSeeker as SavedSeeker).seeker_id,
            },
        },
        relations: ['seeker'],
    });

    if (!ivanResume) {
        ivanResume = await resumeRepository.save(
            resumeRepository.create({
                title: 'Backend-разработчик Node.js',
                desired_salary: 180000,
                experience_years: 3,
                location: 'Москва',
                seeker: ivanSeeker,
                specialization: backendSpecialization,
            }),
        );
    }

    let annaResume = await resumeRepository.findOne({
        where: {
            title: 'QA-инженер',
            seeker: {
                seeker_id: (annaSeeker as SavedSeeker).seeker_id,
            },
        },
        relations: ['seeker'],
    });

    if (!annaResume) {
        annaResume = await resumeRepository.save(
            resumeRepository.create({
                title: 'QA-инженер',
                desired_salary: 130000,
                experience_years: 2,
                location: 'Санкт-Петербург',
                seeker: annaSeeker,
                specialization: qaSpecialization,
            }),
        );
    }

    const ivanEducation = await educationRepository.findOne({
        where: {
            resume: {
                resume_id: (ivanResume as SavedResume).resume_id,
            },
            institution: 'МГТУ им. Баумана',
        },
        relations: ['resume'],
    });

    if (!ivanEducation) {
        await educationRepository.save(
            educationRepository.create({
                institution: 'МГТУ им. Баумана',
                degree: 'Бакалавр',
                field_of_study: 'Прикладная информатика',
                start_date: '2018-09-01',
                end_date: '2022-06-30',
                resume: ivanResume,
            }),
        );
    }

    const annaEducation = await educationRepository.findOne({
        where: {
            resume: {
                resume_id: (annaResume as SavedResume).resume_id,
            },
            institution: 'СПбГУ',
        },
        relations: ['resume'],
    });

    if (!annaEducation) {
        await educationRepository.save(
            educationRepository.create({
                institution: 'СПбГУ',
                degree: 'Бакалавр',
                field_of_study: 'Информационные системы',
                start_date: '2019-09-01',
                end_date: '2023-06-30',
                resume: annaResume,
            }),
        );
    }

    const ivanExperience = await experienceRepository.findOne({
        where: {
            resume: {
                resume_id: (ivanResume as SavedResume).resume_id,
            },
            company_name: 'ООО СофтЛаб',
        },
        relations: ['resume'],
    });

    if (!ivanExperience) {
        await experienceRepository.save(
            experienceRepository.create({
                company_name: 'ООО СофтЛаб',
                position: 'Backend-разработчик',
                description: 'Разработка REST API и интеграций с PostgreSQL.',
                start_date: '2022-07-01',
                end_date: '2025-03-01',
                resume: ivanResume,
            }),
        );
    }

    const annaExperience = await experienceRepository.findOne({
        where: {
            resume: {
                resume_id: (annaResume as SavedResume).resume_id,
            },
            company_name: 'ТестПлюс',
        },
        relations: ['resume'],
    });

    if (!annaExperience) {
        await experienceRepository.save(
            experienceRepository.create({
                company_name: 'ТестПлюс',
                position: 'QA-инженер',
                description: 'Ручное тестирование веб-приложений и API.',
                start_date: '2023-02-01',
                end_date: '2025-01-15',
                resume: annaResume,
            }),
        );
    }
}

async function seedCompaniesAndVacancies(): Promise<void> {
    const companyRepository = dataSource.getRepository('companies');
    const vacancyRepository = dataSource.getRepository('vacancies');

    const backendSpecialization = await getSpecializationByName(
        'Backend-разработчик',
    );
    const frontendSpecialization = await getSpecializationByName(
        'Frontend-разработчик',
    );
    const qaSpecialization = await getSpecializationByName('QA-инженер');
    const marketerSpecialization = await getSpecializationByName(
        'Интернет-маркетолог',
    );

    if (
        !backendSpecialization ||
        !frontendSpecialization ||
        !qaSpecialization ||
        !marketerSpecialization
    ) {
        return;
    }

    const techVisionUser = await createUserIfNotExists(
        'hr@techvision.ru',
        'qwerty123',
        'company',
    );
    const marketGuruUser = await createUserIfNotExists(
        'jobs@marketguru.ru',
        'qwerty123',
        'company',
    );
    const qaFactoryUser = await createUserIfNotExists(
        'team@qafactory.ru',
        'qwerty123',
        'company',
    );

    let techVision = await companyRepository.findOne({
        where: {
            user: {
                user_id: techVisionUser.user_id,
            },
        },
        relations: ['user'],
    });

    if (!techVision) {
        techVision = await companyRepository.save(
            companyRepository.create({
                name: 'ТехВижн',
                description: 'IT-компания, которая разрабатывает корпоративные веб-сервисы.',
                website: 'https://techvision.example.com',
                user: techVisionUser,
            }),
        );
    }

    let marketGuru = await companyRepository.findOne({
        where: {
            user: {
                user_id: marketGuruUser.user_id,
            },
        },
        relations: ['user'],
    });

    if (!marketGuru) {
        marketGuru = await companyRepository.save(
            companyRepository.create({
                name: 'МаркетГуру',
                description: 'Агентство цифрового маркетинга и performance-рекламы.',
                website: 'https://marketguru.example.com',
                user: marketGuruUser,
            }),
        );
    }

    let qaFactory = await companyRepository.findOne({
        where: {
            user: {
                user_id: qaFactoryUser.user_id,
            },
        },
        relations: ['user'],
    });

    if (!qaFactory) {
        qaFactory = await companyRepository.save(
            companyRepository.create({
                name: 'QA Factory',
                description: 'Команда тестирования и автоматизации качества.',
                website: 'https://qafactory.example.com',
                user: qaFactoryUser,
            }),
        );
    }

    const vacancies = [
        {
            company: techVision,
            specialization: backendSpecialization,
            title: 'Backend-разработчик Node.js',
            description: 'Разработка серверной части платформы и интеграций.',
            requirements: 'Node.js, TypeScript, PostgreSQL, REST API',
            salary_min: 170000,
            salary_max: 220000,
            experience_required: 2,
            location: 'Москва',
            work_format: 'hybrid',
            employment_type: 'full-time',
        },
        {
            company: techVision,
            specialization: frontendSpecialization,
            title: 'Frontend-разработчик React',
            description: 'Разработка пользовательских интерфейсов и внутренних кабинетов.',
            requirements: 'React, TypeScript, REST API, CSS',
            salary_min: 150000,
            salary_max: 200000,
            experience_required: 2,
            location: 'Москва',
            work_format: 'remote',
            employment_type: 'full-time',
        },
        {
            company: marketGuru,
            specialization: marketerSpecialization,
            title: 'Интернет-маркетолог',
            description: 'Запуск рекламных кампаний и веб-аналитика.',
            requirements: 'Яндекс Директ, Google Ads, аналитика, контент',
            salary_min: 90000,
            salary_max: 130000,
            experience_required: 1,
            location: 'Санкт-Петербург',
            work_format: 'hybrid',
            employment_type: 'full-time',
        },
        {
            company: qaFactory,
            specialization: qaSpecialization,
            title: 'QA-инженер',
            description: 'Тестирование web/API, подготовка тест-кейсов.',
            requirements: 'Postman, SQL, ручное тестирование, баг-репорты',
            salary_min: 110000,
            salary_max: 150000,
            experience_required: 1,
            location: 'Казань',
            work_format: 'remote',
            employment_type: 'full-time',
        },
    ];

    for (const item of vacancies) {
        const existingVacancy = await vacancyRepository.findOne({
            where: {
                title: item.title,
                company: {
                    company_id: (item.company as SavedCompany).company_id,
                },
            },
            relations: ['company'],
        });

        if (!existingVacancy) {
            await vacancyRepository.save(
                vacancyRepository.create({
                    ...item,
                    status: 'active',
                }),
            );
        }
    }
}

async function seedDemoData(): Promise<void> {
    await seedSeekersAndResumes();
    await seedCompaniesAndVacancies();
}

export default seedDemoData;
