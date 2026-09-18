
import { ExperienceOption } from '../models/experience-option.entity';
import { Industry } from '../models/industry.entity';
import { Skill } from '../models/skill.entity';

export const serializeSkill = (skill: Skill) => ({
    skill_id: skill.skillId,
    name: skill.name,
});

export const serializeExperienceOption = (experience: ExperienceOption) => ({
    experience_id: experience.experienceId,
    period: experience.period,
});

export const serializeIndustry = (industry: Industry) => ({
    industry_id: industry.industryId,
    name: industry.name,
});
