import { Industry } from '../models/industry.entity';
import { Skill } from '../models/skill.entity';

export const industryView = (industry: Industry) => ({
    id: industry.id,
    title: industry.title,
});

export const skillView = (skill: Skill) => ({
    id: skill.id,
    name: skill.name,
});
