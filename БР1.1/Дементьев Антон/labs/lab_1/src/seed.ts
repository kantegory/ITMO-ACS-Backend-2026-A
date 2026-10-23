import dataSource from './config/data-source';
import { Industry } from './models/industry.entity';
import { Skill } from './models/skill.entity';

const INDUSTRIES = [
    'Информационные технологии',
    'Финансы и банковское дело',
    'Медицина и фармацевтика',
    'Образование и наука',
    'Торговля и розничные продажи',
    'Производство и промышленность',
    'Строительство и недвижимость',
    'Транспорт и логистика',
    'Маркетинг и реклама',
    'Туризм и гостиничный бизнес',
    'Юриспруденция',
    'Консалтинг',
    'Государственная служба',
];

const SKILLS = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'Go', 'SQL', 'PostgreSQL',
    'MySQL', 'MongoDB', 'Redis', 'Docker', 'Git', 'Linux', 'REST API', 'GraphQL',
    'Node.js', 'Express', 'TypeORM', 'React', 'Vue.js', 'HTML', 'CSS',
    'Django', 'FastAPI', 'Spring', 'Kubernetes', 'CI/CD', 'Тестирование',
    'Scrum', 'Kanban', 'Jira', 'Управление проектами', 'Аналитика', 'Excel',
    'Английский язык', 'Коммуникации', 'Продажи', 'Бухгалтерский учёт',
];

// При первом запуске заполняет справочники отраслей и навыков, чтобы API сразу можно было пробовать
export const seedReferenceData = async () => {
    const industries = dataSource.getRepository(Industry);
    if ((await industries.count()) === 0) {
        await industries.save(INDUSTRIES.map((title) => industries.create({ title })));
        console.log(`Справочник отраслей заполнен (${INDUSTRIES.length})`);
    }

    const skills = dataSource.getRepository(Skill);
    if ((await skills.count()) === 0) {
        await skills.save(SKILLS.map((name) => skills.create({ name })));
        console.log(`Справочник навыков заполнен (${SKILLS.length})`);
    }
};
