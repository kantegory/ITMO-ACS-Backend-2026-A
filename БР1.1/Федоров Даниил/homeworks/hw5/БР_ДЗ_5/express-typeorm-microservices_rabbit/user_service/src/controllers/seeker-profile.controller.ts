import {
    Body,
    ForbiddenError,
    Get,
    HttpError,
    NotFoundError,
    Param,
    Patch,
    Req,
    UseBefore,
} from 'routing-controllers';
import {
    ArrayUnique,
    IsArray,
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import allowRoles from '../middlewares/role.middleware';

import { UserRole } from '../models/enums';
import { User } from '../models/user.entity';
import { Seeker } from '../models/seeker.entity';
import { Resume } from '../models/resume.entity';
import { Education } from '../models/education.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { ResumeSkill } from '../models/resume-skill.entity';

import SETTINGS from '../config/settings';

import {
    serializeResume,
    serializeSeekerProfile,
} from '../views/serializers';

interface ResolvedSkill {
    skill_id: number;
    name: string;
}

interface ReferenceResolveResponse {
    experiences: unknown[];
    industries: unknown[];
    skills: ResolvedSkill[];
}


class UpdateSeekerProfileDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    surname?: string;

    @IsOptional()
    @IsString()
    middle_name?: string;

    @IsOptional()
    @IsString()
    birth_date?: string;

    @IsOptional()
    @IsString()
    city?: string;
}

class EducationInputDto {
    @IsString()
    institution: string;

    @IsOptional()
    @IsString()
    degree?: string;

    @IsString()
    field_of_study: string;

    @IsString()
    start_date: string;

    @IsOptional()
    @IsString()
    end_date?: string;
}

class ResumeExperienceInputDto {
    @IsString()
    company_name: string;

    @IsString()
    position: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    start_date: string;

    @IsOptional()
    @IsString()
    end_date?: string;
}

class UpdateResumeDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    about_me?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EducationInputDto)
    educations?: EducationInputDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ResumeExperienceInputDto)
    experiences?: ResumeExperienceInputDto[];

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    skill_ids?: number[];
}

@EntityController({
    baseRoute: '/seekers',
    entity: Seeker,
})

class SeekerProfileController extends BaseController {
    private userRepository = dataSource.getRepository(User);
    private seekerRepository = dataSource.getRepository(Seeker);
    private resumeRepository = dataSource.getRepository(Resume);
    private educationRepository = dataSource.getRepository(Education);
    private resumeExperienceRepository = dataSource.getRepository(ResumeExperience);
    private resumeSkillRepository = dataSource.getRepository(ResumeSkill);

    private ensureOwner(request: RequestWithUser, userId: number) {
        if (request.user.userId !== userId) {
            throw new ForbiddenError('Нет доступа к чужому профилю');
        }
    }

    private async resolveSkills(skillIds: number[]): Promise<ResolvedSkill[]> {
        if (skillIds.length === 0) {
            return [];
        }

        let response: Response;
        try {
            response = await fetch(`${SETTINGS.REFERENCE_SERVICE_URL}/internal/reference/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Token': SETTINGS.INTERNAL_SERVICE_TOKEN,
                },
                body: JSON.stringify({ skill_ids: skillIds }),
            },);
        } catch (error) {
            throw new HttpError(503, 'Reference Service недоступен');
        }

        if (response.status === 400){
            throw new NotFoundError('Один или несколько skill_id не найдены');
        }

        if (!response.ok) {
            throw new HttpError(503, 'Ошибка при обращении к Reference Service');
        }
        const data = await response.json() as ReferenceResolveResponse;

        return data.skills;
    }

    private async getSeekerWithResumeByUserId(userId: number) {
        return this.seekerRepository.findOne({
            where:{
                user: {
                    userId: userId,
                },
            },
            relations: {
                user: true,
                resumes: {
                    seeker: true,
                    educations: true,
                    experiences: true,
                    resumeSkills: true,
                },
            },
        });
    }

    @Get('/:userId/profile')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async getProfile(@Param ('userId') userId: number, @Req() request: RequestWithUser) {
        this.ensureOwner(request, Number(userId));

        const seeker = await this.getSeekerWithResumeByUserId(Number(userId));

        if (!seeker) {
            throw new NotFoundError('Профиль соискателя не найден');
        }

        const resume = seeker.resumes?.[0];

        const skillIds = resume?.resumeSkills?.map((resumeSkill) => resumeSkill.skillId) || [];
        const skills = await this.resolveSkills(skillIds);

        return serializeSeekerProfile(seeker, skills);
    }

    @Patch('/:userId/profile')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async updateProfile(
        @Param('userId') userId: number,
        @Body() body: UpdateSeekerProfileDto,
        @Req() request: RequestWithUser,
    ) {
        this.ensureOwner(request, Number(userId));

        const seeker = await this.seekerRepository.findOne({
            where: {
                user: {
                    userId: Number(userId),
                },
            },
            relations: {
                user: true,
            },
        });

        if (!seeker) {
            throw new NotFoundError('Профиль соискателя не найден');
        }

        if (body.email !== undefined && body.email !== seeker.user.email) {
            const userWithSameEmail = await this.userRepository.findOne({
                where: { email: body.email },
            });

            if (userWithSameEmail) {
                throw new HttpError(409, 'Пользователь с таким email уже существует');
            }

            seeker.user.email = body.email;

        }

        if (body.phone !== undefined) {
            seeker.user.phone = body.phone;
        }

        if (body.first_name !== undefined) {
            seeker.firstName = body.first_name;
        }

        if (body.surname !== undefined) {
            seeker.surname = body.surname;
        }

        if (body.middle_name !== undefined) {
            seeker.middleName = body.middle_name;
        }

        if (body.birth_date !== undefined) {
            seeker.birthDate = body.birth_date;
        }

        if (body.city !== undefined) {
            seeker.city = body.city;
        }

        await this.userRepository.save(seeker.user);
        await this.seekerRepository.save(seeker);

        const updatedSeeker = await this.getSeekerWithResumeByUserId(Number(userId));

        if (!updatedSeeker) {
            throw new NotFoundError('Профиль соискателя не найден');
        }


        const resume = updatedSeeker.resumes?.[0];
        const skillIds = resume?.resumeSkills?.map((resumeSkill) => resumeSkill.skillId) || [];
        const skills = await this.resolveSkills(skillIds);

        return serializeSeekerProfile(updatedSeeker, skills);
    }

    @Get ('/:userId/resume')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async getResume(@Param('userId') userId: number, @Req() request: RequestWithUser) {

        this.ensureOwner(request, Number(userId));

        const seeker = await this.getSeekerWithResumeByUserId(Number(userId));

        if (!seeker || !seeker.resumes?.length) {
            throw new NotFoundError('Резюме не найдено');
        }

        const resume = seeker.resumes[0];
        const skillIds = resume.resumeSkills?.map((resumeSkill) => resumeSkill.skillId) || [];
        const skills = await this.resolveSkills(skillIds);

        return serializeResume(resume, skills);
    }

    @Patch('/:userId/resume')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async updateResume(
        @Param('userId') userId: number,
        @Body() body: UpdateResumeDto,
        @Req() request: RequestWithUser,
    ) {
        this.ensureOwner(request, Number(userId));

        const seeker = await this.seekerRepository.findOne({
            where: {
                user: {
                    userId: Number(userId),
                },
            },
            relations: {
                user: true,
            },
        });

        if(!seeker) {
            throw new NotFoundError('Cоискателm не найден');
        }

        const resume = await this.resumeRepository.findOne({
            where: {
                seeker: {
                    profileId: seeker.profileId,
                },
            },
            relations: {
                seeker: true,
                educations: true,
                experiences: true,
                resumeSkills: true,
            },
        });

        if (!resume) {
            throw new NotFoundError('Резюме не найдено');
        }

        if (body.title !== undefined) {
            resume.title = body.title;
        }

        if (body.about_me !== undefined) {
            resume.aboutMe = body.about_me;
        }

        await this.resumeRepository.save(resume);

        if (body.educations !== undefined) {
            await this.educationRepository
                .createQueryBuilder()
                .delete()
                .from(Education)
                .where('resume_id = :resumeId', {
                    resumeId: resume.resumeId,
                })
                .execute();

            const newEducations = body.educations.map((education) =>
                this.educationRepository.create({
                    resume: resume,
                    institution: education.institution,
                    degree: education.degree || null,
                    fieldOfStudy: education.field_of_study,
                    startDate: education.start_date,
                    endDate: education.end_date || null,
                }),
            );
            await this.educationRepository.save(newEducations);
        }

        if (body.experiences !== undefined) {
            await this.resumeExperienceRepository
                .createQueryBuilder()
                .delete()
                .from(ResumeExperience)
                .where('resume_id = :resumeId', {
                    resumeId: resume.resumeId,
                })
                .execute();

            const newExperiences = body.experiences.map((experience) =>
                this.resumeExperienceRepository.create({
                    resume: resume,
                    companyName: experience.company_name,
                    position: experience.position,
                    description: experience.description || '',
                    startDate: experience.start_date,
                    endDate: experience.end_date || null,
                }),
            );

            await this.resumeExperienceRepository.save(newExperiences);
        }

        if (body.skill_ids !== undefined) {
            //Проверяем ID через Reference Service
            if (body.skill_ids.length > 0) {
                await this.resolveSkills(body.skill_ids);
            }

            //Удаляем старые связи
            await this.resumeSkillRepository
                .createQueryBuilder()
                .delete()
                .from(ResumeSkill)
                .where('resume_id = :resumeId', {
                    resumeId: resume.resumeId,
                })
                .execute();

            //Создаем новые связи только с ID
            const newResumeSkills = body.skill_ids.map((skillId) =>
                this.resumeSkillRepository.create({
                    resume: resume,
                    skillId: skillId,
                }),
            );

            await this.resumeSkillRepository.save(newResumeSkills);
        }
        
        const updatedResume = await this.resumeRepository.findOne({
            where: {
                resumeId: resume.resumeId,
            },
            relations: {
                seeker: true,
                educations: true,
                experiences: true,
                resumeSkills: true,
            },
        });

        const skillIds = updatedResume?.resumeSkills?.map((resumeSkill) => resumeSkill.skillId) || [];
        const skills = await this.resolveSkills(skillIds);

        if (!updatedResume) {
            throw new NotFoundError('Резюме не найдено');
        }

        return serializeResume(updatedResume, skills);
    }
}

export default SeekerProfileController;