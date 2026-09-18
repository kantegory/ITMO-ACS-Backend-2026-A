import { BadRequestError, Body, JsonController, Post, UseBefore, } from "routing-controllers";

import { ArrayUnique, IsArray, IsInt, IsOptional } from "class-validator";

import { In } from "typeorm";

import dataSource from "../config/data-source";

import { ExperienceOption } from "../models/experience-option.entity";
import { Industry } from "../models/industry.entity";
import { Skill } from "../models/skill.entity";

import serviceTokenMiddleware from "../middlewares/service-token.middleware";

import { serializeExperienceOption, serializeIndustry, serializeSkill } from "../views/serializers";

class ResolveReferenceDto{
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({each: true})
    experience_ids?: number[];

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({each: true})
    industry_ids?: number[];

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({each: true})
    skill_ids?: number[];


}

@JsonController('/internal/reference')
@UseBefore(serviceTokenMiddleware)
class InternalReferenceController{
    private experienceRepository = dataSource.getRepository(ExperienceOption);
    private industryRepository = dataSource.getRepository(Industry);
    private skillRepository = dataSource.getRepository(Skill);

    @Post('/resolve')
    async resolve (@Body() body: ResolveReferenceDto,){
        const experienceIds = body.experience_ids || [];
        const industryIds = body.industry_ids || [];
        const skillIds = body.skill_ids || [];

        const experiences = experienceIds.length > 0 
            ? await this.experienceRepository.findBy({ experienceId: In(experienceIds) })
            : [];
            
        const industries = industryIds.length > 0 
            ? await this.industryRepository.findBy({ industryId: In(industryIds) })
            : [];

        const skills = skillIds.length > 0 
            ? await this.skillRepository.findBy({ skillId: In(skillIds) })
            : [];

        if(experiences.length !== experienceIds.length){
            throw new BadRequestError('Один или несколько experience_id не существуют');
        }

        if(industries.length !== industryIds.length){
            throw new BadRequestError('Один или несколько industry_id не существуют');
        }

        if(skills.length !== skillIds.length){
            throw new BadRequestError('Один или несколько skill_id не существуют');
        }
        
        return{
            experiences: experiences.map(serializeExperienceOption),
            industries: industries.map(serializeIndustry),
            skills: skills.map(serializeSkill),
        };
            
    }
}
export default InternalReferenceController;