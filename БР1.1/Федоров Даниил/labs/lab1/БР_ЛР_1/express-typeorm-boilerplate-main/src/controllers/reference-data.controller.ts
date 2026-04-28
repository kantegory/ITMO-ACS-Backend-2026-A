import { Get } from 'routing-controllers';

import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { ExperienceOption } from '../models/experience-option.entity';
import { Industry } from '../models/industry.entity';
import { Skill } from '../models/skill.entity';


import {
    serializeExperienceOption,
    serializeIndustry,
    serializeSkill,
} from '../views/serializers';


@EntityController({
    baseRoute: '/reference',
})

class ReferenceDataController extends BaseController {
    private experienceRepository = dataSource.getRepository(ExperienceOption);
    private industryRepository = dataSource.getRepository(Industry);
    private skillRepository = dataSource.getRepository(Skill);

    @Get('/experiences')
    async getExperiences() {
        const experiences = await this.experienceRepository.find({
            order: { 
                experienceId: 'ASC' 
            },
        });

        return experiences.map(serializeExperienceOption);
    }
    
    @Get('/industries')
    async getIndustries() {
        const industries = await this.industryRepository.find({
            order: {
                name: 'ASC'
            },
        });
        
        return industries.map(serializeIndustry);
    }

    @Get('/skills')
    async getSkills() {
        const skills = await this.skillRepository.find({
            order: {
                name: 'ASC'
            },
        });

        return skills.map(serializeSkill);
    }
}

export default ReferenceDataController;