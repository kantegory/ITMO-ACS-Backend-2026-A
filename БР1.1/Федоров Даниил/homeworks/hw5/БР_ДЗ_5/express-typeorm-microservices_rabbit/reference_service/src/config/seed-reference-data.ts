import dataSource from './data-source';

import { ExperienceOption } from '../models/experience-option.entity';
import { Industry } from '../models/industry.entity';
import { Skill } from '../models/skill.entity';

const seedReferenceData = async () => {
    const experienceRepository = dataSource.getRepository(ExperienceOption);
    const industryRepository = dataSource.getRepository(Industry);
    const skillRepository = dataSource.getRepository(Skill);

    const experiencesCount = await experienceRepository.count();

    if (experiencesCount === 0) {
        const experiences = [
            experienceRepository.create({
                period: 'Без опыта',
            }),
            experienceRepository.create({
                period: '1-3 года',
            }),
            experienceRepository.create({
                period: '3-6 лет',
            }),
            experienceRepository.create({
                period: 'Более 6 лет',
            }),
        ];

        await experienceRepository.save(experiences);
    }

    const industriesCount = await industryRepository.count();

    if (industriesCount === 0) {
        const industries = [
            industryRepository.create({
                name: 'Информационные технологии',
            }),
            industryRepository.create({
                name: 'Маркетинг',
            }),
            industryRepository.create({
                name: 'Финансы',
            }),
            industryRepository.create({
                name: 'Дизайн',
            }),
            industryRepository.create({
                name: 'Продажи',
            }),
        ];

        await industryRepository.save(industries);
    }

    const skillsCount = await skillRepository.count();

    if (skillsCount === 0) {
        const skills = [
            skillRepository.create({
                name: 'Python',
            }),
            skillRepository.create({
                name: 'TypeScript',
            }),
            skillRepository.create({
                name: 'JavaScript',
            }),
            skillRepository.create({
                name: 'SQL',
            }),
            skillRepository.create({
                name: 'Docker',
            }),
            skillRepository.create({
                name: 'Figma',
            }),
            skillRepository.create({
                name: 'Git',
            }),
        ];

        await skillRepository.save(skills);
    }
};

export default seedReferenceData;