import dataSource from '../config/data-source';

const REFERENCE_DATA = [
    {
        industry: 'Информационные технологии',
        specializations: [
            'Backend-разработчик',
            'Frontend-разработчик',
            'QA-инженер',
        ],
    },
    {
        industry: 'Маркетинг',
        specializations: [
            'SMM-менеджер',
            'Контент-менеджер',
            'Интернет-маркетолог',
        ],
    },
    {
        industry: 'Дизайн',
        specializations: [
            'UI-дизайнер',
            'UX-дизайнер',
            'Графический дизайнер',
        ],
    },
    {
        industry: 'Финансы',
        specializations: [
            'Финансовый аналитик',
            'Бухгалтер',
            'Аудитор',
        ],
    },
    {
        industry: 'Продажи',
        specializations: [
            'Менеджер по продажам',
            'Аккаунт-менеджер',
            'Менеджер по развитию бизнеса',
        ],
    },
    {
        industry: 'Управление персоналом',
        specializations: [
            'Рекрутер',
            'HR-менеджер',
            'HR Generalist',
        ],
    },
    {
        industry: 'Образование',
        specializations: [
            'Преподаватель',
            'Методист',
            'Тьютор',
        ],
    },
    {
        industry: 'Медицина',
        specializations: [
            'Врач-терапевт',
            'Медицинская сестра',
            'Лаборант',
        ],
    },
    {
        industry: 'Логистика',
        specializations: [
            'Логист',
            'Координатор поставок',
            'Менеджер склада',
        ],
    },
    {
        industry: 'Строительство',
        specializations: [
            'Инженер-строитель',
            'Прораб',
            'Сметчик',
        ],
    },
];

async function seedReferenceData(): Promise<void> {
    const industryRepository = dataSource.getRepository('industries');
    const specializationRepository = dataSource.getRepository('specializations');

    for (const item of REFERENCE_DATA) {
        let industry = await industryRepository.findOneBy({
            name: item.industry,
        });

        if (!industry) {
            industry = await industryRepository.save(
                industryRepository.create({
                    name: item.industry,
                }),
            );
        }

        for (const specializationName of item.specializations) {
            const existingSpecialization = await specializationRepository.findOne({
                where: {
                    name: specializationName,
                    industry: {
                        industry_id: industry.industry_id,
                    },
                },
                relations: ['industry'],
            });

            if (!existingSpecialization) {
                await specializationRepository.save(
                    specializationRepository.create({
                        name: specializationName,
                        industry,
                    }),
                );
            }
        }
    }
}

export default seedReferenceData;
